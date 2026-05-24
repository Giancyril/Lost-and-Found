import { useEffect, useRef } from 'react';
import { useStudentContext } from '../components/context/StudentContext';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useSessionTimeout = () => {
  const { student, setStudent } = useStudentContext();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setStudent(null);
    navigate("/");
    window.location.reload();
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only apply timeout if user is logged in AND they are not an admin
    if (student && student.role !== 'admin') {
      timeoutRef.current = setTimeout(() => {
        logout();
      }, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Initial timer setup
    resetTimer();

    // Events that signify user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart'
    ];

    const handleActivity = () => {
      // Throttle the reset to avoid excessive calculations on mousemove
      resetTimer();
    };

    if (student && student.role !== 'admin') {
      events.forEach((event) => {
        window.addEventListener(event, handleActivity, { passive: true });
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [student]); // Re-run setup if student login state or role changes
};
