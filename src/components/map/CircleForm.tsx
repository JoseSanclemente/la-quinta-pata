import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

const asideClass =
  "z-30 h-full w-80 max-w-[90vw] overflow-y-auto bg-paper p-5 shadow-[-4px_0_20px_rgb(0_0_0/0.4)]";
const fieldClass = "rounded-md border border-line p-2 font-normal text-navy";
const labelClass = "flex flex-col gap-1.5 font-semibold text-navy";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (circle: Circle) => void;
};

export default function CircleForm({ open, onClose, onCreated }: Props) {
  const [color, setColor] = useState(COLORS[0]!);
  const [mediaType, setMediaType] = useState<MediaType>("text");
  const [text, setText] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
    else setStatus("");
  }, [open]);

  const filled = mediaType === "text" ? text.trim() !== "" : hasFile;

  async function submit() {
    setBusy(true);
    setStatus("Creando...");

    try {
      let media_url: string | null = null;
      let text_content: string | null = null;

      if (mediaType === "text") {
        text_content = text.trim();
        if (!text_content) throw new Error("Escribe algo de texto.");
      } else {
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
      });

      onCreated(circle);
      setText("");
      setHasFile(false);
      if (fileRef.current) fileRef.current.value = "";
      onClose();
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err instanceof Error ? err.message : String(err)));
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
      <div className="flex items-center justify-between">
        <h2 id="sidebar-title" className="m-0 text-2xl font-bold text-navy">
          Nuevo círculo
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="cursor-pointer border-none bg-transparent text-2xl leading-none text-navy"
        >
          ×
        </button>
      </div>

      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="mb-3 flex justify-center">
          <span
            className="size-14 rounded-full border-[3px] border-white/85 shadow-[0_2px_8px_rgb(0_0_0/0.5)] transition-[background] duration-150"
            style={{ background: color }}
          />
        </div>

        <fieldset className="m-0 flex flex-wrap gap-2.5 border-none p-0">
          <legend className="mb-1.5 p-0 font-semibold text-navy">Color del círculo</legend>
          {COLORS.map((c) => (
            <label
              key={c}
              className="swatch size-7.5 cursor-pointer rounded-full"
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

        <label className={labelClass}>
          Tipo de contenido
          <select
            ref={firstFieldRef}
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as MediaType)}
            className={fieldClass}
          >
            <option value="text">Texto</option>
            <option value="image">Imagen</option>
            <option value="video">Video</option>
          </select>
        </label>

        {mediaType === "text" ? (
          <label className={labelClass}>
            Texto
            <textarea
              rows={4}
              placeholder="Escribe algo..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={fieldClass}
            />
          </label>
        ) : (
          <label className={labelClass}>
            Archivo
            <input
              type="file"
              ref={fileRef}
              accept={mediaType === "video" ? "video/*" : "image/*"}
              onChange={(e) => setHasFile((e.target.files?.length ?? 0) > 0)}
              className={fieldClass}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={!filled || busy}
          className="cursor-pointer rounded-lg border-none bg-brand p-3 text-base font-bold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Crear y soltar en el mapa
        </button>
        <p className="m-0 min-h-4.5 text-sm text-navy" role="status">
          {status}
        </p>
      </form>
    </aside>
  );
}
