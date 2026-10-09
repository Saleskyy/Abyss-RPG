"use strict";
const THEME_FIELDS = [
  {
    "key": "background",
    "label": "Fundo",
    "group": "Estrutura",
    "default": "#07080a"
  },
  {
    "key": "gradient",
    "label": "Brilho do fundo",
    "group": "Estrutura",
    "default": "#cfad62"
  },
  {
    "key": "surfaceRaised",
    "label": "Degradê dos painéis · início",
    "group": "Estrutura",
    "default": "#17191f"
  },
  {
    "key": "surface",
    "label": "Degradê dos painéis · fim",
    "group": "Estrutura",
    "default": "#101116"
  },
  {
    "key": "containerRaised",
    "label": "Contêineres · início",
    "group": "Estrutura",
    "default": "#191a20"
  },
  {
    "key": "container",
    "label": "Contêineres · fim",
    "group": "Estrutura",
    "default": "#111217"
  },
  {
    "key": "border",
    "label": "Bordas",
    "group": "Estrutura",
    "default": "#292a30"
  },
  {
    "key": "accent",
    "label": "Destaques",
    "group": "Textos e detalhes",
    "default": "#cfad62"
  },
  {
    "key": "text",
    "label": "Texto principal",
    "group": "Textos e detalhes",
    "default": "#f1efe9"
  },
  {
    "key": "muted",
    "label": "Texto secundário",
    "group": "Textos e detalhes",
    "default": "#9a9993"
  },
  {
    "key": "leigo",
    "label": "Leigo",
    "group": "Treinamentos",
    "default": "#b8bdc6"
  },
  {
    "key": "adepto",
    "label": "Adepto",
    "group": "Treinamentos",
    "default": "#72bdd4"
  },
  {
    "key": "treinado",
    "label": "Treinado",
    "group": "Treinamentos",
    "default": "#e0b958"
  },
  {
    "key": "pv",
    "label": "Pontos de Vida",
    "group": "Recursos",
    "default": "#e1505c"
  },
  {
    "key": "pa",
    "label": "Pontos de Ação",
    "group": "Recursos",
    "default": "#e4bd3e"
  },
  {
    "key": "sa",
    "label": "Sanidade",
    "group": "Recursos",
    "default": "#69c8ed"
  },
  {
    "key": "criticalFailure",
    "label": "Falha Crítica",
    "group": "Rolagens",
    "default": "#a63d58"
  },
  {
    "key": "failure",
    "label": "Falha",
    "group": "Rolagens",
    "default": "#ef646b"
  },
  {
    "key": "partial",
    "label": "Sucesso Parcial",
    "group": "Rolagens",
    "default": "#f19946"
  },
  {
    "key": "normal",
    "label": "Sucesso Normal",
    "group": "Rolagens",
    "default": "#62e6a5"
  },
  {
    "key": "good",
    "label": "Sucesso Bom",
    "group": "Rolagens",
    "default": "#b8f05a"
  },
  {
    "key": "extreme",
    "label": "Sucesso Extremo",
    "group": "Rolagens",
    "default": "#e4c362"
  },
  {
    "key": "extremeCritical",
    "label": "Sucesso Extremo (20)",
    "group": "Rolagens",
    "default": "#ffd66b"
  }
];
// Tons existentes mantêm seus contrastes; sem personalização, valem os fallbacks do CSS.
const THEME_TONES = {
  "background": [
    "07080a",
    "08090b",
    "090a0c",
    "090a0d",
    "0a0909",
    "0a0b0e",
    "0c0d10",
    "111217",
    "626a77",
    "77638c"
  ],
  "gradient": [
    "77638c",
    "cfad62"
  ],
  "surfaceRaised": [
    "14151b",
    "15161b",
    "15181c",
    "15181d",
    "16181e",
    "17171b",
    "17191f",
    "181b20",
    "19191b",
    "191a20",
    "191c21",
    "1a1b20",
    "1b1e24",
    "1c2025",
    "202025",
    "22262d",
    "272b32",
    "2d0f15",
    "4d493f",
    "77638c",
    "77746d",
    "8b929c"
  ],
  "surface": [
    "000000",
    "040507",
    "050608",
    "05070a",
    "060709",
    "07080a",
    "07080b",
    "08090b",
    "08090c",
    "080a0d",
    "090a0d",
    "0a0b0e",
    "0b0c0f",
    "0b0c10",
    "0b0d10",
    "0c0d11",
    "0c0e11",
    "0d0e12",
    "0d0f12",
    "0e0f13",
    "0e1013",
    "0f1014",
    "101116",
    "111216",
    "111217",
    "111318",
    "12120f",
    "121318",
    "121418",
    "121419",
    "171711"
  ],
  "border": [
    "0b0c0f",
    "25262b",
    "292a2f",
    "292d34",
    "2b2c31",
    "2c2d32",
    "2d2e33",
    "2e2f34",
    "303137",
    "313238",
    "323339",
    "34353a",
    "35363b",
    "38393f",
    "393a40",
    "3a3730",
    "3a3b41",
    "44454c",
    "454b55",
    "4f555f",
    "6e6b64",
    "747b86",
    "777e89",
    "7d8490",
    "858c96",
    "8d939c",
    "9299a4",
    "ffffff"
  ],
  "accent": [
    "211d13",
    "211e17",
    "242017",
    "6b5128",
    "776b52",
    "7b7058",
    "80745d",
    "82765f",
    "84775d",
    "88764f",
    "8c7954",
    "8d816a",
    "8e794f",
    "8f8269",
    "917744",
    "927a49",
    "95876a",
    "9a6e1b",
    "9a7f46",
    "9a8558",
    "9a8b67",
    "9a8c70",
    "9b8a64",
    "9b8c6c",
    "9d7534",
    "9d8249",
    "9e9278",
    "a58b55",
    "a98743",
    "a98c50",
    "aa7614",
    "aa823c",
    "aa8c4d",
    "aa9464",
    "b07711",
    "b49655",
    "b7a56f",
    "b89a58",
    "b9954e",
    "baa367",
    "bbae86",
    "bca467",
    "bca66e",
    "bda66f",
    "c1a76d",
    "c3a764",
    "c49b46",
    "c5a052",
    "c9ad6d",
    "caa858",
    "cfad62",
    "d5c69f",
    "d6bd76",
    "d7ba62",
    "d7ba74",
    "d7bd78",
    "d8b75e",
    "d8c99f",
    "d9caa2",
    "dab14b",
    "dac584",
    "dca224",
    "ddc683",
    "deb136",
    "dec781",
    "dec985",
    "dfca86",
    "e0b147",
    "e0c36e",
    "e0c673",
    "e1c060",
    "e1c47d",
    "e1c674",
    "e1ca88",
    "e2c05b",
    "e2c66f",
    "e4c362",
    "e4cd88",
    "e5d29a",
    "e6ca82",
    "e8c866",
    "e8c87d",
    "e8d59e",
    "ecd184",
    "edcb70",
    "edcf77",
    "efcf76",
    "efd27f",
    "efd486",
    "f0ce68",
    "f0cf70",
    "f0d58f",
    "f0d783",
    "f1d47f",
    "f1d77f",
    "f1d78d",
    "f1d795",
    "f2d178",
    "f2d67e",
    "f2d88f",
    "f4d57e",
    "f5cd58",
    "f5d986",
    "f7d05a",
    "ffd66b",
    "ffe39a",
    "ffe5a1",
    "ffe7a1",
    "fff0bb",
    "fff4d3"
  ],
  "text": [
    "caeaf5",
    "d3cbbb",
    "d3d6db",
    "d7d1c5",
    "d8d1c1",
    "d8d1c2",
    "d8d5ce",
    "d9d4c9",
    "dcd6c9",
    "ddd5c5",
    "e2dbce",
    "e5ddcd",
    "e6dfd0",
    "e8dfca",
    "e8e4dc",
    "e9e2d3",
    "e9e2d5",
    "e9e3d6",
    "e9e4d9",
    "ece3d0",
    "ece5d6",
    "ece6d8",
    "eee7d8",
    "eee8db",
    "eee8dc",
    "eee9df",
    "efb4bc",
    "efe9dc",
    "f2ecdc",
    "f4f0e6",
    "f4f0e7",
    "f5efe1",
    "f5f1e8",
    "f7f2e8",
    "ffd1d7",
    "fff3e8"
  ],
  "muted": [
    "090a0c",
    "17130d",
    "575d66",
    "5e5d59",
    "5f5d59",
    "5f646d",
    "606670",
    "625f59",
    "65635e",
    "66645f",
    "676660",
    "686762",
    "696761",
    "6b6760",
    "706a60",
    "706e68",
    "74716a",
    "74736e",
    "747a85",
    "756d6d",
    "777269",
    "77736b",
    "77746c",
    "77746d",
    "77756f",
    "7c7464",
    "7d7970",
    "7e7a72",
    "7f796d",
    "7f7b72",
    "7f7c75",
    "817c73",
    "837d70",
    "858078",
    "858179",
    "85827b",
    "867e70",
    "868078",
    "8c8981",
    "8c8982",
    "8d8b84",
    "8e7276",
    "8e8a81",
    "8e8b84",
    "9a9385",
    "9b9589",
    "9b9891",
    "9c9587",
    "9c9992",
    "9d9689",
    "a4a097",
    "a7a49d",
    "aaa69d",
    "b9b3a7",
    "c9c5bb",
    "cfc7b7"
  ],
  "leigo": [
    "b8bdc6"
  ],
  "adepto": [
    "509fb9",
    "67b8cf",
    "72b4d0",
    "72bdd4",
    "9acbe0",
    "a5d9e8"
  ],
  "treinado": [
    "d7ba62",
    "d8ae4d",
    "e0b958",
    "e4cd88",
    "efd68f"
  ],
  "pv": [
    "8b222c",
    "e1505c",
    "e97981"
  ],
  "pa": [
    "8a6411",
    "916e14",
    "e2b932",
    "e4bd3e",
    "e6c257"
  ],
  "sa": [
    "1a6489",
    "237397",
    "4bb9e7",
    "69c8ed",
    "79cff1"
  ],
  "criticalFailure": [
    "60122a",
    "a63d58"
  ],
  "failure": [
    "ef646b"
  ],
  "partial": [
    "b8953f"
  ],
  "normal": [
    "b8f05a"
  ],
  "good": [
    "62e6a5"
  ],
  "extreme": [
    "e4c362"
  ],
  "extremeCritical": [
    "c28b1b",
    "ffcf4f",
    "ffd25a",
    "ffd66b"
  ]
};

