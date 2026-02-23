import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  useEffect(() => {
    // Trigger fade-in animation on route change
    const element = document.querySelector("[data-page-transition]");
    if (element) {
      // Reset animation
      element.classList.remove("animate-fade-in");
      // Reflow to restart animation
      void (element as HTMLElement).offsetWidth;
      // Add animation class
      element.classList.add("animate-fade-in");
    }

    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div data-page-transition className="animate-fade-in">
      {children}
    </div>
  );
}
