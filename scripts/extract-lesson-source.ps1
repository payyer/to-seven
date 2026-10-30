# Read-only extraction of the supplied Word files. Generated intermediates stay in .next.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Force -Path .next | Out-Null
$documents = @()
$vocabulary = @()
foreach ($file in (Get-ChildItem -LiteralPath docs/lesson -Recurse -Filter '*.docx')) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
  try {
    $reader = [System.IO.StreamReader]::new($zip.GetEntry('word/document.xml').Open())
    $xml = [xml]$reader.ReadToEnd()
    $reader.Dispose()
    $ns = [System.Xml.XmlNamespaceManager]::new($xml.NameTable)
    $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
    $lesson = [int]([regex]::Match($file.Directory.Name, '\d+').Value)
    $isKey = $file.Name -match 'Answer'
    $lines = @($xml.SelectNodes('//w:body//w:p', $ns) | ForEach-Object {
      ($_.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
    } | Where-Object { $_.Trim() })
    $documents += [pscustomobject]@{lesson=$lesson; key=$isKey; file=$file.FullName.Substring((Get-Location).Path.Length+1); lines=$lines}
    if ($isKey) { continue }
    $inVocab = $false
    foreach ($element in $xml.SelectSingleNode('//w:body', $ns).ChildNodes) {
      if ($element.LocalName -eq 'p') {
        $line = ($element.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
        if ($line -match '^I\.\s') { $inVocab = $true }
        if ($line -match '^II[.\s]') { $inVocab = $false }
      }
      if (!$inVocab -or $element.LocalName -ne 'tbl') { continue }
      foreach ($row in $element.SelectNodes('./w:tr', $ns)) {
        $cells = @($row.SelectNodes('./w:tc', $ns) | ForEach-Object {
          ($_.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
        })
        if ($cells.Count -eq 5 -and $cells[0] -match '^\d+$') {
          $vocabulary += [pscustomobject]@{lesson=$lesson; word=$cells[1].Trim(); pos=$cells[2].Trim(); ipa=$cells[3].Trim(); vi=$cells[4].Trim()}
        }
      }
    }
  } finally { $zip.Dispose() }
}
$documents | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 .next/lesson-source.json
$vocabulary | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 .next/lesson-vocab.json
Write-Output "Extracted $($documents.Count) documents and $($vocabulary.Count) vocabulary rows."
