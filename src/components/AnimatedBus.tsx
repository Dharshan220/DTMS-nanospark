export default function AnimatedBus() {
  return (
    <div style={{ width: "100%", height: "420px", position: "relative", overflow: "hidden" }}>
      <style>{`
        .bus-scene { width: 100%; height: 420px; position: relative; display: flex; align-items: flex-end; background: #87CEEB; }
        .bus-background { position: absolute; inset: 0; background: linear-gradient(180deg, #87CEEB 0%, #B8E6F0 40%, #E8F4F8 70%, #e0ddd5 84%); width: 100%; height: 100%; }

        /* College building silhouette */
        .college-bg { position: absolute; bottom: 22%; left: 0; right: 0; }

        .bus-road { position: absolute; bottom: 0; width: 100%; height: 22%; background: linear-gradient(180deg, #555 0%, #444 100%); z-index: 2; }
        .bus-road-line { position: absolute; top: 50%; width: 100%; height: 6px; background: repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 60px, transparent 60px, transparent 100px); animation: busRoadMove 0.5s linear infinite; }
        @keyframes busRoadMove { from { background-position: 0 0; } to { background-position: -100px 0; } }

        .bus-wrap { position: absolute; bottom: 22%; left: -420px; z-index: 10; animation: busDrive 8s ease-in-out infinite; }
        @keyframes busDrive { 0% { left: -420px; } 85% { left: 110%; } 100% { left: 110%; } }

        .bus { width: 380px; height: 130px; position: relative; }
        .bus-body { position: absolute; top: 0; left: 20px; width: 350px; height: 105px; background: linear-gradient(180deg, #FFD700 0%, #FFC200 100%); border-radius: 12px 16px 6px 6px; border: 2px solid #CC9900; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .bus-front { position: absolute; top: 10px; right: -22px; width: 40px; height: 75px; background: linear-gradient(180deg, #FFD700, #FFC200); border-radius: 4px 14px 10px 4px; border: 2px solid #CC9900; border-left: none; }
        .windshield { position: absolute; top: 12px; right: -18px; width: 28px; height: 32px; background: linear-gradient(135deg, #B3E5FC, #81D4FA); border-radius: 4px 10px 6px 4px; border: 1.5px solid #0288D1; }

        .bus-windows { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; }
        .bus-window { width: 52px; height: 45px; background: linear-gradient(135deg, #B3E5FC 0%, #E1F5FE 100%); border-radius: 5px; border: 2px solid #0277BD; overflow: hidden; display: flex; align-items: center; justify-content: center; }

        .face { width: 34px; height: 38px; position: relative; }
        .face-circle { width: 30px; height: 30px; border-radius: 50%; position: absolute; top: 4px; left: 2px; }
        .face-hair { position: absolute; top: 2px; left: 4px; width: 24px; height: 10px; border-radius: 50% 50% 0 0; }
        .face-eyes { position: absolute; top: 13px; left: 6px; display: flex; gap: 6px; }
        .eye { width: 5px; height: 5px; background: #222; border-radius: 50%; }
        .face-smile { position: absolute; bottom: 5px; left: 9px; width: 12px; height: 5px; border-bottom: 2px solid #555; border-radius: 0 0 10px 10px; }

        .bus-label { position: absolute; bottom: 14px; left: 10px; width: 328px; background: #003399; color: white; font-size: 9px; font-weight: bold; font-family: Arial, sans-serif; padding: 3px 6px; border-radius: 3px; text-align: center; letter-spacing: 0.5px; }

        .bus-route { position: absolute; top: 8px; right: 8px; background: #1a237e; color: #FFD700; font-size: 8px; font-weight: 900; padding: 3px 7px; border-radius: 4px; font-family: Arial, sans-serif; }

        .wheel { position: absolute; bottom: -20px; width: 46px; height: 46px; background: radial-gradient(circle at 40% 40%, #555, #111); border-radius: 50%; border: 3px solid #888; animation: busWheelSpin 0.4s linear infinite; }
        .wheel::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 18px; height: 18px; background: #999; border-radius: 50%; border: 2px solid #666; }
        .wheel-front { left: 280px; }
        .wheel-back { left: 42px; }
        @keyframes busWheelSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .bus-door { position: absolute; top: 15px; left: 280px; width: 28px; height: 55px; background: rgba(0,0,0,0.1); border: 1.5px solid #CC9900; border-radius: 3px; }

        .puff { position: absolute; bottom: 10px; right: -30px; display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
        .puff span { display: block; width: 14px; height: 14px; background: rgba(200,200,200,0.6); border-radius: 50%; animation: busPuffOut 0.8s ease-out infinite; }
        .puff span:nth-child(2) { animation-delay: 0.2s; width: 10px; height: 10px; }
        .puff span:nth-child(3) { animation-delay: 0.4s; width: 7px; height: 7px; }
        @keyframes busPuffOut { 0% { opacity: 0.7; transform: translateX(0) scale(1); } 100% { opacity: 0; transform: translateX(20px) scale(2); } }

        .bus-title-overlay { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); z-index: 20; text-align: center; background: rgba(26,35,126,0.85); padding: 8px 22px; border-radius: 999px; backdrop-filter: blur(4px); border: 1px solid rgba(255,215,0,0.3); animation: busFloat 2.5s ease-in-out infinite; white-space: nowrap; }
        .bus-title-overlay h1 { font-family: sans-serif; font-size: 0.75rem; color: #FFD700; letter-spacing: 1px; font-weight: 900; }
        @keyframes busFloat { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-4px); } }

        /* Sun */
        .bus-sun { position: absolute; top: 20px; right: 120px; width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle, #FFF9C4, #FFD700); box-shadow: 0 0 40px 14px rgba(255,215,0,0.28); animation: busSunPulse 4s ease-in-out infinite; }
        @keyframes busSunPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }

        /* Gate on the right */
        .bus-gate { position: absolute; bottom: 22%; right: 16px; z-index: 5; }

        /* Clouds */
        .cloud1 { position: absolute; top: 30px; animation: cloudMove1 28s linear infinite; }
        .cloud2 { position: absolute; top: 70px; animation: cloudMove2 36s linear infinite; opacity: 0.7; }
        @keyframes cloudMove1 { from { left: -200px; } to { left: 110%; } }
        @keyframes cloudMove2 { from { left: -300px; } to { left: 110%; } }
      `}</style>

      <div className="bus-scene">
        <div className="bus-background" />

        {/* Sun */}
        <div className="bus-sun" />

        {/* Clouds */}
        <div className="cloud1">
          <svg width="130" height="50" viewBox="0 0 130 50" fill="white" opacity="0.85">
            <ellipse cx="65" cy="30" rx="50" ry="18"/><ellipse cx="38" cy="22" rx="32" ry="16"/><ellipse cx="92" cy="25" rx="28" ry="13"/>
          </svg>
        </div>
        <div className="cloud2">
          <svg width="100" height="38" viewBox="0 0 100 38" fill="white">
            <ellipse cx="50" cy="24" rx="40" ry="13"/><ellipse cx="30" cy="17" rx="25" ry="12"/><ellipse cx="72" cy="19" rx="22" ry="10"/>
          </svg>
        </div>

        {/* College building silhouette */}
        <svg className="college-bg" style={{ position: "absolute", bottom: "22%", left: 0, width: "100%", height: "200px" }} viewBox="0 0 1400 200" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="bldgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8daea"/>
              <stop offset="100%" stopColor="#b0c4d8"/>
            </linearGradient>
          </defs>
          {/* Main building */}
          <rect x="450" y="20" width="500" height="180" fill="url(#bldgGrad)"/>
          <rect x="580" y="0" width="240" height="40" rx="3" fill="#a8c0d0"/>
          <rect x="470" y="28" width="460" height="22" rx="3" fill="#1a237e"/>
          <text x="700" y="40" textAnchor="middle" fill="#FFD700" fontSize="10" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">DHAANISH AHMED COLLEGE OF ENGINEERING</text>
          {[468,506,544,582,620,658,696,734,772,810,848,886].map((x: number, i: number) => (
            <g key={i}>
              <rect x={x} y="65" width="20" height="26" rx="2" fill="#b3d4f0" opacity="0.7"/>
              <rect x={x} y="108" width="20" height="26" rx="2" fill="#b3d4f0" opacity="0.7"/>
              <rect x={x} y="151" width="20" height="26" rx="2" fill="#b3d4f0" opacity="0.7"/>
            </g>
          ))}
          {/* Wings */}
          <rect x="150" y="70" width="300" height="130" fill="url(#bldgGrad)" opacity="0.8"/>
          <rect x="950" y="70" width="300" height="130" fill="url(#bldgGrad)" opacity="0.8"/>
          {[162,196,230,264,298,332,366,400].map((x: number, i: number) => (
            <g key={i}><rect x={x} y="90" width="18" height="22" rx="2" fill="#b3d4f0" opacity="0.6"/><rect x={x} y="128" width="18" height="22" rx="2" fill="#b3d4f0" opacity="0.6"/></g>
          ))}
          {[962,996,1030,1064,1098,1132,1166,1200].map((x: number, i: number) => (
            <g key={i}><rect x={x} y="90" width="18" height="22" rx="2" fill="#b3d4f0" opacity="0.6"/><rect x={x} y="128" width="18" height="22" rx="2" fill="#b3d4f0" opacity="0.6"/></g>
          ))}
          <rect x="0" y="190" width="1400" height="10" fill="#d4c8b0"/>
        </svg>

        {/* Entrance Gate */}
        <div className="bus-gate">
          <svg width="220" height="200" viewBox="0 0 220 200" fill="none">
            <rect x="0" y="192" width="220" height="8" rx="2" fill="#c8b896"/>
            <rect x="2" y="30" width="24" height="164" rx="2" fill="#f0e8d8"/>
            <rect x="0" y="24" width="30" height="8" rx="2" fill="#e8dcc8"/>
            <circle cx="14" cy="7" r="6" fill="#FFD700"/>
            <circle cx="14" cy="7" r="11" fill="#FFD700" opacity="0.2"/>
            <rect x="194" y="30" width="24" height="164" rx="2" fill="#f0e8d8"/>
            <rect x="190" y="24" width="30" height="8" rx="2" fill="#e8dcc8"/>
            <circle cx="206" cy="7" r="6" fill="#FFD700"/>
            <circle cx="206" cy="7" r="11" fill="#FFD700" opacity="0.2"/>
            <path d="M2 55 Q110 -18 218 55" stroke="#1a237e" strokeWidth="15" fill="none"/>
            <path d="M2 55 Q110 -10 218 55" stroke="#FFD700" strokeWidth="4" fill="none"/>
            <text x="110" y="30" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="900" fontFamily="sans-serif">DHAANISH AHMED</text>
            <text x="110" y="44" textAnchor="middle" fill="white" fontSize="6" fontFamily="sans-serif">COLLEGE OF ENGINEERING</text>
            <rect x="86" y="60" width="48" height="30" rx="5" fill="#1a237e" stroke="#FFD700" strokeWidth="1.5"/>
            <text x="110" y="80" textAnchor="middle" fill="#FFD700" fontSize="16" fontWeight="900" fontFamily="sans-serif">DC</text>
            <rect x="72" y="96" width="76" height="14" rx="4" fill="#FFD700"/>
            <text x="110" y="107" textAnchor="middle" fill="#1a237e" fontSize="8" fontWeight="900" fontFamily="sans-serif">WELCOME</text>
            {[30,46,62].map((x: number, i: number) => <line key={i} x1={x} y1="55" x2={x} y2="192" stroke="#9e8c6c" strokeWidth="2.5"/>)}
            {[158,174,190].map((x: number, i: number) => <line key={i} x1={x} y1="55" x2={x} y2="192" stroke="#9e8c6c" strokeWidth="2.5"/>)}
            <line x1="74" y1="55" x2="74" y2="93" stroke="#9e8c6c" strokeWidth="2.5"/>
            <line x1="146" y1="55" x2="146" y2="93" stroke="#9e8c6c" strokeWidth="2.5"/>
            <line x1="74" y1="113" x2="74" y2="192" stroke="#9e8c6c" strokeWidth="2.5"/>
            <line x1="146" y1="113" x2="146" y2="192" stroke="#9e8c6c" strokeWidth="2.5"/>
            <line x1="14" y1="125" x2="74" y2="125" stroke="#9e8c6c" strokeWidth="2"/>
            <line x1="146" y1="125" x2="206" y2="125" stroke="#9e8c6c" strokeWidth="2"/>
            <line x1="14" y1="160" x2="206" y2="160" stroke="#9e8c6c" strokeWidth="2"/>
          </svg>
        </div>

        {/* Road */}
        <div className="bus-road">
          <div className="bus-road-line"/>
        </div>

        {/* Title */}
        <div className="bus-title-overlay">
          <h1>🚌 Bus 26 Entering Dhaanish Ahmed Campus</h1>
        </div>

        {/* Animated Bus */}
        <div className="bus-wrap">
          <div className="bus">
            <div className="bus-body">
              {/* Windows with cartoon faces */}
              <div className="bus-windows">
                {[
                  { skin: "#F5CBA7", hair: "#2C1503" },
                  { skin: "#FDEBD0", hair: "#6E2C00" },
                  { skin: "#D5A985", hair: "#1C1C1C" },
                  { skin: "#F5CBA7", hair: "#8B0000" },
                  { skin: "#C68642", hair: "#111" },
                ].map((f, i) => (
                  <div key={i} className="bus-window">
                    <div className="face">
                      <div className="face-circle" style={{ background: f.skin }}/>
                      <div className="face-hair" style={{ background: f.hair }}/>
                      <div className="face-eyes"><div className="eye"/><div className="eye"/></div>
                      <div className="face-smile"/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bus-label">🏫 DHAANISH AHMED COLLEGE OF ENGINEERING — BUS 26</div>
              <div className="bus-door"/>
            </div>
            <div className="bus-front">
              <div className="windshield"/>
            </div>
            <div className="wheel wheel-back"/>
            <div className="wheel wheel-front"/>
            <div className="puff">
              <span/><span/><span/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
