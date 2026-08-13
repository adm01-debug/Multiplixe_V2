import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackRenderError } from '@/lib/telemetry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_RETRIES = 3;

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    trackRenderError(error, info.componentStack ?? undefined);
    if (this.props.routeName) {
      // Anexa contexto extra de rota
      void import('@/lib/telemetry').then(({ trackTelemetry }) => {
        void trackTelemetry({
          event: 'render_error',
          message: error.message,
          metadata: { routeName: this.props.routeName },
        });
      });
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const exhausted = this.state.retryCount >= MAX_RETRIES;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8" role="alert">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">
              {this.props.routeName ? `Erro em ${this.props.routeName}` : 'Algo deu errado'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {!exhausted && (
                <Button onClick={this.handleRetry} variant="default" className="gap-2">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Tentar novamente
                </Button>
              )}
              {exhausted && (
                <Button onClick={this.handleReload} variant="default" className="gap-2">
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  Recarregar página
                </Button>
              )}
              <Button onClick={() => window.location.assign('/dashboard')} variant="outline">
                Ir para o Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
