/*
 * Lokales Ollama Obsidian Plugin
 * Lokale KI (Ollama) als Schreib- und Strukturassistent direkt in Obsidian.
 * Läuft ausschließlich lokal – keine Cloud, kein API-Token, keine Telemetrie.
 */

'use strict';

const { Plugin, PluginSettingTab, Setting, ItemView, MarkdownView, Modal, TFolder, Notice, requestUrl, addIcon } = require('obsidian');

const OLLAMA_VIEW_TYPE = 'euria-chat-view';
const OLLAMA_BASE_URL  = 'http://localhost:11434';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
    en: {
        title:           'Local Ollama',
        clear:           'Clear',
        placeholder:     'Message to Ollama…',
        send:            '🏠 Local Query',
        search:          '🔍 Web Search',
        hint:            'Shift+Enter = Web Search · Ctrl+Enter = Local Query',
        tagYou:          'You',
        tagOllama:       'Ollama',
        welcomeLine1:    'Your local AI assistant.',
        welcomeModel:    (m) => `Model: ${m}`,
        welcomeLine3:    'Load a note as context or ask a question.',
        btnSummarize:    '📋 Summarize current note',
        btnStructure:    '🏗️ Suggest structure for note',
        btnContext:      '📌 Load note as context',
        contextBar:      (t) => `📄 Context: ${t}`,
        noNote:          'No open note found. Please open a note in the editor.',
        noQuery:         'Please enter a search query in the text field first.',
        noResults:       'No search results found.',
        contextLoaded:   (t) => `📌 "${t}" loaded as context.`,
        searching:       '🔍 Searching…',
        processing:      '💬 Ollama is processing the results…',
        ollamaDown:      'Ollama not reachable. Is the service running? → ollama serve',
        ddgDown:         (s) => `DuckDuckGo not reachable (${s}).`,
        ollamaErr:       (s) => `Ollama error ${s}`,
        noResponse:      'No response received.',
        summarizePrompt: (c) => `Summarize this note concisely. Keep all key facts, structures and next steps:\n\n---\n${c}\n---`,
        summarizeLabel:  (t) => `📋 Summary of "${t}"`,
        structurePrompt: (c) => `Analyse this note and suggest an improved outline. Show main points and sub-points clearly:\n\n---\n${c}\n---`,
        structureLabel:  (t) => `🏗️ Structure suggestion for "${t}"`,
        searchPrompt:    (q, ctx) => `Answer the following question based on the search results. Cite sources as [1], [2] etc. Be clear and concise.\n\nQuestion: ${q}\n\nSearch results:\n${ctx}`,
        settingsTitle:   'Local Ollama – Settings',
        settingsConn:    (u) => `Connected to: ${u}`,
        settingsReq:     'Requirement: ',
        settingsReqText: (code, gh) => ['Ollama must be installed and running on your machine (', 'ollama.com', 'https://ollama.com', '). Then install a model, e.g. ', code, ' in your terminal. More info on ', 'GitHub', gh, '.'],
        settingsLang:    'Language',
        settingsLangD:   'Interface language',
        settingsModel:   'Model',
        settingsModelD:  'Locally installed Ollama models. Click ↻ to refresh.',
        settingsPrompt:  'System Prompt',
        settingsPromptD: 'Behavioral instruction for Ollama',
        settingsRefresh: '↻ Refresh',
        settingsReset:   'Reset to default',
        settingsResetD:  'Restore the built-in system prompt',
        ollamaOffline:   'Ollama not reachable. Please run "ollama serve".',
        ribbonTitle:     'Open Local Ollama',
        cmdOpen:         'Open Ollama Chat',
        cmdSummarize:    'Summarize current note',
        cmdStructure:    'Suggest structure for current note',
        cmdContext:      'Load current note as context',
        cmdSave:         'Save chat to vault',
        cmdSetup:        'Set up vault folder structure',
        cmdOrganize:     'Organize existing folders into structure',
        // Save-to-Vault
        saveBtn:              '💾 Chat log',
        dailyBtn:             '📅 Daily note',
        cmdDaily:             'Add chat as entry to today\'s daily note',
        dailyNothing:         'No messages to log yet.',
        dailyGenerating:      'Generating daily note entry…',
        dailyModalTitle:      'Add to daily note',
        dailyModalTarget:     'Target file',
        dailyModalMode:       'Mode',
        dailyModalAppend:     'Append to existing file',
        dailyModalCreate:     'Create new (only if missing)',
        dailyModalEntry:      'Entry (editable)',
        dailyModalCancel:     'Cancel',
        dailyModalSave:       'Add entry',
        dailyAppended:        (p) => `Appended to ${p}`,
        dailyCreated:         (p) => `Created ${p}`,
        dailyFailed:          (m) => `Daily note failed: ${m}`,
        dailyPromptInstruction: 'Write a concise daily note entry about the following conversation. Start with a level-2 heading. Maximum two short paragraphs. Active voice, no filler, no closing summary. German if the chat is German, English otherwise.',
        settingsDailySection: 'Daily note',
        settingsDailyPattern: 'Path pattern',
        settingsDailyPatternD:'Use {YYYY}, {MM}, {DD} as placeholders. Default: 05 Daily Notes/{YYYY}-{MM}/{YYYY}-{MM}-{DD}.md',
        settingsDailyAppend:  'Append by default',
        settingsDailyAppendD: 'When the daily note exists, append instead of asking',
        saveNothing:          'No messages to save yet.',
        saveModalTitle:       'Save chat to vault',
        saveModalFolder:      'Folder',
        saveModalFolderHint:  'Model suggestion · existing folders available in dropdown',
        saveModalFilename:    'Filename',
        saveModalFilenameHint: '.md is appended automatically',
        saveModalTags:        'Tags (optional, comma-separated)',
        saveModalPreview:     'Preview',
        saveModalOpenAfter:   'Open file after saving',
        saveModalCancel:      'Cancel',
        saveModalSave:        'Save',
        saveSuggesting:       'Suggesting folder…',
        savedNotice:          (p) => `Saved: ${p}`,
        saveFailed:           (m) => `Save failed: ${m}`,
        saveCalloutTitle:     'AI-generated content',
        saveCalloutBody:      (d, t, m) => `This chat was recorded on ${d} at ${t} with \`${m}\` via the "Local Ollama" plugin.`,
        saveHistoryHeading:   'Conversation',
        // Vault Setup
        settingsSaveSection:  'Save to vault',
        settingsSaveFallback: 'Fallback folder',
        settingsSaveFallbackD:'Used when no folder suggestion is available',
        settingsSaveTrigger:  'Trigger phrases active',
        settingsSaveTriggerD: 'Phrases like "save that" / "speicher das" open the save modal',
        settingsSaveTags:     'Default tags',
        settingsSaveTagsD:    'Comma-separated, always added to frontmatter',
        settingsSaveOpen:     'Open file after saving',
        settingsSaveOpenD:    'Opens the new note in the editor right after saving',
        settingsSetupSection: 'Vault setup',
        settingsSetupD:       'Creates a PARA-style folder structure in this vault. Folders only, no content.',
        settingsSetupBtn:     'Set up folder structure…',
        setupModalTitle:      'Set up vault structure',
        setupModalIntro:      'Creates a PARA-style folder structure in this vault. Only folders, no content. Existing folders are left untouched.',
        setupModalTemplate:   'Template',
        setupModalPara:       'PARA (recommended)',
        setupModalMinimal:    'Minimal (Inbox + Archive only)',
        setupModalCustom:     'Custom selection',
        setupModalFolders:    'Folders to be created',
        setupModalCancel:     'Cancel',
        setupModalCreate:     'Create structure',
        setupModalDone:       (c, s) => `${c} folder(s) created, ${s} already existed.`,
        setupModalOrganizeAsk:(n) => `${n} existing top-level folder(s) don't match the template. Organize now?`,
        setupModalOrganizeYes:'Organize now',
        setupModalOrganizeNo: 'Later',
        // Organize
        settingsOrganizeBtn:  'Organize existing folders…',
        settingsOrganizeD:    'Move or rename existing top-level folders into the PARA structure. Wikilinks are updated automatically.',
        organizeModalTitle:   'Organize existing folders',
        organizeModalIntro:   'These top-level folders don\'t match the PARA template. Choose for each what should happen. Wikilinks will be updated automatically.',
        organizeModalNone:    'All top-level folders already match the template. Nothing to organize.',
        organizeActionKeep:   'Keep as is',
        organizeActionMove:   'Move to',
        organizeActionRename: 'Rename to',
        organizeTargetPlaceholder: 'Target folder',
        organizeRenamePlaceholder: 'New name',
        organizeRun:          'Apply changes',
        organizeDone:         (m, r, s, f) => `Done: ${m} moved, ${r} renamed, ${s} skipped, ${f} failed.`,
        conflictModalTitle:   'Name conflict',
        conflictModalBody:    (src, dest) => `"${src}" cannot be placed at "${dest}" – a file or folder with that name already exists there.`,
        conflictMerge:        'Merge (move contents in)',
        conflictRename:       'Rename and move',
        conflictSkip:         'Skip',
        // Context folder
        settingsContextSection: 'Context folder',
        settingsContextFolder:  'Context folder path',
        settingsContextFolderD: 'Folder whose .md files are loaded into every chat session as background context',
        settingsContextEnabled: 'Load context folder automatically',
        settingsContextEnabledD:'Reads all .md files from the folder above and adds them to the system prompt',
        settingsContextMax:     'Max context size (characters)',
        settingsContextMaxD:    'Hard cap to keep the prompt manageable. Older content is truncated.',
        settingsContextDefaults:'Create default context files on setup',
        settingsContextDefaultsD:'When "00 Kontext" is newly created, write starter templates for Biography, Writing Style, Research Guidelines',
        contextLoadedHeader:    'Persistent user context (from vault folder)',
    },
    de: {
        title:           'Lokales Ollama',
        clear:           'Leeren',
        placeholder:     'Nachricht an Ollama…',
        send:            '🏠 Lokale Anfrage',
        search:          '🔍 Websuche',
        hint:            'Shift+Enter = Websuche · Ctrl+Enter = Lokale Anfrage',
        tagYou:          'Du',
        tagOllama:       'Ollama',
        welcomeLine1:    'Ich bin deine lokale KI.',
        welcomeModel:    (m) => `Modell: ${m}`,
        welcomeLine3:    'Lade eine Notiz als Kontext oder stelle eine Frage.',
        btnSummarize:    '📋 Aktuelle Notiz zusammenfassen',
        btnStructure:    '🏗️ Struktur für aktuelle Notiz vorschlagen',
        btnContext:      '📌 Aktuelle Notiz als Kontext laden',
        contextBar:      (t) => `📄 Kontext: ${t}`,
        noNote:          'Keine offene Notiz gefunden. Bitte eine Notiz im Editor öffnen.',
        noQuery:         'Bitte zuerst eine Suchanfrage ins Textfeld eingeben.',
        noResults:       'Keine Suchergebnisse gefunden.',
        contextLoaded:   (t) => `📌 "${t}" als Kontext geladen.`,
        searching:       '🔍 Suche läuft…',
        processing:      '💬 Ollama wertet die Ergebnisse aus…',
        ollamaDown:      'Ollama nicht erreichbar. Läuft der Dienst? → ollama serve',
        ddgDown:         (s) => `DuckDuckGo nicht erreichbar (${s}).`,
        ollamaErr:       (s) => `Ollama Fehler ${s}`,
        noResponse:      'Keine Antwort erhalten.',
        summarizePrompt: (c) => `Fasse diese Notiz prägnant zusammen. Behalte alle wichtigen Fakten, Strukturen und nächste Schritte:\n\n---\n${c}\n---`,
        summarizeLabel:  (t) => `📋 Zusammenfassung von „${t}"`,
        structurePrompt: (c) => `Analysiere diese Notiz und schlage eine verbesserte Gliederung vor. Zeige Hauptpunkte und Unterpunkte klar strukturiert:\n\n---\n${c}\n---`,
        structureLabel:  (t) => `🏗️ Strukturvorschlag für „${t}"`,
        searchPrompt:    (q, ctx) => `Beantworte die folgende Frage auf Basis der Suchergebnisse. Nenne die Quellen mit [1], [2] etc. Antworte klar und direkt.\n\nFrage: ${q}\n\nSuchergebnisse:\n${ctx}`,
        settingsTitle:   'Lokales Ollama – Einstellungen',
        settingsConn:    (u) => `Verbunden mit: ${u}`,
        settingsReq:     'Voraussetzung: ',
        settingsReqText: (code, gh) => ['Ollama muss auf deinem Rechner installiert sein und laufen (', 'ollama.com', 'https://ollama.com', '). Installiere danach ein Modell, z. B. ', code, ' im Terminal. Weitere Infos im ', 'GitHub-Repository', gh, '.'],
        settingsLang:    'Sprache',
        settingsLangD:   'Sprache der Benutzeroberfläche',
        settingsModel:   'Modell',
        settingsModelD:  'Lokal installierte Ollama-Modelle. Klicke ↻ um die Liste zu aktualisieren.',
        settingsPrompt:  'System-Prompt',
        settingsPromptD: 'Verhaltensanweisung für Ollama',
        settingsRefresh: '↻ Aktualisieren',
        settingsReset:   'Auf Standard zurücksetzen',
        settingsResetD:  'Eingebauten System-Prompt wiederherstellen',
        ollamaOffline:   'Ollama nicht erreichbar. Bitte "ollama serve" starten.',
        ribbonTitle:     'Ollama öffnen',
        cmdOpen:         'Ollama Chat öffnen',
        cmdSummarize:    'Aktuelle Notiz zusammenfassen',
        cmdStructure:    'Struktur für aktuelle Notiz vorschlagen',
        cmdContext:      'Aktuelle Notiz als Kontext laden',
        cmdSave:         'Chat im Vault speichern',
        cmdSetup:        'Vault-Ordnerstruktur einrichten',
        cmdOrganize:     'Vorhandene Ordner in Struktur einsortieren',
        // Save-to-Vault
        saveBtn:              '💾 Chatverlauf',
        dailyBtn:             '📅 Daily Note',
        cmdDaily:             'Chat an heutige Daily Note anhängen',
        dailyNothing:         'Noch keine Nachrichten zum Festhalten.',
        dailyGenerating:      'Daily-Note-Eintrag wird formuliert…',
        dailyModalTitle:      'In Daily Note eintragen',
        dailyModalTarget:     'Zieldatei',
        dailyModalMode:       'Modus',
        dailyModalAppend:     'An existierende Datei anhängen',
        dailyModalCreate:     'Neu anlegen (nur wenn nicht vorhanden)',
        dailyModalEntry:      'Eintrag (editierbar)',
        dailyModalCancel:     'Abbrechen',
        dailyModalSave:       'Eintrag anfügen',
        dailyAppended:        (p) => `Angefügt an ${p}`,
        dailyCreated:         (p) => `Angelegt: ${p}`,
        dailyFailed:          (m) => `Daily Note fehlgeschlagen: ${m}`,
        dailyPromptInstruction: 'Formuliere einen prägnanten Daily-Note-Eintrag zu diesem Gespräch. Beginne mit einer H2-Überschrift. Maximal zwei kurze Absätze. Aktiv formuliert, keine Füllwörter, kein Fazit-Baustein. Deutsch, wenn der Chat deutsch ist, sonst englisch.',
        settingsDailySection: 'Daily Note',
        settingsDailyPattern: 'Pfadmuster',
        settingsDailyPatternD:'Platzhalter {YYYY}, {MM}, {DD}. Default: 05 Daily Notes/{YYYY}-{MM}/{YYYY}-{MM}-{DD}.md',
        settingsDailyAppend:  'Standardmäßig anhängen',
        settingsDailyAppendD: 'Wenn die Daily Note existiert, direkt anhängen statt fragen',
        saveNothing:          'Noch keine Nachrichten zum Speichern vorhanden.',
        saveModalTitle:       'Chat im Vault speichern',
        saveModalFolder:      'Ordner',
        saveModalFolderHint:  'Vorschlag vom Modell · bestehende Ordner im Dropdown',
        saveModalFilename:    'Dateiname',
        saveModalFilenameHint:'.md wird automatisch angehängt',
        saveModalTags:        'Tags (optional, komma-getrennt)',
        saveModalPreview:     'Vorschau',
        saveModalOpenAfter:   'Nach dem Speichern Datei öffnen',
        saveModalCancel:      'Abbrechen',
        saveModalSave:        'Speichern',
        saveSuggesting:       'Ordnervorschlag wird erstellt…',
        savedNotice:          (p) => `Gespeichert: ${p}`,
        saveFailed:           (m) => `Speichern fehlgeschlagen: ${m}`,
        saveCalloutTitle:     'KI-generierter Inhalt',
        saveCalloutBody:      (d, t, m) => `Dieser Chat wurde am ${d} um ${t} Uhr mit \`${m}\` über das Plugin „Lokales Ollama" im Vault abgelegt.`,
        saveHistoryHeading:   'Verlauf',
        // Vault Setup
        settingsSaveSection:  'Speichern in Vault',
        settingsSaveFallback: 'Fallback-Ordner',
        settingsSaveFallbackD:'Wird genutzt, wenn kein Ordnervorschlag ermittelt werden kann',
        settingsSaveTrigger:  'Trigger-Phrasen aktiv',
        settingsSaveTriggerD: 'Phrasen wie „speicher das" / „leg das ab" öffnen das Speichern-Modal',
        settingsSaveTags:     'Standard-Tags',
        settingsSaveTagsD:    'Komma-getrennt, werden immer ans Frontmatter angehängt',
        settingsSaveOpen:     'Datei nach Speichern öffnen',
        settingsSaveOpenD:    'Öffnet die neue Notiz direkt im Editor',
        settingsSetupSection: 'Vault-Ersteinrichtung',
        settingsSetupD:       'Legt eine PARA-Ordnerstruktur in diesem Vault an. Nur Ordner, keine Inhalte.',
        settingsSetupBtn:     'Struktur anlegen…',
        setupModalTitle:      'Vault-Struktur einrichten',
        setupModalIntro:      'Legt eine PARA-Ordnerstruktur in diesem Vault an. Nur Ordner, keine Inhalte. Existierende Ordner bleiben unverändert.',
        setupModalTemplate:   'Vorlage',
        setupModalPara:       'PARA (empfohlen)',
        setupModalMinimal:    'Minimal (nur Inbox + Archiv)',
        setupModalCustom:     'Eigene Auswahl',
        setupModalFolders:    'Ordner, die angelegt werden',
        setupModalCancel:     'Abbrechen',
        setupModalCreate:     'Struktur anlegen',
        setupModalDone:       (c, s) => `${c} Ordner angelegt, ${s} existierten bereits.`,
        setupModalOrganizeAsk:(n) => `${n} bestehende Top-Level-Ordner passen nicht ins Template. Jetzt einsortieren?`,
        setupModalOrganizeYes:'Jetzt einsortieren',
        setupModalOrganizeNo: 'Später',
        // Organize
        settingsOrganizeBtn:  'Ordner einsortieren…',
        settingsOrganizeD:    'Verschiebe oder benenne bestehende Top-Level-Ordner in die PARA-Struktur. Wikilinks werden automatisch aktualisiert.',
        organizeModalTitle:   'Bestehende Ordner einsortieren',
        organizeModalIntro:   'Diese Top-Level-Ordner passen nicht ins PARA-Template. Wähle für jeden, was passieren soll. Wikilinks werden automatisch mitgezogen.',
        organizeModalNone:    'Alle Top-Level-Ordner passen bereits ins Template. Nichts einzusortieren.',
        organizeActionKeep:   'So lassen',
        organizeActionMove:   'Verschieben nach',
        organizeActionRename: 'Umbenennen in',
        organizeTargetPlaceholder: 'Zielordner',
        organizeRenamePlaceholder: 'Neuer Name',
        organizeRun:          'Änderungen ausführen',
        organizeDone:         (m, r, s, f) => `Fertig: ${m} verschoben, ${r} umbenannt, ${s} übersprungen, ${f} fehlgeschlagen.`,
        conflictModalTitle:   'Namenskonflikt',
        conflictModalBody:    (src, dest) => `„${src}" kann nicht nach „${dest}" verschoben werden – dort existiert bereits eine Datei oder ein Ordner mit dem Namen.`,
        conflictMerge:        'Zusammenführen (Inhalte verschieben)',
        conflictRename:       'Umbenennen und verschieben',
        conflictSkip:         'Überspringen',
        // Kontext-Ordner
        settingsContextSection: 'Kontext-Ordner',
        settingsContextFolder:  'Pfad zum Kontext-Ordner',
        settingsContextFolderD: 'Ordner, dessen .md-Dateien bei jeder Chat-Session als Hintergrundkontext geladen werden',
        settingsContextEnabled: 'Kontext-Ordner automatisch laden',
        settingsContextEnabledD:'Liest alle .md-Dateien aus dem obigen Ordner und hängt sie an den System-Prompt',
        settingsContextMax:     'Maximalgröße (Zeichen)',
        settingsContextMaxD:    'Harte Obergrenze, damit der Prompt nicht explodiert. Überlange Inhalte werden gekürzt.',
        settingsContextDefaults:'Standard-Kontextdateien beim Setup anlegen',
        settingsContextDefaultsD:'Legt beim Anlegen von „00 Kontext" Vorlagen für Biographie, Schreibstil und Recherchevorgaben an',
        contextLoadedHeader:    'Dauerkontext (aus Vault-Ordner)',
    },
};

