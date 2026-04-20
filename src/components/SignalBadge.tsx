import { color, font } from "@/lib/theme"

interface SignalBadgeProps {
  signal: string
  size?: "sm" | "md"
}

function getSignalColors(signal: string): { bg: string; fg: string } {
  const s = signal.toUpperCase()
  switch (s) {
    case "BUY":
    case "HOT":
      return { bg: color.greenDim, fg: color.green }
    case "SELL":
    case "DECLINING":
      return { bg: color.redDim, fg: color.red }
    case "HOLD":
    case "NEUTRAL":
      return { bg: color.amberDim, fg: color.amber }
    case "GROWING":
      return { bg: color.blueDim, fg: color.blue }
    case "COOLING":
      return { bg: "#2e1a00", fg: "#ff9500" }
    default:
      return { bg: color.amberDim, fg: color.amber }
  }
}

export function SignalBadge({ signal, size = "md" }: SignalBadgeProps) {
  const { bg, fg } = getSignalColors(signal)

  const fontSize = size === "sm" ? 9 : 11
  const padding = size === "sm" ? "2px 7px" : "3px 10px"

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: font.mono,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.08em",
        padding,
        borderRadius: 6,
        background: bg,
        color: fg,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {signal.toUpperCase()}
    </span>
  )
}
