export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card" aria-labelledby="offline-title">
        <span className="brand-mark" aria-hidden="true">A</span>
        <p className="eyebrow">Sem ligação</p>
        <h1 id="offline-title">Está offline</h1>
        <p>
          Esta página ainda não está disponível no dispositivo. Volte a tentar
          quando recuperar a ligação.
        </p>
        <a className="button button-primary" href="/">
          Tentar novamente
        </a>
      </section>
    </main>
  );
}
