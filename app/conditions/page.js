import { SITE } from "../../lib/site";

export const metadata = { title: `Conditions d'utilisation - ${SITE.name}` };

export default function ConditionsPage() {
  return (
    <main className="narrow legal">
      <h1>Conditions d'utilisation</h1>
      <p className="muted">Dernière mise à jour : novembre 2026</p>

      <p>En utilisant {SITE.name}, tu acceptes les règles ci-dessous.</p>

      <h2>Ce que fait l'outil</h2>
      <p>
        {SITE.name} t'aide à calculer un devis et à le générer en PDF. Les jours, les prix et les fourchettes
        proposés par défaut sont des repères : ce sont des estimations, pas des tarifs officiels. Tu les
        adaptes à ton marché et à ton client.
      </p>

      <h2>Tes devis, ta responsabilité</h2>
      <p>
        Tu restes entièrement responsable du contenu de tes devis, des prix annoncés et de l'accord passé avec
        ton client. {SITE.name} n'est pas partie à cet accord et ne garantit pas qu'un devis convienne à ta
        situation fiscale ou légale.
      </p>

      <h2>Ton compte</h2>
      <p>
        Garde ton mot de passe pour toi. Tu es responsable de ce qui se passe avec ton compte. Tu peux arrêter
        d'utiliser l'outil et demander la suppression de ton compte à tout moment.
      </p>

      <h2>Un usage honnête</h2>
      <p>
        N'utilise pas l'outil pour tromper quelqu'un, produire de faux documents ou nuire au service. Nous
        pouvons suspendre un compte qui ne respecte pas ces règles.
      </p>

      <h2>Disponibilité</h2>
      <p>
        L'outil est fourni tel quel, sans garantie qu'il fonctionne sans interruption. Nous faisons de notre
        mieux, mais une panne ou une erreur peut arriver : pense à télécharger le PDF de tes devis importants.
      </p>

      <h2>Changements</h2>
      <p>Ces conditions peuvent évoluer. La date de mise à jour est indiquée en haut de la page.</p>

      <h2>Données personnelles</h2>
      <p>Voir la politique de confidentialité pour le détail de ce qui est conservé.</p>
    </main>
  );
}
