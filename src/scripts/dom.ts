/** Element lookups, resolved once. Module scripts are deferred, so the DOM exists. */

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`[la-silla] missing #${id} in the markup`);
  return node as T;
}

export const viewport = el<HTMLDivElement>("viewport");
export const map = el<HTMLDivElement>("map");
export const mapImage = el<HTMLImageElement>("map-image");
export const circlesLayer = el<HTMLDivElement>("circles-layer");
export const tooltip = el<HTMLDivElement>("tooltip");
export const tooltipBody = el<HTMLDivElement>("tooltip-content");

export const openBtn = el<HTMLButtonElement>("open-sidebar");
export const sidebar = el<HTMLElement>("sidebar");
export const closeBtn = el<HTMLButtonElement>("close-sidebar");
export const form = el<HTMLFormElement>("circle-form");
export const mediaType = el<HTMLSelectElement>("media-type");
export const textField = el<HTMLLabelElement>("text-field");
export const textContent = el<HTMLTextAreaElement>("text-content");
export const fileField = el<HTMLLabelElement>("file-field");
export const mediaFile = el<HTMLInputElement>("media-file");
export const submitBtn = el<HTMLButtonElement>("submit-circle");
export const formStatus = el<HTMLParagraphElement>("form-status");
export const colorGroup = el<HTMLFieldSetElement>("color-group");
export const circlePreview = el<HTMLSpanElement>("circle-preview");
