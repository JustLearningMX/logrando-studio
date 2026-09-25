# TikTok — datos de la app (para el portal de desarrolladores)

Texto exacto para los campos del portal, versionado aquí porque TikTok pide
"si envías una revisión, incluye los cambios de esta versión" — sin un registro
de lo que se envió, la siguiente revisión se escribe a ciegas.

**En inglés a propósito:** la revisión de TikTok la hacen revisores que trabajan
en inglés. El sitio está en español, que es correcto y esperado para un estudio
de contenido en español, pero la explicación de scopes se lee mejor en inglés.

> **Antes de enviar:** las URLs de abajo tienen que estar vivas. Si el repo no
> se ha publicado en GitHub Pages, el revisor ve un 404 y la revisión se rechaza.

## Campos del portal

| Campo | Valor |
|---|---|
| Terms of Service | `https://justlearningmx.github.io/logrando-studio/terms/` |
| Privacy Policy | `https://justlearningmx.github.io/logrando-studio/privacy/` |
| Platform | Web |
| Website URL | `https://justlearningmx.github.io/logrando-studio/` |
| Login Kit redirect URI | `https://justlearningmx.github.io/logrando-studio/tiktok/callback/` |

**Verificación de propiedad**: por **URL prefix**, no por dominio. El prefijo
`https://justlearningmx.github.io/logrando-studio/` cubre las cuatro URLs de un
golpe. Por dominio habría exigido el archivo de firma en la raíz de
`justlearningmx.github.io`, que es el sitio personal del dueño y está fuera de
alcance. El archivo es `public/tiktokVK4dgDqUcQq8KduB4Fuu8VjOoSSnG71L.txt`:
**el nombre es `tiktok` + la firma + `.txt`**, tal cual lo entrega el portal, no
un nombre genérico. `verify-build.mjs` lo vigila.

**Por qué "Web":** el flujo usa un redirect URI `https://` y el intercambio del
código ocurre fuera del navegador, con el client secret. Eso es exactamente la
definición de app Web en TikTok, y es la razón por la que no usamos PKCE
(`code_verifier` solo es obligatorio para las plataformas mobile y desktop).

**La barra final del redirect URI importa.** Tiene que coincidir byte por byte
con `redirect_uri` en `~/.openmontage/tiktok/client_secret.json`; si no, el
intercambio del código falla con un error que no dice por qué.

## Explicación de productos y scopes

Texto para el campo *"Explain how each product and scope works within your app
or website"*:

---

Logrando Studio is a private, single-operator tool that publishes my own
short-form educational videos to my own TikTok accounts. It is not offered to
third parties and does not manage anyone else's accounts. The website above is
the studio's public site; the channel pages describe the content we publish.

**Login Kit — `user.info.basic`**

After the operator authorizes an account, the app calls `/v2/user/info/`
requesting only `open_id` and `display_name`. It has exactly one use: a safety
check. The studio runs several channels, and before sending a video the app
compares the authorized account against the channel the video was produced for.
If they do not match, the upload is aborted and nothing is sent. No profile
information is shown to anyone, published, or used for any other purpose.

**Content Posting API — `video.upload`**

The app sends a finished, already-reviewed MP4 to the authorized account's inbox
using the draft flow:

1. `POST /v2/post/publish/inbox/video/init/` with `source: FILE_UPLOAD` and the
   file's size and chunk plan.
2. The video bytes are uploaded with `PUT` to the returned `upload_url`.
3. `POST /v2/post/publish/status/fetch/` is polled until the status is
   `SEND_TO_USER_INBOX`.

The creator then opens the notification inside the TikTok app, writes the
caption, and publishes the video themselves.

**We deliberately do not request `video.publish`.** Every post is finished and
published by a human inside TikTok. Nothing this app does results in a post
appearing without a person completing it in the app.

**Typical flow:** a video is produced and reviewed → the operator approves it →
the app verifies which account is authorized → the file is uploaded to that
account's inbox → the operator opens TikTok, pastes the caption, and posts.

No other scope is requested. The app does not read videos, followers, comments,
direct messages or analytics, and it cannot edit or delete existing posts.

---

## El video demo

**No es contenido del canal, es una grabación de pantalla de la integración.**
TikTok verifica que cada scope solicitado aparezca en el video, y "la demo no
cubre un scope" es de las causas más comunes de rechazo. Debe mostrar, en orden:

1. La barra de direcciones con el dominio declarado
2. El botón "Conectar cuenta de TikTok" en `/app/`
3. La pantalla de consentimiento de TikTok — *Login Kit*
4. El regreso al callback
5. La terminal confirmando la cuenta — *user.info.basic*
6. La subida llegando a `SEND_TO_USER_INBOX` — *video.upload*
7. La notificación en el teléfono
8. **Una persona escribiendo el caption y publicando** — la evidencia de por qué
   no pedimos `video.publish`

Formato: mp4 o mov, máximo 5 archivos de 50 MB cada uno. Grabado en sandbox,
que es requisito para una app que nunca ha sido aprobada.

> **Revisa la grabación cruda cuadro por cuadro antes de enviarla.** La primera
> toma traía la fototeca personal del dueño en pantalla dos veces (el diálogo de
> permisos de TikTok y el selector) y el video de una tercera persona en el feed
> "Para ti". Ambos recortados. Una grabación de pantalla sin revisar es una fuga
> de privacidad esperando a ocurrir.

Una terminal comprime muchísimo: el clip 1 pasó de 66.7 MB a 2.1 MB sin perder
legibilidad, porque es contenido casi estático y el grabador gastaba 8.35 Mbps.

## Historial de envíos

| Fecha | Cambio |
|---|---|
| 2026-09-21 | Primer envío. Login Kit (`user.info.basic`) + Content Posting API (`video.upload`). Dos clips: autorización y subida desde la compu, publicación desde el teléfono. **Rechazado 2026-09-25**, sólo por el ícono (ver abajo). |
| 2026-09-25 | Reenvío con un único cambio: **App icon** → `public/icon-1024.png`. Todo lo demás (campos, texto de scopes, clips) igual que el 09-21. **Pendiente de resolución.** |

## El ícono tiene que ser el mismo en tres lugares

Rechazo del 2026-09-25, textual: *"The app icon submitted in the Basic Info does
not match the icon displayed on the website. Please ensure the same icon is used
consistently across both the TikTok, the website and Browser tab (favicon)."*

El primer envío llevaba el ícono de **deviatips**, pero la app se llama Logrando
Studio y el sitio no mostraba ningún ícono (el favicon era un emoji 🎬 y el
encabezado, el texto `[▸]`). La app es del estudio, no de un canal: autoriza
también los TikTok de los canales que vengan. Por eso el ícono es el `[▸]` del
estudio y no el de ningún canal.

**Una sola fuente:** `public/icon.svg`. De ahí salen el favicon, el logo del
encabezado (`BaseLayout.astro`) y los PNG (`node scripts/render-icon.mjs`), incluido
`icon-1024.png`, que es el que se sube al portal. Si cambias el ícono, cámbialo en
el SVG, regenera y **vuelve a subirlo a TikTok**; si no, la siguiente revisión
se rechaza por lo mismo.
