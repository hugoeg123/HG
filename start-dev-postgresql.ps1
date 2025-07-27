# Script para iniciar o Health Guardian com PostgreSQL
# Este script substitui os scripts antigos que usavam MongoDB

param(
    [switch]$SkipDatabase,
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

# Função para exibir mensagens coloridas
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colorMap = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "Magenta" = [ConsoleColor]::Magenta
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

# Verificar se o Docker está disponível
function Test-Docker {
    try {
        docker --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Verificar se o Docker Compose está disponível
function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

Write-ColorMessage "🚀 Iniciando o Health Guardian com PostgreSQL..." "Blue"
Write-ColorMessage "" 

# Verificar pré-requisitos
if (-not $SkipDatabase) {
    if (-not (Test-Docker)) {
        Write-ColorMessage "❌ Docker não encontrado. Instale o Docker Desktop para continuar." "Red"
        Write-ColorMessage "   Download: https://www.docker.com/products/docker-desktop" "Yellow"
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-ColorMessage "❌ Docker Compose não encontrado." "Red"
        exit 1
    }
    
    Write-ColorMessage "✅ Docker e Docker Compose encontrados" "Green"
}

# Iniciar o PostgreSQL
if (-not $SkipDatabase) {
    Write-ColorMessage "🔄 Iniciando o PostgreSQL com Docker Compose..." "Blue"
    
    try {
        docker-compose -f docker-compose-postgres.yml up -d postgres
        if ($LASTEXITCODE -ne 0) {
            Write-ColorMessage "❌ Falha ao iniciar o PostgreSQL com Docker Compose." "Red"
            exit 1
        }
        Write-ColorMessage "✅ PostgreSQL iniciado com sucesso." "Green"
    } catch {
        Write-ColorMessage "❌ Erro ao iniciar o PostgreSQL: $_" "Red"
        exit 1
    }
    
    # Aguardar alguns segundos para o PostgreSQL iniciar completamente
    Write-ColorMessage "⏳ Aguardando o PostgreSQL iniciar completamente..." "Yellow"
    Start-Sleep -Seconds 10
    
    # Verificar a conexão com o PostgreSQL
    Write-ColorMessage "🔄 Verificando a conexão com o PostgreSQL..." "Blue"
    
    try {
        Set-Location backend
        npm run pg:check
        if ($LASTEXITCODE -ne 0) {
            Write-ColorMessage "❌ Falha ao conectar com o PostgreSQL." "Red"
            Write-ColorMessage "   Verifique se o PostgreSQL está rodando e se as configurações em .env estão corretas." "Yellow"
            Set-Location ..
            exit 1
        }
        Write-ColorMessage "✅ Conexão com o PostgreSQL estabelecida com sucesso." "Green"
        Set-Location ..
    } catch {
        Write-ColorMessage "❌ Erro ao verificar a conexão com o PostgreSQL: $_" "Red"
        Set-Location ..
        exit 1
    }
}

# Iniciar o backend
if (-not $SkipBackend) {
    Write-ColorMessage "🔄 Iniciando o servidor backend..." "Blue"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Iniciando servidor backend...' -ForegroundColor Green; npm run dev"
    
    Write-ColorMessage "✅ Servidor backend iniciado em uma nova janela." "Green"
    Start-Sleep -Seconds 3
}

# Iniciar o frontend
if (-not $SkipFrontend) {
    Write-ColorMessage "🔄 Iniciando o cliente frontend..." "Blue"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Iniciando cliente frontend...' -ForegroundColor Green; npm run dev"
    
    Write-ColorMessage "✅ Cliente frontend iniciado em uma nova janela." "Green"
}

Write-ColorMessage "" 
Write-ColorMessage "🎉 Health Guardian iniciado com sucesso!" "Green"
Write-ColorMessage "" 
Write-ColorMessage "📋 Informações de acesso:" "Cyan"
Write-ColorMessage "   Frontend: http://localhost:3000" "Yellow"
Write-ColorMessage "   Backend: http://localhost:5000" "Yellow"
Write-ColorMessage "   PostgreSQL: postgresql://localhost:5432/health_guardian" "Yellow"
Write-ColorMessage "" 
Write-ColorMessage "🔧 Comandos úteis:" "Cyan"
Write-ColorMessage "   Parar PostgreSQL: docker-compose down" "Yellow"
Write-ColorMessage "   Ver logs PostgreSQL: docker logs health-guardian-postgres" "Yellow"
Write-ColorMessage "   Executar migrações: cd backend && npm run db:migrate" "Yellow"
Write-ColorMessage "   Popular dados: cd backend && npm run db:seed" "Yellow"
Write-ColorMessage "" 
Write-ColorMessage "Pressione qualquer tecla para continuar..." "White"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")