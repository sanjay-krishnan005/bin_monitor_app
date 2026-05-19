import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TechnicianTasksPage() {
  const supabase = await createClient();

  const { data: bins } = await supabase
    .from("bins")
    .select("id, device_id, status, location_name, latest_fill_level, camera_status, sensor_health")
    .in("status", ["maintenance", "offline"])
    .order("device_id");

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, message, alert_type, severity, bins(device_id, id)")
    .is("resolved_at", null)
    .in("alert_type", ["sensor_failure", "camera_failure", "offline", "low_battery"])
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Technician tasks</h1>
        <p className="text-muted-foreground">Bins requiring field attention</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Bins needing service</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(bins ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">No bins in maintenance or offline status</p>
          ) : (
            bins?.map((b) => (
              <div key={b.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">{b.device_id}</p>
                  <p className="text-sm text-muted-foreground">{b.location_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{b.status}</Badge>
                  <Button size="sm" asChild><Link href={`/bins/${b.id}`}>Inspect</Link></Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Priority alerts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(alerts ?? []).map((a) => (
            <div key={a.id} className="text-sm border-b pb-2">
              <Badge variant="warning" className="mb-1">{a.alert_type}</Badge>
              <p>{a.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
