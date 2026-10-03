"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Flame,
  HelpCircle,
  Terminal,
  Download,
  AlertCircle,
  RefreshCw,
  Globe,
} from "lucide-react";

function PreviewContent() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") || "";
  const project = searchParams.get("p") || "volc";

  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [launched, setLaunched] = useState(false);

  // Attempt auto-launch on initial mount if URL is present
  useEffect(() => {
    if (rawUrl) {
      setLaunched(true);
      // Short delay to ensure DOM rendered
      const timer = setTimeout(() => {
        window.location.href = rawUrl;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [rawUrl]);

  const handleCopy = () => {
    if (!rawUrl) return;
    navigator.clipboard.writeText(rawUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualLaunch = () => {
    if (rawUrl) {
      window.location.href = rawUrl;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-lg leading-tight uppercase text-white">
                {project} Mobile Preview
              </h2>
              <p className="text-xs text-slate-400">Ephemeral Development Tunnel</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        {rawUrl ? (
          <>
            {/* Primary Action Card */}
            <div className="text-center my-4 space-y-3">
              <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 text-blue-400 mb-1 border border-blue-500/20 shadow-inner">
                <Smartphone className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Launching Dev Client...
              </h1>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Safari is handing off your ephemeral Metro tunnel to the physical Volc iOS Dev Build.
              </p>
            </div>

            <div className="space-y-3 mt-6">
              <button
                onClick={handleManualLaunch}
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-base shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Smartphone className="w-5 h-5" />
                Tap to Open in Volc
              </button>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied Metro URL!" : "Copy Metro Tunnel URL"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 text-amber-400 mb-1 border border-amber-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white">No Active Tunnel URL</h1>
            <p className="text-sm text-slate-400">
              This preview link did not include a valid Metro session URL or the session has expired.
            </p>
          </div>
        )}

        {/* Fallback / Guidance Section: "Don't have the Dev Build installed?" */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-400" />
              Don&apos;t have the Dev Build on this iPhone?
            </span>
            <span className="text-slate-500 text-sm">{showGuide ? "−" : "+"}</span>
          </button>

          {showGuide && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="leading-relaxed">
                Volc uses custom native modules (SQLite, native gestures, sensors) that cannot run inside the standard App Store Expo Go app. You need the custom <strong>Volc Development Client</strong>.
              </p>

              <div className="space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  Option 1: Build once via EAS Cloud (Recommended)
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-amber-300 overflow-x-auto select-all border border-slate-800">
                  eas build --profile development --platform ios
                </div>
                <p className="text-[11px] text-slate-400">
                  EAS will build an ad-hoc signed iOS build. Open the link EAS provides in Mobile Safari, tap &quot;Install&quot;, and you&apos;re done!
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Option 2: Test in Mobile Safari Web Preview
                </div>
                <p className="text-[11px] text-slate-400">
                  You can inspect live web previews directly without installing any iOS build.
                </p>
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium text-xs pt-1"
                >
                  Open Volc Web Application <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  Option 3: App Store Production Version
                </div>
                <a
                  href="https://apps.apple.com/gb/app/volc/id6751469055"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium text-xs"
                >
                  View on App Store <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {!showGuide && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <a
                href="/"
                className="hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> Web Preview
              </a>
              <a
                href="https://apps.apple.com/gb/app/volc/id6751469055"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                App Store <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
          Backend connected to <code>volc-backend-dev (:8102)</code> • Auto-expires in 30m
        </div>
      </div>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