const DEFAULT_SYSTEM_PROMPT = `You are a precise writing and structuring assistant. You help with summarizing, structuring, and elaborating on texts – clearly and directly. Respond in the language the user writes in.

WRITING STYLE (always follow):
- Active voice instead of passive
- Prefer short sentences – two short ones over one long one
- No filler words: "already", "of course", "naturally", "basically"
- No em-dash sentence connectors
- Concrete and vivid: examples instead of abstract descriptions
- Avoid nominalization: not "the implementation of" but "to implement"
- No passive constructions: not "was created" but "I created"

AVOID AI PATTERNS:
- No inflated language: not "plays a significant role"
- No marketing speak: not "seamless", not "game-changing"
- Use dashes sparingly – never more than one per paragraph
- No closing summary or repetitive conclusion
- No conversational filler: no "Sure!", "I hope this helps"
- Never invent sources or facts

Answer precisely and without preamble. The content matters, not the announcement.

---

Du bist ein präziser Schreib- und Strukturassistent. Du hilfst beim Zusammenfassen, Strukturieren und Ausarbeiten von Texten – klar und direkt. Antworte in der Sprache, in der der Nutzer schreibt.

SCHREIBSTIL (immer einhalten):
- Aktiv statt Passiv
- Kurze Sätze bevorzugen – lieber zwei kurze als einen langen
- Keine Füllwörter: "bereits", "natürlich", "selbstverständlich", "eigentlich"
- Keine Bindestrich-Sätze als Satzverbinder
- Konkret und anschaulich: Beispiele statt abstrakte Beschreibungen
- Nominalstil vermeiden: nicht "die Durchführung von", sondern "durchführen"
- Kein Passiv: nicht "wurde erstellt", sondern aktiv formulieren

KI-MUSTER VERMEIDEN:
- Keine aufgeblähte Bedeutungssprache: nicht "spielt eine bedeutende Rolle"
- Keine Werbesprache: nicht "atemberaubend", nicht "nahtlos"
- Gedankenstriche sparsam – nie mehrere pro Absatz
- Kein Fazit-Baustein am Ende, keine schließende Wiederholung
- Keine Dialog-Reste: kein "Gerne!", "Ich hoffe, das hilft"
- Erfinde keine Quellen oder Fakten

Antworte präzise und ohne Selbstinszenierung. Der Text zählt, nicht die Ankündigung.`;

