"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { KpiCards } from "./kpi-cards";
import { BinMap, type BinMapMarker } from "@/components/maps/bin-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Alert = {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  bins: { device_id: string } | { device_id: string }[] | null;
};

type Activity = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  bins: { device_id: string } | { device_id: string }[] | null;
};

export function RealtimeDashboard({
  initialBins,
  initialKpis,
  initialAlerts,
  initialActivity,
}: {
  initialBins: BinMapMarker[];
  initialKpis: { totalBins: number; fullBins: number; activeAlerts: number; offlineBins: number };
  initialAlerts: Alert[];
  initialActivity: Activity[];
}) {
  const [bins, setBins] = useState(initialBins);
  const [kpis, setKpis] = useState(initialKpis);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [activity, setActivity] = useState(initialActivity);
  const supabase = createClient();

  const refreshData = useCallback(async () => {
    const { data: binData } = await supabase.from("bins").select("id, device_id, latitude, longitude, status, latest_fill_level, location_name");
    if (binData) setBins(binData as BinMapMarker[]);

    const full = binData?.filter((b) => (b.latest_fill_level ?? 0) >= 85).length ?? 0;
    const offline = binData?.filter((b) => b.status === "offline").length ?? 0;

    const { count: alertCount } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null);

    setKpis({
      totalBins: binData?.length ?? 0,
      fullBins: full,
      activeAlerts: alertCount ?? 0,
      offlineBins: offline,
    });

    const { data: alertData } = await supabase
      .from("alerts")
      .select("id, alert_type, severity, message, created_at, bins(device_id)")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (alertData) setAlerts(alertData as unknown as Alert[]);

    const { data: actData } = await supabase
      .from("activity_log")
      .select("id, action, details, created_at, bins(device_id)")
      .order("created_at", { ascending: false })
      .limit(8);
    if (actData) setActivity(actData as unknown as Activity[]);
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bins" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => refreshData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "telemetry_events" }, () => refreshData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => refreshData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of your smart waste bins</p>
      </div>
      <KpiCards data={kpis} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live map</CardTitle>
          </CardHeader>
          <CardContent>
            <BinMap markers={bins} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alert center</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/alerts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={a.severity === "critical" ? "destructive" : "warning"}>
                      {a.alert_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p>{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(a.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                <span>
                  <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                  {(Array.isArray(a.bins) ? a.bins[0]?.device_id : a.bins?.device_id) && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {Array.isArray(a.bins) ? a.bins[0]?.device_id : a.bins?.device_id}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
