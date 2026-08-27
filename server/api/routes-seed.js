/**
 * Static route map — mirrors src/data/routes.ts from the DTMS web app.
 * 2026-2027 Academic Year — Updated 24.08.2026
 */

export const COLLEGE = { lat: 12.8846, lng: 80.0742 }; // Dhaanish Ahmed College, Padappai, Chennai

const R = [
  {
    routeNumber: 21, vehicleNumber: "TN 22 BS 3669", driverName: "B.KUTTY", driverPhone: "6379886625", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["PALLAVARAM- YARD", "6:40 AM"], ["CHENNAI ONE", "6:45 AM"], ["KAMATCHI HOSPITAL", "6:50 AM"],
      ["KOVILAMBAKKAM", "6:55 AM"], ["ECHANGADU SIGNAL", "6:56 AM"], ["PALLAVAR GADU", "6:58 AM"],
      ["CHROMPET", "7:00 AM"], ["HASTHINAPURAM", "7:15 AM"], ["SANITORIUM", "7:20 AM"],
      ["GANDHI ROAD", "7:25 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 22, vehicleNumber: "TN 23 J 1653", driverName: "DEVARAJ.P", driverPhone: "9841785153", arrivalTime: "8:00 AM",
    boardingPoints: [
      ["VGP", "6:00 AM"], ["INJAMBAKAM SIGNAL", "6:05 AM"], ["VETTUVANGANI", "6:10 AM"],
      ["PALAVAKKAM", "6:12 AM"], ["KOTTIVAKKAM", "6:15 AM"], ["THIRUVANMAIUR RTO", "6:20 AM"],
      ["THIRUVANMAIUR SIGNAL", "6:22 AM"], ["TARAMANI", "6:25 AM"], ["SRP TOOLS", "6:28 AM"],
      ["BABY NAGAR", "6:32 AM"], ["VIJAYA NAGAR BUS STAND", "6:35 AM"], ["ADAMBAKAM RAILWAY STATION", "6:40 AM"],
      ["PALLIKARANAI", "6:45 AM"], ["JAYACHANDRAN TEX", "6:55 AM"], ["MEDAVAKKAM JUNCTION", "7:00 AM"],
      ["SANTHOSHPURAM", "7:05 AM"], ["GOURI VAKKAM", "7:07 AM"], ["CHEMBAKKAM", "7:10 AM"],
      ["KAMARAJAR PURAM", "7:12 AM"], ["RAJA KEELPAKAM", "7:15 AM"], ["CAMP ROAD", "7:17 AM"],
      ["SELAIYUR POLICE STATION", "7:20 AM"], ["TAMBARAM MCC", "7:25 AM"], ["COLLEGE", "8:00 AM"],
    ],
  },
  {
    routeNumber: 23, vehicleNumber: "TN 22 BS 4250", driverName: "SARAVANAN", driverPhone: "9841251747", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["ENNORE- PARKING", "5:15 AM"], ["GULF OIL", "5:20 AM"], ["MANALI NEW TOWN", "5:30 AM"],
      ["IOC", "5:40 AM"], ["POWER HOUSE BRIDGE", "5:43 AM"], ["KORUKKUPET", "5:50 AM"],
      ["BASIN BRIDGE, PULLIANTHOPE", "6:00 AM"], ["CHEKLI PALAYAM( JAMALIYA)", "6:05 AM"],
      ["OTTERI- POLICE STATION", "6:10 AM"], ["AYNAVARAM/ NOOR HOTEL", "6:15 AM"],
      ["ICF", "6:20 AM"], ["NEW AVADI ROAD", "6:25 AM"], ["ANNA NAGAR WATER TANK", "6:30 AM"],
      ["VILIVAKKAM- NATHAMUNI", "6:35 AM"], ["PADI BRIDGE", "6:37 AM"], ["THIRUMANGALAM", "6:40 AM"],
      ["MUGAPPIAR- GOLDEN FLATS", "6:45 AM"], ["VADUVANKARAI BRIDGE", "6:50 AM"],
      ["MADURAVOYAL- RATION STORE", "6:55 AM"], ["MADURAVOYAL-TOLL GATE", "7:15 AM"],
      ["PERUNGALATHUR", "7:45 AM"], ["MANIVAKKAM", "7:50 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 24, vehicleNumber: "TN 11 F 0286", driverName: "MAGANESH MOHAN", driverPhone: "7358588090", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["ENNORE - PARKING", "5:45 AM"], ["NETHAJI NAGAR", "5:47 AM"], ["BHARATHIYAR NAGAR", "5:50 AM"],
      ["PATNATHAR KOVIL", "5:53 AM"], ["VANNARAPET BEACH KOVIL", "5:55 AM"], ["KASIMEDU", "6:00 AM"],
      ["KALMANDAPAM", "6:02 AM"], ["ROYAPURAM SIGNAL", "6:10 AM"], ["ROYAPURAM BRIDGE", "6:15 AM"],
      ["TAMBUCHETTY STREET", "6:20 AM"], ["STANLEY HOSPITAL", "6:30 AM"], ["MINT BUS STOP", "6:33 AM"],
      ["BHARATHI ARTS COLLEGE", "6:35 AM"], ["MUTHYALPET POLICE STATION", "6:40 AM"], ["MANNADI", "6:42 AM"],
      ["HIGH COURT METRO", "6:45 AM"], ["MOUNT ROAD- MOSQUE", "6:55 AM"], ["D.2 POLICE STATION", "6:57 AM"],
      ["WHITES ROAD", "7:00 AM"], ["THOUSAND LIGHTS", "7:02 AM"], ["CHURCH PARK", "7:05 AM"],
      ["VANAVIL", "7:10 AM"], ["SAIDAPET", "7:15 AM"], ["GUINDY", "7:20 AM"],
      ["ALANDUR METRO", "7:25 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 25, vehicleNumber: "TN 11 F 0076", driverName: "PANEER SELVAM", driverPhone: "8056251091", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["K.V.T PARKING-YARD", "5:30 AM"], ["M.R NAGAR", "5:40 AM"], ["KANNADASAN NAGAR- EB", "5:43 AM"],
      ["BAHARTHI NAGAR", "5:45 AM"], ["AMBEDKAR COLLEGE", "5:50 AM"], ["B.B. ROAD", "5:52 AM"],
      ["JAMALIYA", "5:55 AM"], ["CHEKILI PALAYAM", "6:00 AM"], ["PURASAIVAKKAM", "6:10 AM"],
      ["PERIMET G.1 POLICE STATION", "6:15 AM"], ["DAILY THANTHI OFFICE", "6:17 AM"],
      ["EGMORE (BACK SIDE)", "6:20 AM"], ["DAS PRAKASH- HOTEL", "6:25 AM"], ["SANGAM THEATRE", "6:30 AM"],
      ["EGA THEATRE", "6:33 AM"], ["SKY WALK", "6:40 AM"], ["ARUMBAKKAM -MMDA", "6:45 AM"],
      ["LAKSHMAN SRUTHI –VADAPALNI", "6:50 AM"], ["KASI THEATRE – ZAPARKHAN PETTAI", "6:54 AM"],
      ["SHANTHI PETROL BUNK (AIRPORT OPP)", "7:00 AM"], ["PALLAVARAM-AMMA HOTEL", "7:10 AM"],
      ["SARAVANA STORES- CHROMPET", "7:25 AM"], ["TAMBARAM", "7:25 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 26, vehicleNumber: "TN 11 F 0258", driverName: "PANDIAN", driverPhone: "8838312284", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["JOTHI NAGAR", "5:30 AM"], ["MANALI", "5:40 AM"], ["MATHUR-MMDA", "5:43 AM"],
      ["MATHUR GATE", "5:45 AM"], ["THAPAL PETTI", "5:50 AM"], ["MOOLA KADAI", "5:55 AM"],
      ["SHELL PETROL BUNK", "6:00 AM"], ["MADHAVARAM", "6:10 AM"], ["RETTARI", "6:25 AM"],
      ["SENTHIL NAGAR", "6:35 AM"], ["KOYAMBEDU", "6:40 AM"], ["VADAPALANI", "6:42 AM"],
      ["ASHOK PILLAR", "6:45 AM"], ["KASI THEATRE", "6:52 AM"], ["EKKATUTHANGAL METRO", "6:57 AM"],
      ["ALANDHUR METRO", "7:00 AM"], ["ALANDHUR COURT", "7:03 AM"], ["SHANTHI- PEROL BUNK", "7:07 AM"],
      ["CHROMPET", "7:20 AM"], ["TAMBARAM - SANATORIUM", "7:26 AM"], ["TAMBARAM", "7:30 AM"],
      ["VANDALUR BRIDGE", "7:38 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 28, vehicleNumber: "TN 11 F 0266", driverName: "RAJ KUMAR", driverPhone: "8807005648", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["AVADI-YARD", "6:00 AM"], ["THIRUNINDRAVUR", "6:10 AM"], ["AVADI- CHECK POST", "6:15 AM"],
      ["J.B ESTATE", "6:20 AM"], ["PARUTHIPET", "6:25 AM"], ["KUMANANCHAVADI", "6:30 AM"],
      ["MANGADU", "6:35 AM"], ["PATTUR", "6:40 AM"], ["FOUR ROADS KOLLACHERI", "6:45 AM"],
      ["KUNDRATHUR", "6:50 AM"], ["KUNDRATHUR BYPASS", "6:55 AM"], ["THIRUMUDIVAKKAM BYPASS", "7:00 AM"],
      ["MANNIVAKKAM", "7:20 AM"], ["PADAPPAI", "7:45 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 29, vehicleNumber: "TN 11 T 9910", driverName: "BALAMURUGAN", driverPhone: "8610378819", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["Parking yard", "6:10 AM"], ["MOONGIL MANDABAM", "6:30 AM"], ["KEERAI MANDABAM", "6:32 AM"],
      ["SEVILIMEDU", "6:40 AM"], ["INDHRA PETROL BUNK", "6:45 AM"], ["RANGASAMI KULAM", "7:00 AM"],
      ["PERIYAR NAGAR- TOLL GATE", "7:05 AM"], ["PERIYAR NAGAR", "7:07 AM"], ["AYYAMPETTAI", "7:10 AM"],
      ["RAJAM PETTAI", "7:20 AM"], ["WALAJABAD", "7:25 AM"], ["VANRAVASI", "7:35 AM"],
      ["ORAGADAM- JUNCTION", "7:50 AM"], ["KARANITHANGAL", "7:55 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 30, vehicleNumber: "TN 11 T 9820", driverName: "S. SUBRAMANI", driverPhone: "9962467255", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["CSI SCHOL YARD", "6:15 AM"], ["ITI – COLLECTER OFFICE NEW", "6:40 AM"],
      ["PILAYAR KOIL- COLLECTOR OFFICE", "6:45 AM"], ["G.H HOSPITAL", "6:48 AM"],
      ["RATTINA KINARU", "6:50 AM"], ["VEDACHALAM NAGAR", "6:53 AM"],
      ["CHENGALPATTU NEW BUS STAND", "6:55 AM"], ["CHENGALPATTU OLD BUS STAND", "7:00 AM"],
      ["JSP HOSPITAL", "7:03 AM"], ["AYAPPAN KOVIL", "7:05 AM"], ["PARANUR", "7:10 AM"],
      ["THIRTHERI- BUS STAND", "7:15 AM"], ["S.PKOIL", "7:20 AM"], ["FORD COMPANY", "7:22 AM"],
      ["KATTANKALATHUR", "7:30 AM"], ["MANIVAKKAM", "7:50 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 31, vehicleNumber: "TN 11 T 9808", driverName: "NARAYANAN", driverPhone: "9840306310", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["AVR- PARKING YARD", "5:50 AM"], ["KONIMEDU", "5:55 AM"], ["PADIANLLUR", "6:00 AM"],
      ["RED HILLS", "6:05 AM"], ["VINAYAKAPURAM", "6:10 AM"], ["RETTERI", "6:15 AM"],
      ["KOLATHUR", "6:20 AM"], ["SENTHIL NAGAR", "6:23 AM"], ["PADI BRIDGE", "6:30 AM"],
      ["KOYAMBEDU", "6:35 AM"], ["VADAPALANI", "6:40 AM"], ["ASHOK PILLAR", "6:43 AM"],
      ["KASI THEATRE", "6:45 AM"], ["ALANDUR METRO", "6:50 AM"], ["MEENAMBAKKAM", "7:00 AM"],
      ["PALLAVARAM", "7:10 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 32, vehicleNumber: "TN 19 B 5497", driverName: "RAMU.D", driverPhone: "7338862194", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["PARKING YARD- LIGHT HOUSE", "5:40 AM"], ["SATHYA STUDIO", "5:50 AM"], ["SANTHOME CHURCH", "6:00 AM"],
      ["CITY CENTRE", "6:05 AM"], ["ROYAPTTAH – HOSPITAL", "6:10 AM"], ["MEERSAHABI PETTAI", "6:15 AM"],
      ["ICE HOUSE", "6:20 AM"], ["TRIPLICANE", "6:40 AM"], ["KOTTURUPURAM", "6:50 AM"],
      ["RATHNA CAFÉ", "7:00 AM"], ["WALAJAH ROAD", "7:05 AM"], ["PUDUPET MARKT", "7:10 AM"],
      ["GEMINI", "7:15 AM"], ["TEYNAMPET – ILAYANAR KOIL", "7:20 AM"], ["SAIDAPET", "7:25 AM"],
      ["THIRSULAM-AIRPORT", "7:35 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 33, vehicleNumber: "TN 19 Y 0381", driverName: "NAAINAR", driverPhone: "9677223360", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["KVT PARKING", "5:45 AM"], ["BRINDHA THETARE", "5:50 AM"], ["PERAMBUR REVATHI", "5:55 AM"],
      ["D.R.B.C.C SCHOOL", "6:00 AM"], ["CHEMBIYAN POLICE STYATION", "6:05 AM"], ["VENUS BUS STOP", "6:10 AM"],
      ["AGARAM JUNCTION", "6:12 AM"], ["ANNA SALAI DON BOSCO", "6:15 AM"],
      ["WELDING SHOP- PAPER MILS ROAD", "6:17 AM"], ["MUGAMBIKAI- KOLATHUR", "6:20 AM"],
      ["RETTARI", "6:25 AM"], ["KALLIKUPPAM", "6:30 AM"], ["AMBATHUR OT-BUS STOP", "6:35 AM"],
      ["AMBATHUR DULHUB", "6:40 AM"], ["TELEPHONE EXCHANGE", "6:45 AM"], ["DECALTHON", "6:47 AM"],
      ["MADURAVOYAL TOLL", "6:52 AM"], ["CHETTIAR VANAGARAM", "6:56 AM"], ["PORUR - TOLL GATE", "7:00 AM"],
      ["PERUNGALUTHUR", "7:20 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 34, vehicleNumber: "TN 22 BW 9344", driverName: "GUNA SEKAR / SENTHIL", driverPhone: "9500184954", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["KELAMBAKKAM", "6:45 AM"], ["VIT-COLLEGE", "6:55 AM"], ["KANDIGAI", "7:00 AM"],
      ["RATHNAMANGALAM", "7:15 AM"], ["KOLAPAKKAM", "7:20 AM"], ["VANDALUR-ZOO", "7:30 AM"],
      ["MANIVAKKAM HIGH SCHOOL", "7:35 AM"], ["MANIVAKKAM- JUNCTION", "7:40 AM"],
      ["PADAPPAI", "8:00 AM"], ["SALAMANGALAM", "8:03 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 35, vehicleNumber: "TN 21 AF 9425", driverName: "PEACHAIMUTHU.S", driverPhone: "8122144490", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["PALLAVARAM", "6:30 AM"], ["ATTU THOTTI", "6:35 AM"], ["POZHICHALUR", "6:45 AM"],
      ["PAMMAL", "7:00 AM"], ["ANAKA PUTHUR", "7:10 AM"], ["METHA NAGAR", "7:15 AM"],
      ["KUNDRATHUR", "7:25 AM"], ["MUDICHUR- ATTA COMPANY", "7:35 AM"], ["MANNIVAKKAM", "7:45 AM"],
      ["RUBY BUILDING", "7:47 AM"], ["PADAPPAI- BUS STOP – (FLY OVER DOWN)", "7:50 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 36, vehicleNumber: "TN 21 AF 9363", driverName: "SELVA KUMAR", driverPhone: "9094820716", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["KPN SUPER STORE (MAPPEDU)", "7:05 AM"], ["MRF TYRE MGR NAGAR", "7:10 AM"],
      ["CAMP ROAD JUNTION", "7:15 AM"], ["POONDI BAJAAR", "7:20 AM"], ["MUDICHUR KOLAM", "7:25 AM"],
      ["BARATHI NAGAR SIGNAL", "7:30 AM"], ["BARATHI NAGAR BUS STOP", "7:35 AM"],
      ["ATTA COMPANY MUDICHUR", "7:37 AM"], ["MUDICHUR CHURCH", "7:40 AM"],
      ["MANNIVAKKAM JUNTION", "7:45 AM"], ["RUBY", "7:48 AM"], ["KEEL PADAPPAI", "7:50 AM"],
      ["PADAPPAI- BUS STOP", "7:53 AM"], ["SALAMANGALA BUS STOP", "8:00 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 37, vehicleNumber: "TN 21 Z 7556", driverName: "SELLA THURAI", driverPhone: "9840061417", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["RETTERI", "6:00 AM"], ["PORUR SIGNAL", "6:40 AM"], ["PORUR BUS STOP", "6:45 AM"],
      ["MUGALIVAKKAM", "6:50 AM"], ["RAMAPURAM", "6:55 AM"], ["MIOT", "6:57 AM"],
      ["BUT ROAD", "7:00 AM"], ["ALANDUR METRO", "7:10 AM"], ["MEENAMBAKKAM", "7:15 AM"],
      ["TAMBARAM", "7:25 AM"], ["PERUNGALATHUR", "7:30 AM"], ["MANIVAKKAM JUNCTION", "7:40 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 38, vehicleNumber: null, driverName: "GUNA SEKHAR", driverPhone: "9500184954", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["URAPAKKAM", "7:30 AM"], ["URAPAKKAM SCHOOL STOP", "7:40 AM"],
      ["URAPAKKAM TEA SHOP (KOMALAS HOTEL)", "7:45 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 39, vehicleNumber: null, driverName: "RANJITH KUMAR", driverPhone: "6382344081", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["MARAIMALANAGAR", "7:20 AM"], ["SRM UNIVERSITY", "7:25 AM"], ["THAILAVARAM", "7:30 AM"],
      ["GUDUVANCHERY", "7:35 AM"], ["GUDUVANCHERY EB", "7:40 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 40, vehicleNumber: null, driverName: "SURESH KUMAR", driverPhone: "6384119283", arrivalTime: "8:00 AM",
    boardingPoints: [
      ["SIRUKAVERIPAKKAM", "6:25 AM"], ["EB AVENUE", "6:27 AM"], ["OLI MUHAMMED PETTAI", "6:30 AM"],
      ["SANKARA MADAM", "6:35 AM"], ["BUS STAND", "6:40 AM"], ["POOKADAI CHATHIRAM", "6:42 AM"],
      ["KAMALATHERU", "6:45 AM"], ["PONNERI KARAI", "6:48 AM"], ["SUNGUVACHATHIRAM", "7:15 AM"],
      ["SRIPERUMBATUR", "7:30 AM"], ["ORAGADAM", "7:45 AM"], ["KARANITHANGAL", "7:50 AM"],
      ["SERPENANCHERY", "7:55 AM"], ["COLLEGE", "8:00 AM"],
    ],
  },
];

function timeToMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t).trim());
  if (!m) return 8 * 60;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

/**
 * Synthesize approx GPS coordinates along a plausible path from the first stop
 * toward the college. Used for the demo live-map overlay.
 */
function buildRoutePoints(boardingPoints) {
  return boardingPoints.map(([name, time], i, arr) => {
    if (name === "COLLEGE") return { name, time, lat: COLLEGE.lat, lng: COLLEGE.lng };
    const t = timeToMinutes(time);
    const ratio = i / Math.max(1, arr.length - 1); // 0 at first stop → 1 at college
    const spread = 0.22;
    const jitter = ((i * 37 + name.length) % 6) * 0.002;
    return {
      name,
      time,
      lat: COLLEGE.lat + spread * (1 - ratio) * 1.0 + jitter * ((i % 2 === 0) ? 1 : -1),
      lng: COLLEGE.lng - spread * (1 - ratio) * 0.4 + jitter,
    };
  });
}

// Build full route records with coordinates + a polyline path for the map.
export function allRoutes() {
  return R.map((r) => {
    const points = buildRoutePoints(r.boardingPoints);
    return {
      id: `route-${r.routeNumber}`,
      routeNumber: r.routeNumber,
      vehicleNumber: r.vehicleNumber || "",
      driverName: r.driverName || "",
      driverPhone: r.driverPhone,
      arrivalTime: r.arrivalTime,
      boardingPoints: points,
      stops: r.boardingPoints.map(([name, time]) => ({ name, time })),
      path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
      active: true,
      createdAt: Date.now(),
    };
  });
}
