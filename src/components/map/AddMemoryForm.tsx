import { useEffect, useRef, useState } from "react";
import type { CSSProperties, JSX } from "react";
import chairUrl from "@/assets/chair/pink_chair.webp";
import { insertCircle, uploadMedia } from "@/lib/supabase.client";
import type { Circle, MediaType } from "@/lib/types";

const COLORS = [
  "#e63946",
  "#f3722c",
  "#f9c74f",
  "#90be6d",
  "#43aa8b",
  "#577590",
  "#277da1",
  "#9b5de5",
  "#f15bb5",
  "#1d3557",
];

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err)
    return String(err.message);
  return String(err);
}

const asideClass =
  "rounded-l-2xl z-30 h-full w-140 max-w-[90vw] overflow-y-auto bg-paper p-6 shadow-[-4px_0_20px_rgb(0_0_0/0.4)]";
const fieldClass =
  "w-full rounded-xl border-none bg-line/25 px-5 py-3 font-normal text-navy placeholder:text-navy/50";
const MEDIA_OPTIONS: {
  type: Exclude<MediaType, "text">;
  label: string;
  icon: JSX.Element;
}[] = [
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
  onCreated: (circle: Circle) => void;
};

export default function AddMemoryForm({ open, onClose, onCreated }: Props) {
  const [color, setColor] = useState(COLORS[0]!);
  const [mediaType, setMediaType] = useState<MediaType>("text");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      firstFieldRef.current?.focus();
    } else {
      setStatus("");
      setTitle("");
      setAuthor("");
      setText("");
      deselectAttachment();
    }
  }, [open]);

  const filled = text.trim() !== "" && (mediaType === "text" || hasFile);

  function deselectAttachment() {
    setMediaType("text");
    setHasFile(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    setBusy(true);
    setStatus("Creando...");

    try {
      const text_content = text.trim();
      if (!text_content) throw new Error("Escribe algo de texto.");

      let media_url: string | null = null;
      if (mediaType !== "text") {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error("Elige un archivo.");
        media_url = await uploadMedia(file);
      }

      const circle = await insertCircle({
        x: Math.round(Math.random() * 90 + 5),
        y: Math.round(Math.random() * 90 + 5),
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
          className="cursor-pointer border-none bg-transparent text-2xl leading-none text-navy"
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
            style={{ backgroundColor: `${color}4d` }}
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
            {COLORS.map((c) => (
              <label
                key={c}
                className="swatch size-6.5 cursor-pointer rounded-xl"
                style={{ "--c": c } as CSSProperties}
              >
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={color === c}
                  onChange={() => setColor(c)}
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

        <textarea
          placeholder="Deja tu relato"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${fieldClass} h-44 resize-none rounded-3xl`}
        />

        <fieldset className="flex gap-2.5 border-none p-0">
          <legend className="sr-only">
            Adjuntar video o imagen (opcional)
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
            accept={mediaType === "video" ? "video/*" : "image/*"}
            onChange={(e) => setHasFile((e.target.files?.length ?? 0) > 0)}
            className="sr-only cursor-pointer"
          />
        </fieldset>

        {mediaType !== "text" && (
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

        <button
          type="submit"
          disabled={!filled || busy}
          className="mx-auto cursor-pointer rounded-full border-none bg-brand px-8 py-3.5 text-base font-bold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Soltar en el mapa
        </button>
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
