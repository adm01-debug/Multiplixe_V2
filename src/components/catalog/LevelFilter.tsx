import { Button } from "@/components/ui/button";

interface LevelFilterProps {
  selectedLevel: string | null;
  onSelectLevel: (level: string | null) => void;
}

const levels = [
  { value: "iniciante", label: "Iniciante", color: "text-green-600" },
  { value: "intermediario", label: "Intermediário", color: "text-yellow-600" },
  { value: "avancado", label: "Avançado", color: "text-red-600" },
];

const LevelFilter = ({ selectedLevel, onSelectLevel }: LevelFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedLevel === null ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onSelectLevel(null)}
      >
        Todos os níveis
      </Button>
      
      {levels.map((level) => (
        <Button
          key={level.value}
          variant={selectedLevel === level.value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onSelectLevel(level.value)}
          className={selectedLevel === level.value ? level.color : ""}
        >
          {level.label}
        </Button>
      ))}
    </div>
  );
};

export default LevelFilter;
