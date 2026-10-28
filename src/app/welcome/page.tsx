import type { Metadata } from "next";
import { FlowChips, FlowDiagram } from "./flow-diagram";
import { LogoMark } from "./logo-mark";

export const metadata: Metadata = {
  title: "NotebookLM Clone: simply understand everything",
  description: "An assistant that answers questions from the sources you trust, with cited answers.",
};

const pill = "rounded-full bg-[#9dd2ff] text-[#0b1b33] transition-colors hover:bg-[#86c5fb]";

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf9f9] text-[#0b0b0b]">
      {/* soft glow in the bottom corners */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_42%_24%_at_0%_100%,rgba(215,228,253,0.95),transparent),radial-gradient(ellipse_36%_24%_at_100%_100%,rgba(214,227,253,0.95),transparent)]" />

      {/* top bar */}
      <header className="absolute inset-x-0 top-0 z-10 flex h-[76px] items-center justify-between px-5 sm:px-12">
        <div className="flex items-center gap-[7px] text-2xl font-medium tracking-[-0.02em] lg:text-[28px]">
          <LogoMark className="h-[22px] w-[30px]" />
          NotebookLM Clone
        </div>
        <a href="/auth/google" className={`${pill} flex h-9 items-center px-6 text-[15px]`}>Sign in</a>
      </header>

      <main className="relative flex min-h-screen flex-col lg:block">
        {/* Diagram: static, right-anchored and scaled with the window width on desktop; above the text on mobile. */}
        <div className="order-1 mt-[76px] lg:mt-0">
          <FlowDiagram />
          <FlowChips />
        </div>

        <section className="order-2 px-6 pb-24 pt-6 text-center lg:absolute lg:inset-y-0 lg:left-[10%] lg:flex lg:w-[480px] lg:flex-col lg:items-start lg:justify-center lg:px-0 lg:pb-0 lg:pt-[14px] lg:text-left">
          <h1 className="text-5xl font-medium leading-[1.05] tracking-[-0.035em] lg:text-[80px] lg:leading-[80px]">
            Simply<br />
            <span className="text-[#4285f4]">understand</span><br />
            everything
          </h1>
          <p className="mx-auto mt-5 max-w-[26em] text-base leading-6 text-[#70757a] lg:mx-0 lg:mt-6 lg:max-w-[420px] lg:text-[28px] lg:leading-9">
            Your assistant for research and reasoning, based on the sources you trust: your own files, links and notes, with cited answers you can check.
          </p>
          <a href="/auth/google" className={`${pill} mt-8 inline-flex h-[52px] items-center px-8 text-[17px] font-medium lg:mt-[37px]`}>
            Sign in to NotebookLM Clone
          </a>
        </section>
      </main>

      <footer className="absolute bottom-[26px] left-5 z-10 flex items-center gap-[30px] text-[13px] text-[#6b6e73] sm:left-12">
        <span className="text-base font-medium tracking-[-0.01em] text-[#3c4043]">NotebookLM Clone</span>
        <span>A demo project</span>
        <a href="/auth/google" className="underline underline-offset-2 hover:text-[#0b0b0b]">Sign in</a>
      </footer>
    </div>
  );
}
