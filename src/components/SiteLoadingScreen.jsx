export default function SiteLoadingScreen({ label = 'Loading AGFinancial...' } = {}) {
  return (
    <div className="site-loading-screen route-page-loading" role="status" aria-label={label}>
      <div className="site-loading-content">
        <div className="site-loading-rings" aria-hidden="true">
          <span className="site-loading-ring" />
          <span className="site-loading-ring" />
          <span className="site-loading-ring" />
          <span className="site-loading-center" />
        </div>
        <p>{label}</p>
      </div>
    </div>
  );
}
