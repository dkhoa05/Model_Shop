import express from "express";
import { auth, isAdmin, isStaff } from "../middlewares/auth.js";
import { Product } from "../models/Product.js";
import { Supplier } from "../models/Supplier.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { InventoryMovement } from "../models/InventoryMovement.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";
import { validateObjectId } from "../utils/validate.js";

const router = express.Router();
router.param("id", validateObjectId);
const PURCHASE_APPROVAL_THRESHOLD = 20000000;

function calcTotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);
}

function makePoCode() {
  const stamp = Date.now().toString().slice(-8);
  return `PO-${stamp}`;
}

router.get("/purchase-orders", auth, isStaff, async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate("supplier", "name")
      .populate("items.product", "name stock")
      .populate("approvalRequest", "status requiredApprovals approvalSteps")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(purchaseOrders);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/purchase-orders", auth, isStaff, async (req, res) => {
  try {
    const { supplier, items, expectedDate, note } = req.body || {};
    if (!supplier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "supplier and items are required" });
    }
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) return res.status(404).json({ message: "Supplier not found" });

    const normalizedItems = [];
    for (const row of items) {
      const quantity = Number(row.quantity || 0);
      const unitCost = Number(row.unitCost || 0);
      if (!row.product || quantity < 1 || unitCost < 0) {
        return res.status(400).json({ message: "Invalid purchase order item" });
      }
      const product = await Product.findById(row.product);
      if (!product) return res.status(404).json({ message: "Product not found in purchase order items" });
      normalizedItems.push({ product: product._id, quantity, unitCost });
    }

    const totalAmount = calcTotal(normalizedItems);
    const requiresApproval = totalAmount >= PURCHASE_APPROVAL_THRESHOLD;

    const purchaseOrder = await PurchaseOrder.create({
      code: makePoCode(),
      supplier: supplierDoc._id,
      items: normalizedItems,
      expectedDate: expectedDate || null,
      note: note || "",
      status: "ordered",
      requiresApproval,
      approvalRequest: null,
      totalAmount,
      createdBy: req.user?._id || null
    });
    if (requiresApproval) {
      const approval = await ApprovalRequest.create({
        type: "purchase",
        title: `Approve purchase order ${purchaseOrder.code}`,
        payload: {
          purchaseOrderId: String(purchaseOrder._id),
          supplierName: supplierDoc.name,
          totalAmount
        },
        requiredApprovals: 2,
        requestedBy: req.user?._id || null
      });
      purchaseOrder.approvalRequest = approval._id;
      await purchaseOrder.save();
    }

    return res.status(201).json(purchaseOrder);
  } catch (error) {
    return res.status(400).json({ message: "Invalid purchase order payload" });
  }
});

router.put("/purchase-orders/:id", auth, isStaff, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (Array.isArray(payload.items)) {
      payload.totalAmount = calcTotal(payload.items);
    }
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    return res.json(po);
  } catch (error) {
    return res.status(400).json({ message: "Invalid purchase order payload" });
  }
});

router.post("/purchase-orders/:id/receive", auth, isStaff, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    if (po.status === "received") {
      return res.status(400).json({ message: "Purchase order already received" });
    }
    if (po.status === "cancelled") {
      return res.status(400).json({ message: "Purchase order cancelled" });
    }
    if (po.requiresApproval) {
      if (!po.approvalRequest) {
        return res.status(400).json({ message: "Approval request missing for this purchase order" });
      }
      const approval = await ApprovalRequest.findById(po.approvalRequest);
      if (!approval || approval.status !== "approved") {
        return res.status(400).json({ message: "Purchase order requires approved approval request before receive" });
      }
    }

    // Đổi trạng thái nguyên tử trước (chặn nhận hàng 2 lần khi bấm đúp / request đồng thời)
    const claimed = await PurchaseOrder.findOneAndUpdate(
      { _id: po._id, status: { $nin: ["received", "cancelled"] } },
      { $set: { status: "received", receivedDate: new Date() } },
      { new: true }
    );
    if (!claimed) return res.status(409).json({ message: "Purchase order already processed" });

    for (const item of po.items) {
      const qty = Number(item.quantity || 0);
      if (!(qty > 0)) continue;
      const product = await Product.findByIdAndUpdate(item.product, { $inc: { stock: qty } });
      if (!product) continue;
      await InventoryMovement.create({
        product: product._id,
        type: "in",
        quantity: qty,
        reason: "purchase",
        note: `Receive ${po.code}`,
        refType: "purchase_order",
        refId: String(po._id),
        createdBy: req.user?._id || null
      });
    }

    return res.json(claimed);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