const DEFAULT_SETTINGS = {
    model:        'gemma3:12b',
    language:     'en',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    // Save-to-Vault
    saveFallbackFolder: '01 Inbox',
    saveTriggerEnabled: true,
    saveDefaultTags:    'ollama, ki-generiert',
    saveOpenAfter:      false,
    // Kontext-Ordner
    contextFolder:          '00 Kontext',
    contextFolderEnabled:   true,
    contextFolderMaxChars:  8000,
    contextCreateDefaults:  true,
    // Daily Note
    dailyNotePattern:  '05 Daily Notes/{YYYY}-{MM}/{YYYY}-{MM}-{DD}.md',
    dailyNoteAppend:   true,
};

// PARA-Vorlagen für die Vault-Ersteinrichtung
const SETUP_TEMPLATES = {
    para: [
        '00 Kontext',
        '01 Inbox',
        '02 Projekte',
        '03 Bereiche',
        '04 Ressourcen',
        '05 Daily Notes',
        '06 Archiv',
        '07 Anhänge',
    ],
    minimal: [
        '01 Inbox',
        '06 Archiv',
    ],
};

// Standard-Kontextdateien, die beim Anlegen von 00 Kontext mitgeschrieben werden.
// Generische Vorlagen – jeder Nutzer befüllt sie mit eigenem Inhalt.
const CONTEXT_FILE_TEMPLATES = {
    'Biographie.md': `---
title: Biographie
type: kontext
---

# Biographie

Beschreibe hier knapp, wer du bist. Die KI nutzt diese Angaben, um Antworten
auf deine Rolle, dein Fachgebiet und deinen Alltag zuzuschneiden.

## Beruf und Rolle

(Beruf, aktuelle Position, Arbeitgeber, Verantwortungsbereich)

## Fachlicher Hintergrund

(Studium, Promotion, Spezialisierungen, Fachgebiete)

## Projekte und Schwerpunkte

(Was dich gerade beschäftigt, aktive Projekte, langfristige Themen)

## Was die KI über dich wissen sollte

(Besonderheiten, Vorlieben, blinde Flecken, Dinge die bei Antworten
berücksichtigt werden sollen)
`,
    'Schreibstil.md': `---
title: Schreibstil
type: kontext
---

# Schreibstil

Diese Regeln gelten für alle Texte, die die KI für dich schreibt oder
überarbeitet – egal ob Chatantwort, Entwurf oder Zusammenfassung.

## Grundregeln

- Aktiv statt Passiv
- Kurze Sätze bevorzugen
- Keine Füllwörter („bereits", „natürlich", „selbstverständlich")
- Keine Bindestrich-Sätze als Satzverbinder
- „KI" statt „AI" im Deutschen

## Ansprache

(Du oder Sie – gegebenenfalls je nach Kontext unterschiedlich)

## Tonalität

(Locker, formell, sachlich, warm – was passt zu dir?)

## Was zu vermeiden ist

- Keine Werbesprache („nahtlos", „bahnbrechend", „atemberaubend")
- Keine Dialog-Reste („Gerne!", „Ich hoffe, das hilft")
- Keine schließenden Zusammenfassungs-Absätze
- Keine Emojis in formellen Texten
`,
    'Recherchevorgaben.md': `---
title: Recherchevorgaben
type: kontext
---

# Recherchevorgaben

Diese Regeln gelten für jede Recherche, Faktenaussage und Quellenangabe.

## Keine Halluzination

- Keine Quellen, Zitate oder Fakten erfinden
- Wenn eine Information nicht sicher belegbar ist: ausdrücklich sagen
- Bei Unsicherheit nachfragen statt raten
- Lieber „weiß ich nicht" als eine plausible Erfindung

## Quellenprüfung

- Quellen nennen, wenn vorhanden
- Zwischen Primär- und Sekundärquelle unterscheiden
- Alter von Quellen angeben, wenn das die Aussage beeinflusst
- Bei widersprüchlichen Quellen den Konflikt benennen, nicht glätten

## Nachvollziehbarkeit

- Argumentation zeigen, nicht nur Behauptung
- Zahlen und Daten mit Zeitraum oder Stichtag versehen
- Zwischen Fakt, Interpretation und Meinung klar trennen

## Umgang mit Unsicherheit

- Konfidenz offen kommunizieren („sicher belegt" / „plausibel, nicht geprüft" / „Vermutung")
- Keine Scheinsicherheit durch Formulierungen wie „bekanntermaßen" oder „natürlich"
`,
};

// Trigger-Phrasen für den Speichern-Flow (case-insensitive)
const SAVE_TRIGGER_PATTERNS = [
    /\bspeicher(e|st)?\s+(das|dies(es)?|den\s+chat|die\s+(antwort|notiz))/i,
    /\bleg(e|st)?\s+(das|dies(es)?|den\s+chat)\s+.{0,20}(vault|ab)/i,
    /\bals\s+notiz\s+(ab)?speichern/i,
    /\bin\s+(den\s+|meinen?\s+)?vault\s+(ab)?speichern/i,
    /\bsave\s+(this|that|the\s+chat)\s+(to|in)\s+(my\s+)?vault/i,
    /\bsave\s+(this|that)\s+as\s+(a\s+)?note/i,
];

// ─── Chat View ───────────────────────────────────────────────────────────────

