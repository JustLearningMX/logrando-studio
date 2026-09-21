/**
 * Public TikTok app configuration.
 *
 * `clientKey` is an identifier, not a credential: it travels in the
 * authorization URL that every user's browser sees, exactly like an OAuth
 * client_id. It belongs in a public page.
 *
 * The client SECRET is a different thing entirely and never appears here, in
 * this repo, or in anything this site serves. It lives only on the operator's
 * machine (~/.openmontage/tiktok/client_secret.json) and is used solely by the
 * local script that exchanges the code for a token.
 *
 * ---------------------------------------------------------------------------
 * SANDBOX AND PRODUCTION HAVE DIFFERENT KEYS.
 *
 * TikTok issues a separate client_key/client_secret pair per environment.
 * Using the production key while the app is still unapproved gets you
 * "No se pudo iniciar sesión con TikTok ... client_key" at the consent screen,
 * with nothing else to go on.
 *
 * Whichever environment is active here, the operator's local
 * client_secret.json must use the MATCHING pair. That file holds both
 * environments and names the active one, mirroring this; a production key with
 * a sandbox secret fails later and less clearly, at the token exchange.
 * ---------------------------------------------------------------------------
 */

export type TikTokEnv = "sandbox" | "production";

/** Default environment. Flip once TikTok approves the app. */
const DEFAULT_ENV: TikTokEnv = "sandbox";

const CLIENT_KEYS: Record<TikTokEnv, string> = {
  sandbox: "sbaw63kh49zvhpnjqu",
  production: "aw4azfkuht5b3vr3",
};

/**
 * `?env=production` overrides the default without a rebuild, the same way
 * --env does on the local script. Anything unrecognised falls back to the
 * default rather than sending a bogus client_key to TikTok.
 */
export function resolveEnv(search?: string): TikTokEnv {
  const raw = new URLSearchParams(search ?? "").get("env");
  return raw === "sandbox" || raw === "production" ? raw : DEFAULT_ENV;
}

export function clientKeyFor(env: TikTokEnv): string {
  return CLIENT_KEYS[env];
}

export function isPlaceholder(key: string): boolean {
  return key.startsWith("PENDIENTE_");
}

export const TIKTOK = {
  defaultEnv: DEFAULT_ENV,

  /**
   * Must match the Login Kit redirect URI registered in the portal byte for
   * byte, trailing slash included — and it has to be registered in the SANDBOX
   * app's own Login Kit settings too, not only in the production one.
   */
  redirectUri: "https://justlearningmx.github.io/logrando-studio/tiktok/callback/",

  authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",

  /**
   * user.info.basic  — confirm which account authorized, so a video cannot be
   *                    sent to the wrong channel.
   * video.upload     — place a finished video in that account's inbox as a
   *                    draft, for a human to caption and publish.
   *
   * video.publish is deliberately NOT requested: nothing this tool does should
   * be able to put a post on a feed without a person completing it in the app.
   */
  scopes: ["user.info.basic", "video.upload"] as const,

  /** Channels of the studio. Each authorizes the same app separately. */
  channels: [{ slug: "deviatips", label: "deviatips" }] as const,
} as const;

/** sessionStorage key holding the CSRF state while the user is away at TikTok. */
export const STATE_KEY = "tiktok_oauth_state";
