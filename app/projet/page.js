import ProjectDetail from "../../components/ProjectDetail";
import { SITE } from "../../lib/site";

export const metadata = { title: `Projet - ${SITE.name}` };

export default function ProjetPage() {
  return (
    <main className="narrow">
      <ProjectDetail />
    </main>
  );
}
