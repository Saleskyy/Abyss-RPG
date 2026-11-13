/* A interface trata arquivos e nomes importados somente como dados. */
(() => {
  "use strict";

  const modal = document.querySelector("#minerva-safety-modal");
  const dialog = document.querySelector("#minerva-safety-dialog");
  const openButton = document.querySelector("#open-minerva-safety");
  if (!modal || !dialog || !openButton) return;

  const feedback = document.querySelector("#minerva-safety-feedback");
  const exportButton = document.querySelector("#minerva-backup-export");
  const fileInput = document.querySelector("#minerva-backup-file");
  const backupPreview = document.querySelector("#minerva-backup-preview");
  const backupSummary = document.querySelector("#minerva-backup-summary");
  const restoreButton = document.querySelector("#minerva-backup-restore");
  const trashList = document.querySelector("#minerva-trash-list");
  const trashSearch = document.querySelector("#minerva-trash-search");
  const versionEntry = document.querySelector("#minerva-version-entry");
  const versionList = document.querySelector("#minerva-version-list");
  const versionPreview = document.querySelector("#minerva-version-preview");
  const tabs = Array.from(dialog.querySelectorAll("[data-minerva-safety-tab]"));
  const kindLabels = { inventory: "Item", item: "Item", weapon: "Arma", attack: "Ataque", attacks: "Ataque", power: "Poder", powers: "Poder", spell: "Feitiço", spells: "Feitiço", background: "Antecedência", backgrounds: "Antecedência", style: "Estilo de Luta", styles: "Estilo de Luta", echo: "Eco", echoes: "Eco", trick: "Truque", tricks: "Truque", upgrade: "Melhoria", upgrades: "Melhoria", class: "Classe", classes: "Classe", tree: "Árvore" };
  const actionLabels = { create: "Criação", created: "Criação", edit: "Antes de editar", "before-edit": "Antes de editar", update: "Antes de editar", delete: "Antes de excluir", deleted: "Antes de excluir", trash: "Antes de excluir", restore: "Antes de restaurar", "restore-version": "Antes de restaurar uma versão", "before-version-restore": "Antes de restaurar uma versão", "before-trash-restore": "Antes de recuperar da lixeira", "before-backup-restore": "Antes de restaurar um backup", "imported-version": "Versão recuperada de um backup", import: "Antes de importar um backup", backup: "Cópia do backup", migration: "Versão inicial" };
  let generation = 0;
  let versionGeneration = 0;
  let opener = null;
  let accountAtOpen = null;
  let busy = false;
  let writingToken = null;
  let archive = [];
  let archiveLoaded = false;
  let selectedBackup = null;
  let activeTab = "backup";
  let currentVersions = [];
  let selectedVersionId = null;
  let underlyingInert = false;

  function accountKey() {
    const cloud = window.AbyssCloud;
    return cloud?.getMinervaAccountKey?.() ?? (cloud?.isSignedIn?.() ? "signed-in" : null);
  }

  function isCurrent(token = generation) {
    return token === generation && !modal.hidden && accountKey() === accountAtOpen && Boolean(window.AbyssCloud?.isMinervaAdmin?.());
  }

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = String(text ?? "");
    return result;
  }

  function setFeedback(message = "", tone = "") {
    feedback.textContent = String(message);
    feedback.dataset.tone = tone;
    feedback.setAttribute("role", tone === "error" ? "alert" : "status");
  }

  function showError(error) {
    const message = String(error?.code || "").includes("permission-denied")
      ? "O Firebase não autorizou esta operação. Confira a conta e publique as regras do arquivo regras.txt atualizado para ativar a recuperação."
      : error?.message || window.AbyssCloud?.describeError?.(error) || "Não foi possível concluir. Tente novamente.";
    setFeedback(message, "error");
  }

  function formatDate(value) {
    if (!value) return "Data não registrada";
    const parsed = value?.toDate ? value.toDate() : new Date(typeof value === "object" && Number.isFinite(value.seconds) ? value.seconds * 1000 : value);
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Data não registrada";
  }

  function displayName(entry) { return String(entry?.name || entry?.entry?.name || "Criação sem título"); }
  function kindLabel(entry) { const value = entry?.kind || entry?.entry?.kind || entry?.type; return kindLabels[value] || "Criação"; }

  function setBusy(value) {
    busy = value;
    dialog.setAttribute("aria-busy", String(value));
    dialog.querySelectorAll("button:not([data-close-minerva-safety]), input, select").forEach((control) => { control.disabled = value; });
    if (!value) restoreButton.disabled = !selectedBackup;
  }

  function requireApi(group, method) {
    const api = window[group];
    if (typeof api?.[method] !== "function") throw new Error("Esta ferramenta ainda não terminou de carregar. Recarregue o site e tente novamente.");
    return api[method].bind(api);
  }

  function refreshGrimoire() {
    archiveLoaded = false;
    window.dispatchEvent(new CustomEvent("abyss:minerva-restored"));
  }

  function empty(container, text) { container.replaceChildren(node("p", "minerva-safety-empty", text)); }

  function summaryCount(summary, key) {
    const candidate = summary?.[key] ?? summary?.[`${key}Count`];
    return Array.isArray(candidate) ? candidate.length : Number.isFinite(Number(candidate)) && candidate !== null ? Number(candidate) : null;
  }

  function renderSummary(summary = {}) {
    backupSummary.replaceChildren();
    const labels = [["entries", "criações"], ["abilities", "habilidades"], ["items", "itens"], ["images", "imagens"], ["versions", "versões"], ["trash", "na lixeira"]];
    labels.forEach(([key, label]) => {
      const amount = summaryCount(summary, key);
      if (amount !== null) backupSummary.append(node("span", "", `${amount} ${label}`));
    });
    if (summary.createdAt) backupSummary.append(node("span", "", `Exportado em ${formatDate(summary.createdAt)}`));
    if (!backupSummary.childElementCount) backupSummary.append(node("span", "", "Arquivo de backup válido"));
  }

  function renderTrash() {
    const search = trashSearch.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
    const deleted = archive.filter((entry) => entry.deleted === true);
    const visible = deleted.filter((entry) => displayName(entry).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(search));
    trashList.replaceChildren();
    if (!visible.length) return empty(trashList, deleted.length ? "Nenhuma criação corresponde à busca." : "Sua lixeira está vazia.");
    visible.forEach((entry) => {
      const row = node("article", "minerva-safety-trash-row");
      const copy = node("div");
      copy.append(node("h4", "", displayName(entry)), node("p", "", `${kindLabel(entry)} · Excluída em ${formatDate(entry.deletedAt)}`));
      const button = node("button", "dialog-button", "Restaurar");
      button.type = "button";
      button.disabled = busy;
      button.setAttribute("aria-label", `Restaurar ${displayName(entry)}`);
      button.addEventListener("click", () => restoreTrash(entry));
      row.append(copy, button);
      trashList.append(row);
    });
  }

  function renderEntryOptions(preferred = versionEntry.value) {
    versionEntry.replaceChildren(node("option", "", "Escolha uma criação"));
    versionEntry.firstElementChild.value = "";
    const sorted = [...archive].sort((left, right) => displayName(left).localeCompare(displayName(right), "pt-BR"));
    sorted.forEach((entry) => {
      const option = node("option", "", `${displayName(entry)} · ${kindLabel(entry)}${entry.deleted ? " · Na lixeira" : ""}`);
      option.value = entry.id;
      versionEntry.append(option);
    });
    if (sorted.some((entry) => entry.id === preferred)) versionEntry.value = preferred;
  }

  async function loadArchive({ reload = false, loadSelectedVersions = true } = {}) {
    if (busy) return;
    if (archiveLoaded && !reload) {
      renderTrash();
      renderEntryOptions();
      return;
    }
    const token = generation;
    setBusy(true);
    setFeedback("Buscando registros do Grimório...");
    try {
      const records = await requireApi("AbyssCloud", "listMinervaArchive")();
      if (!isCurrent(token)) return;
      archive = Array.isArray(records) ? records : [];
      archiveLoaded = true;
      renderTrash();
      renderEntryOptions();
      setFeedback(`${archive.filter((entry) => !entry.deleted).length} criações no acervo · ${archive.filter((entry) => entry.deleted).length} na lixeira.`);
    } catch (error) {
      if (isCurrent(token)) { showError(error); empty(activeTab === "trash" ? trashList : versionList, "Não foi possível carregar. Use Atualizar para tentar novamente."); }
    } finally {
      if (isCurrent(token)) setBusy(false);
    }
    if (isCurrent(token) && activeTab === "versions" && versionEntry.value && loadSelectedVersions) await loadVersions();
  }

  async function restoreTrash(entry) {
    if (busy || !isCurrent()) return;
    const token = generation;
    writingToken = token;
    setBusy(true);
    setFeedback(`Restaurando ${displayName(entry)}...`);
    try {
      await requireApi("AbyssCloud", "restoreMinervaTrash")(entry.id);
      if (!isCurrent(token)) return;
      archive = archive.map((record) => record.id === entry.id ? { ...record, deleted: false } : record);
      renderTrash();
      renderEntryOptions();
      refreshGrimoire();
      setFeedback(`${displayName(entry)} voltou ao Grimório.`, "success");
    } catch (error) { if (isCurrent(token)) showError(error); }
    finally { if (writingToken === token) writingToken = null; if (isCurrent(token)) setBusy(false); }
  }

  async function loadVersions() {
    if (busy || !isCurrent()) return;
    const id = versionEntry.value;
    const token = generation;
    const listToken = ++versionGeneration;
    currentVersions = [];
    selectedVersionId = null;
    if (!id) {
      versionList.replaceChildren();
      empty(versionPreview, "Escolha uma criação para ver suas versões anteriores.");
      return;
    }
    setBusy(true);
    empty(versionList, "Buscando versões...");
    empty(versionPreview, "Escolha uma versão para conferir seu conteúdo.");
    try {
      const records = await requireApi("AbyssCloud", "listMinervaVersions")(id);
      if (!isCurrent(token) || listToken !== versionGeneration || versionEntry.value !== id) return;
      currentVersions = Array.isArray(records) ? records : [];
      renderVersions();
      setFeedback(`${currentVersions.length} versões disponíveis.`);
    } catch (error) {
      if (isCurrent(token) && listToken === versionGeneration) { showError(error); empty(versionList, "Não foi possível carregar as versões."); }
    } finally { if (isCurrent(token) && listToken === versionGeneration) setBusy(false); }
  }

  function renderVersions() {
    versionList.replaceChildren();
    if (!currentVersions.length) {
      empty(versionList, "Nenhuma versão anterior disponível.");
      empty(versionPreview, "Novas alterações guardarão a versão anterior automaticamente.");
      return;
    }
    currentVersions.forEach((record, index) => {
      const button = node("button", "minerva-safety-version-choice");
      button.type = "button";
      button.disabled = busy;
      button.setAttribute("aria-pressed", String(record.id === selectedVersionId));
      button.append(node("strong", "", formatDate(record.savedAt)), node("small", "", actionLabels[record.action] || `Versão ${currentVersions.length - index}`));
      button.addEventListener("click", () => selectVersion(record));
      versionList.append(button);
    });
  }

  function selectVersion(record) {
    if (busy || !isCurrent()) return;
    selectedVersionId = record.id;
    renderVersions();
    const entry = record.entry || {};
    const description = typeof entry.description === "string" ? entry.description : typeof entry.desc === "string" ? entry.desc : "Esta criação não tem uma descrição.";
    const button = node("button", "dialog-button minerva-safety-primary", "Restaurar esta versão");
    button.type = "button";
    button.addEventListener("click", () => restoreVersion(versionEntry.value, record));
    versionPreview.replaceChildren(node("h4", "", displayName(record)), node("p", "minerva-safety-version-date", `${kindLabel(entry)} · ${formatDate(record.savedAt)}`), node("p", "minerva-safety-version-description", description), node("small", "", "Os dados completos desta versão serão recuperados. A versão atual ficará guardada antes da mudança."), button);
  }

  async function restoreVersion(entryId, record) {
    if (busy || !isCurrent() || !entryId || versionEntry.value !== entryId || record.id !== selectedVersionId) return;
    const token = generation;
    let restored = false;
    writingToken = token;
    setBusy(true);
    setFeedback("Restaurando a versão selecionada...");
    try {
      await requireApi("AbyssCloud", "restoreMinervaVersion")(entryId, record.id);
      if (!isCurrent(token)) return;
      refreshGrimoire();
      restored = true;
      setFeedback("Versão restaurada. A versão que estava no acervo foi guardada no histórico.", "success");
    } catch (error) { if (isCurrent(token)) showError(error); }
    finally { if (writingToken === token) writingToken = null; if (isCurrent(token)) setBusy(false); }
    if (restored && isCurrent(token)) {
      await loadArchive({ reload: true, loadSelectedVersions: false });
      if (isCurrent(token)) await loadVersions();
      if (isCurrent(token) && feedback.dataset.tone !== "error") setFeedback("Versão restaurada. A versão que estava no acervo foi guardada no histórico.", "success");
    }
  }

  function selectTab(name, { focus = false } = {}) {
    if (busy || !["backup", "trash", "versions"].includes(name)) return;
    activeTab = name;
    tabs.forEach((tab) => {
      const selected = tab.dataset.minervaSafetyTab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.querySelector(`#minerva-safety-panel-${tab.dataset.minervaSafetyTab}`).hidden = !selected;
      if (focus && selected) tab.focus();
    });
    setFeedback();
    if (name !== "backup") void loadArchive();
  }

  function open(event) {
    if (!window.AbyssCloud?.isMinervaAdmin?.()) return;
    generation += 1;
    versionGeneration += 1;
    opener = event?.currentTarget || document.activeElement;
    accountAtOpen = accountKey();
    archive = [];
    archiveLoaded = false;
    selectedBackup = null;
    fileInput.value = "";
    backupPreview.hidden = true;
    versionEntry.value = "";
    versionList.replaceChildren();
    empty(versionPreview, "Escolha uma criação para ver suas versões anteriores.");
    trashSearch.value = "";
    modal.hidden = false;
    const underlying = document.querySelector("#minerva-dialog");
    underlyingInert = underlying?.inert || false;
    if (underlying) underlying.inert = true;
    setBusy(false);
    selectTab("backup");
    window.AbyssSheet?.syncModalLock?.();
    document.body.classList.add("modal-open");
    dialog.focus();
  }

  function close({ restoreFocus = true, force = false } = {}) {
    if (modal.hidden) return;
    if (!force && writingToken === generation && accountKey() === accountAtOpen) {
      setFeedback("Restauração em andamento. Aguarde a conclusão antes de fechar esta janela.");
      return;
    }
    generation += 1;
    versionGeneration += 1;
    modal.hidden = true;
    const underlying = document.querySelector("#minerva-dialog");
    if (underlying) underlying.inert = underlyingInert;
    selectedBackup = null;
    writingToken = null;
    fileInput.value = "";
    window.AbyssSheet?.syncModalLock?.();
    if (restoreFocus && opener?.isConnected && !opener.closest("[hidden]")) opener.focus();
    opener = null;
  }

  exportButton.addEventListener("click", async () => {
    if (busy || !isCurrent()) return;
    const token = generation;
    setBusy(true);
    setFeedback("Preparando as criações e imagens para o backup...");
    try {
      const result = await requireApi("AbyssMinervaBackup", "exportBackup")();
      if (!isCurrent(token)) return;
      const data = typeof result.json === "string" ? result.json : JSON.stringify(result.json, null, 2);
      const url = URL.createObjectURL(new Blob([data], { type: "application/json;charset=utf-8" }));
      const anchor = node("a");
      anchor.href = url;
      anchor.download = String(result.fileName || `Abyss-Grimorio-${new Date().toISOString().slice(0, 10)}.json`).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-");
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setFeedback("Backup preparado e download iniciado. Guarde esse arquivo fora do site para poder recuperá-lo depois.", "success");
    } catch (error) { if (isCurrent(token)) showError(error); }
    finally { if (isCurrent(token)) setBusy(false); }
  });

  fileInput.addEventListener("change", async () => {
    if (busy || !isCurrent()) return;
    const file = fileInput.files?.[0];
    selectedBackup = null;
    backupPreview.hidden = true;
    if (!file) return;
    const token = generation;
    setBusy(true);
    setFeedback("Conferindo o arquivo de backup...");
    try {
      const result = await requireApi("AbyssMinervaBackup", "inspectBackup")(file);
      if (!isCurrent(token)) return;
      selectedBackup = result.payload;
      document.querySelector("#minerva-backup-file-name").textContent = file.name;
      renderSummary(result.summary);
      backupPreview.hidden = false;
      setFeedback("Arquivo conferido. Revise o conteúdo e use Restaurar este backup para continuar.");
    } catch (error) { if (isCurrent(token)) showError(error); }
    finally { if (isCurrent(token)) setBusy(false); }
  });

  restoreButton.addEventListener("click", async () => {
    if (busy || !selectedBackup || !isCurrent()) return;
    const token = generation;
    writingToken = token;
    const payload = selectedBackup;
    setBusy(true);
    setFeedback("Restaurando o backup...");
    try {
      const result = await requireApi("AbyssMinervaBackup", "restoreBackup")(payload, { onProgress(progress) {
        if (!isCurrent(token)) return;
        if (typeof progress === "string") setFeedback(progress);
        else setFeedback(progress?.message || `Restaurando${Number.isFinite(progress?.current) && Number.isFinite(progress?.total) ? ` ${progress.current} de ${progress.total}` : ""}...`);
      } });
      if (!isCurrent(token)) return;
      selectedBackup = null;
      backupPreview.hidden = true;
      fileInput.value = "";
      refreshGrimoire();
      const count = result?.restored ?? result?.processed ?? result?.entries;
      setFeedback(`Backup restaurado${Number.isFinite(count) ? ` · ${count} criações recuperadas` : ""}. As criações que só existiam no acervo atual foram mantidas.`, "success");
    } catch (error) { if (isCurrent(token)) showError(error); }
    finally { if (writingToken === token) writingToken = null; if (isCurrent(token)) setBusy(false); }
  });

  openButton.addEventListener("click", open);
  modal.querySelectorAll("[data-close-minerva-safety]").forEach((button) => button.addEventListener("click", () => close()));
  tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.minervaSafetyTab)));
  document.querySelector("#minerva-safety-tabs").addEventListener("keydown", (event) => {
    if (busy || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next].dataset.minervaSafetyTab, { focus: true });
  });
  trashSearch.addEventListener("input", renderTrash);
  document.querySelector("#minerva-trash-refresh").addEventListener("click", () => loadArchive({ reload: true }));
  document.querySelector("#minerva-versions-refresh").addEventListener("click", () => loadArchive({ reload: true }));
  versionEntry.addEventListener("change", () => loadVersions());

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (event.key === "Tab") {
      const focusable = Array.from(dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex='0']")).filter((element) => !element.closest("[hidden]") && element.getClientRects().length > 0);
      if (!focusable.length) { event.preventDefault(); dialog.focus(); }
      else {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement) || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
      }
      event.stopImmediatePropagation();
    }
  }, true);

  new MutationObserver(() => {
    if (!modal.hidden && (!window.AbyssCloud?.isMinervaAdmin?.() || accountKey() !== accountAtOpen)) close({ restoreFocus: false, force: true });
  }).observe(openButton, { attributes: true, attributeFilter: ["hidden", "disabled"] });
  window.addEventListener("abyss:firebase-login", () => { if (!modal.hidden && accountKey() !== accountAtOpen) close({ restoreFocus: false, force: true }); });
  window.addEventListener("abyss:account-changed", () => { if (!modal.hidden) close({ restoreFocus: false, force: true }); });
})();
