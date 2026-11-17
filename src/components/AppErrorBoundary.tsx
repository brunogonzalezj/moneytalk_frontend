import { Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
}

/** Shows a way out instead of a blank screen when a page fails to render or load. */
class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base-200 dark:bg-gray-900 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Algo no cargó bien</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Puede haber una versión nueva de MoneyTalk. Recarga para continuar; tus datos no se pierden.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
