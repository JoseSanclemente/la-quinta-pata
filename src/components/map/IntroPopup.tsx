import Button from "@/components/Button";
import popupUrl from "@/assets/popup.webp";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function IntroPopup({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/85 p-6"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col items-center overflow-y-auto rounded-2xl bg-cover bg-center p-10 text-center md:p-12"
        style={{ backgroundImage: `url(${popupUrl.src})` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-sm px-4 py-10 md:max-w-md md:py-14">
          <h2 id="intro-title" className="text-3xl font-bold text-yellow">
            ¿QUEJESTO?
          </h2>
          <p className="mt-4 whitespace-pre-line text-white">
            {`Bienvenidx al barrio de La Quinta Pata

Primero date una vueltica por el mapa y chismoseá los cuenticos que la gente ya tiene puestos por ahí.

Cuando ya te des tu vueltica, llevá tu sillita al lado de quien quieras. Podés escribir un textico, subir una fotico, grabar un audio o vídeo, o mezclados. Dale un poquito de estilo y personalidad a tu silla y compartila con los vecinos.`}
          </p>
          <p className="mt-4 font-bold text-yellow">
            ¿Listo para buscar La Quinta Pata?
          </p>
          <Button variant="secondary" onClick={onClose} className="mt-6">
            ¡Vamos!
          </Button>
        </div>
      </div>
    </div>
  );
}
