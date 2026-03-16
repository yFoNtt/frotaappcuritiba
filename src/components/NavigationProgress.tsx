import { useEffect, useRef, useState } from 'react';
import { useNavigation, useLocation } from 'react-router-dom';

export function NavigationProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const location = useLocation();

  useEffect(() => {
    // Start progress on route change
    setVisible(true);
    setProgress(20);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(intervalRef.current);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Complete after a short delay (lazy load settle time)
    const completeTimer = setTimeout(() => {
      clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 400);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(completeTimer);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