const MAX_THEME_BACKGROUND_SOURCE_LENGTH = 180000;
const MAX_THEME_BACKGROUND_UPLOAD_BYTES = 20 * 1024 * 1024;
let themeBackgroundEpoch = 0;
let themeBackgroundBusy = false;

function sanitizeThemeBackground(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const src = raw.src;
  if (typeof src !== "string" || src.length > MAX_THEME_BACKGROUND_SOURCE_LENGTH
    || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src)) return null;
  const percent = (value, fallback) => {
    const number = typeof value === "number" ? value : Number.NaN;
    return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : fallback;
  };
  return { src, x: percent(raw.x, 50), y: percent(raw.y, 50), opacity: percent(raw.opacity, 35) };
}

function applyThemeBackground() {
  const background = sanitizeThemeBackground(themeSettings.backgroundImage);
  const layer = document.querySelector("#theme-background-layer");
  const image = document.querySelector("#theme-background-image");
  document.body.classList.toggle("has-theme-background", Boolean(background));
  layer.hidden = !background;
  if (!background) {
    image.removeAttribute("src");
    layer.style.opacity = "";
    image.style.objectPosition = "";
    return;
  }
  if (image.getAttribute("src") !== background.src) image.src = background.src;
  layer.style.opacity = String(background.opacity / 100);
  image.style.objectPosition = background.x + "% " + background.y + "%";
}

