// Centralized asset lookup (spec §7, §95-102). Components never reference
// image paths directly — they look up a key here. Swapping dummyXXX.png
// files on disk (see /public/assets/) requires no component changes.

export const assetMap = {
  branding: {
    gameLogo: "/assets/images/branding/dummy001.png",
    f1Logo: "/assets/images/branding/dummy002.png",
  },
  constructors: {
    redbull: "/assets/images/constructors/dummy021.png",
    ferrari: "/assets/images/constructors/dummy022.png",
    mercedes: "/assets/images/constructors/dummy023.png",
    mclaren: "/assets/images/constructors/dummy024.png",
    williams: "/assets/images/constructors/dummy025.png",
  },
  drivers: {
    verstappen: "/assets/images/drivers/dummy091.png",
    norris: "/assets/images/drivers/dummy092.png",
    piastri: "/assets/images/drivers/dummy093.png",
    leclerc: "/assets/images/drivers/dummy094.png",
    hamilton: "/assets/images/drivers/dummy095.png",
    rookie: "/assets/images/drivers/dummy096.png",
  },
  tracks: {
    monza: "/assets/images/tracks/dummy051.png",
    monaco: "/assets/images/tracks/dummy052.png",
    suzuka: "/assets/images/tracks/dummy053.png",
  },
  engines: {
    elite: "/assets/images/engines/dummy166.png",
    customer: "/assets/images/engines/dummy167.png",
  },
  sponsors: {
    conservative: "/assets/images/sponsors/dummy186.png",
    aggressive: "/assets/images/sponsors/dummy187.png",
  },
} as const;

/** Placeholder <img> that renders a labelled block until real art lands. */
export function AssetPlaceholder({
  label,
  className = "",
  aspect = "aspect-[4/3]",
}: {
  label: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`${aspect} w-full rounded-lg border border-dashed border-hairline bg-raised flex items-center justify-center ${className}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint px-2 text-center">
        {label}
      </span>
    </div>
  );
}
