# 📄 PRD 15 — Cofre de Acessos e Credenciais Operacionais

---

## 🧠 1. VISÃO

O Cofre de Acessos é um módulo interno do PopFlow para centralizar credenciais, acessos técnicos e dados sigilosos usados pela equipe de T.I., suporte técnico e administração interna.

O módulo deve funcionar como um KeePass operacional dentro do PopFlow, inspirado na organização objetiva por cliente, pasta e registro, sem prometer equivalência técnica ao KeePass enquanto a implementação de criptografia, permissões, logs e políticas de segurança não estiver concluída e validada.

O Cofre deve ser tratado como área sensível do sistema, separada da Base de Conhecimento comum, da busca global e da lógica simples de visibilidade aplicada a conteúdos operacionais.

---

## 🎯 2. OBJETIVO

- Registrar acessos sigilosos de forma estruturada e auditável.
- Organizar credenciais por empresa atendida, grupo/pasta e registro.
- Permitir pesquisa rápida dentro do próprio Cofre, apenas para usuários autorizados.
- Controlar permissões específicas para visualizar, criar, editar, revelar, copiar, baixar anexos e auditar acessos.
- Evitar exposição acidental de senhas em listagens, busca global, analytics, logs de erro ou conteúdos comuns.
- Preservar o isolamento multi-tenant por `empresa_id` definido no PRD 4.
- Apoiar equipes de T.I., suporte e administração interna na gestão segura de acessos de clientes/empresas atendidas.

---

## ❗ 3. PROBLEMA

Credenciais operacionais costumam ficar espalhadas em planilhas, mensagens, documentos externos, arquivos locais ou na memória de pessoas específicas.

Isso gera riscos como:

- perda de acessos importantes;
- duplicidade de senhas e registros;
- dificuldade para encontrar credenciais em atendimentos urgentes;
- compartilhamento inseguro por canais informais;
- ausência de auditoria sobre quem revelou ou copiou senha;
- mistura indevida entre documentação operacional e dados sigilosos;
- exposição acidental de credenciais em buscas, artigos, POPs ou anexos comuns.

O Cofre de Acessos resolve esse problema criando uma área própria para credenciais, com organização, permissões, logs e restrições de exposição.

---

## 🔑 4. CONCEITO PRINCIPAL

A estrutura conceitual principal do Cofre deve seguir a organização:

**Empresa/Cliente atendido → Grupo/Pasta de acesso → Registro de acesso**

Exemplos:

- COOPERAGRO MUTUM → E-mails / FTP / Domínio → financeiro@empresa.com.br
- COOPERAGRO MUTUM → Redes sem fio → Wi-Fi Escritório Administrativo
- COOPERAGRO MUTUM → Sistemas → Portal Contábil / ERP / Sistema Fiscal

### Diferença entre `empresa_id` e empresa atendida

O PopFlow já possui multiempresa/multi-tenant. Neste PRD, os conceitos não podem ser confundidos:

- `empresa_id`: empresa dona do ambiente PopFlow, usada para isolamento multi-tenant.
- Empresa atendida ou Cliente atendido: cliente, cooperativa, filial, parceiro ou empresa assessorada cujo acesso está armazenado no Cofre.

Exemplo:

A JM Assessoria usa o PopFlow internamente e presta serviço para COOPERAGRO, BOAFECOOP e COAFORTE. Todos os registros continuam vinculados ao `empresa_id` da JM Assessoria, mas cada credencial pode estar organizada por uma EmpresaAtendida diferente.

---

## 🧭 5. DIFERENÇA ENTRE COFRE DE ACESSOS, POP E BASE DE CONHECIMENTO

### Cofre de Acessos

- Guarda credenciais e dados sigilosos.
- Exige permissões próprias e logs sensíveis.
- Não aparece na busca global comum no MVP.
- Senhas ficam ocultas por padrão.
- Ações como revelar senha, copiar senha e baixar anexo devem ser auditadas.

