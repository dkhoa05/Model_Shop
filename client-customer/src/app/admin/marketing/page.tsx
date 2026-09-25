"use client";

import { Megaphone, TrendingUp, Wallet } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import MetricCard from "@/components/MetricCard";
import { marketingCampaigns } from "@/lib/erp";
import { formatVND } from "@/utils/currency";

export default function MarketingPage() {
  const budget = marketingCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const revenue = marketingCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const roas = budget > 0 ? (revenue / budget).toFixed(1) : "0";

  return (
    <AdminShell>
      <section className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Marketing</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-white">Chiến dịch bán hàng</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Theo dõi ngân sách, doanh thu quy đổi và hiệu quả chiến dịch cho các đợt mở bán, pre-order và combo collector.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Chiến dịch" value={String(marketingCampaigns.length)} icon={Megaphone} tone="text-red-300" />
          <MetricCard label="Ngân sách" value={formatVND(budget)} icon={Wallet} tone="text-cyan-300" />
          <MetricCard label="ROAS" value={`${roas}x`} icon={TrendingUp} tone="text-cyan-300" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {marketingCampaigns.map((campaign) => {
            const campaignRoas = campaign.budget > 0 ? (campaign.revenue / campaign.budget).toFixed(1) : "0";
            return (
              <article key={campaign.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{campaign.id}</p>
                    <h2 className="mt-2 text-xl font-black text-white">{campaign.name}</h2>
                    <p className="mt-1 text-sm text-zinc-400">{campaign.channel}</p>
                  </div>
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black uppercase text-red-200">
                    {campaign.status}
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-zinc-950/70 p-4">
                    <p className="text-xs uppercase text-zinc-500">Budget</p>
                    <p className="mt-2 font-black text-white">{formatVND(campaign.budget)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-4">
                    <p className="text-xs uppercase text-zinc-500">Revenue</p>
                    <p className="mt-2 font-black text-red-300">{formatVND(campaign.revenue)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-4">
                    <p className="text-xs uppercase text-zinc-500">ROAS</p>
                    <p className="mt-2 font-black text-cyan-200">{campaignRoas}x</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
