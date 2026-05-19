import { createClient } from "@/lib/supabase/server";
import { RealtimeDashboard } from "@/components/dashboard/realtime-dashboard";
import type { BinMapMarker } from "@/components/maps/bin-map";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: bins } = await supabase
    .from("bins")
    .select("id, device_id, latitude, longitude, status, latest_fill_level, location_name");

  const fullBins = bins?.filter((b) => (b.latest_fill_level ?? 0) >= 85).length ?? 0;
  const offlineBins = bins?.filter((b) => b.status === "offline").length ?? 0;

  const { count: alertCount } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, alert_type, severity, message, created_at, bins(device_id)")
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: activity } = await supabase
    .from("activity_log")
    .select("id, action, details, created_at, bins(device_id)")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <RealtimeDashboard
      initialBins={(bins ?? []) as BinMapMarker[]}
      initialKpis={{
        totalBins: bins?.length ?? 0,
        fullBins,
        activeAlerts: alertCount ?? 0,
        offlineBins,
      }}
      initialAlerts={alerts ?? []}
      initialActivity={activity ?? []}
    />
  );
}
