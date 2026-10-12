# Local Ollama with Web Search

> English version: [README.md](README.md)

Ein Obsidian-Plugin, das lokale KI-Modelle via [Ollama](https://ollama.com) direkt in Obsidian einbindet. Chat-Assistent mit Websuche, Vault-Integration, Dauerkontext und Daily-Note-Workflow. Vollständig lokal, keine Cloud, keine API-Kosten, keine Datenweitergabe.

![Obsidian Local Ollama Screenshot](https://raw.githubusercontent.com/Geolech/obsidian-local-ollama/main/screenshot.png)

## Features

### Chat und Websuche

- **Lokale Anfragen** – Chat mit dem lokalen Modell ohne Internetzugriff (`Ctrl+Enter` oder **🏠 Lokale Anfrage**)
- **Websuche direkt im Chat** – sucht via DuckDuckGo, speist Ergebnisse als Kontext ein, antwortet mit Quellenangaben `[1]`, `[2]` (`Shift+Enter` oder **🔍 Websuche**)
- **Notiz zusammenfassen** – aktuelle Notiz mit einem Klick komprimieren
- **Struktur vorschlagen** – Gliederung für die offene Notiz entwickeln
- **Notiz als Kontext laden** – Hintergrundwissen für den Chat bereitstellen

### Vault-Integration

- **💾 Chatverlauf speichern** – kompletten Chat als Markdown-Datei ablegen. Das Modell schlägt Ordner, Dateiname und Tags vor, du bestätigst im Modal. Autocomplete mit allen bestehenden Vault-Ordnern, Live-Preview, YAML-Frontmatter, KI-Callout, Konflikt-Suffix bei existierenden Dateien.
- **📅 Daily Note** – KI formuliert einen prägnanten Eintrag (H2-Überschrift, max 2 Absätze) aus dem aktuellen Chat und hängt ihn an die heutige Daily Note an. Pfadmuster mit `{YYYY}/{MM}/{DD}`-Platzhaltern konfigurierbar. Legt bei Bedarf Datei und Ordner an.
- **📂 Chat aus Notiz laden** – gespeicherte Ollama-Chat-Datei zurück ins Chat-Fenster laden und Dialog fortsetzen.

### Prompt-gesteuertes Speichern und Ordneranlegen

Seit Version 2.9.0 lassen sich zwei Dateisystem-Aktionen direkt im Chatfenster über natürlichsprachliche Phrasen auslösen, ohne das Speichern-Modal zu öffnen.

**Ordner anlegen**

Erkennt Formulierungen wie:

- „erstelle Ordner `04 Ressourcen/Testecke`"
- „leg einen neuen Ordner `02 Projekte/Buchprojekt` an"
- „erzeuge Unterordner `Rohdaten`"
- „mach Ordner `Archiv/2026`"

Der angegebene Pfad wird relativ zum Vault-Root interpretiert. Fehlende Zwischenordner werden rekursiv mit angelegt. Existiert der Ordner bereits, meldet das Plugin das als Hinweis zurück und legt nichts erneut an.

**Chat oder letzte Antwort in einen konkreten Ordner speichern**

Erkennt Formulierungen wie:

- „leg das in Ordner `02 Projekte/Buchprojekt` ab"
- „speicher die letzte Antwort in Ordner `01 Inbox`"
- „speicher das als `Setup-Notizen` in Ordner `04 Ressourcen/Testecke`"
- „leg die Antwort als `Checkliste` in Ordner `01 Inbox` ab"

Der Zielordner wird automatisch angelegt, falls er noch nicht existiert. Ein optionaler Dateiname lässt sich mit `als …` übergeben. Ohne Angabe leitet das Plugin den Titel aus den ersten Wörtern der ersten Nutzerfrage ab.

Das Wort `Ordner` muss im Prompt vorkommen – fehlt es, greift der Direkt-Speichern-Flow nicht und das Speichern-Modal öffnet sich stattdessen.

**Umfang: ganzer Chat oder nur letzte Antwort**

Enthält der Prompt eine Formulierung wie „letzte Antwort", „das Ergebnis" oder „die Antwort", speichert das Plugin nur das letzte Frage-Antwort-Paar statt des gesamten Verlaufs. In allen anderen Fällen wird der komplette Chatverlauf gesichert.

**Pfad-Validierung**

Alle Pfade werden vor dem Schreiben geprüft. Abgelehnt werden:

- leere Pfade
- absolute Pfade (führender `/`)
- relative Segmente (`.` oder `..`)
- Pfadsegmente mit den Zeichen `< > : " | ? *` oder Steuerzeichen

Ein ungültiger Pfad führt zu einer Hinweismeldung im Chat; es wird nichts geschrieben.

**Konfliktverhalten**

Existiert die Zieldatei bereits, erscheint eine Rückfrage im Chat mit vier Optionen:

- **Überschreiben** – ersetzt den gesamten Dateiinhalt durch den neuen Chat.
- **Anhängen** – hängt den Verlaufsteil (ab `## Verlauf`) an die bestehende Datei an, getrennt durch eine Trennlinie. Das Frontmatter der Zieldatei bleibt unangetastet.
- **Beide behalten (umbenennen)** – schreibt eine neue Datei mit Suffix `2`, `3`, … im selben Ordner.
- **Abbrechen** – schreibt nichts.

Die Konflikt-Rückfrage ist nicht Teil des gespeicherten Chats und überlebt keinen Neustart.

**Verhältnis zum bestehenden Speichern-Flow**

Der Header-Button „Chatverlauf" und die generischen Phrasen wie „speicher das" öffnen weiterhin das Speichern-Modal mit Modell-Vorschlag, Autocomplete und Vorschau. Die prompt-gesteuerten Varianten greifen nur, wenn ein konkreter Ordner im Prompt genannt wird – andernfalls fällt die Trigger-Logik auf das Modal zurück. Alle Trigger lassen sich gemeinsam über die Einstellung „Trigger-Phrasen aktiv" abschalten.

> Englische Prompt-Phrasen funktionieren gleichwertig. Beispiele siehe [README.md](README.md).

### Trigger-Phrasen

Natürlichsprachige Befehle öffnen die passenden Modals direkt im Chat. Alle Trigger auf Deutsch und Englisch:

| Phrase | Aktion |
|--------|--------|
| „speicher das", „leg das ab", „in Vault speichern" | Chatverlauf-Modal |
| „leg das in Ordner X ab", „speicher das in Ordner X" | Direkt-Speichern (ohne Modal) |
| „erstelle Ordner X", „leg Ordner X an" | Ordner anlegen |
| „halte das in einer Daily Note fest" | Daily-Note-Flow |
| „notier das für heute", „trag das in die Daily Note ein" | Daily-Note-Flow |
| „speichere das als Daily Note", „Tageseintrag" | Daily-Note-Flow |
| Jede Nachricht mit „Daily Note" | Daily-Note-Flow |

Deaktivierbar über die Einstellung „Trigger-Phrasen aktiv". Englische Entsprechungen stehen in [README.md](README.md).

### Vault-Setup

- **PARA-Ordnerstruktur anlegen** – `00 Kontext`, `01 Inbox`, `02 Projekte`, `03 Bereiche`, `04 Ressourcen`, `05 Daily Notes`, `06 Archiv`, `07 Anhänge`. Alternativ Minimal-Template (nur Inbox + Archiv). Checkboxen pro Ordner, bereits existierende Ordner werden erkannt.
- **Standard-Kontextdateien** – beim Anlegen von `00 Kontext` schreibt das Plugin drei Starter-Vorlagen rein: `Biographie.md`, `Schreibstil.md`, `Recherchevorgaben.md`.
- **Bestehende Ordner einsortieren** – nach dem Setup bietet das Plugin an, verbleibende Top-Level-Ordner in die PARA-Struktur zu verschieben oder umzubenennen. Zuordnungs-Modal pro Fremd-Ordner. Verschiebungen laufen über `fileManager.renameFile`, Wikilinks werden automatisch aktualisiert. Konflikt-Dialog pro Fall: Zusammenführen, Umbenennen oder Überspringen.

### Dauerkontext

Alle `.md`-Dateien aus `00 Kontext/` werden bei **jeder** Chat-Anfrage automatisch als Hintergrundkontext an das Modell übergeben. Dateinamen werden zu Zwischenüberschriften, Frontmatter wird entfernt. Harte Obergrenze bei 8000 Zeichen (konfigurierbar). So kennt die KI dich, deinen Schreibstil und deine Recherchevorgaben in jeder Session.

### Persistenz

Nachrichten und geladener Notiz-Kontext überleben Obsidian-Neustart. Letzter Chat ist nach dem Öffnen des Chat-Fensters sofort wieder da (Begrenzung: letzte 50 Nachrichten).

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

### Via Obsidian Community Plugin Store (empfohlen)

1. **Obsidian → Einstellungen → Community-Plugins → Durchsuchen**
2. Nach **„Local Ollama with Web Search"** suchen
3. **Installieren** → **Aktivieren**

Updates werden danach automatisch von Obsidian eingespielt.

### Via BRAT (für Beta-Versionen vor Store-Release)

1. [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat) in Obsidian installieren und aktivieren
2. BRAT-Einstellungen öffnen → **Add Beta Plugin**
3. URL eingeben: `https://github.com/Geolech/obsidian-local-ollama`
4. **Add Plugin** klicken → Plugin aktivieren

### Manuell

1. Neueste Version unter [Releases](https://github.com/Geolech/obsidian-local-ollama/releases) herunterladen
2. `main.js`, `manifest.json` und `styles.css` in den Ordner `.obsidian/plugins/local-ollama-websearch/` im Vault kopieren
3. Obsidian neu starten → Plugin in den Einstellungen aktivieren

## Einrichtung

1. **Obsidian → Einstellungen → Lokales Ollama**
2. **Modell** aus der Dropdown-Liste wählen (wird automatisch von Ollama geladen)
3. **Vault-Ersteinrichtung** (optional, einmalig): Button „Struktur anlegen…" unten im Settings-Tab → PARA-Ordner werden angelegt, Starter-Dateien in `00 Kontext/` geschrieben
4. **Kontextdateien befüllen:** `00 Kontext/Biographie.md`, `Schreibstil.md`, `Recherchevorgaben.md` mit deinen Inhalten füllen – ab dann kennt die KI dich in jeder Session

Das Plugin verbindet sich automatisch mit `http://localhost:11434` – keine weitere Konfiguration nötig.

## Tastenkürzel und Buttons

| Aktion | Shortcut / Button |
|--------|-------------------|
| Lokale Anfrage senden | `Ctrl + Enter` oder **🏠 Lokale Anfrage** |
| Websuche starten | `Shift + Enter` oder **🔍 Websuche** |
| Chatverlauf im Vault speichern | **💾 Chatverlauf** (Header) |
| Daily-Note-Eintrag | **📅 Daily Note** (Header) |
| Chat leeren | **Leeren** (Header) |
| Chat aus Notiz laden | **📂 Chat aus aktiver Notiz laden** (Quick Actions) |

Alle Aktionen zusätzlich als Command-Palette-Einträge verfügbar.

## Einstellungen (Übersicht)

- **Sprache** – Deutsch oder Englisch
- **Modell** – Dropdown aller lokal installierten Ollama-Modelle
- **System-Prompt** – Verhaltensanweisung, mit Reset auf Default
- **Speichern in Vault** – Fallback-Ordner, Trigger-Phrasen, Standard-Tags, Datei nach Speichern öffnen
- **Vault-Ersteinrichtung** – PARA-Setup und Nachsortieren bestehender Ordner
- **Kontext-Ordner** – Pfad, Toggle „automatisch laden", Max-Zeichen, Default-Dateien beim Setup
- **Daily Note** – Pfadmuster mit `{YYYY}`/`{MM}`/`{DD}`-Platzhaltern, Append-Default

## Lizenz

MIT – Frank Lechtenberg, TH OWL
