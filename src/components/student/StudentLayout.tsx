import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bus,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/faculty";
import { publicAsset } from "@/lib/publicAsset";
import type { NotificationItem } from "@/types/faculty";

interface NavEntry {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavEntry[] = [
  { label: "Dashboard", path: "/student", icon: LayoutDashboard, end: true },
  { label: "My Transport", path: "/student/transport", icon: Bus },
  { label: "Complaints & Feedback", path: "/student/complaints", icon: MessageSquareWarning },
  { label: "Notifications", path: "/student/notifications", icon: Bell },
];

function pageTitleFor(pathname: string): string {
  const entry = NAV_ITEMS.find(
    (n) => (n.end ? pathname === n.path : pathname.startsWith(n.path))
  );
  return entry?.label ?? "Student Panel";
}

function StudentClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden flex-col items-end text-[10px] font-semibold leading-tight text-muted-foreground md:flex">
      <span>{now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
      <span>{now.toLocaleTimeString()}</span>
    </div>
  );
}

function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1">
          <img src={publicAsset("/dhaanish-badge.png")} alt="Dhaanish Chennai" className="h-9 w-auto" />
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-extrabold leading-tight text-[#1a237e]">DACE Transport</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8860b]">
              Student Panel
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Transport</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <NavLink to={item.path} end={item.end}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8">
            {user?.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.name} /> : null}
            <AvatarFallback className="bg-[#1a237e] text-[10px] font-bold text-white">
              {user ? initials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-bold text-foreground">{user?.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">Student</p>
          </div>
          <button
            type="button"
            title="Log out"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitleFor(location.pathname);

  const { data: notifications } = useQuery({
    queryKey: ["student-notifications"],
    queryFn: () => api.get<{ items: NotificationItem[]; unread: number }>("/notifications"),
    refetchInterval: 60000,
  });
  const unread = notifications?.unread ?? 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold text-foreground sm:text-base">{title}</h1>
            <p className="hidden text-[10px] text-muted-foreground sm:block">DACE Transport • Student Panel</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <StudentClock />
            <button
              type="button"
              onClick={() => navigate("/student/notifications")}
              className="relative rounded-full border border-border bg-white p-2 text-muted-foreground shadow-sm transition hover:-translate-y-[1px]"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1a237e] px-1 text-[9px] font-bold text-[#FFD700]">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full outline-none ring-primary focus-visible:ring-2">
                  <Avatar className="h-8 w-8 border border-border">
                    {user?.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.name} /> : null}
                    <AvatarFallback className="bg-[#1a237e] text-[11px] font-bold text-white">
                      {user ? initials(user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-bold">{user?.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/student/transport")}>
                  <Bus className="h-4 w-4" />
                  My Transport
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
        <footer className="border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
          DACE Transport System — maintained by Nano Spark Team
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}