import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, cubicBezier, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import BusRoutesPage from "@/pages/BusRoutesPage";
import SafetyPage from "@/pages/SafetyPage";
import FeedbackPage from "@/pages/FeedbackPage";
import ContactPage from "@/pages/ContactPage";
import NotFound from "@/pages/NotFound";
import LocatePage from "@/pages/LocatePage";
import NoticeBoardPage from "@/pages/NoticeBoardPage";
import UpdatesPage from "@/pages/UpdatesPage";
import CoordinatorsPage from "@/pages/CoordinatorsPage";
import LoginPage from "@/pages/LoginPage";
import ChatBot from "@/components/ChatBot";
import ScrollUpButton from "@/components/ScrollUpButton";
import MagicCursor from "@/components/MagicCursor";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireRole from "@/components/RequireRole";
import StudentLayout from "@/components/student/StudentLayout";
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import StudentTransportPage from "@/pages/student/StudentTransportPage";
import StudentComplaintsPage from "@/pages/student/StudentComplaintsPage";
import StudentNotificationsPage from "@/pages/student/StudentNotificationsPage";
import StudentProfileSetupPage from "@/pages/student/StudentProfileSetupPage";
import { studentProfileComplete } from "@/lib/faculty";
import FacultyLayout from "@/components/faculty/FacultyLayout";
import FacultyDashboardPage from "@/pages/faculty/FacultyDashboardPage";
import MyBusPage from "@/pages/faculty/MyBusPage";
import LiveTrackingPage from "@/pages/faculty/LiveTrackingPage";
import FacultyStudentsPage from "@/pages/faculty/FacultyStudentsPage";
import FacultyAttendancePage from "@/pages/faculty/FacultyAttendancePage";
import FacultyRouteStopsPage from "@/pages/faculty/FacultyRouteStopsPage";
import FacultyComplaintsPage from "@/pages/faculty/FacultyComplaintsPage";
import ComplaintDetailPage from "@/pages/faculty/ComplaintDetailPage";
import FacultyEmergencyPage from "@/pages/faculty/FacultyEmergencyPage";
import FacultyNotificationsPage from "@/pages/faculty/FacultyNotificationsPage";
import FacultyProfilePage from "@/pages/faculty/FacultyProfilePage";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminBusesPage from "@/pages/admin/AdminBusesPage";
import AdminDriversPage from "@/pages/admin/AdminDriversPage";
import AdminStudentsPage from "@/pages/admin/AdminStudentsPage";
import AdminFacultyPage from "@/pages/admin/AdminFacultyPage";
import AdminRoutesPage from "@/pages/admin/AdminRoutesPage";
import AdminBusStopsPage from "@/pages/admin/AdminBusStopsPage";
import AdminLiveTrackingPage from "@/pages/admin/AdminLiveTrackingPage";
import AdminAttendancePage from "@/pages/admin/AdminAttendancePage";
import AdminComplaintsPage from "@/pages/admin/AdminComplaintsPage";
import AdminComplaintDetailPage from "@/pages/admin/AdminComplaintDetailPage";
import AdminEmergencyPage from "@/pages/admin/AdminEmergencyPage";
import AdminSchedulesPage from "@/pages/admin/AdminSchedulesPage";
import AdminMaintenancePage from "@/pages/admin/AdminMaintenancePage";
import AdminNotificationsPage from "@/pages/admin/AdminNotificationsPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";

const queryClient = new QueryClient();
const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : import.meta.env.BASE_URL.replace(/\/$/, "");

const easeOut = cubicBezier(0.25, 0.1, 0.25, 1);
const easeIn = cubicBezier(0.42, 0, 1, 1);

const pageTransition = {
  initial: { opacity: 0, filter: "blur(10px)", scale: 0.98, y: 20 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1, y: 0, transition: { duration: 0.5, ease: easeOut, staggerChildren: 0.1 } },
  exit: { opacity: 0, filter: "blur(10px)", scale: 0.96, y: -20, transition: { duration: 0.3, ease: easeIn } }
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageTransition}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

