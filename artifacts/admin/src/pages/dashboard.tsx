import { useState, useRef } from "react";
import { useStats } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, HeartHandshake, CheckCircle2, Activity, Upload, Smartphone, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const categoryColors: Record<string, string> = {
  "भोजन (food)": "hsl(var(--chart-1))",
  "चिकित्सा (medical)": "hsl(var(--chart-2))",
  "रोजगार (job)": "hsl(var(--chart-3))",
  "पशु (animal)": "hsl(var(--chart-4))",
  "शिक्षा (education)": "hsl(var(--chart-5))",
};

function ApkManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const session = JSON.parse(localStorage.getItem("adminSession") || "{}");

  const { data: status, isLoading } = useQuery({
    queryKey: ["apk-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/apk-status");
      return res.json() as Promise<{ exists: boolean; size?: number; updated?: string }>;
    },
  });

  const { mutate: deleteApk, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/delete-apk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      return data;
    },
    onSuccess: () => {
      setMessage("🗑️ APK delete ho gaya!");
      queryClient.invalidateQueries({ queryKey: ["apk-status"] });
    },
    onError: (err: any) => setMessage(`❌ Error: ${err.message}`),
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadApk(file: File) {
    setIsUploading(true);
    setUploadProgress(0);
    setMessage("");
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("apk", file);
        formData.append("userId", session.userId ?? "");

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error ?? "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", "/api/admin/upload-apk");
        xhr.send(formData);
      });

      setUploadProgress(100);
      setMessage("✅ APK successfully upload ho gaya!");
      queryClient.invalidateQueries({ queryKey: ["apk-status"] });
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadApk(file);
    e.target.value = "";
  }

  const sizeInMB = status?.size ? (Number(status.size) / 1024 / 1024).toFixed(1) : null;
  const updatedDate = status?.updated ? new Date(status.updated).toLocaleString("hi-IN") : null;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          APK Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : status?.exists ? (
          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <p className="font-medium text-green-600">✅ APK Available for Download</p>
            {sizeInMB && <p className="text-muted-foreground">Size: {sizeInMB} MB</p>}
            {updatedDate && <p className="text-muted-foreground">Last Updated: {updatedDate}</p>}
            <a
              href="/api/download/sahara-app"
              className="text-primary underline text-xs"
              target="_blank"
            >
              Download Link: /api/download/sahara-app
            </a>
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            ⚠️ Koi APK upload nahi hua abhi. Naya APK upload karein.
          </div>
        )}

        {isUploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Upload ho raha hai...</span>
              <span className="font-semibold text-primary">{uploadProgress}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {message && !isUploading && (
          <p className="text-sm font-medium">{message}</p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".apk"
          className="hidden"
          onChange={handleFile}
        />

        <div className="flex gap-2">
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="flex-1"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? `Uploading... ${uploadProgress}%` : status?.exists ? "Naya APK Upload Karein" : "APK Upload Karein"}
          </Button>

          {status?.exists && (
            <Button
              variant="destructive"
              disabled={isDeleting || isUploading}
              onClick={() => {
                if (confirm("Kya aap sach mein APK delete karna chahte hain?")) {
                  deleteApk();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? "Delete ho raha..." : "Delete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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

      <ApkManager />
    </div>
  );
}
