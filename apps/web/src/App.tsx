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
import { GeneratorScreen } from "./components/screens/GeneratorScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { PlaceholderScreen } from "./components/screens/PlaceholderScreen";
import { ArchiveProvider } from "./context/ArchiveProvider";
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
            // key={email}: a different profile always gets a fresh archive.
            <ArchiveProvider key={user.email} email={user.email}>
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <HomeScreen user={user} onSwitchProfile={clearProfile} />
                  }
                />
                <Route path="/generate" element={<GeneratorScreen />} />
                <Route
                  path="/archive"
                  element={
                    <PlaceholderScreen
                      eyebrow="Phase 3"
                      title="Archive"
                      description="Every set you generate is already saved per profile. Search, filters and ratings arrive with this page."
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ArchiveProvider>
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
