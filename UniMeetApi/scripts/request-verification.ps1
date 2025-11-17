param(
    [string]$Email = "202303011089@dogus.edu.tr",
    [string]$ApiBaseUrl = "http://localhost:5062"
)

Write-Host "--> UniMeet API: $ApiBaseUrl" -ForegroundColor Cyan
Write-Host "--> Hedef e-posta: $Email" -ForegroundColor Cyan

$body = @{ email = $Email } | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/api/Auth/request-verification" -Method Post -ContentType "application/json" -Body $body
    Write-Host "İstek başarılı:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Output
}
catch {
    Write-Host "İstek başarısız:" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Output $_.ErrorDetails.Message
    }
    elseif ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        Write-Output $reader.ReadToEnd()
    }
    else {
        Write-Output $_.Exception.Message
    }
    exit 1
}
