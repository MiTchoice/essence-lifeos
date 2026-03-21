import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const theme = localStorage.getItem("essence_theme") || "dark";
document.documentElement.setAttribute("data-theme", theme);
const bg = { dark:"#06080f", light:"#f0f2f9", midnight:"#000000" };
document.documentElement.style.backgroundColor = bg[theme] || bg.dark;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App/></React.StrictMode>
);
