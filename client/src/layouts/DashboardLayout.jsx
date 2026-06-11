import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Outlet } from "react-router-dom";
import AppShellSkeleton from "../components/AppShellSkeleton";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useUISettings } from "../context/UISettingsContext";

const DashboardLayout = () => {
  const shellRef = useRef(null);
  const { settings, loading, resolvedTheme, toggleTheme } = useUISettings();
  const [themeReveal, setThemeReveal] = useState(null);
  const themeSwitchRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    return () => {
      if (themeSwitchRef.current) clearTimeout(themeSwitchRef.current);
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, []);

  const handleThemeToggle = (originElement) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    if (prefersReducedMotion) {
      toggleTheme();
      return;
    }

    if (themeSwitchRef.current) clearTimeout(themeSwitchRef.current);
    if (cleanupRef.current) clearTimeout(cleanupRef.current);

    const rect = originElement?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Add transition classes BEFORE startViewTransition to prevent flicker
    const transitionClass = nextTheme === "dark" ? "theme-transition-to-dark" : "theme-transition-to-light";
    document.documentElement.classList.add(transitionClass);
    document.documentElement.classList.add("theme-transitioning");

    // Force body background to current theme color to prevent flicker
    const currentBg = resolvedTheme === "dark" ? "#07111f" : "#f8fafc";
    document.body.style.background = currentBg;
    document.documentElement.style.background = currentBg;

    if (document.startViewTransition) {
      setThemeReveal({
        visible: false,
        x,
        y,
        radius: maxRadius,
        nextTheme,
      });

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          toggleTheme();
        });
      });

      transition.ready.then(() => {
        const openClipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ];

        const closeClipPath = [
          `circle(${maxRadius}px at ${x}px ${y}px)`,
          `circle(0px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: nextTheme === "dark" ? openClipPath : closeClipPath,
          },
          {
            duration: 550,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement:
              nextTheme === "dark"
                ? "::view-transition-new(root)"
                : "::view-transition-old(root)",
          }
        );
      });

      transition.finished.finally(() => {
        setThemeReveal(null);
        // Remove transition classes after animation completes
        document.documentElement.classList.remove(transitionClass);
        document.documentElement.classList.remove("theme-transitioning");
        // Remove inline background styles
        document.body.style.background = "";
        document.documentElement.style.background = "";
      });
    } else {
      document.documentElement.classList.add("theme-transition-active");

      setThemeReveal({
        visible: true,
        x,
        y,
        radius: maxRadius,
        nextTheme,
      });

      // Switch theme at ~45% of the 650ms animation duration (around 290ms)
      themeSwitchRef.current = setTimeout(() => {
        toggleTheme();
      }, 290);

      // Remove overlay exactly at animation end (650ms)
      cleanupRef.current = setTimeout(() => {
        setThemeReveal(null);
        document.documentElement.classList.remove("theme-transition-active");
        document.documentElement.classList.remove(transitionClass);
        document.documentElement.classList.remove("theme-transitioning");
        document.body.style.background = "";
        document.documentElement.style.background = "";
      }, 650);
    }
  };

  if (loading) {
    return <AppShellSkeleton message="Applying your institute theme..." />;
  }

  return (
    <div
      ref={shellRef}
      className="min-h-screen md:flex md:h-screen md:overflow-hidden"
      style={{ background: "var(--theme-app-bg)" }}
    >
      {themeReveal && themeReveal.visible ? (
        <div
          aria-hidden="true"
          className="telegram-theme-overlay"
          style={{
            background: themeReveal.nextTheme === "dark" ? "#07111f" : "#f8fafc",
            "--ripple-x": `${themeReveal.x}px`,
            "--ripple-y": `${themeReveal.y}px`,
            "--ripple-radius": `${themeReveal.radius}px`,
          }}
        />
      ) : null}
      <div className="reveal-fade-up">
        <Sidebar />
      </div>
      <div className="flex-1 md:flex md:min-h-0 md:flex-col md:overflow-hidden">
        <div className="reveal-fade-up reveal-delay-1">
          <Navbar onThemeToggle={handleThemeToggle} themeReveal={themeReveal} />
        </div>
        <main className="p-6 pb-24 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-8 md:pb-24">
          <div className="page-reveal">
            <Outlet />
          </div>
        </main>
        <footer className="reveal-soft reveal-delay-2 border-t border-slate-200/60 dark:border-slate-800/60 py-4 px-6 md:px-8 text-xs text-slate-500 dark:text-slate-400 grid grid-cols-1 md:grid-cols-3 items-center gap-3 bg-white/40 dark:bg-slate-950/10 backdrop-blur-sm">
          <div className="text-center md:text-left font-medium">
            © 2026 Eduvanta ERP
          </div>
          <div className="text-center text-slate-500 dark:text-slate-400 font-normal">
            {settings.footerText || "Smart ERP for Schools, Colleges & Universities"}
          </div>
          <div className="flex items-center justify-center md:justify-end gap-2.5">
            <span className="font-semibold text-slate-400 dark:text-slate-500">v1.0.0</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium">Privacy</a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium">Terms</a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
