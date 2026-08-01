import "./AtlasCompanion.css";

export type AtlasCompanionMood = "cheer" | "calm" | "think" | "guide" | "warn";

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
  const warning = mood === "warn";

  return (
    <span className={`atlasCompanion atlasCompanion--${size} atlasCompanion--${mood}`} role="img" aria-label={label}>
      <svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse className="companionShadow" cx="80" cy="153" rx="39" ry="8" />

        {cheering && <g className="companionSparkles"><path d="M25 34v14M18 41h14"/><path d="M133 28v15M126 35h14"/></g>}

        <g className="sproutLeaves">
          <path d="M79 54C61 39 57 21 61 10c17 3 28 17 25 35" />
          <path d="M82 55c8-21 24-31 39-29 0 17-12 32-34 34" />
          <path className="sproutStem" d="M81 57c0-17 0-29 2-40" />
        </g>

        <g className="companionArms">
          <path d={cheering ? "M51 94C34 83 29 67 33 54" : thinking ? "M52 98C39 95 36 82 45 75" : warning ? "M52 99C40 104 39 118 49 127" : "M52 98C38 105 35 118 40 129"} />
          <path d={cheering ? "M109 94c17-11 22-27 18-40" : guiding ? "M109 98c16-5 21-18 17-31" : warning ? "M108 99c12 5 13 19 3 28" : "M109 98c14 7 17 20 12 31"} />
          <circle cx={cheering ? 33 : thinking ? 45 : warning ? 49 : 40} cy={cheering ? 54 : thinking ? 75 : warning ? 127 : 130} r="5" />
          <circle cx={cheering ? 127 : guiding ? 126 : warning ? 111 : 121} cy={cheering ? 54 : guiding ? 67 : warning ? 127 : 130} r="5" />
        </g>

        {guiding && <g className="companionFlag"><path d="M126 67V30"/><path d="M126 31h19l-5 9 5 9h-19z"/></g>}
        {warning && <g className="companionAlert"><circle cx="132" cy="43" r="13"/><path d="M132 36v9M132 50h.1"/></g>}

        <path className="sproutBody" d="M48 75c7-19 23-28 32-28s25 9 32 28c8 22 2 58-12 70-9 8-31 8-40 0-14-12-20-48-12-70z" />
        <ellipse className="sproutBelly" cx="80" cy="113" rx="27" ry="25" />

        <g className="companionEyes">
          <circle cx="68" cy="94" r="3.7" />
          <circle cx="92" cy="94" r="3.7" />
          {thinking && <path d="M62 85q6-4 12 0M86 85q6 1 12-2" />}
          {warning && <path d="M62 85q6-3 12 1M86 86q6-4 12 0" />}
        </g>
        <path className="companionSmile" d={cheering ? "M65 105q15 17 30 0" : thinking ? "M69 108q11-5 22 0" : warning ? "M70 109q10-4 20 0" : "M68 104q12 10 24 0"} />
        <circle className="sproutBlush" cx="58" cy="105" r="5" />
        <circle className="sproutBlush" cx="102" cy="105" r="5" />

        <path className="companionFoot" d="M63 145v7M97 145v7" />
        {thinking && <path className="companionQuestion" d="M126 47c0-9 15-10 15 0 0 7-8 6-8 13M133 69h.1" />}
      </svg>
    </span>
  );
}
