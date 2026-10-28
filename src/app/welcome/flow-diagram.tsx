// Illustrated flow: five source cards -> curved lines -> hub card.
// Everything lives in one SVG (viewBox 1060x920) so it scales with the viewport.
import type { ReactNode } from "react";

const HUB = { x: 777, y: 456 }; // where all lines converge

// Curved connectors, each ends at the hub's left edge.
const lines = [
  "M300 150 L312 172", // web -> audio (short link)
  "M312 317 C360 380 430 430 500 440 S700 456 777 456",
  "M423 316 C500 400 600 440 777 456",
  "M372 363 C450 420 600 450 777 456",
  "M372 456 L777 456",
  "M345 565 C450 500 600 470 777 456",
  "M290 775 C360 640 420 600 520 560 S700 470 777 456",
];

// Small markers sitting on the lines [x, y, shape].
const markers: [number, number, "dot" | "diamond"][] = [
  [477, 364, "diamond"], [520, 392, "diamond"], [476, 456, "dot"], [508, 456, "diamond"],
  [575, 432, "dot"], [663, 456, "dot"], [430, 509, "diamond"], [472, 500, "diamond"],
  [440, 580, "dot"], [313, 737, "dot"],
];

// Caption chips: top-left corner, width, lines of [text, isBlue].
const chips: { x: number; y: number; w: number; lines: [string, boolean][] }[] = [
  { x: 447, y: 126, w: 113, lines: [["Add files,", false], ["links", true], ["and text", false]] },
  { x: 214, y: 566, w: 188, lines: [["Ask questions across", false], ["your sources", true], ["in one chat", false]] },
  { x: 468, y: 683, w: 188, lines: [["Get", false], ["cited answers", true], ["you can check", false]] },
  { x: 278, y: 845, w: 187, lines: [["Keep your findings", false], ["in notes", true], ["for later", false]] },
];

function Card({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="18" fill="#eef0f4" />
      {children}
    </g>
  );
}

