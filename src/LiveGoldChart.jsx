import { useEffect, useRef } from "react";

// ========== TIMEFRAME MAP สำหรับ TradingView ==========
const TF_MAP = {
  M1: "1",
  M5: "5",
  M15: "15",
  M30: "30",
  H1: "60",
  H4: "240",
  D1: "D",
  W1: "W",
  MN: "M",
};

/**
 * กราฟทอง Real-time จาก TradingView
 * - ไม่ต้องใช้ API key
 * - ข้อมูลเรียลไทม์จากตลาดจริง
 * - รองรับ timeframe เปลี่ยนได้
 */
export default function LiveGoldChart({ timeframe = "H1", height = 460 }) {
  const containerRef = useRef(null);
  const widgetId = useRef(`tv_${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!containerRef.current) return;

    // ลบ widget เก่าก่อน
    containerRef.current.innerHTML = "";
    const target = document.createElement("div");
    target.id = widgetId.current;
    target.style.width = "100%";
    target.style.height = "100%";
    containerRef.current.appendChild(target);

    // โหลด TradingView script (ครั้งเดียว)
    const loadScript = () =>
      new Promise((resolve) => {
        if (window.TradingView) return resolve();
        const s = document.createElement("script");
        s.src = "https://s3.tradingview.com/tv.js";
        s.async = true;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !window.TradingView) return;
      try {
        new window.TradingView.widget({
          autosize: true,
          symbol: "OANDA:XAUUSD",
          interval: TF_MAP[timeframe] || "60",
          timezone: "Asia/Bangkok",
          theme: "dark",
          style: "1",
          locale: "th_TH",
          toolbar_bg: "#0c0802",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: widgetId.current,
          hide_side_toolbar: false,
          studies: [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies",
            "Volume@tv-basicstudies",
          ],
          overrides: {
            "paneProperties.background": "#080500",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "rgba(255,215,0,0.05)",
            "paneProperties.horzGridProperties.color": "rgba(255,215,0,0.05)",
            "scalesProperties.textColor": "#c8a860",
            "mainSeriesProperties.candleStyle.upColor": "#00e5a0",
            "mainSeriesProperties.candleStyle.downColor": "#ff4d6d",
            "mainSeriesProperties.candleStyle.borderUpColor": "#00e5a0",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ff4d6d",
            "mainSeriesProperties.candleStyle.wickUpColor": "#00e5a0",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ff4d6d",
          },
        });
      } catch (e) {
        console.error("TradingView widget error:", e);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        background: "#080500",
        borderRadius: 8,
        overflow: "hidden",
      }}
    />
  );
}
