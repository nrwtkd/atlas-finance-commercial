import "./AtlasCompanion.css";

export type AtlasCompanionMood = "cheer" | "calm" | "think" | "guide";

type Props = {
  mood?: AtlasCompanionMood;
  size?: "small" | "medium" | "large";
  label?: string;
};

export default function AtlasCompanion({
  mood = "calm",
  size = "medium",
  label = "Tala, teman Atlas"
}: Props) {
  const cheering = mood === "cheer";
  const thinking = mood === "think";
  const guiding = mood === "guide";

  return (
    <span className={`atlasCompanion atlasCompanion--${size} atlasCompanion--${mood}`} role="img" aria-label={label}>
      <svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse className="companionShadow" cx="80" cy="154" rx="42" ry="8" />

        {cheering && (
          <g className="companionSparkles">
            <path d="M23 31v14M16 38h14" />
            <path d="M134 24v16M126 32h16" />
            <path d="M140 61v10M135 66h10" />
          </g>
        )}

        <g className="companionArms">
          <path d={cheering ? "M44 88C27 78 24 61 29 48" : thinking ? "M44 91C31 88 31 75 41 68" : "M44 91C30 98 28 111 34 122"} />
          <path d={cheering ? "M116 88C133 78 136 61 131 48" : guiding ? "M116 91C132 87 137 74 133 61" : "M116 91C130 98 132 111 126 122"} />
          <circle cx={cheering ? 29 : thinking ? 41 : 34} cy={cheering ? 47 : thinking ? 68 : 123} r="5" />
          <circle cx={cheering ? 131 : guiding ? 133 : 126} cy={cheering ? 47 : guiding ? 61 : 123} r="5" />
        </g>

        {guiding && (
          <g className="companionFlag">
            <path d="M135 61V24" />
            <path d="M135 25h18l-5 9 5 9h-18z" />
          </g>
        )}

        <path className="companionHandle" d="M61 42c0-15 38-15 38 0" />
        <rect className="companionBody" x="40" y="39" width="80" height="105" rx="29" />
        <path className="companionTopPanel" d="M53 51c14-10 40-10 54 0v28H53z" />
        <rect className="companionFace" x="51" y="58" width="58" height="52" rx="22" />

        <g className="companionEyes">
          <circle cx="68" cy="82" r="3.6" />
          <circle cx="92" cy="82" r="3.6" />
          {thinking && <path d="M62 73q6-4 12 0M86 73q6 1 12-2" />}
        </g>
        <path className="companionSmile" d={cheering ? "M66 92q14 16 28 0" : thinking ? "M69 96q11-5 22 0" : "M68 92q12 10 24 0"} />

        <rect className="companionPocket" x="57" y="114" width="46" height="24" rx="10" />
        <path className="companionStar" d="m80 118 3.6 7.2 8 1.2-5.8 5.6 1.4 7.9-7.2-3.8-7.2 3.8 1.4-7.9-5.8-5.6 8-1.2z" />
        <path className="companionScarf" d="M45 104c21 12 49 12 70 0l-7 16c-18 9-38 9-56 0z" />
        <path className="companionScarfTail" d="M105 113c13 5 19 13 20 24-8-5-17-6-25-3z" />

        <path className="companionFoot" d="M59 143v8M101 143v8" />
        {thinking && <path className="companionQuestion" d="M126 43c0-9 15-10 15 0 0 7-8 6-8 13M133 65h.1" />}
      </svg>
    </span>
  );
}
