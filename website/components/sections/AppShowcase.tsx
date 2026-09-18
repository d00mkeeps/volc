"use client";

import { FadeIn } from "@/components/ui/fade-in";
import { useState, useEffect, useRef } from "react";
import { ThemeImage } from "@/components/ui/theme-image";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function AppShowcase() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // buffer
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      checkScroll(); // Initial check
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Approx width of one card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };



  return (
    <section id="how-it-works" className="py-24 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-12 text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Experience the difference
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how Volc transforms your fitness journey with intuitive design and powerful insights.
          </p>
        </FadeIn>
      </div>

      {/* Horizontal scroll container for mobile, grid for desktop if needed, or just a nice layout */}
      {/* Horizontal scroll container for mobile, grid for desktop if needed, or just a nice layout */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex flex-nowrap md:justify-center gap-4 md:gap-8 overflow-x-auto pb-12 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide"
        >
          {[1, 2, 3].map((item, index) => (
            <FadeIn key={item} delay={index * 0.2} direction="up" className="snap-center shrink-0 md:first:pl-0 md:last:pr-0">
              <div className="relative w-[280px] h-[580px] bg-card rounded-[2.5rem] border-8 border-muted shadow-xl overflow-hidden flex items-center justify-center transform hover:-translate-y-2 transition-transform duration-500 hover:shadow-2xl">
                 <ThemeImage 
                   srcLight={`/images/screen-${item}-light.png?v=2`}
                   srcDark={`/images/screen-${item}-dark.png?v=2`}
                   alt={`App Screen ${item}`}
                   fill 
                   className="object-cover"
                 />
                
                {/* Reflection/Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Mobile Scroll Indicator */}
        {/* Mobile Navigation Arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll("left")}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 md:hidden bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-border transition-opacity hover:bg-background"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>
        )}

        {canScrollRight && (
          <button 
            onClick={() => scroll("right")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 md:hidden bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-border transition-opacity hover:bg-background animate-pulse"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-primary" />
          </button>
        )}
      </div>
    </section>
  );
}

