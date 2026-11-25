import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SiteHeader } from "./components/layout/SiteHeader";
import { OnboardingScreen } from "./components/onboarding/OnboardingScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { PlaceholderScreen } from "./components/screens/PlaceholderScreen";
import { useTheme } from "./hooks/useTheme";
import { useUser } from "./hooks/useUser";

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, saveProfile, clearProfile } = useUser();
  const reduceMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const routeKey = user ? location.pathname : "onboarding";

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showMenu={user !== null}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={routeKey}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {user ? (
            // Passing `location` keeps the exiting page rendering its own route.
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <HomeScreen user={user} onSwitchProfile={clearProfile} />
                }
              />
              <Route
                path="/generate"
                element={
                  <PlaceholderScreen
                    eyebrow="Phase 2"
                    title="Generator"
                    description="Paste your notes and turn them into cards. This page is next on the build list."
                  />
                }
              />
              <Route
                path="/archive"
                element={
                  <PlaceholderScreen
                    eyebrow="Phase 3"
                    title="Archive"
                    description="Every set you generate will live here, kept per profile, with search, filters and ratings."
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <OnboardingScreen onComplete={saveProfile} />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
