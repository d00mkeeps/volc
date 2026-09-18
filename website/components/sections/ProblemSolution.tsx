"use client";

import { FadeIn } from "@/components/ui/fade-in";

export function ProblemSolution() {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center space-y-8 relative z-10">
        <FadeIn delay={0.1}>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Generic plans don&apos;t fit <br className="hidden md:block" /> real life.
          </h2>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Built to make fitness work for you, not the other way around.
          </p>
        </FadeIn>
        
        <FadeIn delay={0.3}>
          <div className="pt-8">
            <p className="text-2xl font-medium text-foreground">
              Volc adapts to your lifestyle, <span className="text-primary font-bold">whatever that looks like.</span>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

