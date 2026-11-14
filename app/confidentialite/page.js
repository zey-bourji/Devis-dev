import { SITE } from "../../lib/site";

export const metadata = { title: `Confidentialité - ${SITE.name}` };

export default function ConfidentialitePage() {
  return (
    <main className="narrow legal">
      <h1>Politique de confidentialité</h1>
      <p className="muted">Dernière mise à jour : novembre 2026</p>

      <p>
        {SITE.name} est un outil qui aide les développeurs à préparer leurs devis en FCFA. Voici, simplement,
        ce que l'outil garde sur toi et pourquoi.
      </p>

      <h2>Sans compte</h2>
      <p>
        Tu peux créer un devis sans t'inscrire. Dans ce cas, tout reste dans ton navigateur (sur ton appareil).
        Rien n'est envoyé à nos serveurs. Si tu vides les données du navigateur, tout disparaît.
      </p>

      <h2>Avec un compte</h2>
      <p>Quand tu crées un compte, nous gardons :</p>
      <ul>
        <li>ton adresse e-mail et ton mot de passe (le mot de passe est chiffré, nous ne le voyons pas) ;</li>
        <li>ton prénom ou le nom de ta marque ;</li>
        <li>tes projets et tes devis : descriptions, cahiers des charges, noms et contacts de tes clients, prix, paramètres et logo.</li>
      </ul>

      <h2>Pourquoi</h2>
      <p>
        Uniquement pour te permettre de retrouver tes projets et tes devis sur tous tes appareils. Nous ne
        vendons pas tes données, nous ne les partageons pas avec des annonceurs, et nous n'envoyons pas de publicité.
      </p>

      <h2>L'assistant IA</h2>
      <p>
        Quand tu écris à l'assistant, ton message et l'état de ton devis (fonctionnalités, prix, cahier des
        charges, nom du client s'il est rempli) sont envoyés à un fournisseur d'intelligence artificielle
        (Google Gemini ou Groq) pour qu'il te réponde. Ne lui écris pas d'informations dont tu n'as pas besoin :
        mots de passe, informations bancaires ou données personnelles de tes clients. Le fournisseur peut
        garder ces échanges selon ses propres règles, qui peuvent, sur les offres gratuites, inclure
        l'amélioration de ses modèles.
      </p>
      <p>
        L'assistant ne répond qu'aux sujets de devis. Pour éviter les abus, les demandes refusées (hors sujet,
        inappropriées ou dangereuses) sont enregistrées avec un extrait du message, et l'accès peut être
        suspendu en cas d'abus répété.
      </p>

      <h2>Qui peut voir tes devis</h2>
      <p>
        Les autres utilisateurs ne les voient jamais : chaque devis est privé et lié à ton compte. Un devis n'est
        vu par ton client que si tu lui envoies toi-même le PDF ou le message. L'administrateur du service a,
        techniquement, accès à la base de données pour la maintenance, mais ne consulte pas tes devis
        sans raison.
      </p>

      <h2>Le suivi et les preuves de paiement</h2>
      <p>
        Tu peux marquer les paiements reçus et joindre une capture ou un reçu. Ces fichiers (images ou PDF)
        sont stockés dans un espace privé, rangé à ton nom, et ne sont ouverts que par toi avec un lien
        temporaire. Ils sont supprimés quand tu les retires ou quand ton compte est supprimé. Évite d'y joindre
        des informations bancaires inutiles.
      </p>

      <h2>Où sont stockées les données</h2>
      <p>
        Les comptes et les devis sont hébergés chez Supabase, notre prestataire de base de données. Le site
        lui-même est hébergé chez Systalink.
      </p>

      <h2>Les données de tes clients</h2>
      <p>
        Si tu saisis le nom ou le contact d'un client, c'est toi qui es responsable de ces informations.
        N'enregistre que ce qui est utile à ton devis.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux modifier ou supprimer tes projets et tes devis à tout moment depuis ton compte. Pour supprimer
        ton compte et toutes tes données, écris-nous et nous le ferons.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question sur tes données, écris-nous à l'adresse indiquée sur le site.</p>
    </main>
  );
}
