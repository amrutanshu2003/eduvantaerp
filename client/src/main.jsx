import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { UISettingsProvider } from "./context/UISettingsContext";
import { LabelSettingsProvider } from "./context/LabelSettingsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UISettingsProvider>
      <BrowserRouter>
        <AuthProvider>
          <LabelSettingsProvider>
            <App />
          </LabelSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </UISettingsProvider>
  </React.StrictMode>
);
