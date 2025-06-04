import { createFileRoute } from '@tanstack/react-router'
import TeamSection from '@/components/team'
import Footer from "@/components/layout/Footer";
import { HeroHeader } from "@/components/hero5-header";

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

// Helper component for consistent section styling (optional, but good for larger pages)
// interface SectionProps {
//   title: string;
//   children: React.ReactNode;
//   className?: string;
// }
// const ContentSection: React.FC<SectionProps> = ({ title, children, className }) => (
//   <section className={`py-12 md:py-16 ${className || ''}`}>
//     <div className="container mx-auto px-6 text-center">
//       <h2 className="text-3xl md:text-4xl font-bold mb-8 text-slate-800">{title}</h2>
//       <div className="text-lg text-slate-700 max-w-3xl mx-auto">
//         {children}
//       </div>
//     </div>
//   </section>
// );

function AboutPage() {
  return (
    // Adjusted background to be lighter, closer to the image provided.
    // The brand color #99BC85 can be used for accents, e.g., buttons or specific highlights if desired.
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HeroHeader />

      <main className="pt-[8rem] pb-12 md:pt-[10rem] md:pb-16">
        {/* Main Heading and Subheading - styled to mimic the provided image */}
        <section className="container mx-auto px-6 text-center mb-16 md:mb-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-slate-800">
            More Than Just Bytes and Code.
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto">
            We're Bean Journal, your future artificial friend.
          </p>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            In a world that's constantly rushing, we believe everyone deserves a
            companion who listens, remembers, and helps you reflect. That's why
            we're building Bean Journal – not just as a tool, but as a digital
            confidant dedicated to understanding and supporting you. We're pouring
            our hearts and minds into creating an AI that feels less artificial
            and more like a genuine connection.
          </p>
        </section>

        {/* Our Philosophy Section - Condensed */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-800">
              Our Philosophy: Your Artificial Friend
            </h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              The "Bean" in Bean Journal symbolizes growth, potential, and the
              simple, everyday moments that make up our lives. We aim to be the
              friendly ear that helps you nurture these moments, understand your
              patterns, and grow into your best self. We aspire to be a companion
              on your journey.
            </p>
            {/* Example of using the brand color as an accent - you can apply this to buttons or other elements */}
            {/* <button className="mt-8 px-6 py-3 rounded-md text-white bg-[#99BC85] hover:bg-opacity-90 transition-colors">
              Learn More About Our Vision
            </button> */}
          </div>
        </section>

        <TeamSection />
      </main>

      <Footer />
    </div>
  )
}
