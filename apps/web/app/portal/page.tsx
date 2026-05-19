import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BinMap, type BinMapMarker } from "@/components/maps/bin-map";
import { formatPercent } from "@/lib/utils";

export default async function PortalPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "customer") redirect("/dashboard");

  const supabase = await createClient();
  const { data: bins } = await supabase
    .from("bins")
    .select("id, device_id, latitude, longitude, status, latest_fill_level, location_name")
    .order("device_id");

  const { count: alertCount } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bins</h1>
        <p className="text-muted-foreground">Welcome, {profile.full_name ?? profile.email}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Assigned bins</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{bins?.length ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active alerts</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{alertCount ?? 0}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Your bins on map</CardTitle></CardHeader>
        <CardContent>
          <BinMap markers={(bins ?? []) as BinMapMarker[]} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(bins ?? []).map((bin) => (
          <Link key={bin.id} href={`/bins/${bin.id}`}>
            <Card className="hover:border-sortyx cursor-pointer">
              <CardHeader className="pb-2 flex flex-row justify-between">
                <CardTitle>{bin.device_id}</CardTitle>
                <Badge variant={bin.status === "active" ? "success" : "destructive"}>{bin.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{bin.location_name}</p>
                <p className="mt-1">Fill: {formatPercent(bin.latest_fill_level)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
