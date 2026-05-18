# Análise 1 — PRD do Cofre de Acessos e Credenciais Operacionais

---

## 1. Arquivos criados

- `Docs/PRD/PRD 15 — Cofre de Acessos e Credenciais Operacionais.md`
- `Docs/Analises/analise-1-cofre-de-acessos-prd.md`

---

## 2. Arquivos alterados

- `README.md`
- `Docs/PRD/PRD 4 — Permissões e Multi-Empresa (Multi-Tenant).txt`
- `Docs/PRD/PRD 7 — Sistema de Busca Inteligente (Base de Conhecimento).txt`
- `Docs/PRD/PRD 13 — Base de Conhecimento e Artigos Internos.txt`
- `Docs/PRD/PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais.txt`

---

## 3. Decisões tomadas

### Criação de um módulo documental próprio

Foi criado um PRD exclusivo para o Cofre de Acessos, evitando tratar credenciais como artigos, dúvidas, soluções de erro, anotações ou POPs comuns.

### Separação entre tenant e empresa atendida

O PRD diferencia explicitamente:

- `empresa_id`: empresa dona do ambiente PopFlow e base do isolamento multi-tenant.
- EmpresaAtendida: cliente/empresa assessorada cujo acesso está armazenado no Cofre.

Essa separação evita confusão entre multiempresa do PopFlow e organização operacional dos clientes atendidos.

### Busca interna restrita

Foi definido que o Cofre não entra na busca global comum do PopFlow no MVP.

A decisão reduz risco de exposição acidental de credenciais, previews indevidos, indexação insegura e vazamento de dados sensíveis em resultados gerais.

### Permissões próprias do Cofre

Foi definido que o módulo deve possuir permissões próprias além das roles principais.

A regra mais importante é: ter acesso ao módulo não significa poder revelar ou copiar senha.

### Senha mascarada e auditada

Foi definido que senhas devem ficar ocultas por padrão, nunca aparecer em listagens, nunca entrar na busca global e sempre gerar log quando reveladas ou copiadas.

### Inativação preferencial

Foi definido que registros devem ser inativados por padrão, evitando exclusão definitiva como fluxo comum.

---

## 4. Amarrações feitas com outros PRDs

### PRD 4 — Permissões e Multi-Empresa

Foi adicionada observação pontual indicando que módulos sensíveis, como o Cofre de Acessos, podem exigir permissões próprias além das roles principais.

O PRD 15 reforça que todos os registros do Cofre devem respeitar `empresa_id`, isolamento por empresa, permissões por usuário, roles e validação no frontend e backend.

### PRD 7 — Sistema de Busca Inteligente

Foi adicionada observação pontual indicando que registros do Cofre ficam fora da busca global comum no MVP e possuem busca própria restrita.

O PRD 15 detalha que a busca interna pode pesquisar campos como empresa atendida, grupo, título, usuário/login, URL, IP, tags e observações públicas, mas nunca senha.

### PRD 11 — Visibilidade e Compartilhamento de POPs

Não foi alterado o arquivo do PRD 11, pois o ajuste obrigatório não era necessário.

O PRD 15 registra que o Cofre não deve usar apenas a lógica simples de visibilidade privado/empresa/departamento, pois credenciais exigem camada própria de permissão e auditoria.

### PRD 13 — Base de Conhecimento e Artigos Internos

Foi adicionada observação pontual indicando que artigos podem se vincular ao Cofre, mas nunca exibir senha, token, segredo ou credencial diretamente.

O PRD 15 reforça a regra: a Base de Conhecimento explica como fazer; o Cofre guarda as credenciais necessárias.

### PRD 14 — Dúvidas Frequentes, Soluções de Erro e Anotações Operacionais

Foi adicionada observação pontual indicando que dúvidas, soluções e anotações podem referenciar um acesso do Cofre quando necessário, mantendo credenciais restritas ao módulo Cofre.

---

## 5. Pontos de atenção

- A implementação futura deve validar permissões do Cofre no frontend e no backend.
- A criptografia das senhas precisa ser definida tecnicamente antes da implementação.
- Logs sensíveis não podem armazenar senha antiga, senha nova ou valor revelado/copiado.
- Analytics não deve receber senha, token, segredo ou dado sigiloso.
- Anexos sensíveis devem seguir as mesmas permissões do registro principal.
- Busca interna deve excluir senha e anexos sensíveis no MVP.
- Observações públicas precisam de orientação de uso para evitar que usuários coloquem credenciais em campo pesquisável.
- A exclusão definitiva deve ser evitada ou altamente restrita.
- Deve haver cuidado para não confundir EmpresaAtendida com a entidade Empresa/Tenant.

---

## 6. Dúvidas ou riscos a validar antes da implementação

- Qual padrão de criptografia será adotado para `senha_criptografada`?
- As chaves criptográficas ficarão por tenant, por ambiente ou por outro modelo?
- Haverá política de rotação de chaves?
- Qual será a política de retenção de logs do Cofre?
- O evento “visualizou registro” deve ser registrado para todo detalhe aberto ou apenas quando houver acesso a áreas sensíveis?
- Quais roles iniciais receberão permissões padrão do Cofre?
- A permissão “Revelar senha” e “Copiar senha” devem ser independentes ou sempre combinadas?
- Anexos sensíveis serão armazenados em bucket privado com URL temporária?
- O Cofre terá integração futura com notificações para certificados e licenças vencendo?
- Será necessário fluxo de aprovação para revelar credenciais críticas em versões posteriores?

---

## 7. Resultado da análise

O projeto passa a ter um PRD completo para o módulo Cofre de Acessos, tratando-o como um KeePass interno operacional do PopFlow, com organização por empresa atendida e grupo, permissões próprias, logs de auditoria, busca restrita e separação clara em relação à Base de Conhecimento e à busca global comum.
