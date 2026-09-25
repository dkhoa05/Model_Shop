"use client";

import { AlertCircle, Clock, FileText, Wallet } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import MetricCard from "@/components/MetricCard";
import { erpSummary, invoices } from "@/lib/erp";
import { formatVND } from "@/utils/currency";

const statusStyles = {
  draft: "bg-zinc-800 text-zinc-300",
  posted: "bg-cyan-500/15 text-cyan-200",
  paid: "bg-emerald-500/15 text-emerald-200",
  overdue: "bg-red-500/15 text-red-200"
};

const statusLabels = {
  draft: "Nháp",
  posted: "Đã ghi sổ",
  paid: "Đã thanh toán",
  overdue: "Quá hạn"
};

export default function AccountingPage() {
  const summary = erpSummary();
  const overdueCount = invoices.filter((invoice) => invoice.status === "overdue").length;
  const postedCount = invoices.filter((invoice) => invoice.status === "posted").length;

  return (
    <AdminShell>
      <section className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Accounting</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-white">Kế toán & công nợ</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Theo dõi hóa đơn bán hàng, công nợ phải thu và trạng thái thanh toán để đội vận hành nắm dòng tiền mỗi ngày.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Công nợ phải thu" value={formatVND(summary.receivable)} icon={Wallet} tone="text-red-300" />
          <MetricCard label="Hóa đơn đã ghi sổ" value={String(postedCount)} icon={FileText} tone="text-cyan-300" />
          <MetricCard label="Quá hạn" value={String(overdueCount)} icon={AlertCircle} tone="text-red-300" />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-black uppercase text-white">Sổ hóa đơn</h2>
              <p className="mt-1 text-sm text-zinc-400">Mock invoice ledger cho luồng ERP demo.</p>
            </div>
            <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black uppercase text-white transition hover:bg-red-500">
              Tạo hóa đơn
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                <tr>
                  <th className="py-3 pr-4">Mã hóa đơn</th>
                  <th className="py-3 pr-4">Khách hàng</th>
                  <th className="py-3 pr-4">Đến hạn</th>
                  <th className="py-3 pr-4">Trạng thái</th>
                  <th className="py-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="py-4 pr-4 font-black text-white">{invoice.id}</td>
                    <td className="py-4 pr-4">{invoice.customer}</td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <Clock size={14} className="text-zinc-500" />
                        {invoice.dueDate}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[invoice.status]}`}>
                        {statusLabels[invoice.status]}
                      </span>
                    </td>
                    <td className="py-4 text-right font-black text-red-300">{formatVND(invoice.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
