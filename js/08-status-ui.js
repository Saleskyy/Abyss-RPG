"use strict";

(() => {
  const model = window.AbyssStatusEffects;
  const ui = Object.fromEntries([
    "campaign-status-controls", "campaign-status-target", "campaign-roll-wound", "campaign-roll-fear", "campaign-add-condition", "campaign-status-feedback",
    "status-effects-modal", "status-effects-dialog", "status-effects-title", "status-effects-subtitle", "status-last-result", "status-wound-choice", "status-wound-skill", "status-apply-wound",
    "status-condition-chooser", "status-condition-search", "status-condition-list", "status-inspector", "status-numeric-summary", "status-active-effects",
    "status-master-notes", "status-save-notes", "status-modal-feedback", "sheet-status-warning", "sheet-status-count",
    "status-notice-modal", "status-notice-dialog", "status-notice-kind", "status-notice-character", "status-notice-title", "status-notice-description", "status-notice-rolls",
  ].map(id => [id, document.getElementById(id)]));
  let campaign = { campaignId: "", isMaster: false, sheets: [] };
  let currentStatus = { effects: [], notes: "", runtime: {} };
  let inspected = null;
  let pendingWound = null;
  let epoch = 0;
  let busy = false;
  let returnFocus = null;
  let notesDirty = false;
  let currentSlotIdentity = "";
  const noticeQueue = [];
  const seenNotices = new Set();
  let activeNotice = null;
  let noticeReturnFocus = null;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  };
  const sign = value => value > 0 ? `+${value}` : String(value);
  const effectTitle = effect => effect.type === "fear" && effect.tierName ? `${effect.tierName} · ${effect.name}` : effect.name;
  const cloud = () => window.AbyssCloud;
  const findSheet = id => campaign.sheets.find(sheet => sheet.id === id);
  const selectedSheet = () => findSheet(ui["campaign-status-target"].value);
  const statusFor = sheet => sheet?.status || cloud()?.getSlotStatus?.(sheet) || currentStatus;
  const profileFor = sheet => sheet?.profile || statusFor(sheet)?.profile || (sheet?.current ? window.AbyssSheet?.captureState?.().profile : null) || {};
  const canManage = sheet => Boolean(campaign.isMaster && findSheet(sheet?.id));
  const feedback = (text, error = false, modal = false) => {
    const node = ui[modal ? "status-modal-feedback" : "campaign-status-feedback"];
    node.textContent = text;
    node.classList.toggle("is-error", error);
  };
  function getRollContext(skillName = "") {
    return { skillName };
  }
  function summaryFor(sheet) {
    const status = statusFor(sheet);
    const profile = profileFor(sheet);
    const summary = model.summarize(status.effects, profile.resources || {}, {
      ...getRollContext(), runtime: status.runtime || {}, constitution: Number(profile.attributes?.CON) || 0,
      movement: Number(profile.combat?.movement ?? 6), block: Number(profile.combat?.block ?? 0),
    });
    // Private cards receive only health flags, never the underlying resource values.
    if (!profile.resources) {
      for (const key of ["machucado", "perturbado", "enlouquecido", "exausto"]) {
        if (status.health?.[key] !== true || summary.activeEffects.some(effect => effect.type === "condition" && effect.key === key)) continue;
        const stored = (summary.suppressedEffects || []).find(effect => effect.type === "condition" && effect.key === key);
        const effect = { ...(stored || model.createCondition(key)), id: stored?.id || `health-${key}`, derived: !stored, automatic: true, suppressed: false, reason: "" };
        summary.activeEffects.push(effect);
        summary.suppressedEffects = (summary.suppressedEffects || []).filter(item => item.id !== effect.id);
        summary.notes = (summary.notes || []).filter(item => item.id !== effect.id);
        summary.notes.push(effect);
        if (key === "perturbado") {
          summary.adjustments.skillTests.Vontade = (summary.adjustments.skillTests.Vontade || 0) - 2;
          summary.modifiers.push({ sourceId: effect.id, label: "Vontade", target: "skills", value: -2 });
        }
        if (key === "exausto") {
          summary.adjustments.movementHalf = true;
          summary.adjustments.skillTests.Fortitude = (summary.adjustments.skillTests.Fortitude || 0) - 2;
          summary.modifiers.push({ sourceId: effect.id, label: "Fortitude", target: "skills", value: -2 });
        }
      }
    }
    return summary;
  }
  function effectList(summary, status) {
    return summary.activeEffects || [...(status.effects || []), ...(summary.derivedEffects || [])];
  }
  function numericChanges(summary) {
    const lines = [];
    const changes = summary.adjustments || {};
    if (changes.maxPV) lines.push(`PV máximos ${sign(changes.maxPV)}`);
    if (changes.movementBlocked) lines.push("Deslocamento: 0■");
    else {
      if (changes.movementFlat) lines.push(`Deslocamento ${sign(changes.movementFlat)}■`);
      if (changes.movementHalf) lines.push("Deslocamento pela metade");
    }
    if (changes.blockConstitution) lines.push("Bloqueio sem Constituição");
    if (summary.testPenalty) lines.push(`Testes ${sign(summary.testPenalty)}`);
    if (summary.disadvantage) lines.push(`${summary.disadvantage} dado(s) de Desvantagem`);
    if (summary.paSurcharge) lines.push(`Custo +${summary.paSurcharge} PA`);
    for (const [skill, value] of Object.entries(changes.skillTests || {})) if (value) lines.push(`${skill} ${sign(value)}`);
    for (const modifier of summary.modifiers || []) {
      const label = modifier.label || modifier.description;
      const description = label ? `${label}: ${sign(modifier.value)}` : "";
      if (description && !lines.includes(description)) lines.push(description);
    }
    return [...new Set(lines)];
  }
  function updateCampaign(context = {}) {
    if ((context.campaignId || "") !== campaign.campaignId) { epoch += 1; pendingWound = null; if (inspected && !ui["status-effects-modal"].hidden) close(); }
    const selected = ui["campaign-status-target"].value;
    campaign = { campaignId: context.campaignId || "", isMaster: Boolean(context.isMaster), sheets: context.sheets || [] };
    ui["campaign-status-controls"].hidden = !campaign.isMaster || !campaign.sheets.length;
    const campaignRoster = document.getElementById("campaign-shield").hidden ? document.getElementById("campaign-sheet-list") : document.getElementById("campaign-shield-roster");
    if (campaignRoster && campaignRoster.nextElementSibling !== ui["campaign-status-controls"]) campaignRoster.after(ui["campaign-status-controls"]);
    ui["campaign-status-target"].replaceChildren(...campaign.sheets.map(sheet => {
      const option = make("option", "", sheet.profile?.name || sheet.characterName || sheet.slotName || "Personagem");
      option.value = sheet.id;
      return option;
    }));
    if (findSheet(selected)) ui["campaign-status-target"].value = selected;
    if (inspected && findSheet(inspected.id)) { inspected = findSheet(inspected.id); renderInspector(); }
    updateProfileWarning();
  }
  function createCardControls(sheet, status = {}, isMaster = false) {
    const wrap = make("div", "campaign-status-card-controls");
    const fullSheet = { ...sheet, status, profile: sheet.profile || findSheet(sheet.id)?.profile };
    const summary = summaryFor(fullSheet);
    const effects = effectList(summary, status);
    if (effects.length) {
      const warning = make("button", "status-warning-button", "⚠");
      warning.type = "button";
      warning.append(make("span", "", effects.length));
      warning.setAttribute("aria-label", `Ver ${effects.length} efeitos ativos de ${sheet.characterName || sheet.slotName || "Personagem"}`);
      warning.title = numericChanges(summary).join("\n") || effects.map(effect => effect.name).join("\n");
      warning.addEventListener("click", () => openInspector(findSheet(sheet.id) || fullSheet, warning));
      wrap.append(warning);
    }
    const notes = make("button", "status-notes-button", "notas");
    notes.type = "button";
    notes.title = "Notas do Mestre e descrições dos efeitos";
    notes.addEventListener("click", () => {
      openInspector(findSheet(sheet.id) || fullSheet, notes);
      ui["status-master-notes"].scrollIntoView?.({ block: "nearest" });
    });
    wrap.append(notes);
    return wrap;
  }
  function showModal(sheet, trigger) {
    if (inspected?.id !== sheet?.id) notesDirty = false;
    inspected = sheet;
    returnFocus = trigger || document.activeElement;
    ui["status-effects-modal"].hidden = false;
    document.body.classList.add("status-dialog-open");
    ui["status-effects-title"].textContent = sheet?.profile?.name || sheet?.characterName || sheet?.slotName || "Condições e notas";
    ui["status-effects-subtitle"].textContent = "Ferimentos, efeitos de Medo e notas do Mestre.";
    ui["status-modal-feedback"].textContent = "";
    ui["status-effects-dialog"].focus();
  }
  function openInspector(sheet, trigger) {
    if (!sheet) return;
    showModal(sheet, trigger);
    ui["status-condition-chooser"].hidden = true;
    ui["status-wound-choice"].hidden = true;
    ui["status-inspector"].hidden = false;
    ui["status-last-result"].hidden = true;
    pendingWound = null;
    renderInspector();
  }
  function renderInspector() {
    if (!inspected || ui["status-effects-modal"].hidden) return;
    const status = statusFor(inspected);
    const summary = summaryFor(inspected);
    const active = effectList(summary, status);
    const effects = [...active, ...(summary.suppressedEffects || []).filter(effect => !active.some(item => item.id === effect.id))];
    ui["status-numeric-summary"].replaceChildren(...numericChanges(summary).map(text => make("div", "status-numeric-change", text)));
    const editable = canManage(inspected) && !busy;
    const storedIds = new Set((status.effects || []).map(effect => effect.id));
    ui["status-active-effects"].replaceChildren(...effects.map(effect => {
      const card = make("article", "status-effect-card");
      card.dataset.effectType = effect.type;
      card.append(make("small", "status-effect-kind", effect.type === "wound" ? "Ferimento" : effect.type === "fear" ? "Medo" : "Condição"), make("h3", "", effectTitle(effect)), make("p", "", effect.description));
      if (effect.suppressed) { card.classList.add("is-suppressed"); card.append(make("p", "", effect.reason || "Este efeito está inativo no estado atual.")); }
      if (canManage(inspected) && storedIds.has(effect.id)) {
        const remove = make("button", "status-remove-effect", "×");
        remove.type = "button";
        remove.disabled = !editable;
        remove.setAttribute("aria-label", `Remover ${effect.name}`);
        remove.addEventListener("click", () => perform(async () => {
          const updated = await cloud().removeCampaignEffect(inspected.id, effect.id);
          applyStatusResult(inspected, updated);
          feedback(`${effect.name} removido.`, false, true);
        }, true));
        card.append(remove);
      } else if (!storedIds.has(effect.id)) card.append(make("small", "status-effect-kind", "Acompanhada pelos recursos da ficha"));
      return card;
    }));
    if (!effects.length) ui["status-active-effects"].append(make("p", "status-feedback", status.loading ? "Carregando efeitos…" : "Nenhum efeito ativo."));
    const notes = ui["status-master-notes"];
    if (!notesDirty) notes.value = status.notes || "";
    notes.readOnly = !canManage(inspected);
    ui["status-save-notes"].hidden = !canManage(inspected);
    ui["status-save-notes"].disabled = !editable;
  }
  function applyStatusResult(sheet, result) {
    const status = result?.status || result;
    if (status?.effects) sheet.status = status;
    const entry = findSheet(sheet.id);
    if (entry && status?.effects) entry.status = status;
    renderInspector();
  }
  async function perform(action, modal = false) {
    if (busy) return;
    const token = epoch;
    busy = true;
    for (const id of ["campaign-roll-wound", "campaign-roll-fear", "campaign-add-condition", "status-apply-wound"]) ui[id].disabled = true;
    renderInspector();
    try { await action(token); }
    catch (error) { if (token === epoch) feedback(error?.message || "Não foi possível salvar o efeito.", true, modal); }
    finally {
      busy = false;
      for (const id of ["campaign-roll-wound", "campaign-roll-fear", "campaign-add-condition", "status-apply-wound"]) ui[id].disabled = false;
      renderInspector();
    }
  }
  async function applyEffect(sheet, effect, token, trigger) {
    if (!canManage(sheet)) throw new Error("Somente o Mestre pode aplicar ou remover efeitos nesta Campanha.");
    const result = await cloud().applyCampaignEffect(sheet.id, effect);
    if (token !== epoch) return;
    applyStatusResult(sheet, result);
    close();
    const notices = Array.isArray(result.notices) ? result.notices : (result.status?.effects || result.effects || []).filter(item => item.id === effect.id).map(item => ({
      eventId: `${sheet.ownerUid}/${sheet.slotId}/${item.id}`, effect: item,
      characterName: sheet.profile?.name || sheet.characterName || sheet.slotName || "Personagem", ownerUid: sheet.ownerUid, slotId: sheet.slotId, campaignId: campaign.campaignId,
    }));
    notices.forEach(enqueueEffectNotice);
    feedback(`${effect.name} aplicado a ${sheet.characterName || sheet.slotName || "Personagem"}.`);
  }
  const die = faces => Math.floor(Math.random() * faces) + 1;
  ui["campaign-roll-wound"].addEventListener("click", () => {
    const sheet = selectedSheet();
    if (!sheet || !canManage(sheet) || busy) return;
    const rolled = die(10);
    const effect = model.createWound(rolled);
    if (rolled === 10) {
      pendingWound = { sheet, effect };
      showModal(sheet, ui["campaign-roll-wound"]);
      ui["status-inspector"].hidden = true;
      ui["status-condition-chooser"].hidden = true;
      ui["status-wound-choice"].hidden = false;
      ui["status-last-result"].hidden = false;
      ui["status-last-result"].textContent = `1d10: ${rolled} — ${effect.name}\n${effect.description}`;
      return;
    }
    perform(async token => {
      await applyEffect(sheet, effect, token, ui["campaign-roll-wound"]);
    });
  });
  ui["status-apply-wound"].addEventListener("click", () => {
    if (!pendingWound) return;
    const pending = pendingWound;
    pending.effect.chosenSkill = ui["status-wound-skill"].value;
    perform(token => applyEffect(pending.sheet, pending.effect, token, ui["campaign-roll-wound"]), true);
  });
  ui["campaign-roll-fear"].addEventListener("click", () => {
    const sheet = selectedSheet();
    if (!sheet || !canManage(sheet)) return;
    const percentile = die(100), detail = die(4);
    const effect = model.createFear(percentile, detail);
    perform(async token => {
      await applyEffect(sheet, effect, token, ui["campaign-roll-fear"]);
    });
  });
  function renderConditions() {
    const search = ui["status-condition-search"].value.trim().toLocaleLowerCase("pt-BR");
    const catalog = model.getCatalog();
    const nodes = [];
    for (const group of catalog.conditionGroups || []) {
      const conditions = (group.conditions || []).filter(condition => `${condition.name} ${condition.description}`.toLocaleLowerCase("pt-BR").includes(search));
      if (!conditions.length) continue;
      nodes.push(make("h3", "status-condition-group", group.name));
      for (const condition of conditions) {
        const button = make("button", "status-condition-choice");
        button.type = "button";
        const alreadyActive = (statusFor(inspected).effects || []).some(effect => effect.type === "condition" && effect.key === condition.key);
        button.disabled = busy || alreadyActive;
        button.append(make("strong", "", condition.name), make("small", "", condition.description));
        if (alreadyActive) button.append(make("span", "status-condition-active", "Já aplicada"));
        button.addEventListener("click", () => {
          if (button.disabled || !canManage(inspected)) return;
          const sheet = inspected;
          perform(token => applyEffect(sheet, model.createCondition(condition.key), token, ui["campaign-add-condition"]), true);
        });
        nodes.push(button);
      }
    }
    if (!nodes.length) nodes.push(make("p", "status-feedback", "Nenhuma condição encontrada."));
    ui["status-condition-list"].replaceChildren(...nodes);
  }
  ui["campaign-add-condition"].addEventListener("click", () => {
    const sheet = selectedSheet();
    if (!sheet) { feedback("Escolha o personagem que receberá a condição.", true); return; }
    if (!canManage(sheet) || busy) return;
    showModal(sheet, ui["campaign-add-condition"]);
    ui["status-effects-subtitle"].textContent = "Escolha uma condição para aplicar a este personagem.";
    ui["status-inspector"].hidden = true;
    ui["status-wound-choice"].hidden = true;
    ui["status-last-result"].hidden = true;
    ui["status-condition-chooser"].hidden = false;
    ui["status-condition-search"].value = "";
    renderConditions();
    ui["status-condition-search"].focus();
  });
  ui["status-condition-search"].addEventListener("input", renderConditions);
  ui["status-master-notes"].addEventListener("input", () => { notesDirty = true; });
  ui["status-save-notes"].addEventListener("click", () => {
    if (!inspected || !canManage(inspected)) return;
    const sheet = inspected, notes = ui["status-master-notes"].value;
    perform(async () => {
      const result = await cloud().saveCampaignEffectNotes(sheet.id, notes);
      notesDirty = false;
      applyStatusResult(sheet, result);
      feedback("Notas salvas. Todos os participantes podem lê-las.", false, true);
    }, true);
  });
  function showNextNotice() {
    if (activeNotice || !noticeQueue.length) return;
    activeNotice = noticeQueue.shift();
    noticeReturnFocus = document.activeElement;
    const effect = activeNotice.effect;
    ui["status-notice-kind"].textContent = effect.type === "wound" ? "Ferimento recebido" : effect.type === "fear" ? "Efeito de Medo recebido" : "Condição recebida";
    ui["status-notice-character"].textContent = activeNotice.characterName || "Personagem";
    ui["status-notice-title"].textContent = effectTitle(effect);
    ui["status-notice-description"].textContent = effect.description;
    const rolls = effect.rolls || {};
    const dice = effect.type === "wound" ? (rolls.d10 ? `1d10: ${rolls.d10}` : "") : effect.type === "fear" ? `1d100: ${rolls.d100} · 1d4: ${rolls.d4}` : "";
    ui["status-notice-rolls"].textContent = dice;
    ui["status-notice-rolls"].hidden = !dice;
    ui["status-notice-dialog"].dataset.effectType = effect.type;
    ui["status-notice-modal"].hidden = false;
    document.body.classList.add("status-dialog-open");
    ui["status-notice-dialog"].focus();
  }
  function enqueueEffectNotice(details = {}) {
    const effect = model.normalizeEffects([details.effect])[0];
    if (!effect) return;
    const eventId = details.eventId || `${details.ownerUid || ""}/${details.slotId || ""}/${effect.id}`;
    if (seenNotices.has(eventId)) return;
    seenNotices.add(eventId);
    noticeQueue.push({ ...details, eventId, effect });
    showNextNotice();
  }
  function closeNotice() {
    ui["status-notice-modal"].hidden = true;
    activeNotice = null;
    if (noticeQueue.length) { showNextNotice(); return; }
    if (ui["status-effects-modal"].hidden) document.body.classList.remove("status-dialog-open");
    noticeReturnFocus?.focus?.();
  }
  function clearEffectNotices() {
    noticeQueue.length = 0;
    seenNotices.clear();
    noticeReturnFocus = null;
    closeNotice();
  }
  document.querySelectorAll("[data-close-status-notice]").forEach(button => button.addEventListener("click", closeNotice));
  function close() {
    ui["status-effects-modal"].hidden = true;
    if (ui["status-notice-modal"].hidden) document.body.classList.remove("status-dialog-open");
    pendingWound = null;
    if (ui["status-notice-modal"].hidden) returnFocus?.focus?.();
  }
  document.querySelectorAll("[data-close-status-effects]").forEach(button => button.addEventListener("click", close));
  document.addEventListener("keydown", event => {
    const noticeOpen = !ui["status-notice-modal"].hidden;
    if (!noticeOpen && ui["status-effects-modal"].hidden) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); noticeOpen ? closeNotice() : close(); return; }
    if (event.key !== "Tab") return;
    const dialog = ui[noticeOpen ? "status-notice-dialog" : "status-effects-dialog"];
    const controls = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(node => !node.closest("[hidden]"));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }, true);
  function currentSheet() {
    const identity = cloud()?.getRollContext?.() || {};
    const existing = campaign.sheets.find(sheet => sheet.ownerUid === identity.sheetOwnerUid && sheet.slotId === identity.slotId);
    return existing || { id: `${identity.sheetOwnerUid || "local"}_${identity.slotId || "slot"}`, current: true, slotName: window.AbyssSheet?.captureState?.().profile?.name || "Personagem", status: currentStatus };
  }
  function updateProfileWarning() {
    const summary = window.AbyssSheet?.getStatusSummary?.(getRollContext()) || summaryFor(currentSheet());
    const effects = effectList(summary, currentStatus);
    ui["sheet-status-warning"].hidden = !effects.length;
    ui["sheet-status-count"].textContent = String(effects.length);
    ui["sheet-status-warning"].title = numericChanges(summary).join("\n") || effects.map(effect => effect.name).join("\n");
  }
  function updateSlotEffects(status = {}) {
    currentStatus = status.status || status;
    if (status.ownerUid && status.slotId) {
      const identity = `${status.ownerUid}_${status.slotId}`;
      currentSlotIdentity = identity;
    }
    if (inspected?.current && status.ownerUid && status.slotId && inspected.id !== `${status.ownerUid}_${status.slotId}`) close();
    if (inspected?.current) inspected.status = currentStatus;
    updateProfileWarning();
    if (inspected?.current) renderInspector();
  }
  ui["sheet-status-warning"].addEventListener("click", () => openInspector(currentSheet(), ui["sheet-status-warning"]));
  const defenseInfo = make("output", "status-defense-adjustments"); defenseInfo.id = "status-defense-adjustments";
  document.querySelector(".combat-stat.is-defense")?.append(defenseInfo);
  window.addEventListener("abyss:sheet-changed", updateProfileWarning);
  window.addEventListener("abyss:status-sheet-rendered", updateProfileWarning);
  window.AbyssConditionsUi = Object.freeze({ createCardControls, updateCampaign, updateSlotEffects, getRollContext, openInspector, updateProfileWarning, enqueueEffectNotice, clearEffectNotices });
  updateProfileWarning();
  window.AbyssSheet?.refreshStatusEffects?.();
})();
