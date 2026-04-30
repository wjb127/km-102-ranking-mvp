import { cn } from "@/lib/utils";

// ── 결과 칩 (W/L/D/NC) ──

export type FightResultTag = "W" | "L" | "D" | "NC" | "-";

const RESULT_STYLE: Record<FightResultTag, string> = {
  W: "bg-success/15 text-success border-success/30",
  L: "bg-danger/15 text-danger border-danger/30",
  D: "bg-muted/15 text-muted border-muted/30",
  NC: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  "-": "bg-border/40 text-muted border-border",
};

const RESULT_LABEL: Record<FightResultTag, string> = {
  W: "Win (승)",
  L: "Loss (패)",
  D: "Draw (무)",
  NC: "No Contest (무효)",
  "-": "미정",
};

export function ResultChip({
  tag,
  size = "sm",
}: {
  tag: FightResultTag;
  size?: "sm" | "md";
}) {
  return (
    <span
      title={RESULT_LABEL[tag]}
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-bold tabular-nums",
        size === "sm" ? "h-5 min-w-[1.25rem] px-1 text-[10px]" : "h-6 min-w-[1.5rem] px-1.5 text-xs",
        RESULT_STYLE[tag]
      )}
    >
      {tag}
    </span>
  );
}

// ── 방식 칩 (KO/TKO/SUB/UD/SD/MD/DEC) ──

export type FightMethod =
  | "KO"
  | "TKO"
  | "SUB"
  | "UD"
  | "SD"
  | "MD"
  | "DEC"
  | "DQ"
  | string;

const METHOD_STYLE: Record<string, string> = {
  KO: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  TKO: "bg-orange-400/15 text-orange-400 border-orange-400/30",
  SUB: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  UD: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  SD: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  MD: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  DEC: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  DQ: "bg-red-500/15 text-red-500 border-red-500/30",
  DEFAULT: "bg-border/40 text-muted border-border",
};

const METHOD_LABEL: Record<string, string> = {
  KO: "KO (녹아웃)",
  TKO: "TKO (테크니컬 녹아웃)",
  SUB: "Submission (서브미션)",
  UD: "Unanimous Decision (만장일치 판정)",
  SD: "Split Decision (분할 판정)",
  MD: "Majority Decision (다수 판정)",
  DEC: "Decision (판정)",
  DQ: "Disqualification (실격)",
};

// 원문 method 문자열 → 표준 약어로 매핑
function normalizeMethod(raw: string): { code: string; rest?: string } {
  const m = raw.trim();
  const upper = m.toUpperCase();
  if (upper.startsWith("KO/TKO")) return { code: "TKO", rest: m.slice(6).trim() };
  if (upper.startsWith("TKO")) return { code: "TKO", rest: m.slice(3).trim() };
  if (upper.startsWith("KO")) return { code: "KO", rest: m.slice(2).trim() };
  if (upper.startsWith("SUB")) return { code: "SUB", rest: m.slice(3).trim() };
  if (upper.includes("UNANIMOUS")) return { code: "UD" };
  if (upper.includes("SPLIT")) return { code: "SD" };
  if (upper.includes("MAJORITY")) return { code: "MD" };
  if (upper.includes("DECISION")) return { code: "DEC" };
  if (upper.startsWith("DQ") || upper.includes("DISQUAL")) return { code: "DQ", rest: m.slice(2).trim() };
  return { code: m };
}

export function MethodChip({
  method,
  size = "sm",
}: {
  method: string;
  size?: "sm" | "md";
}) {
  const { code, rest } = normalizeMethod(method);
  const style = METHOD_STYLE[code.toUpperCase()] ?? METHOD_STYLE.DEFAULT;
  const label = METHOD_LABEL[code.toUpperCase()] ?? code;
  return (
    <span
      title={rest ? `${label} — ${rest}` : label}
      className={cn(
        "inline-flex items-center rounded-md border font-semibold uppercase tracking-tight",
        size === "sm" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-xs",
        style
      )}
    >
      {code}
    </span>
  );
}
