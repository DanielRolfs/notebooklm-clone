import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NotebookLM Clone: an AI research notebook",
  description: "Add sources, chat with citations and keep notes in one notebook.",
};

const uses = [
  {
    title: "Journaling and Reflection",
    body: "Upload a few weeks of journal entries and ask what themes keep returning. The answers point back to the exact entries, so you can check that the pattern is real before you trust it.",
  },
  {
    title: "Career Planning",
    body: "Add your CV and a handful of job descriptions as sources. Ask where your experience matches and where it falls short, then save the best answers as notes for your next application.",
  },
  {
    title: "Study and Exam Prep",
    body: "Collect lecture slides, papers and your own summaries in one notebook. Ask for the key terms of a chapter, or let the chat quiz you on a topic and cite the page it used.",
  },
  {
    title: "Travel Research",
    body: "Drop in guides, blog posts and booking confirmations. Ask for a three day plan that only uses what you collected, and keep the result as a note you can open offline.",
  },
  {
    title: "Team Knowledge",
    body: "Put handbooks, meeting notes and process documents into a shared pool of sources. New people can ask questions and see which document each answer came from.",
  },
];

const tips = [
  "Ask narrow questions. A specific question gets a specific answer with a clear citation.",
  "Turn off sources you do not need. The chat only reads the ones that are switched on.",
  "Click a citation to jump to the passage and read the original before you rely on a claim.",
  "Save useful answers as notes. A note keeps the text and its citations for later.",
  "Ask for a summary first, then dig into the parts that matter to you.",
  "Compare two sources by asking where they agree and where they disagree.",
  "Rename long file names. Short titles make citations easier to read.",
];

const faq = [
  {
    q: "What is NotebookLM Clone?",
    a: "It is a small research notebook. You add sources, ask questions in a chat, and keep the answers worth remembering as notes.",
  },
  {
    q: "Is this a real product?",
    a: "No. It is a demo project built to show how such an app can be put together. It is not affiliated with any company that sells a similar tool.",
  },
  {
    q: "How do I sign in?",
    a: "Use the Login link at the top of the page. Sign-in works with a Google account and takes a few seconds.",
  },
  {
    q: "What can I add as a source?",
    a: "You can upload documents and paste text. Each source is split into small passages so the chat can find the right part quickly.",
  },
  {
    q: "How do citations work?",
    a: "Every answer lists the passages it was based on. Select a citation to see the original text next to the answer.",
  },
  {
    q: "What happens when the sources do not contain the answer?",
    a: "The chat says so instead of guessing. If you want a wider answer, add another source and ask again.",
  },
  {
    q: "Can I keep my own notes?",
    a: "Yes. Write a note by hand, or save a chat answer as a note. Notes can be edited and deleted at any time.",
  },
  {
    q: "Who can see my notebook?",
    a: "Only you. Each account has one private notebook, and the database rules keep other users out.",
  },
];

const news = [
  {
    date: "October, 2026",
    title: "Citations Open the Source",
    body: "Selecting a citation now shows the matching passage beside the chat, so you can verify an answer without leaving the page.",
  },
  {
    date: "September, 2026",
    title: "Notes From Chat Answers",
    body: "Any answer can be saved as a note with one click. The note keeps its citations, and you can edit the text afterwards.",
    extra: "Notes are listed in the right hand panel, newest first.",
  },
  {
    date: "August, 2026",
    title: "Sign In With Google",
    body: "Accounts now use Google sign-in. There is no password to remember, and your notebook is created the first time you log in.",
  },
];

const h2 = "text-[2.25rem] font-medium leading-[1.25] text-[#202124]";
const h3 = "text-[1.1875rem] font-medium leading-snug text-[#202124]";
const p = "text-[0.9375rem] leading-[1.7] text-[#202124]";

