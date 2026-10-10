# Kleiner lokaler Webserver zum Testen am PC (nur von diesem Rechner aus erreichbar).
# Start:  powershell -ExecutionPolicy Bypass -File server.ps1
# Danach im Browser http://localhost:8080 aufrufen. Beenden mit Strg+C.

param([int]$Port = 8080)

$ordner = $PSScriptRoot
$typen = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
}

$server = New-Object System.Net.HttpListener
$server.Prefixes.Add("http://localhost:$Port/")
$server.Start()
Write-Host "Zeittracker ist erreichbar unter http://localhost:$Port  (Strg+C zum Beenden)"

try {
  while ($server.IsListening) {
    $anfrage = $server.GetContextAsync()
    while (-not $anfrage.AsyncWaitHandle.WaitOne(200)) { }
    $kontext = $anfrage.Result

    $pfad = [Uri]::UnescapeDataString($kontext.Request.Url.AbsolutePath).TrimStart('/')
    if ($pfad -eq '') { $pfad = 'index.html' }
    $datei = [IO.Path]::GetFullPath((Join-Path $ordner $pfad))
    $endung = [IO.Path]::GetExtension($datei).ToLower()

    $antwort = $kontext.Response
    try {
      if ($datei.StartsWith($ordner + '\') -and $typen.ContainsKey($endung) -and (Test-Path $datei -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($datei)
        $antwort.ContentType = $typen[$endung]
        $antwort.Headers.Add('Cache-Control', 'no-cache')
        $antwort.ContentLength64 = $bytes.Length
        if ($kontext.Request.HttpMethod -ne 'HEAD') {
          $antwort.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $antwort.StatusCode = 404
      }
      $antwort.Close()
    } catch {
      # Abgebrochene Verbindung: Server soll weiterlaufen
      $antwort.Abort()
    }
  }
} finally {
  $server.Stop()
}
