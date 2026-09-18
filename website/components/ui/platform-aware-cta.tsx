"use client";

import { useState, useEffect } from "react";
import { AppStoreBadge } from "@/components/ui/app-store-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { usePostHog } from 'posthog-js/react';
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";

interface PlatformAwareCTAProps {
  className?: string;
  onAppStoreClick?: () => void;
}

export function PlatformAwareCTA({ className, onAppStoreClick }: PlatformAwareCTAProps) {
  const platform = usePlatform();
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    posthog.capture('android_waitlist_signup_attempt');

    try {
      const response = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: 'android_cta' }),
      });

      if (!response.ok) throw new Error();

      setStatus("success");
      setEmail("");
      posthog.capture('android_waitlist_signup_success');
    } catch {
      setStatus("error");
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  // Show App Store badge for iOS and Desktop (other)
  if (platform !== 'android') {
    return (
      <AppStoreBadge 
        className={cn("h-14", className)}
        onClick={onAppStoreClick}
      />
    );
  }

  // Android View
  return (
    <div className={cn("flex flex-col gap-4 max-w-md mx-auto lg:mx-0", className)}>
      <div className="text-left">
        <p className="font-medium text-foreground mb-2">
          Coming to Google Play store soon!
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          We&apos;ll tell you when it&apos;s ready.
        </p>
      </div>

      {status === "success" ? (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg border border-green-500/20">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">You&apos;re on the list!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background"
            disabled={status === "loading"}
          />
          <Button 
            type="submit" 
            disabled={status === "loading"}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Notify Me"
            )}
          </Button>
        </form>
      )}
      {status === "error" && (
        <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
