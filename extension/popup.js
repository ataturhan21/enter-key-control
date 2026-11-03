const { SITES, DEFAULTS, siteForHost } = self.EKC;
const $ = (id) => document.getElementById(id);
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

$("modLabel").textContent = isMac ? "⌘ + Enter" : "Ctrl + Enter";
$("altLabel").textContent = isMac ? "Option + Enter" : "Alt + Enter";

for (const s of SITES) {
  const li = document.createElement("li");
  li.textContent = `${s.name} — ${s.hosts.join(", ")}`;
  $("sites").append(li);
}

let settings = { ...DEFAULTS };
let site = null;
let tab = null;
let scriptLoaded = false;

function render() {
  $("enabled").checked = settings.enabled;
  $("sendKey").value = settings.sendKey;
  $("siteRow").hidden = !site;
  if (site) {
    $("siteName").textContent = site.name;
    $("siteEnabled").checked = !settings.disabledSites.includes(site.id);
    $("siteEnabled").disabled = !settings.enabled;
  }

  const status = $("status");
  status.className = "status";
  $("reload").hidden = true;
  if (!site) {
    status.textContent = "This page isn't a supported AI chat. Open one of the sites below.";
  } else if (!scriptLoaded) {
    status.textContent = `${site.name} was opened before the extension loaded.`;
    status.classList.add("warn");
    $("reload").hidden = false;
  } else if (!settings.enabled || settings.disabledSites.includes(site.id)) {
    status.textContent = `Paused on ${site.name}. Enter behaves as the site defines it.`;
    status.classList.add("off");
  } else {
    const key = $("sendKey").selectedOptions[0].textContent;
    status.textContent = `Active on ${site.name}: Enter = new line, ${key} = send.`;
    status.classList.add("on");
  }
}

function save(patch) {
  settings = { ...settings, ...patch };
  chrome.storage.sync.set(patch);
  render();
}

$("enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));
$("sendKey").addEventListener("change", (e) => save({ sendKey: e.target.value }));
$("siteEnabled").addEventListener("change", (e) => {
  const others = settings.disabledSites.filter((id) => id !== site.id);
  save({ disabledSites: e.target.checked ? others : [...others, site.id] });
});
$("reload").addEventListener("click", () => {
  chrome.tabs.reload(tab.id);
  window.close();
});

(async () => {
  settings = await chrome.storage.sync.get(DEFAULTS);
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    site = tab && tab.url ? siteForHost(new URL(tab.url).hostname) : null;
  } catch {
    site = null;
  }
  if (site) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "ekc:ping" });
      scriptLoaded = Boolean(res && res.ok);
    } catch {
      scriptLoaded = false;
    }
  }
  render();
})();
