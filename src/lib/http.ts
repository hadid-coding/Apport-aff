import { NextResponse } from "next/server";

/**
 * Redirection 303 avec un chemin RELATIF (Location relatif).
 *
 * Dans les route handlers (runtime Node), `request.url` reflète l'adresse
 * interne (ex. http://localhost:3000) derrière un proxy comme Railway.
 * Construire une redirection absolue à partir de là enverrait le navigateur
 * vers localhost. Un Location relatif est résolu par le navigateur sur
 * l'origine publique réelle, quel que soit l'hébergeur.
 */
export function redirect303(path: string): NextResponse {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}
