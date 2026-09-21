# Arquitectura — Logrando Studio

Define la aplicación web completa: el sitio público, el panel de monitoreo y su
backend. **Solo una parte está construida**; el resto es la definición que deja
el camino trazado.

Este documento manda sobre `DASHBOARD_DESIGN.md` (en el repo de OpenMontage)
donde se contradigan — ese documento es de 2026-09-19 y trae decisiones que ya
cambiaron. Las diferencias están marcadas abajo.

## Qué existe hoy y qué no

| Pieza | Estado |
|---|---|
| Sitio público (landing, legales, canal, callback OAuth) | **Construido y verificado** |
| Isla React en `/app/` | **Andamio** — hidrata y renderiza, sin lógica |
| `logrando-studio-api` (backend) | **Definido aquí, no construido** |
| Base de datos | **Definida en DASHBOARD_DESIGN.md, no construida** |
| Login del panel | **Definido aquí, no construido** |

La razón del recorte es explícita: lo urgente era desbloquear la publicación en
TikTok y quitar el vencimiento de 7 días del token de YouTube. Ambas cosas solo
necesitaban páginas públicas. El monitoreo está pausado a propósito.

## Los tres repos

```
C:\github-projects\
├── OpenMontage\                  privado · el motor de producción (Python)
├── logrando-studio\              público · este repo: sitio + panel (Astro/React/TS)
└── logrando-studio-api\          privado · backend (Hono/TS)  ← por crear
```

**Por qué separados y no un monorepo.** El front *tiene* que ser público: Pages
desde repo privado requiere GitHub Pro, y aun pagándolo el sitio publicado sigue
siendo público (sitio realmente privado = Enterprise Cloud, solo organizaciones).
El backend lleva secretos y configuración de servidor, así que va privado. Y
OpenMontage es privado por otra razón: `CHANNEL_LOG.md` tiene la estrategia de
canales.

Cada repo despliega a un destino distinto (Pages / OCI / ninguno), así que
separarlos también evita que un push a uno dispare el deploy del otro.

## Frontend — este repo

**Astro 5 + React 19 + TypeScript.** Astro corre sobre Vite, así que "React +
Vite + TS" sale de fábrica; lo único agregado es `@astrojs/react`.

La regla que ordena todo: **el sitio es estático salvo `/app/`.**

| Ruta | Render | Por qué |
|---|---|---|
| `/` | HTML estático | Sitio oficial ante TikTok y Google |
| `/privacy/`, `/terms/` | HTML estático | Registradas en dos portales externos |
| `/channels/<slug>/` | HTML estático | Contenido, una por canal |
| `/tiktok/callback/` | HTML + script `is:inline` | Retorno de OAuth |
| `/app/` | Isla React (`client:only`) | Datos autenticados por visitante |

**Lo que protege esa regla.** Las tres primeras filas las abre un revisor en
frío, sin sesión y a veces con scripts bloqueados. Si dependieran de hidratación,
un build roto convertiría una página de cumplimiento en una pantalla en blanco y
la revisión se rechazaría, sin que nada más en el pipeline se enterara. Por eso
`scripts/verify-build.mjs` corre en CI y **afirma que cada página crítica trae su
texto legal presente con los `<script>` removidos**.

El callback usa `is:inline` a propósito: es el punto de retorno de OAuth y tiene
que correr desde una carga de archivo plano, sin grafo de imports.

### Cuando se retome el panel

- **Ruteo:** `/app/` es una sola página que monta la isla. Si el panel crece a
  varias vistas, el ruteo va *dentro* de React, no en rutas de Astro — así se
  evita el truco de `404.html` para deep links, que es frágil.
- **Tipos de la API:** ver la restricción de abajo. Se generan desde el OpenAPI
  de `logrando-studio-api` hacia `src/api/`. No se escriben a mano ni se importan del
  repo del backend.

## Backend — `logrando-studio-api` (por construir)

**Hono + TypeScript**, en Docker sobre la VM de OCI Querétaro, detrás del nginx
que ya existe.

> **Cambio respecto a DASHBOARD_DESIGN.md.** Ese documento eligió FastAPI con el
> argumento "el repo ya es Python". El argumento perdió fuerza cuando el front
> quedó en TypeScript: tener los dos lados en el mismo lenguaje permite compartir
> el contrato de la API, que en un panel de tablas es justo donde más duele
> desincronizarse. El lado Python de OpenMontage no se ve afectado —
> `devtip_build.py` solo hace un POST del snapshot del ledger, y a HTTP le da
> igual el lenguaje de quien contesta.

