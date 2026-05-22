import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePortalLoginMutation } from "../../redux/api/api";
import { setUserLocalStorage } from "../../auth/auth";
import { Spinner } from "flowbite-react";

const AutoLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [portalLogin, { isLoading }] = usePortalLoginMutation();

  useEffect(() => {
    const portalUser = searchParams.get("portalUser");
    const portalToken = searchParams.get("portalToken");

    if (!portalUser || !portalToken) {
      navigate("/login");
      return;
    }

    const authenticate = async () => {
      try {
        const res: any = await portalLogin({ portalUser, portalToken });
        if (res?.data?.data?.token) {
          setUserLocalStorage(res.data.data.token);
          // Get role to navigate appropriately
          const role = res.data.data.role;
          // Backend returns "ADMIN" (uppercase) — compare case-insensitively
          if (role?.toLowerCase() === "admin") {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/dashboard/student";
          }
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Portal auto-login failed:", error);
        navigate("/login");
      }
    };

    authenticate();
  }, [searchParams, navigate, portalLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060a12] text-white">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-sm text-gray-400 animate-pulse tracking-widest uppercase">
          Authenticating with SAS Portal...
        </p>
      </div>
    </div>
  );
};

export default AutoLogin;
