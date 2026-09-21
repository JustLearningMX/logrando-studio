/**
 * Scaffold for the publication dashboard. Deliberately empty of real logic:
 * the monitoring half of the project is paused, and the only reason this file
 * exists today is so the React + TypeScript island is wired, typed and
 * building — proving the path works before anyone depends on it.
 *
 * When the dashboard is picked up:
 *  - `VideoRow` below is a placeholder. The real shape comes from logrando-studio-api's
 *    OpenAPI schema, generated into `src/api/` — NOT hand-written, and NOT
 *    imported from the backend repo. See docs/architecture.md: this repo is
 *    public and logrando-studio-api is private, so Hono's `hc` RPC client is off the
 *    table and the generated OpenAPI client is the substitute.
 *  - Auth is Google sign-in against logrando-studio-api, which owns the session.
 */

import { useEffect, useState } from "react";

/** Placeholder — replaced by the generated API types. */
export interface VideoRow {
  projectId: string;
  title: string;
  channel: string;
  platform: "youtube" | "tiktok" | "instagram" | "facebook";
  status: "pending" | "uploaded" | "published" | "failed";
  url: string | null;
  publishedAt: string | null;
}

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; rows: VideoRow[] }
  | { kind: "error"; message: string };

export default function DashboardShell() {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  useEffect(() => {
    // No API yet. Kept explicit rather than faking data, so nobody mistakes a
    // placeholder for a working panel.
    setState({ kind: "idle" });
  }, []);

  if (state.kind === "loading") {
    return <p className="muted">Cargando…</p>;
  }

  if (state.kind === "error") {
    return <p className="muted">No se pudo cargar: {state.message}</p>;
  }

  if (state.kind === "ready") {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Video</th>
              <th scope="col">Canal</th>
              <th scope="col">Plataforma</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row) => (
              <tr key={`${row.projectId}-${row.platform}`}>
                <td>{row.url ? <a href={row.url}>{row.title}</a> : row.title}</td>
                <td>{row.channel}</td>
                <td>{row.platform}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="notice">
      <p>
        <strong>El panel todavía no está construido.</strong> Esta isla de React
        existe para dejar probado el camino: TypeScript, build y despliegue ya
        funcionan de punta a punta.
      </p>
      <p>
        Lo que falta es <code>logrando-studio-api</code> — el backend que sirve el estado
        de publicación de cada video.
      </p>
    </div>
  );
}