### POP

- Descreve processo executável passo a passo.
- Pode orientar como configurar, acessar ou renovar um serviço.
- Não deve exibir senha diretamente.
- Pode ter vínculo opcional com um acesso do Cofre, sem revelar credenciais.

### Base de Conhecimento

- Explica como fazer, por que fazer ou como resolver um problema.
- Armazena artigos, dúvidas, soluções de erro e anotações operacionais.
- Não deve armazenar senha em texto aberto.
- Pode referenciar um acesso do Cofre quando necessário, sem exibir credencial diretamente.

Regra principal:

**A Base de Conhecimento explica como fazer. O Cofre de Acessos guarda as credenciais necessárias.**

Exemplo:

- Artigo: “Como configurar e-mail no Outlook”.
- Cofre: login e senha do e-mail.

---

## 👤 6. USUÁRIOS ENVOLVIDOS

### Administrador da empresa

- Define quem pode acessar o Cofre.
- Gerencia permissões sensíveis do módulo.
- Acompanha auditorias e registros críticos.

### Equipe de T.I.

- Cadastra e mantém acessos técnicos.
- Usa credenciais para suporte, manutenção e configuração.
- Valida acessos periodicamente.

### Suporte técnico

- Consulta acessos autorizados durante atendimentos.
- Pode copiar usuário/login, abrir URLs e, quando permitido, revelar ou copiar senha.
- Deve ser auditado em ações sensíveis.

### Administração interna

- Pode consultar licenças, contratos, certificados e acessos administrativos conforme permissão.
- Não deve receber permissão automática para revelar senhas apenas por acessar o módulo.

### Auditor/Gestor

- Consulta histórico, ações sensíveis e movimentações do Cofre.
- Verifica uso indevido, acessos críticos e registros desatualizados.

---

## 🗂️ 7. ESTRUTURA DE NAVEGAÇÃO

O menu do Cofre deve ser separado da Base de Conhecimento e visível apenas para usuários com permissão específica.

Estrutura sugerida:

- Menu lateral: “Cofre de Acessos”
- Coluna esquerda:
  - lista/árvore de empresas atendidas;
  - ao expandir uma empresa, mostrar seus grupos/pastas.
- Área principal:
  - busca interna no topo;
  - filtros rápidos;
  - lista/tabela de acessos do grupo selecionado;
  - ações de cadastro conforme permissão.

A rota direta do módulo deve validar permissão no frontend e no backend. Usuários sem permissão não devem ver o menu nem acessar a rota por URL.

---

## 🧱 8. ESTRUTURA DE DADOS SUGERIDA

Esta seção é uma especificação funcional. Não implica criação de migrations nesta tarefa.

### EmpresaAtendida

Representa o cliente/empresa assessorada cujo acesso será registrado.

Campos sugeridos:

- id
- empresa_id
- nome
- nome_fantasia
- cnpj
- grupo_empresarial
- status
- observacoes
- data_criacao
- data_atualizacao

Regras:

- Deve sempre pertencer a um `empresa_id`.
- Não substitui a entidade Empresa/Tenant do PopFlow.
- Pode representar cliente, filial, unidade, cooperativa, parceiro ou empresa assessorada.
- Status sugeridos: Ativa, Inativa.

---

### GrupoAcesso

Representa a pasta/categoria de organização dos acessos.

Campos sugeridos:

- id
- empresa_id
- empresa_atendida_id
- nome
- descricao
- icone
- ordem
- status
- data_criacao
- data_atualizacao

Exemplos de grupos:

- Sistemas
- Infra e Redes
- Internet
- E-mails / FTP / Domínio
- Usuários
- Licenças e contratos
- Certificado digital
- Redes sociais
- Redes sem fio
- Equipamentos
- Portais governamentais
- Bancos
- Outros

Regras:

