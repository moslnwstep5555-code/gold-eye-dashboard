import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { buildSystemPrompt, DEAD_CAT_BOUNCE } from "./knowledge-base.js";

// ========== DEAD CAT BOUNCE DETECTION ==========
function detectDeadCatBounce(candles) {
  if (candles.length < 8) return null;
  const recent = candles.slice(-8);
  const closes = recent.map(c => c.c);

  // Phase 1: ราคาร่วงแรง (4 แท่งแรก closes ลด)
  const phase1Drop = closes[3] < closes[0] * 0.97;

  // Phase 2: เด้งสั้น (แท่ง 5-6 บวก)
  const phase2Bounce = closes[5] > closes[3] * 1.01;

  // Phase 3: ติดต้าน (high แท่ง 5-7 ใกล้กัน — ไม่ผ่าน)
  const highs = recent.slice(4, 7).map(c => c.h);
  const phase3Stuck = Math.max(...highs) - Math.min(...highs) < closes[5] * 0.015;

  // Phase 4: Lower High?
  const lastHigh = recent[7].h;
  const prevHigh = Math.max(...recent.slice(4, 7).map(c => c.h));
  const lowerHigh = lastHigh < prevHigh;

  if (phase1Drop && phase2Bounce && (phase3Stuck || lowerHigh)) {
    return {
      detected: true,
      bias: "ขาย (เด้งหลอก)",
      confidence: lowerHigh && phase3Stuck ? "สูง" : "กลาง",
      lowerHigh,
    };
  }
  return null;
}

// ========== DATA ==========
const GOLD_CANDLES = [
  { t:"ม.ค.24", o:2030,h:2080,l:2010,c:2040, v:82 },
  { t:"ก.พ.24", o:2040,h:2075,l:2025,c:2060, v:74 },
  { t:"มี.ค.24", o:2060,h:2225,l:2055,c:2170, v:110 },
  { t:"เม.ย.24", o:2170,h:2390,l:2160,c:2330, v:145 },
  { t:"พ.ค.24", o:2330,h:2360,l:2280,c:2340, v:98 },
  { t:"มิ.ย.24", o:2340,h:2370,l:2270,c:2310, v:89 },
  { t:"ก.ค.24", o:2310,h:2430,l:2290,c:2390, v:103 },
  { t:"ส.ค.24", o:2390,h:2530,l:2370,c:2490, v:118 },
  { t:"ก.ย.24", o:2490,h:2680,l:2470,c:2620, v:132 },
  { t:"ต.ค.24", o:2620,h:2790,l:2600,c:2730, v:140 },
  { t:"พ.ย.24", o:2730,h:2780,l:2600,c:2650, v:115 },
  { t:"ธ.ค.24", o:2650,h:2700,l:2580,c:2620, v:95 },
  { t:"ม.ค.25", o:2620,h:2850,l:2600,c:2780, v:128 },
  { t:"ก.พ.25", o:2780,h:2920,l:2750,c:2870, v:134 },
  { t:"มี.ค.25", o:2870,h:3100,l:2840,c:3050, v:158 },
  { t:"เม.ย.25", o:3050,h:3300,l:3020,c:3250, v:172 },
  { t:"พ.ค.25", o:3250,h:3380,l:3210,c:3300, v:148 },
  { t:"มิ.ย.25", o:3300,h:3420,l:3270,c:3340, v:135 },
  { t:"ก.ค.25", o:3340,h:3450,l:3300,c:3380, v:122 },
  { t:"ส.ค.25", o:3380,h:3560,l:3350,c:3490, v:141 },
  { t:"ก.ย.25", o:3490,h:3850,l:3460,c:3780, v:182 },
  { t:"ต.ค.25", o:3780,h:4200,l:3750,c:4100, v:210 },
  { t:"พ.ย.25", o:4100,h:4450,l:4080,c:4380, v:235 },
  { t:"ธ.ค.25", o:4380,h:4520,l:4320,c:4460, v:198 },
  { t:"ม.ค.26", o:4460,h:5597,l:4420,c:5200, v:290 },
  { t:"ก.พ.26", o:5200,h:5300,l:4950,c:5050, v:245 },
  { t:"มี.ค.26", o:5050,h:5100,l:4820,c:4980, v:220 },
  { t:"เม.ย.26", o:4980,h:5010,l:4600,c:4720, v:208 },
  { t:"พ.ค.26", o:4720,h:4780,l:4420,c:4523, v:195 },
];

