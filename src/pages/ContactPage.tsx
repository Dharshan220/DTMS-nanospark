import { MapPin, Phone, Mail, Clock, Globe, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import collegeEntranceImg from "@/assets/college_entrance_hero.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1, x: 0, scale: 1,
    transition: { delay: i * 0.1, type: "spring" as const, stiffness: 100, damping: 14 },
  }),
};

const contactItems = [
  { icon: User, title: "Transport Head", text: "Muthukrishan", href: undefined, color: "#1a237e" },
  { icon: Users, title: "Coordinator", text: "Please contact the Transport Office for coordinator details.", href: "tel:+919962022222", color: "#0ea5e9" },
  { icon: MapPin, title: "Address", text: "Dhaanish Nagar, Vanchuvancherry, Padappai (Near Tambaram), Sriperumbudur Taluk, Kancheepuram District - 601 301", href: undefined, color: "#ef4444" },
  { icon: Phone, title: "Phone", text: "+91 9962022222", href: "tel:+919962022222", color: "#22c55e" },
  { icon: Mail, title: "Email", text: "info@dhaanishcollege.co.in", href: "mailto:info@dhaanishcollege.co.in", color: "#3b82f6" },
  { icon: Clock, title: "Office Hours", text: "Mon - Sat: 8:00 AM - 5:00 PM", href: undefined, color: "#f59e0b" },
  { icon: Globe, title: "Website", text: "dhaanishchennai.in", href: "https://dhaanishchennai.in/", color: "#8b5cf6" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
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
        className="mb-10 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          className="mb-2 text-3xl font-bold"
        >
          <span className="text-gradient-hero">Contact Us</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          Reach out to the Dhaanish Chennai Transport Department
        </motion.p>
      </motion.div>

      <motion.div
        className="grid gap-6 sm:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {contactItems.map((item, i) => {
          const commonProps = {
            key: item.title,
            custom: i,
            variants: cardVariants,
            whileHover: { y: -8, scale: 1.03, boxShadow: `0 20px 40px -12px ${item.color}33` },
            whileTap: { scale: 0.96 },
            className: `flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer group ${
              i === contactItems.length - 1 ? "sm:col-span-2" : ""
            }`,
          } as const;

          const content = (
            <>
              {/* Animated icon */}
              <motion.div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all"
                style={{ backgroundColor: `${item.color}15` }}
                whileHover={{ rotate: [0, -12, 12, 0], scale: 1.15 }}
                transition={{ duration: 0.4 }}
              >
                <item.icon className="h-5 w-5 transition-transform" style={{ color: item.color }} />
              </motion.div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">{item.text}</p>
              </div>
            </>
          );

          if (item.href) {
            const isExternal = item.href.startsWith("http");
            return (
              <motion.a
                {...commonProps}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {content}
              </motion.a>
            );
          }

          return <motion.div {...commonProps}>{content}</motion.div>;
        })}
      </motion.div>
    </div>
  );
}
