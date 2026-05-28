import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const geminiKey = env.GEMINI_API_KEY || "";
  const anthropicKey = env.ANTHROPIC_API_KEY || "";

  return {
    plugins: [
      react(),
      {
        name: "ai-proxy",
        configureServer(server) {
          // Gemini proxy
          server.middlewares.use("/api/gemini", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              return res.end("Method Not Allowed");
            }
            if (!geminiKey) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({
                error: "GEMINI_API_KEY ยังไม่ได้ตั้งค่าใน .env (สมัครฟรีที่ aistudio.google.com/apikey)"
              }));
            }
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", async () => {
              try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
                const upstream = await fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body,
                });
                const text = await upstream.text();
                res.statusCode = upstream.status;
                res.setHeader("Content-Type", "application/json");
                res.end(text);
              } catch (e) {
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: String(e) }));
              }
            });
          });

          // Anthropic proxy (สำรอง — ใช้ได้ถ้าใส่ key)
          server.middlewares.use("/api/messages", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              return res.end("Method Not Allowed");
            }
            if (!anthropicKey) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({
                error: "ANTHROPIC_API_KEY ยังไม่ได้ตั้งค่า — ใช้ /api/gemini แทน"
              }));
            }
            let body = "";
            req.on("data", (c) => (body += c));
            req.on("end", async () => {
              try {
                const upstream = await fetch("https://api.anthropic.com/v1/messages", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": anthropicKey,
                    "anthropic-version": "2023-06-01",
                  },
                  body,
                });
                const text = await upstream.text();
                res.statusCode = upstream.status;
                res.setHeader("Content-Type", "application/json");
                res.end(text);
              } catch (e) {
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: String(e) }));
              }
            });
          });
        },
      },
    ],
    server: { port: 5173, host: "127.0.0.1" },
  };
});
