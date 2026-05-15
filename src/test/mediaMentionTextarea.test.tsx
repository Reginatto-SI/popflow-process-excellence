import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { MediaMentionTextarea } from "@/components/MediaMentionTextarea";

const renderEditor = (initialValue: string) => {
  const Harness = () => {
    const [value, setValue] = useState(initialValue);
    return (
      <MediaMentionTextarea
        value={value}
        onChange={setValue}
        midias={[]}
        placeholder="Descrição da etapa"
      />
    );
  };

  render(<Harness />);
  return screen.getByPlaceholderText("Descrição da etapa") as HTMLTextAreaElement;
};

describe("MediaMentionTextarea link button", () => {
  it("converts a selected https URL into a Markdown link", async () => {
    const url = "https://www.sefaz.mt.gov.br/acesso/pages/login/login.xhtml";
    const textarea = renderEditor(url);

    textarea.focus();
    textarea.setSelectionRange(0, url.length);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    await waitFor(() =>
      expect(textarea).toHaveValue(`[${url}](${url})`),
    );
  });

  it("adds https:// when a selected URL does not include protocol", async () => {
    const url = "www.sefaz.mt.gov.br";
    const textarea = renderEditor(url);

    textarea.focus();
    textarea.setSelectionRange(0, url.length);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    await waitFor(() =>
      expect(textarea).toHaveValue(`[${url}](https://${url})`),
    );
  });

  it("uses an editable https placeholder for selected regular text", async () => {
    const label = "Acesse o site da Sefaz MT";
    const textarea = renderEditor(label);

    textarea.focus();
    textarea.setSelectionRange(0, label.length);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    await waitFor(() =>
      expect(textarea).toHaveValue(`[${label}](https://)`),
    );
  });

  it("inserts a fenced code block without changing existing media references", async () => {
    const textarea = renderEditor("Use @midia1");

    textarea.focus();
    textarea.setSelectionRange(4, 11);
    fireEvent.click(screen.getByRole("button", { name: "Bloco de código" }));

    await waitFor(() =>
      expect(textarea).toHaveValue("Use ```\n@midia1\n```"),
    );
  });

  it("keeps unsafe protocol selections on an editable placeholder href", async () => {
    const unsafeUrl = "javascript:alert(1)";
    const textarea = renderEditor(unsafeUrl);

    textarea.focus();
    textarea.setSelectionRange(0, unsafeUrl.length);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    await waitFor(() =>
      expect(textarea).toHaveValue(`[${unsafeUrl}](https://)`),
    );
  });
});
