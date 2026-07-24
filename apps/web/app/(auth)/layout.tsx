import Link from "next/link";
import "./auth.css";

export default function AuthLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-page">
      <a className="skip-link" href="#auth-content">Saltar para o formulário</a>
      <section className="auth-card" id="auth-content">
        <Link className="auth-brand" href="/">
          <span aria-hidden="true">A</span>
          <strong>Apostolic IA</strong>
        </Link>
        {children}
      </section>
    </main>
  );
}
