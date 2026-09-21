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
 */

export const TIKTOK = {
  clientKey: "aw4azfkuht5b3vr3",

  /**
   * Must match the Login Kit redirect URI registered in the portal byte for
   * byte, trailing slash included. A mismatch fails the token exchange with an
   * error that does not say why.
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