class OllamaChatView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin   = plugin;
        this.messages = [];          // { role, content, apiContent }
        this.noteContext = null;     // { title, content }
        this.isLoading   = false;
    }

    getViewType()    { return OLLAMA_VIEW_TYPE; }
    getDisplayText() { return 'Local Ollama'; }
    getIcon()        { return 'ollama-llama'; }

    async onOpen()  { this.render(); }
    async onClose() {}

    render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('euria-chat-container');

        this._renderHeader(container);
        if (this.noteContext) this._renderContextBar(container);
        this._renderMessages(container);
        this._renderQuickActions(container);
        this._renderInputArea(container);
    }

    _renderHeader(container) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const header = container.createDiv('euria-header');
        header.createEl('span', { text: `🦙 ${t.title}`, cls: 'euria-title' });

        const controls = header.createDiv('euria-header-controls');

        // Sprach-Toggle EN / DE
        const langToggle = controls.createEl('button', {
            text: this.plugin.settings.language === 'en' ? 'DE' : 'EN',
            cls: 'euria-lang-btn',
        });
        langToggle.onclick = async () => {
            this.plugin.settings.language = this.plugin.settings.language === 'en' ? 'de' : 'en';
            await this.plugin.saveSettings();
            this.render();
        };

        const saveBtn = controls.createEl('button', { text: t.saveBtn, cls: 'euria-save-btn' });
        saveBtn.onclick = () => this.openSaveModal();

        const dailyBtn = controls.createEl('button', { text: t.dailyBtn, cls: 'euria-save-btn' });
        dailyBtn.onclick = () => this.openDailyNoteFlow();

        const clearBtn = controls.createEl('button', { text: t.clear, cls: 'euria-clear-btn' });
        clearBtn.onclick = () => {
            this.messages    = [];
            this.noteContext = null;
            this.render();
        };
    }

    _renderContextBar(container) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const bar = container.createDiv('euria-context-bar');
        bar.createEl('span', { text: t.contextBar(this.noteContext.title) });
        const rm = bar.createEl('button', { text: '✕', cls: 'euria-ctx-remove' });
        rm.onclick = () => { this.noteContext = null; this.render(); };
    }

    _renderMessages(container) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const messagesEl = container.createDiv('euria-messages');

        if (this.messages.length === 0) {
            const ph = messagesEl.createDiv('euria-placeholder');
            ph.createEl('p', { text: t.welcomeLine1 });
            ph.createEl('p', { text: t.welcomeModel(this.plugin.settings.model) });
            ph.createEl('p', { text: t.welcomeLine3 });
            return;
        }

        for (const msg of this.messages) {
            const msgEl = messagesEl.createDiv(`euria-message euria-message-${msg.role}`);
            msgEl.createEl('div', { text: msg.role === 'user' ? t.tagYou : t.tagOllama, cls: 'euria-message-label' });
            msgEl.createEl('div', { text: msg.content, cls: 'euria-message-content' });
        }

        requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
    }

    _renderQuickActions(container) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const actions = container.createDiv('euria-quick-actions');
        const btn = (text, fn) => {
            const b = actions.createEl('button', { text, cls: 'euria-action-btn' });
            b.onclick = fn;
        };
        btn(t.btnSummarize, () => this.summarizeCurrentNote());
        btn(t.btnStructure, () => this.structureCurrentNote());
        btn(t.btnContext,   () => this.loadNoteAsContext());
    }

    _renderInputArea(container) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const area     = container.createDiv('euria-input-area');
        const textarea = area.createEl('textarea', {
            cls:  'euria-input',
            attr: { placeholder: t.placeholder, rows: '3' },
        });
        this._textarea = textarea;

        const footer    = area.createDiv('euria-input-footer');
        const searchBtn = footer.createEl('button', { text: t.search, cls: 'euria-action-btn' });
        const sendBtn   = footer.createEl('button', { text: t.send,   cls: 'euria-send-btn' });
        area.createEl('p', { text: t.hint, cls: 'euria-hint' });

        const send = async () => {
            const text = textarea.value.trim();
            if (!text || this.isLoading) return;

            // Trigger-Phrasen für Speichern erkennen – öffnet Modal statt Prompt an Ollama
            if (this.plugin.settings.saveTriggerEnabled && this._matchesSaveTrigger(text)) {
                textarea.value = '';
                this.openSaveModal();
                return;
            }

            textarea.value = '';
            await this.sendMessage(text);
        };

        sendBtn.onclick   = send;
        searchBtn.onclick = () => this.startWebSearch();
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault(); e.stopPropagation();
                this.startWebSearch();
            } else if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault(); e.stopPropagation();
                send();
            }
        });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    async loadNoteAsContext() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const file = this._getActiveFile();
        if (!file) return;
        const content    = await this.app.vault.read(file);
        this.noteContext = { title: file.basename, content };
        this.render();
        new Notice(t.contextLoaded(file.basename));
    }

    async summarizeCurrentNote() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        await this.sendMessage(t.summarizePrompt(content), t.summarizeLabel(file.basename));
    }

    async structureCurrentNote() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        await this.sendMessage(t.structurePrompt(content), t.structureLabel(file.basename));
    }

    // ─── Web Search ──────────────────────────────────────────────────────────

    startWebSearch() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        if (this.isLoading) return;
        const query = this._textarea?.value?.trim();
        if (!query) {
            new Notice(t.noQuery);
            return;
        }
        this._textarea.value = '';
        this.webSearch(query);
    }

    async webSearch(query) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        this.isLoading = true;
        this.messages.push({ role: 'user',      content: `🔍 ${query}`, apiContent: query });
        this.messages.push({ role: 'assistant', content: t.searching });
        this.render();

        try {
            const results = await this._fetchDDGResults(query);
            if (!results.length) throw new Error(t.noResults);

            // Ergebnisse als lesbaren Kontext aufbereiten
            const context = results
                .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
                .join('\n\n');

            const prompt = t.searchPrompt(query, context);

            // Lademeldung durch Ollama-Antwort ersetzen
            this.messages[this.messages.length - 1] = {
                role: 'assistant', content: t.processing
            };
            this.render();

            const apiMessages = await this._buildApiMessages(prompt);
            // Letzten Dummy-Eintrag aus History entfernen (wird durch API-Call ersetzt)
            apiMessages.pop();
            apiMessages.push({ role: 'user', content: prompt });

            const response = await requestUrl({
                url:    `${OLLAMA_BASE_URL}/v1/chat/completions`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:       this.plugin.settings.model,
                    messages:    apiMessages,
                    max_tokens:  2048,
                    temperature: 0.7,
                }),
                throw: false,
            });

            if (response.status === 0 || response.status >= 500) {
                throw new Error(t.ollamaDown);
            }
            if (response.status >= 400) {
                throw new Error(t.ollamaErr(response.status));
            }

            const reply = response.json?.choices?.[0]?.message?.content?.trim() || t.noResponse;
            this.messages[this.messages.length - 1] = { role: 'assistant', content: reply };

        } catch (err) {
            const errMsg = `❌ ${err.message}`;
            this.messages[this.messages.length - 1] = { role: 'assistant', content: errMsg };
            new Notice(errMsg);
        }

        this.isLoading = false;
        this.render();
    }

    async _fetchDDGResults(query) {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=de-de`;
        const response = await requestUrl({
            url,
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
            throw: false,
        });

        if (response.status !== 200) throw new Error(I18N[this.plugin.settings.language]?.ddgDown(response.status) ?? I18N.en.ddgDown(response.status));

        const parser = new DOMParser();
        const doc    = parser.parseFromString(response.text, 'text/html');

        const results  = [];
        const titles   = doc.querySelectorAll('.result__a');
        const snippets = doc.querySelectorAll('.result__snippet');
        const urls     = doc.querySelectorAll('.result__url');

        for (let i = 0; i < Math.min(5, snippets.length); i++) {
            const title   = titles[i]?.textContent?.trim()   || '';
            const snippet = snippets[i]?.textContent?.trim() || '';
            const url     = urls[i]?.textContent?.trim()     || '';
            if (snippet) results.push({ title, snippet, url });
        }

        return results;
    }

    _getActiveFile() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView?.file) return activeView.file;

        let found = null;
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file) found = leaf.view.file;
        });

        if (!found) {
            new Notice(t.noNote);
            return null;
        }
        return found;
    }

    // ─── Ollama API ───────────────────────────────────────────────────────────

    async sendMessage(userText, displayText = null) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const display = displayText || userText;
        this.isLoading = true;

        const apiMessages = await this._buildApiMessages(userText);
        this.messages.push({ role: 'user',      content: display,   apiContent: userText });
        this.messages.push({ role: 'assistant', content: '⏳ …' });
        this.render();

        try {
            const response = await requestUrl({
                url:    `${OLLAMA_BASE_URL}/v1/chat/completions`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:       this.plugin.settings.model,
                    messages:    apiMessages,
                    max_tokens:  2048,
                    temperature: 0.7,
                }),
                throw: false,
            });

            if (response.status === 0 || response.status >= 500) {
                throw new Error(t.ollamaDown);
            }
            if (response.status >= 400) {
                throw new Error(t.ollamaErr(response.status));
            }

            const reply = response.json?.choices?.[0]?.message?.content?.trim() || t.noResponse;
            this.messages[this.messages.length - 1] = { role: 'assistant', content: reply };

        } catch (err) {
            const errMsg = `❌ ${err.message}`;
            this.messages[this.messages.length - 1] = { role: 'assistant', content: errMsg };
            new Notice(errMsg);
        }

        this.isLoading = false;
        this.render();
    }

    // ─── Save to Vault ────────────────────────────────────────────────────────

    _matchesSaveTrigger(text) {
        return SAVE_TRIGGER_PATTERNS.some(rx => rx.test(text));
    }

    openSaveModal() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        if (!this.messages.length) {
            new Notice(t.saveNothing);
            return;
        }
        new SaveToVaultModal(this.app, this.plugin, this, t).open();
    }

    /**
     * Fragt das Modell nach einem Ordner + Dateinamen für den aktuellen Chat.
     * Rückgabe: { folder, filename, tags } oder null bei Fehler.
     */
    async suggestSavePath() {
        const folders = this._listAllFolders();
        const folderList = folders.length ? folders.join('\n') : '(empty vault)';
        const chatSnippet = this.messages
            .slice(-8)
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${(m.apiContent || m.content).slice(0, 500)}`)
            .join('\n\n');

        const prompt = `You receive a chat history and a list of existing vault folders. Respond ONLY with valid JSON, no prose, no code fences:

{"folder": "path/to/folder", "filename": "Filename without .md", "tags": ["tag1","tag2"]}

Rules:
- folder MUST be one of the listed folders, OR a new subfolder under a listed one (e.g. "02 Projekte/New Topic")
- filename: 3-7 words, describes the main topic, German capitalization if the chat is in German
- tags: 2-4 lowercase tags, hyphenate multi-word tags
- Do NOT wrap the JSON in markdown or add explanations.

Existing folders:
${folderList}

Chat:
${chatSnippet}`;

        try {
            const response = await requestUrl({
                url:    `${OLLAMA_BASE_URL}/v1/chat/completions`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:       this.plugin.settings.model,
                    messages:    [{ role: 'user', content: prompt }],
                    max_tokens:  300,
                    temperature: 0.2,
                }),
                throw: false,
            });
            if (response.status >= 400 || response.status === 0) return null;
            const raw = response.json?.choices?.[0]?.message?.content?.trim() || '';
            const json = this._extractJson(raw);
            if (!json || typeof json.folder !== 'string' || typeof json.filename !== 'string') return null;
            return {
                folder:   this._sanitizeFolder(json.folder),
                filename: this._sanitizeFilename(json.filename),
                tags:     Array.isArray(json.tags) ? json.tags.map(x => String(x).toLowerCase()).filter(Boolean) : [],
            };
        } catch (_) {
            return null;
        }
    }

    _extractJson(text) {
        // Entferne Code-Fences falls das Modell doch welche setzt
        let cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const first = cleaned.indexOf('{');
        const last  = cleaned.lastIndexOf('}');
        if (first === -1 || last === -1) return null;
        try { return JSON.parse(cleaned.slice(first, last + 1)); } catch (_) { return null; }
    }

    _listAllFolders() {
        const result = [];
        const walk = (folder) => {
            for (const child of folder.children || []) {
                if (child instanceof TFolder) {
                    result.push(child.path);
                    walk(child);
                }
            }
        };
        walk(this.app.vault.getRoot());
        return result.sort();
    }

    _sanitizeFolder(path) {
        return String(path)
            .replace(/\\/g, '/')
            .split('/')
            .map(seg => seg.replace(/[:*?"<>|]/g, '').trim())
            .filter(seg => seg && seg !== '..' && seg !== '.')
            .join('/');
    }

    _sanitizeFilename(name) {
        return String(name)
            .replace(/\.md$/i, '')
            .replace(/[\\/:*?"<>|]/g, '')
            .trim()
            .slice(0, 120) || 'Ollama Chat';
    }

    /**
     * Baut die endgültige Markdown-Datei aus dem aktuellen Chat.
     */
    buildMarkdownContent({ title, tags }) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const allTags = Array.from(new Set([...(tags || [])].map(x => String(x).toLowerCase().trim()).filter(Boolean)));

        const fm = ['---'];
        fm.push(`title: ${title}`);
        fm.push(`date: ${dateStr}`);
        fm.push(`time: ${timeStr}`);
        if (allTags.length) {
            fm.push('tags:');
            for (const tag of allTags) fm.push(`  - ${tag}`);
        }
        fm.push('source: Lokales Ollama Plugin');
        fm.push(`model: ${this.plugin.settings.model}`);
        if (this.noteContext?.title) fm.push(`context-note: ${this.noteContext.title}`);
        fm.push('---');

        const lines = [fm.join('\n'), '', `# ${title}`, ''];
        lines.push(`> [!info] ${t.saveCalloutTitle}`);
        lines.push(`> ${t.saveCalloutBody(dateStr, timeStr, this.plugin.settings.model)}`);
        lines.push('', `## ${t.saveHistoryHeading}`, '');

        for (const msg of this.messages) {
            const heading = msg.role === 'user' ? t.tagYou : t.tagOllama;
            lines.push(`### ${heading}`, '', msg.content, '');
        }

        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    /**
     * Schreibt die Datei. Legt fehlende Ordner an, hängt Suffix an bei Konflikt.
     * Rückgabe: finaler Pfad.
     */
    async writeMarkdownToVault(folderPath, filename, content) {
        const cleanFolder = this._sanitizeFolder(folderPath);
        const cleanName   = this._sanitizeFilename(filename);

        if (cleanFolder) await this._ensureFolder(cleanFolder);

        let finalPath = cleanFolder ? `${cleanFolder}/${cleanName}.md` : `${cleanName}.md`;
        let counter = 2;
        while (this.app.vault.getAbstractFileByPath(finalPath)) {
            finalPath = cleanFolder
                ? `${cleanFolder}/${cleanName} ${counter}.md`
                : `${cleanName} ${counter}.md`;
            counter++;
            if (counter > 999) throw new Error('Too many filename conflicts');
        }

        await this.app.vault.create(finalPath, content);
        return finalPath;
    }

    async _ensureFolder(path) {
        if (!path) return;
        if (this.app.vault.getAbstractFileByPath(path)) return;
        // Rekursiv Teile anlegen, falls createFolder nicht rekursiv unterstützt wird
        const parts = path.split('/').filter(Boolean);
        let current = '';
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!this.app.vault.getAbstractFileByPath(current)) {
                try { await this.app.vault.createFolder(current); } catch (_) { /* existiert evtl. parallel */ }
            }
        }
    }

    // ─── Daily Note ───────────────────────────────────────────────────────────

    async openDailyNoteFlow() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        if (!this.messages.length) { new Notice(t.dailyNothing); return; }

        new Notice(t.dailyGenerating);
        const entry = await this._generateDailyNoteEntry();
        new DailyNoteModal(this.app, this.plugin, this, t, entry).open();
    }

    async _generateDailyNoteEntry() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const chatSnippet = this.messages
            .slice(-10)
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${(m.apiContent || m.content).slice(0, 800)}`)
            .join('\n\n');
        const prompt = `${t.dailyPromptInstruction}\n\n---\n${chatSnippet}\n---`;

        try {
            const response = await requestUrl({
                url:    `${OLLAMA_BASE_URL}/v1/chat/completions`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:       this.plugin.settings.model,
                    messages:    [{ role: 'user', content: prompt }],
                    max_tokens:  500,
                    temperature: 0.5,
                }),
                throw: false,
            });
            if (response.status >= 400 || response.status === 0) return this._fallbackEntry();
            const raw = (response.json?.choices?.[0]?.message?.content || '').trim();
            if (!raw) return this._fallbackEntry();
            // Falls das Modell keinen H2-Header liefert, einen Default-Header voranstellen
            return /^##\s/m.test(raw) ? raw : `## ${this._timeHeader()}\n\n${raw}`;
        } catch (_) {
            return this._fallbackEntry();
        }
    }

    _fallbackEntry() {
        const last = [...this.messages].reverse().find(m => m.role === 'assistant');
        const content = last?.content || '';
        return `## ${this._timeHeader()}\n\n${content.slice(0, 1000)}`;
    }

    _timeHeader() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `Chat-Eintrag ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }

    resolveDailyNotePath() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const Y = String(now.getFullYear());
        const M = pad(now.getMonth() + 1);
        const D = pad(now.getDate());
        const pattern = this.plugin.settings.dailyNotePattern || '05 Daily Notes/{YYYY}-{MM}/{YYYY}-{MM}-{DD}.md';
        return pattern.replace(/\{YYYY\}/g, Y).replace(/\{MM\}/g, M).replace(/\{DD\}/g, D);
    }

    /**
     * Schreibt den Eintrag an die Daily Note. Legt Datei + Ordner an falls fehlt.
     * mode: 'append' oder 'create'
     * Rückgabe: { path, mode }
     */
    async writeDailyNoteEntry(path, mode, entry) {
        const parent = path.split('/').slice(0, -1).join('/');
        if (parent) await this._ensureFolder(parent);

        const existing = this.app.vault.getAbstractFileByPath(path);
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        if (existing) {
            if (mode === 'create') throw new Error('Datei existiert bereits');
            const prev = await this.app.vault.read(existing);
            const joined = prev.replace(/\n+$/, '') + '\n\n' + entry.trim() + '\n';
            await this.app.vault.modify(existing, joined);
            return { path, mode: 'append' };
        }

        const frontmatter = `---\ndate: ${dateStr}\ntags: [daily]\n---\n\n# ${dateStr}\n\n`;
        await this.app.vault.create(path, frontmatter + entry.trim() + '\n');
        return { path, mode: 'create' };
    }

    async _buildApiMessages(newUserText) {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        let systemContent = this.plugin.settings.systemPrompt;

        // Dauerkontext aus 00 Kontext (oder konfiguriertem Ordner) laden
        if (this.plugin.settings.contextFolderEnabled) {
            const folderContext = await this._loadContextFolder();
            if (folderContext) {
                systemContent += `\n\n[${t.contextLoadedHeader}]\n${folderContext}`;
            }
        }

        if (this.noteContext) {
            const snippet = this.noteContext.content.length > 6000
                ? this.noteContext.content.substring(0, 6000) + '\n[…gekürzt]'
                : this.noteContext.content;
            systemContent += `\n\nAktuell geladener Notiz-Kontext (${this.noteContext.title}):\n---\n${snippet}\n---`;
        }

        const msgs = [{ role: 'system', content: systemContent }];
        for (const msg of this.messages.slice(-6)) {
            msgs.push({ role: msg.role, content: msg.apiContent || msg.content });
        }
        msgs.push({ role: 'user', content: newUserText });
        return msgs;
    }

    /**
     * Liest alle .md-Dateien aus dem Kontext-Ordner (rekursiv),
     * sortiert alphabetisch, und baut daraus einen Prompt-Block.
     * Respektiert das Zeichen-Limit aus den Einstellungen.
     * Rückgabe: zusammengesetzter String oder null wenn Ordner fehlt / leer.
     */
    async _loadContextFolder() {
        const folderPath = (this.plugin.settings.contextFolder || '').trim();
        if (!folderPath) return null;
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (!folder || !(folder instanceof TFolder)) return null;

        const mdFiles = [];
        const walk = (f) => {
            for (const child of f.children || []) {
                if (child instanceof TFolder) walk(child);
                else if (child.extension === 'md') mdFiles.push(child);
            }
        };
        walk(folder);
        if (!mdFiles.length) return null;

        mdFiles.sort((a, b) => a.path.localeCompare(b.path));

        const maxChars = Math.max(1000, Number(this.plugin.settings.contextFolderMaxChars) || 8000);
        const parts = [];
        let used = 0;
        for (const file of mdFiles) {
            try {
                const raw = await this.app.vault.cachedRead(file);
                // Frontmatter entfernen, nur Textinhalt reinnehmen
                const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
                if (!body) continue;
                const header = `## ${file.basename}`;
                const block = `${header}\n${body}`;
                if (used + block.length > maxChars) {
                    const remaining = maxChars - used - header.length - 20;
                    if (remaining > 200) {
                        parts.push(`${header}\n${body.slice(0, remaining)}\n[…gekürzt]`);
                    }
                    break;
                }
                parts.push(block);
                used += block.length + 2;
            } catch (_) { /* Datei nicht lesbar – überspringen */ }
        }
        return parts.join('\n\n');
    }
}

