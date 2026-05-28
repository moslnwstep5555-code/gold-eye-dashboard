// ========================================================
// 🐋 KNOWLEDGE BASE สำหรับสมอง AI ดวงตาเทพ
// สังเคราะห์จากเอกสาร 53 รูป + 4 ซีรีส์
// 1. Close Price 35 ชีท  2. Dead Cat Bounce 30 หน้า
// 3. True vs Fake Breakout  4. NWhale Chart Analysis
// ========================================================

// ========== 1) CLOSE PRICE FRAMEWORK ==========
export const CLOSE_PRICE_RULES = {
  identity: "Close Price คือ 'ราคาสุดท้ายของวัน/แท่ง' — เป็นจุดตัดสินใจของตลาด",
  importance: "ใช้ดูทิศทางแนวโน้ม + ยืนยันสัญญาณก่อนเข้าเทรด",

  // หลักการใช้งาน 5 ขั้น (Page 30)
  framework: [
    "1. ดูแนวโน้มหลัก (เทรนด์ใหญ่ + Volume)",
    "2. หาแนวรับ-แนวต้าน (กำหนดโซนสำคัญ)",
    "3. รอแท่งปิดยืนยัน (เหนือ/ใต้โซน)",
    "4. เช็ก Volume + Indicator (RSI/MACD/MA)",
    "5. วางแผนเข้า-ออก (Entry/SL/TP)",
  ],

  // Close Price กับเครื่องมือต่างๆ
  withIndicators: {
    RSI: {
      rules: ["RSI > 50 → หนุนขาขึ้น", "RSI < 50 → หนุนขาลง"],
      divergence: "ราคาปิดทำจุดใหม่ แต่ RSI ไม่ตาม → ระวัง Divergence (กลับตัว)",
    },
    MACD: {
      rules: ["Close ปิดเหนือแนว + MACD ตัดขึ้น = บวก", "MACD ต่ำกว่า signal = โมเมนตัมอ่อน"],
      useWith: "ใช้ยืนยัน — ไม่ใช้เดี่ยวๆ",
    },
    EMA: {
      rules: [
        "EMA ตอบสนองเร็วกว่า MA",
        "Close ปิดเหนือ EMA = โมเมนตัมดี",
        "Close ปิดใต้ EMA = อ่อนแรง",
      ],
      defaults: "EMA 20 + EMA 50 ดูแนวโน้ม",
    },
    Trendline: {
      rules: [
        "เส้นแนวโน้มบอกทิศทาง",
        "Close ปิดทะลุเส้น = เริ่มเปลี่ยนภาพ",
        "ถ้าปิดกลับเข้าเส้น = ยังไม่ยืนยัน",
      ],
    },
  },

  // Engulfing pattern
  engulfingPattern: {
    bullish: "แท่งเขียวกลืนแท่งแดง (ดีเมื่อแท่งปิดชัด)",
    bearish: "แท่งแดงกลืนแท่งเขียว",
    keyPoint: "ต้องดูว่าราคาปิดแรงแค่ไหน + ใกล้แนวรับ-แนวต้าน",
  },

  // ข้อควรระวัง (Page 10)
  warnings: [
    "อย่าตัดสินใจจากราคาปิดเพียงอย่างเดียว",
    "อาจเกิด 'การกลับตัว' หรือ 'หลอกทาง' ได้เสมอ",
    "ควรวิเคราะห์หลายปัจจัยพร้อมกัน (แนวโน้ม + ปริมาณ + ข่าวสาร)",
  ],

  // Entry/Stop/TP framework (Page 18)
  trading: {
    entry: "รอปิดเหนือสัญญาณ (เข้าซื้อหลังปิดแท่งเหนือแนวต้าน)",
    stop: "ใต้จุดปิดสำคัญ / แนวรับ",
    takeProfit: "เป้าถัดไป หรือ R:R 1:2 ขั้นต่ำ",
  },
};

