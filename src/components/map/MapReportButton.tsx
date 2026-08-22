import { useState } from "react";
import Button from "@/components/Button";
import { useModalDialog } from "@/lib/useModalDialog";

type Props = {
  circleId: string;
  onReported: (id: string) => void;
};

type Status = "idle" | "sending" | "sent" | "error";

export default function MapReportButton({ circleId, onReported }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const dialogRef = useModalDialog(open, () => setOpen(false));

  const report = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: circleId }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      onReported(circleId);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={status === "sending" || status === "sent"}
        aria-label="Reportar contenido"
        className="text-secondary hover:bg-navy/5 focus-visible:outline-navy flex size-12 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-2xl focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg aria-hidden="true" className="h-5 w-5">
          <use href="/icons/sprite.svg#icon-report" />
        </svg>
      </button>
      {status === "error" && (
        <p className="text-navy/70 text-sm">No se pudo enviar el reporte.</p>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby="report-popup-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="border-secondary bg-magenta relative m-auto w-[calc(100%-2rem)] max-w-sm space-y-5 rounded-2xl border-2 p-8 text-center shadow-[0_-4px_20px_rgb(0_0_0/0.4)] backdrop:bg-black/50"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="absolute top-3 left-3 flex size-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-xl leading-none text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          ×
        </button>
        {status === "sent" ? (
          <>
            <svg aria-hidden="true" className="mx-auto h-10 w-10 text-white">
              <use href="/icons/sprite.svg#icon-successful" />
            </svg>
            <h2
              id="report-popup-title"
              className="m-0 text-xl font-bold text-white uppercase"
            >
              Contenido sapeado
            </h2>
            <p className="m-0 text-sm font-semibold text-white">
              Gracias por tu reporte
            </p>
            <p className="m-0 text-sm text-white">
              Hemos recibido tu solicitud y revisaremos el contenido para
              garantizar que este barrio siga siendo un espacio seguro y
              respetuoso para compartir historias.
            </p>
          </>
        ) : (
          <>
            <h2
              id="report-popup-title"
              className="text-xl font-bold text-white uppercase"
            >
              Reportar contenido
            </h2>
            <p className="text-base text-white">
              ¿Encontraste algo inapropiado? Ayúdanos a mantener el barrio
              seguro sapeando el contenido.
            </p>
            <Button
              variant="secondary"
              onClick={report}
              disabled={status === "sending"}
              className="text-navy! cursor-pointer bg-white! hover:bg-white/90!"
            >
              Reportar
            </Button>
          </>
        )}
      </dialog>
    </div>
  );
}