> **Cambio respecto a DASHBOARD_DESIGN.md.** La API se llama `logrando-studio-api`, no
> `deviatips-api`. El paraguas es el estudio, no un canal, y habrá varios.
> Base pública: `https://hiram-oci-mty.duckdns.org/logrando-studio-api/v1/`

### La restricción que decide el diseño de tipos

El arma secreta de Hono es su cliente RPC (`hc`), que da tipos de punta a punta
importando los tipos del backend en el frontend. **Aquí no se puede usar:** el
front es un repo público y el back uno privado. Importar del privado exigiría un
token en el build del repo público, y filtraría tipos internos a un repo que
cualquiera puede leer.

**La salida:** `@hono/zod-openapi` genera un esquema OpenAPI a partir de los
mismos esquemas Zod que validan las peticiones. El esquema es seguro de publicar
(describe la superficie pública, no las entrañas), y de él se genera el cliente
tipado del front. Se pierde la magia del `hc`; se conserva el tipado real y la
validación en runtime, que es lo que importa.

### Superficie mínima de la API

Lo que el panel necesita para ser útil el día uno:

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | `/v1/videos` | Lista de videos con su estado por plataforma |
| `GET` | `/v1/videos/{projectId}` | Detalle de un video |
| `GET` | `/v1/channels` | Canales del estudio y sus cuentas conectadas |
| `POST` | `/v1/sync/ledger` | Recibe el snapshot que empuja `devtip_build.py` |
| `GET` | `/v1/me` | Sesión actual (quién es, qué puede hacer) |

`POST /v1/sync/ledger` es el único que no lo llama el navegador: lo llama la
máquina del operador con una llave propia. Autenticación distinta a la del panel
(ver abajo), y es la razón por la que la API necesita dos caminos de auth y no
uno.

### Dos flujos de autenticación que NO hay que confundir

Este es el error más fácil de cometer en este diseño:

1. **Login del panel** — Google Sign-In para que el operador abra `/app/`. Solo
   identifica a la persona frente al dashboard. No toca YouTube.
2. **Autorización de plataformas** — OAuth contra YouTube y TikTok para publicar
   en las cuentas del estudio. Emite tokens que suben videos.

Hoy el flujo 2 vive en la máquina del operador
(`~/.openmontage/{youtube,tiktok}/`) y el flujo 1 no existe. La fase 5 mueve el
flujo 2 al backend para que el servidor sea dueño del refresh token — **eso es
una migración de credenciales, no una función nueva**, y hay que planearla como
tal: mientras no esté probada, la máquina local sigue siendo la fuente de verdad.

### Tokens por canal

Ya resuelto del lado de OpenMontage y el backend debe respetarlo: **una sola app
de TikTok (y un solo cliente OAuth de Google) sirve a todos los canales**. Cada
cuenta autoriza por separado y guarda su propio token
(`~/.openmontage/tiktok/tokens/<canal>.json`). Nada en los portales se repite por
canal. Si el backend toma esto, la tabla de tokens va por *(canal, plataforma)*,
nunca una fila única por plataforma.

## Fases

1. ~~Páginas estáticas + callback OAuth~~ — **hecho**. Falta publicar el repo,
   prender Pages, registrar el dominio en Google y mover la app a Production.
2. Esquema + contrato de la API — parcialmente aquí y en `DASHBOARD_DESIGN.md`.
3. `logrando-studio-api`: login con Google, allowlist, endpoints de lectura, `/sync/ledger`.
4. Panel real en la isla de `/app/`.
5. Mover la autorización de YouTube del script local al flujo web del backend.
6. Sincronización por cron y captura manual para TikTok/Instagram/Facebook.

## Incógnitas sin resolver

- **Si Google acepta `justlearningmx.github.io`** como dominio autorizado para
  permisos sensibles. Viene de `DASHBOARD_DESIGN.md` y sigue sin verificarse:
  solo enviándolo se sabe.
- **Conectividad a MySQL** entre Querétaro y Monterrey (tenancies y regiones
  distintas, sin VCN peering). Instrucción del dueño: asumirla resuelta y no
  diseñar alrededor.
- **Forma de la VM de Querétaro** (Arm A1 vs AMD E2.1.Micro, RAM). No cambia el
  diseño; sí determina cuánto margen tiene el contenedor junto a nginx y las
  otras apps.
