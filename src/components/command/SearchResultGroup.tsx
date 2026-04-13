import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { FuzzyHighlight } from '@/components/ui/FuzzyHighlight';
import { BookOpen, PlayCircle, Trophy, Search, GraduationCap, LayoutDashboard, User, BarChart3, Shield } from 'lucide-react';
import { FuseResultMatch } from 'fuse.js';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'course' | 'lesson' | 'achievement' | 'page';
  url: string;
  icon: string;
  courseSlug?: string;
  matches?: readonly FuseResultMatch[];
}

const getIcon = (type: string) => {
  switch (type) {
    case 'course': return <BookOpen className="h-4 w-4 text-primary" />;
    case 'lesson': return <PlayCircle className="h-4 w-4 text-accent" />;
    case 'achievement': return <Trophy className="h-4 w-4 text-amber-500" />;
    case 'dashboard': return <LayoutDashboard className="h-4 w-4 text-muted-foreground" />;
    case 'catalog': return <GraduationCap className="h-4 w-4 text-muted-foreground" />;
    case 'leaderboard': return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    case 'profile': return <User className="h-4 w-4 text-muted-foreground" />;
    case 'shield': return <Shield className="h-4 w-4 text-muted-foreground" />;
    default: return <Search className="h-4 w-4 text-muted-foreground" />;
  }
};

interface SearchResultGroupProps {
  heading: string;
  results: SearchResult[];
  fieldKey: string;
  onSelect: (url: string) => void;
  showSeparator?: boolean;
}

const SearchResultGroup = ({ heading, results, fieldKey, onSelect, showSeparator }: SearchResultGroupProps) => {
  if (results.length === 0) return null;

  return (
    <>
      {showSeparator && <CommandSeparator />}
      <CommandGroup heading={heading}>
        {results.map((result) => (
          <CommandItem key={result.id} value={result.title} onSelect={() => onSelect(result.url)} className="cursor-pointer">
            {getIcon(result.type)}
            <div className="ml-2 flex flex-col">
              <span>
                <FuzzyHighlight text={result.title} matches={result.matches} fieldKey={fieldKey === 'auto' ? (result.type === 'achievement' ? 'name' : 'title') : fieldKey} />
              </span>
              {result.description && (
                <span className="text-xs text-muted-foreground line-clamp-1">
                  <FuzzyHighlight text={result.description} matches={result.matches} fieldKey="description" />
                </span>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
};

interface QuickNavGroupProps {
  pages: SearchResult[];
  onSelect: (url: string) => void;
}

const QuickNavGroup = ({ pages, onSelect }: QuickNavGroupProps) => (
  <CommandGroup heading="Navegação Rápida">
    {pages.map((page) => (
      <CommandItem key={page.id} value={page.title} onSelect={() => onSelect(page.url)} className="cursor-pointer">
        {getIcon(page.icon)}
        <span className="ml-2">{page.title}</span>
      </CommandItem>
    ))}
  </CommandGroup>
);

export { SearchResultGroup, QuickNavGroup, getIcon };
export type { SearchResult };
