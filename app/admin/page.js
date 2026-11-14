import AdminPage from "../../components/AdminPage";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function Admin() {
  return (
    <main className="narrow admin">
      <AdminPage />
    </main>
  );
}
