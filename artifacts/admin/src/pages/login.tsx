import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "saharaapphelp@gmail.com";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP nahi gaya");
      toast({ title: "OTP Bheja Gaya ✅", description: "saharaapphelp@gmail.com par 6-digit OTP check karein।" });
      setStep("otp");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("adminSession", JSON.stringify({ userId: data.userId, name: data.name, email: data.email }));
      toast({ title: "Welcome back 👋", description: "Sahara Admin mein aapka swagat hai।" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="text-4xl mb-2">🛡️</div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Sahara Admin</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Login karne ke liye OTP mangaiye"
              : `saharaapphelp@gmail.com par aaya 6-digit OTP enter karein`}
          </CardDescription>
        </CardHeader>

        {step === "email" ? (
          <form onSubmit={handleSendOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={ADMIN_EMAIL}
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                OTP sirf <strong>saharaapphelp@gmail.com</strong> par bheja jayega
              </p>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "OTP Bhej raha hoon..." : "OTP Bhejiye →"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                OTP 10 minute mein expire ho jayega।{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => { setStep("email"); setOtp(""); }}
                >
                  Dobara bhejein
                </button>
              </p>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verify ho raha hoon..." : "Login Karein ✅"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

    </div>
  );
}
