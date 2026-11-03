// Enter inserts a new line; the send shortcut (Ctrl/⌘+Enter or Alt+Enter) sends.
// Runs entirely in the page: no network requests, nothing leaves the browser.
(() => {
  // background.js re-injects this file into open tabs on install and update. A copy from the previous
  // version can still be running in this page with dead chrome.* listeners, so retire it and take over
  // instead of bailing out; exactly one copy ever handles a key press.
  if (typeof window.__ekcTeardown === "function") window.__ekcTeardown();

  const { DEFAULTS, siteForHost } = self.EKC;
  const site = siteForHost(location.hostname);
  let settings = { ...DEFAULTS };
  const synthetic = new WeakSet();

  chrome.storage.sync.get(DEFAULTS, (stored) => { settings = stored; });
  const onStorageChanged = (changes, area) => {
    if (area !== "sync") return;
    for (const key of Object.keys(changes)) settings[key] = changes[key].newValue;
  };
  const onPing = (msg, _sender, reply) => {
    if (msg && msg.type === "ekc:ping") reply({ ok: true, site: site && site.id, active: isActive() });
  };
  chrome.storage.onChanged.addListener(onStorageChanged);
  chrome.runtime.onMessage.addListener(onPing);

  function isActive() {
    return Boolean(settings.enabled && site && !(settings.disabledSites || []).includes(site.id));
  }

  function editableTarget(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.tagName === "TEXTAREA") return el.disabled || el.readOnly ? null : el;
    if (el.isContentEditable) return el;
    return null;
  }

  function isSendShortcut(e) {
    if (e.shiftKey) return false;
    if (settings.sendKey === "alt") return e.altKey && !e.ctrlKey && !e.metaKey;
    return (e.ctrlKey || e.metaKey) && !e.altKey;
  }

  function fireEnter(target, extra) {
    const ev = new KeyboardEvent("keydown", {
      key: "Enter", code: "Enter", keyCode: 13, which: 13,
      bubbles: true, cancelable: true, composed: true, ...extra
    });
    synthetic.add(ev);
    target.dispatchEvent(ev);
    return ev;
  }

  function insertNewline(target) {
    if (target.tagName === "TEXTAREA") {
      // execCommand keeps the undo stack and fires the input events React/Vue listen for.
      if (!document.execCommand("insertText", false, "\n")) {
        const { selectionStart: s, selectionEnd: e, value } = target;
        target.value = value.slice(0, s) + "\n" + value.slice(e);
        target.selectionStart = target.selectionEnd = s + 1;
        target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertLineBreak" }));
      }
      return;
    }
    // Rich editors (ProseMirror, Quill, Lexical) treat Shift+Enter as a line break.
    const ev = fireEnter(target, { shiftKey: true });
    if (!ev.defaultPrevented) {
      document.execCommand("insertLineBreak") || document.execCommand("insertParagraph");
    }
  }

  // Visible and enabled. getClientRects() is empty for display:none or detached buttons, but,
  // unlike offsetParent, not for buttons with position: fixed.
  function isUsable(btn) {
    return Boolean(btn) && !btn.disabled && btn.getAttribute("aria-disabled") !== "true" &&
      btn.getClientRects().length > 0;
  }

  // The send button closest to the editor, so an "edit message" box never triggers the main composer.
  function nearestSendButton(target) {
    const selectors = (site && site.sendButtons) || [];
    if (!selectors.length) return null;
    let node = target.parentElement;
    for (let depth = 0; node && depth < 10; depth++, node = node.parentElement) {
      for (const sel of selectors) {
        let found;
        try { found = node.querySelector(sel); } catch { found = null; }
        if (isUsable(found)) return found;
      }
    }
    return null;
  }

  function send(target) {
    const ev = fireEnter(target, {});
    if (ev.defaultPrevented) return; // the site's own Enter handler took it
    const button = nearestSendButton(target);
    if (button) { button.click(); return; }
    const form = target.closest("form");
    if (form && typeof form.requestSubmit === "function") form.requestSubmit();
  }

  function onKeydown(e) {
    if (synthetic.has(e) || !e.isTrusted) return;
    if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) return; // leave IME composition alone
    if (!isActive()) return;
    const target = editableTarget(e.target);
    if (!target) return;

    if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) return; // Shift+Enter: site default

    // Every other Enter combination adds a line, so only the chosen shortcut can ever send.
    e.preventDefault();
    e.stopImmediatePropagation();
    if (isSendShortcut(e)) send(target);
    else insertNewline(target);
  }

  window.addEventListener("keydown", onKeydown, true);
  window.__ekcTeardown = () => {
    window.removeEventListener("keydown", onKeydown, true);
    try {
      chrome.storage.onChanged.removeListener(onStorageChanged);
      chrome.runtime.onMessage.removeListener(onPing);
    } catch {
      // An orphaned copy's chrome.* APIs can throw; its keydown listener is what matters.
    }
  };
})();