// ========== 2) DEAD CAT BOUNCE (เด้งหลอก) ==========
export const DEAD_CAT_BOUNCE = {
  definition: "เด้งสั้นในขาลง — ดูเหมือนกลับตัว แต่สุดท้ายลงต่อ",
  warning: "ไม่ใช่ทุกการเด้ง = การกลับตัว!",

  // 4 จังหวะ Dead Cat Bounce (Page 8, 19)
  fourPhases: [
    { phase: 1, name: "ร่วงแรง", desc: "ลงต่อเนื่อง ไม่มีแรงซื้อ" },
    { phase: 2, name: "เด้งสั้น", desc: "ดีดขึ้นเร็ว เกิดแรงซื้อระยะสั้น" },
    { phase: 3, name: "ชนแนวต้าน / ติดต้าน", desc: "ผ่านไม่ได้ ขึ้นไปชนหลายครั้งแต่ผ่านไม่ได้" },
    { phase: 4, name: "ลงต่อ", desc: "แรงขายกลับมา ราคาหลุดแนวรับ" },
  ],

  // สาเหตุของเด้งหลอก (Page 3)
  causes: [
    "Short Covering — ผู้เปิด Short ปิดสถานะทำกำไร",
    "แรงซื้อเก็งรีบาวด์ — เก็งกำไร เข้าซื้อหวังเด้งสั้น",
    "ภาวะ Oversold — RSI ต่ำเกินไป เกิดการรีบาวด์ทางเทคนิค",
    "ข่าวบวกระยะสั้น — ข่าวดีดันราคาเด้งชั่วคราว",
  ],

  // ลักษณะเด่นของเด้งหลอก (Page 4)
  fakeSignatures: [
    "✅ เกิดหลังราคาร่วงแรง",
    "✅ เด้งได้ไม่นาน",
    "✅ ชนแนวต้านแล้วอ่อน",
    "✅ ทำ Lower High (ยอดต่ำลง)",
  ],

  // เด้งหลอก VS เด้งยืนยัน (Page 13) — สำคัญสุด!
  fakeVsReal: {
    fake: {
      label: "❌ เด้งหลอก",
      signals: ["ชนต้านแล้วอ่อน", "ทำ Lower High", "Volume ไม่ตาม"],
    },
    real: {
      label: "✅ เด้งยืนยัน",
      signals: ["ยืน Higher Low", "ผ่านแนวต้าน", "Volume หนุน"],
    },
  },

  // 4 สัญญาณว่า "อาจไม่ใช่" Dead Cat Bounce (Page 27)
  notDeadCatSignals: [
    "ทำ Higher Low (ยกฐานสูงขึ้น)",
    "เบรกแนวต้านได้",
    "Volume หนุน",
    "ยืนเหนือ MA สำคัญ (เช่น MA 200)",
  ],

  // เช็กลิสต์ก่อนเข้าเทรด Dead Cat Bounce (Page 12, 21)
  preEntryChecklist: [
    "1. เทรนด์หลักยังลง",
    "2. เด้งใกล้แนวต้าน",
    "3. วอลุ่มไม่หนุนแรง",
    "4. มีสัญญาณกลับลง",
    "5. คำนวณความเสี่ยงแล้ว",
  ],

  // จุดพลาดที่พบบ่อย (Page 11)
  commonMistakes: [
    "❌ รีบซื้อแท่งเขียวแรก (คิดว่ากลับตัว)",
    "❌ ไม่รอแนวต้าน (เข้าก่อนเวลา)",
    "❌ ไม่ดู Volume (เด้งแต่ปริมาณไม่หนุน)",
    "❌ ไม่ตั้ง Stop Loss",
  ],

  // Stop Loss สำหรับเทรดเด้ง (Page 14)
  stopLossRules: [
    "1. วางใต้จุดต่ำล่าสุด (หลุดแล้วแปลว่าเด้งล้มเหลว)",
    "2. อย่าตั้งกว้างเกิน (เสี่ยงมากไป พอร์ตเหวี่ยงง่าย)",
    "3. คำนวณ R:R เสียน้อย กำไรคุ้ม อย่างน้อย 1:2",
    "4. ยอมแพ้เมื่อผิดทาง (ตัดไว อยู่จุดต่ำใหม่)",
  ],

  // Volume + แนวต้าน = คู่หูจับเด้งหลอก (Page 18)
  volumeRule: "แค่เด้งไม่พอ — ต้องมีแรงหนุนจริง (Volume) จึงจะเป็นการกลับตัวจริง",

  // ตัวอย่างแผน Short (Page 26)
  shortPlan: [
    "1. รอเด้ง",
    "2. ชนแนวต้าน",
    "3. มีแท่งกลับตัว",
    "4. เข้า Short (อย่าไล่ราคา)",
  ],

  // เมื่อไหร่ "ไม่ควรเทรด" (Page 16)
  doNotTrade: [
    "❌ เด้งไม่ชัด (แนวไม่ชัดเจน เสี่ยงโดนหลอก)",
    "❌ ข่าวแรงผิดปกติ (กราฟผันผวนหนัก)",
    "❌ Volume สับสน (ไม่สนับสนุนทิศทาง)",
    "❌ ไม่มีแผน (ความเสี่ยงสูงเกินไป)",
  ],
};

