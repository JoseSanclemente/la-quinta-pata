import { useEffect, useRef, useState } from "react";
import type { CSSProperties, JSX, RefObject } from "react";
import Button from "@/components/Button";
import chairUrl from "@/assets/chair/pink_chair.webp";
import { CHAIR_COLORS } from "@/lib/chairColors";
import { insertChair, uploadMedia } from "@/lib/supabase.client";
import VoicePlayer from "@/components/map/VoicePlayer";
import type { Chair, MediaType } from "@/lib/types";

const AVATAR_BG_ALPHA = "4d";
const RECORDING_LIMIT_MS = 60_000;
const BORDER_MARGIN = 9;
const MIN_GAP = 10;
const PLACEMENT_ATTEMPTS = 40;

function pickPosition(existing: Chair[]) {
  let best = { x: 50, y: 50 };
  let bestMinDist = -1;
  for (let i = 0; i < PLACEMENT_ATTEMPTS; i++) {
    const x = Math.round(
      Math.random() * (100 - 2 * BORDER_MARGIN) + BORDER_MARGIN,
    );
    const y = Math.round(
      Math.random() * (100 - 2 * BORDER_MARGIN) + BORDER_MARGIN,
    );
    const minDist = existing.reduce((min, c) => {
      const d = Math.hypot(c.x - x, c.y - y);
      return Math.min(min, d);
    }, Infinity);
    if (minDist >= MIN_GAP) return { x, y };
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      best = { x, y };
    }
  }
  return best;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err)
    return String(err.message);
  return String(err);
}

const asideClass =
  "rounded-t-2xl md:rounded-t-none md:rounded-l-2xl z-30 w-full max-h-[85vh] md:h-full md:max-h-none md:w-140 md:max-w-[90vw] overflow-y-auto bg-[#F8FAFF] bg-[repeating-linear-gradient(0deg,#E6EAFF_0_2px,transparent_2px_40px),repeating-linear-gradient(90deg,#E6EAFF_0_2px,transparent_2px_40px)] p-6 shadow-[0_-4px_20px_rgb(0_0_0/0.4)] md:shadow-[-4px_0_20px_rgb(0_0_0/0.4)]";
const fieldClass =
  "w-full rounded-xl border-none bg-[#E6EFFE] px-5 py-3 font-normal text-navy placeholder:text-navy/50";
