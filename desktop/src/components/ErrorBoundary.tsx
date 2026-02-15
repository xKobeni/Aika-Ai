import { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorPage } from './ErrorPage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorPage
            code="error"
            message={this.state.error?.message || undefined}
            onAction={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          />
        )
      );
    }

    return this.props.children;
  }
}
