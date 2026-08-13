#!/usr/bin/env pwsh

# Script de Testes Automatizados - TCC Backend API
# Este script executa testes comuns da API

$baseUrl = "http://localhost:3002/api"
$healthUrl = "http://localhost:3002/health"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "TCC Backend API - Teste Automatizado" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Função para fazer requisições
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null
    )

    $url = "$baseUrl$Endpoint"
    $headers = @{"Content-Type" = "application/json" }
    
    if ($Token) {
        $headers.Add("Authorization", "Bearer $Token")
    }

    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json)
        }
        else {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers
        }
        return $response
    }
    catch {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Health Check
Write-Host "1. Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method GET
    Write-Host "✓ API está online" -ForegroundColor Green
    $health | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "✗ API está offline: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Register Paciente
Write-Host "2. Register - Paciente" -ForegroundColor Yellow
$pacienteRegister = @{
    email    = "paciente@example.com"
    password = "senha123"
    full_name = "João Silva"
    role     = "paciente"
}
$pacienteResp = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $pacienteRegister
if ($pacienteResp -and $pacienteResp.success) {
    Write-Host "✓ Paciente registrado com sucesso" -ForegroundColor Green
}
else {
    Write-Host "✗ Erro ao registrar paciente" -ForegroundColor Red
}
Write-Host ""

# 3. Register Psicólogo
Write-Host "3. Register - Psicólogo" -ForegroundColor Yellow
$psicologoRegister = @{
    email    = "psicologo@example.com"
    password = "senha123"
    full_name = "Dra. Maria Silva"
    role     = "psicologo"
}
$psicologoResp = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $psicologoRegister
if ($psicologoResp -and $psicologoResp.success) {
    Write-Host "✓ Psicólogo registrado com sucesso" -ForegroundColor Green
}
else {
    Write-Host "✗ Erro ao registrar psicólogo" -ForegroundColor Red
}
Write-Host ""

# 4. Login Paciente
Write-Host "4. Login - Paciente" -ForegroundColor Yellow
$pacienteLogin = @{
    email    = "paciente@example.com"
    password = "senha123"
}
$pacienteLoginResp = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body $pacienteLogin
if ($pacienteLoginResp -and $pacienteLoginResp.success) {
    $tokenPaciente = $pacienteLoginResp.data.token
    Write-Host "✓ Paciente logado com sucesso" -ForegroundColor Green
    Write-Host "Token: $($tokenPaciente.Substring(0, 20))..." -ForegroundColor DarkGray
}
else {
    Write-Host "✗ Erro ao fazer login do paciente" -ForegroundColor Red
    $tokenPaciente = $null
}
Write-Host ""

# 5. Login Psicólogo
Write-Host "5. Login - Psicólogo" -ForegroundColor Yellow
$psicologoLogin = @{
    email    = "psicologo@example.com"
    password = "senha123"
}
$psicologoLoginResp = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body $psicologoLogin
if ($psicologoLoginResp -and $psicologoLoginResp.success) {
    $tokenPsicologo = $psicologoLoginResp.data.token
    Write-Host "✓ Psicólogo logado com sucesso" -ForegroundColor Green
    Write-Host "Token: $($tokenPsicologo.Substring(0, 20))..." -ForegroundColor DarkGray
}
else {
    Write-Host "✗ Erro ao fazer login do psicólogo" -ForegroundColor Red
    $tokenPsicologo = $null
}
Write-Host ""

# 6. Get My Profile (Paciente)
Write-Host "6. Get My Profile - Paciente" -ForegroundColor Yellow
if ($tokenPaciente) {
    $profileResp = Invoke-ApiRequest -Method GET -Endpoint "/auth/me" -Token $tokenPaciente
    if ($profileResp -and $profileResp.success) {
        Write-Host "✓ Perfil do paciente obtido" -ForegroundColor Green
        Write-Host "Nome: $($profileResp.data.user.email)" -ForegroundColor DarkGray
    }
    else {
        Write-Host "✗ Erro ao obter perfil" -ForegroundColor Red
    }
}
else {
    Write-Host "⊘ Pulando teste (token não obtido)" -ForegroundColor Gray
}
Write-Host ""

# 7. List Especialidades
Write-Host "7. List Especialidades" -ForegroundColor Yellow
$especialidadesResp = Invoke-ApiRequest -Method GET -Endpoint "/especialidades"
if ($especialidadesResp -and $especialidadesResp.success) {
    $count = $especialidadesResp.data | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "✓ Especialidades obtidas ($count encontradas)" -ForegroundColor Green
}
else {
    Write-Host "✗ Erro ao obter especialidades" -ForegroundColor Red
}
Write-Host ""

# 8. List Publicações
Write-Host "8. List Publicações" -ForegroundColor Yellow
$publicacoesResp = Invoke-ApiRequest -Method GET -Endpoint "/publications"
if ($publicacoesResp -and $publicacoesResp.success) {
    $count = $publicacoesResp.data | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "✓ Publicações obtidas ($count encontradas)" -ForegroundColor Green
}
else {
    Write-Host "✗ Erro ao obter publicações" -ForegroundColor Red
}
Write-Host ""

# 9. Create Publication (Psicólogo)
Write-Host "9. Create Publication - Psicólogo" -ForegroundColor Yellow
if ($tokenPsicologo) {
    $pubData = @{
        title   = "Dicas de Saúde Mental"
        content = "Neste artigo vamos falar sobre técnicas de mindfulness e sua importância para a saúde mental."
        image   = "https://example.com/image.jpg"
    }
    $pubResp = Invoke-ApiRequest -Method POST -Endpoint "/publications" -Body $pubData -Token $tokenPsicologo
    if ($pubResp -and $pubResp.success) {
        Write-Host "✓ Publicação criada com sucesso" -ForegroundColor Green
        Write-Host "ID: $($pubResp.data.id)" -ForegroundColor DarkGray
    }
    else {
        Write-Host "✗ Erro ao criar publicação" -ForegroundColor Red
    }
}
else {
    Write-Host "⊘ Pulando teste (token não obtido)" -ForegroundColor Gray
}
Write-Host ""

# 10. List Psicólogos
Write-Host "10. List Psicólogos" -ForegroundColor Yellow
if ($tokenPaciente) {
    $psicosResp = Invoke-ApiRequest -Method GET -Endpoint "/psychologists" -Token $tokenPaciente
    if ($psicosResp -and $psicosResp.success) {
        $count = $psicosResp.data | Measure-Object | Select-Object -ExpandProperty Count
        Write-Host "✓ Psicólogos obtidos ($count encontrados)" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Erro ao obter psicólogos" -ForegroundColor Red
    }
}
else {
    Write-Host "⊘ Pulando teste (token não obtido)" -ForegroundColor Gray
}
Write-Host ""

# Final
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testes concluídos!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Use o Postman com 'Postman-Collection.json' para testes interativos"
Write-Host "2. Consulte 'API_DOCS.md' para documentação completa de todos os endpoints"
Write-Host "3. Consulte 'TESTING_GUIDE.md' para exemplos de como testar cada endpoint"
Write-Host ""
Write-Host "Token do Paciente (salve para usar depois):" -ForegroundColor Yellow
Write-Host $tokenPaciente -ForegroundColor Green
Write-Host ""
Write-Host "Token do Psicólogo (salve para usar depois):" -ForegroundColor Yellow
Write-Host $tokenPsicologo -ForegroundColor Green
