// Illustrated flow: five source cards -> curved lines -> hub card. Static, no animation.
// Coordinates are in the reference layout (a 2000px wide window); the viewBox crops the right part.
// The SVG is right-anchored and scales with the window width (see .flow-svg in globals.css).
import type { ReactNode } from "react";

const BLUE = "#4fa0ff";

// Connectors. All end at the hub's left edge (1729, 577).
const lines = [
  "M1273 287 L1285 305", // web -> audio
  "M1285 446 L1308 464", // audio -> video
  "M1344 489 C1450 520 1580 568 1729 577",
  "M1393 446 C1440 485 1520 545 1729 577",
  "M1344 577 L1729 577",
  "M1320 682 C1400 625 1560 585 1729 577",
  "M1423 682 C1480 640 1600 590 1729 577",
  "M1268 880 C1290 840 1320 790 1337 770",
];

// Markers on the lines: [x, y, shape].
const markers: [number, number, "dot" | "diamond" | "square" | "capsule"][] = [
  [1444, 489, "diamond"], [1485, 517, "capsule"], [1538, 562, "square"], [1621, 568, "dot"],
  [1444, 577, "dot"], [1473, 577, "diamond"], [1399, 635, "capsule"], [1438, 619, "square"],
  [1551, 605, "capsule"], [1289, 843, "dot"],
];

function Marker({ x, y, shape }: { x: number; y: number; shape: "dot" | "diamond" | "square" | "capsule" }) {
  if (shape === "dot") return <circle cx={x} cy={y} r="3.6" />;
  if (shape === "diamond") return <rect x={x - 4.5} y={y - 4.5} width="9" height="9" rx="1" transform={`rotate(45 ${x} ${y})`} />;
  if (shape === "square") return <rect x={x - 4} y={y - 4} width="8" height="8" rx="1" />;
  return <rect x={x - 8} y={y - 4} width="16" height="8" rx="4" transform={`rotate(25 ${x} ${y})`} />;
}

function Card({ x, y, w, h, fill = "#f3f7fb", children }: { x: number; y: number; w: number; h: number; fill?: string; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="14" fill={fill} />
      {children}
    </g>
  );
}

const bar = (x: number, y: number, w: number) => <rect x={x} y={y} width={w} height="3.5" rx="1.75" fill="#d9dde3" />;

