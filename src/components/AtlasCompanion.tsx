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
        <ellipse className="companionShadow" cx="80" cy="155" rx="43" ry="9" />

        {cheering && (
          <g className="companionSparkles">
            <path d="M21 35v13M14.5 41.5h13" />
            <path d="M136 24v16M128 32h16" />
            <path d="M142 62v10M137 67h10" />
          </g>
        )}

        <g className="companionArms">
          <path d={cheering ? "M48 89C31 80 27 64 30 51" : thinking ? "M48 92C35 88 34 75 43 68" : "M48 93C35 99 31 111 36 120"} />
          <path d={cheering ? "M112 89C129 80 133 64 130 51" : guiding ? "M112 92C128 88 133 75 130 63" : "M112 93C125 99 129 111 124 120"} />
          <circle cx={cheering ? 30 : thinking ? 43 : 36} cy={cheering ? 50 : thinking ? 68 : 121} r="5" />
          <circle cx={cheering ? 130 : guiding ? 130 : 124} cy={cheering ? 50 : guiding ? 63 : 121} r="5" />
        </g>

        {guiding && (
          <g className="companionFlag">
            <path d="M132 63V27" />
            <path d="M132 28h20l-6 9 6 9h-20z" />
          </g>
        )}

        <path className="companionBody" d="M80 24c31 0 51 23 51 56v30c0 28-20 45-51 45s-51-17-51-45V80c0-33 20-56 51-56z" />
        <path className="companionRim" d="M80 35c24 0 39 18 39 45v25c0 23-15 37-39 37s-39-14-39-37V80c0-27 15-45 39-45z" />
        <path className="companionFace" d="M80 43c20 0 32 14 32 37v21c0 20-12 31-32 31s-32-11-32-31V80c0-23 12-37 32-37z" />

        <g className="companionCompass">
          <circle cx="80" cy="70" r="15" />
          <path d="m80 57 5 13-5 13-5-13z" />
          <circle cx="80" cy="70" r="2.7" />
        </g>

        <g className="companionEyes">
          <path d={thinking ? "M59 95q5-4 10 0" : "M59 94q5 5 10 0"} />
          <path d="M91 94q5 5 10 0" />
        </g>
        <path className="companionSmile" d={cheering ? "M68 108q12 15 24 0" : thinking ? "M70 111q10-5 20 0" : "M69 108q11 10 22 0"} />

        <path className="companionScarf" d="M46 120c20 12 48 12 68 0l-7 19c-17 9-37 9-54 0z" />
        <path className="companionScarfTail" d="M105 132c14 4 20 12 22 23-9-5-18-5-27-2z" />

        {thinking && <path className="companionQuestion" d="M125 43c0-9 15-10 15 0 0 7-8 6-8 13M132 65h.1" />}
      </svg>
    </span>
  );
}
