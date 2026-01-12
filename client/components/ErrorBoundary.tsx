import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-vitrii-text mb-4">
                Oops! Algo deu errado
              </h1>
              <p className="text-vitrii-text-secondary mb-6">
                {this.state.error?.message || "Erro desconhecido"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
