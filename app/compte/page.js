import AccountPage from "../../components/AccountPage";
import { SITE } from "../../lib/site";

export const metadata = { title: `Mon compte - ${SITE.name}` };

export default function ComptePage() {
  return (
    <main className="narrow">
      <AccountPage />
    </main>
  );
}
