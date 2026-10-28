import type { Metadata } from "next";
import Link from "next/link";
import { FlowDiagram } from "./flow-diagram";
import { LogoMark } from "./logo-mark";

export const metadata: Metadata = {
  title: "NotebookLM Clone: simply understand everything",
  description: "An assistant that answers questions from the sources you trust, with cited answers.",
};

const pill = "rounded-full bg-[#a8c7fa] text-[#0b1f4d] transition-colors hover:bg-[#93b9f8]";

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fafafa] text-[#111]">
      {/* soft glow in the bottom corners */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_28%_at_0%_100%,rgba(190,205,250,0.55),transparent),radial-gradient(ellipse_40%_28%_at_100%_100%,rgba(190,205,250,0.6),transparent)]" />

      {/* top bar */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-[1.8vw]">
        <div className="flex items-center gap-2 text-xl font-medium tracking-tight">
          <LogoMark className="h-5 w-7" />
          NotebookLM Clone
        </div>
        <Link href="/login" className={`${pill} px-4 py-1.5 text-xs`}>Sign in</Link>
      </header>

      <main className="relative flex flex-1 flex-col items-start justify-center gap-10 pb-16 pt-24 lg:flex-row lg:items-center lg:gap-0 lg:py-0">
        <section className="w-full px-6 lg:w-[47%] lg:px-0 lg:pl-[10%]">
          <h1 className="text-[clamp(2.75rem,3.3vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.04em]">
            Simply<br />
            <span className="text-[#4a7cf0]">understand</span><br />
            everything
          </h1>
          <p className="mt-6 max-w-[16em] text-[clamp(1rem,1.1vw,1.6rem)] leading-[1.27] text-[#6b6b70]">
            Your assistant for research and reasoning, based on the sources you trust: your own files, links and notes. Every answer comes with citations you can check.
          </p>
          <Link href="/login" className={`${pill} mt-9 inline-block px-6 py-3 text-sm font-medium`}>
            Sign in to NotebookLM Clone
          </Link>
        </section>

        <div className="w-full pl-4 lg:ml-auto lg:w-[53%] lg:pl-0">
          <FlowDiagram />
        </div>
      </main>

      <footer className="relative flex items-center gap-4 px-6 pb-5 text-xs text-[#6b6b70] lg:absolute lg:bottom-0 lg:left-0 lg:px-[1.8vw]">
        <span>NotebookLM Clone, a demo project</span>
        <Link href="/login" className="underline underline-offset-2 hover:text-[#111]">Sign in</Link>
      </footer>
    </div>
  );
}
