import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function NavigationProgress() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 100);
    const t2 = setTimeout(() => setProgress(100), 250);
    const t3 = setTimeout(() => setProgress(0), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (progress === 0) return null;

  return (
    <div
      className="fixed left-0 top-0 z-[100] h-0.5 bg-secondary-500 transition-all duration-200"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-hidden
    />
  );
}
