import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function adminHomeUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/admin`;
}

/**
 * Catches unexpected render errors inside the Admin panel so the user never
 * sees a blank white page. Detailed errors stay in the console for development.
 */
export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Admin panel render error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <Card className="w-full max-w-md border-red-200 shadow-card">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <p className="text-base font-extrabold text-foreground">Something went wrong while loading this page.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Please go back to the dashboard and try again. The error has been logged for the development team.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  className="gap-2 bg-[#1a237e] text-white hover:bg-[#283593]"
                  onClick={() => { window.location.href = adminHomeUrl(); }}
                >
                  Back to Admin Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" /> Reload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}