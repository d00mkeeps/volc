"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/ui/fade-in";
import { usePostHog } from 'posthog-js/react'

const faqs = [
  {
    question: "Do I need a gym membership or equipment?",
    answer: "Nope. Volc works with whatever you have - full gym, home setup, or just bodyweight. Tell us what you're working with during setup and the AI handles the rest."
  },
  {
    question: "What if I miss a workout or have an inconsistent schedule?",
    answer: "Zero stress. Volc adjusts your plan to keep you on track, even if you miss a day or two. No guilt, no falling behind."
  },
  {
    question: "Is this really free?",
    answer: "Yep. The first 50 users get completely free access - no credit card, no catches. We value your honest feedback more than anything at this stage."
  }
];

export function FAQ() {
  const posthog = usePostHog()
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger 
                  className="text-left text-lg font-medium"
                  onClick={() => posthog.capture('faq_opened', { question: faq.question })}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
