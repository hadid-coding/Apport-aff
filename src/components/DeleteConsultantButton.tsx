"use client";

/** Bouton de suppression d'un consultant, avec confirmation navigateur. */
export function DeleteConsultantButton({
  consultantId,
  consultantName,
}: {
  consultantId: string;
  consultantName: string;
}) {
  return (
    <form
      action={`/api/admin/consultants/${consultantId}/delete`}
      method="post"
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer définitivement ${consultantName} ? Sa mission et tous ses CRA seront supprimés. Cette action est irréversible.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded border border-rose-200 px-2 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
        title="Supprimer ce consultant"
      >
        Supprimer
      </button>
    </form>
  );
}