function setThemeBackgroundStatus(message = "", error = false) {
  const status = document.querySelector("#theme-background-status");
  status.textContent = message;
  status.hidden = !message;
  status.classList.toggle("is-error", error);
}

function invalidateThemeBackgroundUpload() {
  themeBackgroundEpoch += 1;
  themeBackgroundBusy = false;
  document.querySelector("#theme-background-file").value = "";
  setThemeBackgroundStatus();
}

function syncThemeBackgroundControls() {
  const background = sanitizeThemeBackground(themeSettings.backgroundImage);
  const readOnly = isNotebookReadOnly();
  const upload = document.querySelector("#theme-background-upload");
  upload.disabled = readOnly || themeBackgroundBusy;
  upload.querySelector("span").textContent = themeBackgroundBusy ? "Preparando imagem…" : background ? "Trocar imagem" : "Escolher imagem";
  document.querySelector("#theme-background-file").disabled = readOnly || themeBackgroundBusy;
  document.querySelector("#theme-background-caption").textContent = background ? "Personalizado" : "Nenhuma imagem";
  document.querySelector("#theme-background-controls").hidden = !background;
  const preview = document.querySelector("#theme-background-preview");
  if (background) {
    if (preview.getAttribute("src") !== background.src) preview.src = background.src;
    preview.style.objectPosition = background.x + "% " + background.y + "%";
    preview.style.opacity = String(background.opacity / 100);
  } else preview.removeAttribute("src");
  ["x", "y", "opacity"].forEach((key) => {
    const input = document.querySelector("#theme-background-" + key);
    input.value = String(background?.[key] ?? (key === "opacity" ? 35 : 50));
    input.disabled = readOnly || themeBackgroundBusy || !background;
    document.querySelector("#theme-background-" + key + "-value").textContent = input.value + "%";
  });
  document.querySelector("#theme-background-center").disabled = readOnly || themeBackgroundBusy || !background;
  document.querySelector("#theme-background-remove").disabled = readOnly || !background;
}

