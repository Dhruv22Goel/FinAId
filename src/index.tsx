import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

const updateSW = registerSW({
  onNeedRefresh() {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("A new version of guitos is available. Update?")) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateSW(true);
    }
  },
});

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
//just like anyother React index file
// The only difference is that it has a registerSW function that helps to update the website when ever a new.
//version is avaliable