// Pattern library
const PATTERNS = {
  bullishEngulfing: {
    name: "Bullish Engulfing", emoji: "🟢", bias: "ซื้อ",
    desc: "แท่งเขียวกลืนแท่งแดง → แรงซื้อกลับมา",
    entry: "เปิด Long หลังปิดแท่ง", sl: "ต่ำสุดแท่งแดง", tp: "1.5–2x ความยาวแท่ง",
  },
  bearishEngulfing: {
    name: "Bearish Engulfing", emoji: "🔴", bias: "ขาย",
    desc: "แท่งแดงกลืนแท่งเขียว → แรงขายครอบงำ",
    entry: "เปิด Short หลังปิดแท่ง", sl: "สูงสุดแท่งเขียว", tp: "1.5–2x ความยาวแท่ง",
  },
  hammer: {
    name: "Hammer / Pin Bar", emoji: "🔨", bias: "ซื้อ",
    desc: "หางยาวล่าง → แรงซื้อดันราคากลับ",
    entry: "Buy หลังยืนยันแท่งถัดไป", sl: "ต่ำสุดหาง", tp: "แนวต้านถัดไป",
  },
  shootingStar: {
    name: "Shooting Star", emoji: "💫", bias: "ขาย",
    desc: "หางยาวบน → ราคาถูกกดลง",
    entry: "Short หลังยืนยัน", sl: "สูงสุดหาง", tp: "แนวรับถัดไป",
  },
  doji: {
    name: "Doji", emoji: "➕", bias: "รอดู",
    desc: "เปิด=ปิด → ตลาดลังเล รอแท่งยืนยัน",
    entry: "รอแท่งถัดไปก่อนตัดสินใจ", sl: "High/Low ของ Doji", tp: "ขึ้นกับทิศทาง",
  },
  threeWhiteSoldiers: {
    name: "3 White Soldiers", emoji: "⚔️", bias: "ซื้อแรง",
    desc: "3 แท่งเขียวต่อเนื่อง → uptrend แข็งแกร่ง",
    entry: "Buy on pullback", sl: "ต่ำสุดแท่งที่ 1", tp: "2–3x ความสูง",
  },
  threeBlackCrows: {
    name: "3 Black Crows", emoji: "🦅", bias: "ขายแรง",
    desc: "3 แท่งแดงต่อเนื่อง → downtrend ชัดเจน",
    entry: "Short on rebound", sl: "สูงสุดแท่งที่ 1", tp: "2–3x ความสูง",
  },
  morningStar: {
    name: "Morning Star", emoji: "🌅", bias: "ซื้อ",
    desc: "แดง → Doji เล็ก → เขียวใหญ่ = กลับตัวขาขึ้น",
    entry: "Buy ยืนยันแท่งที่ 3", sl: "ต่ำสุดแท่งกลาง", tp: "Fibonacci 1.618",
  },
  eveningStar: {
    name: "Evening Star", emoji: "🌇", bias: "ขาย",
    desc: "เขียว → Doji เล็ก → แดงใหญ่ = กลับตัวขาลง",
    entry: "Short ยืนยันแท่งที่ 3", sl: "สูงสุดแท่งกลาง", tp: "Fibonacci 1.618",
  },
};

function detectPattern(candles) {
  if (candles.length < 3) return null;
  const [c1, c2, c3] = candles.slice(-3);
  const body = (c) => Math.abs(c.c - c.o);
  const isGreen = (c) => c.c > c.o;
  const upperWick = (c) => c.h - Math.max(c.o, c.c);
  const lowerWick = (c) => Math.min(c.o, c.c) - c.l;

  // 3 White Soldiers
  if (isGreen(c1) && isGreen(c2) && isGreen(c3) && c2.c > c1.c && c3.c > c2.c) return "threeWhiteSoldiers";
  // 3 Black Crows
  if (!isGreen(c1) && !isGreen(c2) && !isGreen(c3) && c2.c < c1.c && c3.c < c2.c) return "threeBlackCrows";
  // Morning Star
  if (!isGreen(c1) && body(c2) < body(c1) * 0.4 && isGreen(c3) && c3.c > (c1.o + c1.c) / 2) return "morningStar";
  // Evening Star
  if (isGreen(c1) && body(c2) < body(c1) * 0.4 && !isGreen(c3) && c3.c < (c1.o + c1.c) / 2) return "eveningStar";
  // Bullish Engulfing
  if (!isGreen(c2) && isGreen(c3) && c3.o < c2.c && c3.c > c2.o) return "bullishEngulfing";
  // Bearish Engulfing
  if (isGreen(c2) && !isGreen(c3) && c3.o > c2.c && c3.c < c2.o) return "bearishEngulfing";
  // Hammer
  if (lowerWick(c3) > body(c3) * 2 && upperWick(c3) < body(c3)) return "hammer";
  // Shooting Star
  if (upperWick(c3) > body(c3) * 2 && lowerWick(c3) < body(c3)) return "shootingStar";
  // Doji
  if (body(c3) < (c3.h - c3.l) * 0.1) return "doji";
  return null;
}

