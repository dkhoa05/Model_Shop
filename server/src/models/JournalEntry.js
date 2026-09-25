import mongoose from "mongoose";

const journalLineSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    debit: { type: Number, min: 0, default: 0 },
    credit: { type: Number, min: 0, default: 0 },
    memo: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const journalEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    refType: { type: String, trim: true, default: "" },
    refId: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    lines: { type: [journalLineSchema], default: [] },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

journalEntrySchema.index({ date: -1 });
/** Mỗi chứng từ nguồn chỉ có một bút toán cho mỗi loại (chống ghi sổ trùng) */
journalEntrySchema.index(
  { refType: 1, refId: 1 },
  { unique: true, partialFilterExpression: { refType: { $gt: "" }, refId: { $gt: "" } } }
);

export const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
