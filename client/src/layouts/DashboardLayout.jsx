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

  useEffect(() => {
    if (!themeReveal) {
      return undefined;
    }

    const cleanupTimer = window.setTimeout(() => {
      setThemeReveal(null);
    }, themeReveal.duration);

    return () => window.clearTimeout(cleanupTimer);
  }, [themeReveal]);

  const handleThemeToggle = (originElement) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      toggleTheme();
      return;
    }

    const isDark = resolvedTheme === "dark";
    const rect = originElement?.getBoundingClientRect();
    const shellRect = shellRef.current?.getBoundingClientRect();
    const originX = rect && shellRect ? rect.left - shellRect.left + rect.width / 2 : 40;
    const originY = rect && shellRect ? rect.top - shellRect.top + rect.height / 2 : 40;
    const maxRadius = Math.hypot(
      Math.max(originX, (shellRect?.width || 0) - originX),
      Math.max(originY, (shellRect?.height || 0) - originY)
    );

    setThemeReveal({
      x: originX,
      y: originY,
      startRadius: isDark ? maxRadius : 0,
      endRadius: isDark ? 0 : maxRadius,
      duration: isDark ? 700 : 760,
      direction: isDark ? "collapse" : "expand",
      overlayTheme: "dark",
    });

    window.setTimeout(() => {
      toggleTheme();
    }, isDark ? 30 : 300);
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
      <style>
        {`
          @keyframes login-theme-expand {
            0% {
              clip-path: circle(var(--theme-start-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 0.24;
              transform: scale(0.88);
              filter: saturate(1.12);
            }
            55% {
              opacity: 0.92;
              transform: scale(1.02);
              filter: saturate(1.04);
            }
            100% {
              clip-path: circle(var(--theme-end-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 1;
              transform: scale(1);
              filter: saturate(1);
            }
          }
          @keyframes login-theme-collapse {
            0% {
              clip-path: circle(var(--theme-start-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 1;
              transform: scale(1);
              filter: saturate(1);
            }
            38% {
              opacity: 0.96;
              transform: scale(0.985);
              filter: saturate(1.04);
            }
            100% {
              clip-path: circle(var(--theme-end-radius) at var(--theme-origin-x) var(--theme-origin-y));
              opacity: 0.16;
              transform: scale(0.64);
              filter: saturate(1.12);
            }
          }
          @keyframes login-theme-icon-bloom {
            0% { transform: scale(1) rotate(0deg); }
            35% { transform: scale(0.88) rotate(-10deg); }
            100% { transform: scale(1.08) rotate(10deg); }
          }
          @keyframes login-theme-icon-dock {
            0% { transform: scale(1) rotate(0deg); }
            40% { transform: scale(1.08) rotate(8deg); }
            100% { transform: scale(0.86) rotate(-10deg); }
          }
        `}
      </style>
      {themeReveal ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              "radial-gradient(circle at top, rgba(20,184,166,0.16), transparent 34%), linear-gradient(180deg, #08111f 0%, #0b1324 100%)",
            "--theme-origin-x": `${themeReveal.x}px`,
            "--theme-origin-y": `${themeReveal.y}px`,
            "--theme-start-radius": `${themeReveal.startRadius}px`,
            "--theme-end-radius": `${themeReveal.endRadius}px`,
            clipPath: `circle(${themeReveal.startRadius}px at ${themeReveal.x}px ${themeReveal.y}px)`,
            animation: `${themeReveal.direction === "expand" ? "login-theme-expand" : "login-theme-collapse"} ${themeReveal.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            transformOrigin: `${themeReveal.x}px ${themeReveal.y}px`,
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
        <main className="p-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-8">
          <div className="page-reveal">
            <Outlet />
          </div>
        </main>
        <footer className="reveal-soft reveal-delay-2 px-6 pb-8 text-sm text-slate-500 md:px-8">{settings.footerText}</footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
