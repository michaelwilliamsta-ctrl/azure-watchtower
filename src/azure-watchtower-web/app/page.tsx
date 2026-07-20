"use client";

import {
  InteractionStatus,
  type AccountInfo,
} from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useState } from "react";
import {
  azureTokenRequest,
  loginRequest,
} from "@/lib/auth/msal-config";

export default function Home() {
  const { instance, accounts, inProgress } = useMsal();
  const [message, setMessage] = useState(
    "Connect your Microsoft account to begin.",
  );

  const account: AccountInfo | undefined =
    instance.getActiveAccount() ?? accounts[0];

  async function signIn(): Promise<void> {
    await instance.loginRedirect(loginRequest);
  }

  async function testAzureAccess(): Promise<void> {
    if (!account) {
      setMessage("Sign in before requesting Azure access.");
      return;
    }

    try {
      setMessage("Requesting Azure access token...");

      const result = await instance.acquireTokenSilent({
        ...azureTokenRequest,
        account,
      });

      setMessage(
        `Azure access confirmed for ${result.account?.username ?? account.username}.`,
      );
    } catch {
      await instance.acquireTokenRedirect({
        ...azureTokenRequest,
        account,
      });
    }
  }

  async function signOut(): Promise<void> {
    await instance.logoutRedirect({
      account,
      postLogoutRedirectUri:
        process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI ??
        "http://localhost:3000",
    });
  }

  const busy = inProgress !== InteractionStatus.None;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
            Blast Radius Intelligence
          </p>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Azure Watchtower
          </h1>

          <p className="mt-6 text-xl text-slate-300">
            Reduce cloud risk through Blast Radius Intelligence.
          </p>

          {!account ? (
            <button
              type="button"
              onClick={signIn}
              disabled={busy}
              className="mt-10 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              Connect Azure
            </button>
          ) : (
            <div className="mt-10 space-y-5">
              <p className="text-slate-300">
                Signed in as{" "}
                <span className="font-semibold text-white">
                  {account.username}
                </span>
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={testAzureAccess}
                  disabled={busy}
                  className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                >
                  Test Azure Access
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <p className="mt-5 text-sm text-slate-400" aria-live="polite">
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}