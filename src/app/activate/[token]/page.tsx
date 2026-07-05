import { prisma } from "@/lib/db";

const ERRORS: Record<string, string> = {
  weak: "Le mot de passe doit contenir au moins 8 caractères.",
  mismatch: "Les deux mots de passe ne correspondent pas.",
  invalid: "Ce lien d'activation n'est plus valide.",
};

export default async function ActivatePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const user = await prisma.user.findUnique({
    where: { inviteToken: params.token },
  });

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Lien invalide</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ce lien d&apos;activation a déjà été utilisé ou n&apos;existe pas.
            Contactez votre administrateur.
          </p>
        </div>
      </main>
    );
  }

  const error = searchParams.error ? ERRORS[searchParams.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Bienvenue, {user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choisissez un mot de passe pour activer votre compte ({user.email}).
        </p>
        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <form action="/api/auth/activate" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="token" value={params.token} />
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Mot de passe (8 caractères min.)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Activer mon compte
          </button>
        </form>
      </div>
    </main>
  );
}
