"use client";

import { FadeIn } from "@/components/ui/fade-in";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started with Volc is simple. No complex assessments, just straight to your goals.
            </p>
          </FadeIn>
        </div>

        <div className="grid gap-12 md:grid-cols-3 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

          {[
            {
              step: "01",
              title: "Set Your Goals",
              description: "Tell Volc about your fitness level, available equipment, and what you want to achieve."
            },
            {
              step: "02",
              title: "Get Your Plan",
              description: "Receive a completely personalized workout plan tailored to your schedule."
            },
            {
              step: "03",
              title: "Start Training",
              description: "Follow guided workouts with real-time AI coaching and track your progress."
            }
          ].map((item, index) => (
            <FadeIn key={index} delay={index * 0.2} className="relative flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center mb-6 shadow-lg z-10 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                <span className="text-2xl font-bold text-primary">{item.step}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

