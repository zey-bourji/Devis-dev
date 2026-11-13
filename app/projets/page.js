import ProjectsList from "../../components/ProjectsList";
import { SITE } from "../../lib/site";

export const metadata = { title: `Mes projets - ${SITE.name}` };

export default function ProjetsPage() {
  return (
    <main className="narrow">
      <ProjectsList />
    </main>
  );
}
