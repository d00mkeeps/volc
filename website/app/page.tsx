import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { KeyFeatures } from "@/components/sections/KeyFeatures";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AppShowcase } from "@/components/sections/AppShowcase";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { FAQ } from "@/components/sections/FAQ";
import { EmailCapture } from "@/components/sections/EmailCapture";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-grow">
        <Hero />
        <ProblemSolution />
        <KeyFeatures />
        <HowItWorks />
        <AppShowcase />
        <FAQ />
        <FinalCTA />
        <EmailCapture />
      </main>
      
      <Footer />
    </div>
  );
}
