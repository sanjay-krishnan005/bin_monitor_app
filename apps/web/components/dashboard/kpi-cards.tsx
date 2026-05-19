import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle, WifiOff, Activity } from "lucide-react";

type KpiData = {
  totalBins: number;
  fullBins: number;
  activeAlerts: number;
  offlineBins: number;
};

export function KpiCards({ data }: { data: KpiData }) {
  const cards = [
    { title: "Total Bins", value: data.totalBins, icon: Trash2, color: "text-sortyx" },
    { title: "Full Bins", value: data.fullBins, icon: Activity, color: "text-amber-600" },
    { title: "Active Alerts", value: data.activeAlerts, icon: AlertTriangle, color: "text-red-600" },
    { title: "Offline", value: data.offlineBins, icon: WifiOff, color: "text-gray-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <Icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
