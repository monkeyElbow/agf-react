export default function PageShell({ title, source, children }) {
  const badgeText = source ? 'Mapped page' : 'React-managed page';
  const badgeClass = source ? ' is-mapped' : ' is-native';

  return (
    <section className="page-shell ag-panel-rail">
      <div className="page-shell-body">
        <div className="page-shell-header">
          <h1>{title}</h1>
          <span className={`page-shell-badge${badgeClass}`}>
            {badgeText}
          </span>
        </div>
        {source ? <p className="page-shell-source">Source: <code>{source}</code></p> : null}
        {children}
      </div>
    </section>
  );
}
