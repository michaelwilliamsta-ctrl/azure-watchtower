"use client";

import { useState } from "react";

type HealthResponse = {
  status: string;
  version: string;
  service: string;
};

export default function Home() {
  const [statusMessage, setStatusMessage] = useState(
    "Azure tenant connection will be added in the next milestone.",
  );

  const [isChecking, setIsChecking] = useState(false);

  async function checkPlatform(): Promise<void> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
      setStatusMessage("The Azure Watchtower API URL is not configured.");
      return;
    }

    try {
      setIsChecking(true);
      setStatusMessage("Checking Azure Watchtower platform...");

      const response = await fetch(`${apiBaseUrl}/api/health`);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}.`);
      }

      const health = (await response.json()) as HealthResponse;

      setStatusMessage(
        `${health.service} is ${health.status} - version ${health.version}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";

      setStatusMessage(`Unable to reach the API. ${message}`);
    } finally {
      setIsChecking(false);
    }
  }

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

          <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
            Reduce cloud risk through Blast Radius Intelligence.
          </p>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Discover attack paths, understand lateral movement, and prioritize
            the Azure security changes that reduce risk the most.
          </p>

          <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={checkPlatform}
              disabled={isChecking}
              className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChecking ? "Checking Platform..." : "Connect Azure"}
            </button>

            <p
              className="max-w-xl text-sm leading-6 text-slate-400"
              aria-live="polite"
            >
              {statusMessage}
            </p>
          </div>
        </div>

        <div className="mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm font-semibold text-sky-400">Discover</p>
            <h2 className="mt-3 text-xl font-semibold">
              Azure Resource Inventory
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Build a security-focused inventory of subscriptions, networks,
              identities, and critical resources.
            </p>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm font-semibold text-sky-400">Analyze</p>
            <h2 className="mt-3 text-xl font-semibold">
              Attack Path Intelligence
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Understand how a compromised resource could expose connected
              systems and sensitive services.
            </p>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm font-semibold text-sky-400">Reduce</p>
            <h2 className="mt-3 text-xl font-semibold">
              Prioritized Risk Reduction
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Focus remediation work on the changes that reduce the greatest
              amount of potential blast radius.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}