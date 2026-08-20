import { useEffect, useState } from "react";

type Status = "loading" | "ready" | "error";

export function useMediaStatus(key: unknown) {
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => setStatus("loading"), [key]);
  return [status, setStatus] as const;
}
