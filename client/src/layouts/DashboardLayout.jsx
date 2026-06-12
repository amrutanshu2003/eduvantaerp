import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FiX } from "react-icons/fi";
import { Outlet, useLocation } from "react-router-dom";
import AppShellSkeleton from "../components/AppShellSkeleton";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useUISettings } from "../context/UISettingsContext";

const DashboardLayout = () => {
  const shellRef = useRef(null);
  const location = useLocation();
  const { settings, loading, resolvedTheme, toggleTheme } = useUISettings();
  const [themeReveal, setThemeReveal] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const themeSwitchRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    return () => {
      if (themeSwitchRef.current) clearTimeout(themeSwitchRef.current);
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

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
    const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transitionClass = nextTheme === "dark" ? "theme-transition-to-dark" : "theme-transition-to-light";
    document.documentElement.classList.add(transitionClass);
    document.documentElement.classList.add("theme-transitioning");

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
        const openClipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`];
        const closeClipPath = [`circle(${maxRadius}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`];

        document.documentElement.animate(
          {
            clipPath: nextTheme === "dark" ? openClipPath : closeClipPath,
          },
          {
            duration: 550,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: nextTheme === "dark" ? "::view-transition-new(root)" : "::view-transition-old(root)",
          },
        );
      });

      transition.finished.finally(() => {
        setThemeReveal(null);
        document.documentElement.classList.remove(transitionClass);
        document.documentElement.classList.remove("theme-transitioning");
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

      themeSwitchRef.current = setTimeout(() => {
        toggleTheme();
      }, 290);

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
    <div ref={shellRef} className="h-screen overflow-hidden" style={{ background: "var(--theme-app-bg)" }}>
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

      <div className="flex h-screen overflow-hidden">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-hidden md:block">
          <Sidebar />
        </aside>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-[260] md:hidden">
            <button
              type="button"
              aria-label="Close sidebar overlay"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 z-[270] flex w-72 max-w-[86vw] flex-col shadow-2xl">
              <div className="flex items-center justify-end px-4 pt-4">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-white"
                  aria-label="Close sidebar"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <Sidebar />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-40 shrink-0">
            <div className="reveal-fade-up reveal-delay-1">
              <Navbar
                onThemeToggle={handleThemeToggle}
                themeReveal={themeReveal}
                onSidebarToggle={() => setMobileSidebarOpen(true)}
              />
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
            <main className="relative min-h-full p-5 pb-8 md:px-8 md:pb-10 md:pt-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_60%)]" />
              <div className="page-reveal">
                <Outlet />
              </div>

              {settings.showFooter !== false ? (
                <footer className="reveal-soft reveal-delay-2 mt-8 border-t border-slate-200/60 px-1 py-3 text-xs text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
                  <div className="flex min-h-[56px] flex-col items-center justify-center gap-2 text-center md:min-h-[56px] md:flex-row md:justify-between md:text-left">
                    <p className="font-medium">© 2026 Eduvanta ERP</p>
                    <p className="max-w-md">Smart ERP for Schools, Colleges & Universities</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                      <span className="font-semibold">v1.0.0</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <a href="#" className="transition-colors hover:text-teal-600 dark:hover:text-teal-300">
                        Privacy
                      </a>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <a href="#" className="transition-colors hover:text-teal-600 dark:hover:text-teal-300">
                        Terms
                      </a>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <a href="#" className="transition-colors hover:text-teal-600 dark:hover:text-teal-300">
                        Support
                      </a>
                    </div>
                  </div>
                </footer>
              ) : null}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
