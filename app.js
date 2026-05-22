// ============================================================
//  Mapa Imaginario — all the page logic
// ============================================================

// ---- Supabase client ----
// NOTE: the CDN bundle defines a GLOBAL named `supabase`, so we must NOT reuse
// that name for our client. We call it `db`.
let db = null;
const cfg = window.SUPABASE_CONFIG;
if (cfg && cfg.url && !cfg.url.includes("YOUR-PROJECT")) {
  db = window.supabase.createClient(cfg.url, cfg.anonKey);
} else {
  console.warn("Supabase no configurado. Copia config.example.js a config.js y pon tus llaves.");
}

// ---- Elements ----
const viewport     = document.getElementById("viewport");
const map          = document.getElementById("map");
const circlesLayer = document.getElementById("circles-layer");
const openBtn      = document.getElementById("open-sidebar");
const sidebar      = document.getElementById("sidebar");
const closeBtn     = document.getElementById("close-sidebar");
const form         = document.getElementById("circle-form");
const colorInput   = document.getElementById("color");
const mediaType    = document.getElementById("media-type");
const textField    = document.getElementById("text-field");
const textContent  = document.getElementById("text-content");
const fileField    = document.getElementById("file-field");
const mediaFile    = document.getElementById("media-file");
const submitBtn    = document.getElementById("submit-circle");
const formStatus   = document.getElementById("form-status");
const tooltip      = document.getElementById("tooltip");
const tooltipBody  = document.getElementById("tooltip-content");
const closeTooltip = document.getElementById("close-tooltip");

// ============================================================
//  1. Pan / drag the map (no zoom)
// ============================================================
let pos = { x: 0, y: 0 };          // current translate
let start = { x: 0, y: 0 };        // pointer down origin
let origin = { x: 0, y: 0 };       // pos at pointer down
let panning = false;
let moved = false;                 // true if the pointer actually dragged

function applyTransform() {
  map.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

function clamp() {
  // keep at least part of the image on screen
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const mw = map.offsetWidth;
  const mh = map.offsetHeight;
  const minX = Math.min(0, vw - mw);
  const minY = Math.min(0, vh - mh);
  pos.x = Math.max(minX, Math.min(0, pos.x));
  pos.y = Math.max(minY, Math.min(0, pos.y));
}

function centerOnCircle(c) {
  const mw = map.offsetWidth, mh = map.offsetHeight;
  pos.x = viewport.clientWidth / 2 - (c.x / 100) * mw;
  pos.y = viewport.clientHeight / 2 - (c.y / 100) * mh;
  clamp();
  map.classList.add("smooth");
  applyTransform();
  scheduleVisible();
  map.addEventListener("transitionend", () => map.classList.remove("smooth"), { once: true });
}

function pointerDown(e) {
  panning = true;
  moved = false;
  viewport.classList.add("dragging");
  const p = e.touches ? e.touches[0] : e;
  start = { x: p.clientX, y: p.clientY };
  origin = { x: pos.x, y: pos.y };
}

function pointerMove(e) {
  if (!panning) return;
  moved = true;
  const p = e.touches ? e.touches[0] : e;
  pos.x = origin.x + (p.clientX - start.x);
  pos.y = origin.y + (p.clientY - start.y);
  clamp();
  applyTransform();
  scheduleVisible();
}

function pointerUp() {
  panning = false;
  viewport.classList.remove("dragging");
}

viewport.addEventListener("mousedown", pointerDown);
window.addEventListener("mousemove", pointerMove);
window.addEventListener("mouseup", pointerUp);
viewport.addEventListener("touchstart", pointerDown, { passive: true });
window.addEventListener("touchmove", pointerMove, { passive: true });
window.addEventListener("touchend", pointerUp);

// ============================================================
//  2. Render circles on the map (with viewport culling)
// ============================================================
// We keep ALL circle rows in `allCircles` but only mount the ones currently in
// view as DOM nodes. `renderedIds` tracks what's mounted; `droppedIds` tracks
// which circles already played their fall animation (first appearance only).
let allCircles = [];
const renderedIds = new Set();
const droppedIds = new Set();
const MARGIN = 200; // px buffer so circles mount just before they scroll in

// Mount a single circle as a DOM node (no-op if already mounted).
function renderCircle(c) {
  if (renderedIds.has(c.id)) return;
  const el = document.createElement("div");
  el.className = "circle";
  el.dataset.id = c.id;
  el.style.left = c.x + "%";
  el.style.top = c.y + "%";
  el.style.background = c.color;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    showTooltip(c);
  });
  // Play the drop animation only the first time this circle ever appears.
  if (!droppedIds.has(c.id)) {
    droppedIds.add(c.id);
    el.classList.add("dropping");
    el.addEventListener("animationend", () => el.classList.remove("dropping"), { once: true });
  }
  circlesLayer.appendChild(el);
  renderedIds.add(c.id);
}

