import "./App.css";
import { Navbars } from "./components/navbar/Navbars";
import Footers from "./components/footer/Footer";
import { Outlet } from "react-router-dom";
import SecurityHoneypot from "./components/SecurityHoneypot";
import OnboardingTour from "./components/OnboardingTour";
import { AchievementPopup } from "./components/achievements/AchievementPopup";
import { useAchievementWatcher } from "./hooks/useAchievementWatcher";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {current && <AchievementPopup key={current.id} achievement={current} onClose={dismiss} />}
    </>
  );
}


export default App;

