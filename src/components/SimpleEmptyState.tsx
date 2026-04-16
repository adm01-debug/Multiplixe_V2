import { LucideIcon } from 'lucide-react';

interface SimpleEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

const SimpleEmptyState = ({ icon: Icon, title, description }: SimpleEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-full bg-muted mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
  </div>
);

export default SimpleEmptyState;
