import { Phone, MapPin, Mail, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DACELogo from "@/components/DACELogo";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const socialLinks = [
  { icon: Youtube, href: "https://youtube.com/@dhaanishchennai?si=cf9muy-JihZ7iwln", label: "YouTube" },
  { icon: Linkedin, href: "https://www.linkedin.com/school/dhaanish-ahmed-college-of-engineering/", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/dhaanishchennai?igsh=MXJhNjh4NTI3aWlkaA==", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/share/187jVeYjpt/", label: "Facebook" },
];

export default function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="border-t border-border"
      style={{ background: "linear-gradient(180deg, #1a237e, #0d1452)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div custom={0} variants={fadeIn}>
            <div className="flex items-center gap-2 mb-3">
              <DACELogo size={32} />
              <span className="font-bold text-white">Dhaanish Chennai</span>
            </div>
            <p className="text-sm text-white/70 mb-4">
              An Autonomous Institution | NAAC A+ | 4 Star India Rating | AICTE Approved | Anna University
            </p>
            <p className="text-sm text-white/60">
              College Transport Management System — ensuring safe and timely commute for all students.
            </p>
          </motion.div>
          <motion.div custom={1} variants={fadeIn}>
            <h4 className="mb-3 text-sm font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {[
                { href: "/", label: "Home" },
                { href: "/routes", label: "Bus Routes" },
                { href: "/safety", label: "Safety Rules" },
                { href: "/feedback", label: "Student Feedback" },
                { href: "/contact", label: "Contact Us" },
                { href: "/updates", label: "Key Updates" },
                { href: "/locate", label: "Locate" },
                { href: "/notices", label: "Notice Board" },
                { href: "/coordinators", label: "Coordinators" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="transition-all hover:translate-x-1 inline-block"
                    style={{ color: "rgba(255,215,0,0.8)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FFD700")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,215,0,0.8)")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div custom={2} variants={fadeIn}>
            <h4 className="mb-3 text-sm font-semibold text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: "#FFD700" }} />
                <span>Dhaanish Nagar, Vanchuvancherry, Padappai (Near Tambaram), Sriperumbudur Taluk, Kancheepuram District - 601 301</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" style={{ color: "#FFD700" }} />
                <a href="tel:+919962022222" className="hover:text-white transition-colors">+91 9962022222</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" style={{ color: "#FFD700" }} />
                <a href="mailto:info@dhaanishcollege.co.in" className="hover:text-white transition-colors">info@dhaanishcollege.co.in</a>
              </li>
            </ul>

            {/* Social Links */}
            <h4 className="mt-5 mb-3 text-sm font-semibold text-white">Follow Us</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:scale-110 hover:bg-white/20 hover:text-white"
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
        <motion.div
          custom={3}
          variants={fadeIn}
          className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50"
        >
          © {new Date().getFullYear()} Dhaanish Ahmed College of Engineering, Chennai — College Transport Management System | ISO 9001:2015 Certified
          <br />
          <span className="text-white/30 text-[10px]">Made by Shanvas &amp; Team with the help of Antigravity · Maintained &amp; Hosted by Nano Spark Team</span>
        </motion.div>
      </div>
    </motion.footer>
  );
}