// Unmount a circle's DOM node.
function removeCircle(id) {
  if (!renderedIds.has(id)) return;
  const el = circlesLayer.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();
  renderedIds.delete(id);
}

// Is the circle's screen position within the viewport (+ buffer)?
function isInView(c) {
  const mw = map.offsetWidth, mh = map.offsetHeight;
  const sx = pos.x + (c.x / 100) * mw; // screen x of the circle
  const sy = pos.y + (c.y / 100) * mh;
  return sx >= -MARGIN && sx <= viewport.clientWidth + MARGIN
      && sy >= -MARGIN && sy <= viewport.clientHeight + MARGIN;
}

// Culling pass: mount circles that entered view, unmount those that left.
function updateVisible() {
  for (const c of allCircles) {
    const visible = isInView(c);
    if (visible && !renderedIds.has(c.id)) renderCircle(c);
    else if (!visible && renderedIds.has(c.id)) removeCircle(c.id);
  }
}

// Throttle updateVisible to once per animation frame (called on every pan move).
let rafPending = false;
function scheduleVisible() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => { rafPending = false; updateVisible(); });
}

async function loadCircles() {
  if (!db) return;
  const { data, error } = await db.from("circles").select("*");
  if (error) { console.error(error); return; }
  allCircles = data;
  updateVisible();
}

// ============================================================
//  3. Sidebar — create a circle
// ============================================================
openBtn.addEventListener("click", () => sidebar.classList.remove("hidden"));
closeBtn.addEventListener("click", () => sidebar.classList.add("hidden"));

mediaType.addEventListener("change", () => {
  const isText = mediaType.value === "text";
  textField.classList.toggle("hidden", !isText);
  fileField.classList.toggle("hidden", isText);
  mediaFile.accept = mediaType.value === "video" ? "video/*" : "image/*";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!db) { formStatus.textContent = "Configura Supabase primero (config.js)."; return; }

  submitBtn.disabled = true;
  formStatus.textContent = "Creando...";

  try {
    const type = mediaType.value;
    let media_url = null;
    let text_content = null;

    if (type === "text") {
      text_content = textContent.value.trim();
      if (!text_content) throw new Error("Escribe algo de texto.");
    } else {
      const file = mediaFile.files[0];
      if (!file) throw new Error("Elige un archivo.");
      const path = `${Date.now()}-${file.name}`;
      const { error: upErr } = await db.storage.from("media").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = db.storage.from("media").getPublicUrl(path);
      media_url = pub.publicUrl;
    }

    // random spot on the map (percent)
    const x = Math.round(Math.random() * 90 + 5);
    const y = Math.round(Math.random() * 90 + 5);

    const { data, error } = await db
      .from("circles")
      .insert({ x, y, color: colorInput.value, media_type: type, media_url, text_content })
      .select()
      .single();
    if (error) throw error;

    allCircles.push(data);
    centerOnCircle(data); // recenters + culling pass mounts the new circle (animated)
    formStatus.textContent = "¡Círculo creado!";
    form.reset();
    mediaType.dispatchEvent(new Event("change"));
  } catch (err) {
    console.error(err);
    formStatus.textContent = "Error: " + (err.message || err);
  } finally {
    submitBtn.disabled = false;
  }
});

// ============================================================
//  4. Tooltip — show a circle's media
// ============================================================
function showTooltip(c) {
  tooltipBody.innerHTML = "";
  if (c.media_type === "image") {
    const img = document.createElement("img");
    img.src = c.media_url;
    tooltipBody.appendChild(img);
  } else if (c.media_type === "video") {
    const v = document.createElement("video");
    v.src = c.media_url;
    v.controls = true;
    tooltipBody.appendChild(v);
  } else {
    const p = document.createElement("p");
    p.textContent = c.text_content || "";
    tooltipBody.appendChild(p);
  }
  // Anchor to the circle's own position (same % space circles use), so the
  // tooltip lives inside the map and pans together with its circle.
  tooltip.style.left = c.x + "%";
  tooltip.style.top = c.y + "%";
  // Sit beside the circle; flip to the left side when near the right edge.
  tooltip.style.transform = c.x > 60
    ? "translate(calc(-100% - 14px), -50%)"
    : "translate(14px, -50%)";
  tooltip.classList.remove("hidden");
}

closeTooltip.addEventListener("click", () => tooltip.classList.add("hidden"));
// Click on empty map closes the tooltip — but ignore the click that ends a pan-drag.
viewport.addEventListener("click", () => {
  if (moved) return;
  tooltip.classList.add("hidden");
});

// ============================================================
//  5. Realtime — show circles others create, live
// ============================================================
function subscribeRealtime() {
  if (!db) return;
  db
    .channel("circles-changes")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "circles" },
      (payload) => {
        if (allCircles.some((c) => c.id === payload.new.id)) return; // dedupe own insert
        allCircles.push(payload.new);
        updateVisible(); // mounts (+ animates) only if currently in view
      })
    .subscribe();
}

// ---- Boot ----
loadCircles();
subscribeRealtime();
applyTransform();
