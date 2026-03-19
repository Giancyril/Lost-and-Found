import "./App.css";
import { Navbars } from "./components/navbar/Navbars";
import Footers from "./components/footer/Footer";
import { Outlet } from "react-router-dom";
import SecurityHoneypot from "./components/SecurityHoneypot";

function App() {
  return (
    <>
      <SecurityHoneypot />
      <Navbars />
      <Outlet />
      <Footers />
    </>
  );
}

export default App;

