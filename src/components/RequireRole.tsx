import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ServerRole } from "@/types/faculty";

export default function RequireRole({ roles, children }: { roles: ServerRole[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1a237e] border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!roles.includes(user.role)) {
    if (user.role === "admin" && location.pathname.startsWith("/faculty")) {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "student" && location.pathname.startsWith("/faculty")) {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to={user.role === "student" ? "/student" : "/"} replace />;
  }

  return <>{children}</>;
}