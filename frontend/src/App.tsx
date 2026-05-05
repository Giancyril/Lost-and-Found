import "./App.css";
import { Navbars } from "./components/navbar/Navbars";
import Footers from "./components/footer/Footer";
import { Outlet } from "react-router-dom";
import SecurityHoneypot from "./components/SecurityHoneypot";
import OnboardingTour from "./components/OnboardingTour";

import { useScrollReveal } from "./hooks/useScrollReveal";

function App() {
  useScrollReveal();
  return (
    <>
      <SecurityHoneypot />
      <OnboardingTour />
      <Navbars />
      <Outlet />
      <Footers />
    </>
  );
}

export default App;

