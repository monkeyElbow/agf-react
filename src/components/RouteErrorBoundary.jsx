import { Component } from 'react';

function describeRouteError(error) {
  return error?.message || 'The page could not finish loading.';
}

export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('Route failed to render', error, errorInfo);
    }
  }

  retry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const isDevelopment = import.meta.env.DEV;

    return (
      <main className="route-load-failure" role="alert">
        <div className="route-load-failure-card">
          <p className="route-load-failure-eyebrow">Page could not load</p>
          <h1>Refresh needed to open this page.</h1>
          <p>
            {isDevelopment
              ? 'The page code or a dev-server module was unavailable. Your saved content was not changed.'
              : 'We couldn’t load this page. Please try again or return home.'}
          </p>
          {isDevelopment ? (
            <p className="route-load-failure-detail">{describeRouteError(this.state.error)}</p>
          ) : null}
          <button type="button" onClick={this.retry}>Refresh page</button>
          {!isDevelopment ? <a href="/">Return home</a> : null}
        </div>
      </main>
    );
  }
}
