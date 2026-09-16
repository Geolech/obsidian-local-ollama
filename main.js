/*
 * Lokales Ollama Obsidian Plugin
 * Lokale KI (Ollama) als Schreib- und Strukturassistent direkt in Obsidian.
 * Läuft ausschließlich lokal – keine Cloud, kein API-Token, keine Telemetrie.
 */

'use strict';

const { Plugin, PluginSettingTab, Setting, ItemView, MarkdownView, Notice, requestUrl, addIcon } = require('obsidian');

const OLLAMA_VIEW_TYPE = 'euria-chat-view';
const OLLAMA_BASE_URL  = 'http://localhost:11434';

const DEFAULT_SETTINGS = {
    model: 'gemma3:12b',
    systemPrompt: `Du bist ein präziser Schreib- und Strukturassistent. Du hilfst beim Zusammenfassen, Strukturieren und Ausarbeiten von Texten – auf Deutsch, klar und direkt.

SCHREIBSTIL (immer einhalten):
- Aktiv statt Passiv
- Kurze Sätze bevorzugen – lieber zwei kurze als einen langen
- Keine Füllwörter: "bereits", "natürlich", "selbstverständlich", "eigentlich"
- Keine Bindestrich-Sätze als Satzverbinder
- "KI" statt "AI"
- Keine Emojis in formellen Texten
- Konkret und anschaulich: Beispiele statt abstrakte Beschreibungen
- Nominalstil vermeiden: nicht "die Durchführung von", sondern "durchführen"
- Ansprache: "Sie" für Hochschul- und Forschungskontexte, "Du" für informelle Kontexte

KI-MUSTER VERMEIDEN:
- Keine aufgeblähte Bedeutungssprache: nicht "spielt eine bedeutende Rolle"
- Keine Werbesprache: nicht "atemberaubend", nicht "nahtlos"
- Gedankenstriche sparsam – nie mehrere pro Absatz
- Kein Fazit-Baustein am Ende, keine schließende Wiederholung
- Keine Dialog-Reste: kein "Gerne!", "Ich hoffe, das hilft"
- Erfinde keine Quellen oder Fakten

Antworte präzise und ohne Selbstinszenierung. Der Text zählt, nicht die Ankündigung.`,
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
        const header = container.createDiv('euria-header');
        header.createEl('span', { text: '🦙 Local Ollama', cls: 'euria-title' });
        const clearBtn = header.createEl('button', { text: 'Clear', cls: 'euria-clear-btn' });
        clearBtn.onclick = () => {
            this.messages    = [];
            this.noteContext = null;
            this.render();
        };
    }

    _renderContextBar(container) {
        const bar = container.createDiv('euria-context-bar');
        bar.createEl('span', { text: `📄 Kontext: ${this.noteContext.title}` });
        const rm = bar.createEl('button', { text: '✕', cls: 'euria-ctx-remove' });
        rm.onclick = () => { this.noteContext = null; this.render(); };
    }

    _renderMessages(container) {
        const messagesEl = container.createDiv('euria-messages');

        if (this.messages.length === 0) {
            const ph = messagesEl.createDiv('euria-placeholder');
            ph.createEl('p', { text: 'Your local AI assistant.' });
            ph.createEl('p', { text: `Model: ${this.plugin.settings.model}` });
            ph.createEl('p', { text: 'Load a note as context or ask a question.' });
            return;
        }

        for (const msg of this.messages) {
            const msgEl = messagesEl.createDiv(`euria-message euria-message-${msg.role}`);
            msgEl.createEl('div', { text: msg.role === 'user' ? 'You' : 'Ollama', cls: 'euria-message-label' });
            msgEl.createEl('div', { text: msg.content, cls: 'euria-message-content' });
        }

        requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
    }

    _renderQuickActions(container) {
        const actions = container.createDiv('euria-quick-actions');
        const btn = (text, fn) => {
            const b = actions.createEl('button', { text, cls: 'euria-action-btn' });
            b.onclick = fn;
        };
        btn('📋 Summarize current note',    () => this.summarizeCurrentNote());
        btn('🏗️ Suggest structure for note', () => this.structureCurrentNote());
        btn('📌 Load note as context',       () => this.loadNoteAsContext());
    }

    _renderInputArea(container) {
        const area     = container.createDiv('euria-input-area');
        const textarea = area.createEl('textarea', {
            cls:  'euria-input',
            attr: { placeholder: 'Message to Ollama…', rows: '3' },
        });
        this._textarea = textarea;

        const footer    = area.createDiv('euria-input-footer');
        const searchBtn = footer.createEl('button', { text: '🔍 Web Search',   cls: 'euria-action-btn' });
        const sendBtn   = footer.createEl('button', { text: '🏠 Local Query',  cls: 'euria-send-btn' });
        area.createEl('p', { text: 'Shift+Enter = Web Search · Ctrl+Enter = Local Query', cls: 'euria-hint' });

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
        const file = this._getActiveFile();
        if (!file) return;
        const content    = await this.app.vault.read(file);
        this.noteContext = { title: file.basename, content };
        this.render();
        new Notice(`📌 "${file.basename}" als Kontext geladen.`);
    }

    async summarizeCurrentNote() {
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        await this.sendMessage(
            `Fasse diese Notiz prägnant zusammen. Behalte alle wichtigen Fakten, Strukturen und nächste Schritte:\n\n---\n${content}\n---`,
            `📋 Zusammenfassung von „${file.basename}"`
        );
    }

    async structureCurrentNote() {
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        await this.sendMessage(
            `Analysiere diese Notiz und schlage eine verbesserte Gliederung vor. Zeige Hauptpunkte und Unterpunkte klar strukturiert:\n\n---\n${content}\n---`,
            `🏗️ Strukturvorschlag für „${file.basename}"`
        );
    }

    // ─── Web Search ──────────────────────────────────────────────────────────

    startWebSearch() {
        if (this.isLoading) return;
        const query = this._textarea?.value?.trim();
        if (!query) {
            new Notice('Please enter a search query in the text field first.');
            return;
        }
        this._textarea.value = '';
        this.webSearch(query);
    }

    async webSearch(query) {
        this.isLoading = true;
        this.messages.push({ role: 'user',      content: `🔍 Websuche: ${query}`, apiContent: query });
        this.messages.push({ role: 'assistant', content: '🔍 Searching…' });
        this.render();

        try {
            const results = await this._fetchDDGResults(query);
            if (!results.length) throw new Error('No search results found.');

            // Ergebnisse als lesbaren Kontext aufbereiten
            const context = results
                .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
                .join('\n\n');

            const prompt =
                `Answer the following question based on the search results. ` +
                `Cite sources as [1], [2] etc. Be clear and concise.\n\n` +
                `Question: ${query}\n\nSearch results:\n${context}`;

            // Lademeldung durch Ollama-Antwort ersetzen
            this.messages[this.messages.length - 1] = {
                role: 'assistant', content: '💬 Ollama is processing the results…'
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
                throw new Error('Ollama not reachable. Is the service running? → ollama serve');
            }
            if (response.status >= 400) {
                throw new Error(`Ollama Fehler ${response.status}: ${response.text}`);
            }

            const reply = response.json?.choices?.[0]?.message?.content?.trim() || 'No response received.';
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

        if (response.status !== 200) throw new Error(`DuckDuckGo not reachable (${response.status}).`);

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
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView?.file) return activeView.file;

        let found = null;
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file) found = leaf.view.file;
        });

        if (!found) {
            new Notice('No open note found. Please open a note in the editor.');
            return null;
        }
        return found;
    }

    // ─── Ollama API ───────────────────────────────────────────────────────────

    async sendMessage(userText, displayText = null) {
        const display = displayText || userText;
        this.isLoading = true;

        const apiMessages = this._buildApiMessages(userText);
        this.messages.push({ role: 'user',      content: display,                     apiContent: userText });
        this.messages.push({ role: 'assistant', content: '⏳ Ollama denkt nach…' });
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
                throw new Error('Ollama not reachable. Is the service running? → ollama serve');
            }
            if (response.status >= 400) {
                throw new Error(`Ollama Fehler ${response.status}: ${response.text}`);
            }

            const reply = response.json?.choices?.[0]?.message?.content?.trim() || 'No response received.';
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
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Local Ollama – Settings' });

        // Onboarding hint
        const info = containerEl.createDiv({ cls: 'setting-item-description' });
        info.style.marginBottom = '16px';
        info.style.lineHeight   = '1.6';
        info.createEl('strong', { text: 'Requirement: ' });
        info.appendText('Ollama must be installed and running on your machine (');
        const ollamaLink = info.createEl('a', { text: 'ollama.com', href: 'https://ollama.com' });
        ollamaLink.setAttr('target', '_blank');
        info.appendText('). Then install a model, e.g. ');
        info.createEl('code', { text: 'ollama pull gemma3:12b' });
        info.appendText(' in your terminal. More info and model recommendations on ');
        const ghLink = info.createEl('a', { text: 'GitHub', href: 'https://github.com/Geolech/obsidian-local-ollama' });
        ghLink.setAttr('target', '_blank');
        info.appendText('.');

        containerEl.createEl('p', {
            text: `Connected to: ${OLLAMA_BASE_URL}`,
            cls:  'setting-item-description',
        });

        // Model selector with dropdown + refresh button
        const modelSetting = new Setting(containerEl)
            .setName('Model')
            .setDesc('Locally installed Ollama models. Click ↻ to refresh the list.');

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

            const refreshBtn = modelSetting.controlEl.createEl('button', { text: '↻ Aktualisieren' });
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
            new Notice('Ollama not reachable. Please run "ollama serve".');
        };

        await loadModels();

        new Setting(containerEl)
            .setName('System Prompt')
            .setDesc('Behavioral instruction for Ollama')
            .addTextArea(t => {
                t.setPlaceholder('System-Prompt…')
                    .setValue(this.plugin.settings.systemPrompt)
                    .onChange(async v => {
                        this.plugin.settings.systemPrompt = v;
                        await this.plugin.saveSettings();
                    });
                t.inputEl.rows  = 10;
                t.inputEl.style.width = '100%';
            });
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

        this.registerView(OLLAMA_VIEW_TYPE, leaf => new OllamaChatView(leaf, this));
        this.addRibbonIcon('ollama-llama', 'Open Local Ollama', () => this.activateView());

        this.addCommand({
            id:       'open-ollama-chat',
            name:     'Open Ollama Chat',
            callback: () => this.activateView(),
        });

        this.addCommand({
            id:       'ollama-summarize-note',
            name:     'Summarize current note',
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.summarizeCurrentNote();
            },
        });

        this.addCommand({
            id:       'ollama-structure-note',
            name:     'Suggest structure for current note',
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(OLLAMA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.structureCurrentNote();
            },
        });

        this.addCommand({
            id:       'ollama-load-context',
            name:     'Load current note as context',
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
        const { model, systemPrompt } = saved;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, {
            ...(model        && { model }),
            ...(systemPrompt && { systemPrompt }),
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = LocalOllamaPlugin;
