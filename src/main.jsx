import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.jsx";
import { initStore } from "./lib/store.js";
import { consumeAuthRedirect } from "./lib/cloud.js";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";

// Boot storage system
initStore();

// Register Service Worker for offline PWA operation
if (import.meta.env.PROD && typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
      console.warn("PWA ServiceWorker registration failed: ", err);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
const render = () =>
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

consumeAuthRedirect()
  .catch((err) => {
    console.warn("Auth redirect failed:", err);
  })
  .finally(render);
