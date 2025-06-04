import { useRef, useEffect } from "react";
import Comparator from "@/components/pricing-comparator";
import { HeroHeader } from "@/components/hero5-header";
import { PricingTable } from "@clerk/clerk-react";
// Import landing page specific styles
import "../landing-page-theme.css";
import "../landing-page-app.css";
import { createFileRoute } from "@tanstack/react-router";
import Footer from "@/components/layout/Footer";

import Cta from "@/components/call-to-action";
export const Route = createFileRoute("/pricing")({
  component: Index,
});

function Index() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply theme class to body when component mounts, remove on unmount
  useEffect(() => {
    document.body.classList.add("landing-page-theme");
    return () => {
      document.body.classList.remove("landing-page-theme");
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="landing-page-theme min-h-screen bg-white text-slate-900 relative overflow-hidden"
    >
      <HeroHeader />

      <main className="relative z-0 mt-[7rem]">
        <div className="max-w-5xl mx-auto mb-6 mt-[8rem]">
          <h1 className="text-4xl font-bold text-center mb-4">Our Pricing</h1>
          <p className="text-lg text-center text-slate-600 mb-12">
            Choose the plan that's right for you.
          </p>
          <PricingTable />
        </div>
        <Comparator />
      </main>
      <Cta />
      <Footer />
    </div>
  );
}

// Exporting the component directly as default is common practice
// export default Index; // No longer needed as it's the route component
