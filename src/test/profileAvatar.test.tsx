import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileHeader from "@/components/profile/ProfileHeader";

vi.mock("@/hooks/useAvatarUpload", () => ({
  useAvatarUpload: () => ({
    uploadAvatar: vi.fn(),
    deleteAvatar: vi.fn(),
    isUploading: false,
    progress: 0,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseProps = {
  userName: "Ana Souza",
  userEmail: "ana@promobrindes.com",
  totalXP: 1234,
  levelIcon: "🚀",
  levelNumber: 3,
  memberSinceDate: "março de 2025",
};

describe("foto de perfil no cabecalho do perfil (UI-015)", () => {
  it("monta o upload de avatar com rotulo acessivel", () => {
    render(<ProfileHeader {...baseProps} avatarUrl={null} />);

    expect(
      screen.getByRole("button", { name: /alterar foto de perfil de ana souza/i }),
    ).toBeInTheDocument();
  });

  it("mostra a inicial quando ainda nao existe avatar", () => {
    render(<ProfileHeader {...baseProps} avatarUrl={null} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("mostra a imagem salva quando existe avatar", () => {
    render(
      <ProfileHeader
        {...baseProps}
        avatarUrl="https://cdn.exemplo.com/ana.png"
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://cdn.exemplo.com/ana.png");
    expect(img).toHaveAttribute("alt", "Ana Souza");
  });
});