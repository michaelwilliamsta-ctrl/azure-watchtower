"use client";

import { MsalProvider } from "@azure/msal-react";
import { useEffect, useState, type ReactNode } from "react";
import { msalInstance } from "@/lib/auth/msal-config";

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({
  children,
}: AuthProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initialize(): Promise<void> {
      await msalInstance.initialize();

      const result =
        await msalInstance.handleRedirectPromise();

      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
      } else if (
        !msalInstance.getActiveAccount() &&
        msalInstance.getAllAccounts().length > 0
      ) {
        msalInstance.setActiveAccount(
          msalInstance.getAllAccounts()[0],
        );
      }

      setReady(true);
    }

    void initialize();
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Initializing Azure Watchtower...
      </main>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}