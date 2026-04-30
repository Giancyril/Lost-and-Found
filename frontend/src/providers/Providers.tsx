import { Provider } from "react-redux";
import { store } from "../redux/store";
import { StudentProvider } from "../components/context/StudentContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StudentProvider>
        {children}
      </StudentProvider>
    </Provider>
  );
}