import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminSession, logoutAdmin } from "@/hooks/use-admin";
import { LogOut, LayoutDashboard, Users, HeartHandshake, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const session = useAdminSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return <>{children}</>;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Users", icon: Users },
    { href: "/requests", label: "Requests", icon: HeartHandshake },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const active = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="font-bold text-lg text-primary">Sahara Admin</div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] bg-sidebar border-r p-0">
            <div className="p-6">
              <div className="font-bold text-2xl text-primary mb-8">Sahara Admin</div>
              <nav className="flex flex-col gap-2">
                <NavLinks />
              </nav>
            </div>
            <div className="absolute bottom-4 left-0 right-0 p-4">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logoutAdmin}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r flex-shrink-0">
        <div className="p-6">
          <div className="font-bold text-2xl text-primary mb-8 tracking-tight">Sahara</div>
          <nav className="flex flex-col gap-2">
            <NavLinks />
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-border/50">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium leading-none">{session.name}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{session.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logoutAdmin}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