export function FlowDiagram() {
  return (
    <svg viewBox="980 130 1020 930" className="flow-svg block h-auto w-full overflow-hidden" role="img" aria-label="Sources flowing into one notebook">
      <g fill="none" stroke={BLUE} strokeWidth="1.6">
        {lines.map((d) => <path key={d} d={d} />)}
      </g>
      <g fill={BLUE}>
        {markers.map(([x, y, shape]) => <Marker key={`${x}-${y}`} x={x} y={y} shape={shape} />)}
      </g>

      {/* web page card */}
      <Card x={1083} y={144} w={205} h={141}>
        <circle cx="27" cy="26" r="10" fill="none" stroke="#2f55d4" strokeWidth="2" />
        <ellipse cx="27" cy="26" rx="4.5" ry="10" fill="none" stroke="#2f55d4" strokeWidth="1.5" />
        <path d="M17 26h20" stroke="#2f55d4" strokeWidth="1.5" />
        {bar(52, 24, 95)}
        <rect x="13" y="51" width="180" height="90" rx="9" fill="#f9fbfd" />
        <rect x="26" y="62" width="30" height="2.5" rx="1" fill="#e3e7ec" />
        <rect x="128" y="62" width="14" height="2.5" rx="1" fill="#e3e7ec" />
        <rect x="148" y="62" width="14" height="2.5" rx="1" fill="#e3e7ec" />
        <rect x="26" y="78" width="154" height="30" rx="3" fill="#e9ecf0" />
        <rect x="26" y="112" width="75" height="29" rx="3" fill="#e9ecf0" />
        <rect x="106" y="112" width="74" height="29" rx="3" fill="#e9ecf0" />
      </Card>

      {/* audio card with waveform */}
      <Card x={1157} y={305} w={276} h={140}>
        <path d="M19 12h10l7 7v17H19z" fill="#4d8af5" />
        <circle cx="26" cy="29" r="2.5" fill="#fff" />
        <path d="M28 29V21l5 1.5" stroke="#fff" strokeWidth="1.5" fill="none" />
        {bar(52, 24, 185)}
        <path d="M0 82c23-13 38 12 58 0s25-36 44-26 20 42 40 22 22-44 42-30 22 38 42 18 28-22 50-8" fill="none" stroke="#a99af5" strokeWidth="1.8" />
        <path d="M0 78c18 14 43 24 63 11s30-20 48-8 26-16 52-2 38 14 63 2" fill="none" stroke={BLUE} strokeWidth="2" />
        <path d="M0 80c20-6 42 10 60-2s20 6 40-2 40 4 60-6 44 6 70 0 46 8 46 8" fill="none" stroke="#6a9bf7" strokeWidth="1.4" />
      </Card>

      {/* video card */}
      <Card x={1103} y={463} w={241} h={153} fill="#e5ecf2">
        <rect x="17" y="14" width="26" height="18" rx="5" fill="#ee2b3b" />
        <path d="M26 18.5l9 4.5-9 4.5z" fill="#fff" />
        {bar(56, 21, 94)}
        <rect x="13" y="49" width="217" height="91" rx="9" fill="#fff" />
        <path d="M110 80l14 8-14 8z" fill="#dfe2e7" />
        <rect x="21" y="122" width="198" height="2.5" rx="1.25" fill="#e8eaee" />
        <rect x="21" y="122" width="126" height="2.5" rx="1.25" fill="#f0173d" />
        <circle cx="147" cy="123" r="4.5" fill="#f0173d" />
      </Card>

      {/* slides card */}
      <Card x={995} y={636} w={267} h={222}>
        <rect x="13" y="21" width="24" height="20" rx="3" fill="#f8c426" />
        <rect x="17" y="27" width="16" height="9" rx="1.5" fill="#fff" />
        {bar(51, 29, 139)}
        <rect x="18" y="59" width="230" height="108" rx="9" fill="#fff" />
        <rect x="40" y="77" width="52" height="2.5" rx="1.25" fill="#e3e6ea" />
        <rect x="120" y="77" width="36" height="2.5" rx="1.25" fill="#e3e6ea" />
        <rect x="18" y="182" width="230" height="40" rx="9" fill="#fafbfc" />
      </Card>

      {/* PDF card */}
      <Card x={1148} y={880} w={197} h={117} fill="#e5ecf2">
        <rect x="17" y="20" width="26" height="22" rx="4" fill="none" stroke="#ee4d4d" strokeWidth="2.2" />
        <text x="30" y="35.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ee4d4d">PDF</text>
        {bar(53, 29, 83)}
        <rect x="13" y="58" width="170" height="52" rx="9" fill="#fff" />
        <rect x="32" y="76" width="70" height="2.5" rx="1.25" fill="#e3e6ea" />
        <rect x="32" y="87" width="70" height="2.5" rx="1.25" fill="#e3e6ea" />
      </Card>

      {/* hub card, cut off by the right edge */}
      <g transform="translate(1729 533)">
        <rect width="320" height="85" rx="18" fill="#fff" />
        <circle cx="48" cy="43" r="32" fill="#f3f7fb" />
        <g transform="translate(29 28) scale(1.2)" fill="none" strokeLinecap="round" strokeWidth="3">
          <path d="M2 18a14 14 0 0 1 28 0" stroke="#a9c2fb" />
          <path d="M7 18a9 9 0 0 1 18 0" stroke="#6b97f7" />
          <path d="M12 18a4 4 0 0 1 8 0" stroke="#2f6df0" />
          <circle cx="16" cy="19.5" r="1.5" fill="#2f6df0" stroke="none" />
        </g>
        <rect x="95" y="27" width="230" height="7" rx="3.5" fill="#e1e6ee" />
        <rect x="95" y="47" width="230" height="7" rx="3.5" fill="#e1e6ee" />
      </g>
    </svg>
  );
}

// Caption chips: fixed pixel size (like the reference), positioned from the same reference coordinates.
// [x, y, width, lines of [text, isBlue]]
const chips: [number, number, number, [string, boolean][]][] = [
  [1416, 264, 145, [["Add files,", false], ["links", true], ["and text", false]]],
  [1195, 683, 242, [["Ask questions across", false], ["your sources", true], ["in one chat", false]]],
  [1436, 793, 242, [["Get", false], ["cited answers", true], ["you can check", false]]],
  [1255, 946, 241, [["Keep your findings", false], ["in notes", true], ["for later", false]]],
];

export function FlowChips() {
  return (
    <>
      {chips.map(([x, y, w, rows]) => (
        <div
          key={y}
          className="flow-chip hidden rounded-xl border border-[#e6e8ec] bg-[#faf9f9] px-4 py-[10px] text-[15.5px] leading-6 text-[#1d1d1f] lg:block"
          style={{ "--x": x, "--y": y, width: w } as React.CSSProperties}
        >
          {rows.map(([t, blue]) => (
            <div key={t} className={blue ? "text-[#4285f4]" : undefined}>{t}</div>
          ))}
        </div>
      ))}
    </>
  );
}
