"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trash2,
  Bell,
  FileText,
  Users,
  Wrench,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth/rbac";
import { ROLE_LABELS } from "@/lib/auth/rbac";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bins", label: "Bins", icon: Trash2 },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

const technicianNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bins", label: "Bins", icon: Trash2 },
  { href: "/technician/tasks", label: "Tasks", icon: Wrench },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

const customerNav = [
  { href: "/portal", label: "My Bins", icon: Trash2 },
  { href: "/portal/alerts", label: "Alerts", icon: Bell },
  { href: "/portal/reports", label: "Reports", icon: FileText },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const nav =
    profile.role === "customer"
      ? customerNav
      : profile.role === "technician"
        ? technicianNav
        : adminNav;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sortyx text-white font-bold">
          S
        </div>
        <div>
          <p className="font-semibold text-sm">Sortyx</p>
          <p className="text-xs text-muted-foreground">Intelligence Platform</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-sm font-medium truncate">{profile.full_name ?? profile.email}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
