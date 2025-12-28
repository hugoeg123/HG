# Script to Reliably Start Ollama
# 1. Kill any existing Ollama processes
Write-Host "Limpar processos Ollama antigos..." -ForegroundColor Yellow
Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "ollama app" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Set Environment Variable
$env:OLLAMA_MODELS = "D:\ollama_models"
Write-Host "Configurando ambiente: OLLAMA_MODELS = $env:OLLAMA_MODELS" -ForegroundColor Cyan

# 3. Start Ollama Serve
Write-Host "Iniciando servidor Ollama..." -ForegroundColor Green
$pInfo = New-Object System.Diagnostics.ProcessStartInfo
$pInfo.FileName = "ollama"
$pInfo.Arguments = "serve"
$pInfo.RedirectStandardOutput = $false
$pInfo.RedirectStandardError = $false
$pInfo.UseShellExecute = $false
$pInfo.CreateNoWindow = $true

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $pInfo
$p.Start() | Out-Null

Write-Host "Aguardando startup do servidor (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Verify Connection
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "Ollama conectado com sucesso!" -ForegroundColor Green
    Write-Host "Modelos encontrados:"
    $response.models | ForEach-Object { Write-Host " - $($_.name)" }
} catch {
    Write-Host "Erro: Falha ao conectar ao Ollama. Verifique logs." -ForegroundColor Red
}
