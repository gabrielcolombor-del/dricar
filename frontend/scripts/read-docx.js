const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const script = `
$file = Get-ChildItem -Path "C:\\Users\\Gabriel Colombo\\OneDrive" -Filter "Contrato_Compra_e_Venda_DRI-CAR.docx" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
Write-Host "FOUND FILE: "$file.FullName
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = [System.IO.StreamReader]::new($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
$text = $xml -replace '<[^>]+>', [char]10
$lines = $text -split [char]10 | Where-Object { $_.Trim().Length -gt 0 }
$lines -join [char]10
`;

const psPath = path.join(__dirname, "temp-read.ps1");
fs.writeFileSync(psPath, script, "utf8");

try {
  const result = execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { encoding: "utf8" });
  console.log(result);
} catch (e) {
  console.error("Error reading docx:", e);
} finally {
  if (fs.existsSync(psPath)) fs.unlinkSync(psPath);
}
