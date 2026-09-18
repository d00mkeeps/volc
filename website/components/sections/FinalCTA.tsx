"use client";

import { Button } from "@/components/ui/button";
import { PlatformAwareCTA } from "@/components/ui/platform-aware-cta";
import { FadeIn } from "@/components/ui/fade-in";

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-primary/2 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to reach your fitness goals?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Be among the first to try Volc – start your Free trial.
          </p>
          
          <div className="flex justify-center">
            <PlatformAwareCTA 
              onAppStoreClick={() => {
                // Optional: Add tracking here if desired
              }}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

