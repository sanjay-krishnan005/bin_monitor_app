import { getProfile } from "@/lib/auth/get-profile";
import { Sidebar } from "./sidebar";
import { redirect } from "next/navigation";
import { getDefaultRoute } from "@/lib/auth/rbac";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto p-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
