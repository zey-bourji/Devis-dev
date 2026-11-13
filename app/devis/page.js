import QuoteEditor from "../../components/QuoteEditor";
import { SITE } from "../../lib/site";

export const metadata = { title: `Nouveau devis - ${SITE.name}` };

export default function DevisPage() {
  return <QuoteEditor />;
}
