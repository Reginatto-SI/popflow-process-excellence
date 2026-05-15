import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderMarkdownPreview } from "@/lib/markdownPreview";

describe("renderMarkdownPreview", () => {
  it("renders basic markdown and media references without raw markers", () => {
    const onOpenMedia = vi.fn();

    render(
      <div>
        {renderMarkdownPreview(
          "**Texto em negrito**\n\n1. Primeiro item\n2. Segundo item\n\nVeja @midia1 antes.",
          [{ referencia: "midia1", tipo: "imagem" }],
          onOpenMedia,
        )}
      </div>,
    );

    expect(screen.getByText("Texto em negrito").tagName).toBe("STRONG");
    expect(screen.getByText("Primeiro item").closest("ol")).toBeInTheDocument();
    expect(screen.queryByText("**Texto em negrito**")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /@midia1/i }));
    expect(onOpenMedia).toHaveBeenCalledWith({
      referencia: "midia1",
      tipo: "imagem",
    });
  });

  it("preserves visual line breaks inside paragraphs", () => {
    const { container } = render(
      <div>{renderMarkdownPreview("Linha 1\nLinha 2")}</div>,
    );

    expect(container.querySelector("br")).toBeInTheDocument();
    expect(screen.getByText(/Linha 1/)).toHaveTextContent("Linha 1Linha 2");
  });

  it("renders safe long links in a new tab", () => {
    const url =
      "https://www.sefaz.mt.gov.br/acesso/pages/login/login.xhtml?param=1&outro=abc-def_ghi#topo";

    render(<div>{renderMarkdownPreview(`[Sefaz MT](${url})`)}</div>);

    const link = screen.getByRole("link", { name: "Sefaz MT" });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("does not render unsafe html or javascript links as DOM/html", () => {
    render(
      <div>
        {renderMarkdownPreview(
          "<img src=x onerror=alert(1)> [Ataque](javascript:alert(1))",
        )}
      </div>,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ataque" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/<img src=x onerror=alert\(1\)>/),
    ).toBeInTheDocument();
  });
});
