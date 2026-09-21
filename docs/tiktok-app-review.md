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

## Historial de envíos

| Fecha | Cambio |
|---|---|
| — | Nada enviado todavía. |
