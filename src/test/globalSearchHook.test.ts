import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const ilike = vi.fn();
const eq = vi.fn(() => ({ ilike }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => from(table) },
}));

const limit = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  ilike.mockReturnValue({ limit });
  limit.mockResolvedValue({ data: [] });
});

describe("useGlobalSearch", () => {
  it("não busca quando query tem menos de 2 chars", async () => {
    const { useGlobalSearch } = await import("@/hooks/useGlobalSearch");
    const { result } = renderHook(() => useGlobalSearch("a", 50));
    await new Promise((r) => setTimeout(r, 100));
    expect(from).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("dispara busca em 4 entidades após debounce", async () => {
    const { useGlobalSearch } = await import("@/hooks/useGlobalSearch");
    renderHook(() => useGlobalSearch("react", 50));
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("courses");
      expect(from).toHaveBeenCalledWith("playbooks");
      expect(from).toHaveBeenCalledWith("training_videos");
      expect(from).toHaveBeenCalledWith("learning_paths");
    });
  });

  it("agrupa resultados por tipo (course/playbook/video/path)", async () => {
    limit.mockImplementation(() => {
      // sequência: courses, playbooks, videos, paths
      const callIdx = limit.mock.calls.length;
      const fixtures = [
        { data: [{ id: "c1", title: "Curso", description: null, slug: "c" }] },
        { data: [{ id: "p1", title: "Play", summary: null, slug: "p" }] },
        { data: [{ id: "v1", title: "Vid", description: null }] },
        { data: [{ id: "t1", title: "Trilha", description: null, slug: "t" }] },
      ];
      return Promise.resolve(fixtures[(callIdx - 1) % 4]);
    });
    const { useGlobalSearch } = await import("@/hooks/useGlobalSearch");
    const { result } = renderHook(() => useGlobalSearch("teste", 50));
    await waitFor(() => expect(result.current.results.length).toBe(4));
    const types = result.current.results.map((r) => r.type).sort();
    expect(types).toEqual(["course", "path", "playbook", "video"]);
  });
});
