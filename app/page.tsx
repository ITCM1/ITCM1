const modules = [
  ["01", "Executive overview", "Company status, priorities and approvals"],
  ["02", "AI workforce", "Specialist agents and delegated work"],
  ["03", "Opportunities", "Leads, prospects and market research"],
  ["04", "Projects", "Delivery plans, milestones and quality"],
  ["05", "Finance", "Invoices, expenses and margin reporting"],
  ["06", "Integrations", "Telegram, email and approved services"]
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand-mark">ITCM<span>✦</span></div>
        <div className="brand-subtitle">GLOBAL AI</div>
        <div className="nav-label">COMMAND</div>
        <a className="nav-item active" href="#overview">Overview</a>
        <a className="nav-item" href="#workforce">AI workforce</a>
        <a className="nav-item" href="#opportunities">Opportunities</a>
        <a className="nav-item" href="#projects">Projects</a>
        <a className="nav-item" href="#finance">Finance</a>
        <a className="nav-item" href="#integrations">Integrations</a>
        <div className="sidebar-bottom">
          <div className="owner-avatar">TB</div>
          <div><strong>Owner workspace</strong><small>Private command center</small></div>
        </div>
      </aside>

      <section className="workspace" id="overview">
        <header className="topbar">
          <div><span className="eyebrow">GLOBAL OPERATIONS</span><h1>Executive command center</h1></div>
          <div className="status-pill"><i /> Foundation initialized</div>
        </header>

        <section className="welcome-panel">
          <div>
            <span className="eyebrow gold">ITCM GLOBAL AI</span>
            <h2>Your business.<br />One command center.</h2>
            <p>A secure foundation for managing people, projects and operations through one executive workflow.</p>
          </div>
          <div className="orb" aria-hidden="true"><span>✦</span></div>
        </section>

        <section className="section-heading">
          <div><span className="eyebrow">PLATFORM MODULES</span><h2>Operational workspace</h2></div>
          <span className="muted">Foundation stage · 01</span>
        </section>

        <div className="module-grid">
          {modules.map(([number, title, description]) => (
            <article className="module-card" key={number}>
              <span className="module-number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="module-link">Configuration pending ↗</span>
            </article>
          ))}
        </div>

        <section className="notice" id="integrations">
          <div className="notice-icon">!</div>
          <div><strong>Integrations are not connected yet</strong><p>Telegram, AI provider and database credentials must be configured securely before live operations can run. No simulated activity or financial figures are displayed.</p></div>
        </section>

        <footer>ITCM GLOBAL AI <span>·</span> Secure by design <span>·</span> Initial foundation</footer>
      </section>
    </main>
  );
}
