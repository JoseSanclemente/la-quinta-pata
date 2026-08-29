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
      className="backdrop:bg-ink/85 m-auto w-full max-w-sm scale-110 overflow-y-auto rounded-2xl border-none bg-transparent bg-(image:--popup-mobile) bg-size-[100%_100%] bg-center px-[25%] py-20 text-center md:w-[calc(100%-5rem)] md:max-w-4xl md:bg-(image:--popup) md:bg-cover md:px-12 md:py-12"
      style={
        {
          "--popup-mobile": `url(${mobilePopupUrl.src})`,
          "--popup": `url(${popupUrl.src})`,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto space-y-2 py-2 md:max-w-md md:px-4 md:py-14">
        <h2
          id="intro-title"
          className="text-yellow text-lg font-bold md:text-3xl"
        >
          ¿QUEJESTO?
        </h2>
        <p className="text-sm whitespace-pre-line text-white md:mt-4 md:text-base">
          {`Bienvenidx al barrio de La Quinta Pata
Primero date una vueltica por el mapa y chismoseá los cuenticos que la gente puso.

Cuando ya te des tu vueltica, te invito a crear tu silla.

Podés escribir un texto, subir una fotico, grabar un audio o vídeo de tu historia con la Rimax
`}
        </p>
        <p className="text-yellow font-bold">
          ¿Listo para buscar La Quinta Pata?
        </p>
        <Button variant="secondary" onClick={onClose} className="mt-2 py-1!">
          ¡Vamos!
        </Button>
      </div>
    </dialog>
  );
}