// ─── Save-to-Vault Modal ──────────────────────────────────────────────────────

class SaveToVaultModal extends Modal {
    constructor(app, plugin, view, t) {
        super(app);
        this.plugin = plugin;
        this.view   = view;
        this.t      = t;
        this.folder   = plugin.settings.saveFallbackFolder || '01 Inbox';
        this.filename = 'Ollama Chat';
        this.tags     = plugin.settings.saveDefaultTags || '';
        this.openAfter = !!plugin.settings.saveOpenAfter;
    }

    async onOpen() {
        const t = this.t;
        const { contentEl, titleEl } = this;
        titleEl.setText(`🦙 ${t.saveModalTitle}`);
        contentEl.empty();
        contentEl.addClass('euria-save-modal');

        // Loading-Hinweis während Modell-Vorschlag läuft
        const loading = contentEl.createDiv({ cls: 'setting-item-description' });
        loading.setText(t.saveSuggesting);
        loading.style.marginBottom = '12px';

        // Default: aktuellster Timestamp als Fallback-Dateiname
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        this.filename = `Ollama Chat ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}`;

        // Modell-Vorschlag parallel holen
        const suggestion = await this.view.suggestSavePath();
        loading.remove();

        if (suggestion) {
            if (suggestion.folder)   this.folder   = suggestion.folder;
            if (suggestion.filename) this.filename = suggestion.filename;
            if (suggestion.tags?.length) {
                const defaults = (this.plugin.settings.saveDefaultTags || '').split(',').map(x => x.trim()).filter(Boolean);
                const merged = Array.from(new Set([...defaults, ...suggestion.tags]));
                this.tags = merged.join(', ');
            }
        }

        this._renderForm(contentEl);
    }

    _renderForm(contentEl) {
        const t = this.t;

        // Ordner
        new Setting(contentEl)
            .setName(t.saveModalFolder)
            .setDesc(t.saveModalFolderHint)
            .addText(txt => {
                txt.setValue(this.folder);
                txt.inputEl.style.width = '100%';
                txt.inputEl.setAttribute('list', 'euria-folder-list');
                txt.onChange(v => { this.folder = v; this._updatePreview(); });
            });

        // Datalist mit allen Vault-Ordnern für Autocomplete
        const datalist = contentEl.createEl('datalist', { attr: { id: 'euria-folder-list' } });
        for (const f of this.view._listAllFolders()) {
            datalist.createEl('option', { attr: { value: f } });
        }

        // Dateiname
        new Setting(contentEl)
            .setName(t.saveModalFilename)
            .setDesc(t.saveModalFilenameHint)
            .addText(txt => {
                txt.setValue(this.filename);
                txt.inputEl.style.width = '100%';
                txt.onChange(v => { this.filename = v; this._updatePreview(); });
            });

        // Tags
        new Setting(contentEl)
            .setName(t.saveModalTags)
            .addText(txt => {
                txt.setValue(this.tags);
                txt.inputEl.style.width = '100%';
                txt.onChange(v => { this.tags = v; this._updatePreview(); });
            });

        // Vorschau
        contentEl.createEl('h4', { text: t.saveModalPreview });
        this.previewEl = contentEl.createEl('pre', { cls: 'euria-save-preview' });
        this.previewEl.style.maxHeight    = '220px';
        this.previewEl.style.overflow     = 'auto';
        this.previewEl.style.background   = 'var(--background-secondary)';
        this.previewEl.style.padding      = '8px';
        this.previewEl.style.borderRadius = '6px';
        this.previewEl.style.fontSize     = '12px';
        this.previewEl.style.whiteSpace   = 'pre-wrap';
        this._updatePreview();

        // Open-after-Save Toggle
        new Setting(contentEl)
            .setName(t.saveModalOpenAfter)
            .addToggle(tg => tg
                .setValue(this.openAfter)
                .onChange(v => { this.openAfter = v; })
            );

        // Buttons
        const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent = 'flex-end';
        buttonRow.style.gap = '8px';
        buttonRow.style.marginTop = '16px';

        const cancelBtn = buttonRow.createEl('button', { text: t.saveModalCancel });
        cancelBtn.onclick = () => this.close();

        const saveBtn = buttonRow.createEl('button', { text: t.saveModalSave, cls: 'mod-cta' });
        saveBtn.onclick = () => this._handleSave();
    }

    _tagList() {
        return (this.tags || '').split(',').map(x => x.trim()).filter(Boolean);
    }

    _updatePreview() {
        if (!this.previewEl) return;
        const content = this.view.buildMarkdownContent({
            title: this.view._sanitizeFilename(this.filename || 'Ollama Chat'),
            tags:  this._tagList(),
        });
        this.previewEl.setText(content.slice(0, 1200) + (content.length > 1200 ? '\n…' : ''));
    }

