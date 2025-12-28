$url = "http://localhost:11434/api/chat"
$body = @{
    model = "llama3:8b"
    messages = @(@{ role = "user"; content = "hello" })
    stream = $false
} | ConvertTo-Json

Write-Host "Sending non-streaming request to Ollama..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    $sw.Stop()
    Write-Host "Response received in $($sw.Elapsed.TotalSeconds) seconds" -ForegroundColor Green
    Write-Host "Content: $($response.message.content)"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
