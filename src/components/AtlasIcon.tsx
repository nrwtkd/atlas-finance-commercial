import type { SVGProps } from "react";

export type AtlasIconName =
  | "home"
  | "plus"
  | "plan"
  | "reflect"
  | "space"
  | "lock"
  | "sparkles"
  | "shield"
  | "book"
  | "arrowRight"
  | "insight"
  | "heart"
  | "trophy"
  | "calendar"
  | "target"
  | "wallet"
  | "check"
  | "chevronDown";

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: AtlasIconName;
  size?: number;
};

export default function AtlasIcon({ name, size = 20, ...props }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  const paths: Record<AtlasIconName, React.ReactNode> = {
    home: <><path d="M3.5 10.8 12 3.8l8.5 7"/><path d="M5.8 9.5v10.2h12.4V9.5"/><path d="M9.5 19.7v-6.2h5v6.2"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    plan: <><circle cx="12" cy="12" r="8.2"/><path d="M12 7.8v4.7l3.1 1.9"/><path d="m17.8 6.2 1.4-1.4"/></>,
    reflect: <><path d="M12 3.5c1.4 3.7 3 5.3 6.7 6.7-3.7 1.4-5.3 3-6.7 6.7-1.4-3.7-3-5.3-6.7-6.7 3.7-1.4 5.3-3 6.7-6.7Z"/><path d="M18.3 16.3c.5 1.3 1.1 1.9 2.4 2.4-1.3.5-1.9 1.1-2.4 2.4-.5-1.3-1.1-1.9-2.4-2.4 1.3-.5 1.9-1.1 2.4-2.4Z"/></>,
    space: <><path d="M12 3.7 20.3 12 12 20.3 3.7 12 12 3.7Z"/><path d="M8.8 12h6.4"/><path d="M12 8.8v6.4"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/><path d="M12 14.2v2.2"/></>,
    sparkles: <><path d="M12 3.5c1.2 3.3 2.7 4.8 6 6-3.3 1.2-4.8 2.7-6 6-1.2-3.3-2.7-4.8-6-6 3.3-1.2 4.8-2.7 6-6Z"/><path d="M18.2 15.8c.5 1.2 1 1.7 2.2 2.2-1.2.5-1.7 1-2.2 2.2-.5-1.2-1-1.7-2.2-2.2 1.2-.5 1.7-1 2.2-2.2Z"/></>,
    shield: <><path d="M12 3.5 19 6v5.1c0 4.5-2.7 7.7-7 9.4-4.3-1.7-7-4.9-7-9.4V6l7-2.5Z"/><path d="m8.8 12 2.1 2.1 4.4-4.5"/></>,
    book: <><path d="M4.5 5.2A3.2 3.2 0 0 1 7.7 2h4.1v17H7.7a3.2 3.2 0 0 0-3.2 3V5.2Z"/><path d="M19.5 5.2A3.2 3.2 0 0 0 16.3 2h-4.5v17h4.5a3.2 3.2 0 0 1 3.2 3V5.2Z"/></>,
    arrowRight: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    insight: <><path d="M5 16.5V19"/><path d="M10 12v7"/><path d="M15 8.5V19"/><path d="M20 4.5V19"/><path d="M4 19.5h17"/></>,
    heart: <path d="M20.3 5.8a5 5 0 0 0-7.1 0L12 7l-1.2-1.2a5 5 0 0 0-7.1 7.1L12 21l8.3-8.1a5 5 0 0 0 0-7.1Z"/>,
    trophy: <><path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1.5A3.5 3.5 0 0 0 8.5 11"/><path d="M16 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5"/><path d="M12 12.5V17"/><path d="M8.5 20h7"/><path d="M10 17h4"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M7.5 3v4"/><path d="M16.5 3v4"/><path d="M3.5 9.5h17"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 16.5h.01"/><path d="M12 16.5h.01"/></>,
    target: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 20 4"/><path d="M16.5 4H20v3.5"/></>,
    wallet: <><path d="M4 6.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h11"/><path d="M20 10.5h-5a2 2 0 0 0 0 4h5"/><circle cx="15" cy="12.5" r=".5" fill="currentColor" stroke="none"/></>,
    check: <path d="m5 12 4.2 4.2L19 6.5"/>,
    chevronDown: <path d="m7 9.5 5 5 5-5"/>
  };

  return <svg {...common} {...props}>{paths[name]}</svg>;
}
