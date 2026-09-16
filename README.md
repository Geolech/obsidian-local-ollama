# Obsidian Local Ollama

Ein Obsidian-Plugin, das lokale KI-Modelle via [Ollama](https://ollama.com) direkt in Obsidian einbindet – als Schreib- und Strukturassistent mit integrierter Websuche. Vollständig lokal, keine Cloud, keine API-Kosten, keine Datenweitergabe.

![Obsidian Local Ollama Screenshot](https://raw.githubusercontent.com/Geolech/obsidian-local-ollama/main/screenshot.png)

## Features

- **Websuche direkt im Chat** – sucht automatisch via DuckDuckGo, speist die Ergebnisse als Kontext in Ollama ein und antwortet mit Quellenangaben – kein Browser, kein externes Tool nötig
- **Lokale Anfragen** – klassischer Chat mit dem lokalen Modell ohne Internetzugriff
- **Notiz zusammenfassen** – aktuelle Notiz mit einem Klick komprimieren
- **Struktur vorschlagen** – Gliederung für die offene Notiz entwickeln
- **Kontext laden** – Notiz als Hintergrundwissen für den Chat bereitstellen
- **Vollständig lokal** – keine Cloud, kein API-Token, keine Telemetrie

## Websuche

Das Plugin sucht direkt über die freie [DuckDuckGo](https://duckduckgo.com)-Engine – kein API-Key, keine Registrierung, keine Kosten. Die Top-5-Treffer werden automatisch als Kontext an das lokale Modell übergeben, das daraus eine strukturierte Antwort mit Quellenangaben `[1]`, `[2]` etc. formuliert.

**Nutzung:**
- Suchanfrage ins Textfeld eingeben
- `Shift+Enter` drücken oder auf **🔍 Websuche** klicken

**Lokale Anfragen** (ohne Internet) mit `Ctrl+Enter` oder **🏠 Lokale Anfrage**.

## Voraussetzungen

### 1. Ollama installieren

**macOS / Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Installer unter [ollama.com/download](https://ollama.com/download) herunterladen.

### 2. Modell laden

```bash
ollama pull gemma3:12b
```

Empfohlene Modelle je nach Hardware:

| Modell | RAM-Bedarf | Stärke |
|--------|-----------|--------|
| `gemma3:12b` | ~8 GB | Bestes Deutsch, wenig Halluzination – **Empfehlung** |
| `llama3.1:8b` | ~5 GB | Sehr stabil, breiter Einsatz |
| `qwen2.5:7b` | ~5 GB | Mehrsprachig, Strukturierung |
| `gemma3:4b` | ~3 GB | Für ältere/schwächere Hardware |

> **Hinweis zu Modellgrößen:** 7B- und 8B-Modelle neigen stärker zu Halluzinationen als 12B-Modelle. Für zuverlässiges Deutsch empfehlen wir `gemma3:12b` auf Systemen mit mindestens 16 GB RAM.

### 3. Ollama starten

Ollama läuft nach der Installation automatisch im Hintergrund. Prüfen mit:
```bash
ollama list
```

## Installation

### Via BRAT (empfohlen)

1. [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat) in Obsidian installieren und aktivieren
2. BRAT-Einstellungen öffnen → **Add Beta Plugin**
3. URL eingeben: `https://github.com/Geolech/obsidian-local-ollama`
4. **Add Plugin** klicken → Plugin aktivieren

### Manuell

1. Neueste Version unter [Releases](https://github.com/Geolech/obsidian-local-ollama/releases) herunterladen
2. `main.js`, `manifest.json` und `styles.css` in den Ordner `.obsidian/plugins/euria-obsidian/` im Vault kopieren
3. Obsidian neu starten → Plugin in den Einstellungen aktivieren

## Einrichtung

1. **Obsidian → Einstellungen → Lokales Ollama**
2. **Modell** aus der Dropdown-Liste wählen (wird automatisch von Ollama geladen)
3. Optional: System-Prompt anpassen

Das Plugin verbindet sich automatisch mit `http://localhost:11434` – keine weitere Konfiguration nötig.

## Tastenkürzel

| Aktion | Shortcut |
|--------|----------|
| Websuche starten | `Shift + Enter` |
| Lokale Anfrage senden | `Ctrl + Enter` |
| Chat leeren | Schaltfläche oben rechts |

## Lizenz

MIT – Frank Lechtenberg, TH OWL
