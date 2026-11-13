import ProjectsList from "../../components/ProjectsList";

export const metadata = { title: "Mes projets - Devis Dev" };

export default function ProjetsPage() {
  return (
    <main className="narrow">
      <ProjectsList />
    </main>
  );
}
