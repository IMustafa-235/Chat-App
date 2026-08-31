import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "./index.css";
import "./App.css";
import "./responsive.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import FirebaseProvider from "./context/Firebase";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </BrowserRouter>
);
