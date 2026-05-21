import { Provider } from "react-redux";
import { store } from "../redux/store";
import { StudentProvider } from "../components/context/StudentContext";
import DevToolsDetector from "../components/DevToolsDetector";
import SecurityHoneypot from "../components/SecurityHoneypot";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StudentProvider>
        <DevToolsDetector />
        <SecurityHoneypot />
        {children}
      </StudentProvider>
    </Provider>
  );
}