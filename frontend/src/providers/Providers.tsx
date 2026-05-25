import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "../redux/store";
import { StudentProvider } from "../components/context/StudentContext";
import SecurityHoneypot from "../components/SecurityHoneypot";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StudentProvider>
        <SecurityHoneypot />
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          limit={4}
        />
      </StudentProvider>
    </Provider>
  );
}