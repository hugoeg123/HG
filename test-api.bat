@echo off
echo Testando API de criacao de registros...
echo.

echo Dados enviados:
echo {
echo   "title": "Novo Registro",
echo   "content": "Conteudo do registro de teste",
echo   "patientId": "4a61ac40-8a20-4df0-b0f9-f0de4b207450",
echo   "type": "anamnese"
echo }
echo.

powershell -Command "$body = @{title='Novo Registro'; content='Conteudo do registro de teste'; patientId='4a61ac40-8a20-4df0-b0f9-f0de4b207450'; type='anamnese'} | ConvertTo-Json; try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/records' -Method Post -Body $body -ContentType 'application/json' -Headers @{Authorization='Bearer fake-token'}; Write-Host 'Sucesso:' $response } catch { Write-Host 'Erro:' $_.Exception.Message; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $responseBody = $reader.ReadToEnd(); Write-Host 'Detalhes:' $responseBody } }"

echo.
echo Teste concluido.
pause