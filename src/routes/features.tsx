import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
// import { HeroParallax } from '@/components/ui/hero-parallax'; // Main hero component

// Import landing page specific styles
import "../landing-page-theme.css";
import "../landing-page-app.css";
import { HeroHeader } from "@/components/hero5-header";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/call-to-action";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"; // Corrected casing
import { CheckCircle, Zap, BarChart } from "lucide-react"; // Example icons

import FeaturesSection2 from "@/components/features-five";
import FeaturesSection3 from "@/components/features-seven";

// Define feature data (can be moved to a separate file later)
const featuresData = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Lightning Fast",
    description:
      "Experience blazing-fast performance and seamless interactions with our optimized platform.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: "Easy to Use",
    description:
      "Our intuitive interface makes it simple for anyone to get started and achieve their goals.",
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Detailed Analytics",
    description:
      "Gain valuable insights with our comprehensive analytics and reporting tools.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Secure Platform",
    description:
      "Your data is protected with industry-leading security measures and protocols.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: "24/7 Support",
    description:
      "Get help whenever you need it with our dedicated round-the-clock customer support.",
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Scalable Solution",
    description:
      "Our platform grows with your needs, ensuring reliability and performance at any scale.",
  },
];

// FeatureCard component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-card/70 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-border/50">
      <CardHeader className="items-center text-center pt-6 pb-4">
        <div className="p-3 rounded-full bg-primary/10 mb-3 inline-block">
          {/* Clone the icon to apply new classes */}
          {icon &&
            React.cloneElement(icon as React.ReactElement, {
              className: "h-10 w-10 text-primary",
            })}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

// FeaturesSection component
function FeaturesSection() {
  return (
    <section className="bg-muted/50 py-20 md:py-24 mt-[5rem] bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const Route = createFileRoute("/features")({
  component: Index,
});

function Index() {
  return (
    <div className="landing-page-theme min-h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground relative overflow-x-hidden">
      <HeroHeader />
      <div className="text-center mt-[10rem] mb-[5rem]">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Discover Our Core Features
        </h2>
        <p className="text-xl mt-4 max-w-2xl mx-auto">
          Our platform is packed with powerful features designed to streamline
          your workflow and boost your productivity.
        </p>
      </div>
      <FeaturesSection2 />
      <FeaturesSection />
      <FeaturesSection3 />

      <Testimonials />

      <Cta />
      <Footer />
    </div>
  );
}
