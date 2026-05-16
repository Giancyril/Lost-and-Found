import { useState, useEffect } from "react";
import { toast } from "react-toastify";

/**
 * useOfflineSync - A hook to manage offline form drafts and pending submissions.
 * @param key Unique key for the form (e.g., 'lost_item' or 'found_item')
 * @param resetForm Function to clear the form after successful sync
 */
export const useOfflineSync = (key: string, resetForm?: () => void) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(`form_draft_${key}`);
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info("Back online! You can now sync your pending reports.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are currently offline. Reports will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load pending reports
    const savedPending = localStorage.getItem(`pending_reports_${key}`);
    if (savedPending) {
      setPendingReports(JSON.parse(savedPending));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [key]);

  // --- Draft Management ---
  const saveDraft = (data: any) => {
    localStorage.setItem(`form_draft_${key}`, JSON.stringify(data));
    setHasDraft(true);
  };

  const loadDraft = () => {
    const draft = localStorage.getItem(`form_draft_${key}`);
    return draft ? JSON.parse(draft) : null;
  };

  const clearDraft = () => {
    localStorage.removeItem(`form_draft_${key}`);
    setHasDraft(false);
  };

  // --- Pending Submissions Management ---
  const queueOfflineReport = (report: any) => {
    const newReport = {
      ...report,
      _offlineId: Date.now(),
      _queuedAt: new Date().toISOString(),
    };
    const newPending = [...pendingReports, newReport];
    setPendingReports(newPending);
    localStorage.setItem(`pending_reports_${key}`, JSON.stringify(newPending));
    
    // Clear draft since it's now in the queue
    clearDraft();
    
    toast.success("Report saved to offline queue. It will be synced when you are back online.");
    if (resetForm) resetForm();
  };

  const removePendingReport = (offlineId: number) => {
    const newPending = pendingReports.filter((r) => r._offlineId !== offlineId);
    setPendingReports(newPending);
    localStorage.setItem(`pending_reports_${key}`, JSON.stringify(newPending));
  };

  const clearPendingQueue = () => {
    localStorage.removeItem(`pending_reports_${key}`);
    setPendingReports([]);
  };

  return {
    isOnline,
    hasDraft,
    pendingReports,
    saveDraft,
    loadDraft,
    clearDraft,
    queueOfflineReport,
    removePendingReport,
    clearPendingQueue,
  };
};
