import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SiteHeader } from "./components/layout/SiteHeader";
import { OnboardingScreen } from "./components/onboarding/OnboardingScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { useTheme } from "./hooks/useTheme";
import { useUser } from "./hooks/useUser";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, saveProfile, clearProfile } = useUser();
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <SiteHeader theme={theme} onToggleTheme={toggleTheme} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={user ? "home" : "onboarding"}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {user ? (
            <HomeScreen user={user} onSwitchProfile={clearProfile} />
          ) : (
            <OnboardingScreen onComplete={saveProfile} />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