- Um grupo deve pertencer a uma EmpresaAtendida.
- Grupos inativos não devem aparecer por padrão nas listas, mas podem ser consultados com filtro.
- A ordem pode ser usada para organizar a árvore lateral.

---

### AcessoOperacional

Representa o registro principal de acesso.

Campos sugeridos:

- id
- empresa_id
- empresa_atendida_id
- grupo_acesso_id
- titulo
- tipo
- url
- ip
- porta
- usuario
- email
- senha_criptografada
- observacoes_restritas
- observacoes_publicas
- tags
- responsavel_id
- status
- criticidade
- data_ultima_validacao
- data_criacao
- data_atualizacao
- criado_por
- atualizado_por

Tipos sugeridos:

- E-mail
- Site Web
- FTP
- Domínio
- Equipamento
- Roteador
- Antena
- Wi-Fi
- Sistema interno
- Portal governamental
- Banco
- Certificado digital
- Licença
- Rede social
- Outro

Status sugeridos:

- Ativo
- Inativo
- Substituído
- Revogado
- Pendente de validação

Criticidade sugerida:

- Baixa
- Média
- Alta
- Crítica

Regras:

- Senha deve ser armazenada somente em campo criptografado.
- Senha não deve ser indexada como texto comum.
- Observações restritas devem seguir proteção equivalente à do registro.
- Observações públicas podem ser usadas em busca interna, desde que não contenham credenciais.
- O status Inativo deve ser preferido em vez de exclusão definitiva.

---

### AnexoAcesso

Representa arquivos sensíveis relacionados ao acesso.

Campos sugeridos:

- id
- empresa_id
- acesso_operacional_id
- nome
- tipo
- url_arquivo
- tamanho
- criado_por
- data_criacao

Exemplos:

- certificado digital;
- arquivo de licença;
- documento de configuração;
- print de configuração;
- contrato de software.

Regras:

- Anexos sensíveis devem seguir as mesmas permissões do registro principal.
- Download de anexo deve gerar log.
- URLs de arquivo não devem ser públicas.
- Anexos não devem aparecer na busca global comum no MVP.

---

### LogAcessoOperacional

Representa logs e auditoria do módulo.

Campos sugeridos:

- id
- empresa_id
- acesso_operacional_id
- usuario_id
- acao
- data_hora
- ip_origem
- detalhes

Ações obrigatórias:

- criou registro;
- editou registro;
- visualizou registro;
- revelou senha;
- copiou senha;
- baixou anexo;
- alterou senha;
- inativou registro;
- excluiu registro;
- restaurou registro.

Regras:

- Revelar ou copiar senha deve sempre gerar log sensível.
- Logs nunca devem armazenar a senha revelada, copiada, anterior ou nova.
- Logs devem respeitar `empresa_id`.
- Histórico deve estar disponível apenas para usuários com permissão específica.

---

## 🧱 9. FUNCIONALIDADES DO MVP

O MVP do Cofre de Acessos deve contemplar:

- cadastrar empresas atendidas;
- criar grupos por empresa atendida;
- cadastrar acessos dentro dos grupos;
- editar dados do acesso conforme permissão;
- inativar acessos sem exclusão definitiva por padrão;
- pesquisar acessos rapidamente dentro do Cofre;
- filtrar por empresa atendida, grupo, tipo, status, criticidade, responsável e tags;
- ocultar senha por padrão;
- revelar senha somente com permissão específica;
- copiar senha somente com permissão específica;
- copiar usuário/login quando permitido;
- abrir URL do acesso quando preenchida;
- registrar log ao visualizar registro, revelar senha, copiar senha e baixar anexo;
- registrar log ao criar, editar, alterar senha, inativar, excluir ou restaurar registro;
- anexar arquivos sensíveis quando necessário;
- baixar anexos somente com permissão específica;
- restringir menu e rota apenas para usuários autorizados;
- impedir que dados do Cofre apareçam na busca global comum;
- respeitar `empresa_id` em todas as consultas e operações.

