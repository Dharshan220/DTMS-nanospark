import { useState, type FormEvent, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LogIn, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { publicAsset } from "@/lib/publicAsset";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import type { LoginRole } from "@/lib/faculty";
import { ApiError } from "@/lib/api";

const ROLE_LABELS: Record<LoginRole, string> = {
  student: "Student Login",
  driver: "Driver Login",
  faculty: "Faculty Login",
  admin: "Admin Login",
};

const DEMO_CREDS: Partial<Record<LoginRole, string>> = {
  faculty: "teacher@dtms.in / teacher123",
  admin: "admin@dtms.in / admin123",
  student: "student@dtms.in / student123",
};

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>("student");
  const [showPreview, setShowPreview] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [timer, setTimer] = useState<number | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        localStorage.setItem("dace_user_role", role);
        localStorage.setItem("dace_google_name", userInfo.name || "");
        localStorage.setItem("dace_google_email", userInfo.email || "");
        localStorage.setItem("dace_google_picture", userInfo.picture || "");
        navigate("/");
      } catch {
        setGoogleError("Failed to get user info. Please try again.");
      }
    },
    onError: () => setGoogleError("Google login failed. Please try again."),
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const HERO_VIDEO_URL = publicAsset("/login-hero.mp4");
  const BADGE_URL = publicAsset("/dhaanish-badge.png");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (submitting) return;
    setSubmitting(true);
    try {
      const user = await login(role, identifier.trim(), password);
      setShowPreview(true);
      const target = user.role === "teacher" ? "/faculty" : user.role === "admin" ? "/admin" : "/student";
      const id = window.setTimeout(() => navigate(target), 1200);
      setTimer(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const attemptPlay = () => {
      vid.play().catch(() => {});
    };

    vid.addEventListener("canplay", attemptPlay);
    attemptPlay();
    return () => {
      vid.removeEventListener("canplay", attemptPlay);
    };
  }, []);

  return (
    <div
      className="min-h-[calc(100vh-80px)] text-slate-900"
      style={{
        background:
          "linear-gradient(135deg, #e8ecff 0%, #f2f4ff 45%, #fff7d6 100%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-10 lg:items-stretch">
        <div className="lg:col-span-2 flex justify-center">
          <img
            src={BADGE_URL}
            alt="Dhaanish Chennai"
            className="h-16 w-auto sm:h-20"
          />
        </div>
        {/* Visual panel with hero video (desktop left, mobile second) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative order-2 overflow-hidden rounded-3xl shadow-2xl bg-white min-h-[50vh] lg:order-1 lg:min-h-[80vh]"
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            ref={videoRef}
            poster={BADGE_URL}
            style={{ filter: "brightness(1.25) saturate(1.15)" }}
            aria-hidden="true"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          <div className="relative inset-0 min-h-[50vh] lg:min-h-[80vh]" />
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative order-1 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl lg:order-2"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFC107] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a237e] shadow-sm border border-[#f0c200]">
              Dhaanish Login
            </span>
            <span className="text-xs font-semibold text-slate-600">{ROLE_LABELS[role]}</span>
          </div>

          <div className="space-y-1 mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1a237e]">
              Dhaanish Chennai
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-[#1a237e] sm:text-4xl">
              Dhaanish Transport Login
            </h1>
            <p className="text-sm text-slate-700">
              Please sign in to continue to the transport dashboard.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["student", "driver", "faculty", "admin"] as LoginRole[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setRole(item);
                  setError(null);
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition border ${
                  role === item
                    ? "border-[#caa200] bg-gradient-to-r from-[#FFEB70] via-[#FFD700] to-[#F5C400] text-[#0f1b5c] shadow-md"
                    : "border-[#e5d27a] bg-white text-[#0f1b5c] hover:border-[#caa200] hover:bg-[#fff7d6]"
                }`}
              >
                {ROLE_LABELS[item]}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-[#dce2ff] bg-white px-4 py-3 shadow-inner focus-within:border-[#1a237e] focus-within:ring-1 focus-within:ring-[#FFD700]">
              <label className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-700">
                <Mail className="h-4 w-4" />
                Mobile number or email
              </label>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter mobile number or college email"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce2ff] bg-white px-4 py-3 shadow-inner focus-within:border-[#1a237e] focus-within:ring-1 focus-within:ring-[#FFD700]">
              <label className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-700">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <div className="mt-1 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </motion.p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFC107] px-5 py-3 text-sm font-bold text-[#1a237e] shadow-lg shadow-[#1a237e]/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {submitting ? "Signing in…" : "Sign In"}
                {!submitting && (
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: 4 }}
                    transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.2 }}
                  >
                    -&gt;
                  </motion.span>
                )}
              </button>
            </div>
          </form>

          {DEMO_CREDS[role] && (
            <div className="mt-4 rounded-2xl border border-[#dce2ff] bg-[#f7f9ff] px-4 py-3 text-[11px] text-slate-600">
              <span className="font-bold text-[#1a237e]">Demo account:</span>{" "}
              {DEMO_CREDS[role]}
              {role === "driver" && " (driver accounts are not available in this demo)"}
            </div>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1a237e] to-transparent" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              id="google-login-btn"
              onClick={() => { setGoogleError(null); googleLogin(); }}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-[#dce2ff] bg-white px-5 py-3 text-sm font-semibold text-[#1a237e] shadow-lg shadow-[#1a237e]/10 transition hover:-translate-y-[1px] hover:shadow-xl active:scale-95"
            >
              <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="h-5 w-5" />
              Continue with Google
            </button>
            {googleError && (
              <p className="text-center text-xs text-red-500 font-medium">{googleError}</p>
            )}
          </div>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-6 rounded-2xl border border-[#dce2ff] bg-gradient-to-r from-[#f7f9ff] to-[#fff9e6] p-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD700]/20 text-[#FFD700]">
                  <LogIn className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Welcome back! ({ROLE_LABELS[role]})
                  </p>
                  <p className="text-xs text-slate-600">Hover to preview your dashboard entry animation.</p>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700"
              >
                {role === "faculty"
                  ? "You will land on your Faculty dashboard with your assigned bus, students, attendance and complaints."
                  : role === "student"
                    ? "You will land on your Student dashboard with your bus, route stops, and complaint tracking."
                    : "You will land on the transport dashboard with routes, live swaps, and notices once logged in."}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}