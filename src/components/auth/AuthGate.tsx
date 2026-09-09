import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";

type Mode = "login" | "register";

export function AuthGate() {
  const { sessionExpiredMessage } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [banner, setBanner] = useState<string | null>(null);
  const [prefillEmail, setPrefillEmail] = useState<string | undefined>(undefined);

  if (mode === "register") {
    return (
      <RegisterScreen
        onSwitchToLogin={() => setMode("login")}
        onRegistered={(email) => {
          setPrefillEmail(email);
          setBanner("Account created — please log in.");
          setMode("login");
        }}
      />
    );
  }

  return (
    <LoginScreen
      onSwitchToRegister={() => {
        setBanner(null);
        setMode("register");
      }}
      banner={banner ?? sessionExpiredMessage}
      bannerTone={banner ? "success" : "warning"}
      prefillEmail={prefillEmail}
    />
  );
}
