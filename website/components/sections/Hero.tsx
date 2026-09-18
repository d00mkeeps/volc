"use client";

import { Button } from "@/components/ui/button";
import { PlatformAwareCTA } from "@/components/ui/platform-aware-cta";
import { FadeIn } from "@/components/ui/fade-in";
import { usePostHog } from 'posthog-js/react'
import { ThemeImage } from "@/components/ui/theme-image";
import { usePlatform } from "@/hooks/usePlatform";

export function Hero() {
  const posthog = usePostHog()
  const platform = usePlatform();
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="container relative z-10 mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 text-center lg:text-left">
          <FadeIn delay={0.1}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Online Coaching <br />
            <span className="text-primary">without the price tag.</span>
          </h1>
          
          {platform !== 'android' && (
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Start your Free trial
            </p>
          )}
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <PlatformAwareCTA 
                onAppStoreClick={() => {
                  posthog.capture('cta_click', { location: 'hero' })
                }}
              />
            </div>
          </FadeIn>
        </div>
        
        <FadeIn delay={0.4} direction="left" className="relative mx-auto lg:ml-auto w-full max-w-[300px] md:max-w-[350px] aspect-[9/19.5]">
          {/* Mockup Placeholder */}
          <div className="absolute inset-0 bg-card rounded-[3rem] border-8 border-muted shadow-2xl flex items-center justify-center overflow-hidden transform hover:rotate-1 transition-transform duration-500">
             <ThemeImage 
               srcLight="/images/hero-light.png?v=2"
               srcDark="/images/hero-dark.png?v=2"
               alt="Volc App Home Screen" 
               fill 
               className="object-cover"
               priority
             />
          </div>
          
          {/* Decorative glow behind phone */}
          <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full animate-pulse" />
        </FadeIn>
      </div>
    </section>
  );
}

