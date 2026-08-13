#!/bin/bash

# API Backend Teste - TCC Psychologist
# Base URL: http://localhost:3002/api

BASE_URL="http://localhost:3002/api"

echo "================================"
echo "1. Health Check - Verificar se API está online"
echo "================================"
curl -X GET "$BASE_URL/../health" -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "2. Register - Criar novo usuário (Paciente)"
echo "================================"
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "senha123",
    "full_name": "João Silva",
    "role": "paciente"
  }' | jq .
echo -e "\n\n"

echo "================================"
echo "3. Register - Criar novo usuário (Psicólogo)"
echo "================================"
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "psicologo@example.com",
    "password": "senha123",
    "full_name": "Dra. Maria Silva",
    "role": "psicologo"
  }' | jq .
echo -e "\n\n"

echo "================================"
echo "4. Login - Fazer login com Paciente"
echo "================================"
TOKEN_PACIENTE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "senha123"
  }' | jq -r '.data.token')

echo "Token do Paciente: $TOKEN_PACIENTE"
echo -e "\n\n"

echo "================================"
echo "5. Login - Fazer login com Psicólogo"
echo "================================"
TOKEN_PSICOLOGO=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "psicologo@example.com",
    "password": "senha123"
  }' | jq -r '.data.token')

echo "Token do Psicólogo: $TOKEN_PSICOLOGO"
echo -e "\n\n"

echo "================================"
echo "6. Get My Profile - Ver perfil do usuário logado"
echo "================================"
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "7. List Psicólogos - Listar psicólogos (Paciente)"
echo "================================"
curl -X GET "$BASE_URL/psychologists" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "8. List Especialidades - Listar especialidades"
echo "================================"
curl -X GET "$BASE_URL/especialidades" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "9. Create Publication - Psicólogo cria publicação"
echo "================================"
curl -X POST "$BASE_URL/publications" \
  -H "Authorization: Bearer $TOKEN_PSICOLOGO" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dicas de Saúde Mental",
    "content": "Neste artigo vamos falar sobre técnicas de mindfulness...",
    "image": "https://example.com/image.jpg"
  }' | jq .
echo -e "\n\n"

echo "================================"
echo "10. List Publications - Listar publicações (público)"
echo "================================"
curl -X GET "$BASE_URL/publications" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "11. Create Appointment - Paciente agenda consulta"
echo "================================"
# Nota: Substitua o psicologo_id por um ID válido do banco
curl -X POST "$BASE_URL/appointments" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" \
  -d '{
    "psicologo_id": "00000000-0000-0000-0000-000000000001",
    "data": "2026-12-15",
    "horario": "14:00"
  }' | jq .
echo -e "\n\n"

echo "================================"
echo "12. List My Appointments - Ver minhas consultas"
echo "================================"
curl -X GET "$BASE_URL/appointments/me" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "13. Create Conversation - Iniciar conversa"
echo "================================"
# Nota: Substitua o participant_two por um ID válido
curl -X POST "$BASE_URL/chats/conversations" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" \
  -d '{
    "participant_two": "00000000-0000-0000-0000-000000000001"
  }' | jq .
echo -e "\n\n"

echo "================================"
echo "14. List My Conversations - Ver minhas conversas"
echo "================================"
curl -X GET "$BASE_URL/chats/conversations" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "15. List Notifications - Ver notificações"
echo "================================"
curl -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "16. Follow User - Seguir usuário"
echo "================================"
curl -X POST "$BASE_URL/users/00000000-0000-0000-0000-000000000001/follow" \
  -H "Authorization: Bearer $TOKEN_PACIENTE" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "================================"
echo "17. Get User Followers - Ver seguidores"
echo "================================"
curl -X GET "$BASE_URL/users/00000000-0000-0000-0000-000000000001/followers" \
  -H "Content-Type: application/json" | jq .
echo -e "\n\n"

echo "Testes concluídos!"
