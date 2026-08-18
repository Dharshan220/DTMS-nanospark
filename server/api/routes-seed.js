/**
 * Static route map — mirrors src/data/routes.ts from the DTMS web app.
 */

export const COLLEGE = { lat: 12.8846, lng: 80.0742 }; // Dhaanish Ahmed College, Padappai, Chennai

const R = [
  {
    routeNumber: 21, vehicleNumber: "TN 22 BS 3669", driverName: "B. KUTTY", driverPhone: "6379826625", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["CHENNAI ONE", "6:20 AM"], ["KAMATCHI HOSPITAL", "6:25 AM"], ["KOVILAMBAKKAM", "6:40 AM"],
      ["PALLAVARAM YARD", "6:45 AM"], ["ECHANGADU SIGNAL", "6:45 AM"], ["PALLAVAR GADU", "6:47 AM"],
      ["HASTHINAPURAM", "6:58 AM"], ["SANITORIUM", "7:05 AM"], ["GANDHI ROAD", "7:10 AM"],
      ["KRISHNA NAGAR", "7:20 AM"], ["BHARTHI NAGAR", "7:30 AM"], ["MUDICHUR", "7:35 AM"],
      ["MANIVAKKAM JUNCTION", "7:45 AM"], ["PADAPPAI", "7:55 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 22, vehicleNumber: "TN 23 J 1653", driverName: "DEVARAJ P", driverPhone: "9841785153", arrivalTime: "8:00 AM",
    boardingPoints: [
      ["VGP", "5:45 AM"], ["INJAMBAKAM SIGNAL", "5:50 AM"], ["VETTUVANGANI", "5:55 AM"],
      ["PALAVAKKAM", "5:57 AM"], ["KOTTIVAKKAM", "6:00 AM"], ["THIRUVANMAIUR RTO", "6:02 AM"],
      ["THIRUVANMAIUR SIGNAL", "6:05 AM"], ["TARAMANI", "6:08 AM"], ["MADHIYA KAILASH", "6:10 AM"],
      ["SRP TOOLS", "6:15 AM"], ["BABY NAGAR", "6:20 AM"], ["VIJAYA NAGAR BUS STAND", "6:22 AM"],
      ["ADAMBAKAM RAILWAY STATION", "6:25 AM"], ["PALLIKARANAI", "6:45 AM"], ["JAYACHANDRAN TEX", "6:55 AM"],
      ["MEDAVAKKAM JUNCTION", "7:00 AM"], ["SANTHOSHPURAM", "7:05 AM"], ["GOURI VAKKAM", "7:07 AM"],
      ["CHEMBAKKAM", "7:10 AM"], ["KAMARAJAR PURAM", "7:12 AM"], ["RAJA KEELPAKAM", "7:15 AM"],
      ["CAMP ROAD", "7:17 AM"], ["SELAIYUR POLICE STATION", "7:20 AM"], ["TAMBARAM MCC", "7:25 AM"],
      ["COLLEGE", "8:00 AM"],
    ],
  },
  {
    routeNumber: 23, vehicleNumber: "TN 22 BS 4250", driverName: "JAIKAR E", driverPhone: "9884888497", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["ENNORE PARKING", "5:20 AM"], ["IOC", "5:50 AM"], ["POWER HOUSE BRIDGE", "5:53 AM"],
      ["KORUKKUPET", "5:55 AM"], ["BASIN BRIDGE PULLIANTHOPE", "6:15 AM"], ["OTTERI POLICE STATION", "6:20 AM"],
      ["AYNAVARAM", "6:25 AM"], ["ICF", "6:27 AM"], ["NEW AVADI ROAD", "6:30 AM"],
      ["VILIVAKKAM NATHAMUNI", "6:35 AM"], ["PADI BRIDGE", "6:37 AM"], ["THIRUMANGALAM", "6:40 AM"],
      ["MUGAPPIAR GOLDEN FLATS", "6:45 AM"], ["VADUVANKARAI BRIDGE", "6:50 AM"], ["MADURAVOYAL RATION STORE", "6:55 AM"],
      ["MADURAVOYAL TOLL GATE", "6:57 AM"], ["PERUNGALATHUR", "7:30 AM"], ["MANIVAKKAM", "7:45 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 24, vehicleNumber: "TN 11 F 0286", driverName: "MUNIYANDI", driverPhone: "9840997947", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["ENNORE PARKING", "5:40 AM"], ["NETHAJI NAGAR", "5:42 AM"], ["BHARATHIYAR NAGAR", "5:45 AM"],
      ["PATNATHAR KOVIL", "5:50 AM"], ["VANNARAPET BEACH KOVIL", "5:55 AM"], ["KASIMEDU", "6:00 AM"],
      ["KALMANDAPAM", "6:02 AM"], ["ROYAPURAM SIGNAL", "6:05 AM"], ["ROYAPURAM BRIDGE", "6:10 AM"],
      ["TAMBUCHETTY STREET", "6:12 AM"], ["STANLEY HOSPITAL", "6:14 AM"], ["MINT BUS STOP", "6:15 AM"],
      ["BHARATHI ARTS COLLEGE", "6:17 AM"], ["MUTHYALPET POLICE STATION", "6:20 AM"], ["MANNADI", "6:25 AM"],
      ["HIGH COURT METRO", "6:27 AM"], ["THALAMAI SAILAGAM METRO", "6:30 AM"], ["MOUNT ROAD MOSQUE", "6:35 AM"],
      ["D.2 POLICE STATION", "6:37 AM"], ["WHITES ROAD", "6:39 AM"], ["THOUSAND LIGHTS", "6:40 AM"],
      ["CHURCH PARK", "6:42 AM"], ["VANAVIL", "6:45 AM"], ["SAIDAPET", "6:50 AM"],
      ["GUINDY", "6:55 AM"], ["ALANDUR METRO", "7:00 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 25, vehicleNumber: "TN 11 F 0076", driverName: "UDHAYAKUMAR B", driverPhone: "9940330284", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["K.V.T PARKING YARD", "5:30 AM"], ["M.R NAGAR", "5:40 AM"], ["KANNADASAN NAGAR EB", "5:43 AM"],
      ["BAHARTHI NAGAR", "5:45 AM"], ["AMBEDKAR COLLEGE", "5:50 AM"], ["B.B. ROAD", "5:52 AM"],
      ["JAMALIYA", "5:55 AM"], ["CHEKILI PALAYAM", "6:00 AM"], ["PURASAIVAKKAM", "6:10 AM"],
      ["PERIMET G.1 POLICE STATION", "6:15 AM"], ["DAILY THANTHI OFFICE", "6:17 AM"], ["EGMORE (BACK SIDE)", "6:20 AM"],
      ["DAS PRAKASH HOTEL", "6:25 AM"], ["SANGAM THEATRE", "6:30 AM"], ["EGA THEATRE", "6:33 AM"],
      ["SKY WALK", "6:40 AM"], ["ARUMBAKKAM MMDA", "6:45 AM"], ["LAKSHMAN SRUTHI VADAPALANI", "6:50 AM"],
      ["KASI THEATRE ZAPARKHAN PETTAI", "6:54 AM"], ["SHANTHI PETROL BUNK (AIRPORT OPP)", "7:00 AM"],
      ["PALLAVARAM AMMA HOTEL", "7:10 AM"], ["SARAVANA STORES CHROMPET", "7:25 AM"], ["TAMBARAM", "7:25 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 26, vehicleNumber: "TN 11 F 0258", driverName: "MANIKANDAN T", driverPhone: "9176046241", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["JOTHI NAGAR", "5:30 AM"], ["MANALI", "5:40 AM"], ["MATHUR MMDA", "5:43 AM"],
      ["MATHUR GATE", "5:45 AM"], ["THAPAL PETTI", "5:50 AM"], ["MOOLA KADAI", "5:55 AM"],
      ["SHELL PETROL BUNK", "6:00 AM"], ["MADHAVARAM", "6:10 AM"], ["PORUR BRIDGE", "6:25 AM"],
      ["VALASARAWAKKAM IDFC BANK", "6:35 AM"], ["MEGA MART", "6:40 AM"], ["VIRUGAMBAKKAM", "6:42 AM"],
      ["AVICHI SCHOOL", "6:45 AM"], ["KASI THEATRE", "6:52 AM"], ["EKKATUTHANGAL METRO", "6:57 AM"],
      ["ALANDHUR METRO", "7:00 AM"], ["ALANDHUR COURT", "7:03 AM"], ["SHANTHI PETROL BUNK", "7:07 AM"],
      ["CHROMPET", "7:20 AM"], ["TAMBARAM SANATORIUM", "7:26 AM"], ["TAMBARAM", "7:30 AM"],
      ["VANDALUR BRIDGE", "7:38 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 28, vehicleNumber: "TN 11 F 0266", driverName: "PALANI S", driverPhone: "6382206921", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["AVADI YARD", "5:45 AM"], ["AVADI CHECK POST", "5:50 AM"], ["J.B ESTATE", "6:05 AM"],
      ["PARUTHIPET", "6:10 AM"], ["KUMANANCHAVADI", "6:20 AM"], ["MANGADU", "6:25 AM"],
      ["PATTUR", "6:35 AM"], ["FOUR ROADS KOLLACHERI", "6:40 AM"], ["KUNDRATHUR", "6:45 AM"],
      ["MEHTA NAGAR", "6:47 AM"], ["ANAKAPUTHUR", "6:50 AM"], ["PAMMAL", "6:55 AM"],
      ["AATUTHOTTI", "7:15 AM"], ["PALLAVARAM BUS STAND", "7:20 AM"], ["TAMBARAM", "7:35 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 29, vehicleNumber: "TN 11 T 9910", driverName: "BALAMURUGAN", driverPhone: "8610378819", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["PARKING YARD", "6:10 AM"], ["OLI MOHAMMED PETTAI", "6:20 AM"], ["KAMALATHERU", "6:25 AM"],
      ["POOKADAI CHATHIRAM", "6:27 AM"], ["MOONGIL MANDABAM", "6:30 AM"], ["KEERAI MANDABAM", "6:32 AM"],
      ["SEVILIMEDU", "6:40 AM"], ["INDHRA PETROL BUNK", "6:45 AM"], ["BUS STAND", "6:55 AM"],
      ["RANGASAMI KULAM", "7:00 AM"], ["PERIYAR NAGAR TOLL GATE", "7:05 AM"], ["PERIYAR NAGAR", "7:07 AM"],
      ["AYYA PETTAI", "7:10 AM"], ["RAJAM PETTAI", "7:20 AM"], ["WALAJABAD", "7:25 AM"],
      ["VANRAVASI", "7:35 AM"], ["ORAGADAM JUNCTION", "7:50 AM"], ["KARANITHANGAL", "7:55 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 30, vehicleNumber: "TN 11 T 9820", driverName: "S. JANAKIRAMAN", driverPhone: "9578616178", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["CSI SCHOOL YARD", "6:15 AM"], ["ITI COLLECTOR OFFICE NEW", "6:40 AM"], ["PILAYAR KOIL COLLECTOR OFFICE", "6:45 AM"],
      ["G.H HOSPITAL", "6:48 AM"], ["RATTINA KINARU", "6:50 AM"], ["VEDACHALAM NAGAR", "6:53 AM"],
      ["CHENGALPATTU NEW BUS STAND", "6:55 AM"], ["CHENGALPATTU OLD BUS STAND", "7:00 AM"], ["JSP HOSPITAL", "7:03 AM"],
      ["AYAPPAN KOVIL", "7:05 AM"], ["PARANUR", "7:10 AM"], ["THIRTHERI BUS STAND", "7:15 AM"],
      ["S.P KOIL", "7:20 AM"], ["FORD COMPANY", "7:22 AM"], ["MARAIMALAI NAGAR", "7:25 AM"],
      ["KATTANKALATHUR", "7:30 AM"], ["SRM UNIVERSITY", "7:32 AM"], ["THAILAVARAM", "7:35 AM"],
      ["GUDUVANCHERRY BUS STAND", "7:37 AM"], ["MANIVAKKAM", "7:50 AM"], ["PADAPPAI", "8:00 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 31, vehicleNumber: "TN 11 T 9808", driverName: "BALAJI K", driverPhone: "7845960028", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["AVR PARKING YARD", "5:30 AM"], ["KONIMEDU", "5:40 AM"], ["PADIANLLUR", "6:00 AM"],
      ["RED HILLS", "6:05 AM"], ["VINAYAKAPURAM", "6:10 AM"], ["RETTERI", "6:15 AM"],
      ["KOLATHUR", "6:20 AM"], ["SENTHIL NAGAR", "6:23 AM"], ["KORATUR", "6:30 AM"],
      ["KOYAMBEDU", "6:35 AM"], ["VADAPALANI", "6:40 AM"], ["ASHOK PILLAR", "6:43 AM"],
      ["KASI THEATRE", "6:45 AM"], ["ALANDUR METRO", "6:50 AM"], ["MEENAMBAKKAM", "7:00 AM"],
      ["CHROMPET", "7:10 AM"], ["TAMBARAM", "7:20 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 32, vehicleNumber: "TN 19 B 5497", driverName: "RAMU D", driverPhone: "7338862194", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["PARKING YARD LIGHT HOUSE", "5:45 AM"], ["SATHYA STUDIO", "5:50 AM"], ["SANTHOME CHURCH", "5:55 AM"],
      ["CITY CENTRE", "6:00 AM"], ["ROYAPETTAH HOSPITAL", "6:05 AM"], ["MEERSAHABI PETTAI", "6:10 AM"],
      ["TRIPLICANE", "6:20 AM"], ["RATHNA CAFE", "6:23 AM"], ["ICE HOUSE", "6:25 AM"],
      ["WALAJAH ROAD", "6:25 AM"], ["PUDUPET MARKET", "6:30 AM"], ["GEMINI", "6:45 AM"],
      ["TEYNAMPET ILAYANAR KOIL", "6:55 AM"], ["SAIDAPET", "7:00 AM"], ["THIRSULAM AIRPORT", "7:15 AM"],
      ["CHROMPET SARAVANA STORE", "7:25 AM"], ["SANITORIUM BRIDGE", "7:30 AM"], ["POONDI BAZAR", "7:30 AM"],
      ["MCC EAST TAMBARAM", "7:38 AM"], ["PERUNGALATHUR", "7:42 AM"], ["VANDALUR BRIDGE", "7:45 AM"],
      ["KARASANGAL", "7:48 AM"], ["PADAPPAI", "7:55 AM"], ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 33, vehicleNumber: "TN 19 Y 0381", driverName: "PAULRAJ S", driverPhone: "9710232726", arrivalTime: "8:05 AM",
    boardingPoints: [
      ["KVT PARKING", "5:30 AM"], ["BRINDHA THEATRE", "5:35 AM"], ["PERAMBUR REVATHI", "5:38 AM"],
      ["D.R.B.C.C SCHOOL", "5:40 AM"], ["CHEMBIYAN POLICE STATION", "5:42 AM"], ["VENUS BUS STOP", "5:45 AM"],
      ["AGARAM JUNCTION", "5:48 AM"], ["ANNA SALAI DON BOSCO", "5:50 AM"], ["WELDING SHOP PAPER MILLS ROAD", "5:52 AM"],
      ["MUGAMBIKAI KOLATHUR", "5:55 AM"], ["RETTERI", "6:00 AM"], ["KALLIKUPPAM", "6:15 AM"],
      ["AMBATHUR OT BUS STOP", "6:20 AM"], ["AMBATHUR DULHUB", "6:25 AM"], ["TELEPHONE EXCHANGE", "6:28 AM"],
      ["MADURAVOYAL TOLL", "6:35 AM"], ["CHETTIAR VANAGARAM", "6:38 AM"], ["PORUR BUS STOP", "6:42 AM"],
      ["MUGALIWAKAM", "6:45 AM"], ["RAMAPURAM", "6:50 AM"], ["BUTT ROAD", "6:55 AM"],
      ["ALANDUR METRO", "7:05 AM"], ["TAMBARAM", "7:30 AM"], ["PERUNGALUTHUR", "7:40 AM"],
      ["COLLEGE", "8:05 AM"],
    ],
  },
  {
    routeNumber: 34, vehicleNumber: "TN 22 BW 9344", driverName: "GUNASEKARAN K", driverPhone: "9500184954", arrivalTime: "8:10 AM",
    boardingPoints: [
      ["COLOURS INDIAN SCHOOL YARD", "6:45 AM"], ["VIT COLLEGE", "6:55 AM"], ["KANDIGAI", "7:00 AM"],
      ["KOLAPAKKAM", "7:05 AM"], ["GUDUVANCHERY MARKET", "7:25 AM"], ["GUDUVANCHERY EB", "7:28 AM"],
      ["URAPAKKAM TEA SHOP", "7:35 AM"], ["URAPAKKAM SCHOOL STOP", "7:38 AM"], ["VANDALUR ZOO", "7:45 AM"],
      ["MANIVAKKAM JUNCTION", "7:50 AM"], ["RUBY BUILDING", "7:55 AM"], ["KARASANGAL", "7:58 AM"],
      ["PADAPPAI", "8:00 AM"], ["SALAMANGALAM", "8:03 AM"], ["COLLEGE", "8:10 AM"],
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
      vehicleNumber: r.vehicleNumber || r.vehicle,
      driverName: r.driverName || r.driver,
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