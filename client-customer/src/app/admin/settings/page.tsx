"use client";

import { Bot, CreditCard, Database, Settings, Truck } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { siteConfig } from "@/config/site";

const settingsGroups = [
  {
    title: "Thông tin cửa hàng",
    description: "Tên shop, hotline, email, địa chỉ và cấu hình SEO mặc định.",
    icon: Settings,
    status: "Đã cấu hình"
  },
  {
    title: "Thanh toán",
    description: "COD, chuyển khoản ngân hàng và bước sẵn sàng để nối cổng thanh toán.",
    icon: CreditCard,
    status: "Mock ready"
  },
  {
    title: "Vận chuyển",
    description: "Phí ship, miễn phí vận chuyển theo ngưỡng đơn hàng và trạng thái đóng gói.",
    icon: Truck,
    status: "Mock ready"
  },
  {
    title: "AI tư vấn",
    description: "Widget hỏi đáp gợi ý dòng Gundam, figure, tool kit và chính sách mua hàng.",
    icon: Bot,
    status: "Đã bật"
  },
  {
    title: "Tích hợp ERP",
    description: "Luồng Sales, CRM, Inventory, Purchase, Accounting dùng mock data local để demo.",
    icon: Database,
    status: "Demo mode"
  }
];

export default function SettingsPage() {
  return (
    <AdminShell>
      <section className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Settings</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-white">Cấu hình hệ thống</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Trung tâm cấu hình cho cửa hàng {siteConfig.name}: bán hàng, thanh toán, vận chuyển, AI và module ERP.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {settingsGroups.map((group) => (
            <article key={group.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
                  <group.icon size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-black text-white">{group.title}</h2>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black uppercase text-cyan-200">
                      {group.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{group.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
          <h2 className="text-lg font-black uppercase text-white">Checklist triển khai production</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["Kết nối database thật", "Kết nối payment gateway", "Kết nối đơn vị vận chuyển", "Phân quyền admin/staff", "Đồng bộ tồn kho từ POS", "Cấu hình OpenAI API cho AI assistant"].map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm font-bold text-zinc-200">
                <input type="checkbox" className="h-4 w-4 accent-red-600" />
                {item}
              </label>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
