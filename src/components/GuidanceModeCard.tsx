import { getGuidanceMode } from "../domain/guidanceStyle";
import type { BudgetStyle } from "../types";
import AtlasCompanion from "./AtlasCompanion";
import AtlasIcon from "./AtlasIcon";

export default function GuidanceModeCard({
  style,
  compact = false
}: {
  style: BudgetStyle;
  compact?: boolean;
}) {
  const mode = getGuidanceMode(style);
  const mood = style === "flexible" ? "guide" : style === "structured" ? "think" : "calm";

  return (
    <aside className={`guidanceModeCard guidanceModeCard--${style} ${compact ? "compact" : ""}`}>
      {!compact && <AtlasCompanion mood={mood} size="small" />}
      <span className="guidanceModeIcon" aria-hidden="true">
        <AtlasIcon name={style === "structured" ? "plan" : style === "flexible" ? "target" : "sparkles"} size={18} />
      </span>
      <div>
        <span className="eyebrow">{mode.eyebrow}</span>
        <strong>{mode.title}</strong>
        <p>{mode.description}</p>
      </div>
      <span className="guidanceModeLabel">{mode.label}</span>
    </aside>
  );
}
