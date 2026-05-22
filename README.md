# Mapa Imaginario

Una página web: un mapa que puedes **arrastrar** (mover), donde cualquiera puede crear
**círculos** de colores con texto, imagen o video adjunto. Los círculos se **comparten entre
todos los visitantes**. Al hacer clic en un círculo, aparece su contenido.

No necesitas saber programar para ponerla en marcha. Sigue los 3 pasos.

---

## Paso 1 — Crear el backend gratis (Supabase)

Supabase guarda los círculos y los archivos para que todos los vean.

1. Entra a **https://supabase.com** → *Start your project* → crea una cuenta gratis.
2. Crea un proyecto nuevo (elige cualquier nombre y contraseña; espera ~1 min).
3. En el menú izquierdo abre **SQL Editor** → *New query* → pega TODO el contenido del
   archivo `supabase-setup.sql` → botón **Run**.
4. En el menú izquierdo abre **Storage** → *New bucket* → nombre **`media`** → marca
   **Public** → *Create*. (Las políticas ya se crearon en el paso 3.)
5. Abre **Project Settings** (engranaje) → **API**. Copia dos cosas:
   - **Project URL**
   - **anon public key** (la clave `anon` / `public`)

> La clave `anon` es pública a propósito; es segura en el navegador porque las reglas (RLS)
> del paso 3 controlan qué se puede hacer.

---

## Paso 2 — Conectar la página con tus llaves

1. Haz una copia del archivo `config.example.js` y renómbrala a **`config.js`**.
2. Ábrela con el Bloc de notas y pega tu **Project URL** y tu **anon public key**.
3. Guarda.

**Importante — no abras el archivo con doble clic.** Con doble clic la dirección empieza con
`file://` y el navegador bloquea la conexión a Supabase (verás un error de "file: URLs are
treated as unique security origins"). Hay que servirlo por `http://`. Opciones fáciles:

- **VS Code**: instala la extensión *Live Server* → clic derecho en `index.html` →
  *Open with Live Server*.
- **O en una terminal** (dentro de la carpeta del proyecto): `npx serve .` y abre la URL
  `http://localhost:3000` que muestra.

(La versión publicada en Netlify ya usa `https://`, así que ahí no pasa este problema.)

Luego crea un círculo y debería aparecer en el mapa.

> **Tu mapa real:** coloca tu imagen en `assets/map.png` y en `index.html` cambia
> `src="assets/placeholder.svg"` por `src="assets/map.png"`. Mientras tanto se ve un mapa de
> marcador.

---

## Paso 3 — Publicar para todo el mundo (Netlify)

1. Entra a **https://app.netlify.com** → crea cuenta gratis.
2. Opción fácil: **arrastra la carpeta del proyecto** completa a la zona *"drag and drop"*
   de Netlify.
3. Netlify te da una URL pública tipo `https://algo.netlify.app` — compártela. Cualquiera
   que la abra ve los mismos círculos.

(Si luego conectas un repositorio de GitHub, Netlify republicará solo con cada cambio.)

---

## Archivos del proyecto

| Archivo | Qué es |
|---|---|
| `index.html` | La página |
| `style.css` | Los estilos / apariencia |
| `app.js` | La lógica (arrastrar, crear círculos, tooltip, compartir) |
| `config.example.js` | Plantilla — cópiala a `config.js` y pon tus llaves |
| `supabase-setup.sql` | Se pega una vez en Supabase para crear la base de datos |
| `netlify.toml` | Le dice a Netlify que solo sirva los archivos (sin compilar) |
| `assets/map.png` | Tu imagen del mapa (tú la pones) |
| `assets/placeholder.svg` | Mapa de marcador mientras no hay `map.png` |

## Notas / pendientes
- Sin zoom todavía (solo arrastrar) — por diseño.
- Cualquiera puede crear círculos (sin cuentas). Se puede agregar login después.
- Videos muy grandes pueden topar el límite gratuito de Supabase (~1 GB).
