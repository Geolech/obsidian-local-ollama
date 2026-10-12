# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.9.0] – 2026-10-12

### Added

- **Prompt-driven folder creation.** Phrases like `create folder Archive/2026` or `make a new folder 04 Resources/Drafts` create the given folder (and any missing parents) directly from the chat, without opening a modal. German equivalents (`erstelle Ordner …`, `leg Ordner … an`) work identically.
- **Prompt-driven direct save.** Phrases like `save this to folder 04 Resources/Drafts`, `put this in folder 02 Projects/Book` or `save the last answer as "Checklist" to folder 01 Inbox` write the current chat straight into the named folder. The target folder is created on the fly if needed. An optional filename can be passed with `as …`. German equivalents (`leg das in Ordner … ab`, `speicher … in Ordner …`, `als …`) work identically.
- **Scope option "last answer only".** When the prompt contains `last answer`, `last response`, `the answer` or `the result` (German: `letzte Antwort`, `das Ergebnis`, `die Antwort`), only the most recent question-and-answer pair is saved instead of the full history.
- **Inline conflict prompt in the chat.** If the target file already exists, the plugin posts an inline message with four buttons: Overwrite, Append (adds only the conversation section, keeps the existing frontmatter), Keep both (rename), Cancel. The prompt is transient and does not survive a restart.
- **Path validation.** All target paths are checked before any write. Absolute paths, `..` / `.` segments, empty segments and the characters `< > : " | ? *` are rejected with a clear notice in the chat.
- **German README.** The German documentation now lives in `README.de.md` and is linked from the main English `README.md`.

### Changed

- System-level chat messages (save and folder feedback) are no longer sent back to the model and no longer appear inside saved chat files.
- The persistence layer strips transient messages and action callbacks before writing to `data.json`.

### Notes

- All new triggers share the existing **Trigger phrases active** toggle. Turning it off disables prompt-driven save, prompt-driven folder creation, the save modal trigger and the daily-note trigger together.
- The existing `Chat log` header button and generic phrases like `speicher das` continue to open the save modal with model-suggested folder, autocomplete and preview. The new direct-save flow only kicks in when the prompt names a concrete folder.

## [2.8.2] – 2026-10-11

- Manifest description reworded to avoid self-reference (`this plugin` / `a plugin that`), addressing the Obsidian Community Plugin review warning.
- New `.github/workflows/release.yml` adds Build Provenance Attestations via `actions/attest-build-provenance@v2` for `main.js`, `manifest.json` and `styles.css` on every non-v tag push.

## [2.8.0] – 2026-10-01

- Chat persistence: messages and note context survive an Obsidian restart.
- New quick action **Load chat from active note** plus matching command palette entry. Detects saved Ollama chat files via the `source: Lokales Ollama Plugin` frontmatter.

## [2.7.0] – 2026-10-01

- New **Daily Note** header button. The model drafts a concise entry from the current chat; a modal lets you review the target file, mode (append / new) and the text.
- Path pattern with `{YYYY}` / `{MM}` / `{DD}` placeholders; default `05 Daily Notes/{YYYY}-{MM}/{YYYY}-{MM}-{DD}.md`.
- Companion trigger phrases in 2.7.1 and 2.7.2 (`halte das in einer Daily Note fest`, `log this to my daily note`, any message containing "Daily Note", and so on).

## [2.6.0] – 2026-10-01

- Persistent context from `00 Kontext/`: every `.md` file in that folder is passed to the model on every request. Filename becomes a subheading, frontmatter is stripped. Hard cap at 8000 characters (configurable).
- When `00 Kontext` is created by the setup, three starter templates are written: `Biographie.md`, `Schreibstil.md`, `Recherchevorgaben.md`.

## [2.5.0] – 2026-10-01

- **Vault setup modal.** Creates a PARA folder structure (`00 Kontext` through `07 Anhänge`) or a minimal variant (Inbox + Archive). Checkboxes per folder, existing folders are detected.
- **Sort existing folders in.** After the setup the plugin can move remaining top-level folders into the PARA structure or rename them. Moves run through `fileManager.renameFile`, so wikilinks are updated automatically.

## [2.4.0] – 2026-10-01

- **Save chat log to the vault.** Header button plus trigger phrases (`speicher das`, `save that to vault`, …). Modal with model-suggested folder, filename and tags; autocomplete over all existing vault folders; live preview; YAML frontmatter; AI callout; automatic filename suffix on conflicts.

## [1.0.2] – 2026-08-11

- Security: `baseUrl` is now validated via `isSafeUrl()` before every HTTP request. Only `http://` and `https://` are allowed, closing an SSRF risk.

## [1.0.1] – 2026-08-10

- Removed all Euria / Infomaniak references from code and manifest.
- Clean development workflow with a separate test vault and symlink.

## [1.0.0] – 2026-08-10

- First public release. Chat with a local Ollama model, DuckDuckGo web search, summarize and structure the active note, load a note as context.