// RSI calc
function calcRSI(candles, period = 7) {
  if (candles.length < period + 1) return 50;
  const changes = candles.slice(1).map((c, i) => c.c - candles[i].c);
  const recent = changes.slice(-period);
  const gains = recent.filter(x => x > 0).reduce((a, b) => a + b, 0) / period;
  const losses = Math.abs(recent.filter(x => x < 0).reduce((a, b) => a + b, 0)) / period;
  if (losses === 0) return 100;
  const rs = gains / losses;
  return Math.round(100 - 100 / (1 + rs));
}

function calcMA(candles, period) {
  if (candles.length < period) return null;
  return candles.slice(-period).reduce((a, c) => a + c.c, 0) / period;
}

// ========== COMPONENTS ==========

function DivineEye({ size = 140, scanning = false }) {
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  useEffect(() => {
    const h = e => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setPupil({
        x: ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 13,
        y: ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 8,
      });
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  const s = size, rx = s * 0.46, ry = s * 0.26;
  return (
    <div ref={ref} style={{ width: s, height: s, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[1.7, 1.4].map((sc, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: s * sc, height: s * sc * 0.55,
          border: `1px solid rgba(255,215,0,${0.07 - i * 0.03})`,
          animation: `rpulse ${2.5 + i}s ease-in-out infinite alternate`,
        }} />
      ))}
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="ig2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a1800" /><stop offset="50%" stopColor="#8b4000" /><stop offset="100%" stopColor="#1a0800" />
          </radialGradient>
          <clipPath id="ec2"><ellipse cx={s/2} cy={s/2} rx={rx} ry={ry} /></clipPath>
        </defs>
        <ellipse cx={s/2} cy={s/2} rx={rx} ry={ry} fill="#080400" stroke="#ffd700" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 8px #ffd700aa)" }} />
        <g clipPath="url(#ec2)">
          <ellipse cx={s/2+pupil.x} cy={s/2+pupil.y} rx={ry*0.8} ry={ry*0.8} fill="url(#ig2)" />
          {[...Array(8)].map((_,i) => { const a=(i/8)*Math.PI*2; return <line key={i} x1={s/2+pupil.x} y1={s/2+pupil.y} x2={s/2+pupil.x+Math.cos(a)*ry*0.8} y2={s/2+pupil.y+Math.sin(a)*ry*0.8} stroke="rgba(200,100,0,0.2)" strokeWidth="0.7" />; })}
          <ellipse cx={s/2+pupil.x} cy={s/2+pupil.y} rx={ry*0.34} ry={ry*0.34} fill="#030100" />
          {scanning && <ellipse cx={s/2+pupil.x} cy={s/2+pupil.y} rx={ry*0.52} ry={ry*0.13} fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="1" style={{ animation: "spin 2s linear infinite", transformOrigin: `${s/2+pupil.x}px ${s/2+pupil.y}px` }} />}
          <ellipse cx={s/2+pupil.x+ry*0.1} cy={s/2+pupil.y-ry*0.12} rx={ry*0.055} ry={ry*0.055} fill="rgba(255,240,180,0.85)" />
        </g>
        <path d={`M ${s/2-rx} ${s/2} Q ${s/2} ${s/2-ry*1.5} ${s/2+rx} ${s/2}`} fill="none" stroke="#ffd700" strokeWidth="1.3" style={{ filter: "drop-shadow(0 0 4px #ffd700)" }} />
        <path d={`M ${s/2-rx} ${s/2} Q ${s/2} ${s/2+ry*1.5} ${s/2+rx} ${s/2}`} fill="none" stroke="#ffd700" strokeWidth="1.3" style={{ filter: "drop-shadow(0 0 4px #ffd700)" }} />
        <g transform={`translate(${s/2},${s/2-ry-15})`}>
          <polygon points="0,-8 6,4 -6,4" fill="none" stroke="#ffd700" strokeWidth="1.2" style={{ filter: "drop-shadow(0 0 3px #ffd700)" }} />
          <circle cx="0" cy="0" r="1.8" fill="#ffd700" />
        </g>
      </svg>
      <div style={{ position: "absolute", width: s*0.52, height: s*0.52, borderRadius: "50%", border: "1px solid rgba(255,215,0,0.2)", animation: "spin 9s linear infinite", borderTopColor: "#ffd700" }} />
    </div>
  );
}

function CandleChart({ candles, selectedIdx, onSelect, patternKey }) {
  const W = 640, H = 200, padL = 46, padR = 10, padT = 14, padB = 28;
  const visible = candles.slice(-20);
  const prices = visible.flatMap(c => [c.h, c.l]);
  const mn = Math.min(...prices), mx = Math.max(...prices);
  const toX = (i) => padL + (i + 0.5) * ((W - padL - padR) / visible.length);
  const toY = (v) => padT + ((mx - v) / (mx - mn)) * (H - padT - padB);
  const cw = Math.max(4, ((W - padL - padR) / visible.length) * 0.6);

  // MA lines
  const allClose = candles.map(c => c.c);
  const ma7 = visible.map((_, i) => {
    const slice = allClose.slice(candles.length - 20 + i - 6, candles.length - 20 + i + 1);
    return slice.length >= 7 ? slice.reduce((a,b)=>a+b,0)/slice.length : null;
  });
  const ma20 = visible.map((_, i) => {
    const slice = allClose.slice(candles.length - 20 + i - 19, candles.length - 20 + i + 1);
    return slice.length >= 20 ? slice.reduce((a,b)=>a+b,0)/slice.length : null;
  });

  const patternEnd = candles.length - 1;
  const patternStart = patternEnd - 2;
  const visStart = candles.length - 20;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ cursor: "pointer" }}>
      {/* Grid */}
      {[0,1,2,3,4].map(i => {
        const v = mn + ((mx-mn)*i/4);
        const y = toY(v);
        return <g key={i}>
          <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="rgba(255,215,0,0.07)" strokeWidth="1" />
          <text x={padL-3} y={y+3} textAnchor="end" fill="rgba(255,215,0,0.35)" fontSize="8">{(v/1000).toFixed(1)}k</text>
        </g>;
      })}

      {/* MA Lines */}
      {["ma7","ma20"].map((key, ki) => {
        const arr = key==="ma7" ? ma7 : ma20;
        const col = key==="ma7" ? "#00e5ff" : "#ff9900";
        const pts = arr.map((v,i) => v ? `${toX(i)},${toY(v)}` : null).filter(Boolean).join(" ");
        return pts ? <polyline key={key} points={pts} fill="none" stroke={col} strokeWidth="1" opacity="0.6" strokeDasharray={ki ? "4,2" : ""} /> : null;
      })}

      {/* Candles */}
      {visible.map((c, i) => {
        const x = toX(i);
        const isG = c.c >= c.o;
        const top = toY(Math.max(c.o,c.c));
        const bot = toY(Math.min(c.o,c.c));
        const bodyH = Math.max(2, bot - top);
        const globalIdx = candles.length - 20 + i;
        const isPattern = globalIdx >= patternStart && globalIdx <= patternEnd && patternKey;
        const isSelected = globalIdx === selectedIdx;
        return (
          <g key={i} onClick={() => onSelect(globalIdx)} style={{ cursor: "pointer" }}>
            {/* Wick */}
            <line x1={x} y1={toY(c.h)} x2={x} y2={toY(c.l)} stroke={isG?"#00e5a0":"#ff4d6d"} strokeWidth="1" />
            {/* Body */}
            <rect x={x-cw/2} y={top} width={cw} height={bodyH}
              fill={isG ? "#00e5a0" : "#ff4d6d"}
              stroke={isPattern ? "#ffd700" : isSelected ? "#ffffff" : "none"}
              strokeWidth={isPattern ? 1.5 : 1}
              opacity={isPattern ? 1 : 0.85}
            />
            {isPattern && <rect x={x-cw/2-2} y={top-2} width={cw+4} height={bodyH+4} fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.5" rx="1" />}
          </g>
        );
      })}

      {/* X labels */}
      {visible.map((c, i) => i % 4 === 0 || i === visible.length-1 ? (
        <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fill="rgba(255,215,0,0.3)" fontSize="7">{c.t}</text>
      ) : null)}

      {/* MA legend */}
      <g>
        <line x1={padL+4} y1={padT+6} x2={padL+16} y2={padT+6} stroke="#00e5ff" strokeWidth="1" />
        <text x={padL+18} y={padT+9} fill="#00e5ff" fontSize="7" opacity="0.7">MA7</text>
        <line x1={padL+40} y1={padT+6} x2={padL+52} y2={padT+6} stroke="#ff9900" strokeWidth="1" />
        <text x={padL+54} y={padT+9} fill="#ff9900" fontSize="7" opacity="0.7">MA20</text>
      </g>
    </svg>
  );
}

