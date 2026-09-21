/**
 * "Connect a TikTok account" — the entry point of the authorization flow.
 *
 * This exists so the integration actually starts on the website this app
 * declares to TikTok, rather than in a terminal. It builds the same
 * authorization URL the local script used to print, and sends the browser to
 * it. Nothing secret is involved: the client key is a public identifier, and
 * the code that comes back is exchanged for a token on the operator's machine,
 * where the client secret lives.
 *
 * CSRF: the `state` parameter is generated here and kept in sessionStorage
 * while the user is away at TikTok; /tiktok/callback/ compares them on return
 * and refuses a mismatch. That is the standard place for this check in a web
 * flow — it moved here from the local script, it did not disappear.
 */

import { useState } from "react";
import { STATE_KEY, TIKTOK } from "../../config/tiktok";

function newState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function TikTokConnect() {
  const [channel, setChannel] = useState<string>(TIKTOK.channels[0].slug);
  const [error, setError] = useState<string | null>(null);

  function connect() {
    let state: string;
    try {
      state = newState();
      // Survives the round trip to TikTok; cleared by the callback page.
      sessionStorage.setItem(STATE_KEY, state);
      sessionStorage.setItem(`${STATE_KEY}_channel`, channel);
    } catch {
      // Private windows and blocked site data both land here. Without a stored
      // state there is nothing to compare on return, so stop rather than
      // continue with a check that would silently pass.
      setError(
        "Tu navegador está bloqueando el almacenamiento de sesión, y sin él no se puede verificar el regreso de TikTok. Prueba en una ventana normal."
      );
      return;
    }

    const params = new URLSearchParams({
      client_key: TIKTOK.clientKey,
      response_type: "code",
      scope: TIKTOK.scopes.join(","),
      redirect_uri: TIKTOK.redirectUri,
      state,
    });
    window.location.href = `${TIKTOK.authorizeUrl}?${params.toString()}`;
  }

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Conectar una cuenta de TikTok</h2>
      <p>
        Autoriza a Logrando Studio a dejar videos ya producidos en la bandeja de
        borradores de un canal. El video no se publica solo: tú lo terminas y lo
        publicas desde la app de TikTok.
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        <label htmlFor="channel" style={{ display: "block", marginBottom: 8 }}>
          Canal
        </label>
        <select
          id="channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          style={{
            font: "inherit",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            minWidth: "14rem",
          }}
        >
          {TIKTOK.channels.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>

        <p style={{ marginTop: 20, marginBottom: 0 }}>
          <button className="btn" type="button" onClick={connect}>
            Conectar cuenta de TikTok
          </button>
        </p>
      </div>

      {error && (
        <div className="notice warn">
          <p>{error}</p>
        </div>
      )}

      <h3>Permisos que se piden</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Permiso</th>
              <th scope="col">Para qué</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>user.info.basic</code>
              </td>
              <td>
                Confirmar qué cuenta autorizó, para no mandarle un video al canal
                equivocado.
              </td>
            </tr>
            <tr>
              <td>
                <code>video.upload</code>
              </td>
              <td>
                Dejar el video en la bandeja de borradores de esa cuenta, para que
                su dueño lo publique.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted">
        No se pide <code>video.publish</code>: nada de esto puede publicar en el
        feed por su cuenta.
      </p>
    </section>
  );
}