export function FlowDiagram() {
  return (
    <svg viewBox="0 0 1060 920" className="block h-auto w-full overflow-hidden" role="img" aria-label="Sources flowing into one notebook">
      {/* connector lines (static base + travelling dashes) */}
      <g fill="none" stroke="#5b94f5" strokeWidth="1.6">
        {lines.map((d) => <path key={d} d={d} />)}
      </g>
      <g fill="none" stroke="#2f6df0" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 70" className="flow-dash">
        {lines.slice(1).map((d) => <path key={d} d={d} />)}
      </g>
      <g fill="#4a86f5">
        {markers.map(([x, y, s]) =>
          s === "dot" ? (
            <circle key={`${x}${y}`} cx={x} cy={y} r="5" />
          ) : (
            <rect key={`${x}${y}`} x={x - 5} y={y - 5} width="10" height="10" rx="1.5" transform={`rotate(45 ${x} ${y})`} />
          ),
        )}
      </g>

      {/* web page card */}
      <g className="float-a">
        <Card x={97} y={0} w={214} h={148}>
          <circle cx="28" cy="28" r="10" fill="none" stroke="#2f55d4" strokeWidth="2" />
          <ellipse cx="28" cy="28" rx="4.5" ry="10" fill="none" stroke="#2f55d4" strokeWidth="1.6" />
          <path d="M18 28h20" stroke="#2f55d4" strokeWidth="1.6" />
          <rect x="54" y="26" width="100" height="4" rx="2" fill="#d3d7de" />
          <rect x="13" y="53" width="188" height="95" rx="10" fill="#fff" />
          <rect x="27" y="80" width="162" height="34" rx="4" fill="#eceef2" />
          <rect x="27" y="117" width="78" height="28" rx="4" fill="#eceef2" />
          <rect x="109" y="117" width="80" height="28" rx="4" fill="#eceef2" />
        </Card>
      </g>

      {/* audio card with waveform */}
      <g className="float-b">
        <Card x={175} y={170} w={291} h={146}>
          <path d="M18 10h12l8 8v22H18z" fill="#4a86f5" />
          <rect x="54" y="26" width="185" height="4" rx="2" fill="#d3d7de" />
          <path d="M0 94c20-12 40 12 60 0s26-34 40-30 22 40 36 20 22-52 40-40 20 40 40 22 30-24 50-6 25 8 25 8" fill="none" stroke="#9b8cf0" strokeWidth="2" />
          <path d="M0 92c25-18 45 22 70 0s40 14 60-2 30 14 60 4 50-14 101 0" fill="none" stroke="#4a86f5" strokeWidth="2.4" />
        </Card>
      </g>

      {/* video card with red play button and progress bar */}
      <g className="float-c">
        <Card x={117} y={337} w={254} h={160}>
          <rect x="17" y="16" width="30" height="20" rx="6" fill="#ee2b3b" />
          <path d="M28 21l10 5-10 5z" fill="#fff" />
          <rect x="60" y="24" width="100" height="4" rx="2" fill="#d3d7de" />
          <rect x="13" y="51" width="229" height="96" rx="10" fill="#fff" />
          <path d="M120 84l16 9-16 9z" fill="#dfe2e7" />
          <rect x="23" y="127" width="209" height="3" rx="1.5" fill="#e3e5ea" />
          <rect x="23" y="127" width="132" height="3" rx="1.5" fill="#ee2b3b" />
          <circle cx="155" cy="128.5" r="5" fill="#ee2b3b" />
        </Card>
      </g>

      {/* slides card with yellow icon */}
      <g className="float-b">
        <Card x={3} y={517} w={282} h={233}>
          <rect x="15" y="22" width="26" height="22" rx="4" fill="#f6c431" />
          <rect x="20" y="29" width="16" height="9" rx="1.5" fill="#fff" />
          <rect x="54" y="30" width="148" height="4" rx="2" fill="#d3d7de" />
          <rect x="20" y="62" width="242" height="115" rx="10" fill="#fff" />
          <rect x="44" y="82" width="52" height="3" rx="1.5" fill="#e3e5ea" />
          <rect x="126" y="82" width="38" height="3" rx="1.5" fill="#e3e5ea" />
          <rect x="20" y="192" width="242" height="41" rx="10" fill="#f7f8fa" />
        </Card>
      </g>

      {/* PDF card */}
      <g className="float-a">
        <Card x={165} y={775} w={207} h={123}>
          <rect x="17" y="22" width="28" height="24" rx="4" fill="none" stroke="#ee4d4d" strokeWidth="2.4" />
          <text x="31" y="38.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ee4d4d">PDF</text>
          <rect x="56" y="32" width="86" height="3" rx="1.5" fill="#d3d7de" />
          <rect x="14" y="58" width="180" height="65" rx="10" fill="#fff" />
          <rect x="32" y="82" width="70" height="3" rx="1.5" fill="#e3e5ea" />
          <rect x="32" y="95" width="70" height="3" rx="1.5" fill="#e3e5ea" />
        </Card>
      </g>

      {/* caption chips */}
      <g fontSize="13.5" fill="#1d1d1f">
        {chips.map((c) => (
          <g key={c.y} transform={`translate(${c.x} ${c.y})`}>
            <rect width={c.w} height={c.lines.length * 19 + 15} rx="10" fill="#fff" stroke="#e8eaee" />
            {c.lines.map(([t, blue], i) => (
              <text key={t} x="13" y={27 + i * 19} fill={blue ? "#3b6fe8" : undefined}>{t}</text>
            ))}
          </g>
        ))}
      </g>

      {/* hub card, cut off by the right edge */}
      <g transform={`translate(${HUB.x} ${HUB.y - 46})`}>
        <rect width="320" height="88" rx="20" fill="#fff" stroke="#eef0f4" />
        <circle cx="50" cy="45" r="33" fill="#f1f3f8" />
        <g transform="translate(30 30) scale(1.25)" fill="none" strokeLinecap="round" strokeWidth="3">
          <path d="M2 18a14 14 0 0 1 28 0" stroke="#a9c2fb" />
          <path d="M7 18a9 9 0 0 1 18 0" stroke="#6b97f7" />
          <path d="M12 18a4 4 0 0 1 8 0" stroke="#2f6df0" />
          <circle cx="16" cy="19.5" r="1.5" fill="#2f6df0" stroke="none" />
        </g>
        <rect x="100" y="28" width="220" height="7" rx="3.5" fill="#dfe3ea" />
        <rect x="100" y="52" width="220" height="7" rx="3.5" fill="#dfe3ea" />
      </g>
    </svg>
  );
}
