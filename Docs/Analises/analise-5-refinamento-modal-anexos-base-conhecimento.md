# Análise 5 — Refinamento do modal e anexos da Base de Conhecimento

## Arquivos lidos

- `Docs/PRD/PRD 13 — Base de Conhecimento e Artigos Internos.txt`
- `Docs/PRD/PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais.txt`
- `Docs/PRD/PRD 12 — Sistema de Mídia Inline Multimodal (Texto + Imagem + Áudio + Vídeo).txt`
- `Docs/Analises/analise-4-implementacao-base-conhecimento.md`
- `src/pages/BaseConhecimento.tsx`
- `src/hooks/useBaseConhecimento.ts`
- `src/pages/PopCreateEdit.tsx`
- `src/components/MediaViewer.tsx`
- `src/components/ui/tabs.tsx`
- `supabase/migrations/20260515120000_create_base_conhecimento.sql`
- `supabase/migrations/20260502212208_7c99aa91-b62f-449e-b682-dac214a68839.sql`
- `src/integrations/supabase/types.ts`

## Arquivos alterados

- `src/pages/BaseConhecimento.tsx`
- `src/hooks/useBaseConhecimento.ts`
- `src/integrations/supabase/types.ts`

## Arquivos criados

- `supabase/migrations/20260515133000_create_base_conhecimento_anexos.sql`
- `Docs/Analises/analise-5-refinamento-modal-anexos-base-conhecimento.md`

## Diagnóstico

### Sintoma

O modal de criação/edição da rota `/base-conhecimento` concentrava metadados, conteúdo, campos específicos por tipo e vínculo em uma única área rolável. Isso deixava o cadastro longo e pouco organizado, especialmente para soluções de erro.

### Onde ocorre

- `src/pages/BaseConhecimento.tsx`, no componente local `FormFields`.
- `src/hooks/useBaseConhecimento.ts`, que ainda não possuía consulta/mutações para anexos.
- Banco Supabase, que tinha apenas a tabela `base_conhecimento`, sem estrutura própria para anexos.

### Evidência

- O formulário antigo usava um grid único com `max-h-[70vh]` e todos os campos eram renderizados sequencialmente.
- A análise anterior registrava upload de anexos/mídia como fora do escopo.
- O projeto já possuía padrão de bucket `pop-midias`, upload em `PopCreateEdit` e visualização em `MediaViewer`, então não havia necessidade de inventar um fluxo de storage/base64.

### Causa provável

O MVP priorizou criar a rota funcional e deixou o refinamento de experiência e anexos para evolução posterior. Como o PRD 12 trata mídia inline para POPs, mas esta tarefa pediu anexos vinculados ao conteúdo sem inline, a solução correta foi reutilizar o padrão de storage existente sem implementar editor multimodal dentro do texto.

## Correção mínima aplicada

### Reorganização do modal

O modal continuou sendo um `Dialog` na própria rota `/base-conhecimento`, sem criar página separada e sem alterar `AppLayout`.

Foram criadas quatro abas internas usando o componente existente `Tabs`:

1. **Geral**
   - Título
   - Tipo
   - Status
   - Visibilidade
   - Responsável
   - Categoria
   - Departamento
   - Tags

2. **Conteúdo**
   - Campos dinâmicos por tipo:
     - Artigo: descrição/resumo e conteúdo principal.
     - Dúvida: pergunta, resposta e observações.
     - Solução de erro: sistema relacionado, erro relacionado, causa, solução e observações.
     - Anotação: conteúdo da anotação e observações.
   - A regra de status compatível por tipo foi preservada.

3. **Anexos**
   - Estado vazio.
   - Estado de loading.
   - Estado de erro.
   - Botão `Adicionar anexo` apenas para quem pode editar.
   - Lista compacta com ícone, nome do arquivo, tipo e tamanho.
   - Ações de abrir, baixar e remover.
   - Sem miniaturas grandes.

4. **Vínculos**
   - POP relacionado.
   - Etapa relacionada permaneceu fora da UI nesta etapa, porque selecionar etapa com segurança exigiria carregar a versão correta do POP e aumentaria o escopo. O campo `etapa_id` segue preservado no contrato para evolução futura.

## Implementação de anexos

### Estrutura de banco

Foi criada a migration complementar `20260515133000_create_base_conhecimento_anexos.sql`, sem editar a migration já aplicada da Base de Conhecimento.

Tabela criada: `public.base_conhecimento_anexos`.

Campos principais:

- `id`
- `empresa_id`
- `base_conhecimento_id`
- `nome_arquivo`
- `tipo_arquivo`
- `mime_type`
- `tamanho`
- `storage_path`
- `url`
- `criado_por`
- `created_at`

Índices:

- Por conteúdo e criação: `base_conhecimento_id, created_at DESC`.
- Por empresa: `empresa_id`.

### Storage utilizado

Foi reutilizado o bucket existente `pop-midias`, porque o projeto já tinha padrão implementado para uploads/mídias e policy por primeiro segmento do path.

