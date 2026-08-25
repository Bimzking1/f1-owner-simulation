import { useState } from "react";
import { Img } from "@/ui/kit";
import { audioManager, SFX } from "@/ui/audio";

interface Props {
  onReady: () => void;
}

export default function SplashScreen({ onReady }: Props) {
  const [fading, setFading] = useState(false);

  const begin = () => {
    if (fading) return;
    // Click unlocks browser audio
    audioManager.playSfx(SFX.boxBox, 0.5);
    setFading(true);
    // 3 seconds after box-box, start BG music and transition to landing
    setTimeout(() => audioManager.playMusic(SFX.openingTheme), 1700);
    setTimeout(onReady, 3000);
  };

  return (
    <button
      type="button"
      onClick={begin}
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-void transition-opacity duration-1000 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <Img
          src="/f1-box.png"
          alt="F1 Owner"
          className="h-48 w-48 rounded-2xl object-contain drop-shadow-[0_0_40px_rgba(255,40,40,0.25)] sm:h-64 sm:w-64"
        />

        <div className="text-center">
          <h1 className="font-display text-4xl font-bold uppercase tracking-[0.3em] text-white sm:text-5xl">
            F1 Owner
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.25em] text-gray-400">
            Team Management Simulation
          </p>
        </div>

        <div className="mt-8 animate-pulse text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
          Click anywhere to start
        </div>
      </div>
    </button>
  );
}