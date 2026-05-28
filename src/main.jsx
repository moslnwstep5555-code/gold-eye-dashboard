import React from "react";
import { createRoot } from "react-dom/client";
import GoldBrainDashboard from "./GoldBrainDashboard.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoldBrainDashboard />
  </React.StrictMode>
);
