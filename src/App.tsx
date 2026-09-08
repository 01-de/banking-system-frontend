import { useState } from "react";

import { AccountPicker } from "@/components/banking/AccountPicker";
import { Dashboard } from "@/components/banking/Dashboard";
import { PaymentFlow } from "@/components/banking/PaymentFlow";
import { TransferFlow } from "@/components/banking/TransferFlow";
import { AuthBootScreen } from "@/components/auth/AuthBootScreen";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/contexts/AuthContext";

type Screen = "dashboard" | "transfer" | "payment";

function App() {
  const { status } = useAuth();
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  if (status === "booting") {
    return <AuthBootScreen />;
  }

  if (status === "unauthenticated") {
    return <AuthGate />;
  }

  if (!accountNumber) {
    return <AccountPicker onSelect={setAccountNumber} />;
  }

  if (screen === "transfer") {
    return (
      <TransferFlow
        senderAccountNumber={accountNumber}
        onClose={() => setScreen("dashboard")}
        onCompleted={() => setRefreshKey((k) => k + 1)}
      />
    );
  }

  if (screen === "payment") {
    return (
      <PaymentFlow
        accountNumber={accountNumber}
        onClose={() => setScreen("dashboard")}
        onCompleted={() => setRefreshKey((k) => k + 1)}
      />
    );
  }

  return (
    <Dashboard
      key={refreshKey}
      accountNumber={accountNumber}
      onTransfer={() => setScreen("transfer")}
      onTopUp={() => setScreen("payment")}
    />
  );
}

export default App;
