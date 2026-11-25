import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = ({ value, onChange, placeholder = "Buscar cursos, instrutores...", className = "" }: SearchInputProps) => {
  return (
    <Input aria-label={placeholder}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`transition-all duration-300 ${className}`}
    />
  );
};

export default SearchInput;
