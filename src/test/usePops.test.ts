import { describe, expect, it } from "vitest";

import { dedupePopEtapas, normalizeEtapasInputOrder, type EtapaInput, type PopEtapaRow } from "@/hooks/usePops";

const baseStep: PopEtapaRow = {
  id: "step-1",
  pop_versao_id: "version-1",
  ordem: 1,
  titulo: "Consultando certificado",
  descricao: "Abra a tela e consulte o certificado @certificado",
  tempo_estimado: "5 min",
  pre_requisito: "Acesso ao sistema",
  resultado_esperado: "Certificado consultado",
  erro_comum: "Certificado vencido",
  checklist: [{ id: "check-1", texto: "Validar CNPJ" }],
};

describe("dedupePopEtapas", () => {
  it("mantém apenas a primeira etapa quando há duplicação lógica com IDs diferentes", () => {
    const duplicate = { ...baseStep, id: "step-2" };

    expect(dedupePopEtapas([baseStep, duplicate])).toEqual([baseStep]);
  });

  it("preserva etapas diferentes na mesma versão", () => {
    const nextStep = { ...baseStep, id: "step-2", ordem: 2 };

    expect(dedupePopEtapas([baseStep, nextStep])).toEqual([baseStep, nextStep]);
  });
});


describe("normalizeEtapasInputOrder", () => {
  it("reordena etapas pela posição do array para remover ordens duplicadas do payload", () => {
    const etapas: EtapaInput[] = [
      {
        ordem: 1,
        titulo: "Primeira",
        descricao: "Descrição 1",
        tempo_estimado: "5 min",
        pre_requisito: "",
        resultado_esperado: "Ok",
        erro_comum: "",
        checklist: [],
      },
      {
        ordem: 1,
        titulo: "Segunda",
        descricao: "Descrição 2",
        tempo_estimado: "5 min",
        pre_requisito: "",
        resultado_esperado: "Ok",
        erro_comum: "",
        checklist: [],
      },
    ];

    expect(normalizeEtapasInputOrder(etapas).map((etapa) => etapa.ordem)).toEqual([1, 2]);
  });
});