    async _handleSave() {
        const t = this.t;
        try {
            const title = this.view._sanitizeFilename(this.filename || 'Ollama Chat');
            const content = this.view.buildMarkdownContent({ title, tags: this._tagList() });
            const folderPath = this.folder?.trim() || this.plugin.settings.saveFallbackFolder || '01 Inbox';
            const finalPath = await this.view.writeMarkdownToVault(folderPath, title, content);
            new Notice(t.savedNotice(finalPath));
            this.close();
            if (this.openAfter) {
                const file = this.app.vault.getAbstractFileByPath(finalPath);
                if (file) await this.app.workspace.getLeaf(true).openFile(file);
            }
        } catch (err) {
            new Notice(t.saveFailed(err.message || String(err)));
        }
    }
}

// ─── Vault Setup Modal ────────────────────────────────────────────────────────

class VaultSetupModal extends Modal {
    constructor(app, plugin, t) {
        super(app);
        this.plugin = plugin;
        this.t      = t;
        this.template = 'para';
        this.folders  = [...SETUP_TEMPLATES.para];
        this.selectedFolders = new Set(this.folders);
    }

    onOpen() {
        const t = this.t;
        const { contentEl, titleEl } = this;
        titleEl.setText(`🦙 ${t.setupModalTitle}`);
        contentEl.empty();

        const intro = contentEl.createEl('p', { text: t.setupModalIntro });
        intro.style.marginBottom = '12px';

        // Vorlage
        new Setting(contentEl)
            .setName(t.setupModalTemplate)
            .addDropdown(d => d
                .addOption('para',    t.setupModalPara)
                .addOption('minimal', t.setupModalMinimal)
                .setValue(this.template)
                .onChange(v => {
                    this.template = v;
                    this.folders   = [...(SETUP_TEMPLATES[v] || SETUP_TEMPLATES.para)];
                    this.selectedFolders = new Set(this.folders);
                    this._renderFolderList();
                })
            );

        contentEl.createEl('h4', { text: t.setupModalFolders });
        this.listEl = contentEl.createDiv({ cls: 'euria-setup-folders' });
        this._renderFolderList();

        const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent = 'flex-end';
        buttonRow.style.gap = '8px';
        buttonRow.style.marginTop = '16px';

        const cancelBtn = buttonRow.createEl('button', { text: t.setupModalCancel });
        cancelBtn.onclick = () => this.close();

        const createBtn = buttonRow.createEl('button', { text: t.setupModalCreate, cls: 'mod-cta' });
        createBtn.onclick = () => this._handleCreate();
    }

    _renderFolderList() {
        this.listEl.empty();
        this.listEl.style.cssText = 'display:flex;flex-direction:column;gap:4px;max-height:320px;overflow-y:auto;padding:8px;border:1px solid var(--background-modifier-border);border-radius:6px;margin-bottom:12px;';

        if (!this.folders || !this.folders.length) {
            this.listEl.createEl('div', { text: '(keine Ordner im Template)' });
            return;
        }

        for (const folder of this.folders) {
            try {
                const exists = !!this.app.vault.getAbstractFileByPath(folder);
                if (exists) this.selectedFolders.delete(folder);

                const label = this.listEl.createEl('label');
                label.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 2px;';

                const cb = label.createEl('input', { attr: { type: 'checkbox' } });
                cb.checked  = this.selectedFolders.has(folder) && !exists;
                cb.disabled = exists;
                cb.addEventListener('change', () => {
                    if (cb.checked) this.selectedFolders.add(folder);
                    else this.selectedFolders.delete(folder);
                });

                const nameSpan = label.createEl('span');
                nameSpan.textContent = folder;
                nameSpan.style.flex = '1';
                if (exists) nameSpan.style.opacity = '0.5';

                if (exists) {
                    const hint = label.createEl('span', { cls: 'setting-item-description' });
                    hint.textContent = '(existiert)';
                    hint.style.fontSize = '11px';
                }
            } catch (err) {
                const errEl = this.listEl.createEl('div');
                errEl.textContent = `Fehler bei "${folder}": ${err.message}`;
                errEl.style.color = 'var(--text-error)';
            }
        }
    }

    async _handleCreate() {
        let created = 0, skipped = 0;
        const contextFolderPath = (this.plugin.settings.contextFolder || '00 Kontext').trim();
        let contextFolderNewlyCreated = false;

        for (const folder of this.selectedFolders) {
            try {
                if (this.app.vault.getAbstractFileByPath(folder)) { skipped++; continue; }
                await this.app.vault.createFolder(folder);
                created++;
                if (folder === contextFolderPath) contextFolderNewlyCreated = true;
            } catch (_) { skipped++; }
        }

        // Default-Kontextdateien anlegen, wenn 00 Kontext frisch entstanden ist
        if (contextFolderNewlyCreated && this.plugin.settings.contextCreateDefaults) {
            for (const [name, content] of Object.entries(CONTEXT_FILE_TEMPLATES)) {
                const path = `${contextFolderPath}/${name}`;
                if (this.app.vault.getAbstractFileByPath(path)) continue;
                try { await this.app.vault.create(path, content); } catch (_) {}
            }
        }

        new Notice(this.t.setupModalDone(created, skipped));
        this.close();

        // Nach dem Anlegen: Fremd-Ordner-Check
        const templateFolders = SETUP_TEMPLATES[this.template] || SETUP_TEMPLATES.para;
        const foreign = OrganizeFoldersModal.findForeignTopFolders(this.app, templateFolders);
        if (foreign.length) {
            // kleine Nachfrage via Modal
            setTimeout(() => {
                new OrganizeAskModal(this.app, this.plugin, this.t, this.template, foreign.length).open();
            }, 300);
        }
    }
}

// ─── Organize-Ask Modal (kleine Zwischenfrage) ────────────────────────────────

class OrganizeAskModal extends Modal {
    constructor(app, plugin, t, templateName, foreignCount) {
        super(app);
        this.plugin = plugin;
        this.t = t;
        this.templateName = templateName;
        this.foreignCount = foreignCount;
    }

    onOpen() {
        const t = this.t;
        const { contentEl, titleEl } = this;
        titleEl.setText('🦙 ' + t.setupModalTitle);
        contentEl.empty();
        contentEl.createEl('p', { text: t.setupModalOrganizeAsk(this.foreignCount) });

        const row = contentEl.createDiv({ cls: 'modal-button-container' });
        row.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:16px;';

        const laterBtn = row.createEl('button', { text: t.setupModalOrganizeNo });
        laterBtn.onclick = () => this.close();

        const nowBtn = row.createEl('button', { text: t.setupModalOrganizeYes, cls: 'mod-cta' });
        nowBtn.onclick = () => {
            this.close();
            new OrganizeFoldersModal(this.app, this.plugin, this.t, this.templateName).open();
        };
    }
}

// ─── Organize Folders Modal ───────────────────────────────────────────────────

/**
 * Erlaubt das Zuordnen bestehender Top-Level-Ordner zu Zielordnern des Templates
 * oder Umbenennen. Verschiebungen laufen über fileManager.renameFile,
 * damit alle Wikilinks aktualisiert werden.
 */
class OrganizeFoldersModal extends Modal {
    constructor(app, plugin, t, templateName = 'para') {
        super(app);
        this.plugin = plugin;
        this.t      = t;
        this.templateName = templateName;
        this.template = SETUP_TEMPLATES[templateName] || SETUP_TEMPLATES.para;
        this.rows = []; // { folder, mode: 'keep'|'move'|'rename', target, newName }
    }

    static findForeignTopFolders(app, templateFolders) {
        const templateSet = new Set(templateFolders);
        const foreign = [];
        for (const child of app.vault.getRoot().children || []) {
            if (!(child instanceof TFolder)) continue;
            if (child.name.startsWith('.')) continue;
            if (templateSet.has(child.path)) continue;
            foreign.push(child);
        }
        return foreign;
    }

    onOpen() {
        const t = this.t;
        const { contentEl, titleEl } = this;
        titleEl.setText(`🦙 ${t.organizeModalTitle}`);
        contentEl.empty();

        const foreign = OrganizeFoldersModal.findForeignTopFolders(this.app, this.template);
        if (!foreign.length) {
            contentEl.createEl('p', { text: t.organizeModalNone });
            const row = contentEl.createDiv({ cls: 'modal-button-container' });
            row.style.cssText = 'display:flex;justify-content:flex-end;margin-top:12px;';
            const closeBtn = row.createEl('button', { text: t.setupModalCancel });
            closeBtn.onclick = () => this.close();
            return;
        }

        contentEl.createEl('p', { text: t.organizeModalIntro }).style.marginBottom = '12px';

        this.rows = foreign.map(folder => ({ folder, mode: 'keep', target: this.template[0] || '', newName: folder.name }));

        for (const row of this.rows) {
            this._renderRow(contentEl, row);
        }

        const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonRow.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:16px;';

        const cancelBtn = buttonRow.createEl('button', { text: t.setupModalCancel });
        cancelBtn.onclick = () => this.close();

        const runBtn = buttonRow.createEl('button', { text: t.organizeRun, cls: 'mod-cta' });
        runBtn.onclick = () => this._handleRun();
    }

    _renderRow(contentEl, row) {
        const t = this.t;
        const wrapper = contentEl.createDiv();
        wrapper.style.cssText = 'padding:10px 0;border-bottom:1px solid var(--background-modifier-border);';

        const title = wrapper.createEl('div', { text: row.folder.path });
        title.style.cssText = 'font-weight:600;margin-bottom:6px;';

        const groupName = `euria-org-${Math.random().toString(36).slice(2, 8)}`;

        // Keep
        const keepLabel = wrapper.createEl('label');
        keepLabel.style.cssText = 'display:flex;align-items:center;gap:6px;margin:3px 0;';
        const keepRadio = keepLabel.createEl('input', { attr: { type: 'radio', name: groupName } });
        keepRadio.checked = true;
        keepLabel.createEl('span', { text: t.organizeActionKeep });
        keepRadio.onchange = () => { if (keepRadio.checked) row.mode = 'keep'; };

        // Move
        const moveLabel = wrapper.createEl('label');
        moveLabel.style.cssText = 'display:flex;align-items:center;gap:6px;margin:3px 0;';
        const moveRadio = moveLabel.createEl('input', { attr: { type: 'radio', name: groupName } });
        moveLabel.createEl('span', { text: t.organizeActionMove });
        const moveSelect = moveLabel.createEl('select');
        for (const target of this.template) {
            if (target === row.folder.path) continue;
            moveSelect.createEl('option', { text: target, value: target });
        }
        // auch alle sonstigen bereits bestehenden Ordner als Ziel anbieten
        const allFolders = this._listAllFolders().filter(p => !this.template.includes(p) && p !== row.folder.path);
        if (allFolders.length) {
            const sep = moveSelect.createEl('option', { text: '──────────', value: '' });
            sep.disabled = true;
            for (const p of allFolders) moveSelect.createEl('option', { text: p, value: p });
        }
        moveSelect.value = this.template[0] || '';
        row.target = moveSelect.value;
        moveSelect.onchange = () => { row.target = moveSelect.value; moveRadio.checked = true; row.mode = 'move'; };
        moveRadio.onchange = () => { if (moveRadio.checked) row.mode = 'move'; };

        // Rename
        const renameLabel = wrapper.createEl('label');
        renameLabel.style.cssText = 'display:flex;align-items:center;gap:6px;margin:3px 0;';
        const renameRadio = renameLabel.createEl('input', { attr: { type: 'radio', name: groupName } });
        renameLabel.createEl('span', { text: t.organizeActionRename });
        const renameInput = renameLabel.createEl('input', { attr: { type: 'text', placeholder: t.organizeRenamePlaceholder } });
        renameInput.value = row.folder.name;
        renameInput.oninput = () => { row.newName = renameInput.value; renameRadio.checked = true; row.mode = 'rename'; };
        renameRadio.onchange = () => { if (renameRadio.checked) row.mode = 'rename'; };
    }