// ========== 3) TRUE vs FAKE BREAKOUT ==========
export const BREAKOUT_RULES = {
  trueBreakout: {
    label: "✅ True Breakout",
    signs: [
      "แท่งปิดชัดอยู่นอกกรอบ",
      "Volume เพิ่มกว่าปกติ (แรงซื้อ/ขายหนุนหลัง)",
      "โครงสร้างต่อเนื่อง (Higher High / Higher Low หรือกลับด้าน)",
      "ตลาดโดยรวม (Trend) หนุน",
    ],
  },
  fakeBreakout: {
    label: "❌ Fake Breakout",
    signs: [
      "แท่งเพียงไส้ (Wick) ทะลุ แต่ปิดกลับเข้ากรอบ",
      "Volume ต่ำ หรือไม่เพิ่มขึ้น",
      "ไม่มีโครงสร้างต่อเนื่อง",
      "สวนทางกับเทรนด์หลัก",
    ],
  },
  checklist: [
    "ดูตลาดโดยรวม (Trend)",
    "เช็ก Volume ก่อนและหลังเบรก",
    "ดูการปิดแท่งเทียนสำคัญกว่าราคา",
    "รอ Retest แนวต้าน/แนวรับ (เก็บได้ปลอดภัย)",
    "มีแผนรับมือก่อนเข้าเสมอ",
  ],
  entryMethod: [
    "1. รอให้แท่งปิดนอกกรอบชัดเจน (อย่าเข้าเพราะไส้!)",
    "2. ยืนยันด้วย Volume ต้องเห็นแรงหนุน",
    "3. รอ Retest แนวกลับตัวก่อนเข้า",
    "4. ตั้ง Stop Loss ไว้เสมอ เสี่ยงไม่เกินที่รับได้",
  ],
};

// ========== 4) MINDSET & PATIENCE ==========
export const TRADING_MINDSET = {
  motto: "อยู่ในเกมได้นาน ย่อมชนะได้มากกว่า",
  goldenRule: "สัญญาณที่ดีที่สุด คือสัญญาณที่เราอ่านได้ และเทรดเฉพาะเมื่อแผนสมบูรณ์",

  controlAreas: [
    "ความเสี่ยงต่อออเดอร์ (ไม่เกิน 1-2% ของพอร์ต)",
    "แผนการเทรด (เข้า/ออก/SL/TP ชัดเจน)",
    "วินัยในการรอ (รอให้พร้อมเข้าเงื่อนไข)",
    "อารมณ์ของตัวเอง (ใจนิ่ง ไม่โลภ ไม่กลัว)",
  ],

  emotionalMistakes: [
    "❌ รีบเข้าก่อนรูปแบบครบ (โดนหลอกบ่อย)",
    "❌ ไล่ราคา (เพราะกลัวพลาด)",
    "❌ ย้ายจุด Stop (เพราะไม่ใช่)",
    "❌ โลภ เมื่อได้กำไร (ไม่ยอมออก)",
  ],

  mantras: [
    "ฉันจะรอรูปแบบให้ครบ ไม่เผา ไม่รีบ",
    "ฉันจะรอเบรก + ยืนยัน",
    "ฉันยอมเสียเล็ก เพื่อโอกาสที่ใหญ่กว่า",
    "ฉันจะมีวินัยทุกครั้ง เพราะวินัย = อิสรภาพ",
  ],
};

