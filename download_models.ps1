$models = @(
    "llama3:8b",
    "mistral-nemo",
    "deepseek-r1:8b",
    "phi4:14b",
    "deepseek-r1:14b",
    "phi3.5",
    "qwen2.5:7b",
    "bge-m3"
)

foreach ($model in $models) {
    Write-Host "Downloading $model..."
    ollama pull $model
    Write-Host "Finished $model"
}
Write-Host "All downloads complete."