function updateThemeBackgroundSetting(key, value) {
  if (isNotebookReadOnly() || themeBackgroundBusy || !["x", "y", "opacity"].includes(key)) return false;
  const background = sanitizeThemeBackground(themeSettings.backgroundImage);
  if (!background) return false;
  const next = sanitizeThemeBackground({ ...background, [key]: Number(value) });
  if (!next || next[key] === background[key]) return false;
  themeSettings.backgroundImage = next;
  applyThemeBackground();
  syncThemeBackgroundControls();
  notifySheetChanged("appearance");
  return true;
}

function centerThemeBackground() {
  if (isNotebookReadOnly() || themeBackgroundBusy) return false;
  const background = sanitizeThemeBackground(themeSettings.backgroundImage);
  if (!background || (background.x === 50 && background.y === 50)) return false;
  themeSettings.backgroundImage = { ...background, x: 50, y: 50 };
  applyThemeBackground();
  syncThemeBackgroundControls();
  notifySheetChanged("appearance");
  return true;
}

function removeThemeBackground() {
  if (isNotebookReadOnly()) return false;
  const hadImage = Boolean(themeSettings.backgroundImage);
  invalidateThemeBackgroundUpload();
  delete themeSettings.backgroundImage;
  applyThemeBackground();
  syncThemeBackgroundControls();
  if (hadImage) {
    notifySheetChanged("appearance");
    setThemeBackgroundStatus("Imagem removida da ficha.");
  }
  return hadImage;
}

async function prepareThemeBackgroundSource(file, isCurrent = () => true) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Escolha uma imagem PNG, JPG ou WebP.");
  }
  if (!file.size || file.size > MAX_THEME_BACKGROUND_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter no máximo 20 MB.");
  }
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { image.onload = image.onerror = null; reject(new Error("Não foi possível abrir essa imagem. Tente outro arquivo.")); }, 30000);
      image.onload = () => { clearTimeout(timer); image.onload = image.onerror = null; resolve(); };
      image.onerror = () => { clearTimeout(timer); image.onload = image.onerror = null; reject(new Error("Não foi possível abrir essa imagem. Tente outro arquivo.")); };
      image.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 64000000) {
      throw new Error("A resolução da imagem é muito grande. Escolha uma versão menor.");
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem neste navegador.");
    let scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (!isCurrent()) throw new Error("Escolha cancelada.");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [.85, .7, .55, .4]) {
        let src = canvas.toDataURL("image/webp", quality);
        if (!src.startsWith("data:image/webp;")) src = canvas.toDataURL("image/jpeg", quality);
        if (sanitizeThemeBackground({ src })) return src;
      }
      scale *= .72;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    throw new Error("Não foi possível reduzir essa imagem. Tente uma versão menor.");
  } finally {
    URL.revokeObjectURL(objectUrl);
    image.removeAttribute("src");
  }
}

async function uploadThemeBackground(file) {
  if (isNotebookReadOnly() || !file) return false;
  const token = ++themeBackgroundEpoch;
  const isCurrent = () => token === themeBackgroundEpoch && !isNotebookReadOnly();
  themeBackgroundBusy = true;
  syncThemeBackgroundControls();
  setThemeBackgroundStatus("Preparando imagem…");
  try {
    const src = await prepareThemeBackgroundSource(file, isCurrent);
    if (!isCurrent()) return false;
    const previous = sanitizeThemeBackground(themeSettings.backgroundImage);
    themeSettings.backgroundImage = { src, x: previous?.x ?? 50, y: previous?.y ?? 50, opacity: previous?.opacity ?? 35 };
    applyThemeBackground();
    notifySheetChanged("appearance");
    setThemeBackgroundStatus("Imagem adicionada à ficha. Ajuste a posição e a opacidade abaixo.");
    return true;
  } catch (error) {
    if (isCurrent()) setThemeBackgroundStatus(error?.message || "Não foi possível adicionar a imagem.", true);
    return false;
  } finally {
    if (token === themeBackgroundEpoch) {
      themeBackgroundBusy = false;
      document.querySelector("#theme-background-file").value = "";
      syncThemeBackgroundControls();
    }
  }
}

