import { useRef, useState } from "react";

type Status = "loading" | "error" | "ready";

export function useMediaStatus(key: unknown) {
  const [status, setStatus] = useState<Status>("loading");
  const keyRef = useRef(key);
  if (keyRef.current !== key) {
    keyRef.current = key;
    setStatus("loading");
  }
  return [status, setStatus] as const;
}
