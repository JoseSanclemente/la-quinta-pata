import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 40;
const MIN_BAR_HEIGHT = 15;

type Props = {
  src: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function computePeaks(src: string): Promise<number[]> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    const res = await fetch(src);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const bucketSize = Math.max(1, Math.floor(data.length / BAR_COUNT));
    const peaks = Array.from({ length: BAR_COUNT }, (_, i) => {
      const start = i * bucketSize;
      let max = 0;
      for (let j = start; j < start + bucketSize; j++) {
        const v = Math.abs(data[j] ?? 0);
        if (v > max) max = v;
      }
      return max;
    });
    const peakMax = Math.max(...peaks, 0.0001);
    return peaks.map((p) => p / peakMax);
  } finally {
    void ctx.close();
  }
}

export default function VoicePlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    computePeaks(src)
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch(() => {
        if (!cancelled) setPeaks(Array(BAR_COUNT).fill(0.5));
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setTrackWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame: number;
    const tick = () => {
      setCurrentTime(audioRef.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else void audio.play();
  }

  function seek(clientX: number) {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || !Number.isFinite(audio.duration)) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  }

  const progress = duration ? currentTime / duration : 0;
  const bars = peaks ?? Array(BAR_COUNT).fill(0.3);

  return (
    <div className="flex w-full items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pausar" : "Reproducir"}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-blue"
      >
        <svg className="size-9" aria-hidden="true">
          <use href={`/icons/sprite.svg#icon-${playing ? "pause" : "play"}`} />
        </svg>
      </button>

      <span className="w-9 shrink-0 text-sm text-navy/70 tabular-nums">
        {formatTime(currentTime)}
      </span>

      <div
        ref={trackRef}
        onClick={(e) => seek(e.clientX)}
        className="relative h-9 flex-1 cursor-pointer"
      >
        <div className="absolute inset-0 flex items-center gap-[2px]">
          {bars.map((p, i) => (
            <span
              key={i}
              className="flex-1 rounded-full bg-blue/25"
              style={{ height: `${MIN_BAR_HEIGHT + p * (100 - MIN_BAR_HEIGHT)}%` }}
            />
          ))}
        </div>
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${progress * 100}%` }}
        >
          <div
            className="absolute inset-y-0 left-0 flex items-center gap-[2px]"
            style={{ width: trackWidth }}
          >
            {bars.map((p, i) => (
              <span
                key={i}
                className="flex-1 rounded-full bg-blue"
                style={{ height: `${MIN_BAR_HEIGHT + p * (100 - MIN_BAR_HEIGHT)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
