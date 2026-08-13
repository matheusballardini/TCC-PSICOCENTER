# Backend Express + Supabase

Este backend foi estruturado para consumir o banco existente no Supabase sem recriar tabelas ou alterar o esquema.

## Instalação

1. Entre na pasta backend.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo .env.example para .env e preencha as variáveis.

## Execução

```bash
npm run dev
```

## Endpoints principais

- Auth: /api/auth/*
- Pacientes: /api/patients/*
- Psicólogos: /api/psychologists/*
- Publicações: /api/publications/*
- Chat: /api/chats/*
- Consultas: /api/appointments/*
- Notificações: /api/notifications/*
- Denúncias: /api/reports/*
- Upload: /api/upload/*
