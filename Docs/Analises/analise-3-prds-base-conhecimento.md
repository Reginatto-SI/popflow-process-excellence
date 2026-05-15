# Análise 3 — PRDs da Base de Conhecimento

## 1. Objetivo da análise

Documentar a criação dos PRDs da Base de Conhecimento do PopFlow e os ajustes incrementais realizados em PRDs relacionados, sem implementação de código, telas, rotas, banco de dados, migrations ou componentes.

## 2. Arquivos criados

### PRDs
- `Docs/PRD/PRD 13 — Base de Conhecimento e Artigos Internos.txt`
- `Docs/PRD/PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais.txt`

> Observação: os novos PRDs foram criados com extensão `.txt` para manter o padrão atual da pasta `Docs/PRD`, que já utiliza arquivos `.txt` para os PRDs numerados existentes.

## 3. Arquivos ajustados

- `Docs/PRD/PRD 7 — Sistema de Busca Inteligente (Base de Conhecimento).txt`
- `Docs/PRD/PRD 9 — Sistema de Comentários e Colaboração.txt`
- `Docs/PRD/PRD 11 — Sistema de Visibilidade e Compartilhamento de POPs.txt`
- `README.md`

## 4. Resumo das decisões de produto

### Base de Conhecimento e artigos internos

Foi documentado que a Base de Conhecimento é o espaço para conteúdos internos consultivos que não necessariamente são POPs executáveis, como:

- artigos internos;
- orientações;
- manuais;
- explicações técnicas;
- procedimentos auxiliares não executáveis;
- guias de apoio e referências internas.

A decisão principal é separar claramente artigo de conhecimento de POP:

- POP continua sendo o formato correto para processos executáveis passo a passo.
- Artigo de conhecimento é conteúdo consultivo, explicativo ou de apoio.

### Dúvidas, soluções de erro e anotações

Foi documentada uma camada operacional da Base de Conhecimento para capturar conhecimento do dia a dia antes que ele vire conteúdo oficial.

Foram diferenciados três tipos principais:

- dúvida frequente;
- solução de erro;
- anotação operacional.

Também foi registrado o caminho futuro de evolução:

- dúvida ou anotação pode virar artigo oficial após curadoria;
- solução recorrente pode virar POP quando representar rotina executável passo a passo.

### Busca inteligente

O PRD 7 foi ajustado para indexar e exibir novos tipos de conteúdo:

- POP;
- etapa;
- artigo;
- dúvida;
- solução de erro;
- anotação.

A busca deve respeitar visibilidade, empresa e permissões antes de exibir resultados.

### Comentários e colaboração

O PRD 9 foi ajustado para deixar claro que comentários são conversas contextuais dentro de POPs e etapas.

Comentários não são artigos oficiais nem substituem dúvidas ou soluções estruturadas da Base de Conhecimento.

Como expansão futura, comentários resolvidos podem ser promovidos, com curadoria, para:

- dúvida frequente;
- solução de erro;
- artigo de conhecimento.

### Visibilidade e compartilhamento

O PRD 11 foi ajustado apenas como referência conceitual para indicar que a lógica de visibilidade pode ser reaproveitada em conteúdos da Base de Conhecimento.

Foram reforçadas as regras:

- conteúdo privado só aparece para o autor;
- conteúdo compartilhado com a empresa aparece para usuários autorizados;
- departamento é evolução futura;
- conteúdo privado não aparece na busca global de outros usuários.

## 5. Pontos de atenção

1. Os PRDs 13 e 14 ainda são documentação de produto, não implementação técnica.
2. A extensão `.txt` foi mantida para preservar o padrão da pasta `Docs/PRD`.
3. Busca semântica com IA foi mantida fora do escopo atual e descrita apenas como expansão futura.
4. Departamento aparece como organização e filtro, mas restrição de acesso por departamento permanece como evolução futura.
5. Comentários não devem ser tratados como conteúdo oficial sem etapa explícita de promoção e curadoria.
6. A Base de Conhecimento deve respeitar as regras multi-tenant e de visibilidade já previstas conceitualmente no produto.

## 6. Próximos passos sugeridos

1. Validar os PRDs 13 e 14 com usuários e stakeholders do PopFlow.
2. Decidir se haverá protótipos HTML específicos para Base de Conhecimento.
3. Definir posteriormente modelo técnico, tabelas e políticas de acesso, quando a implementação for priorizada.
4. Especificar fluxo de revisão simplificado para artigos publicados.
5. Avaliar como a busca atual poderá indexar conteúdos de conhecimento sem adicionar busca semântica no MVP.
6. Planejar critérios de promoção de comentário, anotação ou dúvida para artigo oficial.

## 7. Confirmação de escopo

Nenhuma implementação de código foi feita.

Não foram criadas ou alteradas:

- telas;
- componentes React;
- rotas;
- migrations;
- banco de dados real;
- lógica de aplicação;
- integrações;
- serviços.

A tarefa ficou restrita a documentação de produto e análise dentro de `Docs` e `README.md`.

## 8. Refinamento posterior — menu único e simplicidade do MVP

Após revisão, a documentação foi refinada para explicitar a decisão de produto de que a Base de Conhecimento deve aparecer preferencialmente como um único menu lateral chamado “Base de Conhecimento”.

Decisões reforçadas:

- Não criar menus laterais separados para Artigos, Dúvidas, Soluções de erro e Anotações no MVP.
- Organizar os tipos de conteúdo dentro da mesma área por abas, filtros, cards ou badges visuais.
- Permitir organização interna conceitual por Todos, Artigos, Dúvidas, Soluções de erro, Anotações e POPs relacionados ou conteúdos vinculados.
- Manter separação conceitual: POP é processo executável; artigo é conteúdo consultivo; dúvida é pergunta/resposta; solução de erro é problema, causa e solução; anotação é registro rápido privado ou compartilhado.
- Priorizar MVP simples com cadastro, listagem, busca, filtros, status, tags, visibilidade e vínculo opcional com POP/etapa.
- Evitar no MVP workflow complexo, menus múltiplos, permissões granulares avançadas, IA, transformação automática, anexos obrigatórios e automações.

Este refinamento continuou restrito à documentação. Nenhum código, tela, rota, banco, migration, componente ou lógica de aplicação foi alterado.
