import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { busRoutes } from "@/data/routes";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 0,
  text: "👋 Hi! I'm the DACE Transport Assistant. Ask me anything about bus routes, stops, timings, or drivers!\n\nTry asking:\n• \"Which bus goes through Tambaram?\"\n• \"What time does Route 21 arrive?\"\n• \"Who is the driver for Route 25?\"\n• \"How many routes are there?\"",
  sender: "bot",
  timestamp: new Date(),
};

// ──────────────────── SMART REPLY ENGINE ────────────────────

// Build indexes once for fast lookup
const allStopNames = Array.from(
  new Set(busRoutes.flatMap((r) => r.boardingPoints.map((bp) => bp.name)))
).sort();

const totalStops = busRoutes.reduce((a, r) => a + r.boardingPoints.length, 0);

/** Fuzzy match: checks if any word in the query partly matches the stop name */
function fuzzyMatchStop(query: string, stopName: string): boolean {
  const qWords = query.toLowerCase().split(/\s+/);
  const sWords = stopName.toLowerCase().split(/[\s,]+/);
  return qWords.some(
    (qw) => qw.length >= 3 && sWords.some((sw) => sw.includes(qw) || qw.includes(sw))
  );
}

/** Find all routes that pass through a stop (fuzzy) */
function findRoutesByStop(query: string) {
  return busRoutes
    .map((route) => {
      const match = route.boardingPoints.find((bp) => fuzzyMatchStop(query, bp.name));
      return match ? { route, stop: match } : null;
    })
    .filter(Boolean) as { route: (typeof busRoutes)[0]; stop: { name: string; time: string } }[];
}

/** Find routes that connect two areas */
function findConnectingRoutes(from: string, to: string) {
  return busRoutes.filter(
    (route) =>
      route.boardingPoints.some((bp) => fuzzyMatchStop(from, bp.name)) &&
      route.boardingPoints.some((bp) => fuzzyMatchStop(to, bp.name))
  );
}

/** Extract all numbers from query */
function extractNumbers(q: string): number[] {
  return (q.match(/\d+/g) || []).map(Number);
}

