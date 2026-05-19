import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/auth/get-profile";
import { canManageBins } from "@/lib/auth/rbac";
import { formatPercent } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function BinsPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: bins } = await supabase
    .from("bins")
    .select("*, customers(name)")
    .order("device_id");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bins</h1>
          <p className="text-muted-foreground">Manage smart waste bin deployments</p>
        </div>
        {canManageBins(profile?.role) && (
          <Button asChild>
            <Link href="/bins/new">
              <Plus className="mr-2 h-4 w-4" />
              Add bin
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(bins ?? []).map((bin) => (
          <Link key={bin.id} href={`/bins/${bin.id}`}>
            <Card className="hover:border-sortyx transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{bin.device_id}</CardTitle>
                  <Badge
                    variant={
                      bin.status === "active"
                        ? "success"
                        : bin.status === "offline"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {bin.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="text-muted-foreground">{bin.location_name ?? "No location"}</p>
                <p>Type: {bin.bin_type === "two" ? "2-bin" : "4-bin"} · Serial: {bin.serial_number}</p>
                <p>Fill: {formatPercent(bin.latest_fill_level)}</p>
                {bin.customers && (
                  <p>Customer: {(bin.customers as { name: string }).name}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
