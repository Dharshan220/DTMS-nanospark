import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bus,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquareWarning,
  Plus,
  Route,
  Settings,
  ShieldCheck,
  Siren,
  Truck,
  Users,
  UsersRound,
  UserRound,
  Wrench,
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
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";
import type { NotificationItem } from "@/types/faculty";

interface NavEntry {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavEntry[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Dashboard", items: [{ label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true }] },
  {
    label: "Transport",
    items: [
      { label: "Buses", path: "/admin/buses", icon: Bus },
      { label: "Drivers", path: "/admin/drivers", icon: Truck },
      { label: "Routes", path: "/admin/routes", icon: Route },
      { label: "Bus Stops", path: "/admin/bus-stops", icon: MapPin },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", path: "/admin/students", icon: Users },
      { label: "Faculty", path: "/admin/faculty", icon: UserRound },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Live Tracking", path: "/admin/live-tracking", icon: Gauge },
      { label: "Attendance & Passengers", path: "/admin/attendance", icon: ClipboardCheck },
      { label: "Complaints & Feedback", path: "/admin/complaints", icon: MessageSquareWarning },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Emergency / SOS", path: "/admin/emergency", icon: Siren },
      { label: "Schedules", path: "/admin/schedules", icon: Route },
      { label: "Maintenance", path: "/admin/maintenance", icon: Wrench },
      { label: "Notifications", path: "/admin/notifications", icon: Bell },
    ],
  },
  { label: "Reports", items: [{ label: "Analytics & Reports", path: "/admin/reports", icon: Plus }] },
  {
    label: "System",
    items: [
      { label: "Users & Roles", path: "/admin/users", icon: UsersRound },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

function pageTitleFor(pathname: string): string {
  for (const group of NAV_GROUPS) {
    const entry = group.items.find((n) => (n.end ? pathname === n.path : pathname.startsWith(n.path)));
    if (entry) return entry.label;
  }
  if (pathname.startsWith("/admin/complaints")) return "Complaint Details";
  return "Admin Panel";
}

function AdminClock() {
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
              Admin Panel
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
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
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 group-data-[collapsible=icon]:justify-center">
          <div className="relative">
            <Avatar className="h-8 w-8">
              {user?.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.name} /> : null}
              <AvatarFallback className="bg-[#1a237e] text-[10px] font-bold text-white">
                {user ? initials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-bold text-foreground">{user?.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">Super Admin</p>
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitleFor(location.pathname);

  const { data: notifications } = useQuery({
    queryKey: ["admin-notifications"],
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
            <p className="hidden text-[10px] text-muted-foreground sm:block">DACE Transport • Admin Panel</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AdminClock />
            <button
              type="button"
              onClick={() => navigate("/admin/notifications")}
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
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#1a237e]" />
                    {user?.name}
                  </p>
                  <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Settings className="h-4 w-4" />
                  Settings
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
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </div>
        </main>
        <footer className="border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
          DACE Transport System — maintained by Nano Spark Team
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}