import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

interface RouteErrorBoundaryProps {
  routeName: string;
  children: ReactNode;
}

/**
 * Wrapper de ErrorBoundary por rota.
 * Reset automático ao mudar de rota via key={pathname}.
 */
const RouteErrorBoundary = ({ routeName, children }: RouteErrorBoundaryProps) => {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname} routeName={routeName}>
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