function sanitizeTheme(raw) {
  const result = {};
  if (!raw || typeof raw !== "object") return result;
  THEME_FIELDS.forEach((field) => {
    const color = raw[field.key];
    if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) && color.toLowerCase() !== field.default) {
      result[field.key] = color.toLowerCase();
    }
  });
  const background = sanitizeThemeBackground(raw.backgroundImage);
  if (background) result.backgroundImage = background;
  return result;
}

function themeRgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
}

function shadeThemeColor(color, original, reference) {
  const rgb = themeRgb(color);
  const luminance = (hex) => {
    const [r, g, b] = themeRgb(hex);
    return (r * .2126 + g * .7152 + b * .0722) / 255;
  };
  const base = luminance(reference);
  const difference = luminance(original) - base;
  const weight = difference >= 0 ? difference / Math.max(.01, 1 - base) : difference / Math.max(.01, base);
  return rgb.map((v) => Math.min(255, Math.max(0, Math.round(weight >= 0 ? v + (255 - v) * weight : v * (1 + weight)))));
}

let appliedThemeColors = {};

function applyTheme() {
  applyThemeBackground();
  const style = document.documentElement.style;
  const defaults = Object.fromEntries(THEME_FIELDS.map((field) => [field.key, field.default]));
  const resolved = Object.fromEntries(
    THEME_FIELDS.map((field) => [field.key, themeSettings[field.key] || field.default]),
  );
  const changed = new Set(THEME_FIELDS.filter((field) => appliedThemeColors[field.key] !== resolved[field.key]).map((field) => field.key));
  if (!changed.size) return;
  const setColor = (name, color) => {
    if (!color) {
      style.removeProperty(name);
      style.removeProperty(name + "-rgb");
      return;
    }
    style.setProperty(name, color);
    style.setProperty(name + "-rgb", themeRgb(color).join(", "));
  };
  Object.entries(THEME_TONES).forEach(([key, originals]) => {
    if (!changed.has(key)) return;
    originals.forEach((original) => {
      const name = `--theme-${key}-${original}`;
      const rgb = shadeThemeColor(resolved[key], "#" + original, defaults[key]);
      const hex = "#" + rgb.map((value) => value.toString(16).padStart(2, "0")).join("");
      setColor(name, hex);
    });
  });
  const aliases = { background: "--bg", surface: "--surface", surfaceRaised: "--surface-raised", border: "--line", accent: "--accent", text: "--text", muted: "--muted" };
  Object.entries(aliases).forEach(([key, name]) => {
    if (changed.has(key)) setColor(name, resolved[key]);
  });
  const related = [["accent", "--accent-bright", "#f0d58f"], ["accent", "--accent-deep", "#7e6030"], ["border", "--line-strong", "#4d493f"], ["muted", "--dim", "#6d6b65"]];
  related.forEach(([key, name, original]) => {
    if (!changed.has(key)) return;
    const rgb = shadeThemeColor(resolved[key], original, defaults[key]);
    setColor(name, "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join(""));
  });
  THEME_FIELDS.forEach((field) => {
    if (changed.has(field.key)) setColor("--palette-" + field.key, resolved[field.key]);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && changed.has("background")) meta.content = resolved.background;
  appliedThemeColors = resolved;
}

let activeThemeKey = "accent";
let themePickerState = { h: 0, s: 1, v: 1 };
let themePointerId = null;

function themeHexToHsv(hex) {
  const [r, g, b] = themeRgb(hex).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? delta / max : 0, v: max };
}

function themeHsvToHex({ h, s, v }) {
  const hue = ((Number(h) || 0) % 360 + 360) % 360;
  const saturation = Math.min(1, Math.max(0, Number(s) || 0));
  const value = Math.min(1, Math.max(0, Number(v) || 0));
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = value - chroma;
  const channels = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] :
    hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return "#" + channels.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("");
}

function themeWheelCoordinates({ clientX, clientY }, rect) {
  const radius = Math.min(rect.width, rect.height) / 2;
  const x = clientX - rect.left - rect.width / 2;
  const y = clientY - rect.top - rect.height / 2;
  const h = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return { h, s: radius ? Math.min(1, Math.hypot(x, y) / radius) : 0 };
}

