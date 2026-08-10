/*
 * Euria Obsidian Plugin
 * Euria von Infomaniak als KI-Sparringspartner direkt in Obsidian.
 * Infomaniak AI API ist OpenAI-kompatibel.
 */

'use strict';

const { Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownView, Notice, requestUrl, addIcon } = require('obsidian');

const EURIA_VIEW_TYPE = 'euria-chat-view';

const DEFAULT_SETTINGS = {
    apiToken: '',
    productId: '',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.1',
    systemPrompt: `Du bist ein präziser Schreib- und Strukturassistent für Frank Lechtenberg, Professor für Crossmedia-Journalismus an der TH OWL. Du hilfst beim Zusammenfassen, Strukturieren und Ausarbeiten von Texten – auf Deutsch, klar und direkt.

SCHREIBSTIL (immer einhalten):
- Aktiv statt Passiv
- Kurze Sätze bevorzugen – lieber zwei kurze als einen langen
- Keine Füllwörter: "bereits", "natürlich", "selbstverständlich", "eigentlich"
- Keine Bindestrich-Sätze als Satzverbinder
- "KI" statt "AI"
- Keine Emojis in formellen Texten
- Konkret und anschaulich: Beispiele statt abstrakte Beschreibungen
- Nominalstil vermeiden: nicht "die Durchführung von", sondern "durchführen"
- Kein Passiv: nicht "wurde erstellt", sondern "Frank erstellte"
- Ansprache: "Sie" für Hochschul- und Forschungskontexte, "Du" für informelle Kontexte

KI-MUSTER VERMEIDEN (Vermenschlichung):
- Keine aufgeblähte Bedeutungssprache: nicht "spielt eine bedeutende Rolle", nicht "unterstreicht die Bedeutung"
- Keine Werbesprache: nicht "atemberaubend", nicht "beeindruckend", nicht "nahtlos"
- Gedankenstriche sparsam – nie mehrere pro Absatz
- Keine mechanischen Verbindungswörter: nicht jeden Absatz mit "Darüber hinaus", "Zusätzlich", "Ferner" beginnen
- Kein "nicht nur … sondern auch …" als Dauerfigur
- Schlichte Verben: "schrieb" statt "verfasste", "starb" statt "verstarb", "nutzte" statt "bediente sich"
- Kein Fazit-Baustein am Ende, keine schließende Wiederholung
- Kein "Herausforderungen und Ausblick"-Schema
- Keine Inline-Header-Listen mit fettem Schlagwort + Doppelpunkt
- Keine Dialog-Reste: kein "Gerne!", "Ich hoffe, das hilft", "Hier ist der Text"
- Keine Meta-Kommentare über den eigenen Entwurf
- Erfinde keine Quellen oder Fakten – lieber eine Lücke als eine erfundene Sicherheit

Antworte präzise und ohne Selbstinszenierung. Der Text zählt, nicht die Ankündigung.`,
};

// ─── Chat View ───────────────────────────────────────────────────────────────

