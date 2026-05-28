import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ANTHROPIC_API_KEY || "";

  return {
    plugins: [
      react(),
      {
        name: "anthropic-proxy",
        configureServer(server) {
          server.middlewares.use("/api/messages", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              return res.end("Method Not Allowed");
            }
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({
                error: "ANTHROPIC_API_KEY ยังไม่ได้ตั้งค่าใน .env"
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
                    "x-api-key": apiKey,
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
