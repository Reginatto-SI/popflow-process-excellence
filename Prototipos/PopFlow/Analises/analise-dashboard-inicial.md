# Análise — Dashboard inicial do POPFlow

## 1. Arquivos alterados

- `src/pages/Index.tsx`
  - Personalização do título de boas-vindas com o primeiro nome do usuário logado.
  - Substituição do texto institucional do hero.
  - Conexão do card “POPs cadastrados” ao hook existente de POPs.
  - Organização dos demais indicadores em uma lista de placeholders comentada no código.
  - Pequeno ajuste de espaçamento e largura de leitura do hero.
- `Prototipos/PopFlow/Analises/analise-dashboard-inicial.md`
  - Registro técnico desta alteração e checklist de validação manual.

## 2. Como o nome do usuário está sendo obtido

O dashboard reutiliza o fluxo já existente no front para obter dados do usuário:

1. `useAuth()` fornece o `user` autenticado do Supabase Auth.
2. Com `user.id`, é feita a consulta na tabela `usuarios`, usando a mesma `queryKey` (`["perfil", user?.id]`) e a mesma origem de dados já usada pelo `AppHeader`.
3. O campo reutilizado é `usuarios.nome`.
4. A tela extrai apenas o primeiro nome para montar o título:
   - com nome disponível: `Bem-vindo, João`;
   - sem nome disponível: `Bem-vindo ao POPFlow`.

A consulta só é habilitada quando existe `user.id`, evitando erro durante carregamento ou ausência de sessão.

## 3. Como a contagem real de POPs está sendo obtida

A contagem do card “POPs cadastrados” usa o hook existente `usePops()`, que já é a fonte usada pela listagem de POPs e pelo componente de POPs recentes do dashboard.

Esse hook consulta a tabela `pops` com:

- filtro `arquivado = false`;
- ordenação por `updated_at` decrescente;
- relacionamento com a versão ativa do POP.

Como a mesma consulta já é usada na listagem, a contagem respeita o mesmo contexto aplicado pelo projeto, incluindo políticas de acesso/RLS e filtros de visibilidade que estejam ativos no Supabase. O valor exibido é `pops.length`.

Se a consulta falhar, o card exibe `—` como fallback visual seguro, sem quebrar o dashboard.

## 4. Cards ainda mockados

Os seguintes cards permanecem como placeholders temporários:

- “Execuções em andamento” — valor atual: `12`.
- “Aguardando revisão” — valor atual: `7`.
- “Taxa de conclusão” — valor atual: `86%`.

Foi mantido um comentário no código indicando que esses indicadores ainda são temporários até existirem fontes reais para esses dados.

## 5. Riscos ou pendências para próxima etapa

- A consulta do perfil no dashboard reaproveita a mesma origem já usada no cabeçalho, mas ainda existe lógica similar em mais de um ponto. Em uma próxima etapa, pode ser útil centralizar esse perfil em um hook compartilhado, se esse padrão for adotado no projeto.
- A contagem de POPs usa a lista completa retornada por `usePops()`. Para bases maiores, pode ser avaliada futuramente uma consulta otimizada com `count`, desde que reutilize o padrão de contexto/RLS existente.
- Os cards de execuções, revisões e taxa de conclusão continuam mockados até que existam queries/hook oficiais para esses indicadores.
- A validação do nome depende de `usuarios.nome` estar preenchido para o usuário autenticado.

## 6. Checklist de validação manual

- [ ] Acessar a rota principal após login e confirmar que o dashboard carrega sem erro.
- [ ] Validar com um usuário que possua `usuarios.nome` preenchido e confirmar o título no formato `Bem-vindo, Nome`.
- [ ] Validar com um usuário sem `usuarios.nome` preenchido e confirmar o fallback `Bem-vindo ao POPFlow`.
- [ ] Confirmar que o texto institucional exibido é: `Centralize o conhecimento, organize suas anotações e compartilhe procedimentos com a equipe em um só lugar.`
- [ ] Comparar o número de “POPs cadastrados” com a quantidade de POPs não arquivados visíveis na listagem de POPs para o mesmo usuário/contexto.
- [ ] Confirmar que os cards “Execuções em andamento”, “Aguardando revisão” e “Taxa de conclusão” continuam aparecendo.
- [ ] Redimensionar a tela para conferir responsividade em desktop, tablet e mobile.
- [ ] Navegar para POPs, Execuções, Revisões e Configurações para confirmar que não houve alteração visual indevida nessas telas.
