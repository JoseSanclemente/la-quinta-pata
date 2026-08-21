import { useState } from "react";

type Props = {
  circleId: string;
  onReported: (id: string) => void;
};

type Status = "idle" | "sending" | "sent" | "error";

export default function MapReportButton({ circleId, onReported }: Props) {
  const [status, setStatus] = useState<Status>("idle");

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
        onClick={report}
        disabled={status === "sending" || status === "sent"}
        aria-label="Reportar contenido"
        className="flex size-12 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-2xl text-navy/70 hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg aria-hidden="true" className="h-5 w-5">
          <use href="/icons/sprite.svg#icon-report" />
        </svg>
      </button>
      {status === "error" && (
        <p className="text-sm text-navy/70">No se pudo enviar el reporte.</p>
      )}
    </div>
  );
}
