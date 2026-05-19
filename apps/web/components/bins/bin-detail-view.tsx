"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
type Compartment = {
  id: string;
  compartment_index: number;
  label: string;
  current_fill_level: number;
  current_weight_kg: number;
  waste_count: number;
  classification: Record<string, number>;
};

type Telemetry = {
  recorded_at: string;
  fill_level: number;
  weight_kg: number;
  battery_percent: number;
};

export function BinDetailView({
  bin,
  compartments: initialCompartments,
  telemetry: initialTelemetry,
}: {
  bin: Record<string, unknown>;
  compartments: Compartment[];
  telemetry: Telemetry[];
}) {
  const [compartments, setCompartments] = useState(initialCompartments);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [binState, setBinState] = useState(bin);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`bin-${bin.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bins", filter: `id=eq.${bin.id}` },
        async () => {
          const { data } = await supabase.from("bins").select("*").eq("id", bin.id as string).single();
          if (data) setBinState(data);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry_events", filter: `bin_id=eq.${bin.id}` },
        async () => {
          const { data: t } = await supabase
            .from("telemetry_events")
            .select("recorded_at, fill_level, weight_kg, battery_percent")
            .eq("bin_id", bin.id as string)
            .order("recorded_at", { ascending: false })
            .limit(48);
          if (t) setTelemetry(t.reverse());
          const { data: c } = await supabase
            .from("bin_compartments")
            .select("*")
            .eq("bin_id", bin.id as string)
            .order("compartment_index");
          if (c) setCompartments(c);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, bin.id]);

  const chartData = telemetry.map((t) => ({
    time: new Date(t.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    fill: t.fill_level,
    weight: t.weight_kg,
  }));

  const b = binState as {
    device_id: string;
    status: string;
    location_name: string;
    latest_fill_level: number;
    latest_battery: number;
    camera_status: string;
    sensor_health: string;
    internet_status: string;
    snapshot_url: string;
    last_seen_at: string;
    bin_type: string;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{b.device_id}</h1>
          <p className="text-muted-foreground">{b.location_name}</p>
        </div>
        <Badge variant={b.status === "active" ? "success" : "destructive"}>{b.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Fill level", value: formatPercent(b.latest_fill_level) },
          { label: "Battery", value: formatPercent(b.latest_battery) },
          { label: "Last seen", value: formatDate(b.last_seen_at) },
          { label: "Type", value: b.bin_type === "two" ? "2-bin" : "4-bin" },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{m.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{m.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fill level history</CardTitle></CardHeader>
          <CardContent className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fill" stroke="#6C2BD9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No telemetry data yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Health monitoring</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Camera", value: b.camera_status },
              { label: "Sensors", value: b.sensor_health },
              { label: "Internet", value: b.internet_status },
            ].map((h) => (
              <div key={h.label} className="flex justify-between items-center">
                <span>{h.label}</span>
                <Badge variant={h.value === "ok" || h.value === "online" ? "success" : "destructive"}>
                  {h.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Compartment breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {compartments.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <p className="font-medium">{c.label}</p>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-sortyx rounded-full"
                    style={{ width: `${c.current_fill_level}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatPercent(c.current_fill_level)} · {c.current_weight_kg} kg · {c.waste_count} items
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {b.snapshot_url && (
        <Card>
          <CardHeader><CardTitle>Camera snapshot</CardTitle></CardHeader>
          <CardContent>
            <img src={b.snapshot_url} alt="Bin snapshot" className="rounded-lg max-h-80 object-cover" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