Path adotado:

```text
{empresa_id}/base-conhecimento/{base_conhecimento_id}/{uuid-nome-arquivo}
```

Esse path mantém `empresa_id` como primeiro segmento para continuar compatível com as policies já existentes de `storage.objects`, que validam `(storage.foldername(name))[1] = public.current_empresa_id()::text`.

Não foi criado bucket novo e não foi usado armazenamento base64.

### Hooks e frontend

Em `useBaseConhecimento` foram adicionados:

- Tipo `KnowledgeAttachment`.
- Inclusão de `anexos` na consulta principal da Base de Conhecimento.
- `useKnowledgeAttachments` para listar anexos do conteúdo em edição.
- `useUploadKnowledgeAttachment` para enviar arquivo ao storage e gravar metadados.
- `useDeleteKnowledgeAttachment` para remover metadados e arquivo do storage.

A aba de anexos aceita no MVP:

- Imagens.
- PDF.
- TXT.
- DOC/DOCX.
- XLS/XLSX.

Também foi aplicado limite visual de 25 MB no cliente para evitar uploads acidentais muito grandes no modal.

## Permissões

### Banco/RLS

A tabela `base_conhecimento_anexos` tem RLS habilitado.

Policies criadas:

- **SELECT**: exige mesma empresa e replica a lógica de acesso do conteúdo pai, incluindo autor, visibilidade `empresa`, status publicados/resolvidos e exceções para responsável/perfis de gestão em rascunho/revisão/arquivado.
- **INSERT**: exige mesma empresa, `criado_por = auth.uid()`, conteúdo pai da mesma empresa e usuário autor do conteúdo ou perfil de gestão/criação via helper existente `public.current_user_can_manage_pops()`.
- **DELETE**: permite autor do anexo, autor do conteúdo ou perfis de gestão/criação.

### UI

A aba Anexos aparece dentro do modal de criação/edição, mas as ações de adicionar/remover só aparecem quando o usuário é:

- autor do conteúdo; ou
- `admin`; ou
- `gestor`; ou
- `criador`; ou
- `developer`.

A autorização real permanece protegida por RLS no banco.

## Indicador na listagem

A listagem principal ganhou um indicador discreto com ícone de clipe e quantidade de anexos quando o conteúdo possui anexos. Não há miniaturas na listagem.

## Visualização

- Na aba Anexos, imagens e PDFs reutilizam o `MediaViewer` já existente.
- Outros formatos abrem em nova aba/download externo.
- No modal de leitura, anexos aparecem como botões compactos/linkados, sem pré-visualização pesada.

## Fora do escopo mantido

Não foram implementados:

- Editor rich text avançado.
- Mídia/anexos inline dentro do texto.
- Comentários.
- Versionamento de artigo.
- OCR.
- IA.
- Busca no conteúdo dos anexos.
- Transcrição de áudio.
- Pré-visualização pesada de DOC/DOCX/XLS/XLSX.
- Upload obrigatório.
- Nova página separada.
- Novo bucket de storage.
- Seleção de etapa específica na UI.

## Limitações encontradas

- O bucket `pop-midias` é público no MVP, conforme migration existente. A solução reutiliza esse padrão para evitar arquitetura paralela, mas recomenda-se evoluir para bucket privado e signed URLs quando houver dados sensíveis.
- A remoção do arquivo no storage depende das policies existentes do bucket. A tabela de metadados já restringe a ação por RLS, mas uma evolução futura pode criar policies de storage mais específicas para anexos da Base de Conhecimento.
- A criação de anexos exige que o conteúdo já tenha `id`; por isso, ao criar um conteúdo, o modal permanece aberto em modo edição para permitir anexar arquivos logo após salvar.
- A seleção de etapa relacionada foi documentada como fora do escopo por segurança/complexidade.

## Testes realizados

- `git diff --check`: executado com sucesso, sem problemas de whitespace.
- `npm run lint`: falhou por limitação do ambiente; o pacote `@eslint/js` não está instalado localmente.
- `npm install`: falhou com `403 Forbidden` ao buscar `@supabase/supabase-js` no registry configurado, impedindo instalar dependências faltantes.
- `tsc -p tsconfig.app.json --noEmit`: falhou por limitação do ambiente; falta o type definition `vitest/globals`.
- `npm run build`: falhou por limitação do ambiente; o binário `vite` não está instalado localmente.

## Próximos passos recomendados

1. Aplicar a nova migration Supabase.
2. Regenerar `src/integrations/supabase/types.ts` pelo fluxo oficial do projeto após aplicar migration.
3. Rodar `npm install` em ambiente com acesso ao registry permitido.
4. Rodar `npm run lint`, `tsc -p tsconfig.app.json --noEmit` e `npm run build` após instalar dependências.
5. Validar manualmente `/base-conhecimento` com usuários autor, colaborador e gestor.
6. Validar anexos privados e de empresa entre usuários da mesma empresa.
7. Considerar bucket privado + signed URLs em evolução futura.
8. Implementar seleção segura de etapa relacionada quando houver fluxo consolidado para carregar etapas da versão correta do POP.