/** Student panel wrapper — first-time profile setup blocks the panel until completed. */
const StudentPanel = () => {
  const { user } = useAuth();
  const incomplete = !studentProfileComplete(user);
  return (
    <StudentLayout>
      {incomplete ? <StudentProfileSetupPage /> : <Outlet />}
    </StudentLayout>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/home" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/routes" element={<PageWrapper><BusRoutesPage /></PageWrapper>} />
        <Route path="/safety" element={<PageWrapper><SafetyPage /></PageWrapper>} />
        <Route path="/feedback" element={<PageWrapper><FeedbackPage /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
        <Route path="/updates" element={<PageWrapper><UpdatesPage /></PageWrapper>} />
        <Route path="/locate" element={<PageWrapper><LocatePage /></PageWrapper>} />
        <Route path="/notices" element={<PageWrapper><NoticeBoardPage /></PageWrapper>} />
        <Route path="/coordinators" element={<PageWrapper><CoordinatorsPage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route
          path="/student"
          element={
            <RequireRole roles={["student"]}>
              <StudentPanel />
            </RequireRole>
          }
        >
          <Route index element={<PageWrapper><StudentDashboardPage /></PageWrapper>} />
          <Route path="transport" element={<PageWrapper><StudentTransportPage /></PageWrapper>} />
          <Route path="complaints" element={<PageWrapper><StudentComplaintsPage /></PageWrapper>} />
          <Route path="notifications" element={<PageWrapper><StudentNotificationsPage /></PageWrapper>} />
        </Route>
        <Route
          path="/faculty"
          element={
            <RequireRole roles={["teacher"]}>
              <FacultyLayout />
            </RequireRole>
          }
        >
          <Route index element={<PageWrapper><FacultyDashboardPage /></PageWrapper>} />
          <Route path="my-bus" element={<PageWrapper><MyBusPage /></PageWrapper>} />
          <Route path="live-tracking" element={<PageWrapper><LiveTrackingPage /></PageWrapper>} />
          <Route path="students" element={<PageWrapper><FacultyStudentsPage /></PageWrapper>} />
          <Route path="attendance" element={<PageWrapper><FacultyAttendancePage /></PageWrapper>} />
          <Route path="routes" element={<PageWrapper><FacultyRouteStopsPage /></PageWrapper>} />
          <Route path="complaints" element={<PageWrapper><FacultyComplaintsPage /></PageWrapper>} />
          <Route path="complaints/:id" element={<PageWrapper><ComplaintDetailPage /></PageWrapper>} />
          <Route path="emergency" element={<PageWrapper><FacultyEmergencyPage /></PageWrapper>} />
          <Route path="notifications" element={<PageWrapper><FacultyNotificationsPage /></PageWrapper>} />
          <Route path="profile" element={<PageWrapper><FacultyProfilePage /></PageWrapper>} />
        </Route>
        <Route
          path="/admin"
          element={
            <RequireRole roles={["admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<PageWrapper><AdminDashboardPage /></PageWrapper>} />
          <Route path="buses" element={<PageWrapper><AdminBusesPage /></PageWrapper>} />
          <Route path="drivers" element={<PageWrapper><AdminDriversPage /></PageWrapper>} />
          <Route path="students" element={<PageWrapper><AdminStudentsPage /></PageWrapper>} />
          <Route path="faculty" element={<PageWrapper><AdminFacultyPage /></PageWrapper>} />
          <Route path="routes" element={<PageWrapper><AdminRoutesPage /></PageWrapper>} />
          <Route path="bus-stops" element={<PageWrapper><AdminBusStopsPage /></PageWrapper>} />
          <Route path="live-tracking" element={<PageWrapper><AdminLiveTrackingPage /></PageWrapper>} />
          <Route path="attendance" element={<PageWrapper><AdminAttendancePage /></PageWrapper>} />
          <Route path="complaints" element={<PageWrapper><AdminComplaintsPage /></PageWrapper>} />
          <Route path="complaints/:id" element={<PageWrapper><AdminComplaintDetailPage /></PageWrapper>} />
          <Route path="emergency" element={<PageWrapper><AdminEmergencyPage /></PageWrapper>} />
          <Route path="schedules" element={<PageWrapper><AdminSchedulesPage /></PageWrapper>} />
          <Route path="maintenance" element={<PageWrapper><AdminMaintenancePage /></PageWrapper>} />
          <Route path="notifications" element={<PageWrapper><AdminNotificationsPage /></PageWrapper>} />
          <Route path="reports" element={<PageWrapper><AdminReportsPage /></PageWrapper>} />
          <Route path="users" element={<PageWrapper><AdminUsersPage /></PageWrapper>} />
          <Route path="settings" element={<PageWrapper><AdminSettingsPage /></PageWrapper>} />
        </Route>
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppShell = () => {
  const location = useLocation();
  const isFaculty = location.pathname.startsWith("/faculty");
  const isAdmin = location.pathname.startsWith("/admin");
  const isStudent = location.pathname.startsWith("/student");
  const isPanel = isFaculty || isAdmin || isStudent;

  return (
    <div className={isPanel ? "min-h-screen bg-background" : "flex min-h-screen flex-col overflow-x-hidden pt-20"}>
      {!isPanel && <Navbar />}
      <main className={isPanel ? "w-full flex-1" : "flex-1 w-full mx-auto relative"}>
        <AnimatedRoutes />
      </main>
      {!isPanel && <Footer />}
      {!isPanel && <ChatBot />}
      {!isPanel && <ScrollUpButton />}
      {!isPanel && <MagicCursor />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter basename={routerBasename}>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;