const MEDIA_OPTIONS: {
  type: Exclude<MediaType, "text">;
  label: string;
  icon: JSX.Element;
}[] = [
  {
    type: "audio",
    label: "Audio",
    icon: (
      <svg className="size-5.5" aria-hidden="true">
        <use href="/icons/sprite.svg#icon-mic" />
      </svg>
    ),
  },
  {
    type: "video",
    label: "Video",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-5.5">
        <rect
          x="2.5"
          y="5.5"
          width="14"
          height="13"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16.5 10.5 21 8v8l-4.5-2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    type: "image",
    label: "Imagen",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-5.5">
        <rect
          x="2.5"
          y="4"
          width="19"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="8" cy="9.5" r="1.8" fill="currentColor" />
        <path
          d="m4 18 5.5-5.5a2 2 0 0 1 2.8 0L15 15.2l1.7-1.7a2 2 0 0 1 2.8 0L21.5 15.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (chair: Chair) => void;
  existingChairsRef: RefObject<Chair[]>;
};

export default function AddMemoryForm({
  open,
  onClose,
  onCreated,
  existingChairsRef,
}: Props) {
  const [color, setColor] = useState(CHAIR_COLORS[0]!.hex);
  const [mediaType, setMediaType] = useState<MediaType>("text");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number>(undefined);
  const recordingIntervalRef = useRef<number>(undefined);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      previousFocusRef.current?.focus();
      setStatus("");
      setTitle("");
      setAuthor("");
      setText("");
      deselectAttachment();
    }
  }, [open]);

  const filled =
    text.trim() !== "" &&
    (mediaType === "text" ||
      (mediaType === "audio" ? audioBlob !== null : hasFile));

  function stopRecording() {
    window.clearTimeout(recordingTimeoutRef.current);
    window.clearInterval(recordingIntervalRef.current);
    recorderRef.current?.stop();
  }

  async function startRecording() {
    setAudioBlob(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStatus("");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setRecording(false);
    };

    recorderRef.current = recorder;
    setRecordedSeconds(0);
    recorder.start();
    setRecording(true);

    const startedAt = Date.now();
    recordingIntervalRef.current = window.setInterval(() => {
      setRecordedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    recordingTimeoutRef.current = window.setTimeout(
      stopRecording,
      RECORDING_LIMIT_MS,
    );
  }

  function deselectAttachment() {
    setMediaType("text");
    setHasFile(false);
    if (fileRef.current) fileRef.current.value = "";
    if (recording) stopRecording();
    setAudioBlob(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecordedSeconds(0);
  }

  async function submit() {
    setBusy(true);
    setStatus("Creando...");

    try {
      const text_content = text.trim();
      if (!text_content) throw new Error("Escribe algo de texto.");

      let media_url: string | null = null;
      if (mediaType === "audio") {
        if (!audioBlob) throw new Error("Graba un audio.");
        const file = new File([audioBlob], "voice.webm", {
          type: audioBlob.type,
        });
        media_url = await uploadMedia(file);
      } else if (mediaType !== "text") {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error("Elige un archivo.");
        media_url = await uploadMedia(file);
      }

      const { x, y } = pickPosition(existingChairsRef.current);
      const circle = await insertChair({
        x,
        y,
        color,
        media_type: mediaType,
        media_url,
        text_content,
        title: title.trim() || null,
        author: author.trim() || null,
      });

      onCreated(circle);
      setTitle("");
      setAuthor("");
      setText("");
      deselectAttachment();
      onClose();
    } catch (err) {
      console.error(err);
      setStatus("Error: " + errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      id="sidebar"
      className={open ? `open ${asideClass}` : asideClass}
      role="dialog"
      aria-modal={open}
      aria-labelledby="sidebar-title"
      inert={!open}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-2xl leading-none text-navy"
        >
          ×
        </button>
      </div>
      <h2 id="sidebar-title" className="sr-only">
        Agregar una memoria
      </h2>

      <form
        className="flex flex-col space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex size-32 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}${AVATAR_BG_ALPHA}` }}
          >
            <span
              className="chair size-24 transition-[background-color] duration-150"
              style={
                {
                  "--c": color,
                  "--chair-src": `url(${chairUrl.src})`,
                } as CSSProperties
              }
            />
          </div>

          <fieldset className="m-0 grid grid-cols-6 gap-2 border-none p-0">
            <legend className="sr-only">Color del círculo</legend>
            {CHAIR_COLORS.map((c) => (
              <label
                key={c.hex}
                aria-label={c.name}
                className="swatch size-6.5 cursor-pointer rounded-xl"
                style={{ "--c": c.hex } as CSSProperties}
              >
                <input
                  type="radio"
                  name="color"
                  value={c.hex}
                  checked={color === c.hex}
                  onChange={() => setColor(c.hex)}
                  className="pointer-events-none absolute opacity-0"
                />
              </label>
            ))}
          </fieldset>
        </div>

        <label className="sr-only" htmlFor="circle-title">
          Título
        </label>
        <input
          id="circle-title"
          ref={firstFieldRef}
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
        />

        <label className="sr-only" htmlFor="circle-author">
          Nombre o seudónimo
        </label>
        <input
          id="circle-author"
          type="text"
          placeholder="Nombre"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={fieldClass}
        />

        <label className="sr-only" htmlFor="circle-text">
          Relato
        </label>
        <textarea
          id="circle-text"
          placeholder="Deja tu relato"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${fieldClass} h-44 resize-none rounded-3xl`}
        />

        <fieldset className="flex gap-2.5 border-none p-0">
          <legend className="sr-only">
            Adjuntar audio, video o imagen (opcional)
          </legend>
          {MEDIA_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              aria-pressed={mediaType === opt.type}
              aria-label={opt.label}
              onClick={() => {
                if (mediaType === opt.type) {
                  deselectAttachment();
                } else {
                  setMediaType(opt.type);
                  setHasFile(false);
                }
              }}
              className={`flex size-11 cursor-pointer items-center justify-center rounded-xl border-none text-navy transition-colors ${
                mediaType === opt.type ? "bg-line/60" : "bg-line/25"
              }`}
            >
              {opt.icon}
            </button>
          ))}
          <input
            type="file"
            ref={fileRef}
            tabIndex={-1}
            aria-hidden="true"
            accept={mediaType === "video" ? "video/*" : "image/*"}
            onChange={(e) => setHasFile((e.target.files?.length ?? 0) > 0)}
            className="sr-only cursor-pointer"
          />
        </fieldset>

        {(mediaType === "video" || mediaType === "image") && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-transparent text-navy"
          >
            <span className="size-7 text-navy/60 [&_svg]:size-full">
              {MEDIA_OPTIONS.find((opt) => opt.type === mediaType)?.icon}
            </span>
            {hasFile ? (
              <span className="font-semibold">
                {fileRef.current?.files?.[0]?.name ?? "Archivo listo."}
              </span>
            ) : (
              <span className="text-navy/60">
                {mediaType === "video"
                  ? "Elige un video."
                  : "Elige una imagen."}
              </span>
            )}
          </button>
        )}

        {mediaType === "audio" && !recording && !audioBlob && (
          <button
            type="button"
            onClick={() => void startRecording()}
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-transparent text-navy"
          >
            <span className="size-7 text-navy/60 [&_svg]:size-full">
              {MEDIA_OPTIONS.find((opt) => opt.type === "audio")?.icon}
            </span>
            <span className="text-navy/60">Grabar audio.</span>
          </button>
        )}

        {mediaType === "audio" && recording && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-solid border-blue bg-blue/10 text-navy"
          >
            <span className="size-7 text-navy/60 [&_svg]:size-full">
              {MEDIA_OPTIONS.find((opt) => opt.type === "audio")?.icon}
            </span>
            <span className="font-semibold">
              Detener ({recordedSeconds}s / 60s)
            </span>
          </button>
        )}

        {mediaType === "audio" && !recording && audioBlob && audioUrl && (
          <div className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-transparent px-4 text-navy">
            <VoicePlayer src={audioUrl} />
            <button
              type="button"
              onClick={() => void startRecording()}
              className="cursor-pointer border-none bg-transparent text-sm text-navy/60 underline"
            >
              Grabar de nuevo
            </button>
          </div>
        )}

        <Button
          type="submit"
          disabled={!filled || busy}
          className="mx-auto"
        >
          Soltar en el mapa
        </Button>
        <p
          className="m-0 min-h-4.5 text-center text-sm text-navy"
          role="status"
        >
          {status}
        </p>
      </form>
    </aside>
  );
}
