import { Link } from "react-router-dom";
import MaterialIcon from "../icons/MaterialIcon";

export default function HeroSection() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-md py-xl text-center max-w-[900px] mx-auto">
      {/* Status badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-primary/30 bg-primary/10 text-primary text-label-mono animate-fade-in">
        <MaterialIcon icon="auto_awesome" filled size={14} />
        System Online
      </div>

      {/* Headline */}
      <h1 className="text-display text-on-surface mb-6 max-w-3xl animate-slide-up">
        Intelligence, <br />
        Grounded in <span className="text-primary">Your Data.</span>
      </h1>

      {/* Description */}
      <p className="text-body-lg text-on-surface-variant max-w-2xl mb-10 leading-relaxed animate-slide-up-delay">
        Harness the power of Retrieval-Augmented Generation. Connect your
        documents, codebase, and wikis to create an AI assistant that provides
        perfectly accurate, fully cited answers.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up-delay-2">
        <Link
          to="/chat"
          className="bg-primary text-on-primary text-body-md font-medium px-8 py-4 rounded-xl hover:bg-primary-fixed transition-all flex items-center gap-2 btn-primary-glow"
        >
          Chat with the Agent
          <MaterialIcon icon="arrow_forward" size={20} />
        </Link>

      </div>
    </section>
  );
}
