import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function usePortalInterceptor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const portalUser = searchParams.get("portalUser");
    const portalToken = searchParams.get("portalToken");

    if (portalUser && portalToken) {
      navigate(`/sas-auto-login?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);
}
