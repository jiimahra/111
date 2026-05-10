import { useStats } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, HeartHandshake, CheckCircle2, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const categoryColors: Record<string, string> = {
  "भोजन (food)": "hsl(var(--chart-1))",
  "चिकित्सा (medical)": "hsl(var(--chart-2))",
  "रोजगार (job)": "hsl(var(--chart-3))",
  "पशु (animal)": "hsl(var(--chart-4))",
  "शिक्षा (education)": "hsl(var(--chart-5))",
};

export default function Dashboard() {
  const { data: stats, isLoading, error } = useStats();

  if (error) {
    return <div className="text-destructive">Failed to load stats.</div>;
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full mt-6" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, change: `+${stats.newUsersThisWeek} this week`, icon: Users },
    { title: "Total Requests", value: stats.totalRequests, change: `+${stats.newRequestsThisWeek} this week`, icon: HeartHandshake },
    { title: "Active Requests", value: stats.activeRequests, change: "Awaiting help", icon: Activity },
    { title: "Resolved Requests", value: stats.resolvedRequests, change: "Successfully helped", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time statistics for Sahara community platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Requests by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Top Locations needing help</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {stats.topLocations.map((loc, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-12 text-sm font-medium text-muted-foreground">{i + 1}.</div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">{loc.location}</div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(loc.count / stats.topLocations[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium">{loc.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