    _listAllFolders() {
        const result = [];
        const walk = (folder) => {
            for (const child of folder.children || []) {
                if (child instanceof TFolder) { result.push(child.path); walk(child); }
            }
        };
        walk(this.app.vault.getRoot());
        return result.sort();
    }

    async _handleRun() {
        let moved = 0, renamed = 0, skipped = 0, failed = 0;

        for (const row of this.rows) {
            if (row.mode === 'keep') { skipped++; continue; }

            // Zielpfad berechnen
            let destPath;
            if (row.mode === 'move') {
                if (!row.target) { skipped++; continue; }
                destPath = `${row.target}/${row.folder.name}`;
            } else { // rename
                const newName = (row.newName || '').trim();
                if (!newName || newName === row.folder.name) { skipped++; continue; }
                destPath = newName;
            }

            // Ordner noch im Vault vorhanden?
            if (!this.app.vault.getAbstractFileByPath(row.folder.path)) { failed++; continue; }

            // Zielordner-Elternteil anlegen falls fehlt
            const parent = destPath.split('/').slice(0, -1).join('/');
            if (parent && !this.app.vault.getAbstractFileByPath(parent)) {
                try { await this._ensureFolder(parent); } catch (_) { failed++; continue; }
            }

            // Konflikt?
            if (this.app.vault.getAbstractFileByPath(destPath)) {
                const resolution = await new Promise((resolve) => {
                    new ConflictResolutionModal(this.app, this.t, row.folder.path, destPath, resolve).open();
                });
                if (resolution.action === 'skip') { skipped++; continue; }
                if (resolution.action === 'rename') {
                    const alt = (resolution.newName || '').trim();
                    if (!alt) { skipped++; continue; }
                    const altParent = destPath.split('/').slice(0, -1).join('/');
                    destPath = altParent ? `${altParent}/${alt}` : alt;
                    if (this.app.vault.getAbstractFileByPath(destPath)) { failed++; continue; }
                    try {
                        await this.app.fileManager.renameFile(row.folder, destPath);
                        row.mode === 'move' ? moved++ : renamed++;
                    } catch (_) { failed++; }
                    continue;
                }
                if (resolution.action === 'merge') {
                    try {
                        await this._mergeFolder(row.folder, destPath);
                        moved++;
                    } catch (_) { failed++; }
                    continue;
                }
            }

            // Normaler Fall – rename/move
            try {
                await this.app.fileManager.renameFile(row.folder, destPath);
                row.mode === 'move' ? moved++ : renamed++;
            } catch (_) { failed++; }
        }

        new Notice(this.t.organizeDone(moved, renamed, skipped, failed));
        this.close();
    }

    async _mergeFolder(srcFolder, destPath) {
        // Alle direkten Kinder einzeln in Zielordner verschieben
        const children = [...(srcFolder.children || [])];
        for (const child of children) {
            const childDest = `${destPath}/${child.name}`;
            if (this.app.vault.getAbstractFileByPath(childDest)) {
                // Konflikt auf Kindebene: Suffix anhängen
                let i = 2;
                let alt = childDest;
                const dot = child instanceof TFolder ? -1 : alt.lastIndexOf('.');
                while (this.app.vault.getAbstractFileByPath(alt)) {
                    if (dot === -1) alt = `${childDest} ${i}`;
                    else alt = `${childDest.slice(0, dot)} ${i}${childDest.slice(dot)}`;
                    i++;
                    if (i > 999) throw new Error('merge conflict overflow');
                }
                await this.app.fileManager.renameFile(child, alt);
            } else {
                await this.app.fileManager.renameFile(child, childDest);
            }
        }
        // Leeren Quellordner löschen
        const refreshed = this.app.vault.getAbstractFileByPath(srcFolder.path);
        if (refreshed && refreshed.children && refreshed.children.length === 0) {
            await this.app.vault.delete(refreshed);
        }
    }

    async _ensureFolder(path) {
        const parts = path.split('/').filter(Boolean);
        let current = '';
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!this.app.vault.getAbstractFileByPath(current)) {
                try { await this.app.vault.createFolder(current); } catch (_) {}
            }
        }
    }
}

// ─── Conflict Resolution Modal ────────────────────────────────────────────────

class ConflictResolutionModal extends Modal {
    constructor(app, t, srcPath, destPath, resolve) {
        super(app);
        this.t = t;
        this.srcPath = srcPath;
        this.destPath = destPath;
        this.resolve = resolve;
        this.resolved = false;
    }

    onOpen() {
        const t = this.t;
        const { contentEl, titleEl } = this;
        titleEl.setText(`⚠ ${t.conflictModalTitle}`);
        contentEl.empty();
        contentEl.createEl('p', { text: t.conflictModalBody(this.srcPath, this.destPath) });

        const btnRow = contentEl.createDiv({ cls: 'modal-button-container' });
        btnRow.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:12px;';

        const mergeBtn = btnRow.createEl('button', { text: t.conflictMerge });
        mergeBtn.onclick = () => this._finish({ action: 'merge' });

        // Rename-Zeile
        const renameWrap = btnRow.createDiv();
        renameWrap.style.cssText = 'display:flex;gap:6px;align-items:center;';
        const renameInput = renameWrap.createEl('input', { attr: { type: 'text', placeholder: t.organizeRenamePlaceholder } });
        renameInput.style.flex = '1';
        const srcName = this.srcPath.split('/').pop();
        renameInput.value = `${srcName}-2`;
        const renameBtn = renameWrap.createEl('button', { text: t.conflictRename });
        renameBtn.onclick = () => this._finish({ action: 'rename', newName: renameInput.value });

        const skipBtn = btnRow.createEl('button', { text: t.conflictSkip });
        skipBtn.onclick = () => this._finish({ action: 'skip' });
    }

    _finish(result) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(result);
        this.close();
    }

    onClose() {
        if (!this.resolved) { this.resolved = true; this.resolve({ action: 'skip' }); }
    }
}

// ─── Daily Note Modal ─────────────────────────────────────────────────────────

class DailyNoteModal extends Modal {
    constructor(app, plugin, view, t, entryDraft) {
        super(app);
        this.plugin = plugin;
        this.view   = view;
        this.t      = t;
        this.entry  = entryDraft;
        this.targetPath = view.resolveDailyNotePath();
        const exists = !!app.vault.getAbstractFileByPath(this.targetPath);
        this.mode = exists ? 'append' : 'create';
    }

    onOpen() {
        const t = this.t;
        const { contentEl, titleEl } = this;
        titleEl.setText(`📅 ${t.dailyModalTitle}`);
        contentEl.empty();

        new Setting(contentEl)
            .setName(t.dailyModalTarget)
            .addText(txt => {
                txt.setValue(this.targetPath);
                txt.inputEl.style.width = '100%';
                txt.onChange(v => { this.targetPath = v; });
            });

        const modeWrap = contentEl.createDiv();
        modeWrap.style.cssText = 'margin:12px 0;display:flex;flex-direction:column;gap:4px;';
        modeWrap.createEl('div', { text: t.dailyModalMode }).style.fontWeight = '600';

        const groupName = `euria-daily-${Math.random().toString(36).slice(2, 8)}`;

        const appendLabel = modeWrap.createEl('label');
        appendLabel.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;';
        const appendRadio = appendLabel.createEl('input', { attr: { type: 'radio', name: groupName } });
        appendRadio.checked = this.mode === 'append';
        appendRadio.onchange = () => { if (appendRadio.checked) this.mode = 'append'; };
        appendLabel.createEl('span', { text: t.dailyModalAppend });

        const createLabel = modeWrap.createEl('label');
        createLabel.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;';
        const createRadio = createLabel.createEl('input', { attr: { type: 'radio', name: groupName } });
        createRadio.checked = this.mode === 'create';
        createRadio.onchange = () => { if (createRadio.checked) this.mode = 'create'; };
        createLabel.createEl('span', { text: t.dailyModalCreate });

        contentEl.createEl('h4', { text: t.dailyModalEntry });
        const textarea = contentEl.createEl('textarea');
        textarea.value = this.entry;
        textarea.style.cssText = 'width:100%;min-height:220px;font-family:var(--font-monospace);font-size:12px;padding:8px;';
        textarea.oninput = () => { this.entry = textarea.value; };

        const btnRow = contentEl.createDiv({ cls: 'modal-button-container' });
        btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:16px;';

        const cancelBtn = btnRow.createEl('button', { text: t.dailyModalCancel });
        cancelBtn.onclick = () => this.close();

        const saveBtn = btnRow.createEl('button', { text: t.dailyModalSave, cls: 'mod-cta' });
        saveBtn.onclick = () => this._handleSave();
    }

