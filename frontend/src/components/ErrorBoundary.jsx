import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

/**
 * ErrorBoundary Component - Captura erros React e exibe fallback UI
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos
 * @param {string} props.fallbackTitle - Título customizado para erro
 * @param {boolean} props.showDetails - Se deve mostrar detalhes do erro
 * 
 * @example
 * return (
 *   <ErrorBoundary fallbackTitle="Erro no Dashboard">
 *     <PatientDashboard />
 *   </ErrorBoundary>
 * )
 * 
 * Integrates with:
 * - components/ui/* for consistent styling
 * - Used in App.jsx and critical components
 * - Logs errors for debugging
 * 
 * IA prompt: Adicionar integração com serviço de logging externo
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Hook: Send error to logging service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with logging service
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Algo deu errado', showDetails = false } = this.props;
      const { error, errorInfo, retryCount } = this.state;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {fallbackTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar ao início.
              </p>
              
              {showDetails && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Detalhes técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {error.toString()}
                      {errorInfo && errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {retryCount >= 3 ? 'Muitas tentativas' : 'Tentar novamente'}
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir ao início
                </Button>
              </div>
              
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Tentativas: {retryCount}/3
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;