/**
 * URL publique d'activation d'un compte à partir du jeton d'invitation.
 * Basée sur APP_URL (dans un route handler, request.url pointe sur l'adresse
 * interne derrière le proxy — APP_URL doit refléter le domaine public).
 */
export function inviteUrl(token: string): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/activate/${token}`;
}
