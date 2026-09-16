# Obsidian Local Ollama

Ein Obsidian-Plugin, das lokale KI-Modelle via [Ollama](https://ollama.com) direkt in Obsidian einbindet – als Schreib- und Strukturassistent, der vollständig lokal läuft. Keine Cloud, keine API-Kosten, keine Datenweitergabe.

![Obsidian Local Ollama Screenshot](https://raw.githubusercontent.com/Geolech/obsidian-local-ollama/main/screenshot.png)

## Features

- **Chat-Interface** als Sidebar-Panel direkt in Obsidian
- **Notiz zusammenfassen** – aktuelle Notiz mit einem Klick komprimieren
- **Struktur vorschlagen** – Gliederung für die offene Notiz entwickeln
- **Kontext laden** – Notiz als Hintergrundwissen für den Chat bereitstellen
- **Schreibstil-Prompt** – vorkonfiguriert gegen typische KI-Muster (kein aufgeblähter Stil, kein Nominalstil, keine Floskeln)
- **Vollständig lokal** – keine Cloud, kein API-Token, keine Telemetrie

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
2. `main.js`, `manifest.json` und `styles.css` in den Ordner `.obsidian/plugins/obsidian-local-ollama/` im Vault kopieren
3. Obsidian neu starten → Plugin in den Einstellungen aktivieren

## Einrichtung

1. **Obsidian → Einstellungen → Lokales Ollama**
2. **Modell** aus der Dropdown-Liste wählen (wird automatisch von Ollama geladen)
3. Optional: System-Prompt anpassen

Das Plugin verbindet sich automatisch mit `http://localhost:11434` – keine weitere Konfiguration nötig.

## Websuche hinzufügen (optional)

Das Plugin selbst unterstützt keine Websuche – Ollama kann nicht direkt im Internet suchen. Wer Websuche mit lokalen Modellen benötigt, kann **Open WebUI** parallel betreiben:

1. [Pinokio](https://pinokio.computer) installieren
2. In Pinokio **Open WebUI** suchen und installieren
3. Open WebUI öffnen → Admin Panel → Einstellungen → Websuche → **DDGS** (DuckDuckGo, kein API-Key nötig) aktivieren
4. Im Chat das **Websuche-Symbol** aktivieren

Open WebUI verbindet sich automatisch mit dem laufenden Ollama und nutzt dasselbe Modell. Das Plugin bleibt für schnelle Notiz-Arbeit direkt in Obsidian – Open WebUI für Recherche mit Internetanbindung.

## Tastenkürzel

| Aktion | Shortcut |
|--------|----------|
| Nachricht senden | `Shift + Enter` |
| Chat leeren | Schaltfläche oben rechts |

## Lizenz

MIT – Frank Lechtenberg, TH OWL
