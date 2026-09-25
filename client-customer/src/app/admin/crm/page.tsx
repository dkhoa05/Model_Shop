"use client";

import AdminShell from "@/components/AdminShell";
import MetricCard from "@/components/MetricCard";
import { crmLeads } from "@/lib/erp";
import { formatVND } from "@/utils/currency";
import { Target, TrendingUp, Users } from "lucide-react";

const stageLabels = {
  new: "Mới",
  qualified: "Đã qualify",
  proposal: "Báo giá",
  won: "Thắng",
  lost: "Thua"
};

export default function AdminCrmPage() {
  const pipeline = crmLeads.reduce((sum, lead) => sum + lead.expectedRevenue, 0);
  const weighted = crmLeads.reduce((sum, lead) => sum + lead.expectedRevenue * (lead.probability / 100), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <Header title="CRM Pipeline" desc="Quản lý lead, cơ hội bán hàng, nguồn khách và bước chăm sóc tiếp theo." />
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Pipeline" value={formatVND(pipeline)} icon={TrendingUp} tone="text-cyan-300" />
          <MetricCard label="Weighted revenue" value={formatVND(weighted)} icon={Target} tone="text-emerald-300" />
          <MetricCard label="Leads" value={String(crmLeads.length)} icon={Users} tone="text-red-300" />
        </section>
        <section className="grid gap-4 xl:grid-cols-3">
          {crmLeads.map((lead) => (
            <article key={lead.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-red-400">{lead.id}</p>
                <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-200">{stageLabels[lead.stage]}</span>
              </div>
              <h2 className="mt-3 font-space-grotesk text-xl font-black text-white">{lead.customer}</h2>
              <p className="mt-2 text-sm text-zinc-400">{lead.interest}</p>
              <div className="mt-4 grid gap-2 text-sm text-zinc-400">
                <p><span className="font-bold text-zinc-200">Nguồn:</span> {lead.channel}</p>
                <p><span className="font-bold text-zinc-200">Owner:</span> {lead.owner}</p>
                <p><span className="font-bold text-zinc-200">Next:</span> {lead.nextAction}</p>
              </div>
              <p className="mt-5 text-2xl font-black text-white">{formatVND(lead.expectedRevenue)}</p>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Admin</p>
      <h1 className="mt-3 font-space-grotesk text-4xl font-black uppercase text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{desc}</p>
    </div>
  );
}