function RSIGauge({ value }) {
  const color = value > 70 ? "#ff4d6d" : value < 30 ? "#00e5a0" : "#ffd700";
  const label = value > 70 ? "Overbought" : value < 30 ? "Oversold" : "Neutral";
  const pct = value / 100;
  const r = 38, cx = 50, cy = 54;
  const arc = (v) => {
    const a = Math.PI * (1 - v);
    return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  };
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d={`M ${cx-r},${cy} A ${r},${r} 0 0 1 ${cx+r},${cy}`} fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${cx-r},${cy} A ${r},${r} 0 0 1 ${arc(pct)}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <text x={cx} y={cy-2} textAnchor="middle" fill={color} fontSize="14" fontWeight="700">{value}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="rgba(255,215,0,0.4)" fontSize="7">{label}</text>
      </svg>
    </div>
  );
}

// ========== MAIN ==========
export default function GoldBrainDashboard() {
  const [selectedIdx, setSelectedIdx] = useState(GOLD_CANDLES.length - 1);
  const [aiResponse, setAiResponse] = useState("");
  const [thinking, setThinking] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  const selectedCandle = GOLD_CANDLES[selectedIdx];
  const candlesUpTo = GOLD_CANDLES.slice(0, selectedIdx + 1);
  const patternKey = detectPattern(candlesUpTo);
  const pattern = patternKey ? PATTERNS[patternKey] : null;
  const rsi = calcRSI(candlesUpTo);
  const ma7 = calcMA(candlesUpTo, 7);
  const ma20 = calcMA(candlesUpTo, 20);
  const trend = ma7 && ma20 ? (ma7 > ma20 ? "ขาขึ้น" : "ขาลง") : "ไม่ชัดเจน";
  const isGreen = selectedCandle.c > selectedCandle.o;
  const changeP = (((selectedCandle.c - selectedCandle.o) / selectedCandle.o) * 100).toFixed(2);
  const deadCat = detectDeadCatBounce(candlesUpTo);

  const buildContext = useCallback(() => {
    const prev5 = candlesUpTo.slice(-5).map(c => `${c.t}(${c.c>c.o?"🟢":"🔴"}O:${c.o} H:${c.h} L:${c.l} C:${c.c} V:${c.v})`).join(", ");
    let ctx = `แท่งเทียนทองคำ 5 แท่งล่าสุด: ${prev5}.\n`;
    ctx += `รูปแบบแท่งเทียน: ${pattern?.name || "ไม่ชัดเจน"}.\n`;
    ctx += `Indicators: RSI(7)=${rsi}, MA7=${ma7?.toFixed(0)}, MA20=${ma20?.toFixed(0)}.\n`;
    ctx += `แนวโน้มหลัก: ${trend} (Close ${ma7 > ma20 ? "เหนือ" : "ใต้"} MA20).\n`;
    if (deadCat) {
      ctx += `🚨 พบ Dead Cat Bounce (เด้งหลอก)! Confidence: ${deadCat.confidence}, Lower High: ${deadCat.lowerHigh ? "Yes ⚠️" : "No"}.\n`;
    }
    ctx += `ราคาปัจจุบัน: $${selectedCandle.c.toLocaleString()}\n`;
    return ctx;
  }, [selectedIdx, pattern, rsi, ma7, ma20, trend, deadCat]);

  const askAI = async (overrideQ) => {
    const q = overrideQ || query;
    if (!q.trim() || thinking) return;
    setThinking(true);
    if (!overrideQ) setQuery("");
    const ctx = buildContext();
    const newHist = [...history, { role: "user", content: q }];
    try {
      // Gemini API format
      const geminiContents = newHist.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: { parts: [{ text: buildSystemPrompt(ctx) }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      });
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || data.error?.message
        || "วิเคราะห์ไม่ได้";
      setAiResponse(reply);
      setHistory([...newHist, { role: "assistant", content: reply }]);
    } catch (e) { setAiResponse("⚠️ เชื่อมต่อไม่ได้: " + e.message); }
    setThinking(false);
  };

  // Auto analyze on mount
  useEffect(() => {
    if (!autoAnalyzed) {
      setAutoAnalyzed(true);
      setTimeout(() => askAI("วิเคราะห์แท่งเทียนปัจจุบัน บอกรูปแบบที่เห็น และแนะนำเทคนิคที่ควรใช้เทรดตอนนี้"), 800);
    }
  }, []);

  // Re-analyze when candle changes
  useEffect(() => {
    if (autoAnalyzed) {
      askAI("วิเคราะห์แท่งเทียนที่เลือกนี้ บอกรูปแบบและกลยุทธ์เทรด");
    }
  }, [selectedIdx]);

  const G = "#ffd700";
  const panel = { background:"rgba(12,8,2,0.92)", border:"1px solid rgba(255,215,0,0.18)", borderRadius:14, backdropFilter:"blur(12px)" };

  return (
    <div style={{ minHeight:"100vh", background:"#050300", color:"#e8d5a0", fontFamily:"'Sarabun','Noto Sans Thai',sans-serif", padding:"18px", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        @keyframes rpulse{from{opacity:.3;transform:scale(.97)}to{opacity:.9;transform:scale(1.05)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes twinkle{0%,100%{opacity:.1}50%{opacity:.4}}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ffd70033;border-radius:3px}
      `}</style>

      {/* Stars */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0 }}>
        {[...Array(40)].map((_,i)=>(
          <div key={i} style={{ position:"absolute",borderRadius:"50%",width:Math.random()*1.5+.5,height:Math.random()*1.5+.5,background:Math.random()>.7?"#ffd700":"#fff",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,opacity:Math.random()*.25+.05,animation:`twinkle ${2+Math.random()*4}s ease-in-out infinite`,animationDelay:`${Math.random()*4}s` }} />
        ))}
      </div>

      <div style={{ position:"relative",zIndex:1,maxWidth:1080,margin:"0 auto" }}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:3,height:42,background:"linear-gradient(#ffd700,#b8860b)",borderRadius:2 }} />
            <div>
              <div style={{ fontSize:22,fontWeight:700,color:G,textShadow:"0 0 18px #ffd70055",letterSpacing:2 }}>สมองAI ดวงตาเทพ · เทรดทอง</div>
              <div style={{ fontSize:10,color:"#6a5020",letterSpacing:3 }}>GOLD CANDLE PATTERN BRAIN · XAU/USD</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10,color:"#6a5020" }}>แท่งที่เลือก</div>
            <div style={{ fontSize:18,fontWeight:700,color:G }}>{selectedCandle.t} · ${selectedCandle.c.toLocaleString()}</div>
            <div style={{ fontSize:12,color:isGreen?"#00e5a0":"#ff4d6d" }}>{isGreen?"▲":"▼"} {Math.abs(changeP)}%</div>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 260px",gap:14 }}>

          {/* LEFT */}
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

            {/* 🚨 Dead Cat Bounce Alert */}
            {deadCat && (
              <div style={{ ...panel, padding: 12, borderColor: "rgba(255,77,109,0.5)", background: "rgba(50,0,10,0.95)", animation: "fadeUp 0.5s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 28 }}>🚨</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#ff4d6d", fontWeight: 700, marginBottom: 2 }}>
                      Dead Cat Bounce ตรวจพบ! · เด้งหลอก
                    </div>
                    <div style={{ fontSize: 10, color: "#c8a860", lineHeight: 1.5 }}>
                      สัญญาณ: {deadCat.lowerHigh ? "Lower High ⚠️ " : ""}เด้งใกล้แนวต้าน — confidence: <strong style={{ color: "#ff4d6d" }}>{deadCat.confidence}</strong>
                    </div>
                    <div style={{ fontSize: 10, color: "#8a7040", marginTop: 4 }}>
                      💡 รอ confirm แท่งกลับลง + Volume ก่อน Short
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div style={{ ...panel,padding:16 }}>
              <div style={{ fontSize:12,color:G,marginBottom:10,letterSpacing:1 }}>
                ✦ กราฟแท่งเทียน · คลิกแท่งเพื่อวิเคราะห์
              </div>
              <CandleChart candles={GOLD_CANDLES} selectedIdx={selectedIdx} onSelect={setSelectedIdx} patternKey={patternKey} />
              <div style={{ fontSize:10,color:"#4a3810",marginTop:4,textAlign:"right" }}>กรอบเวลา: รายเดือน · แสดง 20 แท่งล่าสุด · แท่งกรอบทอง = รูปแบบที่ตรวจพบ</div>
            </div>

            {/* Pattern + Indicators row */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {/* Pattern Box */}
              <div style={{ ...panel,padding:14 }}>
                <div style={{ fontSize:11,color:G,marginBottom:8,letterSpacing:1 }}>✦ รูปแบบแท่งเทียน</div>
                {pattern ? (
                  <>
                    <div style={{ fontSize:20,marginBottom:4 }}>{pattern.emoji} <span style={{ fontSize:14,fontWeight:700,color:G }}>{pattern.name}</span></div>
                    <div style={{ fontSize:11,color:"#c8a860",marginBottom:8,lineHeight:1.6 }}>{pattern.desc}</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                      {[["สัญญาณ", pattern.bias, pattern.bias.includes("ซื้อ")?"#00e5a0":"#ff4d6d"],
                        ["Entry", pattern.entry, G],
                        ["Stop Loss", pattern.sl, "#ff4d6d"],
                        ["Take Profit", pattern.tp, "#00e5a0"]].map(([k,v,c])=>(
                        <div key={k} style={{ display:"flex",gap:6,fontSize:11 }}>
                          <span style={{ color:"#6a5020",width:70,flexShrink:0 }}>{k}:</span>
                          <span style={{ color:c,fontWeight:600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:12,color:"#6a5020",paddingTop:8 }}>
                    ➕ ไม่พบรูปแบบชัดเจน<br/>ตลาดอาจกำลังลังเล<br/>รอสัญญาณยืนยัน
                  </div>
                )}
              </div>

              {/* Indicators */}
              <div style={{ ...panel,padding:14 }}>
                <div style={{ fontSize:11,color:G,marginBottom:8,letterSpacing:1 }}>✦ Indicators</div>
                <RSIGauge value={rsi} />
                <div style={{ display:"flex",flexDirection:"column",gap:6,marginTop:8 }}>
                  {[
                    ["MA7", ma7?.toFixed(0)??"-", "#00e5ff"],
                    ["MA20", ma20?.toFixed(0)??"-", "#ff9900"],
                    ["แนวโน้ม", trend, trend==="ขาขึ้น"?"#00e5a0":"#ff4d6d"],
                    ["Volume", selectedCandle.v, "#c084fc"],
                  ].map(([k,v,c])=>(
                    <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:11 }}>
                      <span style={{ color:"#6a5020" }}>{k}</span>
                      <span style={{ color:c,fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Brain Chat */}
            <div style={{ ...panel,padding:14 }}>
              <div style={{ fontSize:11,color:G,marginBottom:10,letterSpacing:1 }}>✦ สมองAI ดวงตาเทพ · วิเคราะห์เทคนิค</div>
              {thinking ? (
                <div style={{ padding:"12px 0",color:"#8a6830",fontSize:12,animation:"pulse 1s ease infinite" }}>
                  ⚡ กำลังอ่านแท่งเทียนและคำนวณกลยุทธ์...
                </div>
              ) : aiResponse ? (
                <div style={{ padding:"12px 14px",background:"rgba(255,215,0,0.04)",border:"1px solid rgba(255,215,0,0.15)",borderLeft:"3px solid #ffd700",borderRadius:8,fontSize:12,lineHeight:1.85,color:"#c8a860",animation:"fadeUp 0.4s ease",marginBottom:10 }}>
                  {aiResponse}
                </div>
              ) : null}
              <div style={{ display:"flex",gap:8 }}>
                <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()}
                  placeholder="ถามเพิ่มเติม เช่น: ควร SL ที่เท่าไร? TP ตรงไหน?"
                  style={{ flex:1,padding:"9px 12px",background:"rgba(255,215,0,0.05)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:8,color:"#e8d5a0",fontSize:12,fontFamily:"inherit" }} />
                <button onClick={()=>askAI()} disabled={thinking||!query.trim()} style={{ padding:"9px 16px",background:"rgba(255,215,0,0.1)",border:`1px solid ${G}`,borderRadius:8,color:G,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>⚡</button>
              </div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:8 }}>
                {["ควรเข้าเทรดตอนไหน?","SL/TP อยู่ที่เท่าไร?","ตลาดจะไปทิศไหน?","แท่งหน้าจะเป็นอะไร?"].map(q=>(
                  <button key={q} onClick={()=>askAI(q)} style={{ padding:"4px 10px",fontSize:10,background:"rgba(255,215,0,0.05)",border:"1px solid rgba(255,215,0,0.15)",borderRadius:20,color:"#8a7040",cursor:"pointer",fontFamily:"inherit" }}>{q}</button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {/* Eye */}
            <div style={{ ...panel,padding:"18px 14px",display:"flex",flexDirection:"column",alignItems:"center" }}>
              <DivineEye size={140} scanning={thinking} />
              <div style={{ marginTop:10,textAlign:"center" }}>
                <div style={{ fontSize:12,color:G,fontWeight:600,letterSpacing:1 }}>
                  {thinking?"⚡ กำลังอ่านกราฟ...":"👁 จับตาแท่งเทียน"}
                </div>
                <div style={{ fontSize:10,color:"#4a3810",marginTop:3 }}>คลิกแท่งเพื่อวิเคราะห์</div>
              </div>
            </div>

            {/* Pattern Library */}
            <div style={{ ...panel,padding:14 }}>
              <div style={{ fontSize:11,color:G,marginBottom:10,letterSpacing:1 }}>✦ รูปแบบที่ AI จำได้</div>
              <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:320,overflowY:"auto" }}>
                {Object.entries(PATTERNS).map(([key,p])=>(
                  <div key={key} style={{
                    padding:"8px 10px",borderRadius:8,fontSize:10,
                    background: key===patternKey?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.02)",
                    border:`1px solid ${key===patternKey?"rgba(255,215,0,0.4)":"rgba(255,215,0,0.08)"}`,
                    borderLeft:`3px solid ${key===patternKey?G:p.bias.includes("ซื้อ")?"#00e5a044":"#ff4d6d44"}`,
                  }}>
                    <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:3 }}>
                      <span>{p.emoji}</span>
                      <span style={{ color:key===patternKey?G:"#8a7040",fontWeight:key===patternKey?700:400 }}>{p.name}</span>
                      {key===patternKey && <span style={{ marginLeft:"auto",color:G,fontSize:9 }}>← ตรวจพบ!</span>}
                    </div>
                    <div style={{ color:"#5a4820",lineHeight:1.5 }}>{p.desc}</div>
                    <div style={{ color:p.bias.includes("ซื้อ")?"#00e5a0":"#ff4d6d",fontWeight:600,marginTop:2 }}>{p.bias}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candle detail */}
            <div style={{ ...panel,padding:14 }}>
              <div style={{ fontSize:11,color:G,marginBottom:8,letterSpacing:1 }}>✦ แท่งที่เลือก: {selectedCandle.t}</div>
              {[["Open",selectedCandle.o,"#e8d5a0"],["High",selectedCandle.h,"#00e5a0"],["Low",selectedCandle.l,"#ff4d6d"],["Close",selectedCandle.c,isGreen?"#00e5a0":"#ff4d6d"],["Volume",selectedCandle.v,"#c084fc"]].map(([k,v,c])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,215,0,0.05)" }}>
                  <span style={{ color:"#6a5020" }}>{k}</span>
                  <span style={{ color:c,fontWeight:600 }}>{typeof v==="number"&&v>100?`$${v.toLocaleString()}`:v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