---

## 🔎 10. PESQUISA E FILTROS

O Cofre deve possuir busca própria, interna ao módulo, acessível apenas para usuários autorizados.

### Campos pesquisáveis

A busca interna pode pesquisar por:

- empresa atendida;
- CNPJ;
- grupo;
- título;
- tipo;
- usuário/login;
- e-mail;
- URL;
- IP;
- tags;
- observações públicas.

### Campos não pesquisáveis

A busca nunca deve pesquisar diretamente em:

- senha;
- senha criptografada;
- valor descriptografado da senha;
- tokens secretos;
- observações restritas quando contiverem dados sensíveis;
- anexos sensíveis no MVP.

### Filtros mínimos

- Empresa atendida
- Grupo
- Tipo
- Status
- Criticidade
- Responsável
- Tags

### Regras

- Resultado de busca deve respeitar `empresa_id`.
- Resultado deve respeitar permissões do usuário no Cofre.
- Senha nunca deve aparecer no preview do resultado.
- Observações públicas devem ser revisadas pela equipe para não armazenar senha indevidamente.

---

## 🖥️ 11. TELA PRINCIPAL SUGERIDA

A interface deve ser simples, compacta e objetiva, inspirada na organização do KeePass.

### Coluna esquerda

- Árvore/lista de empresas atendidas.
- Ao expandir uma empresa, exibir os grupos vinculados.
- Indicar quantidade de acessos por grupo quando viável.
- Permitir filtro por status da empresa atendida.

### Área principal

- Busca interna no topo.
- Filtros rápidos abaixo da busca.
- Botão “Novo acesso” apenas para usuários com permissão.
- Botões de gerenciar empresas atendidas e grupos apenas para usuários autorizados.
- Lista/tabela de acessos do contexto selecionado.

### Tabela sugerida

- Título
- Tipo
- Usuário/Login
- URL/IP
- Status
- Criticidade
- Última atualização
- Ações

A senha não deve aparecer diretamente na tabela, mesmo para usuários com permissão de revelar ou copiar senha.

---

## 🪟 12. MODAL/DRAWER DE DETALHES

Ao clicar em um acesso, o sistema deve abrir um modal ou drawer com abas.

Abas sugeridas:

- Geral
- Credenciais
- Anexos
- Histórico

### Aba Geral

- Empresa atendida
- Grupo
- Título
- Tipo
- URL/IP/porta
- Status
- Criticidade
- Responsável
- Tags
- Observações públicas
- Datas de criação, atualização e última validação

### Aba Credenciais

- Usuário/login
- E-mail
- Senha mascarada por padrão
- Observações restritas conforme permissão
- Botão “Copiar usuário/login”
- Botão “Abrir URL”
- Botão “Revelar senha” apenas com permissão específica
- Botão “Copiar senha” apenas com permissão específica

### Aba Anexos

- Lista de anexos sensíveis
- Tipo, tamanho, data e autor
- Botão de download apenas com permissão específica
- Download deve gerar log

### Aba Histórico

- Lista de ações auditadas
- Usuário
- Data/hora
- IP de origem quando disponível
- Tipo de ação
- Detalhes sem exposição de senha

---

## 🔐 13. PERMISSÕES

O Cofre deve respeitar o PRD 4, incluindo `empresa_id`, isolamento por empresa, roles e validação no frontend e backend.

Além das roles principais, o Cofre deve possuir permissões próprias.

Permissões sugeridas:

- Ver Cofre de Acessos
- Criar acesso
- Editar acesso
- Inativar acesso
- Excluir acesso
- Restaurar acesso
- Revelar senha
- Copiar senha
- Copiar usuário/login
- Baixar anexos
- Ver histórico
- Gerenciar grupos
- Gerenciar empresas atendidas
- Gerenciar permissões do cofre

