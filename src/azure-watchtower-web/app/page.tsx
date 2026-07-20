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
import {
  querySubscriptionResources,
  ResourceGraphApiError,
  summarizeResourcesByType,
} from "@/lib/inventory/resource-graph-client";
import type {
  AzureResource,
  ResourceTypeSummary,
} from "@/lib/inventory/inventory-types";

export default function Home() {
  const { instance, accounts, inProgress } = useMsal();

  const [subscriptions, setSubscriptions] = useState<
    AzureSubscription[]
  >([]);

  const [selectedSubscriptionId, setSelectedSubscriptionId] =
    useState("");

  const [resources, setResources] = useState<
    AzureResource[]
  >([]);

  const [resourceSummary, setResourceSummary] = useState<
    ResourceTypeSummary[]
  >([]);

  const [selectedResourceType, setSelectedResourceType] = useState<
    string | null
  >(null);

  const [statusMessage, setStatusMessage] = useState(
    "Connect your Microsoft account to begin.",
  );

  const [isDiscoveringSubscriptions, setIsDiscoveringSubscriptions] =
    useState(false);

  const [isScanningResources, setIsScanningResources] =
    useState(false);

  const account: AccountInfo | undefined =
    instance.getActiveAccount() ?? accounts[0];

  const busy =
    inProgress !== InteractionStatus.None ||
    isDiscoveringSubscriptions ||
    isScanningResources;

  const selectedResources = selectedResourceType
    ? resources.filter(
        (resource) => resource.type === selectedResourceType,
      )
    : [];

  async function signIn(): Promise<void> {
    setStatusMessage("Opening Microsoft sign-in...");
    await instance.loginRedirect(loginRequest);
  }

  async function getAzureAccessToken(): Promise<string> {
    if (!account) {
      throw new Error("No signed-in Microsoft account was found.");
    }

    try {
      const result = await instance.acquireTokenSilent({
        ...azureTokenRequest,
        account,
      });

      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({
          ...azureTokenRequest,
          account,
        });
      }

      throw error;
    }
  }

  async function discoverSubscriptions(): Promise<void> {
    if (!account) {
      setStatusMessage("Sign in before discovering subscriptions.");
      return;
    }

    try {
      setIsDiscoveringSubscriptions(true);
      setSubscriptions([]);
      setSelectedSubscriptionId("");
      setResources([]);
      setResourceSummary([]);
      setSelectedResourceType(null);
      setStatusMessage("Discovering Azure subscriptions...");

      const accessToken = await getAzureAccessToken();
      const result = await listAzureSubscriptions(accessToken);

      setSubscriptions(result);

      if (result.length === 0) {
        setStatusMessage(
          "No accessible Azure subscriptions were found.",
        );
        return;
      }

      setSelectedSubscriptionId(result[0].subscriptionId);

      setStatusMessage(
        `Discovered ${result.length} accessible subscription${
          result.length === 1 ? "" : "s"
        }. Select a subscription and run an inventory scan.`,
      );
    } catch (error) {
      handleAzureError(error, "Subscription discovery failed");
    } finally {
      setIsDiscoveringSubscriptions(false);
    }
  }

  async function scanSelectedSubscription(): Promise<void> {
    if (!selectedSubscriptionId) {
      setStatusMessage("Select a subscription before running a scan.");
      return;
    }

    try {
      setIsScanningResources(true);
      setResources([]);
      setResourceSummary([]);
      setSelectedResourceType(null);
      setStatusMessage("Querying Azure Resource Graph...");

      const accessToken = await getAzureAccessToken();

      const discoveredResources =
        await querySubscriptionResources(
          accessToken,
          selectedSubscriptionId,
        );

      const summary =
        summarizeResourcesByType(discoveredResources);

      setResources(discoveredResources);
      setResourceSummary(summary);

      setStatusMessage(
        `Inventory scan completed. Discovered ${discoveredResources.length} resource${
          discoveredResources.length === 1 ? "" : "s"
        } across ${summary.length} resource type${
          summary.length === 1 ? "" : "s"
        }.`,
      );
    } catch (error) {
      if (error instanceof ResourceGraphApiError) {
        console.error(error.responseBody);

        if (error.status === 403) {
          setStatusMessage(
            "The signed-in account does not have permission to query Azure Resource Graph for this subscription.",
          );
          return;
        }

        setStatusMessage(
          `Resource inventory failed with Azure status ${error.status}.`,
        );
        return;
      }

      handleAzureError(error, "Resource inventory failed");
    } finally {
      setIsScanningResources(false);
    }
  }

  function handleAzureError(
    error: unknown,
    prefix: string,
  ): void {
    if (error instanceof AzureApiError) {
      console.error(error.responseBody);

      setStatusMessage(
        `${prefix} with Azure status ${error.status}.`,
      );
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

    setStatusMessage(`${prefix}: ${message}`);
  }

  async function signOut(): Promise<void> {
    await instance.logoutRedirect({
      account,
      postLogoutRedirectUri:
        process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI ??
        "http://localhost:3000",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto min-h-screen max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="pt-10">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
              Blast Radius Intelligence
            </p>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Azure Watchtower
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Reduce cloud risk through Blast Radius Intelligence.
            </p>

            <p className="mt-5 max-w-2xl leading-7 text-slate-400">
              Connect your Azure environment, select a subscription,
              and build the first security-focused resource inventory.
            </p>
          </header>

          {!account ? (
            <button
              type="button"
              onClick={signIn}
              disabled={busy}
              className="mt-10 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
            >
              Connect Azure
            </button>
          ) : (
            <section className="mt-10 space-y-6">
              <p className="text-sm text-slate-300">
                Signed in as{" "}
                <span className="font-semibold text-white">
                  {account.username}
                </span>
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={discoverSubscriptions}
                  disabled={busy}
                  className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
                >
                  {isDiscoveringSubscriptions
                    ? "Discovering..."
                    : "Discover Subscriptions"}
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-900 disabled:opacity-60"
                >
                  Sign Out
                </button>
              </div>

              {subscriptions.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
                  <label
                    htmlFor="subscription"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Azure subscription
                  </label>

                  <select
                    id="subscription"
                    value={selectedSubscriptionId}
                    onChange={(event) => {
                      setSelectedSubscriptionId(event.target.value);
                      setResources([]);
                      setResourceSummary([]);
                      setSelectedResourceType(null);
                    }}
                    className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  >
                    {subscriptions.map((subscription) => (
                      <option
                        key={subscription.subscriptionId}
                        value={subscription.subscriptionId}
                      >
                        {subscription.displayName}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={scanSelectedSubscription}
                    disabled={busy || !selectedSubscriptionId}
                    className="mt-5 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {isScanningResources
                      ? "Scanning Resources..."
                      : "Run Inventory Scan"}
                  </button>
                </div>
              )}
            </section>
          )}

          <div
            className="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 px-5 py-4"
            aria-live="polite"
          >
            <p className="text-sm text-slate-300">
              {statusMessage}
            </p>
          </div>

          {resourceSummary.length > 0 && (
            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
                    Inventory
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold">
                    Resources by Type
                  </h2>
                </div>

                <p className="text-sm text-slate-400">
                  {resources.length} total resources
                </p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resourceSummary.map((item) => {
                  const isSelected =
                    selectedResourceType === item.resourceType;

                  return (
                    <button
                      key={item.resourceType}
                      type="button"
                      aria-pressed={isSelected}
                      aria-controls="selected-resource-details"
                      onClick={() =>
                        setSelectedResourceType(item.resourceType)
                      }
                      className={`rounded-xl border p-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                        isSelected
                          ? "border-sky-400 bg-sky-950/60"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900"
                      }`}
                    >
                      <span className="block text-4xl font-bold text-white">
                        {item.count}
                      </span>

                      <span className="mt-3 block font-semibold text-slate-200">
                        {item.displayName}
                      </span>

                      <span className="mt-2 block break-all font-mono text-xs text-slate-500">
                        {item.resourceType}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedResourceType && (
                <section
                  id="selected-resource-details"
                  className="mt-12"
                  aria-labelledby="selected-resource-heading"
                >
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        Resource Details
                      </p>

                      <h2
                        id="selected-resource-heading"
                        className="mt-2 text-3xl font-semibold"
                      >
                        {selectedResourceType}
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        {selectedResources.length} matching resource
                        {selectedResources.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedResourceType(null)}
                      className="rounded-lg border border-slate-700 px-5 py-2.5 font-semibold text-slate-200 transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    {selectedResources.map((resource) => {
                      const tags = Object.entries(resource.tags ?? {});

                      return (
                        <article
                          key={resource.id}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
                        >
                          <h3 className="text-xl font-semibold text-white">
                            {resource.name}
                          </h3>

                          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Type
                              </dt>
                              <dd className="mt-1 break-all font-mono text-sm text-slate-200">
                                {resource.type}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Location
                              </dt>
                              <dd className="mt-1 text-sm text-slate-200">
                                {resource.location || "Not specified"}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Resource Group
                              </dt>
                              <dd className="mt-1 break-all text-sm text-slate-200">
                                {resource.resourceGroup || "Not specified"}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Subscription ID
                              </dt>
                              <dd className="mt-1 break-all font-mono text-sm text-slate-200">
                                {resource.subscriptionId}
                              </dd>
                            </div>

                            <div className="sm:col-span-2">
                              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Azure Resource ID
                              </dt>
                              <dd className="mt-1 break-all font-mono text-sm text-slate-200">
                                {resource.id}
                              </dd>
                            </div>
                          </dl>

                          {tags.length > 0 && (
                            <div className="mt-6 border-t border-slate-800 pt-5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tags
                              </h4>

                              <dl className="mt-3 flex flex-wrap gap-2">
                                {tags.map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                                  >
                                    <dt className="inline font-semibold text-sky-400">
                                      {key}
                                    </dt>
                                    <dd className="inline text-slate-300">
                                      {`: ${value}`}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
