
# 🚀 POPFlow — Sistema de Gestão de Procedimentos Operacionais

POPFlow é uma aplicação web para criação, execução e gestão de Procedimentos Operacionais Padrão (POPs), com foco em transformar conhecimento operacional em processos estruturados, interativos e rastreáveis.

---

## 🧠 Visão do Produto

O objetivo do POPFlow é eliminar a dependência de conhecimento individual e centralizar processos dentro da empresa, permitindo:

- Padronização de rotinas
- Redução de erros operacionais
- Treinamento mais rápido de colaboradores
- Escalabilidade da operação
- Transformação de conhecimento em ativo organizacional

---

## 🎯 Principais Funcionalidades

### 📄 Gestão de POPs
- Criação e edição de processos
- Organização por departamento
- Versionamento de processos
- Status: rascunho, revisão, publicado

---

### 🧩 Etapas estruturadas
Cada POP é dividido em etapas com:

- Instruções detalhadas
- Checklist
- Resultado esperado
- Erros comuns
- Tempo estimado
- Pré-requisitos

---

### ▶️ Execução guiada
- Modo execução passo a passo
- Progresso por etapas
- Registro de execução
- Controle de tempo

---

### 🔐 Multi-empresa (Multi-tenant)
- Isolamento total de dados por empresa
- Usuários, processos e execuções separados
- Base para modelo SaaS

---

### 👥 Permissões e papéis
- Admin
- Gestor
- Criador de POP
- Executor

---

### 🔍 Busca inteligente
- Busca por:
  - título
  - etapas
  - descrições
  - erros comuns
- Acesso rápido ao conhecimento

---

### 📊 Analytics operacional
- Tempo médio de execução
- Gargalos por etapa
- Performance por usuário
- Taxa de conclusão

---

### 🔔 Notificações
- Execuções pendentes
- Revisões
- Alertas operacionais

---

### 💬 Comentários e colaboração
- Comentários por etapa
- Threads de resposta
- Marcação de resolução

---

### 📚 Templates de POP
- Criação de modelos reutilizáveis
- Aceleração da criação de processos

---

## 🔥 Diferencial — Mídia Inline Multimodal

POPFlow permite inserir mídia diretamente no texto das etapas usando referências como:

```

@midia1
@midia2

```

### Tipos suportados:
- 🖼️ Imagem
- 🎧 Áudio
- 🎥 Vídeo
- 📄 Documento/PDF

### Exemplo:

> "Preencha os campos conforme @midia1 e ouça a explicação em @midia2"

### Comportamento:
- Clique na referência inline → abre mídia de forma contextual, sem drawer lateral fixo
- Imagem e vídeo → modal central (lightbox/player)
- Documento/PDF → modal central de visualização ou nova aba quando tecnicamente necessário
- Áudio → mini-player flutuante discreto (reproduzir, pausar e fechar)
- A tela de execução permanece focada na etapa atual, sem compressão lateral do conteúdo principal

👉 Isso transforma o POP em um **tutorial interativo multimídia**

---

## 🔒 Visibilidade dos POPs

- 🔒 Privado (uso pessoal)
- 🏢 Empresa (uso compartilhado)

Fluxo natural:
```

POP privado → uso individual → compartilhamento → revisão → POP oficial

```

---

## 🧱 Stack Tecnológica

- React
- Tailwind CSS
- Estrutura preparada para Supabase (backend futuro)

---

## 🏗️ Arquitetura

Sistema multi-tenant com:

- `empresa_id` em todas as entidades
- Isolamento de dados por empresa
- Estrutura escalável para SaaS

---

## 📦 Estrutura básica de entidades

### POP
- id
- empresa_id
- título
- versão
- status
- visibilidade

### Etapa
- id
- pop_id
- descrição
- ordem

### Mídia
- id
- etapa_id
- tipo (imagem, audio, video)
- nome_referencia (@midia1)
- url

### Execução
- id
- pop_id
- usuário
- progresso
- tempo

---

## 🎨 Experiência do Usuário

- Interface limpa e moderna
- Foco em execução (não só documentação)
- Fluxo vertical intuitivo
- Interação contextual com mídia
- Navegação simples

---

## 🚀 Objetivo do Projeto

Evoluir de:

❌ Documentação estática  
para  
✅ Plataforma interativa de execução de processos

---

## 💡 Futuro

- IA para geração de POPs
- Transcrição automática de áudio
- Sugestões inteligentes
- Integrações externas
- Marketplace de templates

---

## 📌 Status

🚧 Em desenvolvimento (MVP)

---

## 🤝 Contribuição

Este projeto está sendo desenvolvido com foco em escalabilidade e produto SaaS.

---

## 🧠 Insight Final

POPFlow não é apenas um sistema de documentação.

É uma:

> **Plataforma de execução e transferência de conhecimento operacional**
```

---


## Protótipos visuais

Os protótipos visuais do PopFlow estão organizados no arquivo:

`00-mapa-dos-prototipos.md`

Eles servem como referência visual e de UX. As regras funcionais continuam sendo definidas exclusivamente nos PRDs da pasta `/PRD`.

Em caso de conflito entre protótipo e PRD, o PRD prevalece.
