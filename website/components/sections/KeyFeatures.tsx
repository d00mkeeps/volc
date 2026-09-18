"use client";

import { Activity, MessageSquare, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: Calendar,
    title: "Personalized Plans",
    description: "AI creates custom workout plans based on your schedule, goals, and experience level. No more cookie-cutter routines."
  },
  {
    icon: MessageSquare,
    title: "Instant Coaching",
    description: "Get progress insights, form tips, and personalized workout plans right when you need them."
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Visualize your growth with our unique radar charts. Track progress across muscle groups and see exactly where you're improving."
  },
  {
    icon: Activity,
    title: "Flexible & Adaptive",
    description: "Life happens. Missed a workout? Changed your goals? Your plan adapts instantly to keep you on track."
  }
];

export function KeyFeatures() {



  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FadeIn key={index} delay={index * 0.1} className="h-full">
              <Card className="h-full bg-card/50 border-muted hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

