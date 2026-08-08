// ============================================================
//  3. Sidebar — create a circle
// ============================================================
import {
  circlePreview,
  closeBtn,
  colorGroup,
  fileField,
  form,
  formStatus,
  mediaFile,
  mediaType,
  openBtn,
  sidebar,
  submitBtn,
  textContent,
  textField,
} from "./dom";
import { allCircles } from "./state";
import { centerOnCircle } from "./pan";
import { insertCircle, uploadMedia } from "../lib/supabase.client";
import type { MediaType } from "../lib/types";

function closeSidebar() {
  sidebar.classList.remove("open");
  formStatus.textContent = ""; // drop stale success/error on close
}

function selectedColor(): string {
  const checked = form.querySelector<HTMLInputElement>('input[name="color"]:checked');
  return checked?.value ?? "#e63946";
}

/** Sync preview marker to the selected color (color only for now; swap for "chais" later). */
function updatePreview() {
  circlePreview.style.background = selectedColor();
}

/** Disable the create button until the active media input has content. */
function updateSubmitState() {
  const filled =
    mediaType.value === "text"
      ? textContent.value.trim() !== ""
      : (mediaFile.files?.length ?? 0) > 0;
  submitBtn.disabled = !filled;
}

function onMediaTypeChange() {
  const isText = mediaType.value === "text";
  textField.classList.toggle("hidden", !isText);
  fileField.classList.toggle("hidden", isText);
  mediaFile.accept = mediaType.value === "video" ? "video/*" : "image/*";
  updateSubmitState();
}

async function onSubmit(e: SubmitEvent) {
  e.preventDefault();

  submitBtn.disabled = true;
  formStatus.textContent = "Creando...";

  try {
    const type = mediaType.value as MediaType;
    let media_url: string | null = null;
    let text_content: string | null = null;

    if (type === "text") {
      text_content = textContent.value.trim();
      if (!text_content) throw new Error("Escribe algo de texto.");
    } else {
      const file = mediaFile.files?.[0];
      if (!file) throw new Error("Elige un archivo.");
      media_url = await uploadMedia(file);
    }

    // random spot on the map (percent)
    const x = Math.round(Math.random() * 90 + 5);
    const y = Math.round(Math.random() * 90 + 5);

    const circle = await insertCircle({
      x,
      y,
      color: selectedColor(),
      media_type: type,
      media_url,
      text_content,
    });

    allCircles.push(circle);
    centerOnCircle(circle); // recenters + culling pass mounts the new circle (animated)
    formStatus.textContent = "¡Círculo creado!";
    form.reset();
    onMediaTypeChange(); // reset() restored "text" — resync the visible fields
    updatePreview(); // reset() restored default color — snap preview back too
    closeSidebar(); // close sidebar after creating
  } catch (err) {
    console.error(err);
    formStatus.textContent = "Error: " + (err instanceof Error ? err.message : String(err));
  } finally {
    updateSubmitState(); // re-enable only if the input still has content
  }
}

export function initSidebar() {
  openBtn.addEventListener("click", () => sidebar.classList.add("open"));
  closeBtn.addEventListener("click", closeSidebar);
  colorGroup.addEventListener("change", updatePreview);
  mediaType.addEventListener("change", onMediaTypeChange);
  textContent.addEventListener("input", updateSubmitState);
  mediaFile.addEventListener("change", updateSubmitState);
  form.addEventListener("submit", onSubmit);

  updatePreview(); // reflect default-checked swatch on boot
  updateSubmitState(); // start disabled (empty text by default)
}