Regra essencial:

**Ter acesso ao módulo não significa automaticamente poder revelar ou copiar senha.**

Exemplos:

- Um usuário pode consultar título, URL e usuário/login sem poder revelar senha.
- Um técnico pode copiar senha, mas não gerenciar permissões.
- Um gestor pode ver histórico, mas não necessariamente copiar senha.
- Um administrador pode gerenciar empresas atendidas e grupos, sem que isso implique acesso automático a todas as senhas se a política do módulo assim definir.

---

## 🛡️ 14. SEGURANÇA

Regras obrigatórias:

- Senhas devem ser armazenadas de forma criptografada.
- Senhas nunca devem aparecer em listagens.
- Senhas nunca devem aparecer na busca global.
- Senhas nunca devem aparecer em logs de erro.
- Senhas nunca devem ser enviadas para analytics.
- Senhas nunca devem ser indexadas como texto comum.
- Senhas devem ficar mascaradas por padrão em qualquer detalhe do registro.
- Toda ação sensível deve gerar log.
- Usuários sem permissão não devem ver o menu do Cofre.
- Usuários sem permissão não devem acessar a rota diretamente.
- Registros devem respeitar `empresa_id`.
- Registros devem poder ser inativados sem exclusão definitiva.
- Anexos sensíveis devem seguir as mesmas permissões do registro principal.
- Erros técnicos não devem retornar senha, token ou segredo em payload, console ou stack trace.
- Analytics e métricas devem registrar apenas eventos agregados ou metadados não sensíveis.
- Dados sensíveis não devem ser enviados para ferramentas externas sem decisão explícita de segurança e governança.

Observação:

Este PRD define requisitos de produto e negócio. A segurança efetiva depende de implementação correta de criptografia, controle de acesso, isolamento multi-tenant, logs, armazenamento de anexos e revisão técnica antes de produção.

---

## 📜 15. LOGS E AUDITORIA

O Cofre deve ter auditoria própria para ações comuns e sensíveis.

### Ações que devem gerar log

- criação de empresa atendida;
- edição de empresa atendida;
- inativação de empresa atendida;
- criação de grupo;
- edição de grupo;
- inativação de grupo;
- criação de acesso;
- visualização de acesso;
- edição de acesso;
- alteração de senha;
- revelação de senha;
- cópia de senha;
- download de anexo;
- inativação de acesso;
- exclusão de acesso;
- restauração de acesso.

### Regras de auditoria

- Revelar senha sempre gera log sensível.
- Copiar senha sempre gera log sensível.
- Baixar anexo sempre gera log sensível.
- Alterar senha deve gerar log sem registrar senha antiga ou nova.
- Logs devem registrar usuário, data/hora, ação, IP de origem quando disponível e detalhes mínimos.
- Logs não devem registrar a senha em texto puro.
- Logs devem ser consultáveis apenas por usuários com permissão de ver histórico.
- Logs devem respeitar isolamento por `empresa_id`.

---

## 📏 16. REGRAS DE NEGÓCIO

1. Todo registro do Cofre deve possuir `empresa_id`.
2. Toda EmpresaAtendida deve pertencer a um `empresa_id`.
3. Todo GrupoAcesso deve pertencer a uma EmpresaAtendida e ao mesmo `empresa_id`.
4. Todo AcessoOperacional deve pertencer a uma EmpresaAtendida, a um GrupoAcesso e ao mesmo `empresa_id`.
5. O sistema não deve permitir associação cruzada entre empresas atendidas, grupos ou acessos de `empresa_id` diferente.
6. Senha deve ser ocultada por padrão.
7. Listagens nunca exibem senha.
8. Busca interna nunca pesquisa dentro da senha.
9. Busca global comum não indexa registros do Cofre no MVP.
10. Revelar senha exige permissão específica.
11. Copiar senha exige permissão específica.
12. Baixar anexo exige permissão específica.
13. Revelar senha, copiar senha e baixar anexo sempre geram log.
14. Inativação deve ser preferida à exclusão definitiva.
15. Exclusão definitiva, se existir, deve ser restrita e auditada.
16. Anexos sensíveis seguem as permissões do registro principal.
17. Observações públicas não devem conter senhas, tokens ou segredos.
18. Observações restritas não devem aparecer em listagens ou previews comuns.
19. Usuários sem permissão não devem ver menu, rota, registros ou resultados internos do Cofre.
20. Permissões do Cofre devem ser validadas no frontend e no backend.