/** Clean query of common noise words */
function cleanQuery(q: string): string {
  return q
    .replace(
      /\b(which|what|where|when|how|does|do|is|are|the|a|an|my|i|me|can|you|tell|about|give|show|find|get|want|need|please|bus|route|goes|go|going|through|from|via|stop|stops|near|nearby|pass|passing|passes|to|at|in|on|for|of|and|or|with|will|has|have|any|there|board|boarding|point|points|travel|reach|pick|pickup)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function getSmartReplySingle(query: string): string {
  const q = query.toLowerCase().trim();
  const nums = extractNumbers(q);

  // Website / feature help (Key Updates, Bus Swap, etc.)
  if (/key\s*updates|updates\s*page|bus\s*swapp?ing|bus\s*swap|instant\s*updates/i.test(q)) {
    return (
      "Key Updates help:\n" +
      "- Open Key Updates from the navbar.\n" +
      "- Choose a tab: Instant Updates or Bus Swapping Updates.\n" +
      "- Instant Updates: Student / Faculty / Driver.\n" +
      "- Bus Swapping Updates: Staff / Driver / Transport Authority Manager.\n" +
      "- Instant Updates: select bus number, choose the issue, add details (optional if late mins is set), and optionally attach a photo.\n" +
      "- Late issue: enter minutes only (e.g. 10 mins).\n" +
      "- Bus Swapping: select the current bus number + swapped bus number (today only) and add a reason (optional).\n" +
      "- After sharing, everyone can see it in the Notice Board."
    );
  }

  // ── Greetings ──
  if (/^(hi+|hello|hey|good\s*(morning|evening|afternoon|night)|helo|namaste|vanakkam|assalam)/i.test(q)) {
    return "Hello! 😊 Welcome to DACE Transport. I can help you with:\n\n🚌 Bus route details\n📍 Stop/area search\n⏰ Pickup timings\n👤 Driver info\n🛡️ Safety rules\n🏫 College info\n\nJust type your question!";
  }

  // ── Thanks / Bye ──
  if (/^(thanks|thank\s*you|thx|ty|ok\s*thanks|bye|goodbye|see\s*you)/i.test(q)) {
    return "You're welcome! 😊 Have a safe journey. Feel free to come back anytime you need help with DACE Transport!";
  }

  // ── How many routes / buses ──
  if (/how\s*many\s*(bus|route|vehicle)/i.test(q) || /total\s*(bus|route|number)/i.test(q) || /count.*route/i.test(q)) {
    const routeNums = busRoutes.map((r) => r.routeNumber).join(", ");
    return `🚌 We currently operate **${busRoutes.length} bus routes** (Route Nos: ${routeNums}) covering **${totalStops}+ boarding points** across Chennai.\n\nEach bus makes **2 trips daily** — morning pickup & evening drop.\n\nWant details on a specific route? Just say "Route 21" etc.`;
  }

  // ── How many stops ──
  if (/how\s*many\s*(stop|boarding|point)/i.test(q)) {
    if (nums.length > 0) {
      const route = busRoutes.find((r) => r.routeNumber === nums[0]);
      if (route) {
        return `📍 **Route ${route.routeNumber}** has **${route.boardingPoints.length} boarding points**.\n\nFirst stop: ${route.boardingPoints[0].name} (${route.boardingPoints[0].time})\nLast stop: COLLEGE (${route.arrivalTime})`;
      }
    }
    return `📍 Total boarding points across all routes: **${totalStops}+**\nUnique stops: **${allStopNames.length}**\n\nAsk "stops in Route 21" for a specific route!`;
  }

  // ── List all routes ──
  if (/list\s*(all)?\s*(route|bus)/i.test(q) || /all\s*(route|bus)/i.test(q) || /show\s*(all)?\s*(route|bus)/i.test(q)) {
    const list = busRoutes.map((r) => `• **Route ${r.routeNumber}** — ${r.vehicleNumber} | Driver: ${r.driverName} | Arrival: ${r.arrivalTime}`).join("\n");
    return `🚌 **All ${busRoutes.length} Routes:**\n\n${list}\n\nAsk about any route number for full details!`;
  }

  // ── Route number specific ──
  if (/route\s*(\d+)/i.test(q) || (/^\d{2}$/.test(q.trim())) || (nums.length === 1 && q.length < 20 && !/time|stop|driver|phone/i.test(q))) {
    const num = nums[0] || parseInt(q.trim());
    if (num) {
      const route = busRoutes.find((r) => r.routeNumber === num);
      if (route) {
        const stops = route.boardingPoints.map((bp) => `${bp.name} (${bp.time})`).join(" → ");
        return `🚌 **Route ${route.routeNumber} — Full Details**\n\n🚗 Vehicle: ${route.vehicleNumber}\n👤 Driver: ${route.driverName} ✅ Verified\n📞 Phone: ${route.driverPhone}\n⏰ College Arrival: ${route.arrivalTime}\n📍 Total Stops: ${route.boardingPoints.length}\n\n**Route Map:**\n${stops}\n\n🕐 First pickup: **${route.boardingPoints[0].name}** at **${route.boardingPoints[0].time}**`;
      } else {
        const available = busRoutes.map((r) => r.routeNumber).join(", ");
        return `❌ Route ${num} not found. Available routes: **${available}**.\n\nTry asking about one of these!`;
      }
    }
  }

  // ── Vehicle number lookup ──
  if (/vehicle|number\s*plate|tn\s*\d|registration/i.test(q)) {
    const vehicleQ = q.replace(/vehicle|number|plate|registration|what|is|the|for/gi, "").trim().toUpperCase();
    if (vehicleQ.length >= 4) {
      const found = busRoutes.filter((r) => r.vehicleNumber.toLowerCase().includes(vehicleQ.toLowerCase()));
      if (found.length > 0) {
        return found.map((r) => `🚗 **${r.vehicleNumber}** → Route ${r.routeNumber} | Driver: ${r.driverName}`).join("\n");
      }
    }
    if (nums.length > 0) {
      const route = busRoutes.find((r) => r.routeNumber === nums[0]);
      if (route) return `🚗 Route ${route.routeNumber} vehicle number: **${route.vehicleNumber}**`;
    }
    const allVehicles = busRoutes.map((r) => `• Route ${r.routeNumber}: **${r.vehicleNumber}**`).join("\n");
    return `🚗 **All Vehicle Numbers:**\n\n${allVehicles}`;
  }

  // ── From X to Y / connecting routes ──
  const fromToMatch = q.match(/from\s+(.+?)\s+to\s+(.+?)(?:\?|$)/i) || q.match(/(.+?)\s+to\s+(.+?)(?:\s+bus|\s+route|\?|$)/i);
  if (fromToMatch) {
    const from = cleanQuery(fromToMatch[1]);
    const to = cleanQuery(fromToMatch[2]);
    if (from.length >= 3 && to.length >= 3) {
      // If "to college" or "to dace"
      if (/college|dace|campus/i.test(to)) {
        const results = findRoutesByStop(from);
        if (results.length > 0) {
          const details = results.map((r) => `• **Route ${r.route.routeNumber}** — Board at ${r.stop.name} (${r.stop.time}), reach college by ${r.route.arrivalTime}`).join("\n");
          return `🚌 Routes from **${from.toUpperCase()}** to **College**:\n\n${details}`;
        }
      }
      const connecting = findConnectingRoutes(from, to);
      if (connecting.length > 0) {
        const details = connecting.map((r) => {
          const fromStop = r.boardingPoints.find((bp) => fuzzyMatchStop(from, bp.name));
          const toStop = r.boardingPoints.find((bp) => fuzzyMatchStop(to, bp.name));
          return `• **Route ${r.routeNumber}** — ${fromStop?.name} (${fromStop?.time}) → ${toStop?.name} (${toStop?.time})`;
        }).join("\n");
        return `🔗 Routes connecting **${from.toUpperCase()}** ↔ **${to.toUpperCase()}**:\n\n${details}`;
      }
      return `❌ No direct route found from "${from}" to "${to}". All our routes end at **DACE College, Padappai**. Try searching each area separately!`;
    }
  }

  // ── Earliest / latest / first / last bus ──
  if (/earliest|first\s*(bus|route|pickup)|latest|last\s*(bus|route)/i.test(q)) {
    const sorted = [...busRoutes].sort((a, b) => {
      const tA = a.boardingPoints[0].time;
      const tB = b.boardingPoints[0].time;
      return tA.localeCompare(tB);
    });
    if (/earliest|first/i.test(q)) {
      const r = sorted[0];
      return `🌅 **Earliest bus:** Route ${r.routeNumber}\n\nFirst pickup: ${r.boardingPoints[0].name} at **${r.boardingPoints[0].time}**\nDriver: ${r.driverName}\n\nTop 3 earliest routes:\n${sorted.slice(0, 3).map((r) => `• Route ${r.routeNumber} → ${r.boardingPoints[0].name} at ${r.boardingPoints[0].time}`).join("\n")}`;
    } else {
      const r = sorted[sorted.length - 1];
      return `🌙 **Latest starting bus:** Route ${r.routeNumber}\n\nFirst pickup: ${r.boardingPoints[0].name} at **${r.boardingPoints[0].time}**\nDriver: ${r.driverName}`;
    }
  }

  // ── Timing queries ──
  if (/time|timing|when|arrive|arrival|schedule|pick\s*up|depart/i.test(q)) {
    if (nums.length > 0) {
      const route = busRoutes.find((r) => r.routeNumber === nums[0]);
      if (route) {
        const stopList = route.boardingPoints.map((bp) => `• ${bp.name} — **${bp.time}**`).join("\n");
        return `⏰ **Route ${route.routeNumber} Complete Schedule:**\n\n${stopList}\n\n🏫 Reaches college by **${route.arrivalTime}**\n\n📍 Total journey: ${route.boardingPoints[0].time} → ${route.arrivalTime}`;
      }
    }
    // Check if a stop name is mentioned
    const cleaned = cleanQuery(q);
    if (cleaned.length >= 3) {
      const results = findRoutesByStop(cleaned);
      if (results.length > 0) {
        const details = results.map((r) => `• Route ${r.route.routeNumber}: **${r.stop.time}** at ${r.stop.name}`).join("\n");
        return `⏰ Pickup times at **${cleaned.toUpperCase()}**:\n\n${details}\n\nAll buses reach college by **8:00–8:10 AM**.`;
      }
    }
    return `⏰ **General Timings:**\n\nMorning pickups start: **5:20 AM** (earliest)\nAll buses reach college: **8:00–8:10 AM**\nEvening drop: After college hours\n\nFor specific timings, ask "timings for Route 21" or "when does bus reach Tambaram?"`;
  }

  // ── Driver queries ──
  if (/driver|phone|call|contact\s*(number|driver)|who\s*(drive|is\s*the\s*driver)/i.test(q)) {
    if (nums.length > 0) {
      const route = busRoutes.find((r) => r.routeNumber === nums[0]);
      if (route) {
        return `👤 **Route ${route.routeNumber} Driver Info:**\n\n🧑‍✈️ Name: **${route.driverName}**\n📞 Phone: **${route.driverPhone}**\n🚗 Vehicle: ${route.vehicleNumber}\n✅ Licensed & verified by DACE Transport\n\nYou can directly call the driver at ${route.driverPhone}`;
      }
    }
    // Search driver by name
    const cleaned = cleanQuery(q);
    if (cleaned.length >= 3) {
      const driverRoutes = busRoutes.filter((r) => r.driverName.toLowerCase().includes(cleaned));
      if (driverRoutes.length > 0) {
        return driverRoutes.map((r) => `👤 **${r.driverName}**\nRoute: ${r.routeNumber} | Phone: ${r.driverPhone} | Vehicle: ${r.vehicleNumber}`).join("\n\n");
      }
    }
    // List all drivers
    const allDrivers = busRoutes.map((r) => `• Route ${r.routeNumber}: **${r.driverName}** — ${r.driverPhone}`).join("\n");
    return `👤 **All Drivers:**\n\n${allDrivers}\n\nAll drivers are ✅ verified & licensed by DACE Transport.`;
  }

  // ── College / campus / DACE info ──
  if (/college|dace|dhaanish|campus|placement|autonomous|naac|ranking|rank/i.test(q)) {
    if (/placement/i.test(q)) {
      return `🎓 **DACE Placements 2025:**\n\n💰 Highest Package: **₹27 LPA**\n📊 Average Package: **₹8 LPA**\n🏢 Recruiters: **95+**\n📋 Total Offers: **250+**\n🎯 Placement Rate: **92%**\n\n🏆 Ranked 17th out of 350 engineering colleges in Tamil Nadu!`;
    }
    return `🏫 **Dhaanish Ahmed College of Engineering**\n\n📍 Padappai, Near Tambaram, Chennai - 601301\n🎓 Autonomous Institution (UGC)\n⭐ NAAC A+ Accredited | 4-Star India Rating\n✅ AICTE Approved | Anna University\n🏆 Top 20 in Tamil Nadu (17th rank)\n\n🚌 Transport: ${busRoutes.length} buses | ${totalStops}+ stops | GPS-tracked\n📞 Phone: +91 9962022222\n\nAsk me about transport routes!`;
  }

  // ── Safety / rules ──
  if (/safe|safety|rule|emergency|accident|help|sos/i.test(q)) {
    return `🛡️ **DACE Transport Safety Guidelines:**\n\n1️⃣ Board and alight only at designated stops\n2️⃣ Always carry your **College ID card**\n3️⃣ Stay seated while the bus is moving\n4️⃣ Do not lean out of windows\n5️⃣ Follow the driver's instructions\n6️⃣ Report any issues to the transport office\n7️⃣ **Emergency contacts** are posted inside every bus\n8️⃣ All buses have **GPS tracking** & CCTV\n9️⃣ First-aid kits available on every bus\n🔟 Fire extinguishers installed in all vehicles\n\n📞 Transport Emergency: Contact your bus driver directly\n🏫 Transport Office: +91 9962022222`;
  }

  // ── Fee / cost / charges ──
  if (/fee|cost|charge|price|pay|amount|transport\s*fee/i.test(q)) {
    return `💰 **Transport Fee Information:**\n\nTransport fees vary based on your boarding point distance from college. Please contact the Transport Office for exact fee details.\n\n📞 Transport Office: **+91 9962022222**\n📧 Email: info@dhaanishcollege.co.in\n\n💡 Tip: Fee payment is typically per semester. Contact the office for installment options.`;
  }

  // ── ID card / pass ──
  if (/id\s*card|pass|identity|bus\s*pass/i.test(q)) {
    return `🪪 **Bus Pass / ID Card:**\n\nAll students must carry their **College ID card** while traveling on DACE buses. This serves as your bus pass.\n\n📌 No separate bus pass is needed — your college ID is sufficient.\n📌 Lost your ID? Contact the college office immediately.\n📌 Temporary pass available from the transport office.`;
  }

  // ── Lost & found ──
  if (/lost|found|forget|forgot|left|missing|belong/i.test(q)) {
    return `🔍 **Lost & Found:**\n\nLost something on the bus? Here's what to do:\n\n1️⃣ Contact your **bus driver** directly (numbers available in route details)\n2️⃣ Report to the **Transport Office**: +91 9962022222\n3️⃣ Check with the college security office\n\n💡 Found items are usually kept with the driver or at the transport office. Report as soon as possible!`;
  }

  // ── Weekend / holiday ──
  if (/weekend|sunday|saturday|holiday|off\s*day|vacation/i.test(q)) {
    return `📅 **Bus Schedule:**\n\nBuses operate on **college working days only**.\n\n❌ No service on:\n• Sundays\n• Public holidays\n• College vacations\n• Exam holidays (check notice board)\n\n✅ Buses run on Saturdays if college has working Saturday.\n\n📌 Check the college calendar or contact transport office for holiday schedule.`;
  }

  // ── Evening / return / drop ──
  if (/evening|return|drop|back|going\s*home|departure|leave|depart/i.test(q)) {
    return `🌆 **Evening Drop Schedule:**\n\nAll buses depart from college after the last class.\n\n⏰ Typical departure: **4:30–5:00 PM** (varies by schedule)\n📍 Same route in reverse order\n👤 Same driver as morning\n\n📌 On exam days, departure may be earlier.\n📌 Check with your driver for exact evening timing.\n\nFor morning timings, ask "timings for Route XX"`;
  }

  // ── Rain / weather ──
  if (/rain|weather|flood|storm|delay|late|cancel/i.test(q)) {
    return `🌧️ **Weather & Delays:**\n\n• Buses may be **delayed by 15–30 minutes** during heavy rain or flooding.\n• Routes are **never fully cancelled** unless officially announced.\n• During Chennai floods, alternate routes may be used.\n\n📱 Contact your bus driver for real-time status:\n${busRoutes.slice(0, 3).map((r) => `• Route ${r.routeNumber}: ${r.driverName} — ${r.driverPhone}`).join("\n")}\n\n📌 Stay tuned to college WhatsApp groups for updates.`;
  }

  // ── Feedback / complaint ──
  if (/feedback|complaint|suggest|review|report|issue|problem/i.test(q)) {
    return `💬 **Feedback & Complaints:**\n\nYou can submit feedback through:\n\n1️⃣ **Website**: Visit the Feedback page on this website\n2️⃣ **Transport Office**: +91 9962022222\n3️⃣ **Email**: info@dhaanishcollege.co.in\n\nWe take all feedback seriously and work to improve your transport experience! 🙏`;
  }

  // ── GPS / tracking ──
  if (/gps|track|where\s*is|location|live|real\s*time|map/i.test(q)) {
    return `📍 **GPS Tracking:**\n\nAll DACE buses are equipped with **real-time GPS tracking**.\n\n✅ Features:\n• Live location monitoring\n• Route deviation alerts\n• Speed monitoring\n• Estimated arrival time (ETA)\n\n📱 Parents can track buses through the **parent portal**.\n📌 Contact transport office for portal access: +91 9962022222`;
  }

  // ── Stop/area search (fuzzy multi-word) ──
  const cleaned = cleanQuery(q);
  if (cleaned.length >= 3) {
    // Try each word separately and combined
    const words = cleaned.split(/\s+/).filter((w) => w.length >= 3);
    let results = findRoutesByStop(cleaned);

    // If no combined match, try individual words
    if (results.length === 0 && words.length > 0) {
      for (const word of words) {
        const wordResults = findRoutesByStop(word);
        if (wordResults.length > 0) {
          results = wordResults;
          break;
        }
      }
    }

    if (results.length > 0) {
      const details = results.map((r) =>
        `• **Route ${r.route.routeNumber}** — ${r.stop.name} at **${r.stop.time}** | Driver: ${r.route.driverName} (${r.route.driverPhone})`
      ).join("\n");
      return `📍 Found **${results.length} route(s)** for "${cleaned.toUpperCase()}":\n\n${details}\n\n🏫 All buses reach college by 8:00–8:10 AM.\n💡 Say "Route ${results[0].route.routeNumber}" for the full route map!`;
    }

    // Try driver name search
    const driverRoutes = busRoutes.filter((r) =>
      words.some((w) => r.driverName.toLowerCase().includes(w))
    );
    if (driverRoutes.length > 0) {
      return driverRoutes.map((r) =>
        `👤 **${r.driverName}** — Route ${r.routeNumber}\n📞 ${r.driverPhone} | 🚗 ${r.vehicleNumber}`
      ).join("\n\n");
    }
  }

  // ── Just a number ──
  if (nums.length === 1 && q.replace(/\d/g, "").trim().length < 5) {
    const route = busRoutes.find((r) => r.routeNumber === nums[0]);
    if (route) {
      const stops = route.boardingPoints.map((bp) => `${bp.name} (${bp.time})`).join(" → ");
      return `🚌 **Route ${route.routeNumber}:**\n\n🚗 ${route.vehicleNumber} | 👤 ${route.driverName} | 📞 ${route.driverPhone}\n⏰ Arrives: ${route.arrivalTime} | 📍 ${route.boardingPoints.length} stops\n\n**Stops:** ${stops}`;
    }
  }

  // ── Fallback — helpful suggestions ──
  return `🤔 I'm not sure I understand "${query}". Here's what I can help with:\n\n🚌 **Routes**: "Route 21", "list all routes"\n📍 **Stops**: "Tambaram", "Chrompet buses"\n🔗 **Connect**: "from Tambaram to college"\n⏰ **Timings**: "timing of Route 25"\n👤 **Drivers**: "driver of Route 22"\n🌅 **Special**: "earliest bus", "evening drop"\n🚗 **Vehicle**: "vehicle number Route 21"\n📅 **Schedule**: "weekend buses", "holiday schedule"\n💰 **Fees**: "transport fee"\n🛡️ **Safety**: "safety rules"\n🏫 **College**: "about DACE", "placements"\n\nTip: If you have many questions, send them on separate lines and I will answer each one.`;
}

function splitQueries(input: string): string[] {
  // Prefer newline separation; also support multi-question input with '?' and ';'.
  const rawParts = input
    .split(/\n+/)
    .flatMap((line) => line.split(/[?;]+/))
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of rawParts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique;
}

function getSmartReply(query: string): string {
  const parts = splitQueries(query);
  if (parts.length <= 1) {
    return getSmartReplySingle(query);
  }

  const limited = parts.slice(0, 4);
  const answers = limited.map((part, idx) => `${idx + 1}) ${getSmartReplySingle(part)}`);
  if (parts.length > limited.length) {
    answers.push(`(Showing ${limited.length} answers. Send the rest on new lines.)`);
  }
  return answers.join("\n\n");
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const reply = getSmartReply(trimmed);
      const botMsg: Message = {
        id: Date.now() + 1,
        text: reply,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-14 sm:right-20 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all"
            style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}
          >
            <MessageCircle className="h-6 w-6" style={{ color: "#FFD700" }} />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#FFD700" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-4 sm:right-20 z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              width: "380px",
              maxWidth: "calc(100vw - 2rem)",
              height: "520px",
              maxHeight: "calc(100vh - 6rem)",
              borderColor: "rgba(26, 35, 126, 0.2)",
              background: "#ffffff",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Bot className="h-5 w-5" style={{ color: "#FFD700" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">DACE Transport Bot</h3>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/70">Online • Ask anything</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "#f8f9fb" }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs"
                      style={
                        msg.sender === "bot"
                          ? { background: "linear-gradient(135deg, #1a237e, #283593)" }
                          : { background: "linear-gradient(135deg, #FFD700, #FFC107)" }
                      }
                    >
                      {msg.sender === "bot" ? (
                        <Bot className="h-3.5 w-3.5" style={{ color: "#FFD700" }} />
                      ) : (
                        <User className="h-3.5 w-3.5" style={{ color: "#1a237e" }} />
                      )}
                    </div>
                    {/* Bubble */}
                    <div
                      className="rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm"
                      style={
                        msg.sender === "user"
                          ? {
                              background: "linear-gradient(135deg, #1a237e, #283593)",
                              color: "#fff",
                              borderBottomRightRadius: "4px",
                            }
                          : {
                              background: "#fff",
                              color: "#1e293b",
                              borderBottomLeftRadius: "4px",
                              border: "1px solid #e2e8f0",
                            }
                      }
                    >
                      {msg.text.split("\n").map((line, i) => (
                        <span key={i}>
                          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                            part.startsWith("**") && part.endsWith("**") ? (
                              <strong key={j}>{part.slice(2, -2)}</strong>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                          {i < msg.text.split("\n").length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-end gap-2"
                >
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: "linear-gradient(135deg, #1a237e, #283593)" }}
                  >
                    <Bot className="h-3.5 w-3.5" style={{ color: "#FFD700" }} />
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 shadow-sm" style={{ borderBottomLeftRadius: "4px" }}>
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-gray-100">
                {["Route 21", "Tambaram buses", "Earliest bus", "From Guindy to college", "All drivers", "Evening drop", "Safety rules", "Placements"].map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => {
                        const userMsg: Message = {
                          id: Date.now(),
                          text: suggestion,
                          sender: "user",
                          timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, userMsg]);
                        setIsTyping(true);
                        setTimeout(() => {
                          const reply = getSmartReply(suggestion);
                          const botMsg: Message = {
                            id: Date.now() + 1,
                            text: reply,
                            sender: "bot",
                            timestamp: new Date(),
                          };
                          setMessages((prev) => [...prev, botMsg]);
                          setIsTyping(false);
                          setInput("");
                        }, 600 + Math.random() * 800);
                      }, 100);
                    }}
                    className="rounded-full px-3 py-1 text-[11px] font-medium transition-all hover:scale-105"
                    style={{
                      background: "rgba(26, 35, 126, 0.08)",
                      color: "#1a237e",
                    }}
                  >
                    <Sparkles className="inline h-3 w-3 mr-1" style={{ color: "#FFD700" }} />
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 px-3 py-3 flex items-center gap-2" style={{ background: "#fff" }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about routes, stops, timings..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#1a237e] focus:outline-none focus:ring-2 focus:ring-[#1a237e]/10 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition-all disabled:opacity-40 disabled:shadow-none"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, #1a237e, #283593)"
                    : "#e2e8f0",
                }}
              >
                <Send className="h-4 w-4" style={{ color: input.trim() ? "#FFD700" : "#94a3b8" }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
