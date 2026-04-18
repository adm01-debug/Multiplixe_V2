import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotes, Note } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PenLine,
  Plus,
  Clock,
  Trash2,
  Edit3,
  Save,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface NotesPanelProps {
  lessonId: string;
  courseId: string;
  currentTime?: number;
  onSeekToTime?: (seconds: number) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const NotesPanel = ({ lessonId, courseId, currentTime = 0, onSeekToTime }: NotesPanelProps) => {
  const { notes, addNote, updateNote, deleteNote, isAdding, isUpdating } = useNotes(lessonId, courseId);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote({ content: newNote.trim(), timestampSeconds: Math.floor(currentTime) });
      setNewNote("");
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      updateNote({ id: editingId, content: editContent.trim() });
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
        >
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">Notas</span>
          {notes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {notes.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Minhas Anotações
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Add new note */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tempo atual: {formatTime(currentTime)}</span>
            </div>
            <Textarea
              placeholder="Adicione uma nota sobre este momento da aula..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isAdding}
              className="w-full gap-2"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Salvar Nota
            </Button>
          </div>

          {/* Notes list */}
          <ScrollArea className="h-[calc(100vh-300px)]">
            <AnimatePresence mode="popLayout">
              {notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <EmptyState type="notes" />
                </motion.div>
              ) : (
                <div className="space-y-3 pr-4">
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="group p-3 rounded-xl bg-muted/50 border border-border/50"
                    >
                      {editingId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={isUpdating}
                              className="flex-1 gap-1"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onSeekToTime?.(note.timestamp_seconds)}
                            className="text-xs text-primary font-mono mb-2 hover:underline flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {formatTime(note.timestamp_seconds)}
                          </button>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(note)}
                              className="h-7 px-2"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNote(note.id)}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotesPanel;
