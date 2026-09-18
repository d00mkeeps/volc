"use client";

import React, { useState, useEffect } from "react";
import WorkoutsTab from "@/components/admin/tabs/WorkoutsTab";
import GrowthTab from "@/components/admin/tabs/GrowthTab";
import AiDiagnosticsTab from "@/components/admin/tabs/AiDiagnosticsTab";
import {
  Activity,
  Users,
  Bot,
  RefreshCw,
  Lock,
  LogOut,
  AlertCircle,
  Database,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"workouts" | "growth" | "ai">(
    "workouts"
  );
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (res.ok) {
        setIsAuthenticated(true);
        fetchMetrics();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        fetchMetrics();
      } else {
        const data = await res.json();
        setAuthError(data.error || "Incorrect admin passphrase");
      }
    } catch {
      setAuthError("Failed to connect to authentication server");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setMetrics(null);
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to refresh metrics", err);
    } finally {
      setRefreshing(false);
    }
  };

  // 1. Loading screen
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#130d0c] text-white">
        <div className="flex items-center gap-3 text-neutral-400">
          <RefreshCw className="h-5 w-5 animate-spin text-[#f84f3e]" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  // 2. Authentication Modal / Passphrase Screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#130d0c] px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#1c1413]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f84f3e]/10 text-[#f84f3e]">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <h1 className="mt-4 text-center text-xl font-bold text-white">
            Volc Admin Command Center
          </h1>
          <p className="mt-1 text-center text-xs text-neutral-400">
            Enter your admin passphrase to access backend analytics
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#f84f3e] focus:outline-none focus:ring-1 focus:ring-[#f84f3e]"
                autoFocus
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#f84f3e] py-3 text-sm font-semibold text-white shadow-lg shadow-[#f84f3e]/20 transition-colors hover:bg-[#e03e2e]"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard View
  const isDemo = metrics?.overview?.db_status !== "live";
  const lastUpdated = metrics?.overview?.last_updated
    ? new Date(metrics.overview.last_updated).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  return (
    <div className="min-h-screen bg-[#130d0c] text-neutral-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#16100f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌋</span>
            <div>
              <h1 className="text-base font-bold text-white">Volc Admin Center</h1>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-neutral-500" />
                  Hourly Aggregator
                </span>
                <span>•</span>
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database Health Badge */}
            <div
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex ${
                isDemo
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {isDemo ? (
                <>
                  <AlertCircle className="h-3 w-3" />
                  <span>Demo Mode</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Supabase Live</span>
                </>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#f84f3e]" : ""}`}
              />
              <span>{refreshing ? "Syncing..." : "Sync Now"}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("workouts")}
              className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition-colors ${
                activeTab === "workouts"
                  ? "border-[#f84f3e] text-[#f84f3e]"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Workouts & Product</span>
            </button>

            <button
              onClick={() => setActiveTab("growth")}
              className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition-colors ${
                activeTab === "growth"
                  ? "border-[#f84f3e] text-[#f84f3e]"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Growth & Leads</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition-colors ${
                activeTab === "ai"
                  ? "border-[#f84f3e] text-[#f84f3e]"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>AI Coach Diagnostics</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Offline / Demo Notice Alert */}
        {isDemo && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-200/90">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">
                Notice: Supabase Remote Project Paused or Inactive
              </p>
              <p className="mt-0.5 text-amber-200/70">
                The database connection returned offline or paused. Showing realistic baseline metrics so you can explore the Highcharts dashboard. Once your Supabase instance is unpaused, click &ldquo;Sync Now&rdquo; to pull live data.
              </p>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex items-center gap-3 text-neutral-400">
              <RefreshCw className="h-5 w-5 animate-spin text-[#f84f3e]" />
              <span>Loading analytics data...</span>
            </div>
          </div>
        ) : metrics ? (
          <>
            {activeTab === "workouts" && <WorkoutsTab data={metrics.workouts} />}
            {activeTab === "growth" && <GrowthTab data={metrics.growth} />}
            {activeTab === "ai" && <AiDiagnosticsTab data={metrics.ai} />}
          </>
        ) : (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-400">
            No analytics data available. Click &ldquo;Sync Now&rdquo; to query the backend.
          </div>
        )}
      </main>
    </div>
  );
}