class EuriaChatView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.messages = [];   // { role, content, apiContent }
        this.noteContext = null;  // { title, content }
        this.isLoading = false;
    }

    getViewType() { return EURIA_VIEW_TYPE; }
    getDisplayText() { return 'Lokales Ollama'; }
    getIcon() { return 'ollama-llama'; }

    async onOpen() { this.render(); }
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
        header.createEl('span', { text: '🦙 Ollama', cls: 'euria-title' });
        const clearBtn = header.createEl('button', { text: 'Leeren', cls: 'euria-clear-btn' });
        clearBtn.onclick = () => {
            this.messages = [];
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
            ph.createEl('p', { text: 'Ich bin deine lokale KI.' });
            ph.createEl('p', { text: `Modell: ${this.plugin.settings.model}` });
            ph.createEl('p', { text: 'Lade eine Notiz als Kontext oder stelle eine Frage.' });
            return;
        }

        for (const msg of this.messages) {
            const msgEl = messagesEl.createDiv(`euria-message euria-message-${msg.role}`);
            msgEl.createEl('div', { text: msg.role === 'user' ? 'Du' : 'Lokale KI', cls: 'euria-message-label' });
            msgEl.createEl('div', { text: msg.content, cls: 'euria-message-content' });
        }

        // Scroll to bottom after paint
        requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
    }

    _renderQuickActions(container) {
        const actions = container.createDiv('euria-quick-actions');

        const btn = (text, fn) => {
            const b = actions.createEl('button', { text, cls: 'euria-action-btn' });
            b.onclick = fn;
        };

        btn('📋 Aktuelle Notiz zusammenfassen', () => this.summarizeCurrentNote());
        btn('🏗️ Struktur für aktuelle Notiz vorschlagen', () => this.structureCurrentNote());
        btn('📌 Aktuelle Notiz als Kontext laden', () => this.loadNoteAsContext());
    }

    _renderInputArea(container) {
        const area = container.createDiv('euria-input-area');

        const textarea = area.createEl('textarea', {
            cls: 'euria-input',
            attr: { placeholder: 'Nachricht an lokale KI… (Shift+Enter senden)', rows: '3' },
        });

        const footer = area.createDiv('euria-input-footer');
        footer.createEl('span', { text: 'Shift + Enter zum Senden', cls: 'euria-hint' });
        const sendBtn = footer.createEl('button', { text: 'Senden', cls: 'euria-send-btn' });

        const send = async () => {
            const text = textarea.value.trim();
            if (!text || this.isLoading) return;
            textarea.value = '';
            await this.sendMessage(text);
        };

        sendBtn.onclick = send;
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                send();
            }
        });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    async loadNoteAsContext() {
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        this.noteContext = { title: file.basename, content };
        this.render();
        new Notice(`📌 "${file.basename}" als Kontext geladen.`);
    }

    async summarizeCurrentNote() {
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        const prompt = `Fasse diese Notiz prägnant zusammen. Behalte alle wichtigen Fakten, Strukturen und nächste Schritte:\n\n---\n${content}\n---`;
        await this.sendMessage(prompt, `📋 Zusammenfassung von „${file.basename}"`);
    }

    async structureCurrentNote() {
        const file = this._getActiveFile();
        if (!file) return;
        const content = await this.app.vault.read(file);
        const prompt = `Analysiere diese Notiz und schlage eine verbesserte Gliederung vor. Zeige Hauptpunkte und Unterpunkte klar strukturiert:\n\n---\n${content}\n---`;
        await this.sendMessage(prompt, `🏗️ Strukturvorschlag für „${file.basename}"`);
    }

    _getActiveFile() {
        // First try the active view directly
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView?.file) return activeView.file;

        // If Euria panel is focused, the markdown view won't be "active".
        // Search all leaves for the most recently used markdown view.
        let found = null;
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file) {
                found = leaf.view.file;
            }
        });

        if (!found) {
            new Notice('Keine offene Notiz gefunden. Bitte eine Notiz im Editor öffnen.');
            return null;
        }
        return found;
    }

    // ─── API call ────────────────────────────────────────────────────────────

    async sendMessage(userText, displayText = null) {
        if (!this.plugin.settings.baseUrl) {
            new Notice('Bitte zuerst den API-Endpunkt in den Euria-Einstellungen eintragen.');
            return;
        }

        const display = displayText || userText;
        this.isLoading = true;

        // Build API message list BEFORE adding new message to history
        const apiMessages = this._buildApiMessages(userText);

        // Add to display
        this.messages.push({ role: 'user', content: display, apiContent: userText });
        this.messages.push({ role: 'assistant', content: '⏳ Deine lokale KI denkt nach…' });
        this.render();

        try {
            const baseUrl = this.plugin.settings.baseUrl.replace(/\/$/, '');
            const endpoint = `${baseUrl}/chat/completions`;

            const headers = { 'Content-Type': 'application/json' };
            if (this.plugin.settings.apiToken) {
                headers['Authorization'] = `Bearer ${this.plugin.settings.apiToken}`;
            }

            const response = await requestUrl({
                url: endpoint,
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: this.plugin.settings.model,
                    messages: apiMessages,
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
                throw: false,
            });

            if (response.status >= 400) {
                throw new Error(`API ${response.status}: ${response.text}`);
            }

            const data = response.json;
            const reply = data.choices?.[0]?.message?.content?.trim() || 'Keine Antwort erhalten.';
            this.messages[this.messages.length - 1] = { role: 'assistant', content: reply };

        } catch (err) {
            const errMsg = `❌ Fehler: ${err.message}`;
            this.messages[this.messages.length - 1] = { role: 'assistant', content: errMsg };
            new Notice(errMsg);
        }

        this.isLoading = false;
        this.render();
    }

    _buildApiMessages(newUserText) {
        // System prompt, optional note context
        let systemContent = this.plugin.settings.systemPrompt;
        if (this.noteContext) {
            // Limit context to ~6000 chars to stay within token budget
            const snippet = this.noteContext.content.length > 6000
                ? this.noteContext.content.substring(0, 6000) + '\n[…gekürzt]'
                : this.noteContext.content;
            systemContent += `\n\nAktuell geladener Notiz-Kontext (${this.noteContext.title}):\n---\n${snippet}\n---`;
        }

        const msgs = [{ role: 'system', content: systemContent }];

        // Add last 6 conversation turns (3 exchanges) as history
        const history = this.messages.slice(-6);
        for (const msg of history) {
            msgs.push({ role: msg.role, content: msg.apiContent || msg.content });
        }

        // New user message
        msgs.push({ role: 'user', content: newUserText });

        return msgs;
    }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

class EuriaSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Lokales Ollama – Einstellungen' });
        containerEl.createEl('p', {
            text: 'KI-Sparringspartner direkt in Obsidian – lokal via Ollama oder cloud-basiert via OpenAI-kompatibler API.',
            cls: 'setting-item-description',
        });

        new Setting(containerEl)
            .setName('API-Endpunkt (Base URL)')
            .setDesc('Ollama lokal: http://localhost:11434/v1 — Infomaniak AI: https://api.infomaniak.com/2/ai/{product_id}/openai/v1')
            .addText(t => t
                .setPlaceholder('http://localhost:11434/v1')
                .setValue(this.plugin.settings.baseUrl)
                .onChange(async v => {
                    this.plugin.settings.baseUrl = v.trim();
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Modell')
            .setDesc('Ollama: llama3.1 — Infomaniak: google/gemma-4-31B-it')
            .addText(t => t
                .setPlaceholder('llama3.1')
                .setValue(this.plugin.settings.model)
                .onChange(async v => {
                    this.plugin.settings.model = v.trim() || DEFAULT_SETTINGS.model;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('API-Token (optional)')
            .setDesc('Für Ollama leer lassen. Für Cloud-APIs den Bearer Token eintragen.')
            .addText(t => t
                .setPlaceholder('Leer lassen für Ollama…')
                .setValue(this.plugin.settings.apiToken)
                .onChange(async v => {
                    this.plugin.settings.apiToken = v.trim();
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('System-Prompt')
            .setDesc('Grundlegende Verhaltensanweisung für Euria')
            .addTextArea(t => {
                t.setPlaceholder('System-Prompt…')
                    .setValue(this.plugin.settings.systemPrompt)
                    .onChange(async v => {
                        this.plugin.settings.systemPrompt = v;
                        await this.plugin.saveSettings();
                    });
                t.inputEl.rows = 5;
                t.inputEl.style.width = '100%';
            });

        containerEl.createEl('h3', { text: 'Wo finde ich die Product-ID?' });
        const howto = containerEl.createEl('ol');
        [
            'manager.infomaniak.com aufrufen',
            'Linkes Menü: AI Services → Euria',
            'Auf dein Euria-Produkt klicken',
            'Die Zahl in der URL oder den Produktdetails ist die Product-ID',
        ].forEach(step => howto.createEl('li', { text: step }));
    }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

class EuriaPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        // Lama-Icon für die Ribbon-Leiste registrieren
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

        this.registerView(EURIA_VIEW_TYPE, leaf => new EuriaChatView(leaf, this));

        this.addRibbonIcon('ollama-llama', 'Lokales Ollama öffnen', () => this.activateView());

        this.addCommand({
            id: 'open-euria-chat',
            name: 'Euria Chat öffnen',
            callback: () => this.activateView(),
        });

        this.addCommand({
            id: 'euria-summarize-note',
            name: 'Aktuelle Notiz mit Euria zusammenfassen',
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(EURIA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.summarizeCurrentNote();
            },
        });

        this.addCommand({
            id: 'euria-structure-note',
            name: 'Struktur für aktuelle Notiz von Euria vorschlagen lassen',
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(EURIA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.structureCurrentNote();
            },
        });

        this.addCommand({
            id: 'euria-load-context',
            name: 'Aktuelle Notiz als Euria-Kontext laden',
            callback: async () => {
                await this.activateView();
                const leaf = this.app.workspace.getLeavesOfType(EURIA_VIEW_TYPE)[0];
                if (leaf?.view) leaf.view.loadNoteAsContext();
            },
        });

        this.addSettingTab(new EuriaSettingTab(this.app, this));
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(EURIA_VIEW_TYPE)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: EURIA_VIEW_TYPE, active: true });
        }
        workspace.revealLeaf(leaf);
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = EuriaPlugin;
