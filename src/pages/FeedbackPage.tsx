import { useState, type ChangeEvent, type FormEvent } from "react";
import { MessageSquare, Send, CheckCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { busRoutes } from "@/data/routes";
import collegeEntranceImg from "@/assets/college_entrance_hero.jpg";

const categories = ["General", "Issue / Complaint", "Driver Behavior", "Timing", "Safety", "Suggestion"];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const massiveScaleIn = {
  hidden: { opacity: 0, scale: 0.8, y: 50, rotateX: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 12, mass: 1 },
  },
};

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [routeNumber, setRouteNumber] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageError, setImageError] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setImageName("");
      setImageError("");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSize) {
      setImageFile(null);
      setImagePreview("");
      setImageName("");
      setImageError("Please select an image under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFile(file);
      setImagePreview(reader.result as string);
      setImageName(file.name);
      setImageError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!department.trim() || !year || !section.trim() || !category || !description.trim()) return;

    setLoading(true);
    setSubmitError("");

    try {
      const { api } = await import("@/lib/api");
      await api.post("/student/feedback", {
        subject: `${category} - ${department}`,
        message: description.trim(),
        rating: 5,
        category: "OTHER",
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to submit feedback right now. Please log in first.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setName("");
    setDepartment("");
    setYear("");
    setSection("");
    setRouteNumber("");
    setCategory("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setImageName("");
    setImageError("");
    setFileKey((k) => k + 1);
    setLoading(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Top Entrance Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10 overflow-hidden rounded-[2.5rem] border-4 shadow-xl"
        style={{ borderColor: "rgba(255,215,0,0.4)" }}
      >
        <img src={collegeEntranceImg} alt="DACE Entrance" className="w-full h-auto object-cover" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <MessageSquare className="h-3.5 w-3.5 animate-bounce-soft" /> Student Feedback
        </div>
        <h1 className="mb-2 text-3xl font-bold">
          <span className="text-gradient-hero">Share Your Feedback</span>
        </h1>
        <p className="text-sm text-muted-foreground">Help us improve our transport service</p>
      </motion.div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4"
          >
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-success">Feedback submitted successfully! Thank you.</p>
            <Sparkles className="h-4 w-4 text-success animate-bounce-soft ml-auto" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <motion.div variants={massiveScaleIn}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 input-focus-glow transition-all"
          />
        </motion.div>

        <motion.div variants={massiveScaleIn}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Department *</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. CSE"
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 input-focus-glow transition-all"
          />
        </motion.div>

        <motion.div variants={massiveScaleIn} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Year *</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            >
              <option value="">Select year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Section *</label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. A"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 input-focus-glow transition-all"
            />
          </div>
        </motion.div>

        <motion.div variants={massiveScaleIn}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Bus Route Number</label>
          <select
            value={routeNumber}
            onChange={(e) => setRouteNumber(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          >
            <option value="">Select route (optional)</option>
            {busRoutes.map((r) => (
              <option key={r.routeNumber} value={r.routeNumber}>Route {r.routeNumber}</option>
            ))}
          </select>
        </motion.div>

        <motion.div variants={massiveScaleIn}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </motion.div>

        <motion.div variants={massiveScaleIn}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe your feedback or issue..."
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 input-focus-glow transition-all"
          />
        </motion.div>

        <motion.div variants={massiveScaleIn}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Attach Image (optional)</label>
          <div className="rounded-xl border border-dashed border-border bg-background/60 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Upload a screenshot or photo</p>
                <p className="text-xs text-muted-foreground">JPEG/PNG, max 2 MB</p>
              </div>
              <input
                key={fileKey}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Browse</span>
            </label>
            {imageError && <p className="mt-2 text-xs text-destructive">{imageError}</p>}
            {imagePreview && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2">
                <img
                  src={imagePreview}
                  alt={imageName || "Attached image"}
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{imageName || "Attached image"}</p>
                  <p className="text-xs text-muted-foreground">Included with submission</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {submitError && (
          <motion.div
            variants={massiveScaleIn}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {submitError}
          </motion.div>
        )}

        <motion.button
          variants={massiveScaleIn}
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-hero py-3 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-shadow animate-glow-pulse disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" /> {loading ? "Submitting..." : "Submit Feedback"}
        </motion.button>
      </motion.form>
    </div>
  );
}
