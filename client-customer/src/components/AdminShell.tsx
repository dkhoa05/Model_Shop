"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Building2, Calculator, Megaphone, Package, PackagePlus, Settings, ShoppingBag, Users } from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: BarChart3 },
  { label: "Sales", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "CRM", href: "/admin/crm", icon: Users },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Purchase", href: "/admin/purchase", icon: PackagePlus },
  { label: "Accounting", href: "/admin/accounting", icon: Calculator },
  { label: "Customers", href: "/admin/customers", icon: Building2 },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
  { label: "Settings", href: "/admin/settings", icon: Settings }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 xl:sticky xl:top-24">
        <p className="px-3 text-xs font-black uppercase tracking-[0.24em] text-red-400">ERP Suite</p>
        <nav className="mt-4 grid gap-1">
          {adminNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                  active ? "bg-red-600 text-white" : "text-zinc-300 hover:bg-zinc-950 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
