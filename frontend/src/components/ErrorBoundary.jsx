import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
          <p className="text-4xl font-bold text-primary-500">Oops</p>
          <p className="mt-3 text-gray-500">Something went wrong loading this page.</p>
          <p className="mt-1 text-xs text-gray-400">{this.state.error?.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-primary-500 hover:bg-gray-50"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
