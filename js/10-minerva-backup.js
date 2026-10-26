/* Portable Minerva backups. Cloud references are replaced with embedded images. */
(() => {
  "use strict";
  const TYPE = "abyss-rpg-minerva-backup";
  const MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  let restoreInFlight = false;

  function failure(message) { throw new Error(message); }
  function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function checkJson(value, depth = 0) {
    if (depth > 80) failure("O arquivo possui uma estrutura de dados inválida.");
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value)) return;
    if (Array.isArray(value)) { value.forEach(item => checkJson(item, depth + 1)); return; }
    if (!isObject(value)) failure("O arquivo contém um valor que não pertence a um backup JSON.");
    for (const [key, item] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) failure("O arquivo contém uma chave de dados inválida.");
      checkJson(item, depth + 1);
    }
  }
  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  async function sha256(value) {
    const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
  }
  function validId(value) {
    return typeof value === "string" && value.length > 0 && value === value.trim()
      && value !== "." && value !== ".." && !/[\/\u0000-\u001f\u007f]/.test(value)
      && new TextEncoder().encode(value).length <= 1500 && !/^__.*__$/.test(value);
  }
  function imageBytes(dataUrl, expectedType) {
    const match = typeof dataUrl === "string" && dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || !MIME_TYPES.has(match[1]) || (expectedType && match[1] !== expectedType)) failure("Uma imagem do backup possui formato inválido.");
    if (match[2].length % 4 !== 0 || match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) failure("Uma imagem do backup está incompleta ou ultrapassa os 8 MB aceitos pelo site.");
    let binary;
    try { binary = atob(match[2]); } catch { failure("Uma imagem do backup está corrompida."); }
    if (!binary.length || binary.length > MAX_IMAGE_BYTES || btoa(binary) !== match[2]) failure("Uma imagem do backup está corrompida.");
    return { mimeType: match[1], bytes: Uint8Array.from(binary, character => character.charCodeAt(0)) };
  }
  function checkEntry(entry, id, mediaIds) {
    if (!isObject(entry) || !validId(entry.id) || (id && entry.id !== id)
      || !["ability", "item"].includes(entry.kind)
      || typeof entry.name !== "string" || !entry.name.trim()) failure("O backup contém uma criação inválida.");
    if (entry.mediaBackupId !== undefined && (typeof entry.mediaBackupId !== "string" || !mediaIds.has(entry.mediaBackupId))) failure(`A imagem de “${entry.name || entry.id}” está ausente no backup.`);
    if (entry.mediaRefId || entry.mediaUrl || ["slot", "minerva"].includes(entry.mediaOwner)) failure(`A imagem de “${entry.name || entry.id}” ainda depende do site original. Este não é um backup completo.`);
    if (entry.mediaOwner === "backup" && !entry.mediaBackupId) failure("Uma criação perdeu sua referência de imagem no backup.");
  }
  function describe(payload) {
    return {
      entries: payload.entries.length,
      abilities: payload.entries.filter(entry => entry.kind !== "item").length,
      items: payload.entries.filter(entry => entry.kind === "item").length,
      images: payload.media.length,
      versions: payload.archive.reduce((sum, record) => sum + record.versions.length, 0),
      trash: payload.archive.filter(record => record.deleted).length,
      createdAt: payload.createdAt,
    };
  }
  async function validateBackup(raw) {
    checkJson(raw);
    if (!isObject(raw) || raw.type !== TYPE || raw.version !== 1
      || typeof raw.createdAt !== "string" || !Number.isFinite(Date.parse(raw.createdAt))
      || !Array.isArray(raw.entries) || !Array.isArray(raw.archive) || !Array.isArray(raw.media)) failure("Escolha um backup completo do Grimório de Minerva, versão 1.");
    const mediaIds = new Set();
    for (const item of raw.media) {
      if (!isObject(item) || !validId(item.id) || mediaIds.has(item.id)
        || !MIME_TYPES.has(item.mimeType) || !/^[a-f0-9]{64}$/.test(item.sha256 || "")) failure("A lista de imagens do backup é inválida.");
      mediaIds.add(item.id);
      const image = imageBytes(item.dataUrl, item.mimeType);
      if (await sha256(image.bytes) !== item.sha256) failure("Uma imagem do backup foi alterada ou está corrompida.");
    }
    const ids = new Set();
    raw.entries.forEach(entry => {
      checkEntry(entry, "", mediaIds);
      if (ids.has(entry.id)) failure("O backup contém criações com o mesmo identificador.");
      ids.add(entry.id);
    });
    const archiveIds = new Set();
    raw.archive.forEach(record => {
      if (!isObject(record) || !validId(record.id) || archiveIds.has(record.id)
        || typeof record.deleted !== "boolean" || !Array.isArray(record.versions)
        || !Number.isSafeInteger(record.revision) || record.revision < 0) failure("A lixeira ou o histórico do backup é inválido.");
      archiveIds.add(record.id);
      if (record.entry != null) checkEntry(record.entry, record.id, mediaIds);
      if (record.deleted && !record.entry) failure("Uma criação da lixeira está ausente do backup.");
      if (!ids.has(record.id) && !record.entry) failure("O histórico contém uma criação sem conteúdo no backup.");
      if (record.deleted && ids.has(record.id)) failure("A mesma criação aparece ativa e na lixeira do backup.");
      const versionIds = new Set();
      record.versions.forEach(version => {
        if (!isObject(version) || !validId(version.id) || versionIds.has(version.id)) failure("Uma versão anterior do backup é inválida.");
        versionIds.add(version.id);
        checkEntry(version.entry, record.id, mediaIds);
      });
    });
    if (raw.integrity?.algorithm !== "SHA-256" || !/^[a-f0-9]{64}$/.test(raw.integrity?.sha256 || "")) failure("O backup não possui a verificação de integridade necessária.");
    const { integrity, ...content } = raw;
    if (await sha256(canonical(content)) !== integrity.sha256) failure("O arquivo está incompleto ou foi alterado. Use a cópia original do backup.");
    return JSON.parse(JSON.stringify(raw));
  }
  async function packBackup(content) {
    const copy = JSON.parse(JSON.stringify(content));
    delete copy.integrity;
    copy.integrity = { algorithm: "SHA-256", sha256: await sha256(canonical(copy)) };
    return validateBackup(copy);
  }
  function session() {
    const cloud = window.AbyssCloud;
    const key = cloud?.getMinervaAccountKey?.();
    if (!key || !cloud?.isMinervaAdmin?.()) failure("Entre com uma conta administradora para acessar os backups do Grimório.");
    return { cloud, key, assert() {
      if (window.AbyssCloud !== cloud || cloud.getMinervaAccountKey() !== key || !cloud.isMinervaAdmin()) failure("A conta mudou durante a operação. Entre novamente e tente outra vez.");
    } };
  }
  async function dataUrlFromLink(value, label) {
    if (value.startsWith("data:")) { imageBytes(value); return value; }
    let url;
    try { url = new URL(value, document.baseURI); } catch { failure(`A imagem de “${label}” tem um link inválido.`); }
    if (!["https:", "http:"].includes(url.protocol)) failure(`A imagem de “${label}” não pode ser incluída no backup.`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url.href, { mode: "cors", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new Error("image-fetch");
      const blob = await response.blob();
      if (!MIME_TYPES.has(blob.type) || blob.size > MAX_IMAGE_BYTES || blob.size === 0) throw new Error("image-format");
      const result = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("image-read"));
        reader.readAsDataURL(blob);
      });
      imageBytes(result);
      return result;
    } catch {
      failure(`Não foi possível incluir a imagem de “${label}”. O link pode estar indisponível ou bloquear cópias. Envie essa imagem pelo editor e tente exportar novamente. Nenhum backup incompleto foi gerado.`);
    } finally { clearTimeout(timeout); }
  }
  async function exportBackup() {
    if (restoreInFlight) failure("Aguarde a restauração terminar antes de exportar.");
    const context = session();
    const raw = await context.cloud.readMinervaBackup();
    context.assert();
    const payload = { type: TYPE, version: 1, createdAt: new Date().toISOString(),
      entries: JSON.parse(JSON.stringify(raw.entries)), archive: JSON.parse(JSON.stringify(raw.archive)), media: [] };
    const references = new Map();
    const images = new Map();
    async function portable(entry) {
      if (!entry) return;
      entry.kind = entry.kind === "item" ? "item" : "ability";
      const ref = entry.mediaRefId && entry.mediaOwner === "minerva" ? entry.mediaRefId : "";
      if (entry.mediaRefId && !ref) failure(`A imagem de “${entry.name || entry.id}” não pertence ao Grimório. Envie-a novamente pelo editor antes do backup.`);
      const key = ref ? `minerva:${ref}` : entry.mediaUrl ? `url:${entry.mediaUrl}` : "";
      if (key) {
        let image = references.get(key);
        if (!image) {
          let dataUrl;
          if (ref) {
            dataUrl = await context.cloud.readMinervaBackupMedia({ scope: "minerva", refId: ref });
            if (!dataUrl) failure(`A imagem de “${entry.name || entry.id}” está indisponível. Nenhum backup incompleto foi gerado.`);
          } else dataUrl = await dataUrlFromLink(entry.mediaUrl, entry.name || entry.id);
          context.assert();
          const decoded = imageBytes(dataUrl);
          const digest = await sha256(decoded.bytes);
          const imageId = `m_${digest}`;
          image = images.get(imageId) || { id: imageId, dataUrl, mimeType: decoded.mimeType, sha256: digest };
          if (!images.has(imageId)) { images.set(imageId, image); payload.media.push(image); }
          references.set(key, image);
        }
        entry.mediaBackupId = image.id;
        entry.mediaOwner = "backup";
      } else { entry.mediaOwner = "link"; delete entry.mediaBackupId; }
      entry.mediaRefId = "";
      entry.mediaUrl = "";
    }
    for (const entry of payload.entries) await portable(entry);
    for (const record of payload.archive) {
      if (record.entry) await portable(record.entry);
      for (const version of record.versions) await portable(version.entry);
    }
    context.assert();
    const complete = await packBackup(payload);
    context.assert();
    return { payload: complete, json: JSON.stringify(complete, null, 2),
      fileName: `Abyss-Grimorio-${complete.createdAt.replace(/[:.]/g, "-")}.json`, summary: describe(complete) };
  }
  async function inspectBackup(file) {
    if (!file || typeof file.text !== "function") failure("Escolha um arquivo de backup JSON.");
    let raw;
    try { raw = JSON.parse(await file.text()); } catch { failure("Não foi possível ler esse arquivo JSON. Use o arquivo original do backup."); }
    const payload = await validateBackup(raw);
    return { payload, summary: describe(payload) };
  }
  async function restoreBackup(raw, { onProgress = () => {} } = {}) {
    if (restoreInFlight) failure("Já existe uma restauração em andamento.");
    restoreInFlight = true;
    let processed = 0;
    let started = false;
    try {
      const context = session();
      const payload = await validateBackup(raw);
      context.assert();
      const active = new Map(payload.entries.map(entry => [entry.id, entry]));
      const archive = new Map(payload.archive.map(record => [record.id, record]));
      const ids = [...new Set([...active.keys(), ...archive.keys()])];
      const total = payload.media.length + ids.length;
      let current = 0;
      const report = message => { try { onProgress({ message, current, total }); } catch {} };
      const media = new Map();
      const importId = `restore-${crypto.randomUUID()}`;
      for (const item of payload.media) {
        context.assert();
        report(`Preparando imagem ${media.size + 1} de ${payload.media.length}…`);
        const image = imageBytes(item.dataUrl, item.mimeType);
        const extension = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" }[item.mimeType];
        const file = new File([image.bytes], `${item.id}.${extension}`, { type: item.mimeType });
        started = true;
        const uploaded = await context.cloud.uploadAbilityMedia({ scope: "minerva", abilityId: item.id, file });
        context.assert();
        if (!uploaded?.refId) failure("Uma imagem não pôde ser enviada. As criações existentes foram preservadas.");
        media.set(item.id, uploaded);
        current++;
      }
      function materialize(entry) {
        if (!entry) return null;
        const copy = JSON.parse(JSON.stringify(entry));
        if (copy.mediaBackupId) {
          const uploaded = media.get(copy.mediaBackupId);
          copy.mediaRefId = uploaded.refId;
          copy.mediaOwner = "minerva";
          copy.mediaUrl = "";
          delete copy.mediaBackupId;
        }
        return copy;
      }
      for (const id of ids) {
        context.assert();
        const record = archive.get(id);
        const { versions: ignoredVersions, ...recordMetadata } = record || {};
        report(`Restaurando ${processed + 1} de ${ids.length}: ${active.get(id)?.name || record?.entry?.name || record?.name || id}`);
        started = true;
        await context.cloud.importMinervaBackupRecord({ id, entry: materialize(active.get(id)),
          archive: record ? { ...recordMetadata, entry: materialize(record.entry) } : null,
          versions: (record?.versions || []).map(version => ({ ...version, entry: materialize(version.entry) })),
        }, { importId, sourceId: payload.integrity.sha256.slice(0, 32) });
        context.assert();
        processed++; current++;
      }
      report("Restauração concluída. O conteúdo anterior substituído está nas versões.");
      return { ...describe(payload), processed, total: ids.length };
    } catch (error) {
      if (started) {
        const message = error?.message || "A conexão foi interrompida.";
        throw new Error(`${message} Restauração interrompida: ${processed} criação(ões) concluída(s). As alterações já concluídas foram preservadas; você pode importar o arquivo novamente. Criações substituídas continuam nas versões anteriores.`);
      }
      throw error;
    } finally { restoreInFlight = false; }
  }
  window.AbyssMinervaBackup = Object.freeze({ exportBackup, inspectBackup, restoreBackup, validateBackup, packBackup });
})();
