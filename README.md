# logrando-studio — Logrando Studio

Sitio público de **Logrando Studio**: el estudio de contenido detrás de los
canales `deviatips` y los que vienen. Es un sitio estático servido por GitHub
Pages en <https://justlearningmx.github.io/logrando-studio/>.

El sitio existe por tres razones, en este orden:

1. **Es el sitio oficial de la app** que TikTok y Google piden al registrar una
   integración con sus APIs.
2. **Aloja las páginas legales** (`/privacy/` y `/terms/`) que ambas plataformas
   exigen. La de privacidad incluye la declaración de Uso Limitado que Google
   requiere para permisos sensibles.
3. **Aloja el punto de retorno de OAuth de TikTok** (`/tiktok/callback/`), que
   tiene que ser una URL `https://` real — TikTok rechaza `localhost`.

Más adelante crecerá hasta ser el panel de control de publicaciones. Esa parte
está **pausada a propósito**: `/app/` tiene la isla de React montada y
funcionando, pero sin lógica, porque el backend que la alimenta
(`logrando-studio-api`) todavía no existe. El diseño completo está en
[`docs/architecture.md`](docs/architecture.md).

## Stack

**Astro 5 + React 19 + TypeScript.** Astro corre sobre Vite, así que React + Vite
+ TS sale de fábrica. La regla que ordena todo: **el sitio es estático salvo
`/app/`** — ninguna página hidrata a menos que pida una isla con `client:*`.

Ver [`docs/architecture.md`](docs/architecture.md) para el diseño completo,
incluido el backend `logrando-studio-api` (definido, no construido).

## Estructura

```
src/pages/
  index.astro                → /                        estático
  privacy.astro              → /privacy/                estático ← portales
  terms.astro                → /terms/                  estático ← portales
  channels/deviatips.astro   → /channels/deviatips/     estático
  tiktok/callback.astro      → /tiktok/callback/        estático + script inline
  app/index.astro            → /app/                    isla React
  404.astro
src/layouts/BaseLayout.astro   header, footer y <head> — una sola copia
src/components/app/            la isla del panel (andamio)
src/styles/global.css          estilos compartidos
scripts/verify-build.mjs       afirma que las páginas críticas sobreviven sin JS
scripts/check-links.sh         links internos contra dist/
docs/architecture.md           el diseño completo
docs/tiktok-app-review.md      el texto que se pega en el portal de TikTok
```

**Qué es compartido y qué es por canal.** Privacidad, términos, el sitio oficial
y el callback de OAuth son **uno solo para todo el estudio**: una app de TikTok
(o un cliente OAuth de Google) sirve para todos los canales, y cada cuenta
autoriza por separado. Lo único que crece por canal es su página bajo
`/channels/`.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:4321
```

Antes de hacer push (es lo mismo que corre el CI):

```bash
npx astro check      # tipos
npm run build
npm run verify       # las páginas críticas sobreviven sin JS
bash scripts/check-links.sh
```

## Despliegue

Cada push a `main` dispara `.github/workflows/deploy.yml`: type check → build →
`verify` → link check → publica `dist/` en Pages. Si cualquier gate falla, no se
despliega nada.

Para que funcione la primera vez: **Settings → Pages → Source: GitHub Actions**.

## Cuidado con estas cosas

- **`/privacy/` y `/terms/` son URLs registradas en dos portales externos.** Si
  se renombran, las integraciones de TikTok y Google quedan apuntando a un 404,
  y eso basta para que rechacen una revisión. `verify-build.mjs` existe justo
  para atrapar eso: no solo checa que la página exista, sino que **su texto legal
  esté presente con los `<script>` removidos**. Un revisor la abre en frío.
- **No conviertas las legales en páginas con islas.** Si alguna necesita
  `client:*`, la verificación va a fallar, y con razón.
- **`build.format: "directory"` en `astro.config.mjs` no se toca.** Es lo que
  produce `/privacy/` en vez de `/privacy.html`, que es como están registradas.
- **`/tiktok/callback/` tiene que coincidir byte por byte** con el redirect URI
  registrado en el portal de TikTok, barra final incluida.
- **Las páginas legales describen lo que la app realmente hace.** Si cambian los
  permisos que pide la herramienta, hay que actualizarlas en el mismo cambio.
  Son declaraciones, no adorno.

## Licencia

El código de este sitio es MIT (ver `LICENSE`). El contenido de las páginas
legales y el material de marca de los canales no lo son: son declaraciones y
activos propios del estudio.
