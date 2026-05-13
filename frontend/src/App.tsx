import "./App.css";
import { Navbars } from "./components/navbar/Navbars";
import Footers from "./components/footer/Footer";
import { Outlet } from "react-router-dom";
import SecurityHoneypot from "./components/SecurityHoneypot";
import OnboardingTour from "./components/OnboardingTour";
import { AchievementPopup } from "./components/achievements/AchievementPopup";
import { useAchievementWatcher } from "./hooks/useAchievementWatcher";

import { useScrollReveal } from "./hooks/useScrollReveal";

function App() {
  useScrollReveal();
  const { current, dismiss } = useAchievementWatcher();
  return (
    <>
      <SecurityHoneypot />
      <OnboardingTour />
      <Navbars />
      <Outlet />
      <Footers />
      {current && <AchievementPopup achievement={current} onClose={dismiss} />}
    </>
  );
}

export default App;