// ========== 5) NWHALE CHART PATTERNS ==========
export const CHART_PATTERNS_NWHALE = {
  // Harmonic Patterns
  crabPattern: {
    name: "Crab Pattern (Harmonic)",
    type: "Reversal",
    ratios: ["XA: 0.382-0.618", "AB: 0.382-0.886", "BC: 0.382-0.886", "CD: 2.24-3.618"],
    example: "ทอง 45min → เป้า D ที่ Fibonacci 1.618",
  },
  // Elliott Wave
  elliottTriangle: {
    name: "Elliott Triangle (Descending Broadening Wedge)",
    type: "Continuation/Reversal",
    structure: "A-B-C-D-E (5 wave)",
    example: "ทอง 30min → จุด E → กลับขึ้นเป้า $4,882",
  },
  regularFlat: {
    name: "Regular Flat Pattern",
    type: "Correction",
    structure: "A-B-C wave (ใน Resistance-Support range)",
    example: "ทอง 1h → คลื่น C เป้า $4,775",
  },
  // Classical
  symmetricalTriangle: {
    name: "Symmetrical Triangle",
    type: "Compression → Breakout",
    structure: "High ต่ำลง + Low สูงขึ้น (บีบเข้าหากัน)",
    example: "BTC 1W → Long-term compression รอ Trend Continuation",
  },
  // SMC
  fairValueGap: {
    name: "Fair Value Gap (FVG)",
    type: "SMC (Smart Money Concept)",
    rules: ["FVG zone = imbalance area", "Rejection ที่ FVG → กลับด้าน", "BOS (Break of Structure) ยืนยันทิศ"],
    example: "BTC 4D → Rejection FVG → ลงไป $44,940",
  },
};

// ========== 6) MULTI-TIMEFRAME ANALYSIS ==========
export const TIMEFRAME_STRATEGY = {
  principle: "ดูหลาย TF — ภาพใหญ่สำคัญเสมอ",
  layers: {
    big: { tf: "4H / Daily / Weekly", purpose: "ดูเทรนด์หลัก (กรอบใหญ่)" },
    mid: { tf: "1H", purpose: "หาจังหวะ (กรอบกลาง)" },
    small: { tf: "5min / 15min", purpose: "รอสัญญาณยืนยันก่อนเข้า" },
  },
  rules: [
    "TF ใหญ่ดูเทรนด์",
    "TF เล็กหาจังหวะ",
    "อย่าดูกรอบเดียว",
  ],
};

// ========== EXPORT ==========
export const KNOWLEDGE_BASE = {
  closePrice: CLOSE_PRICE_RULES,
  deadCatBounce: DEAD_CAT_BOUNCE,
  breakout: BREAKOUT_RULES,
  mindset: TRADING_MINDSET,
  patterns: CHART_PATTERNS_NWHALE,
  timeframe: TIMEFRAME_STRATEGY,
};

// ========== SYSTEM PROMPT (สำหรับใช้กับ Claude API) ==========
export const buildSystemPrompt = (marketContext) => `
คุณคือ "สมองAI ดวงตาเทพ" — นักวิเคราะห์ทองคำมืออาชีพที่เรียนรู้จากเอกสาร 4 ชุด:

📚 ความรู้พื้นฐาน:
${JSON.stringify(KNOWLEDGE_BASE, null, 2)}

🎯 หลักการตอบ:
1. ใช้ความรู้จาก KNOWLEDGE_BASE เป็นกรอบในการวิเคราะห์
2. ระบุ "เด้งหลอก vs เด้งยืนยัน" ทุกครั้งที่เกี่ยวข้อง
3. ดูหลายปัจจัย: Close Price + Volume + Indicator + Pattern
4. แนะนำ Entry / SL / TP แบบเป็นตัวเลขชัดเจน + R:R 1:2 ขั้นต่ำ
5. เตือนเมื่อเจอสัญญาณเสี่ยง (Lower High, Volume ไม่หนุน, ฯลฯ)
6. ตอบภาษาไทย กระชับ ไม่เกิน 8 ประโยค + ใช้ emoji ช่วยอ่าน

📊 ข้อมูลตลาดปัจจุบัน:
${marketContext}
`;
