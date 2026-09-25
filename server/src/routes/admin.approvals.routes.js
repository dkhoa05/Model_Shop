import express from "express";
import { auth, isAdmin, isBackoffice, isFinance } from "../middlewares/auth.js";
import { User } from "../models/User.js";
import { ApprovalRequest } from "../models/ApprovalRequest.js";
import { Coupon } from "../models/Coupon.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { Order } from "../models/Order.js";
import { validateObjectId } from "../utils/validate.js";

const router = express.Router();
router.param("id", validateObjectId);

function deriveRequiredApprovals(type, payload = {}) {
  const amount = Number(payload.amount || payload.totalAmount || 0);
  if (type === "purchase" && amount >= 20000000) return 2;
  if (type === "refund" && amount >= 5000000) return 2;
  if (type === "discount" && amount >= 2000000) return 2;
  return 1;
}

router.get("/approvals", auth, isBackoffice, async (req, res) => {
  try {
    const approvals = await ApprovalRequest.find()
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .populate("approvalSteps.approver", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(approvals);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/approvals", auth, isBackoffice, async (req, res) => {
  try {
    const body = req.body || {};
    const TYPES = ["discount", "refund", "purchase", "inventory_adjustment", "custom"];
    const type = TYPES.includes(body.type) ? body.type : "custom";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    if (!title) return res.status(400).json({ message: "Title is required" });
    const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload : {};
    // Chỉ whitelist field; status/steps/requiredApprovals luôn do server quyết định
    const approval = await ApprovalRequest.create({
      type,
      title,
      payload,
      requiredApprovals: deriveRequiredApprovals(type, payload),
      requestedBy: req.user._id
    });
    return res.status(201).json(approval);
  } catch (error) {
    return res.status(400).json({ message: "Invalid approval payload" });
  }
});

router.post("/approvals/:id/decide", auth, isFinance, async (req, res) => {
  try {
    const { status, decisionNote } = req.body || {};
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid decision status" });
    }
    const approval = await ApprovalRequest.findById(req.params.id);
    if (!approval) return res.status(404).json({ message: "Approval request not found" });
    if (approval.status !== "pending") return res.status(400).json({ message: "Approval request already decided" });
    // Người tạo yêu cầu không được tự duyệt (trừ khi hệ thống chỉ còn 1 admin hoạt động)
    if (approval.requestedBy && String(approval.requestedBy) === String(req.user?._id)) {
      const otherAdmins = await User.countDocuments({
        role: "admin",
        isBlocked: { $ne: true },
        _id: { $ne: req.user._id }
      });
      if (otherAdmins > 0) {
        return res.status(400).json({ message: "Requester cannot approve their own request" });
      }
    }

    const alreadyDecided = approval.approvalSteps.some((step) => String(step.approver) === String(req.user?._id));
    if (alreadyDecided) {
      return res.status(400).json({ message: "You already decided this request" });
    }

    approval.approvalSteps.push({
      approver: req.user?._id,
      status,
      note: decisionNote || "",
      at: new Date()
    });

    if (status === "rejected") {
      approval.status = "rejected";
      approval.approvedBy = req.user?._id || null;
      approval.decisionNote = decisionNote || "";
      approval.decidedAt = new Date();
      await approval.save();
      await applyApprovalOutcome(approval);
      return res.json(approval);
    }

    const approvedCount = approval.approvalSteps.filter((step) => step.status === "approved").length;
    if (approvedCount >= Number(approval.requiredApprovals || 1)) {
      approval.status = "approved";
      approval.approvedBy = req.user?._id || null;
      approval.decisionNote = decisionNote || "";
      approval.decidedAt = new Date();
    }

    await approval.save();
    if (approval.status !== "pending") {
      await applyApprovalOutcome(approval);
    }
    return res.json(approval);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

async function applyApprovalOutcome(approval) {
  const approvalId = approval._id;
  if (approval.type === "discount") {
    const couponId = approval.payload?.couponId;
    const target = couponId
      ? await Coupon.findById(couponId)
      : await Coupon.findOne({ approvalRequest: approvalId });
    if (target) {
      if (approval.status === "approved") {
        target.active = true;
        target.requiresApproval = false;
      } else if (approval.status === "rejected") {
        target.active = false;
      }
      await target.save();
    }
  }

  if (approval.type === "purchase") {
    const poId = approval.payload?.purchaseOrderId;
    const target = poId
      ? await PurchaseOrder.findById(poId)
      : await PurchaseOrder.findOne({ approvalRequest: approvalId });
    if (target && approval.status === "rejected") {
      target.status = "cancelled";
      await target.save();
    }
  }

  if (approval.type === "refund") {
    const orderId = approval.payload?.orderId;
    const target = orderId
      ? await Order.findById(orderId)
      : await Order.findOne({ refundApprovalRequest: approvalId });
    if (target) {
      if (approval.status === "approved") target.refundStatus = "approved";
      if (approval.status === "rejected") {
        target.refundStatus = "none";
        target.refundApprovalRequest = null;
      }
      await target.save();
    }
  }
}

export default router;
