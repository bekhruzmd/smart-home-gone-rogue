import { Component } from 'react';

// Safety net for unexpected rendering bugs: instead of a blank white page, show what
// happened and a way to recover. (Error boundaries must be class components in React.)
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unexpected UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="screen-message">
        <div className="screen-card" role="alert">
          <h1>Something went wrong</h1>
          <p className="field-error">{this.state.error.message}</p>
          <p className="muted small">Your saved data is safe in the database. Reloading usually fixes this.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload the app
          </button>
        </div>
      </main>
    );
  }
}