---

## 🌐 17. RELAÇÃO COM BUSCA GLOBAL

O Cofre de Acessos não deve aparecer na busca global comum do PopFlow no MVP.

Motivo:

- evitar exposição acidental de dados sensíveis;
- impedir previews indevidos;
- reduzir risco de indexação de credenciais;
- manter o Cofre como área controlada, auditada e restrita.

O módulo deve possuir busca própria e restrita, acessível apenas para usuários com permissão de ver o Cofre.

A busca global pode, em evolução futura, indicar apenas existência de conteúdos relacionados sem expor dados sensíveis, desde que exista decisão formal de segurança, permissão específica e revisão dos PRDs.

---

## 🔗 18. RELAÇÃO COM POPS E BASE DE CONHECIMENTO

O Cofre pode possuir vínculos opcionais com:

- POP;
- etapa de POP;
- artigo;
- dúvida frequente;
- solução de erro;
- anotação operacional;
- empresa atendida;
- sistema relacionado.

Regras:

- O vínculo não autoriza exibir senha no POP, artigo ou solução.
- POPs e artigos podem indicar que existe uma credencial relacionada no Cofre.
- O acesso à credencial deve abrir o Cofre e validar permissões próprias.
- Conteúdos da Base de Conhecimento não devem copiar senha do Cofre para texto livre.
- Soluções de erro podem orientar “usar acesso cadastrado no Cofre”, mas não devem reproduzir usuário/senha sensíveis quando isso violar permissões.
- Analytics de POPs e Base de Conhecimento não devem receber senha ou segredo.

---

## 🎨 19. UX/UI

Princípios de UX/UI:

- Interface objetiva, compacta e operacional.
- Organização inspirada no KeePass: árvore à esquerda, registros à direita.
- Senha sempre mascarada por padrão.
- Ações sensíveis devem ser visualmente claras.
- Botões de revelar/copiar senha devem ser exibidos apenas quando permitidos.
- A ausência de permissão deve ser tratada de forma segura, sem sugerir bypass.
- Filtros devem ser rápidos e úteis para atendimento técnico.
- Status e criticidade devem ter badges visuais.
- Registros críticos devem chamar atenção, sem expor segredo.
- Anexos devem ter indicação de sensibilidade.
- Histórico deve ser fácil de auditar por usuário autorizado.

A experiência deve priorizar velocidade de consulta sem reduzir segurança.

---

## 🚫 20. FORA DO ESCOPO DO MVP

Não fazem parte do MVP:

- compartilhamento externo com clientes;
- acesso público;
- app mobile dedicado;
- rotação automática de senhas;
- integração automática com Microsoft, Google, Registro.br ou outros provedores;
- preenchimento automático no navegador;
- importação automática de arquivo KeePass;
- autenticação de dois fatores própria do módulo;
- cofre pessoal por usuário;
- controle granular por campo;
- aprovação em múltiplos níveis para revelar senha;
- exportação livre de senhas;
- busca global sobre registros do Cofre;
- indexação de anexos sensíveis;
- implementação de telas, rotas, migrations ou componentes nesta tarefa documental.

---

## 💡 21. EVOLUÇÕES FUTURAS

Possíveis evoluções futuras:

