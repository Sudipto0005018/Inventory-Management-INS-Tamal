import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
import { BrowserRouter } from "react-router";
import "./index.css";
import Router from "./utils/Router.jsx";
import ContextProvider from "./utils/Context.jsx";
import { ToastProvider } from "./utils/ToastContext";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ToastProvider>
    <ContextProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </ContextProvider>
  </ToastProvider>,
  //  </StrictMode>
);