export default function WelcomePage() {
  return (
    <div className="bg-white font-sans text-[#202124]">
      <header className="flex h-14 items-center justify-between bg-[#f8f9fa] px-6 text-[0.9375rem]">
        <span>NotebookLM Clone</span>
        <nav className="flex gap-6">
          <Link href="/welcome" className="font-bold">
            Home
          </Link>
          <a href="#about">Tutorial</a>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-center bg-[#f8f9fa] px-6 pb-24 pt-32">
        <div className="mx-auto w-full max-w-[1320px]">
          <h1 className="max-w-[740px] text-[3.25rem] font-bold leading-[1.2] tracking-tight text-[#202124]">
            NotebookLM Clone: An AI Research Notebook You Can Trust
          </h1>
          <p className={`${p} mt-8 max-w-[740px]`}>
            Add your own sources, chat about them and get answers that point back to the exact
            passage. Keep the best findings as notes, all in one calm workspace.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-[#202124] px-7 py-3 text-[0.9375rem] font-medium text-white"
          >
            Get Started
          </Link>
        </div>
        <span aria-hidden className="absolute bottom-8 left-1/2 -translate-x-1/2 text-2xl text-[#bdc1c6]">
          &#8964;
        </span>
      </section>

      <div className="mx-auto grid max-w-[1320px] gap-x-[150px] px-6 py-16 lg:grid-cols-[minmax(0,750px)_minmax(0,420px)] lg:justify-between">
        <main className="space-y-6" id="about">
          <h2 className={h2}>About NotebookLM Clone</h2>
          <p className={p}>
            Reading a pile of documents is slow, and remembering where you saw something is
            harder. This project puts your sources, a chat and your notes side by side, so
            you can ask a question and see the evidence in one glance.
          </p>
          <h3 className={`${h3} pt-4`}>How is it different from a general chatbot?</h3>
          <p className={p}>
            A general chatbot answers from everything it has seen. Here, the chat answers from
            the sources you picked, and it shows which passage each statement came from. You
            decide what counts as evidence.
          </p>

          <h2 className={`${h2} pt-8`}>Getting Started</h2>
          <p className={p}>
            All you need is a Google account. Log in, and your notebook is ready with three
            areas: Sources on the left, Chat in the middle and Notes on the right.
          </p>
          <h3 className={`${h3} pt-4`}>Sign in</h3>
          <p className={p}>
            Choose <Link href="/login" className="text-[#1a73e8] underline">Login</Link> and
            continue with Google. You land in your notebook right away.
          </p>
          <h3 className={`${h3} pt-4`}>Setting up your notebook</h3>
          <p className={p}>Once you are in, add the material you want to work with, such as:</p>
          <ul className={`${p} ml-5 list-[square] space-y-1.5 pl-2`}>
            <li>PDF documents</li>
            <li>Markdown files</li>
            <li>Plain text files</li>
            <li>Copied and pasted text</li>
            <li>Notes you wrote yourself</li>
          </ul>
          <p className={p}>
            Every source is read, split into short passages and indexed. Switch sources on or
            off at any time to control what the chat can use.
          </p>

          <h2 className={`${h2} pt-8`}>Five Ways to Use NotebookLM Clone</h2>
          {uses.map((u, i) => (
            <section key={u.title} className="space-y-3 pt-3">
              <h3 className={h3}>
                {i + 1}. {u.title}
              </h3>
              <p className={p}>{u.body}</p>
            </section>
          ))}

          <h2 className={`${h2} pt-8`}>Why You Should Try It</h2>
          <p className={p}>
            Answers you cannot check are hard to use. With citations next to every claim, you
            spend less time doubting and more time learning. The notebook stays small and
            private, so it is easy to understand.
          </p>
          <p className={p}>Ready to try it? Log in and add your first source today.</p>

          <h2 className={`${h2} pt-8`}>Tips to Use It Well</h2>
          <ul className={`${p} ml-5 list-[square] space-y-1.5 pl-2`}>
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <h2 className={`${h2} pt-8`}>Notebook FAQ</h2>
          {faq.map((f, i) => (
            <section key={f.q} className="space-y-2 pt-2">
              <h3 className={h3}>
                {i + 1}. {f.q}
              </h3>
              <p className={p}>{f.a}</p>
            </section>
          ))}
        </main>

        <aside className="mt-16 space-y-6 lg:mt-0">
          <h2 className="text-[1.75rem] font-medium leading-tight text-[#202124]">News &amp; Updates</h2>
          {news.map((n) => (
            <article key={n.title} className="space-y-3">
              <p className="text-sm font-bold">{n.date}</p>
              <h3 className={`${h3} pt-1`}>{n.title}</h3>
              <p className={p}>{n.body}</p>
              {n.extra && <p className={p}>{n.extra}</p>}
            </article>
          ))}
        </aside>
      </div>

      <div className="mx-auto max-w-[1320px] px-6 pb-14">
        <AppPreview />
      </div>

      <footer className="bg-[#f8f9fa] px-6 py-12 text-center">
        <p className="text-[0.9375rem] text-[#3c4043]">
          NotebookLM Clone, a demo project <span className="mx-2">|</span>
          <Link href="/login">Login</Link>
          <span className="mx-2">|</span>
          <a href="#about">About</a>
        </p>
        <p className="mt-4 text-xs text-[#3c4043]">
          Built for learning. Not affiliated with any commercial notebook product.
        </p>
      </footer>
    </div>
  );
}

// A drawn mock-up of the three panels, so no product screenshots are needed.
function AppPreview() {
  const panel = "rounded-lg border border-[#e8eaed] bg-white p-3 text-xs text-[#5f6368]";
  const pill = "rounded-full border border-[#dadce0] px-3 py-1 text-center";
  return (
    <div aria-hidden className="grid h-[420px] grid-cols-[1fr_2fr_1fr] gap-3 rounded-lg bg-[#eef0fb] p-3">
      <div className={`${panel} flex flex-col`}>
        <span>Sources</span>
        <span className={`${pill} mt-3`}>+ Add</span>
        <span className="mt-auto text-center">Added sources will appear here</span>
      </div>
      <div className={`${panel} flex flex-col`}>
        <span>Chat</span>
        <span className="m-auto text-sm text-[#202124]">Add a source to get started</span>
        <span className={`${pill} text-left`}>Upload a source to get started</span>
      </div>
      <div className={`${panel} flex flex-col`}>
        <span>Notes</span>
        <span className={`${pill} mt-3`}>+ Add note</span>
        <span className="mt-auto text-center">Saved notes will appear here</span>
      </div>
    </div>
  );
}
