import HeroSection from "../components/home/HeroSection";

export default function HomePage() {
  return (
    <main className="flex-1 pt-16 relative">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none z-0" />
      <HeroSection />
    </main>
  );
}
