# Enter Key Control for AI Chats

A Chrome extension that stops AI chat boxes from sending your message every time you press Enter.

- **Enter** adds a new line.
- **Ctrl + Enter** (**⌘ + Enter** on Mac) sends. You can switch the send shortcut to **Alt/Option + Enter**.
- **Shift + Enter** keeps the site's own behavior.
- Any other Enter combination adds a new line, so only your chosen shortcut can ever send.
- Typing in Japanese, Chinese or Korean (IME) is left alone while a word is being composed.

## Supported sites

| Site | Address |
| --- | --- |
| ChatGPT | chatgpt.com, chat.openai.com |
| Claude | claude.ai |
| Gemini | gemini.google.com |
| Google AI Studio | aistudio.google.com |
| DeepSeek | chat.deepseek.com |
| Perplexity | www.perplexity.ai |
| Grok | grok.com |
| Le Chat (Mistral) | chat.mistral.ai |
| Microsoft Copilot | copilot.microsoft.com |

The site list lives in [`extension/sites.js`](extension/sites.js) and the matching `host_permissions` / `content_scripts.matches` in [`extension/manifest.json`](extension/manifest.json).

## Install

1. Download `enter-key-control-<version>.zip` from the [latest release](../../releases/latest) and unzip it, or clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `extension` folder.

Chat tabs that are already open start working right away; the extension loads itself into them on install and update.

## Popup

Click the toolbar icon to:

- see whether the extension is active on the current tab,
- pause it everywhere, or only on the current site,
- choose the send shortcut,
- reload a tab that was opened before the extension could load into it.

Settings are saved with `chrome.storage.sync`, so they follow your Chrome profile.

## Privacy

Everything runs in the page. The extension makes no network requests, has no analytics and collects no data. It asks only for `storage` (your settings), `scripting` (to load into tabs that were already open) and access to the chat sites listed above.

## How it works

[`extension/content.js`](extension/content.js) listens for `keydown` on the window in the capture phase, before the site's own handlers:

- **Enter** in a textarea inserts `\n` with `execCommand("insertText")`, which keeps undo working and fires the input events React and similar frameworks listen for. In rich editors (ProseMirror, Quill, Lexical) it sends the editor a Shift+Enter, which they treat as a line break.
- **The send shortcut** sends the editor a plain Enter. If the site doesn't handle it, the extension clicks the send button nearest to the editor, so an "edit message" box never submits the main composer, and finally falls back to submitting the surrounding form.

## Testing

Serve the repository root and open the harnesses in Chrome:

```bash
python -m http.server 8765
```

- `http://localhost:8765/test/harness.html`: mock editors (a send-on-Enter textarea, a ProseMirror-style editor, an editor with only a send button, one whose send button is `position: fixed`, and a search box that must stay untouched), plus a button that loads `content.js` a second time, as happens after an update. Press real keys in each box; `window.log` and the panel at the bottom show what was sent. Synthetic events are ignored by design, so the checks need real key presses.
- `http://localhost:8765/test/popup-harness.html?url=https://claude.ai/`: the real popup with stubbed Chrome APIs. Add `&loaded=0` to see the "reload this tab" state.

The automatic checks need only Node.js and also run in CI on every push and pull request:

```bash
node test/check.mjs
```

They check the syntax of every script, that every file `manifest.json` points to exists, and that the hosts in `sites.js` match `host_permissions` and `content_scripts.matches`.

## License

[MIT](LICENSE)
