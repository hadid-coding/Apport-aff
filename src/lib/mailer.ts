import nodemailer, { type Transporter } from "nodemailer";

export type MailResult = { sent: boolean; skipped?: boolean; error?: string };

/**
 * Construit un transport SMTP à partir des variables d'environnement.
 * Retourne null si le SMTP n'est pas configuré (l'app fonctionne alors en
 * mode « lien manuel » : le lien d'activation reste affiché à l'admin).
 *
 * Compatible avec tout fournisseur SMTP (Gmail, Brevo, Mailgun, Resend…) :
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   SMTP_SECURE = "true" pour le port 465 (SSL), sinon STARTTLS (587)
 *   MAIL_FROM   = adresse expéditeur affichée
 */
function buildTransport(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = Number(SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export function isMailConfigured(): boolean {
  return buildTransport() !== null;
}

function mailFrom(): string {
  return process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "no-reply@localhost";
}

/** Envoie l'email d'invitation contenant le lien d'activation du compte. */
export async function sendInvitationEmail(params: {
  to: string;
  name: string;
  activateUrl: string;
}): Promise<MailResult> {
  const transport = buildTransport();
  if (!transport) return { sent: false, skipped: true };

  const { to, name, activateUrl } = params;
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
      <h2 style="margin:0 0 8px">Bienvenue sur ApportAffaires</h2>
      <p>Bonjour ${escapeHtml(name)},</p>
      <p>Un compte a été créé pour vous afin de suivre vos CRA et les virements
         de votre apport d'affaires. Cliquez sur le bouton ci-dessous pour
         choisir votre mot de passe et activer votre compte :</p>
      <p style="margin:24px 0">
        <a href="${activateUrl}"
           style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">
          Activer mon compte
        </a>
      </p>
      <p style="font-size:13px;color:#475569">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
        <a href="${activateUrl}">${activateUrl}</a>
      </p>
    </div>`;

  const text = `Bonjour ${name},\n\nUn compte a été créé pour vous sur ApportAffaires.\nActivez-le en choisissant votre mot de passe ici :\n${activateUrl}\n`;

  try {
    await transport.sendMail({
      from: mailFrom(),
      to,
      subject: "Activez votre compte ApportAffaires",
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
