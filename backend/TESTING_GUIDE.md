# Guia de Testes - API Backend TCC

## Status do Servidor

O servidor está **ONLINE** na porta **3002**

```
Base URL: http://localhost:3002/api
```

---

## Opção 1: Testar com Postman (Recomendado)

### Instalação
1. Baixe o [Postman](https://www.postman.com/downloads/)
2. Instale o aplicativo
3. Abra o Postman

### Importar Coleção
1. Clique em **File > Import**
2. Selecione o arquivo `Postman-Collection.json` nesta pasta
3. Clique em **Import**
4. Agora você tem todas as requisições prontas!

### Como Usar
1. Na seção **Auth**, execute **Login** para qualquer usuário
2. Copie o token da resposta
3. Na aba **Environments**, crie uma variável `token` com o valor do token
4. Agora todas as requisições usarão automaticamente o token correto

---

## Opção 2: Testar com PowerShell (Windows)

### 1. Health Check (Verificar se API está online)
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3002/health" -Method GET
$response | ConvertTo-Json
```

### 2. Register - Criar novo usuário (Paciente)
```powershell
$body = @{
    email = "paciente@example.com"
    password = "senha123"
    full_name = "João Silva"
    role = "paciente"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response | ConvertTo-Json
```

### 3. Register - Criar novo usuário (Psicólogo)
```powershell
$body = @{
    email = "psicologo@example.com"
    password = "senha123"
    full_name = "Dra. Maria Silva"
    role = "psicologo"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response | ConvertTo-Json
```

### 4. Login
```powershell
$body = @{
    email = "paciente@example.com"
    password = "senha123"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

# Guardar o token para usar em requisições autenticadas
$token = $response.data.token
Write-Host "Token: $token"
$response | ConvertTo-Json
```

### 5. Get My Profile (Com autenticação)
```powershell
$token = "seu_token_aqui"  # Cole o token obtido no login

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/auth/me" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $token"}

$response | ConvertTo-Json
```

### 6. List Especialidades (Público)
```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/especialidades" `
    -Method GET

$response | ConvertTo-Json
```

### 7. List Publications (Público)
```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/publications" `
    -Method GET

$response | ConvertTo-Json
```

### 8. List Psicólogos (Com autenticação)
```powershell
$token = "seu_token_aqui"

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/psychologists" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $token"}

$response | ConvertTo-Json
```

### 9. Create Publication (Apenas Psicólogos)
```powershell
$token = "seu_token_de_psicologo_aqui"

$body = @{
    title = "Dicas de Saúde Mental"
    content = "Neste artigo vamos falar sobre técnicas de mindfulness..."
    image = "https://example.com/image.jpg"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/publications" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } `
    -Body $body

$response | ConvertTo-Json
```

### 10. Create Appointment (Pacientes)
```powershell
$token = "seu_token_de_paciente_aqui"

$body = @{
    psicologo_id = "00000000-0000-0000-0000-000000000001"  # Alterar com ID real
    data = "2026-12-15"
    horario = "14:00"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3002/api/appointments" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } `
    -Body $body

$response | ConvertTo-Json
```

---

## Opção 3: Testar com cURL (Se instalado)

### Health Check
```bash
curl -X GET "http://localhost:3002/health"
```

### Login
```bash
curl -X POST "http://localhost:3002/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "senha123"
  }'
```

### Get Profile (Com Token)
```bash
curl -X GET "http://localhost:3002/api/auth/me" \
  -H "Authorization: Bearer seu_token_aqui"
```

---

## Erros Comuns

### 1. "Token inválido"
- Certifique-se de que o token está correto
- O token expira após 7 dias
- Faça login novamente se necessário

### 2. "Acesso negado" (403)
- Você pode estar tentando acessar um endpoint que requer uma role específica
- Exemplo: Apenas psicólogos podem criar publicações
- Verifique se você está usando o token do usuário correto

### 3. "Usuário não autenticado" (401)
- Verifique se o header `Authorization` está presente
- O formato deve ser: `Authorization: Bearer <token>`

### 4. "Dados inválidos" (400)
- Verifique se os campos obrigatórios estão presentes
- Verifique o formato dos dados (datas em ISO 8601, etc)

---

## Documentação Completa

Para detalhes de todos os endpoints, veja o arquivo `API_DOCS.md`

---

## Variáveis de Ambiente Postman

Para facilitar os testes, crie as seguintes variáveis no Postman:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `base_url` | http://localhost:3002/api | URL base da API |
| `token` | (obtido do login) | JWT token do usuário |
| `paciente_id` | (ID do paciente) | ID de um paciente válido |
| `psicologo_id` | (ID do psicólogo) | ID de um psicólogo válido |
| `publication_id` | (ID da publicação) | ID de uma publicação válida |

Use as variáveis nas requisições assim:
```
{{base_url}}/auth/me
Authorization: Bearer {{token}}
```

---

## Fluxo Recomendado de Testes

1. **Health Check** - Verificar se API está online
2. **Register** - Criar dois usuários (1 paciente, 1 psicólogo)
3. **Login** - Fazer login com ambos
4. **Get Profile** - Ver dados do usuário logado
5. **List Especialidades** - Ver especialidades disponíveis
6. **List Psychologists** - Ver psicólogos disponíveis (como paciente)
7. **Create Publication** - Criar publicação (como psicólogo)
8. **List Publications** - Ver publicações
9. **Create Appointment** - Agendar consulta (como paciente)
10. **Create Conversation** - Iniciar conversa
11. **Send Message** - Enviar mensagem

---

## Dicas

- Sempre guarde o token após fazer login
- Use o Postman para gerenciar múltiplos tokens de diferentes usuários
- A maioria dos endpoints requer autenticação - não esqueça do header `Authorization`
- Para testes rápidos no PowerShell, crie scripts que usem as variáveis $token

---

## Servidor está rodando!

Se você viu as mensagens acima, o servidor está funcionando corretamente na porta 3002!

Qualquer erro ou dúvida, consulte o arquivo `API_DOCS.md` para informações detalhadas de cada endpoint.
