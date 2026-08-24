import Button from "@/components/Button";
import { useModalDialog } from "@/lib/useModalDialog";
import popupUrl from "@/assets/popup.webp";
import mobilePopupUrl from "@/assets/mobile_popup.webp";

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
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border-none bg-transparent bg-[image:var(--popup-mobile)] bg-[length:100%_100%] bg-center px-[18%] py-10 text-center backdrop:bg-ink/85 md:w-[calc(100%-3rem)] md:max-w-4xl md:bg-[image:var(--popup)] md:bg-cover md:px-12 md:py-12"
      style={
        {
          "--popup-mobile": `url(${mobilePopupUrl.src})`,
          "--popup": `url(${popupUrl.src})`,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-sm py-2 md:max-w-md md:px-4 md:py-14">
        <h2 id="intro-title" className="text-2xl font-bold text-yellow md:text-3xl">
          ¿QUEJESTO?
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm text-white md:mt-4 md:text-base">
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
