import "./App.css";
import { Navbars } from "./components/navbar/Navbars";
import Footers from "./components/footer/Footer";
import { Outlet } from "react-router-dom";
import OnboardingTour from "./components/OnboardingTour";
import { AchievementPopup } from "./components/achievements/AchievementPopup";
import { useAchievementWatcher } from "./hooks/useAchievementWatcher";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useSessionTimeout } from "./hooks/useSessionTimeout";

function App() {
  useScrollReveal();
  useSessionTimeout();
  const { current, dismiss } = useAchievementWatcher();
  return (
    <>
      <OnboardingTour />
      <Navbars />
      <Outlet />
      <Footers />
      {current && <AchievementPopup key={current.id} achievement={current} onClose={dismiss} />}
    </>
  );
}


export default App;

