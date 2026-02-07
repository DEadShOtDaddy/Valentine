"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";

let sharedAudio = null;

function getSharedAudio() {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "metadata";
    sharedAudio.loop = true;
  }
  return sharedAudio;
}

export default function FloatingMusicPlayer({ musicUrl, autoStart = false }) {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [showMixer, setShowMixer] = useState(false);
  const [autoStartAttempted, setAutoStartAttempted] = useState(false);

  useEffect(() => {
    const audio = getSharedAudio();
    audioRef.current = audio;
    if (!audio) return;

    const syncPlaying = () => setIsPlaying(!audio.paused && !audio.ended);
    audio.addEventListener("play", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncPlaying);
    syncPlaying();

    return () => {
      audio.removeEventListener("play", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncPlaying);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setIsPlaying(false);
      setIsMuted(true);
      setShowMixer(false);
      setAutoStartAttempted(false);
      return;
    }

    if (audio.src !== musicUrl) {
      audio.src = musicUrl;
      audio.loop = true;
    }

    setShowMixer(false);
    setIsMuted(autoStart ? false : true);
    setAutoStartAttempted(false);
  }, [musicUrl, autoStart]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicUrl || !autoStart || autoStartAttempted) return;

    let cancelled = false;
    const startPlayback = async () => {
      try {
        await audio.play();
      } catch {
        // Browser autoplay policy may block; user can press play.
      } finally {
        if (!cancelled) setAutoStartAttempted(true);
      }
    };

    if (audio.readyState >= 2) {
      void startPlayback();
      return;
    }

    const onCanPlay = () => {
      audio.removeEventListener("canplay", onCanPlay);
      void startPlayback();
    };
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      cancelled = true;
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, [musicUrl, autoStart, autoStartAttempted]);

  if (!musicUrl) {
    return (
      <div className="fixed bottom-4 right-4 z-[70] flex items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-rose-200 bg-white/85 text-rose-700 opacity-50 shadow-md"
          aria-label="No music set"
          title="No music set for this page yet"
        >
          <Music2 size={14} />
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-rose-200 bg-white/85 text-rose-700 opacity-50 shadow-md"
          aria-label="No volume control available"
          title="Add music URL in Admin to enable volume"
        >
          <VolumeX size={14} />
        </button>
      </div>
    );
  }

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        if (isMuted) setIsMuted(false);
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("Music playback failed:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex items-center gap-2">
      {showMixer ? (
        <div className="rounded-xl border border-rose-200 bg-white/90 px-2 py-2 shadow-lg backdrop-blur">
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            className="h-1 w-24 accent-rose-600"
            aria-label="Music volume"
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowMixer((current) => !current)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-rose-700 shadow-md transition ${
          showMixer ? "opacity-100" : "opacity-65 hover:opacity-95"
        }`}
        aria-label="Open volume slider"
        title="Volume slider"
      >
        <SlidersHorizontal size={14} />
      </button>

      <button
        type="button"
        onClick={() => setIsMuted((current) => !current)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-rose-700 shadow-md transition ${
          isMuted ? "opacity-60 hover:opacity-90" : "opacity-100"
        }`}
        aria-label={isMuted ? "Unmute music" : "Mute music"}
        title={isMuted ? "Unmute music" : "Mute music"}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      <button
        type="button"
        onClick={togglePlay}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-rose-700 shadow-md transition ${
          isPlaying ? "opacity-100" : "opacity-70 hover:opacity-100"
        }`}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        title={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </div>
  );
}