## Refinamento pós-review — segurança e robustez

### Bucket público confirmado

A migration existente `20260502212208_7c99aa91-b62f-449e-b682-dac214a68839.sql` cria o bucket `pop-midias` com `public = true`. Portanto, os anexos da Base de Conhecimento gravados nesse bucket recebem URL pública via `getPublicUrl`.

Decisão para o MVP:

- O bucket atual foi mantido para não quebrar POPs e mídias já existentes.
- A implementação não cria bucket privado nem altera policies de `pop-midias` nesta etapa.
- A UI agora exibe orientação discreta: “Evite anexar documentos sensíveis nesta versão. Os anexos usam o bucket atual de mídia do sistema.”

Risco operacional:

- Mesmo com RLS protegendo os metadados em `base_conhecimento_anexos`, um arquivo já enviado ao bucket público pode ser acessado por quem possuir a URL pública.
- Isso é especialmente sensível para conteúdos com `visibilidade = privado`, pois a privacidade do registro no banco não transforma a URL pública em URL protegida.

Recomendação futura:

- Migrar anexos da Base de Conhecimento para bucket privado.
- Substituir `getPublicUrl` por signed URLs com expiração curta.
- Avaliar migração gradual para não quebrar mídias legadas de POPs que dependem de `pop-midias` público.

### Remoção de anexos refinada

O fluxo de remoção foi ajustado para reduzir risco de arquivo órfão público:

1. Tenta remover primeiro o arquivo do storage.
2. Se o storage falhar, a operação aborta e retorna mensagem clara.
3. Só depois remove o registro de metadados em `base_conhecimento_anexos`.

Limitação remanescente:

- Se o storage remover com sucesso e a remoção do metadado falhar por RLS/rede, pode restar um registro apontando para arquivo inexistente. Esse cenário é menos crítico do que deixar um arquivo público órfão, mas deve ser tratado futuramente com rotina administrativa de reconciliação.

### Fluxo após criar conteúdo validado

No código atual, ao criar conteúdo novo:

- O modal permanece aberto.
- O estado `editing` passa a receber o `id` retornado pela criação.
- `useKnowledgeAttachments(editing?.id)` passa a carregar a lista daquele conteúdo.
- Como o autor é o usuário logado, `canEditCurrentContent` habilita o botão `Adicionar anexo`.
- Antes de salvar, a aba exibe: “Salve o conteúdo para habilitar anexos. Após salvar, esta aba ficará disponível para upload de arquivos.”

### Validação de tipo e tamanho

Frontend:

- Aceita imagens por `image/*`.
- Aceita PDF por MIME `application/pdf` ou extensão `.pdf`.
- Aceita TXT por MIME `text/*` ou extensão `.txt`.
- Aceita DOC/DOCX por extensão.
- Aceita XLS/XLSX por extensão.
- Bloqueia arquivos acima de 25 MB antes de chamar o upload.

Banco:

- A constraint `base_conhecimento_anexos_tamanho_check` foi refinada para impedir metadados com `tamanho` acima de `26214400` bytes quando o tamanho estiver informado.

### Validações repetidas após refinamento

- `git diff --check`: executado novamente com sucesso.
- `npm run lint`: continua bloqueado pela ausência local de `@eslint/js`.
- `tsc -p tsconfig.app.json --noEmit`: continua bloqueado pela ausência local de `vitest/globals`.
- `npm run build`: continua bloqueado pela ausência local do binário `vite`.


## Refinamento final — checklist de merge

- A exclusão de anexos foi conferida no hook `useDeleteKnowledgeAttachment`: o arquivo é removido primeiro do storage `pop-midias`; se essa etapa falhar, a operação lança erro e preserva o metadado em `base_conhecimento_anexos`; somente após sucesso no storage o registro da tabela é excluído.
- O limite de 25 MB está validado em duas camadas: no frontend antes do upload e na constraint `base_conhecimento_anexos_tamanho_check`, com regra `0 <= tamanho <= 26214400` quando `tamanho` estiver informado.
- A mensagem discreta da aba Anexos foi ajustada para orientar o usuário sem criar alerta grande: “Evite anexar documentos sensíveis nesta versão. Os anexos usam o bucket atual de mídia do sistema.”
- O bucket `pop-midias` permanece público no MVP para não quebrar POPs e mídias existentes; a recomendação futura segue sendo bucket privado específico para anexos + signed URLs.

### Validações finais executadas

- `git diff --check`: executado com sucesso após o refinamento final.
- `npm run lint`: continua bloqueado pela ausência local de `@eslint/js`.
- `tsc -p tsconfig.app.json --noEmit`: continua bloqueado pela ausência local de `vitest/globals`.
- `npm run build`: continua bloqueado pela ausência local do binário `vite`.
