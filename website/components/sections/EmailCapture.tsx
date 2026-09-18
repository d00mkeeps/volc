"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/fade-in";
import { Loader2, CheckCircle2 } from "lucide-react";
import { usePostHog } from 'posthog-js/react'

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const posthog = usePostHog()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");
    posthog.capture('email_signup_attempt')

    try {
      const response = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      setStatus("success");
      setEmail("");
      posthog.capture('email_signup')
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6 max-w-xl text-center">
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay in the loop</h2>
          <p className="text-muted-foreground mb-8">
            Get the latest updates on Volc features and availability.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-border shadow-sm animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-xl font-medium text-foreground">Thanks! We&apos;ll keep you updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background"
                disabled={status === "loading"}
              />
              <Button 
                type="submit" 
                size="lg" 
                className="h-12 px-8 font-semibold"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </form>
          )}
          {status === "error" && (
            <p className="text-red-500 mt-4 text-sm">{errorMessage}</p>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