function syncThemeTargetPicker(field) {
  const trigger = document.querySelector("#theme-target");
  const color = themeSettings[field.key] || field.default;
  trigger.value = field.key;
  trigger.title = `${field.label}: ${color.toUpperCase()}`;
  document.querySelector("#theme-target-label").textContent = field.label;
  document.querySelector("#theme-target-swatch").style.backgroundColor = color;
  document.querySelector("#theme-target-options").querySelectorAll("[data-theme-option]").forEach((option) => {
    const entry = THEME_FIELDS.find((item) => item.key === option.dataset.themeOption);
    if (!entry) return;
    const entryColor = themeSettings[entry.key] || entry.default;
    option.setAttribute("aria-selected", String(entry.key === field.key));
    option.setAttribute("aria-label", `${entry.label}: ${entryColor.toUpperCase()}`);
    option.querySelector(".theme-target-swatch").style.backgroundColor = entryColor;
  });
}

function closeThemeTargetPicker({ restoreFocus = false } = {}) {
  const list = document.querySelector("#theme-target-options");
  const wasOpen = !list.hidden;
  list.hidden = true;
  list.dataset.themeSearch = "";
  document.querySelector("#theme-target").setAttribute("aria-expanded", "false");
  if (restoreFocus && wasOpen) document.querySelector("#theme-target").focus({ preventScroll: true });
}

function openThemeTargetPicker() {
  const list = document.querySelector("#theme-target-options");
  list.hidden = false;
  list.dataset.themeSearch = "";
  document.querySelector("#theme-target").setAttribute("aria-expanded", "true");
  const option = list.querySelector('[aria-selected="true"]') || list.querySelector("[data-theme-option]");
  option?.focus({ preventScroll: true });
  option?.scrollIntoView({ block: "nearest" });
}

function handleThemeTargetKeydown(event) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  openThemeTargetPicker();
}

function handleThemeTargetOptionsKeydown(event) {
  if (event.key === "Tab") { closeThemeTargetPicker(); return; }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeThemeTargetPicker({ restoreFocus: true });
    return;
  }
  const list = document.querySelector("#theme-target-options");
  const options = [...list.querySelectorAll("[data-theme-option]")];
  const current = event.target.closest("[data-theme-option]");
  if (!current || !options.length) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectThemeTarget(current.dataset.themeOption);
    closeThemeTargetPicker({ restoreFocus: true });
    return;
  }
  let index = options.indexOf(current);
  if (event.key === "ArrowDown") index = Math.min(options.length - 1, index + 1);
  else if (event.key === "ArrowUp") index = Math.max(0, index - 1);
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = options.length - 1;
  else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
    const now = Date.now();
    const normalize = (text) => text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const previous = now - Number(list.dataset.themeSearchTime || 0) < 700 ? list.dataset.themeSearch || "" : "";
    const letter = normalize(event.key);
    const search = previous === letter ? letter : previous + letter;
    list.dataset.themeSearch = search;
    list.dataset.themeSearchTime = String(now);
    const ordered = [...options.slice(index + 1), ...options.slice(0, index + 1)];
    const match = ordered.find((option) => normalize(THEME_FIELDS.find((field) => field.key === option.dataset.themeOption)?.label || "").startsWith(search));
    if (match) index = options.indexOf(match);
  } else return;
  event.preventDefault();
  options[index].focus({ preventScroll: true });
  options[index].scrollIntoView({ block: "nearest" });
}

