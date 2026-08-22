type Props = {
  count: number;
  visible: boolean;
};

export default function MapHint({ count, visible }: Props) {
  return (
    <p
      role="status"
      className={`text-navy pointer-events-none fixed top-32 left-1/2 z-20 max-w-[calc(100vw-3rem)] -translate-x-1/2 rounded-full bg-white/95 px-5 py-2.5 text-center text-sm font-bold shadow-[0_2px_12px_rgb(0_0_0/0.18)] transition-opacity duration-500 md:top-40 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {count === 0
        ? "Todavía no hay recuerdos por acá. Dejá el primero."
        : "Arrastrá el mapa para chismosear los recuerdos."}
    </p>
  );
}