- importação de KeePass;
- exportação segura controlada;
- alerta de senha vencida;
- alerta de senha não validada há X meses;
- campo de validade para certificado digital;
- notificação antes do vencimento de certificado/licença;
- vínculo com POPs de renovação;
- relatório de acessos críticos;
- relatório de usuários que mais revelam senhas;
- dupla confirmação para credenciais críticas;
- solicitação de acesso com aprovação;
- histórico de versões da credencial;
- aprovação em múltiplos níveis para revelar senha;
- controle de expiração de acesso temporário;
- classificação automática de criticidade sugerida;
- relatório de credenciais pendentes de validação;
- política de revisão periódica por responsável.

---

## 📈 22. MÉTRICAS DE SUCESSO

- Número de empresas atendidas cadastradas.
- Número de grupos criados por empresa atendida.
- Número de acessos ativos por tipo.
- Número de acessos críticos cadastrados.
- Tempo médio para encontrar um acesso autorizado.
- Percentual de acessos com responsável definido.
- Percentual de acessos com data de última validação preenchida.
- Número de revelações de senha por período.
- Número de cópias de senha por período.
- Número de downloads de anexos sensíveis por período.
- Número de acessos pendentes de validação.
- Redução de credenciais mantidas fora do PopFlow.

---

## ✅ 23. CRITÉRIOS DE SUCESSO DO MVP

O MVP será considerado bem-sucedido quando:

- usuários autorizados conseguirem cadastrar empresas atendidas;
- usuários autorizados conseguirem criar grupos por empresa atendida;
- usuários autorizados conseguirem cadastrar acessos dentro dos grupos;
- senhas permanecerem ocultas em listagens e detalhes por padrão;
- revelar senha exigir permissão específica;
- copiar senha exigir permissão específica;
- revelar ou copiar senha gerar log sensível;
- baixar anexo gerar log;
- usuários sem permissão não visualizarem o menu;
- usuários sem permissão não acessarem a rota diretamente;
- registros respeitarem `empresa_id` em todas as operações;
- dados do Cofre não aparecerem na busca global comum;
- busca interna encontrar registros por campos permitidos;
- inativação estiver disponível como alternativa à exclusão definitiva;
- o módulo estiver claramente separado da Base de Conhecimento comum.

---

## 📝 24. AJUSTES RECOMENDADOS NOS PRDS EXISTENTES

A criação deste PRD exige apenas ajustes pontuais de referência nos documentos existentes, sem reescrever suas regras principais.

Ajustes recomendados:

- README.md: incluir “Cofre de Acessos e Credenciais Operacionais” na lista de funcionalidades e adicionar o PRD 15 na ordem de documentação/desenvolvimento.
- PRD 4 — Permissões e Multi-Empresa: registrar que módulos sensíveis podem possuir permissões próprias além das roles principais.
- PRD 7 — Sistema de Busca Inteligente: registrar que registros do Cofre ficam fora da busca global comum no MVP e possuem busca própria restrita.
- PRD 13 — Base de Conhecimento: registrar que artigos podem se vincular ao Cofre, mas nunca exibir senha ou credenciais diretamente.
- PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais: registrar que soluções podem referenciar um acesso do Cofre quando necessário, mantendo credenciais restritas ao Cofre.
- PRD 11 — Visibilidade: não exige alteração obrigatória, mas este PRD reforça que credenciais não devem usar apenas a lógica simples de visibilidade privado/empresa/departamento.

---

## 🔥 25. DIFERENCIAL ESTRATÉGICO

Este módulo transforma o PopFlow de:

👉 Plataforma de processos e conhecimento operacional  
em  
👉 Plataforma também capaz de organizar acessos operacionais sensíveis com rastreabilidade

Permitindo:

- suporte técnico mais rápido;
- redução de credenciais dispersas;
- maior controle sobre acessos críticos;
- auditoria de uso de senhas;
- separação clara entre documentação operacional e dados sigilosos;
- base futura para governança de segurança interna.
