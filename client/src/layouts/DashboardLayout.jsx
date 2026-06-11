import { useEffect, useRef, useState } from "react";
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

    document.documentElement.classList.add("theme-transition-active");

    setThemeReveal({
      visible: true,
      x,
      y,
      radius: 0,
      nextTheme,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setThemeReveal((prev) => (prev ? { ...prev, radius: maxRadius } : null));
      });
    });

    themeSwitchRef.current = setTimeout(() => {
      toggleTheme();
    }, 270);

    cleanupRef.current = setTimeout(() => {
      setThemeReveal(null);
      document.documentElement.classList.remove("theme-transition-active");
    }, 600);
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
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            pointerEvents: "none",
            background: themeReveal.nextTheme === "dark" ? "#020617" : "#f8fafc",
            clipPath: `circle(${themeReveal.radius}px at ${themeReveal.x}px ${themeReveal.y}px)`,
            transition: "clip-path 600ms cubic-bezier(0.4, 0, 0.2, 1)",
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
        <main className="p-6 pb-16 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-8 md:pb-16">
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
