import PageShell from './PageShell';

export default function BlankPage({ title, source }) {
  return (
    <PageShell title={title} source={source}>
      <div className="blank-state">
        <p>This page is intentionally blank for now.</p>
        <p className="blank-state-note">Next phase: block-by-block editable content and arrangement in admin.</p>
      </div>
    </PageShell>
  );
}
