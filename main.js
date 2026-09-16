/*
 * Lokales Ollama Obsidian Plugin
 * Lokale KI (Ollama) als Schreib- und Strukturassistent direkt in Obsidian.
 * Läuft ausschließlich lokal – keine Cloud, kein API-Token, keine Telemetrie.
 */

'use strict';

const { Plugin, PluginSettingTab, Setting, ItemView, MarkdownView, Notice, requestUrl, addIcon } = require('obsidian');

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
};

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

            const apiMessages = this._buildApiMessages(prompt);
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

        const apiMessages = this._buildApiMessages(userText);
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

    _buildApiMessages(newUserText) {
        let systemContent = this.plugin.settings.systemPrompt;
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
        const { model, systemPrompt, language } = saved;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, {
            ...(model        && { model }),
            ...(systemPrompt && { systemPrompt }),
            ...(language     && { language }),
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = LocalOllamaPlugin;
