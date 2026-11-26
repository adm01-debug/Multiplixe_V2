import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Package, Crown, Laptop, Heart, LayoutGrid } from "lucide-react";
import type { Categoria } from '@/types';

interface CategoryFilterProps {
  categories: Categoria[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Users,
  Package,
  Crown,
  Laptop,
  Heart,
};

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        Todos
      </Button>
      
      {categories.map((category) => {
        const IconComponent = category.icon ? iconMap[category.icon] : LayoutGrid;
        const isActive = selectedCategory === category.slug;
        
        return (
          <Button
            key={category.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(category.slug)}
            className="gap-2"
            style={isActive ? { backgroundColor: category.color || undefined } : undefined}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {category.name}
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
