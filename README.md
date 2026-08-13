# Psicocenter 🧠💙

<p align="center">
<img src="https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML/CSS/JS">
<img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js + Express">
<img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
<img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange?style=for-the-badge" alt="Status">
</p>

<h1 align="center">Psicocenter</h1>

<p align="center">
Plataforma web que conecta psicólogos e pacientes, simplificando a busca por profissionais e o agendamento de consultas.
</p>

---

# 📌 Sobre o projeto

O Psicocenter é uma plataforma web desenvolvida como Trabalho de Conclusão de Curso (TCC) com o objetivo de facilitar a conexão entre psicólogos e pacientes.

O projeto centraliza o cadastro de profissionais, a busca por especialidades, o agendamento de consultas e o acompanhamento de atendimentos, substituindo processos manuais e dispersos por uma solução digital acessível.

A plataforma foi projetada para dar autonomia ao paciente na escolha do profissional ideal e facilitar a gestão da agenda do psicólogo.

---

# 🎯 Objetivo

Criar um ambiente centralizado que permita:

- 🧑‍⚕️ Cadastrar e gerenciar perfis de psicólogos e pacientes;
- 🔍 Buscar profissionais por especialidade, modalidade e valor da sessão;
- 📅 Solicitar, aceitar, recusar e cancelar consultas;
- 👥 Acompanhar os pacientes atendidos por cada psicólogo;
- 🔒 Controlar o acesso e os dados de cada tipo de usuário;
- 📱 Disponibilizar uma interface responsiva e acessível.

---

# ⚙️ Como funciona?

O sistema organiza o fluxo de atendimento em etapas simples:

1. O usuário se cadastra como paciente ou psicólogo.
2. O usuário realiza o login e é direcionado ao seu painel.
3. O paciente busca profissionais por especialidade e modalidade.
4. O paciente solicita uma consulta dentro da disponibilidade do psicólogo.
5. O psicólogo aceita ou recusa a solicitação.
6. Consultas aceitas ficam visíveis para os dois lados até serem concluídas ou canceladas.

---

# 📐 Diagrama 1 - Arquitetura Geral

```mermaid
graph TD

A[Usuário]

B[Frontend HTML/CSS/JS]

C[API Node.js + Express]

D[Supabase Auth]

E[Banco de Dados Supabase]

A --> B

B --> C

C --> D

C --> E

E --> C

C --> B
```

---

# 📊 Diagrama 2 - Fluxo de Utilização

```mermaid
graph LR

A[Login/Cadastro]

B[Painel do Usuário]

C[Buscar Profissionais]

D[Perfil do Psicólogo]

E[Agendar Consulta]

F[Meus Agendamentos]

A --> B

B --> C

C --> D

D --> E

E --> F
```

---

# 🗄️ Diagrama 3 - Entidade Relacionamento

```mermaid
erDiagram

PROFILE ||--o| PSICOLOGO : e
PROFILE ||--o| PACIENTE : e
PSICOLOGO ||--o{ APPOINTMENT : atende
PACIENTE ||--o{ APPOINTMENT : solicita

PROFILE {
uuid id
string nome
string email
string tipo
}

PSICOLOGO {
uuid profile_id
string crp
string modalidade
numeric valor_consulta
}

PACIENTE {
uuid profile_id
string profissao
string genero
}

APPOINTMENT {
uuid id
uuid patient_id
uuid psychologist_id
timestamp scheduled_at
string status
}
```

---

# 🔄 Diagrama 4 - Fluxo de Agendamento de Consulta

```mermaid
graph TD

A[Início]

B[Selecionar Psicólogo]

C[Ver Disponibilidade]

D[Escolher Data e Horário]

E[Solicitar Consulta]

F{Psicólogo Aceita?}

G[Consulta Confirmada]

H[Consulta Recusada]

A --> B

B --> C

C --> D

D --> E

E --> F

F -->|Sim| G

F -->|Não| H
```

---

# 🛠️ Tecnologias Utilizadas

### Frontend

- HTML5 / CSS3
- JavaScript
- Boxicons

### Backend

- Node.js
- Express
- JWT (autenticação)

### Banco de Dados

- Supabase (PostgreSQL + Auth)

### Ferramentas

- Git
- GitHub

---

# 📂 Estrutura do Projeto

```bash
views/       # páginas HTML
style/       # arquivos CSS
js/          # scripts do frontend
images/      # imagens e assets
backend/
  controllers/
  routes/
  services/
  middleware/
  config/
```

---

# 🚀 Executando o projeto

Clone o repositório:

```bash
git clone https://github.com/matheusballardini/TCC-2026.git
```

Entre na pasta do backend e instale as dependências:

```bash
cd backend
npm install
```

Configure as variáveis de ambiente (crie um arquivo `.env` na pasta `backend` com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `JWT_SECRET`).

Execute o backend:

```bash
npm run dev
```

Abra a pasta `views/` com um servidor local (ex: extensão Live Server do VS Code) e acesse:

```bash
http://127.0.0.1:5500/views/index.html
```

---

# 🎓 Projeto Acadêmico

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC) aplicando conceitos de:

- Engenharia de Software
- Banco de Dados
- Arquitetura de Sistemas
- Desenvolvimento Web
- UX/UI

---

# 👨‍💻 Equipe

Projeto desenvolvido pela equipe do TCC 2026.

Matheus Ballardini

Bruno Richopo

Enzo Marques

Antônio Godoy

Vinicius Cárceres
