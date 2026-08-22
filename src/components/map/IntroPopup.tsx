import Button from "@/components/Button";
import { useModalDialog } from "@/lib/useModalDialog";
import popupUrl from "@/assets/popup.webp";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function IntroPopup({ open, onClose }: Props) {
  const dialogRef = useModalDialog(open, onClose);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="intro-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-3rem)] max-w-4xl overflow-y-auto rounded-2xl border-none bg-transparent bg-cover bg-center p-10 text-center backdrop:bg-ink/85 md:p-12"
      style={{ backgroundImage: `url(${popupUrl.src})` }}
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
    </dialog>
  );
}