    async _handleSave() {
        const t = this.t;
        try {
            const result = await this.view.writeDailyNoteEntry(this.targetPath, this.mode, this.entry);
            new Notice(result.mode === 'append' ? t.dailyAppended(result.path) : t.dailyCreated(result.path));
            this.close();
        } catch (err) {
            new Notice(t.dailyFailed(err.message || String(err)));
        }
    }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

class OllamaSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display() {
        const t = I18N[this.plugin.settings.language] || I18N.en;
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: t.settingsTitle });

        // Language selector (top)
        new Setting(containerEl)
            .setName(t.settingsLang)
            .setDesc(t.settingsLangD)
            .addDropdown(d => d
                .addOption('en', 'English')
                .addOption('de', 'Deutsch')
                .setValue(this.plugin.settings.language)
                .onChange(async v => {
                    this.plugin.settings.language = v;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        // Onboarding hint
        const ghUrl = 'https://github.com/Geolech/obsidian-local-ollama';
        const codeText = 'ollama pull gemma3:12b';
        const reqParts = t.settingsReqText(codeText, ghUrl);
        // reqParts: [text, linkText, linkUrl, text, codeText, text, linkText2, linkUrl2, text]
        const info = containerEl.createDiv({ cls: 'setting-item-description' });
        info.style.marginBottom = '16px';
        info.style.lineHeight   = '1.6';
        info.createEl('strong', { text: t.settingsReq });
        info.appendText(reqParts[0]);
        const ollamaLink = info.createEl('a', { text: reqParts[1], href: reqParts[2] });
        ollamaLink.setAttr('target', '_blank');
        info.appendText(reqParts[3]);
        info.createEl('code', { text: reqParts[4] });
        info.appendText(reqParts[5]);
        const ghLink = info.createEl('a', { text: reqParts[6], href: reqParts[7] });
        ghLink.setAttr('target', '_blank');
        info.appendText(reqParts[8]);

        containerEl.createEl('p', {
            text: t.settingsConn(OLLAMA_BASE_URL),
            cls:  'setting-item-description',
        });

        // Model selector with dropdown + refresh button
        const modelSetting = new Setting(containerEl)
            .setName(t.settingsModel)
            .setDesc(t.settingsModelD);

        const buildDropdown = (models) => {
            modelSetting.controlEl.empty();

            const select = modelSetting.controlEl.createEl('select', { cls: 'dropdown' });
            select.style.marginRight = '8px';

            const allModels = models.includes(this.plugin.settings.model)
                ? models
                : [this.plugin.settings.model, ...models];

            for (const m of allModels) {
                const opt = select.createEl('option', { text: m, value: m });
                if (m === this.plugin.settings.model) opt.selected = true;
            }

            select.onchange = async () => {
                this.plugin.settings.model = select.value;
                await this.plugin.saveSettings();
            };

            const refreshBtn = modelSetting.controlEl.createEl('button', { text: t.settingsRefresh });
            refreshBtn.onclick = () => loadModels();
        };

        const loadModels = async () => {
            try {
                const resp = await requestUrl({ url: `${OLLAMA_BASE_URL}/api/tags`, method: 'GET', throw: false });
                if (resp.status === 200) {
                    const names = (resp.json.models || []).map(m => m.name).sort();
                    if (names.length > 0) { buildDropdown(names); return; }
                }
            } catch (_) {}
            buildDropdown([this.plugin.settings.model]);
            new Notice(t.ollamaOffline);
        };

        await loadModels();

        let promptTextarea = null;
        new Setting(containerEl)
            .setName(t.settingsPrompt)
            .setDesc(t.settingsPromptD)
            .addTextArea(ta => {
                ta.setPlaceholder('System Prompt…')
                    .setValue(this.plugin.settings.systemPrompt)
                    .onChange(async v => {
                        this.plugin.settings.systemPrompt = v;
                        await this.plugin.saveSettings();
                    });
                ta.inputEl.rows  = 10;
                ta.inputEl.style.width = '100%';
                promptTextarea = ta;
            });

        new Setting(containerEl)
            .setName(t.settingsReset)
            .setDesc(t.settingsResetD)
            .addButton(btn => btn
                .setButtonText(t.settingsReset)
                .onClick(async () => {
                    this.plugin.settings.systemPrompt = DEFAULT_SYSTEM_PROMPT;
                    await this.plugin.saveSettings();
                    if (promptTextarea) promptTextarea.setValue(DEFAULT_SYSTEM_PROMPT);
                })
            );

        // ─── Save-to-Vault ───────────────────────────────────────────────────
        containerEl.createEl('h3', { text: t.settingsSaveSection });

        new Setting(containerEl)
            .setName(t.settingsSaveFallback)
            .setDesc(t.settingsSaveFallbackD)
            .addText(txt => txt
                .setValue(this.plugin.settings.saveFallbackFolder)
                .onChange(async v => {
                    this.plugin.settings.saveFallbackFolder = v.trim() || '01 Inbox';
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t.settingsSaveTrigger)
            .setDesc(t.settingsSaveTriggerD)
            .addToggle(tg => tg
                .setValue(this.plugin.settings.saveTriggerEnabled)
                .onChange(async v => {
                    this.plugin.settings.saveTriggerEnabled = v;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t.settingsSaveTags)
            .setDesc(t.settingsSaveTagsD)
            .addText(txt => txt
                .setValue(this.plugin.settings.saveDefaultTags)
                .onChange(async v => {
                    this.plugin.settings.saveDefaultTags = v;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t.settingsSaveOpen)
            .setDesc(t.settingsSaveOpenD)
            .addToggle(tg => tg
                .setValue(this.plugin.settings.saveOpenAfter)
                .onChange(async v => {
                    this.plugin.settings.saveOpenAfter = v;
                    await this.plugin.saveSettings();
                })
            );

        // ─── Vault-Ersteinrichtung ───────────────────────────────────────────
        containerEl.createEl('h3', { text: t.settingsSetupSection });

        new Setting(containerEl)
            .setDesc(t.settingsSetupD)
            .addButton(btn => btn
                .setButtonText(t.settingsSetupBtn)
                .setCta()
                .onClick(() => new VaultSetupModal(this.app, this.plugin, t).open())
            );

        new Setting(containerEl)
            .setDesc(t.settingsOrganizeD)
            .addButton(btn => btn
                .setButtonText(t.settingsOrganizeBtn)
                .onClick(() => new OrganizeFoldersModal(this.app, this.plugin, t, 'para').open())
            );

        // ─── Kontext-Ordner ─────────────────────────────────────────────────
        containerEl.createEl('h3', { text: t.settingsContextSection });

        new Setting(containerEl)
            .setName(t.settingsContextFolder)
            .setDesc(t.settingsContextFolderD)
            .addText(txt => txt
                .setValue(this.plugin.settings.contextFolder)
                .onChange(async v => {
                    this.plugin.settings.contextFolder = v.trim();
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t.settingsContextEnabled)
            .setDesc(t.settingsContextEnabledD)
            .addToggle(tg => tg
                .setValue(this.plugin.settings.contextFolderEnabled)
                .onChange(async v => {
                    this.plugin.settings.contextFolderEnabled = v;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t.settingsContextMax)
            .setDesc(t.settingsContextMaxD)
            .addText(txt => txt
                .setValue(String(this.plugin.settings.contextFolderMaxChars))
                .onChange(async v => {
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n >= 1000) {
                        this.plugin.settings.contextFolderMaxChars = n;
                        await this.plugin.saveSettings();
                    }
                })
            );

        new Setting(containerEl)
            .setName(t.settingsContextDefaults)
            .setDesc(t.settingsContextDefaultsD)
            .addToggle(tg => tg
                .setValue(this.plugin.settings.contextCreateDefaults)
                .onChange(async v => {
                    this.plugin.settings.contextCreateDefaults = v;
                    await this.plugin.saveSettings();
                })
            );

        // ─── Daily Note ─────────────────────────────────────────────────────
        containerEl.createEl('h3', { text: t.settingsDailySection });

        new Setting(containerEl)
            .setName(t.settingsDailyPattern)
            .setDesc(t.settingsDailyPatternD)
            .addText(txt => txt
                .setValue(this.plugin.settings.dailyNotePattern)
                .onChange(async v => {
                    this.plugin.settings.dailyNotePattern = v.trim() || '05 Daily Notes/{YYYY}-{MM}/{YYYY}-{MM}-{DD}.md';
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t.settingsDailyAppend)
            .setDesc(t.settingsDailyAppendD)
            .addToggle(tg => tg
                .setValue(this.plugin.settings.dailyNoteAppend)
                .onChange(async v => {
                    this.plugin.settings.dailyNoteAppend = v;
                    await this.plugin.saveSettings();
                })
            );
    }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

class LocalOllamaPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        addIcon('ollama-llama', `
            <ellipse cx="50" cy="62" rx="26" ry="18" fill="currentColor"/>
            <rect x="38" y="28" width="16" height="32" rx="8" fill="currentColor"/>
            <ellipse cx="44" cy="22" rx="12" ry="10" fill="currentColor"/>
            <polygon points="34,14 26,2 38,12" fill="currentColor"/>
            <polygon points="54,14 62,2 50,12" fill="currentColor"/>
            <rect x="30" y="76" width="8" height="18" rx="4" fill="currentColor"/>
            <rect x="42" y="76" width="8" height="18" rx="4" fill="currentColor"/>
            <rect x="54" y="76" width="8" height="18" rx="4" fill="currentColor"/>
        `);

        const t = I18N[this.settings.language] || I18N.en;

        this.registerView(OLLAMA_VIEW_TYPE, leaf => new OllamaChatView(leaf, this));
        this.addRibbonIcon('ollama-llama', t.ribbonTitle, () => this.activateView());

        this.addCommand({
            id:       'open-ollama-chat',
            name:     t.cmdOpen,
            callback: () => this.activateView(),
        });

        this.addCommand({
            id:       'ollama-summarize-note',
            name:     t.cmdSummarize,
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.summarizeCurrentNote();
            },
        });

        this.addCommand({
            id:       'ollama-structure-note',
            name:     t.cmdStructure,
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.structureCurrentNote();
            },
        });

        this.addCommand({
            id:       'ollama-load-context',
            name:     t.cmdContext,
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.loadNoteAsContext();
            },
        });

        this.addCommand({
            id:       'ollama-save-chat',
            name:     t.cmdSave,
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.openSaveModal();
            },
        });

        this.addCommand({
            id:       'ollama-daily-note',
            name:     t.cmdDaily,
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.openDailyNoteFlow();
            },
        });

        this.addCommand({
            id:       'ollama-vault-setup',
            name:     t.cmdSetup,
            callback: () => new VaultSetupModal(this.app, this, I18N[this.settings.language] || I18N.en).open(),
        });

        this.addCommand({
            id:       'ollama-organize-folders',
            name:     t.cmdOrganize,
            callback: () => new OrganizeFoldersModal(this.app, this, I18N[this.settings.language] || I18N.en, 'para').open(),
        });

        this.addSettingTab(new OllamaSettingTab(this.app, this));
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: OLLAMA_VIEW_TYPE, active: true });
        }
        workspace.revealLeaf(leaf);
    }

    onunload() {}

    async loadSettings() {
        // Migriere alte Einstellungen: apiToken, productId, baseUrl entfernen
        const saved = await this.loadData() || {};
        const { model, systemPrompt, language,
                saveFallbackFolder, saveTriggerEnabled, saveDefaultTags, saveOpenAfter,
                contextFolder, contextFolderEnabled, contextFolderMaxChars, contextCreateDefaults,
                dailyNotePattern, dailyNoteAppend } = saved;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, {
            ...(model        && { model }),
            ...(systemPrompt && { systemPrompt }),
            ...(language     && { language }),
            ...(saveFallbackFolder   && { saveFallbackFolder }),
            ...(saveTriggerEnabled !== undefined && { saveTriggerEnabled }),
            ...(saveDefaultTags !== undefined    && { saveDefaultTags }),
            ...(saveOpenAfter !== undefined      && { saveOpenAfter }),
            ...(contextFolder !== undefined         && { contextFolder }),
            ...(contextFolderEnabled !== undefined  && { contextFolderEnabled }),
            ...(contextFolderMaxChars !== undefined && { contextFolderMaxChars }),
            ...(contextCreateDefaults !== undefined && { contextCreateDefaults }),
            ...(dailyNotePattern && { dailyNotePattern }),
            ...(dailyNoteAppend !== undefined && { dailyNoteAppend }),
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = LocalOllamaPlugin;
