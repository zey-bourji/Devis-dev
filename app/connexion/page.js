import AuthForm from "../../components/AuthForm";
import { SITE } from "../../lib/site";

export const metadata = { title: `Connexion - ${SITE.name}` };

export default function ConnexionPage() {
  return (
    <main className="narrow">
      <AuthForm />
    </main>
  );
}
