import { useState } from "react";
import { audioManager } from "@/ui/audio";
import { Button, Modal } from "@/ui/kit";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AudioSettings({ open, onClose }: Props) {
  const [musicVol, setMusicVol] = useState(() => audioManager.getVolume("music"));
  const [sfxVol, setSfxVol] = useState(() => audioManager.getVolume("sfx"));
  const [uiVol, setUiVol] = useState(() => audioManager.getVolume("ui"));
  const [musicMuted, setMusicMuted] = useState(() => audioManager.isMuted("music"));
  const [sfxMuted, setSfxMuted] = useState(() => audioManager.isMuted("sfx"));
  const [uiMuted, setUiMuted] = useState(() => audioManager.isMuted("ui"));

  const handleVolumeChange = (category: "music" | "sfx" | "ui", value: number) => {
    audioManager.setVolume(category, value);
    switch (category) {
      case "music": setMusicVol(value); break;
      case "sfx": setSfxVol(value); break;
      case "ui": setUiVol(value); break;
    }
  };

  const handleMuteToggle = (category: "music" | "sfx" | "ui") => {
    audioManager.toggleMute(category);
    switch (category) {
      case "music": setMusicMuted(!musicMuted); break;
      case "sfx": setSfxMuted(!sfxMuted); break;
      case "ui": setUiMuted(!uiMuted); break;
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Audio Settings">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold uppercase tracking-wider">Background Music</span>
            <button
              type="button"
              onClick={() => handleMuteToggle("music")}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border transition ${
                musicMuted 
                  ? "border-signal/40 bg-signal/15 text-signal" 
                  : "border-hairline bg-raised text-ink-soft hover:bg-raised/80"
              }`}
            >
              {musicMuted ? "Unmute" : "Mute"}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={musicMuted ? 0 : Math.round(musicVol * 100)}
            onChange={(e) => handleVolumeChange("music", parseInt(e.target.value) / 100)}
            className="w-full accent-signal"
          />
          <div className="text-[11px] text-ink-faint">Volume: {musicMuted ? "Muted" : `${Math.round(musicVol * 100)}%`}</div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold uppercase tracking-wider">Sound Effects</span>
            <button
              type="button"
              onClick={() => handleMuteToggle("sfx")}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border transition ${
                sfxMuted 
                  ? "border-signal/40 bg-signal/15 text-signal" 
                  : "border-hairline bg-raised text-ink-soft hover:bg-raised/80"
              }`}
            >
              {sfxMuted ? "Unmute" : "Mute"}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxMuted ? 0 : Math.round(sfxVol * 100)}
            onChange={(e) => handleVolumeChange("sfx", parseInt(e.target.value) / 100)}
            className="w-full accent-signal"
          />
          <div className="text-[11px] text-ink-faint">Volume: {sfxMuted ? "Muted" : `${Math.round(sfxVol * 100)}%`}</div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold uppercase tracking-wider">UI Sounds</span>
            <button
              type="button"
              onClick={() => handleMuteToggle("ui")}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border transition ${
                uiMuted 
                  ? "border-signal/40 bg-signal/15 text-signal" 
                  : "border-hairline bg-raised text-ink-soft hover:bg-raised/80"
              }`}
            >
              {uiMuted ? "Unmute" : "Mute"}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={uiMuted ? 0 : Math.round(uiVol * 100)}
            onChange={(e) => handleVolumeChange("ui", parseInt(e.target.value) / 100)}
            className="w-full accent-signal"
          />
          <div className="text-[11px] text-ink-faint">Volume: {uiMuted ? "Muted" : `${Math.round(uiVol * 100)}%`}</div>
        </div>

        <div className="rounded-md border border-hairline bg-raised/40 p-3">
          <h4 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">About Audio</h4>
          <ul className="space-y-1 text-[11px] text-ink-soft">
            <li><b>Background Music:</b> Opening theme, post-race theme, and race ambience</li>
            <li><b>Sound Effects:</b> Race events, driver actions, notifications</li>
            <li><b>UI Sounds:</b> Button clicks, tab switches, and interface feedback</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button small onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}