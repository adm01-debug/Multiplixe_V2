import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotesPanel, { notesToMarkdown } from "@/components/notes/NotesPanel";
import type { Note } from "@/hooks/useNotes";

const { addNote, state } = vi.hoisted(() => ({
  addNote: vi.fn(),
  state: { notes: [] as Note[] },
}));

vi.mock("@/hooks/useNotes", () => ({
  useNotes: () => ({
    notes: state.notes,
    addNote,
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    isAdding: false,
    isUpdating: false,
  }),
}));

const note: Note = {
  id: "n1",
  user_id: "u1",
  lesson_id: "l1",
  course_id: "c1",
  content: "Revisar a proposta comercial",
  timestamp_seconds: 125,
  created_at: "2026-11-25T10:00:00.000Z",
  updated_at: "2026-11-25T10:00:00.000Z",
};

beforeEach(() => {
  state.notes = [];
  addNote.mockClear();
});

describe("notesToMarkdown (FUNC-003)", () => {
  it("monta a lista com o timestamp formatado de cada nota", () => {
    const md = notesToMarkdown([note, { ...note, id: "n2", content: "Segunda nota", timestamp_seconds: 65 }]);

    expect(md).toContain("**[2:05]** Revisar a proposta comercial");
    expect(md).toContain("**[1:05]** Segunda nota");
  });

  it("mantem a ordem das notas recebidas", () => {
    const md = notesToMarkdown([note, { ...note, id: "n2", content: "Depois", timestamp_seconds: 300 }]);
    const linhas = md.split("\n").filter((linha) => linha.startsWith("- "));

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toContain("Revisar a proposta comercial");
    expect(linhas[1]).toContain("Depois");
  });

  it("nao quebra com lista vazia", () => {
    expect(notesToMarkdown([])).toBe("# Minhas anotacoes\n\n");
  });
});

describe("NotesPanel (FUNC-003)", () => {
  it("salva a nota com o tempo real do video, e nao com zero", async () => {
    render(<NotesPanel lessonId="l1" courseId="c1" getCurrentTime={() => 125} />);
    fireEvent.click(screen.getByRole("button", { name: /notas/i }));
    const campo = await screen.findByPlaceholderText(/adicione uma nota/i);
    fireEvent.change(campo, { target: { value: "Anotar o preco" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar nota/i }));

    await waitFor(() => expect(addNote).toHaveBeenCalledTimes(1));
    expect(addNote).toHaveBeenCalledWith({ content: "Anotar o preco", timestampSeconds: 125 });
  });

  it("leva o video para o minuto da nota ao clicar no timestamp", async () => {
    state.notes = [note];
    const onSeekToTime = vi.fn();
    render(<NotesPanel lessonId="l1" courseId="c1" getCurrentTime={() => 0} onSeekToTime={onSeekToTime} />);
    fireEvent.click(screen.getByRole("button", { name: /notas/i }));

    fireEvent.click(await screen.findByRole("button", { name: /2:05/ }));
    expect(onSeekToTime).toHaveBeenCalledWith(125);
  });

  it("exporta as notas em markdown", async () => {
    state.notes = [note];
    const createObjectURL = vi.fn(() => "blob:notas");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { writable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: revokeObjectURL });
    Object.defineProperty(HTMLAnchorElement.prototype, "click", { writable: true, value: vi.fn() });

    render(<NotesPanel lessonId="l1" courseId="c1" getCurrentTime={() => 0} />);
    fireEvent.click(screen.getByRole("button", { name: /notas/i }));
    fireEvent.click(await screen.findByRole("button", { name: /exportar em markdown/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toContain("text/markdown");
    const texto = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(texto).toContain("**[2:05]** Revisar a proposta comercial");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:notas");
  });
});