function syncThemePicker({ readColor = true } = {}) {
  const field = THEME_FIELDS.find((entry) => entry.key === activeThemeKey) || THEME_FIELDS.find((entry) => entry.key === "accent");
  activeThemeKey = field.key;
  const color = themeSettings[field.key] || field.default;
  if (readColor) {
    const next = themeHexToHsv(color);
    // Black has no hue; preserve the chosen hue and intensity while adjusting brightness.
    themePickerState = { h: next.s ? next.h : themePickerState.h, s: next.v ? next.s : themePickerState.s, v: next.v };
  }
  const wheel = document.querySelector("#theme-color-wheel");
  const thumb = document.querySelector("#theme-wheel-thumb");
  const brightness = document.querySelector("#theme-brightness");
  const hex = document.querySelector("#theme-hex");
  const readOnly = isNotebookReadOnly();
  const angle = themePickerState.h * Math.PI / 180;
  thumb.style.setProperty("--wheel-x", `${50 + Math.cos(angle) * themePickerState.s * 50}%`);
  thumb.style.setProperty("--wheel-y", `${50 + Math.sin(angle) * themePickerState.s * 50}%`);
  wheel.style.setProperty("--wheel-value", String(themePickerState.v));
  wheel.setAttribute("aria-valuenow", String(Math.round(themePickerState.h)));
  wheel.setAttribute("aria-valuetext", `${color.toUpperCase()}; matiz ${Math.round(themePickerState.h)} graus, intensidade ${Math.round(themePickerState.s * 100)}%, brilho ${Math.round(themePickerState.v * 100)}%`);
  wheel.setAttribute("aria-label", `Cor de ${field.label}`);
  wheel.setAttribute("aria-disabled", String(readOnly));
  brightness.style.setProperty("--wheel-bright-color", themeHsvToHex({ ...themePickerState, v: 1 }));
  brightness.value = String(Math.round(themePickerState.v * 100));
  brightness.disabled = readOnly;
  document.querySelector("#theme-brightness-value").textContent = `${brightness.value}%`;
  hex.value = color.toUpperCase();
  hex.disabled = readOnly;
  hex.setCustomValidity("");
  hex.removeAttribute("aria-invalid");
  document.querySelector("#theme-hex-feedback").hidden = true;
  document.querySelector("#theme-current-swatch").style.backgroundColor = color;
  syncThemeTargetPicker(field);
  syncThemeBackgroundControls();
  document.querySelector("#theme-reset").disabled = readOnly;
  document.querySelector("#theme-preview-status").textContent = readOnly ? "Esta ficha está em modo de leitura." : "As mudanças aparecem na ficha enquanto você escolhe.";
  themeFields.querySelectorAll("[data-theme-key]").forEach((control) => {
    const entry = THEME_FIELDS.find((item) => item.key === control.dataset.themeKey);
    if (!entry) return;
    const entryColor = themeSettings[entry.key] || entry.default;
    control.setAttribute("aria-pressed", String(entry.key === field.key));
    control.setAttribute("aria-label", `${entry.label}: ${entryColor.toUpperCase()}`);
    control.querySelector(".theme-swatch").style.backgroundColor = entryColor;
    control.querySelector("[data-theme-value]").textContent = entryColor.toUpperCase();
  });
}

function selectThemeTarget(key) {
  if (!THEME_FIELDS.some((field) => field.key === key)) return false;
  activeThemeKey = key;
  syncThemePicker();
  return true;
}

