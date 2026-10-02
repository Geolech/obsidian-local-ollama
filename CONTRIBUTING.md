# Contributing to Local Ollama with Web Search

Thanks for considering a contribution. This is a small, actively maintained Obsidian plugin. Issues and pull requests are welcome.

## Reporting bugs

Before opening an issue:

1. Make sure your Ollama service is running (`ollama serve` or the desktop app)
2. Confirm your model is installed (`ollama list`)
3. Try with the default `gemma3:12b` model if the bug appears model-specific
4. Reload Obsidian with Developer Tools open (Cmd+Alt+I / Ctrl+Shift+I) and check the Console tab for errors

When filing a bug report, include:

- Obsidian version, OS, and Ollama version
- Model you were using
- Exact steps to reproduce
- Console error messages, if any
- Screenshots for UI issues

## Feature requests

Open an issue describing the use case first, before investing time in a pull request. Not every proposal fits the scope, which is: a focused chat interface for local Ollama models with vault-aware helpers (save, PARA setup, daily notes, context folder).

Out of scope:
- Cloud model providers (OpenAI, Anthropic, etc.)
- Vector databases / embeddings / semantic search
- RAG pipelines beyond the simple folder-context mechanism

## Pull requests

- Fork the repo and work on a feature branch
- Keep changes focused — one feature or fix per PR
- Run `node --check main.js` before pushing to catch syntax errors
- Update the README if you change user-facing behavior
- For UI changes, include before/after screenshots in the PR description
- Keep the plugin dependency-free (no npm packages beyond what's already in use)

## Development workflow

```bash
# Clone and symlink into a test vault
git clone https://github.com/Geolech/obsidian-local-ollama.git
ln -s "$(pwd)/obsidian-local-ollama" ~/Obsidian-Test-Vault/.obsidian/plugins/local-ollama-websearch

# Edit main.js, reload Obsidian with Cmd+R
```

Never develop in a production vault — a symlinked test vault keeps your real notes safe.

## Code style

- Plain JavaScript, no build step, no TypeScript
- 4-space indentation
- Keep class/function sizes reasonable; split into helpers when sensible
- Comment non-obvious regex, parsing, and vault manipulation logic
- i18n: add new strings to both `I18N.en` and `I18N.de`

## Releases

Releases are managed by the maintainer. If you want a version bump, open an issue or draft PR and we'll coordinate.

## License

By contributing, you agree your contributions are released under the MIT license, same as the project.
