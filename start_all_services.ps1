# Script Mestre para Iniciar Todo o Sistema Health Guardian (Incluindo Ollama com Caminho Correto)

# 1. Configurar Variável de Ambiente para Ollama
# Isso garante que o Ollama procure os modelos no drive D:
$env:OLLAMA_MODELS = "D:\ollama_models"
Write-Host "Configurado OLLAMA_MODELS para: $env:OLLAMA_MODELS" -ForegroundColor Cyan

# 2. Reiniciar Ollama (Matar processo existente e iniciar novo)
Write-Host "Reiniciando serviço Ollama..." -ForegroundColor Yellow
Stop-Process -Name "ollama" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Iniciar Ollama em background
# Usamos start-process para que ele rode independente
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
Write-Host "Ollama iniciado em background." -ForegroundColor Green
Start-Sleep -Seconds 5 # Dar tempo para o Ollama subir

# 3. Verificar conexao com Ollama e listar modelos
try {
    Write-Host "Verificando modelos disponíveis..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
    $count = $response.models.Count
    if ($count -gt 0) {
        Write-Host "Sucesso! $count modelos encontrados no drive D:" -ForegroundColor Green
        $response.models | ForEach-Object { Write-Host " - $($_.name)" -ForegroundColor Gray }
    } else {
        Write-Host "Aviso: Nenhum modelo encontrado em D:\ollama_models." -ForegroundColor Red
    }
} catch {
    Write-Host "Aviso: Não foi possível conectar ao Ollama. Verifique se ele iniciou corretamente." -ForegroundColor Red
}

# 4. Iniciar o restante do sistema usando o script existente
Write-Host "`nIniciando PostgreSQL, Backend e Frontend..." -ForegroundColor Cyan
# Chama o script existente que lida com Docker e Node
& ./start-dev-postgresql.ps1