function updateThemeColor(input, { notify = true, syncHsv = true } = {}) {
  if (isNotebookReadOnly()) return false;
  const field = THEME_FIELDS.find((entry) => entry.key === input?.dataset.themeKey);
  const color = String(input?.value || "").toLowerCase();
  if (!field || !/^#[0-9a-f]{6}$/.test(color)) return false;
  const previous = themeSettings[field.key] || field.default;
  if (color === field.default) delete themeSettings[field.key];
  else themeSettings[field.key] = color;
  applyTheme();
  syncThemePicker({ readColor: syncHsv });
  if (notify && color !== previous) notifySheetChanged("appearance");
  return true;
}

function setThemePickerColor(color, { syncHsv = true } = {}) {
  return updateThemeColor({ dataset: { themeKey: activeThemeKey }, value: color }, { syncHsv });
}

function handleThemeWheelPointer(event) {
  if (isNotebookReadOnly() || event.isPrimary === false) return;
  const wheel = document.querySelector("#theme-color-wheel");
  if (event.type === "pointerdown") {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    themePointerId = event.pointerId;
    wheel.focus({ preventScroll: true });
    try { wheel.setPointerCapture(event.pointerId); } catch {}
  } else if (themePointerId === null || event.pointerId !== themePointerId) return;
  event.preventDefault();
  const point = themeWheelCoordinates(event, wheel.getBoundingClientRect());
  if (point.s > 0) themePickerState.h = point.h;
  themePickerState.s = point.s;
  setThemePickerColor(themeHsvToHex(themePickerState), { syncHsv: false });
}

function releaseThemeWheelPointer(event = null) {
  if (event && event.pointerId !== themePointerId) return;
  const id = themePointerId;
  themePointerId = null;
  const wheel = document.querySelector("#theme-color-wheel");
  try { if (id !== null && wheel.hasPointerCapture(id)) wheel.releasePointerCapture(id); } catch {}
}

function handleThemeWheelKeydown(event) {
  if (isNotebookReadOnly()) return;
  const hueStep = event.shiftKey ? 15 : 3;
  const saturationStep = event.shiftKey ? .05 : .01;
  if (event.key === "ArrowRight") themePickerState.h = (themePickerState.h + hueStep) % 360;
  else if (event.key === "ArrowLeft") themePickerState.h = (themePickerState.h - hueStep + 360) % 360;
  else if (event.key === "ArrowUp") themePickerState.s = Math.min(1, themePickerState.s + saturationStep);
  else if (event.key === "ArrowDown") themePickerState.s = Math.max(0, themePickerState.s - saturationStep);
  else if (event.key === "Home") themePickerState.s = 0;
  else if (event.key === "End") themePickerState.s = 1;
  else return;
  event.preventDefault();
  setThemePickerColor(themeHsvToHex(themePickerState), { syncHsv: false });
}

function handleThemeBrightnessInput(event) {
  if (isNotebookReadOnly()) return;
  themePickerState.v = Math.min(1, Math.max(0, Number(event.currentTarget.value) / 100));
  setThemePickerColor(themeHsvToHex(themePickerState), { syncHsv: false });
}

function handleThemeHexInput(event) {
  const input = event.currentTarget;
  const raw = input.value.trim();
  const color = /^[0-9a-f]{6}$/i.test(raw) ? "#" + raw : raw;
  const valid = /^#[0-9a-f]{6}$/i.test(color);
  const showError = event.type === "change" && !valid;
  input.setCustomValidity(showError ? "Use uma cor com 6 dígitos, como #CFAD62." : "");
  input.toggleAttribute("aria-invalid", showError);
  document.querySelector("#theme-hex-feedback").hidden = !showError;
  if (valid) setThemePickerColor(color);
}

function renderThemeFields() {
  releaseThemeWheelPointer();
  closeThemeTargetPicker();
  themeFields.replaceChildren();
  const list = document.querySelector("#theme-target-options");
  list.replaceChildren();
  const groups = new Map();
  THEME_FIELDS.forEach((field) => {
    if (!groups.has(field.group)) {
      const group = document.createElement("fieldset");
      group.className = "theme-group";
      const legend = document.createElement("legend");
      legend.textContent = field.group;
      const fields = document.createElement("div");
      fields.className = "theme-group-fields";
      group.append(legend, fields);
      themeFields.append(group);
      const options = document.createElement("div");
      options.className = "theme-target-group";
      options.setAttribute("role", "group");
      options.setAttribute("aria-label", field.group);
      const heading = document.createElement("p");
      heading.className = "theme-target-group-label";
      heading.textContent = field.group;
      heading.setAttribute("aria-hidden", "true");
      options.append(heading);
      list.append(options);
      groups.set(field.group, { fields, options });
    }
    const color = themeSettings[field.key] || field.default;
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-target-option";
    option.dataset.themeOption = field.key;
    option.tabIndex = -1;
    option.setAttribute("role", "option");
    const optionSwatch = document.createElement("span");
    optionSwatch.className = "theme-target-swatch";
    optionSwatch.setAttribute("aria-hidden", "true");
    optionSwatch.style.backgroundColor = color;
    const optionLabel = document.createElement("span");
    optionLabel.textContent = field.label;
    option.append(optionSwatch, optionLabel);
    groups.get(field.group).options.append(option);
    const control = document.createElement("button");
    control.type = "button";
    control.className = "theme-color-control";
    control.dataset.themeKey = field.key;
    const swatch = document.createElement("span");
    swatch.className = "theme-swatch";
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.backgroundColor = color;
    const label = document.createElement("span");
    label.className = "theme-color-label";
    label.textContent = field.label;
    const value = document.createElement("output");
    value.dataset.themeValue = "";
    control.append(swatch, label, value);
    groups.get(field.group).fields.append(control);
  });
  syncThemePicker();
}

function positionThemePopover() {
  if (themeModal.hidden) return;
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft || 0;
  const viewportTop = viewport?.offsetTop || 0;
  const width = viewport?.width || window.innerWidth;
  const height = viewport?.height || window.innerHeight;
  const rect = themeButton.getBoundingClientRect();
  themeModal.style.maxWidth = `${Math.max(0, width - 20)}px`;
  const panelWidth = themeModal.getBoundingClientRect().width;
  const left = Math.max(viewportLeft + 10, Math.min(rect.right - panelWidth, viewportLeft + width - panelWidth - 10));
  const top = Math.max(viewportTop + 10, Math.min(rect.bottom + 10, viewportTop + height - 150));
  themeModal.style.left = `${left}px`;
  themeModal.style.right = "auto";
  themeModal.style.top = `${top}px`;
  themeDialog.style.setProperty("--theme-popover-room", `${Math.max(0, viewportTop + height - top - 10)}px`);
}

function resetThemePalette() {
  if (isNotebookReadOnly()) return;
  const background = sanitizeThemeBackground(themeSettings.backgroundImage);
  themeSettings = background ? { backgroundImage: background } : {};
  applyTheme();
  renderThemeFields();
  notifySheetChanged("appearance");
}



