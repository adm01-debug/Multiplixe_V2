import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, ShieldX } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showLoader?: boolean;
  showDenied?: boolean;
}

const PermissionGate = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showLoader = false,
  showDenied = false,
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading && showLoader) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (showDenied) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
          <ShieldX className="h-8 w-8" />
          <p className="text-sm">Sem permissão para acessar</p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
