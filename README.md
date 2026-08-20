# Mapa Imaginario

Una página web: un mapa que puedes **arrastrar** (mover), donde cualquiera puede crear
**círculos** de colores con texto, imagen o video adjunto. Los círculos se **comparten entre
todos los visitantes**. Al hacer clic en un círculo, aparece su contenido.

Hecho con [Astro](https://astro.build) + Tailwind + Supabase.

---

## Paso 1 — Crear el backend gratis (Supabase)

Supabase guarda los círculos y los archivos para que todos los vean.

1. Entra a **<https://supabase.com>** → _Start your project_ → crea una cuenta gratis.
2. Crea un proyecto nuevo (elige cualquier nombre y contraseña; espera ~1 min).
3. En el menú izquierdo abre **SQL Editor** → _New query_ → pega TODO el contenido del
   archivo `supabase-setup.sql` → botón **Run**.
4. En el menú izquierdo abre **Storage** → _New bucket_ → nombre **`media`** → marca
   **Public** → _Create_. (Las políticas ya se crearon en el paso 3.)
5. Abre **Project Settings** (engranaje) → **API**. Copia dos cosas:
   - **Project URL**
   - **publishable / anon key**

> La clave pública lo es a propósito; es segura en el navegador porque las reglas (RLS)
> del paso 3 controlan qué se puede hacer.

---

## Paso 2 — Correr la página en tu computador

1. Copia el archivo `.env.example` a **`.env`**.
2. Pega tu **Project URL** y tu **publishable key**.
3. En una terminal, dentro de la carpeta del proyecto (este proyecto usa **pnpm**; si no lo
   tienes, instálalo con `npm install -g pnpm`):

   ```sh
   pnpm install
   pnpm dev
   ```

4. Abre la URL `http://localhost:4321` que muestra.

Luego crea un círculo y debería aparecer en el mapa.

> **Tu mapa real:** reemplaza `public/assets/map.png` con tu imagen. Si falta, se muestra
> `public/assets/placeholder.svg` como mapa de marcador.

---

## Paso 3 — Publicar para todo el mundo (Netlify)

Esta versión **sí compila**, así que ya no sirve arrastrar la carpeta.

1. Sube el proyecto a GitHub.
2. Entra a **<https://app.netlify.com>** → _Add new site_ → _Import an existing project_ →
   elige el repositorio.
3. Netlify lee `netlify.toml` (`pnpm run build`, publica `dist`) y el adaptador crea la
   función de servidor sola. Netlify detecta `pnpm-lock.yaml` y usa pnpm solo.
4. En **Site settings → Environment variables** agrega las mismas tres variables del `.env`.
5. Netlify te da una URL pública tipo `https://algo.netlify.app` — compártela.

---

## Archivos del proyecto

| Archivo                         | Qué es                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `src/pages/index.astro`         | La página; lee los círculos en el servidor                    |
| `src/layouts/Layout.astro`      | El `<html>` de la página                                      |
| `src/components/`               | El mapa (`MapViewport`) y el panel de crear (`Sidebar`)       |
| `src/scripts/`                  | La lógica del mapa: arrastrar, círculos, tooltip, tiempo real |
| `src/lib/`                      | Clientes de Supabase (servidor y navegador) y los tipos       |
| `src/styles/global.css`         | Colores del proyecto + estilos que el JS necesita             |
| `.env.example`                  | Plantilla — cópiala a `.env` y pon tus llaves                 |
| `supabase-setup.sql`            | Se pega una vez en Supabase para crear la base de datos       |
| `astro.config.mjs`              | Configuración de Astro (SSR, Netlify, Tailwind, variables)    |
| `netlify.toml`                  | Le dice a Netlify cómo compilar y publicar                    |
| `public/assets/map.png`         | Tu imagen del mapa (tú la pones)                              |
| `public/assets/placeholder.svg` | Mapa de marcador mientras no hay `map.png`                    |

## Notas / pendientes

- Sin zoom todavía (solo arrastrar) — por diseño.
- Los círculos caen en una posición al azar; todavía no hay forma de elegir dónde.
- Cualquiera puede crear círculos (sin cuentas). Se puede agregar login después.
- Videos muy grandes pueden topar el límite gratuito de Supabase (~1 GB).
