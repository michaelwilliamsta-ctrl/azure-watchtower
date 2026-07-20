"use client";

import {
  InteractionRequiredAuthError,
  InteractionStatus,
  type AccountInfo,
} from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useState } from "react";

import {
  azureTokenRequest,
  loginRequest,
} from "@/lib/auth/msal-config";
import {
  AzureApiError,
  listAzureSubscriptions,
} from "@/lib/azure/subscriptions-client";
import type { AzureSubscription } from "@/lib/azure/subscription-types";

export default function Home() {
  const { instance, accounts, inProgress } = useMsal();

  const [subscriptions, setSubscriptions] = useState<
    AzureSubscription[]
  >([]);

  const [statusMessage, setStatusMessage] = useState(
    "Connect your Microsoft account to discover Azure subscriptions.",
  );

  const [isLoadingSubscriptions, setIsLoadingSubscriptions] =
    useState(false);

  const account: AccountInfo | undefined =
    instance.getActiveAccount() ?? accounts[0];

  const interactionInProgress =
    inProgress !== InteractionStatus.None;

  async function signIn(): Promise<void> {
    try {
      setStatusMessage("Opening Microsoft sign-in...");

      await instance.loginRedirect(loginRequest);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected sign-in error occurred.";

      setStatusMessage(`Microsoft sign-in failed: ${message}`);
    }
  }

  async function discoverSubscriptions(): Promise<void> {
    if (!account) {
      setStatusMessage(
        "Sign in before discovering Azure subscriptions.",
      );
      return;
    }

    try {
      setIsLoadingSubscriptions(true);
      setSubscriptions([]);
      setStatusMessage("Acquiring Azure access token...");

      const tokenResult = await instance.acquireTokenSilent({
        ...azureTokenRequest,
        account,
      });

      setStatusMessage("Discovering Azure subscriptions...");

      const discoveredSubscriptions =
        await listAzureSubscriptions(tokenResult.accessToken);

      setSubscriptions(discoveredSubscriptions);

      if (discoveredSubscriptions.length === 0) {
        setStatusMessage(
          "Authentication succeeded, but this account cannot access any Azure subscriptions in this tenant.",
        );
        return;
      }

      setStatusMessage(
        `Discovered ${discoveredSubscriptions.length} accessible Azure subscription${
          discoveredSubscriptions.length === 1 ? "" : "s"
        }.`,
      );
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        setStatusMessage(
          "Additional Microsoft consent is required. Redirecting...",
        );

        await instance.acquireTokenRedirect({
          ...azureTokenRequest,
          account,
        });

        return;
      }

      if (error instanceof AzureApiError) {
        if (error.status === 401) {
          setStatusMessage(
            "Azure rejected the access token. Sign out, sign back in, and try again.",
          );
          return;
        }

        if (error.status === 403) {
          setStatusMessage(
            "Your account signed in successfully but does not have permission to list Azure subscriptions.",
          );
          return;
        }

        setStatusMessage(
          `Azure subscription discovery failed with status ${error.status}.`,
        );

        console.error(error.responseBody);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected discovery error occurred.";

      setStatusMessage(
        `Unable to discover subscriptions: ${message}`,
      );
    } finally {
      setIsLoadingSubscriptions(false);
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

  const busy =
    interactionInProgress || isLoadingSubscriptions;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto min-h-screen max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="pt-16">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
              Blast Radius Intelligence
            </p>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Azure Watchtower
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Reduce cloud risk through Blast Radius Intelligence.
            </p>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
              Connect securely with Microsoft Entra ID and discover
              the Azure subscriptions available to your account.
            </p>
          </header>

          {!account ? (
            <div className="mt-10">
              <button
                type="button"
                onClick={signIn}
                disabled={busy}
                className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Connect Azure
              </button>
            </div>
          ) : (
            <div className="mt-10">
              <p className="text-sm text-slate-300">
                Signed in as{" "}
                <span className="font-semibold text-white">
                  {account.username}
                </span>
              </p>

              <div className="mt-5 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={discoverSubscriptions}
                  disabled={busy}
                  className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingSubscriptions
                    ? "Discovering..."
                    : "Discover Subscriptions"}
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div
            className="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 px-5 py-4"
            aria-live="polite"
          >
            <p className="text-sm text-slate-300">
              {statusMessage}
            </p>
          </div>

          {subscriptions.length > 0 && (
            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
                    Inventory
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold">
                    Azure Subscriptions
                  </h2>
                </div>

                <p className="text-sm text-slate-400">
                  {subscriptions.length} discovered
                </p>
              </div>

              <div className="mt-6 grid gap-5">
                {subscriptions.map((subscription) => (
                  <article
                    key={subscription.subscriptionId}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {subscription.displayName}
                        </h3>

                        <p className="mt-2 break-all font-mono text-sm text-slate-400">
                          {subscription.subscriptionId}
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {subscription.state}
                      </span>
                    </div>

                    <dl className="mt-6 grid gap-4 border-t border-slate-800 pt-5 md:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Tenant ID
                        </dt>

                        <dd className="mt-2 break-all font-mono text-sm text-slate-300">
                          {subscription.tenantId}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Resource ID
                        </dt>

                        <dd className="mt-2 break-all font-mono text-sm text-slate-300">
                          {subscription.id}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}