export default function PageShell({ title, source, children }) {
  const badgeText = source === null ? 'React-managed page' : source ? 'WP source mapped' : 'WP source missing';
  const badgeClass = source === null ? ' is-native' : source ? ' is-mapped' : '';

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
