"use strict";
function createAbilityId(prefix = "ability") {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseDamageFormula(rawValue) {
  const compact = String(rawValue || "")
    .toUpperCase()
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
  if (!compact) return { formula: "", tokens: [], error: "" };

  const tokenPattern = /([+-]?)(?:(\d*)D(\d+)|(\d+)|(FOR|AGI|INT|CON|POD))/g;
  const tokens = [];
  let cursor = 0;
  let totalDice = 0;
  let match;

  while ((match = tokenPattern.exec(compact))) {
    if (match.index !== cursor) {
      return { error: "Use uma fórmula como 1d10+1 ou 1d10+FOR." };
    }
    if (tokens.length && !match[1]) {
      return { error: "Separe cada termo com + ou −." };
    }

    const sign = match[1] === "-" ? -1 : 1;
    if (match[3]) {
      const count = Number(match[2] || 1);
      const faces = Number(match[3]);
      const invalidDice =
        !Number.isInteger(count) ||
        count < 1 ||
        count > 50 ||
        !Number.isInteger(faces) ||
        faces < 2 ||
        faces > 1000;

      if (invalidDice) {
        return { error: "Cada grupo deve ter de 1 a 50 dados e dados com 2 a 1000 faces." };
      }

      totalDice += count;
      tokens.push({ type: "dice", sign, count, faces });
    } else if (match[4]) {
      tokens.push({ type: "fixed", sign, value: Number(match[4]) });
    } else {
      tokens.push({ type: "attribute", sign, attribute: match[5] });
    }

    cursor = tokenPattern.lastIndex;
  }

  if (cursor !== compact.length || !tokens.length) {
    return { error: "Use uma fórmula como 1d10+1 ou 1d10+FOR." };
  }
  if (totalDice > 100 || tokens.length > 30) {
    return { error: "A fórmula é grande demais. Use no máximo 100 dados e 30 termos." };
  }

  const formula = tokens
    .map((token, index) => {
      const sign = token.sign < 0 ? "−" : index === 0 ? "" : "+";
      if (token.type === "dice") return `${sign}${token.count}d${token.faces}`;
      if (token.type === "fixed") return `${sign}${token.value}`;
      return `${sign}${token.attribute}`;
    })
    .join("");

  return { formula, tokens, error: "" };
}

function evaluateDamageFormula(parsedFormula) {
  let total = 0;
  const pieces = [];

  parsedFormula.tokens.forEach((token, index) => {
    const prefix = token.sign < 0 ? "− " : index === 0 ? "" : "+ ";

    if (token.type === "dice") {
      const results = rollDice(token.count, token.faces);
      total += sum(results) * token.sign;
      pieces.push(`${prefix}${token.count}d${token.faces} [${results.join(", ")}]`);
      return;
    }

    if (token.type === "attribute") {
      const value = getAttributeValue(token.attribute);
      total += value * token.sign;
      pieces.push(`${prefix}${token.attribute} [${value}]`);
      return;
    }

    total += token.value * token.sign;
    pieces.push(`${prefix}${token.value}`);
  });

  return { total, breakdown: pieces.join(" ") };
}

function evaluateDamageFormulaDetailed(parsedFormula) {
  let total = 0;
  const pieces = [];
  const evaluatedTokens = [];

  parsedFormula.tokens.forEach((token, index) => {
    const prefix = token.sign < 0 ? "− " : index === 0 ? "" : "+ ";
    if (token.type === "dice") {
      const results = rollDice(token.count, token.faces);
      const value = sum(results) * token.sign;
      total += value;
      pieces.push(`${prefix}${token.count}d${token.faces} [${results.join(", ")}]`);
      evaluatedTokens.push({ ...token, results, value });
      return;
    }
    if (token.type === "attribute") {
      const attributeValue = getAttributeValue(token.attribute);
      const value = attributeValue * token.sign;
      total += value;
      pieces.push(`${prefix}${token.attribute} [${attributeValue}]`);
      evaluatedTokens.push({ ...token, value });
      return;
    }
    const value = token.value * token.sign;
    total += value;
    pieces.push(`${prefix}${token.value}`);
    evaluatedTokens.push({ ...token, value });
  });

  return { total, breakdown: pieces.join(" "), evaluatedTokens };
}

function sanitizeCreationRoll(rawRoll) {
  if (!rawRoll || typeof rawRoll !== "object") return null;
  const name = String(rawRoll.name || "").trim().slice(0, 80);
  const parsed = parseDamageFormula(rawRoll.formula);
  if (!name || parsed.error || !parsed.tokens.length) return null;
  return {
    id: String(rawRoll.id || createAbilityId("roll")).slice(0, 120),
    name,
    formula: parsed.formula,
  };
}

function sanitizeCreationCost(rawCost) {
  if (!rawCost || typeof rawCost !== "object") return null;
  const resource = Object.hasOwn(CREATION_RESOURCES, rawCost.resource) ? rawCost.resource : "pa";
  const pool = rawCost.pool === "max" ? "max" : "current";
  const value = clampInteger(rawCost.value, 1, 999999, 1);
  return {
    id: String(rawCost.id || createAbilityId("cost")).slice(0, 120),
    resource,
    pool,
    value,
  };
}

function sanitizeModifierTarget(type, rawTarget) {
  const target = String(rawTarget || "").slice(0, 160);
  if (type === "attribute") return ATTRIBUTES[target] ? target : "FOR";
  if (["pv", "pa", "sa"].includes(type)) return target === "max" ? "max" : "current";
  if (type === "skill") {
    if (target === "all") return "all";
    return target || "all";
  }
  return "general";
}

function sanitizeCreationModifier(rawModifier) {
  if (!rawModifier || typeof rawModifier !== "object") return null;
  const type = Object.hasOwn(CREATION_MODIFIER_TYPES, rawModifier.type)
    ? rawModifier.type
    : "damage";
  const parsed = parseDamageFormula(rawModifier.formula);
  if (parsed.error || !parsed.tokens.length || parsed.tokens.some((token) => token.type === "attribute")) {
    return null;
  }
  return {
    id: String(rawModifier.id || createAbilityId("modifier")).slice(0, 120),
    type,
    target: sanitizeModifierTarget(type, rawModifier.target),
    formula: parsed.formula,
    resolvedValue: clampInteger(rawModifier.resolvedValue, -999999, 999999, 0),
  };
}

function sanitizeDamageProfile(rawProfile, legacyDamage = "") {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const primary = parseDamageFormula(profile.primary || legacyDamage);
  const additional = parseDamageFormula(profile.additional);
  const criticalBonus = parseDamageFormula(profile.criticalBonus);
  const originalThreshold = clampInteger(profile.criticalThreshold, 0, 1000, 0);
  const marginReduction = originalThreshold
    ? clampInteger(profile.criticalMarginReduction, 0, Math.max(0, originalThreshold - 1), 0)
    : 0;
  return {
    primary: primary.error ? "" : primary.formula,
    additional: additional.error ? "" : additional.formula,
    criticalThreshold: originalThreshold,
    criticalBonus: criticalBonus.error ? "" : criticalBonus.formula,
    criticalMarginReduction: marginReduction,
  };
}

function sanitizeCreationMechanics(rawCreation) {
  const source = rawCreation && typeof rawCreation === "object" ? rawCreation : {};
  return {
    rolls: (Array.isArray(source.rolls) ? source.rolls : [])
      .map(sanitizeCreationRoll)
      .filter(Boolean),
    costs: (Array.isArray(source.costs) ? source.costs : [])
      .map(sanitizeCreationCost)
      .filter(Boolean),
    grantsModifiers: Boolean(source.grantsModifiers),
    modifiersActive: Boolean(source.modifiersActive),
    modifiers: (Array.isArray(source.modifiers) ? source.modifiers : [])
      .map(sanitizeCreationModifier)
      .filter(Boolean),
  };
}

function sanitizeItemType(rawType, legacyIsWeapon = false) {
  const value = String(rawType || "");
  return Object.hasOwn(ITEM_TYPES, value) ? value : legacyIsWeapon ? "weapon" : "utility";
}

function sanitizeUpgradeType(rawType) {
  const value = String(rawType || "");
  return UPGRADE_ITEM_TYPES.includes(value) ? value : "";
}

function isUpgradeCompatible(item, upgrade) {
  if (!item || !upgrade || (upgrade.section && upgrade.section !== "upgrades")) return false;
  const itemType = sanitizeItemType(item.itemType, item.isWeapon);
  return Boolean(sanitizeUpgradeType(upgrade.upgradeType)) && upgrade.upgradeType === itemType;
}

function sanitizeInventoryUpgrades(rawUpgrades, itemType) {
  if (!UPGRADE_ITEM_TYPES.includes(itemType)) return [];
  const ids = new Set();
  const sources = new Set();
  return (Array.isArray(rawUpgrades) ? rawUpgrades : []).slice(0, 50).flatMap((raw) => {
    if (!raw || typeof raw !== "object" || sanitizeUpgradeType(raw.upgradeType) !== itemType) return [];
    const name = String(raw.name || "").trim().slice(0, 80);
    const id = String(raw.id || "").slice(0, 120);
    const sourceId = String(raw.sourceId || raw.id || "").slice(0, 120);
    if (!name || !id || !sourceId || ids.has(id) || sources.has(sourceId)) return [];
    ids.add(id);
    sources.add(sourceId);
    const mechanics = sanitizeCreationMechanics(raw);
    return [{
      id,
      sourceId,
      name,
      ...sanitizeCreationDescription(raw),
      upgradeType: itemType,
      rolls: mechanics.rolls.slice(0, 30),
      costs: mechanics.costs.slice(0, 30),
      grantsModifiers: mechanics.grantsModifiers && mechanics.modifiers.length > 0,
      modifiers: mechanics.grantsModifiers ? mechanics.modifiers.slice(0, 30) : [],
    }];
  });
}

function getEffectiveInventoryItem(item) {
  if (!item) return null;
  const upgrades = (Array.isArray(item.upgrades) ? item.upgrades : []).filter((upgrade) => isUpgradeCompatible(item, upgrade));
  if (!upgrades.length) return item;
  const effective = {
    ...item,
    upgrades,
    rolls: [...(item.rolls || []), ...upgrades.flatMap((upgrade) => upgrade.rolls || [])],
    costs: [...(item.costs || []), ...upgrades.flatMap((upgrade) => upgrade.costs || [])],
    grantsModifiers: Boolean(item.grantsModifiers) || upgrades.some((upgrade) => upgrade.grantsModifiers),
    modifiers: [
      ...(item.grantsModifiers ? item.modifiers || [] : []),
      ...upgrades.flatMap((upgrade) => upgrade.grantsModifiers ? upgrade.modifiers || [] : []),
    ],
  };
  Object.defineProperty(effective, "modifiersActive", {
    enumerable: true,
    get: () => Boolean(item.modifiersActive),
    set: (active) => { item.modifiersActive = Boolean(active); },
  });
  return effective;
}

function makeInventoryUpgradeSnapshot(source) {
  if (!source || source.section !== "upgrades" || !sanitizeUpgradeType(source.upgradeType)) return null;
  const name = String(source.name || "").trim().slice(0, 80);
  const sourceId = String(source.id || "").slice(0, 120);
  if (!name || !sourceId) return null;
  const id = createAbilityId("upgrade").slice(0, 120);
  const mechanics = sanitizeCreationMechanics(source);
  const withIds = (entries, kind) => entries.slice(0, 30).map((entry, index) => ({
    ...entry,
    id: `${id}-${kind}-${index}`.slice(0, 120),
  }));
  return {
    id,
    sourceId,
    name,
    ...sanitizeCreationDescription(source),
    upgradeType: source.upgradeType,
    rolls: withIds(mechanics.rolls, "roll"),
    costs: withIds(mechanics.costs, "cost"),
    grantsModifiers: mechanics.grantsModifiers && mechanics.modifiers.length > 0,
    modifiers: mechanics.grantsModifiers ? withIds(mechanics.modifiers, "modifier").map((modifier) => ({
      ...modifier,
      resolvedValue: 0,
    })) : [],
  };
}

function applyInventoryUpgrade(item, source) {
  if (isNotebookReadOnly() || !isUpgradeCompatible(item, source) || source.section !== "upgrades") return false;
  const upgrades = Array.isArray(item.upgrades) ? item.upgrades : [];
  if (upgrades.length >= 50 || upgrades.some((upgrade) => upgrade.sourceId === String(source.id || "").slice(0, 120))) return false;
  const snapshot = makeInventoryUpgradeSnapshot(source);
  if (!snapshot) return false;
  if (item.modifiersActive && snapshot.grantsModifiers) {
    snapshot.modifiers.forEach((modifier) => {
      if (modifierRollsPerUse(modifier)) return;
      const parsed = parseDamageFormula(modifier.formula);
      modifier.resolvedValue = parsed.error ? 0 : evaluateDamageFormula(parsed).total;
      adjustDirectModifierTarget(modifier, 1);
    });
  }
  item.upgrades = [...upgrades, snapshot];
  return true;
}

function removeInventoryUpgrade(item, upgradeId) {
  if (isNotebookReadOnly() || !item || !Array.isArray(item.upgrades)) return false;
  const snapshot = item.upgrades.find((upgrade) => upgrade.id === upgradeId);
  if (!snapshot) return false;
  if (item.modifiersActive && snapshot.grantsModifiers) {
    snapshot.modifiers.forEach((modifier) => {
      if (!modifierRollsPerUse(modifier)) adjustDirectModifierTarget(modifier, -1);
      modifier.resolvedValue = 0;
    });
  }
  item.upgrades = item.upgrades.filter((upgrade) => upgrade.id !== upgradeId);
  const effective = getEffectiveInventoryItem(item);
  if (!effective.grantsModifiers || !effective.modifiers.length) item.modifiersActive = false;
  return true;
}

function sanitizeInventoryItem(rawItem) {
  if (!rawItem || typeof rawItem !== "object") return null;
  const name = String(rawItem.name || "").trim().slice(0, 80);
  if (!name) return null;
  const mechanics = sanitizeCreationMechanics(rawItem);
  const isWeapon = Boolean(rawItem.isWeapon);
  const itemType = sanitizeItemType(rawItem.itemType, isWeapon);
  const damageProfile = sanitizeDamageProfile(rawItem.damageProfile, rawItem.damage);
  const upgrades = sanitizeInventoryUpgrades(rawItem.upgrades, itemType);
  return {
    id: String(rawItem.id || createAbilityId("item")).slice(0, 120),
    kind: "item",
    name,
    ...sanitizeCreationDescription(rawItem),
    quantity: clampInteger(rawItem.quantity, 1, 9999, 1),
    itemType,
    isWeapon,
    equipped: isWeapon && Boolean(rawItem.equipped),
    damageProfile: isWeapon ? damageProfile : sanitizeDamageProfile({}),
    ...mechanics,
    upgrades,
    sourceId: String(rawItem.sourceId || "").slice(0, 120),
    shopListed: Boolean(rawItem.shopListed),
    shopPrice: clampInteger(rawItem.shopPrice, 0, 999999999, 0),
    shopDestination: sanitizeShopDestination(rawItem.shopDestination),
    shopEchoKey: Object.hasOwn(ECHOES, rawItem.shopEchoKey) ? rawItem.shopEchoKey : "",
  };
}


function itemTypeLabel(item) {
  return ITEM_TYPES[sanitizeItemType(item?.itemType, item?.isWeapon)];
}

function upgradeTypeLabel(type) {
  return `Melhoria de ${ITEM_TYPES[sanitizeUpgradeType(type)] || "Item"}`;
}

function updateAbilityUpgradeFields() {
  const isUpgrade = abilitySectionSelect.value === "upgrades";
  abilityUpgradeTypeField.hidden = !isUpgrade;
  abilityUpgradeTypeSelect.required = isUpgrade;
  abilityHasDamageInput.closest(".mechanics-block").hidden = isUpgrade;
  if (isUpgrade) abilityHasDamageInput.checked = false;
  abilityDamageFields.hidden = isUpgrade || !abilityHasDamageInput.checked;
  abilityNameInput.placeholder = isUpgrade ? "Ex.: Fio Afiado" : "Ex.: Golpe Abissal";
  document.querySelector("#ability-editor-help").textContent = isUpgrade
    ? "Escolha o tipo de item compatível e configure o que esta melhoria acrescenta."
    : "Preencha as informações e adicione regras de uso, se precisar.";
  updateAbilityShopFields();
  abilityEditorTitle.textContent = abilityEditorScope === "minerva" ? (activeAbilityId ? "Editar no Grimório" : "Criar no Grimório") : (activeAbilityId ? `Editar ${isUpgrade ? "Melhoria" : "Habilidade"}` : `Criar ${isUpgrade ? "Melhoria" : "Habilidade"}`);
  saveAbilityButton.textContent = activeAbilityId ? "Salvar Alterações" : isUpgrade ? "Publicar Melhoria" : "Criar Habilidade";
}

function createItemTypeBadge(item) {
  const badge = document.createElement("span");
  badge.className = "item-type-badge";
  badge.dataset.itemType = sanitizeItemType(item.itemType, item.isWeapon);
  badge.textContent = itemTypeLabel(item);
  return badge;
}

function appendItemUpgradeTags(container, item, removable = true) {
  if (!item.upgrades?.length) return;
  const tags = document.createElement("div");
  tags.className = "item-upgrade-tags";
  tags.setAttribute("aria-label", "Melhorias aplicadas");
  item.upgrades.forEach((upgrade) => {
    const tag = document.createElement("span");
    tag.className = "item-upgrade-tag";
    tag.title = upgrade.description || upgradeTypeLabel(upgrade.upgradeType);
    const name = document.createElement("span");
    name.textContent = upgrade.name;
    tag.append(name);
    if (removable && !isNotebookReadOnly()) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.removeItemUpgrade = upgrade.id;
      remove.dataset.upgradeItemId = item.id;
      remove.setAttribute("aria-label", `Remover melhoria: ${upgrade.name}`);
      remove.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
      tag.append(remove);
    }
    tags.append(tag);
  });
  container.append(tags);
}

function getCompatibleItemUpgrades(item) {
  return grimoireAbilities.filter((upgrade) => upgrade.section === "upgrades" && isUpgradeCompatible(item, upgrade));
}

function renderItemUpgradePicker() {
  const item = inventoryItems.find((entry) => entry.id === activeItemUpgradeId);
  if (!item || activeItemUpgradeEpoch !== notesEpoch) { closeItemUpgradePicker(); return; }
  const query = normalizeSearchTerm(itemUpgradeSearch.value);
  const visible = getCompatibleItemUpgrades(item)
    .filter((upgrade) => !query || normalizeSearchTerm(`${upgrade.name} ${upgrade.description}`).includes(query))
    .sort((a, b) => portugueseCollator.compare(a.name, b.name));
  document.querySelector("#item-upgrade-target").textContent = `${item.name} · ${itemTypeLabel(item)}`;
  document.querySelector("#item-upgrade-count").textContent = `${visible.length} ${visible.length === 1 ? "melhoria" : "melhorias"}`;
  itemUpgradeList.replaceChildren();
  visible.forEach((upgrade) => {
    const applied = item.upgrades?.some((entry) => entry.sourceId === upgrade.id);
    const card = document.createElement("article");
    card.className = `upgrade-picker-item${applied ? " is-applied" : ""}`;
    const copy = document.createElement("div");
    copy.className = "upgrade-picker-item-copy";
    const name = document.createElement("strong");
    name.textContent = upgrade.name;
    const description = document.createElement("div");
    setCreationDescription(description, upgrade);
    description.classList.add("upgrade-picker-description");
    const type = document.createElement("span");
    type.className = "upgrade-compatibility-tag";
    type.textContent = upgradeTypeLabel(upgrade.upgradeType);
    const tags = document.createElement("div");
    tags.className = "upgrade-picker-item-tags";
    tags.append(type);
    const effects = [];
    if (upgrade.rolls?.length) effects.push(`${upgrade.rolls.length} ${upgrade.rolls.length === 1 ? "rolagem" : "rolagens"}`);
    if (upgrade.grantsModifiers && upgrade.modifiers?.length) effects.push(`${upgrade.modifiers.length} ${upgrade.modifiers.length === 1 ? "modificador" : "modificadores"}`);
    if (upgrade.costs?.length) effects.push(`${upgrade.costs.length} ${upgrade.costs.length === 1 ? "gasto" : "gastos"}`);
    if (effects.length) {
      const summary = document.createElement("p");
      summary.textContent = effects.join(" · ");
      copy.append(name, description, tags, summary);
    } else copy.append(name, description, tags);
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "upgrade-picker-apply";
    apply.dataset.applyItemUpgrade = upgrade.id;
    apply.disabled = Boolean(applied || isNotebookReadOnly() || item.upgrades?.length >= 50);
    apply.textContent = applied ? "Aplicada" : "Adicionar";
    apply.setAttribute("aria-label", `${applied ? "Melhoria aplicada" : "Adicionar melhoria"}: ${upgrade.name}`);
    card.append(copy, apply);
    itemUpgradeList.append(card);
  });
  itemUpgradeEmpty.hidden = visible.length > 0;
  itemUpgradeEmpty.textContent = query ? "Nenhuma melhoria compatível encontrada nesta busca." : `Ainda não há ${upgradeTypeLabel(item.itemType).toLocaleLowerCase("pt-BR")} publicada no grimório.`;
}

async function openItemUpgradePicker(itemId, trigger) {
  if (isNotebookReadOnly() || !window.AbyssCloud?.hasActiveSlot()) return;
  const item = inventoryItems.find((entry) => entry.id === itemId);
  if (!item || !UPGRADE_ITEM_TYPES.includes(sanitizeItemType(item.itemType, item.isWeapon))) return;
  activeItemUpgradeId = item.id;
  activeItemUpgradeTrigger = trigger;
  activeItemUpgradeEpoch = notesEpoch;
  const epoch = notesEpoch;
  const request = ++itemUpgradeRequestToken;
  itemUpgradeSearch.value = "";
  itemUpgradeModal.hidden = false;
  itemUpgradeList.replaceChildren();
  itemUpgradeList.setAttribute("aria-busy", "true");
  itemUpgradeEmpty.hidden = false;
  itemUpgradeEmpty.textContent = "Carregando melhorias…";
  document.querySelector("#item-upgrade-target").textContent = `${item.name} · ${itemTypeLabel(item)}`;
  document.querySelector("#item-upgrade-count").textContent = "";
  document.querySelector("#item-upgrade-feedback").textContent = "";
  syncModalLock();
  itemUpgradeDialog.focus();
  try {
    await refreshGrimoireFromCloud();
    if (request !== itemUpgradeRequestToken || epoch !== notesEpoch || itemUpgradeModal.hidden) return;
    renderItemUpgradePicker();
  } catch (error) {
    if (request !== itemUpgradeRequestToken || epoch !== notesEpoch || itemUpgradeModal.hidden) return;
    itemUpgradeEmpty.textContent = "Não foi possível carregar as melhorias. Feche e tente novamente.";
  } finally {
    if (request === itemUpgradeRequestToken) itemUpgradeList.removeAttribute("aria-busy");
  }
}

function closeItemUpgradePicker() {
  itemUpgradeRequestToken += 1;
  itemUpgradeModal.hidden = true;
  activeItemUpgradeId = "";
  syncModalLock();
  if (activeItemUpgradeTrigger?.isConnected) activeItemUpgradeTrigger.focus();
  activeItemUpgradeTrigger = null;
}

function notifyItemUpgradeChanged(item, reason) {
  renderResourceState();
  applyClassCalculations();
  updateDifficultyTargets();
  renderInventory();
  renderAbilities();
  if (!abilityDetailModal.hidden && activeAbilityDetailScope === "inventory" && activeAbilityDetailId === item.id) {
    openAbilityDetail(item.id, activeAbilityDetailTrigger, "inventory");
  }
  notifySheetChanged(reason);
}

async function confirmRemoveItemUpgrade(itemId, upgradeId, trigger) {
  if (isNotebookReadOnly()) return;
  const item = inventoryItems.find((entry) => entry.id === itemId);
  const upgrade = item?.upgrades?.find((entry) => entry.id === upgradeId);
  if (!upgrade) return;
  const epoch = notesEpoch;
  const confirmed = await showAbyssConfirm({
    eyebrow: itemTypeLabel(item), title: "Remover esta melhoria?",
    message: `“${upgrade.name}” será removida de “${item.name}”, junto com seus efeitos.`,
    confirmLabel: "Remover melhoria", tone: "warning", trigger,
  });
  if (!confirmed || epoch !== notesEpoch || inventoryItems.find((entry) => entry.id === itemId) !== item) return;
  if (!removeInventoryUpgrade(item, upgradeId)) return;
  notifyItemUpgradeChanged(item, "item-upgrade-removed");
}


function modifierTargetOptions(type, selected = "") {
  if (type === "attribute") {
    return Object.entries(ATTRIBUTES).map(([value, label]) => ({ value, label: `${value} · ${label}` }));
  }
  if (["pv", "pa", "sa"].includes(type)) {
    return [
      { value: "current", label: "Valor Atual" },
      { value: "max", label: "Valor Máximo" },
    ];
  }
  if (type === "skill") {
    return [
      { value: "all", label: "Todas as Perícias" },
      ...SKILLS.map((skill) => ({ value: getSkillKey(skill), label: skill.name })),
    ];
  }
  return [{ value: "general", label: "Geral" }];
}

function updateModifierTargetRow(row, preferredValue = "") {
  const type = row.querySelector('[data-mechanic-field="modifier-type"]')?.value || "damage";
  const target = row.querySelector('[data-mechanic-field="modifier-target"]');
  if (!target) return;
  const options = modifierTargetOptions(type, preferredValue);
  target.replaceChildren(...options.map((option) => {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    return element;
  }));
  const desired = sanitizeModifierTarget(type, preferredValue);
  target.value = options.some((option) => option.value === desired) ? desired : options[0].value;
  target.closest("label").hidden = options.length === 1;
}

function createMechanicEditorRow(kind, data = {}) {
  const row = document.createElement("div");
  row.className = `mechanics-repeat-row is-${kind}`;
  row.dataset.mechanicKind = kind;
  row.dataset.mechanicId = String(data.id || createAbilityId(kind));

  if (kind === "roll") {
    row.innerHTML = `
      <label class="builder-field"><span>Nome da rolagem</span><input data-mechanic-field="roll-name" type="text" maxlength="80" autocomplete="off" placeholder="Ex.: Ataque" /></label>
      <label class="builder-field"><span>Fórmula</span><input data-mechanic-field="roll-formula" type="text" maxlength="100" autocomplete="off" placeholder="Ex.: 1d20+FOR" /></label>
      <button class="mechanics-remove" type="button" data-remove-mechanic aria-label="Remover rolagem">×</button>`;
    row.querySelector('[data-mechanic-field="roll-name"]').value = data.name || "";
    row.querySelector('[data-mechanic-field="roll-formula"]').value = data.formula || "";
    return row;
  }

  if (kind === "cost") {
    row.innerHTML = `
      <label class="builder-field"><span>Recurso</span><select data-mechanic-field="cost-resource"><option value="pv">PV</option><option value="pa">PA</option><option value="sa">SA</option></select></label>
      <label class="builder-field"><span>Tipo</span><select data-mechanic-field="cost-pool"><option value="current">Atual</option><option value="max">Máximo</option></select></label>
      <label class="builder-field"><span>Valor</span><input data-mechanic-field="cost-value" type="number" min="1" max="999999" step="1" inputmode="numeric" value="1" /></label>
      <button class="mechanics-remove" type="button" data-remove-mechanic aria-label="Remover gasto">×</button>`;
    row.querySelector('[data-mechanic-field="cost-resource"]').value = data.resource || "pa";
    row.querySelector('[data-mechanic-field="cost-pool"]').value = data.pool === "max" ? "max" : "current";
    row.querySelector('[data-mechanic-field="cost-value"]').value = String(data.value || 1);
    return row;
  }

  const typeOptions = Object.entries(CREATION_MODIFIER_TYPES)
    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
    .join("");
  row.innerHTML = `
    <label class="builder-field"><span>Modificador</span><select data-mechanic-field="modifier-type">${typeOptions}</select></label>
    <label class="builder-field"><span>Aplicar em</span><select data-mechanic-field="modifier-target"></select></label>
    <label class="builder-field"><span>Valor</span><input data-mechanic-field="modifier-formula" type="text" maxlength="80" autocomplete="off" placeholder="Ex.: +2 ou 1d4" /></label>
    <button class="mechanics-remove" type="button" data-remove-mechanic aria-label="Remover modificador">×</button>`;
  row.querySelector('[data-mechanic-field="modifier-type"]').value = Object.hasOwn(CREATION_MODIFIER_TYPES, data.type) ? data.type : "damage";
  row.querySelector('[data-mechanic-field="modifier-formula"]').value = data.formula || "";
  updateModifierTargetRow(row, data.target || "");
  return row;
}

function refreshMechanicsEditor(prefix) {
  const editor = MECHANIC_EDITORS[prefix];
  if (!editor) return;
  editor.rollsEmpty.hidden = Boolean(editor.rolls.children.length);
  editor.costsEmpty.hidden = Boolean(editor.costs.children.length);
  editor.modifiersEmpty.hidden = Boolean(editor.modifiers.children.length);
}

function fillMechanicsEditor(prefix, creation = {}) {
  const editor = MECHANIC_EDITORS[prefix];
  if (!editor) return;
  editor.rolls.replaceChildren(...(creation.rolls || []).map((entry) => createMechanicEditorRow("roll", entry)));
  editor.costs.replaceChildren(...(creation.costs || []).map((entry) => createMechanicEditorRow("cost", entry)));
  editor.modifiers.replaceChildren(...(creation.modifiers || []).map((entry) => createMechanicEditorRow("modifier", entry)));
  refreshMechanicsEditor(prefix);
}

function readMechanicsEditor(prefix, options = {}) {
  const editor = MECHANIC_EDITORS[prefix];
  const rolls = [];
  const costs = [];
  const modifiers = [];

  for (const row of editor.rolls.children) {
    const nameInput = row.querySelector('[data-mechanic-field="roll-name"]');
    const formulaInput = row.querySelector('[data-mechanic-field="roll-formula"]');
    const name = nameInput.value.trim();
    const parsed = parseDamageFormula(formulaInput.value);
    if (!name) return { error: "Dê um nome a todas as rolagens.", input: nameInput };
    if (parsed.error || !parsed.tokens.length) return { error: parsed.error || "Preencha a fórmula da rolagem.", input: formulaInput };
    rolls.push(sanitizeCreationRoll({ id: row.dataset.mechanicId, name, formula: parsed.formula }));
  }

  for (const row of editor.costs.children) {
    const valueInput = row.querySelector('[data-mechanic-field="cost-value"]');
    const value = clampInteger(valueInput.value, 1, 999999, 0);
    if (!value) return { error: "Cada gasto precisa ser de pelo menos 1 ponto.", input: valueInput };
    costs.push(sanitizeCreationCost({
      id: row.dataset.mechanicId,
      resource: row.querySelector('[data-mechanic-field="cost-resource"]').value,
      pool: row.querySelector('[data-mechanic-field="cost-pool"]').value,
      value,
    }));
  }

  for (const row of options.includeModifiers === false ? [] : editor.modifiers.children) {
    const formulaInput = row.querySelector('[data-mechanic-field="modifier-formula"]');
    const parsed = parseDamageFormula(formulaInput.value);
    if (parsed.error || !parsed.tokens.length) return { error: parsed.error || "Preencha o valor do modificador.", input: formulaInput };
    if (parsed.tokens.some((token) => token.type === "attribute")) {
      return { error: "Modificadores aceitam apenas dados ou números fixos.", input: formulaInput };
    }
    modifiers.push(sanitizeCreationModifier({
      id: row.dataset.mechanicId,
      type: row.querySelector('[data-mechanic-field="modifier-type"]').value,
      target: row.querySelector('[data-mechanic-field="modifier-target"]').value,
      formula: parsed.formula,
      resolvedValue: 0,
    }));
  }

  return { rolls, costs, modifiers, error: "" };
}

function appendMechanicEditorRow(prefix, kind, data = {}) {
  const editor = MECHANIC_EDITORS[prefix];
  const list = kind === "roll" ? editor.rolls : kind === "cost" ? editor.costs : editor.modifiers;
  const row = createMechanicEditorRow(kind, data);
  list.append(row);
  refreshMechanicsEditor(prefix);
  const firstField = row.querySelector("input, select");
  focusCreationEditorField(firstField, { preventScroll: true });
  const scroller = row.closest(".ability-editor-content");
  if (scroller) {
    requestAnimationFrame(() => {
      const rowRect = row.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      if (rowRect.bottom > scrollerRect.bottom - 16) {
        scroller.scrollBy({ top: rowRect.bottom - scrollerRect.bottom + 22, behavior: "smooth" });
      }
    });
  }
}

function modifierTargetLabel(modifier) {
  if (modifier.type === "attribute") return modifier.target;
  if (["pv", "pa", "sa"].includes(modifier.type)) return modifier.target === "max" ? "Máximo" : "Atual";
  if (modifier.type === "skill") {
    if (modifier.target === "all") return "Todas";
    return SKILLS.find((skill) => getSkillKey(skill) === modifier.target)?.name || "Perícia";
  }
  return "";
}

function getAllSheetCreations() {
  return [
    ...abilities.filter((creation) => creation.section !== "upgrades").map((creation) => ({ scope: "sheet", creation })),
    ...inventoryItems.map((item) => ({ scope: "inventory", creation: getEffectiveInventoryItem(item) })),
  ];
}

function getCreation(scope, id) {
  const collection = scope === "inventory"
    ? inventoryItems
    : scope === "minerva"
      ? grimoireAbilities
      : scope === "minerva-item"
        ? grimoireItems
        : abilities;
  const creation = collection.find((entry) => entry.id === id) || null;
  return scope === "inventory" ? getEffectiveInventoryItem(creation) : creation;
}

function getActiveModifierTotal(type, target = "general") {
  return getAllSheetCreations().reduce((total, { creation }) => {
    if (!creation.grantsModifiers || !creation.modifiersActive) return total;
    return total + creation.modifiers.reduce((subtotal, modifier) => {
      if (modifier.type !== type) return subtotal;
      if (type === "skill" && !["all", target].includes(modifier.target)) return subtotal;
      if (type === "attribute" && modifier.target !== target) return subtotal;
      return subtotal + clampInteger(modifier.resolvedValue, -999999, 999999, 0);
    }, 0);
  }, 0);
}

function modifierMatchesTarget(modifier, type, target = "general") {
  if (modifier.type !== type) return false;
  if (type === "skill") return modifier.target === "all" || modifier.target === target;
  if (type === "attribute") return modifier.target === target;
  return true;
}

function rollActiveCreationModifiers(type, target = "general") {
  let total = 0;
  const breakdown = [];
  getAllSheetCreations().forEach(({ creation }) => {
    if (!creation.grantsModifiers || !creation.modifiersActive) return;
    creation.modifiers.forEach((modifier) => {
      if (!modifierMatchesTarget(modifier, type, target)) return;
      const parsed = parseDamageFormula(modifier.formula);
      if (parsed.error || !parsed.tokens.length) return;
      const result = evaluateDamageFormulaDetailed(parsed);
      total += result.total;
      breakdown.push(`${creation.name}: ${result.breakdown}`);
    });
  });
  return { total, breakdown };
}

function modifierRollsPerUse(modifier) {
  return modifier.type === "skill" || modifier.type === "damage";
}

function migrateLegacyDynamicModifiers(schemaVersion) {
  if (clampInteger(schemaVersion, 0, 999, 0) >= 8) return;
  getAllSheetCreations().forEach(({ creation }) => {
    if (!creation.modifiersActive) return;
    creation.modifiers.forEach((modifier) => {
      const legacyValue = clampInteger(modifier.resolvedValue, -999999, 999999, 0);
      if (modifier.type === "skill" && legacyValue) {
        skillsList.querySelectorAll(".skill-row").forEach((row) => {
          if (modifier.target !== "all" && row.dataset.skillKey !== modifier.target) return;
          const input = row.querySelector("[data-fixed-modifier]");
          const current = Number.parseInt(input.value, 10);
          input.value = String((Number.isFinite(current) ? current : 0) - legacyValue);
        });
      }
      if (modifierRollsPerUse(modifier)) modifier.resolvedValue = 0;
    });
  });
}

function adjustDirectModifierTarget(modifier, direction) {
  const delta = clampInteger(modifier.resolvedValue, -999999, 999999, 0) * direction;
  if (!delta) return;
  if (["pv", "pa", "sa"].includes(modifier.type)) {
    const inputs = getResourceInputs(modifier.type);
    const field = modifier.target === "max" ? inputs.maximum : inputs.current;
    field.value = String(Math.max(0, clampInteger(field.value, 0, 999999, 0) + delta));
    if (modifier.target === "max") resourceMaxManual[modifier.type] = true;
    if (modifier.type === "sa") {
      inputs.current.value = String(Math.min(
        clampInteger(inputs.current.value, 0, 999999, 0),
        clampInteger(inputs.maximum.value, 0, 999999, 0),
      ));
    }
    return;
  }
  if (modifier.type === "attribute") {
    const input = document.querySelector(`[data-attribute="${modifier.target}"]`);
    if (input) input.value = String(normalizeAttributeValue(normalizeAttributeValue(input.value) + delta));
    return;
  }
}

function setCreationModifiersActive(scope, id, shouldActivate, options = {}) {
  const creation = getCreation(scope, id);
  if (!creation || !creation.grantsModifiers || !creation.modifiers.length) return false;
  if (Boolean(creation.modifiersActive) === Boolean(shouldActivate)) return true;

  if (shouldActivate) {
    creation.modifiers.forEach((modifier) => {
      if (modifierRollsPerUse(modifier)) {
        modifier.resolvedValue = 0;
        return;
      }
      const parsed = parseDamageFormula(modifier.formula);
      modifier.resolvedValue = parsed.error ? 0 : evaluateDamageFormula(parsed).total;
      adjustDirectModifierTarget(modifier, 1);
    });
    creation.modifiersActive = true;
  } else {
    creation.modifiers.forEach((modifier) => {
      if (!modifierRollsPerUse(modifier)) adjustDirectModifierTarget(modifier, -1);
      modifier.resolvedValue = 0;
    });
    creation.modifiersActive = false;
  }

  renderResourceState();
  applyClassCalculations();
  updateDifficultyTargets();
  renderAbilities();
  renderInventory();
  if (!abilityDetailModal.hidden && activeAbilityDetailId === id && activeAbilityDetailScope === scope) {
    openAbilityDetail(id, activeAbilityDetailTrigger, scope);
  }
  if (options.notify !== false) notifySheetChanged("creation-modifiers");
  return true;
}

function costDisplayLabel(cost) {
  return `${cost.value} ${CREATION_RESOURCES[cost.resource]} ${cost.pool === "max" ? "Máximos" : "Atuais"}`;
}

function creationSpendLabel(creation) {
  const costs = creation?.costs || [];
  if (!costs.length) return "Gastar";
  return `Gastar · ${costs.map(costDisplayLabel).join(" + ")}`;
}

function summarizeCreationCosts(costs) {
  const totals = Object.fromEntries(
    Object.keys(CREATION_RESOURCES).map((resource) => [resource, { current: 0, max: 0 }]),
  );
  (Array.isArray(costs) ? costs : []).forEach((cost) => {
    if (!totals[cost.resource] || !["current", "max"].includes(cost.pool)) return;
    totals[cost.resource][cost.pool] += clampInteger(cost.value, 0, 999999, 0);
  });
  return totals;
}

function findInsufficientCreationCosts(totals) {
  const missing = [];
  Object.entries(totals).forEach(([resource, required]) => {
    const inputs = getResourceInputs(resource);
    const available = {
      current: clampInteger(inputs.current?.value, 0, 999999, 0),
      max: clampInteger(inputs.maximum?.value, 0, 999999, 0),
    };
    ["current", "max"].forEach((pool) => {
      if (required[pool] > available[pool]) {
        missing.push({ resource, pool, required: required[pool], available: available[pool] });
      }
    });
  });
  return missing;
}

async function warnInsufficientCreationCosts(creation, missing, trigger) {
  const lines = missing.map((entry) => {
    const resource = CREATION_RESOURCES[entry.resource];
    const pool = entry.pool === "max" ? "Máximos" : "Atuais";
    return `${resource} ${pool}: precisa de ${entry.required}, mas possui ${entry.available}.`;
  });
  await showAbyssAlert({
    eyebrow: "Recursos insuficientes",
    title: "Não é possível gastar",
    message: `“${creation.name}” exige mais recursos do que o personagem possui.\n\n${lines.join("\n")}`,
    tone: "danger",
    trigger,
  });
}

async function applyCreationCosts(creation, trigger = null) {
  if (!creation.costs?.length) return true;
  const totals = summarizeCreationCosts(creation.costs);
  let missing = findInsufficientCreationCosts(totals);
  if (missing.length) {
    await warnInsufficientCreationCosts(creation, missing, trigger);
    return false;
  }

  const summary = creation.costs.map(costDisplayLabel).join("\n");
  const confirmed = await showAbyssConfirm({
    eyebrow: "Uso de recursos",
    title: "Gastar recursos?",
    message: `“${creation.name}” consumirá:\n\n${summary}`,
    confirmLabel: "Gastar",
    tone: "warning",
    trigger,
  });
  if (!confirmed) return false;

  missing = findInsufficientCreationCosts(totals);
  if (missing.length) {
    await warnInsufficientCreationCosts(creation, missing, trigger);
    return false;
  }

  Object.entries(totals).forEach(([resource, cost]) => {
    if (!cost.current && !cost.max) return;
    const inputs = getResourceInputs(resource);
    const maximum = clampInteger(inputs.maximum.value, 0, 999999, 0) - cost.max;
    let current = clampInteger(inputs.current.value, 0, 999999, 0) - cost.current;
    if (resource === "sa") current = Math.min(current, maximum);
    inputs.maximum.value = String(maximum);
    inputs.current.value = String(current);
    if (cost.max) resourceMaxManual[resource] = true;
  });
  renderResourceState();
  notifySheetChanged("creation-costs");
  return true;
}

function showCreationRollResult(title, context, parsed, result, trigger, options = {}) {
  playRollSound();
  activeAbilityTrigger = trigger;
  abilityRollDialog.querySelector(".eyebrow").textContent = context;
  document.querySelector("#ability-roll-title").textContent = title;
  document.querySelector("#ability-roll-formula").textContent = parsed.formula;
  document.querySelector("#ability-roll-total").textContent = result.total;
  document.querySelector("#ability-roll-breakdown").textContent = result.breakdown;
  abilityRollModal.hidden = false;
  syncModalLock();
  abilityRollDialog.focus();
  window.AbyssCloud?.recordRoll?.({ kind: options.kind || "creation", title, total: result.total, formula: parsed.formula, breakdown: result.breakdown, outcome: options.criticalDamage ? "critical-damage" : "", outcomeLabel: options.criticalDamage ? "Dano Crítico" : "", context: window.AbyssCloud?.getRollContext?.() });
}

async function rollNamedCreation(scope, creationId, rollId, trigger, chargeCosts = false) {
  const creation = getCreation(scope, creationId);
  const roll = creation?.rolls?.find((entry) => entry.id === rollId);
  if (!creation || !roll) return;
  if (chargeCosts && !(await applyCreationCosts(creation, trigger))) return;
  const parsed = parseDamageFormula(roll.formula);
  if (parsed.error || !parsed.tokens.length) return;
  const result = evaluateDamageFormulaDetailed(parsed);
  showCreationRollResult(`${creation.name} · ${roll.name}`, "Rolagem", parsed, result, trigger);
}

async function rollCreationDamage(scope, creationId, trigger, chargeCosts = false) {
  const creation = getCreation(scope, creationId);
  const profile = creation?.damageProfile || sanitizeDamageProfile({}, creation?.damage);
  const primaryParsed = parseDamageFormula(profile.primary);
  if (!creation || primaryParsed.error || !primaryParsed.tokens.length) return;
  if (chargeCosts && !(await applyCreationCosts(creation, trigger))) return;

  const primary = evaluateDamageFormulaDetailed(primaryParsed);
  let total = primary.total;
  const breakdown = [`Principal: ${primary.breakdown}`];
  const formulas = [primaryParsed.formula];

  const additionalParsed = parseDamageFormula(profile.additional);
  if (!additionalParsed.error && additionalParsed.tokens.length) {
    const additional = evaluateDamageFormulaDetailed(additionalParsed);
    total += additional.total;
    breakdown.push(`Adicional: ${additional.breakdown}`);
    formulas.push(additionalParsed.formula);
  }

  let criticalTriggered = false;
  const threshold = profile.criticalThreshold
    ? Math.max(1, profile.criticalThreshold - profile.criticalMarginReduction)
    : 0;
  const mainDice = primary.evaluatedTokens.find((token) => token.type === "dice" && token.sign > 0);
  if (threshold && mainDice?.results?.some((value) => value >= threshold)) {
    criticalTriggered = true;
    const criticalParsed = parseDamageFormula(profile.criticalBonus);
    if (!criticalParsed.error && criticalParsed.tokens.length) {
      const critical = evaluateDamageFormulaDetailed(criticalParsed);
      total += critical.total;
      breakdown.push(`Crítico (natural ≥ ${threshold}): ${critical.breakdown}`);
      formulas.push(criticalParsed.formula);
    }
  }

  const damageModifiers = rollActiveCreationModifiers("damage");
  if (damageModifiers.total || damageModifiers.breakdown.length) {
    total += damageModifiers.total;
    breakdown.push(`Modificadores ativos: ${damageModifiers.breakdown.join(" · ")} = ${formatSigned(damageModifiers.total)}`);
  }

  showCreationRollResult(
    creation.name,
    criticalTriggered ? "Dano · Crítico ativado" : "Rolagem de dano",
    { formula: formulas.join(" + ") },
    { total, breakdown: breakdown.join(" · ") },
    trigger,
    { kind: "damage", criticalDamage: criticalTriggered },
  );
}

async function useCreation(scope, creationId, trigger) {
  const creation = getCreation(scope, creationId);
  if (!creation?.costs?.length) return;
  await applyCreationCosts(creation, trigger);
}

function appendCreationQuickRolls(container, creation, scope, allowRolls = true) {
  if (!allowRolls || !creation.rolls?.length) return;
  const rolls = document.createElement("div");
  rolls.className = "creation-quick-rolls";
  creation.rolls.forEach((roll) => {
    const button = document.createElement("button");
    button.className = "creation-quick-roll";
    button.type = "button";
    button.dataset.quickCreationRoll = roll.id;
    button.dataset.creationScope = scope;
    button.dataset.creationId = creation.id;
    button.setAttribute("aria-label", `Rolar ${roll.name} de ${creation.name}: ${roll.formula}`);
    const rollLabel = document.createElement("span");
    rollLabel.className = "creation-quick-roll-label";
    const rollIcon = document.createElement("span");
    rollIcon.setAttribute("aria-hidden", "true");
    rollIcon.innerHTML = dieSvg(20, null);
    rollLabel.append(rollIcon, document.createTextNode(roll.name));
    button.append(
      rollLabel,
      Object.assign(document.createElement("small"), { textContent: roll.formula }),
    );
    rolls.append(button);
  });
  container.append(rolls);
}

function appendCreationDamageRoll(container, creation, scope, allowDamage = true) {
  const profile = creation?.damageProfile || sanitizeDamageProfile({}, creation?.damage);
  if (!allowDamage || !profile.primary) return;
  const rolls = container.querySelector(".creation-quick-rolls") || document.createElement("div");
  if (!rolls.isConnected) {
    rolls.className = "creation-quick-rolls";
    container.append(rolls);
  }
  const button = document.createElement("button");
  button.className = "creation-quick-roll is-damage-roll";
  button.type = "button";
  button.dataset.rollCreationDamage = creation.id;
  button.dataset.creationScope = scope;
  button.setAttribute("aria-label", `Rolar dano de ${creation.name}: ${profile.primary}`);
  button.append(
    Object.assign(document.createElement("span"), { textContent: "⚔️ Dano" }),
    Object.assign(document.createElement("small"), {
      textContent: profile.additional ? `${profile.primary} + ${profile.additional}` : profile.primary,
    }),
  );
  rolls.append(button);
}

function createCreationAction(label, dataKey, creation, scope, className = "") {
  const button = document.createElement("button");
  button.className = `ability-card-action ${className}`.trim();
  button.type = "button";
  button.dataset[dataKey] = creation.id;
  button.dataset.creationScope = scope;
  button.textContent = label;
  return button;
}

function createCardMiniAction(label, dataKey, creationId, className = "") {
  const button = document.createElement("button");
  button.className = `card-mini-action ${className}`.trim();
  button.type = "button";
  button.dataset[dataKey] = creationId;
  button.textContent = label;
  return button;
}

function createCreationCardShell(card, creation, scope, options = {}) {
  const shell = document.createElement("div");
  shell.className = `creation-card-shell${options.inventory ? " inventory-card-shell" : ""}`;
  if (options.inventory) shell.dataset.inventorySortId = creation.id;
  if (creation.damageProfile?.criticalThreshold) {
    card.append(createCriticalMarginControl(creation, scope));
  }
  shell.append(card);
  return shell;
}

function handleCreationCardPrimaryAction(event) {
  const quickRoll = event.target.closest("[data-quick-creation-roll]");
  if (quickRoll) {
    rollNamedCreation(
      quickRoll.dataset.creationScope,
      quickRoll.dataset.creationId,
      quickRoll.dataset.quickCreationRoll,
      quickRoll,
      false,
    );
    return true;
  }

  const use = event.target.closest("[data-use-creation]");
  if (use) {
    useCreation(use.dataset.creationScope, use.dataset.useCreation, use);
    return true;
  }

  const damage = event.target.closest("[data-roll-creation-damage]");
  if (damage) {
    rollCreationDamage(damage.dataset.creationScope, damage.dataset.rollCreationDamage, damage, false);
    return true;
  }
  return false;
}

function appendCreationDetailSection(container, title, rows) {
  if (!rows.length) return;
  const section = document.createElement("section");
  section.className = "creation-detail-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("div");
  list.className = "creation-detail-list";
  list.append(...rows);
  section.append(heading, list);
  container.append(section);
}

function createCreationDetailRow(label, value, buttonData = null) {
  const row = document.createElement("div");
  row.className = "creation-detail-row";
  const copy = document.createElement("span");
  copy.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = value;
  copy.append(" · ", strong);
  row.append(copy);
  if (buttonData) {
    const button = document.createElement("button");
    button.className = "creation-roll-button";
    button.type = "button";
    Object.entries(buttonData.dataset).forEach(([key, entry]) => { button.dataset[key] = entry; });
    button.textContent = buttonData.label;
    row.append(button);
  }
  return row;
}

function renderCreationDetailMechanics(creation, scope, container = document.querySelector("#ability-detail-mechanics")) {
  container.replaceChildren();
  appendCreationDetailSection(container, "Melhorias aplicadas", (creation.upgrades || []).map((upgrade) => {
    const row = createCreationDetailRow(upgrade.name, upgradeTypeLabel(upgrade.upgradeType));
    row.classList.add("creation-upgrade-detail-row");
    const description = document.createElement("div");
    description.className = "creation-upgrade-detail-description";
    setCreationDescription(description, upgrade, { fallback: "" });
    if (description.textContent.trim()) row.append(description);
    return row;
  }));
  const profile = creation.damageProfile || sanitizeDamageProfile({}, creation.damage);
  const isCatalogPreview = scope === "minerva" || scope === "minerva-item";

  const damageRows = [];
  if (profile.primary) damageRows.push(createCreationDetailRow("Dano Principal", profile.primary));
  if (profile.additional) damageRows.push(createCreationDetailRow("Dano Adicional", profile.additional));
  if (profile.criticalThreshold) {
    const effective = Math.max(1, profile.criticalThreshold - profile.criticalMarginReduction);
    damageRows.push(createCreationDetailRow(
      "Margem de Crítico",
      `${effective}+ (original ${profile.criticalThreshold}+)${profile.criticalBonus ? ` · + ${profile.criticalBonus}` : ""}`,
    ));
  }
  appendCreationDetailSection(container, "Dano", damageRows);
  if (profile.criticalThreshold && !isCatalogPreview) {
    container.lastElementChild?.append(createCriticalMarginControl(creation, scope));
  }

  appendCreationDetailSection(
    container,
    "Rolagens",
    (creation.rolls || []).map((roll) => createCreationDetailRow(
      roll.name,
      roll.formula,
      isCatalogPreview || (scope === "inventory" && creation.isWeapon) ? null : {
        label: "Rolar",
        dataset: { detailRoll: roll.id, creationScope: scope, creationId: creation.id },
      },
    )),
  );
  appendCreationDetailSection(
    container,
    "Gastos por uso",
    (creation.costs || []).map((cost) => createCreationDetailRow(CREATION_RESOURCES[cost.resource], costDisplayLabel(cost))),
  );
  appendCreationDetailSection(
    container,
    creation.modifiersActive ? "Modificadores ativos" : "Modificadores",
    (creation.modifiers || []).map((modifier) => {
      const target = modifierTargetLabel(modifier);
      const resolved = creation.modifiersActive
        ? modifierRollsPerUse(modifier)
          ? " → rola a cada uso"
          : ` → ${formatSigned(modifier.resolvedValue)}`
        : "";
      return createCreationDetailRow(
        CREATION_MODIFIER_TYPES[modifier.type],
        `${target ? `${target} · ` : ""}${modifier.formula}${resolved}`,
      );
    }),
  );
}

function revokePendingAbilityPreview() {
  if (pendingAbilityPreviewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(pendingAbilityPreviewUrl);
  }
  pendingAbilityPreviewUrl = "";
}

function renderAbilityMediaPreview(source = "") {
  revokePendingAbilityPreview();

  const safeSource = source.startsWith("blob:") ? source : safeAbilityMediaUrl(source);
  abilityMediaPreview.replaceChildren();

  if (safeSource) {
    const image = document.createElement("img");
    image.alt = "Prévia da mídia da habilidade";
    image.src = safeSource;
    image.addEventListener(
      "error",
      () => {
        abilityMediaPreview.replaceChildren();
        abilityMediaPreview.append(
          Object.assign(document.createElement("span"), { textContent: "✦" }),
          Object.assign(document.createElement("small"), { textContent: "Link inválido" }),
        );
      },
      { once: true },
    );
    abilityMediaPreview.append(image);
    if (source.startsWith("blob:")) pendingAbilityPreviewUrl = source;
    return;
  }

  const mark = document.createElement("span");
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "✦";
  abilityMediaPreview.append(
    mark,
    Object.assign(document.createElement("small"), { textContent: "Prévia" }),
  );
}

function abilitySectionLabel(section) {
  return ABILITY_SECTIONS[section]?.label || ABILITY_SECTIONS.attacks.label;
}

function createAbilityMediaElement(ability, className) {
  const media = document.createElement("div");
  media.className = className;
  const source = safeAbilityMediaUrl(ability.mediaUrl);

  if (source) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = source;
    image.loading = "lazy";
    image.addEventListener(
      "error",
      () => {
        media.replaceChildren(
          Object.assign(document.createElement("span"), { textContent: "✦" }),
        );
      },
      { once: true },
    );
    media.append(image);
  } else {
    media.append(Object.assign(document.createElement("span"), { textContent: "✦" }));
  }

  return media;
}

function openAbilityDetail(abilityId, trigger, scope = "sheet") {
  const ability = getCreation(scope, abilityId);
  if (!ability) return;
  const isInventoryLike = scope === "inventory" || scope === "minerva-item";
  const isCatalogPreview = scope === "minerva" || scope === "minerva-item";
  activeAbilityDetailId = ability.id;
  activeAbilityDetailScope = scope;
  activeAbilityDetailTrigger = trigger;
  document.querySelector("#ability-detail-kind").textContent = isInventoryLike
    ? `Informações · ${itemTypeLabel(ability)}`
    : `Informações · ${ability.section === "upgrades" ? upgradeTypeLabel(ability.upgradeType) : abilitySectionLabel(ability.section)}`;
  document.querySelector("#ability-detail-title").textContent = ability.name;
  document.querySelector("#ability-detail-origin").textContent = isInventoryLike
    ? `${scope === "minerva-item" ? "Loja" : "Inventário"} · Quantidade ${ability.quantity}`
    : abilityOriginLabel(ability, scope);
  setCreationDescription(document.querySelector("#ability-detail-description"), ability);
  const media = document.querySelector("#ability-detail-media");
  media.replaceChildren();
  media.hidden = isInventoryLike || !safeAbilityMediaUrl(ability.mediaUrl);
  if (!media.hidden) media.append(createAbilityMediaElement(ability, "ability-card-media"));
  const damage = document.querySelector("#ability-detail-damage");
  const primaryDamage = ability.damageProfile?.primary || ability.damage || "";
  damage.hidden = true;
  damage.textContent = "";
  renderCreationDetailMechanics(ability, scope);
  abilityDetailRoll.hidden = isCatalogPreview || !ability.costs?.length;
  abilityDetailRoll.textContent = creationSpendLabel(ability);
  abilityDetailDamageRoll.hidden = scope !== "sheet" || !primaryDamage;
  abilityDetailDamageRoll.textContent = primaryDamage ? `⚔️ Dano · ${primaryDamage}` : "⚔️ Dano";
  abilityDetailModifiers.hidden = isCatalogPreview || !ability.grantsModifiers || !ability.modifiers?.length;
  abilityDetailModifiers.textContent = ability.modifiersActive ? "Desativar modificadores" : "Ativar modificadores";
  abilityDetailModifiers.classList.toggle("is-active", ability.modifiersActive);
  abilityDetailModal.hidden = false;
  syncModalLock();
  abilityDetailDialog.focus();
}

function closeAbilityDetail() {
  abilityDetailModal.hidden = true;
  activeAbilityDetailId = null;
  activeAbilityDetailScope = "sheet";
  syncModalLock();
  if (activeAbilityDetailTrigger?.isConnected) activeAbilityDetailTrigger.focus();
}

function updateAbilityEchoField() {
  const isEcho = abilitySectionSelect.value === "echoes";
  abilityEchoField.hidden = !isEcho;
  abilityEchoSelect.required = isEcho;
  const isPower = abilitySectionSelect.value === "powers";
  const isSpell = abilitySectionSelect.value === "spells";
  const originHelp = document.querySelector("#ability-power-origin-help");
  originHelp.hidden = !isPower && !isSpell;
  originHelp.textContent = isSpell
    ? "Use Geral, Umbra, Lumen, Caos, Éter ou Ley para organizar a tag do Feitiço. Se ficar vazio, será Geral."
    : "Use Geral, Vanguardista, Especialista, Arcanista, Umbra, Lumen, Caos, Éter ou Ley para organizar a tag do Poder. Se ficar vazio, será Geral.";
  if (isPower || isSpell) abilityOriginInput.setAttribute("list", isSpell ? "ability-spell-origins" : "ability-power-origins");
  else abilityOriginInput.removeAttribute("list");
  abilityOriginInput.placeholder = isSpell
    ? "Ex.: Umbra, Lumen ou Geral"
    : isPower ? "Ex.: Vanguardista, Umbra ou Geral"
    : "Ex.: técnica, tradição ou fonte da habilidade";
}

function updateAbilityShopFields() {
  const canPublish = abilityEditorScope === "minerva" && abilitySectionSelect.value !== "upgrades";
  abilityShopFields.hidden = !canPublish;
  abilityShopPriceField.hidden = !canPublish || !abilityShopListedInput.checked;
  abilityShopPriceInput.required = canPublish && abilityShopListedInput.checked;
}

function renderAbilities() {
  renderEchoAbilities();
  const section = ABILITY_SECTIONS[activeAbilitySection] || ABILITY_SECTIONS.attacks;
  const filtered = abilities
    .filter((ability) => ability.section === activeAbilitySection)
    .map((ability) => ({ scope: "sheet", kind: "ability", creation: ability }));
  if (activeAbilitySection === "attacks") {
    filtered.push(...inventoryItems
      .filter((item) => item.isWeapon && item.equipped)
      .map((item) => ({ scope: "inventory", kind: "equipped-weapon", creation: getEffectiveInventoryItem(item) })));
  }
  filtered.sort((a, b) => portugueseCollator.compare(a.creation.name, b.creation.name));

  abilitySectionEyebrow.textContent = section.eyebrow;
  abilitySectionTitle.textContent = section.label;
  abilitiesCount.textContent = `${filtered.length} ${filtered.length === 1 ? "habilidade" : "habilidades"}`;
  abilitiesEmpty.hidden = filtered.length !== 0;
  abilitiesList.hidden = filtered.length === 0;
  abilitiesList.replaceChildren();

  filtered.forEach(({ creation: ability, scope, kind }) => {
    const isEquippedWeapon = kind === "equipped-weapon";
    if (!isEquippedWeapon && ability.section === "echoes") {
      abilitiesList.append(createEchoAbilityRow(ability));
      return;
    }
    const card = document.createElement("article");
    card.className = `ability-card creation-card${isEquippedWeapon ? " is-equipped-weapon" : ""}${ability.modifiersActive ? " is-active" : ""}`;
    card.dataset[isEquippedWeapon ? "itemId" : "abilityId"] = ability.id;

    const copy = document.createElement("div");
    copy.className = "ability-card-copy";

    const heading = document.createElement("div");
    heading.className = "creation-card-heading";
    const headingMain = document.createElement("div");
    headingMain.className = "creation-card-heading-main";
    const type = document.createElement("small");
    type.textContent = isEquippedWeapon
      ? `Ataques · ${itemTypeLabel(ability)} · Inventário`
      : `${section.label} · ${abilityOriginLabel(ability)}`;
    const name = Object.assign(document.createElement("h3"), {
      textContent: ability.name,
    });
    headingMain.append(type, name);
    if (isEquippedWeapon) {
      const headingTags = document.createElement("div");
      headingTags.className = "creation-card-heading-tags";
      const equippedTag = document.createElement("span");
      equippedTag.className = "creation-tag is-equipped";
      equippedTag.textContent = "Equipado";
      headingTags.append(equippedTag);
      headingMain.append(headingTags);
    }

    const miniActions = document.createElement("div");
    miniActions.className = "card-mini-actions";
    miniActions.append(
      createCardMiniAction("Abrir", isEquippedWeapon ? "openEquippedWeapon" : "openAbility", ability.id),
      createCardMiniAction("Editar", isEquippedWeapon ? "editEquippedWeapon" : "editAbility", ability.id),
    );
    if (isEquippedWeapon) {
      miniActions.append(createCardMiniAction("Guardar", "unequipWeapon", ability.id, "is-equip"));
    } else {
      miniActions.append(createCardMiniAction("Excluir", "deleteAbility", ability.id, "is-delete"));
    }
    heading.append(headingMain, miniActions);

    const description = document.createElement("div");
    setCreationDescription(description, ability);
    description.className = "creation-card-description";
    copy.append(heading, description);
    if (isEquippedWeapon) appendItemUpgradeTags(copy, ability);

    const primaryDamage = ability.damageProfile?.primary || ability.damage || "";
    appendCreationQuickRolls(copy, ability, scope, true);
    appendCreationDamageRoll(copy, ability, scope, Boolean(primaryDamage));
    const actions = document.createElement("div");
    actions.className = "creation-main-actions";
    if (ability.costs?.length) {
      actions.append(createCreationAction(creationSpendLabel(ability), "useCreation", ability, scope, "is-spend-action"));
    }
    if (ability.grantsModifiers && ability.modifiers?.length) {
      const toggle = document.createElement("button");
      toggle.className = `ability-card-action${ability.modifiersActive ? " is-active" : ""}`;
      toggle.type = "button";
      toggle.dataset[isEquippedWeapon ? "toggleEquippedModifiers" : "toggleAbilityModifiers"] = ability.id;
      toggle.textContent = ability.modifiersActive ? "Desativar efeitos" : "Ativar efeitos";
      actions.append(toggle);
    }
    if (actions.children.length) copy.append(actions);

    let media;
    if (isEquippedWeapon) {
      media = document.createElement("div");
      media.className = "item-card-icon";
      media.textContent = "⚔";
    } else {
      media = createAbilityMediaElement(ability, "ability-card-media");
    }
    card.append(media, copy);
    abilitiesList.append(createCreationCardShell(card, ability, scope));
  });
}

function selectAbilitySection(sectionKey) {
  if (!ABILITY_SECTIONS[sectionKey]) return;
  activeAbilitySection = sectionKey;
  let activeSectionButton = null;

  abilitySectionButtons.forEach((button) => {
    const selected = button.dataset.abilitySection === sectionKey;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    if (selected) activeSectionButton = button;
  });

  renderAbilities();
  if (activeSectionButton && window.matchMedia("(max-width: 760px)").matches) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    requestAnimationFrame(() => activeSectionButton.scrollIntoView({ behavior, block: "nearest", inline: "center" }));
  }
}

function setAbilityEditorError(message) {
  abilityEditorError.textContent = message;
  abilityEditorError.hidden = !message;
}

function openAbilityEditor(scope, ability = null, trigger = null) {
  abilityEditorScope = scope === "minerva" ? "minerva" : "sheet";
  activeAbilityId = ability?.id || null;
  activeAbilityTrigger = trigger;
  abilityEditorForm.reset();
  const upgradeOption = abilitySectionSelect.querySelector('option[value="upgrades"]');
  upgradeOption.hidden = abilityEditorScope !== "minerva";
  upgradeOption.disabled = abilityEditorScope !== "minerva";
  abilityUpgradeTypeSelect.value = sanitizeUpgradeType(ability?.upgradeType) || sanitizeUpgradeType(minervaUpgradeFilter.value) || "weapon";
  abilitySectionSelect.value = ability?.section || (
    abilityEditorScope === "minerva" ? activeMinervaSection : activeAbilitySection
  );
  abilityNameInput.value = ability?.name || "";
  abilityOriginInput.value = ability?.origin || "";
  abilityEchoSelect.value = ability?.echoKey || characterEchoSelect.value;
  updateAbilityEchoField();
  setCreationDescriptionEditor(abilityDescriptionInput, ability || {});
  abilityShopListedInput.checked = Boolean(ability?.shopListed);
  abilityShopPriceInput.value = String(clampInteger(ability?.shopPrice, 0, 999999999, 0));
  updateAbilityShopFields();
  const damageProfile = ability?.damageProfile || sanitizeDamageProfile({}, ability?.damage);
  abilityHasDamageInput.checked = Boolean(ability?.hasDamage ?? damageProfile.primary);
  abilityDamageFields.hidden = !abilityHasDamageInput.checked;
  abilityDamageInput.value = damageProfile.primary || "";
  abilityAdditionalDamageInput.value = damageProfile.additional || "";
  abilityCriticalThresholdInput.value = damageProfile.criticalThreshold ? String(damageProfile.criticalThreshold) : "";
  abilityCriticalBonusInput.value = damageProfile.criticalBonus || "";
  abilityGrantsModifiersInput.checked = Boolean(ability?.grantsModifiers);
  abilityModifiersFields.hidden = !abilityGrantsModifiersInput.checked;
  fillMechanicsEditor("ability", ability || {});
  abilityMediaUrlInput.value = ability?.mediaOwner === "link" ? ability.mediaUrl || "" : "";
  abilityEditorForm.dataset.existingMediaUrl = ability?.mediaUrl || "";
  abilityEditorForm.dataset.existingMediaRef = ability?.mediaRefId || "";
  abilityEditorForm.dataset.existingMediaOwner = ability?.mediaOwner || "link";
  abilityEditorForm.dataset.sourceId = ability?.sourceId || "";
  abilityEditorForm.dataset.mediaCleared = "false";
  abilityFileName.textContent =
    "PNG, JPG, WEBP ou GIF · até 8 MB. O arquivo será salvo com a conta.";
  setAbilityEditorError("");
  renderAbilityMediaPreview(ability?.mediaUrl || "");
  abilityEditorEyebrow.textContent =
    abilityEditorScope === "minerva" ? "Arquivo de conhecimentos" : "Habilidade do personagem";
  abilityEditorTitle.textContent = abilityEditorScope === "minerva" ? (ability ? "Editar no Grimório" : "Criar no Grimório") : (ability ? "Editar Habilidade" : "Criar Habilidade");
  saveAbilityButton.textContent = ability ? "Salvar Alterações" : "Criar Habilidade";
  updateAbilityUpgradeFields();
  setCreationEditorPanels(abilityEditorForm, ability);
  initializeCreationEditorNavigation(abilityEditorForm);
  abilityEditorModal.hidden = false;
  syncModalLock();
  abilityEditorDialog.focus();
  requestAnimationFrame(() => abilityNameInput.focus());
}

function closeAbilityEditor() {
  abilityEditorModal.hidden = true;
  revokePendingAbilityPreview();
  abilityMediaFileInput.value = "";
  syncModalLock();
  if (activeAbilityTrigger?.isConnected) activeAbilityTrigger.focus();
  else if (abilityEditorScope === "minerva") restoreMinervaEditorFocus();
}

async function submitAbilityEditor(event) {
  event.preventDefault();
  setAbilityEditorError("");
  if (abilitySectionSelect.value === "upgrades" && (abilityEditorScope !== "minerva" || !sanitizeUpgradeType(abilityUpgradeTypeSelect.value))) {
    setAbilityEditorError("Escolha o tipo de melhoria no Grimório de Minerva.");
    focusCreationEditorField(abilityUpgradeTypeSelect);
    return;
  }

  const name = abilityNameInput.value.trim();
  if (!name) {
    setAbilityEditorError("Dê um nome à Habilidade.");
    focusCreationEditorField(abilityNameInput);
    return;
  }

  if (abilitySectionSelect.value === "echoes" && !Object.hasOwn(ECHOES, abilityEchoSelect.value)) {
    setAbilityEditorError("Escolha o Eco de origem desta Habilidade.");
    focusCreationEditorField(abilityEchoSelect);
    return;
  }
  const mechanics = readMechanicsEditor("ability", { includeModifiers: abilityGrantsModifiersInput.checked });
  if (mechanics.error) {
    setAbilityEditorError(mechanics.error);
    focusCreationEditorField(mechanics.input);
    return;
  }
  const parsedDamage = parseDamageFormula(abilityDamageInput.value);
  const parsedAdditionalDamage = parseDamageFormula(abilityAdditionalDamageInput.value);
  if (abilityHasDamageInput.checked && (parsedDamage.error || !parsedDamage.tokens.length)) {
    setAbilityEditorError(parsedDamage.error || "Preencha o Dano Principal.");
    focusCreationEditorField(abilityDamageInput);
    return;
  }
  if (abilityHasDamageInput.checked && parsedAdditionalDamage.error) {
    setAbilityEditorError(parsedAdditionalDamage.error);
    focusCreationEditorField(abilityAdditionalDamageInput);
    return;
  }
  const parsedCriticalBonus = parseDamageFormula(abilityCriticalBonusInput.value);
  const criticalThreshold = clampInteger(abilityCriticalThresholdInput.value, 0, 1000, 0);
  if (abilityHasDamageInput.checked && parsedCriticalBonus.error) {
    setAbilityEditorError(parsedCriticalBonus.error);
    focusCreationEditorField(abilityCriticalBonusInput);
    return;
  }
  if (abilityHasDamageInput.checked && (criticalThreshold || parsedCriticalBonus.tokens.length)) {
    if (!criticalThreshold || !parsedCriticalBonus.tokens.length) {
      setAbilityEditorError("Para usar crítico, informe a margem natural e o Dano Crítico.");
      focusCreationEditorField(criticalThreshold ? abilityCriticalBonusInput : abilityCriticalThresholdInput);
      return;
    }
    const primaryDie = parsedDamage.tokens.find((token) => token.type === "dice" && token.sign > 0);
    if (!primaryDie || criticalThreshold > primaryDie.faces) {
      setAbilityEditorError("A margem de crítico deve caber no primeiro dado do Dano Principal.");
      focusCreationEditorField(abilityCriticalThresholdInput);
      return;
    }
  }
  if (abilityGrantsModifiersInput.checked && !mechanics.modifiers.length) {
    setAbilityEditorError("Adicione pelo menos um modificador ou desative “Concede Modificadores?”.");
    focusCreationEditorField(document.querySelector("#add-ability-modifier"));
    return;
  }

  const collection = abilityEditorScope === "minerva" ? grimoireAbilities : abilities;
  const existing = collection.find((item) => item.id === activeAbilityId) || null;
  const id =
    existing?.id || createAbilityId(abilityEditorScope === "minerva" ? "minerva" : "ability");
  const file = abilityMediaFileInput.files?.[0] || null;
  const typedUrl = abilityMediaUrlInput.value.trim();

  if (typedUrl && !safeRemoteImageUrl(typedUrl)) {
    setAbilityEditorError("O link da imagem precisa começar com http:// ou https://.");
    focusCreationEditorField(abilityMediaUrlInput);
    return;
  }
  const allowedImageTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ]);
  if (file && (!allowedImageTypes.has(file.type) || file.size > 8 * 1024 * 1024)) {
    setAbilityEditorError("Escolha uma imagem ou GIF de até 8 MB.");
    focusCreationEditorField(abilityMediaFileInput);
    return;
  }

  const cleared = abilityEditorForm.dataset.mediaCleared === "true";
  let mediaUrl = typedUrl ? safeRemoteImageUrl(typedUrl) : cleared ? "" : existing?.mediaUrl || "";
  let mediaRefId = typedUrl || cleared ? "" : existing?.mediaRefId || "";
  let mediaOwner = typedUrl || cleared ? "link" : existing?.mediaOwner || "link";
  let newlyUploadedMedia = null;

  saveAbilityButton.disabled = true;
  saveAbilityButton.textContent = file ? "Enviando mídia…" : "Salvando…";

  try {
    if (file) {
      if (!window.AbyssCloud?.isSignedIn()) {
        throw new Error(
          "Entre com o Google para enviar um arquivo. Você ainda pode usar um link de imagem ou GIF.",
        );
      }

      const uploaded = await window.AbyssCloud.uploadAbilityMedia({
        scope: abilityEditorScope,
        abilityId: id,
        file,
      });
      mediaUrl = uploaded.url;
      mediaRefId = uploaded.refId;
      mediaOwner = abilityEditorScope === "minerva" ? "minerva" : "slot";
      newlyUploadedMedia = uploaded;
    }

    const nextAbility = sanitizeAbility({
      id,
      section: abilitySectionSelect.value,
      upgradeType: abilitySectionSelect.value === "upgrades" ? abilityUpgradeTypeSelect.value : "",
      name,
      ...readCreationDescriptionEditor(abilityDescriptionInput),
      origin: abilityOriginInput.value,
      echoKey: abilitySectionSelect.value === "echoes" ? abilityEchoSelect.value : "",
      hasDamage: abilityHasDamageInput.checked,
      damage: abilityHasDamageInput.checked ? parsedDamage.formula : "",
      damageProfile: {
        primary: abilityHasDamageInput.checked ? parsedDamage.formula : "",
        additional: abilityHasDamageInput.checked ? parsedAdditionalDamage.formula : "",
        criticalThreshold: abilityHasDamageInput.checked ? criticalThreshold : 0,
        criticalBonus: abilityHasDamageInput.checked ? parsedCriticalBonus.formula : "",
        criticalMarginReduction: existing?.damageProfile?.criticalMarginReduction || 0,
      },
      rolls: mechanics.rolls,
      costs: mechanics.costs,
      grantsModifiers: abilityGrantsModifiersInput.checked,
      modifiersActive: false,
      modifiers: abilityGrantsModifiersInput.checked ? mechanics.modifiers : [],
      mediaUrl,
      mediaRefId,
      mediaOwner,
      sourceId: existing?.sourceId || abilityEditorForm.dataset.sourceId || "",
      shopListed: abilityEditorScope === "minerva" && abilityShopListedInput.checked,
      shopPrice:
        abilityEditorScope === "minerva" && abilityShopListedInput.checked
          ? abilityShopPriceInput.value
          : 0,
    });

    if (abilityEditorScope === "minerva") {
      if (!window.AbyssCloud?.isMinervaAdmin()) {
        throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
      }
      await window.AbyssCloud.saveMinervaAbility(nextAbility);
      await refreshGrimoireFromCloud();
      if (nextAbility.section === "upgrades") minervaUpgradeFilter.value = nextAbility.upgradeType;
      selectMinervaSection(nextAbility.section);
    } else {
      const index = abilities.findIndex((item) => item.id === id);
      if (index >= 0) abilities[index] = nextAbility;
      else abilities.push(nextAbility);

      selectAbilitySection(nextAbility.section);
      notifySheetChanged(index >= 0 ? "ability-edited" : "ability-created");
    }

    const oldRefId = existing?.mediaRefId || "";
    const ownsOld =
      abilityEditorScope === "minerva"
        ? existing?.mediaOwner === "minerva"
        : existing?.mediaOwner === "slot";

    if (oldRefId && oldRefId !== mediaRefId && ownsOld) {
      window.AbyssCloud
        ?.deleteMedia({
          scope: abilityEditorScope,
          refId: oldRefId,
        })
        .catch(() => {});
    }

    newlyUploadedMedia = null;
    closeAbilityEditor();
  } catch (error) {
    if (newlyUploadedMedia) {
      window.AbyssCloud?.deleteMedia(newlyUploadedMedia).catch(() => {});
    }
    const friendlyCloudError = error?.code
      ? window.AbyssCloud?.describeError?.(error)
      : "";
    setAbilityEditorError(
      friendlyCloudError || userFacingErrorMessage(error) || "Não foi possível salvar a Habilidade.",
    );
  } finally {
    saveAbilityButton.disabled = false;
    saveAbilityButton.textContent = existing ? "Salvar Alterações" : abilitySectionSelect.value === "upgrades" ? "Publicar Melhoria" : "Criar Habilidade";
  }
}

async function deleteSheetAbility(abilityId) {
  const ability = abilities.find((item) => item.id === abilityId);
  if (!ability) return;
  const confirmed = await showAbyssConfirm({
    eyebrow: "Habilidades",
    title: "Excluir Habilidade?",
    message: `“${ability.name}” será removida deste Slot.`,
    confirmLabel: "Excluir",
    tone: "danger",
  });
  if (!confirmed) return;

  if (ability.modifiersActive) setCreationModifiersActive("sheet", ability.id, false, { notify: false });
  abilities = abilities.filter((item) => item.id !== abilityId);
  renderAbilities();
  notifySheetChanged("ability-deleted");

  if (ability.mediaOwner === "slot" && ability.mediaRefId) {
    window.AbyssCloud
      ?.deleteMedia({ scope: "sheet", refId: ability.mediaRefId })
      .catch(() => {});
  }
}

function setItemEditorError(message) {
  itemEditorError.textContent = message;
  itemEditorError.hidden = !message;
}

function updateItemWeaponFields() {
  itemWeaponFields.hidden = !itemIsWeaponInput.checked;
}

function updateItemModifierFields() {
  itemModifiersFields.hidden = !itemGrantsModifiersInput.checked;
}

function updateItemShopDestinationFields() {
  const isShopItem = itemEditorScope === "minerva";
  document.querySelector("#item-publication-group").hidden = !isShopItem;
  itemShopDestinationField.hidden = !isShopItem;
  const needsEcho = isShopItem && itemShopDestinationSelect.value === "echoes";
  itemShopEchoField.hidden = !needsEcho;
  itemShopEchoSelect.required = needsEcho;
}

function openItemEditor(item = null, trigger = null, scope = "inventory") {
  itemEditorScope = scope === "minerva" ? "minerva" : "inventory";
  activeItemId = item?.id || null;
  activeItemTrigger = trigger;
  itemEditorForm.reset();
  itemEditorForm.dataset.sheetEpoch = String(notesEpoch);
  itemTypeSelect.value = sanitizeItemType(item?.itemType, item?.isWeapon);
  itemNameInput.value = item?.name || "";
  itemQuantityInput.value = String(item?.quantity || 1);
  itemShopPriceInput.value = String(clampInteger(item?.shopPrice, 0, 999999999, 0));
  itemShopPriceField.hidden = itemEditorScope !== "minerva";
  itemShopPriceInput.required = itemEditorScope === "minerva";
  itemShopDestinationSelect.value = sanitizeShopDestination(item?.shopDestination);
  itemShopEchoSelect.value = Object.hasOwn(ECHOES, item?.shopEchoKey) ? item.shopEchoKey : "";
  setCreationDescriptionEditor(itemDescriptionInput, item || {});
  itemIsWeaponInput.checked = Boolean(item?.isWeapon);
  const profile = item?.damageProfile || sanitizeDamageProfile({});
  itemPrimaryDamageInput.value = profile.primary || "";
  itemAdditionalDamageInput.value = profile.additional || "";
  itemCriticalThresholdInput.value = profile.criticalThreshold ? String(profile.criticalThreshold) : "";
  itemCriticalBonusInput.value = profile.criticalBonus || "";
  itemEditorForm.dataset.criticalMarginReduction = String(profile.criticalMarginReduction || 0);
  itemGrantsModifiersInput.checked = Boolean(item?.grantsModifiers);
  fillMechanicsEditor("item", item || {});
  updateItemWeaponFields();
  updateItemModifierFields();
  updateItemShopDestinationFields();
  setItemEditorError("");
  itemEditorEyebrow.textContent = itemEditorScope === "minerva" ? "Arquivo de conhecimentos" : "Inventário do personagem";
  itemEditorTitle.textContent = itemEditorScope === "minerva" ? (item ? "Editar no Grimório" : "Criar no Grimório") : (item ? "Editar Item" : "Criar Item");
  saveItemButton.textContent = item ? "Salvar Alterações" : itemEditorScope === "minerva" ? "Publicar Item" : "Criar Item";
  setCreationEditorPanels(itemEditorForm, item);
  initializeCreationEditorNavigation(itemEditorForm);
  itemEditorModal.hidden = false;
  syncModalLock();
  itemEditorDialog.focus();
  requestAnimationFrame(() => itemNameInput.focus());
}

function closeItemEditor() {
  itemEditorModal.hidden = true;
  activeItemId = null;
  syncModalLock();
  if (activeItemTrigger?.isConnected) activeItemTrigger.focus();
  else if (itemEditorScope === "minerva") restoreMinervaEditorFocus();
}

async function submitItemEditor(event) {
  event.preventDefault();
  if (isNotebookReadOnly() || (itemEditorScope === "inventory" && itemEditorForm.dataset.sheetEpoch !== String(notesEpoch))) return;
  setItemEditorError("");
  const name = itemNameInput.value.trim();
  if (!name) {
    setItemEditorError("Dê um nome ao Item.");
    focusCreationEditorField(itemNameInput);
    return;
  }
  if (
    itemEditorScope === "minerva" &&
    itemShopDestinationSelect.value === "echoes" &&
    !Object.hasOwn(ECHOES, itemShopEchoSelect.value)
  ) {
    setItemEditorError("Escolha o Eco que receberá este produto.");
    focusCreationEditorField(itemShopEchoSelect);
    return;
  }

  const mechanics = readMechanicsEditor("item", { includeModifiers: itemGrantsModifiersInput.checked });
  if (mechanics.error) {
    setItemEditorError(mechanics.error);
    focusCreationEditorField(mechanics.input);
    return;
  }
  if (itemGrantsModifiersInput.checked && !mechanics.modifiers.length) {
    setItemEditorError("Adicione pelo menos um modificador ou desative “Concede Modificadores?”.");
    focusCreationEditorField(document.querySelector("#add-item-modifier"));
    return;
  }

  const primary = parseDamageFormula(itemPrimaryDamageInput.value);
  const additional = parseDamageFormula(itemAdditionalDamageInput.value);
  const criticalBonus = parseDamageFormula(itemCriticalBonusInput.value);
  const criticalThreshold = clampInteger(itemCriticalThresholdInput.value, 0, 1000, 0);
  if (itemIsWeaponInput.checked && (primary.error || !primary.tokens.length)) {
    setItemEditorError(primary.error || "Uma arma precisa de Dano Principal.");
    focusCreationEditorField(itemPrimaryDamageInput);
    return;
  }
  if (itemIsWeaponInput.checked && additional.error) {
    setItemEditorError(additional.error);
    focusCreationEditorField(itemAdditionalDamageInput);
    return;
  }
  if (itemIsWeaponInput.checked && criticalBonus.error) {
    setItemEditorError(criticalBonus.error);
    focusCreationEditorField(itemCriticalBonusInput);
    return;
  }
  const primaryDie = primary.tokens?.find((token) => token.type === "dice" && token.sign > 0);
  if (itemIsWeaponInput.checked && (criticalThreshold || criticalBonus.tokens.length)) {
    if (!criticalThreshold || !criticalBonus.tokens.length) {
      setItemEditorError("Para usar crítico, informe a margem natural e o Dano Crítico.");
      focusCreationEditorField(criticalThreshold ? itemCriticalBonusInput : itemCriticalThresholdInput);
      return;
    }
    if (!primaryDie || criticalThreshold > primaryDie.faces) {
      setItemEditorError("A margem de crítico deve caber no primeiro dado do Dano Principal.");
      focusCreationEditorField(itemCriticalThresholdInput);
      return;
    }
  }

  const targetCollection = itemEditorScope === "minerva" ? grimoireItems : inventoryItems;
  const existingIndex = targetCollection.findIndex((entry) => entry.id === activeItemId);
  const existing = existingIndex >= 0 ? targetCollection[existingIndex] : null;
  if (existing && itemEditorScope === "inventory" && (existing.upgrades || []).some((upgrade) => upgrade.upgradeType !== itemTypeSelect.value)) {
    const epoch = notesEpoch;
    const confirmed = await showAbyssConfirm({ eyebrow: "Tipo de Item", title: "Remover melhorias incompatíveis?", message: "Ao mudar o tipo deste item, as melhorias incompatíveis serão removidas com seus efeitos.", confirmLabel: "Alterar tipo", tone: "warning", trigger: saveItemButton });
    if (!confirmed || epoch !== notesEpoch || inventoryItems.find((item) => item.id === existing.id) !== existing || isNotebookReadOnly()) return;
  }
  if (existing?.modifiersActive && itemEditorScope === "inventory") setCreationModifiersActive("inventory", existing.id, false, { notify: false });
  const nextItem = sanitizeInventoryItem({
    id: existing?.id || createAbilityId("item"),
    name,
    quantity: itemQuantityInput.value,
    itemType: itemTypeSelect.value,
    upgrades: existing?.upgrades || [],
    ...readCreationDescriptionEditor(itemDescriptionInput),
    isWeapon: itemIsWeaponInput.checked,
    equipped: itemIsWeaponInput.checked && Boolean(existing?.equipped),
    damageProfile: {
      primary: itemIsWeaponInput.checked ? primary.formula : "",
      additional: itemIsWeaponInput.checked ? additional.formula : "",
      criticalThreshold: itemIsWeaponInput.checked ? criticalThreshold : 0,
      criticalBonus: itemIsWeaponInput.checked ? criticalBonus.formula : "",
      criticalMarginReduction: existing?.damageProfile?.criticalMarginReduction || 0,
    },
    rolls: mechanics.rolls,
    costs: mechanics.costs,
    grantsModifiers: itemGrantsModifiersInput.checked,
    modifiersActive: false,
    modifiers: itemGrantsModifiersInput.checked ? mechanics.modifiers : [],
    sourceId: existing?.sourceId || "",
    shopListed: itemEditorScope === "minerva",
    shopPrice: itemEditorScope === "minerva" ? itemShopPriceInput.value : 0,
    shopDestination:
      itemEditorScope === "minerva"
        ? itemShopDestinationSelect.value
        : "inventory",
    shopEchoKey:
      itemEditorScope === "minerva" && itemShopDestinationSelect.value === "echoes"
        ? itemShopEchoSelect.value
        : "",
  });
  if (itemEditorScope === "minerva") {
    if (!window.AbyssCloud?.isMinervaAdmin()) {
      setItemEditorError("Esta conta não possui acesso ao Grimório de Minerva.");
      return;
    }
    saveItemButton.disabled = true;
    saveItemButton.textContent = "Publicando…";
    try {
      await window.AbyssCloud.saveMinervaItem(nextItem);
      await refreshGrimoireFromCloud();
      selectMinervaSection("inventory");
      closeItemEditor();
    } catch (error) {
      setItemEditorError(userFacingErrorMessage(error) || "Não foi possível publicar este Item.");
    } finally {
      saveItemButton.disabled = false;
      saveItemButton.textContent = existing ? "Salvar Alterações" : "Publicar Item";
    }
    return;
  }

  if (existingIndex >= 0) inventoryItems[existingIndex] = nextItem;
  else inventoryItems.push(nextItem);
  renderInventory();
  renderAbilities();
  notifySheetChanged(existing ? "item-edited" : "item-created");
  closeItemEditor();
}

function createCriticalMarginControl(item, scope = "inventory") {
  const box = document.createElement("div");
  box.className = "critical-margin-box";
  const original = item.damageProfile.criticalThreshold;
  const effective = Math.max(1, original - item.damageProfile.criticalMarginReduction);
  const decrease = document.createElement("button");
  decrease.type = "button";
  decrease.dataset.adjustCritical = item.id;
  decrease.dataset.criticalScope = scope;
  decrease.dataset.direction = "-1";
  decrease.setAttribute("aria-label", `Diminuir Margem de Crítico de ${item.name}`);
  decrease.textContent = "−";
  decrease.disabled = effective <= 1;
  const copy = document.createElement("span");
  copy.className = "critical-margin-copy";
  copy.innerHTML = `<small>Crítico</small><span><b>${effective}+</b><em>base <strong>${original}+</strong></em></span>`;
  const increase = document.createElement("button");
  increase.type = "button";
  increase.dataset.adjustCritical = item.id;
  increase.dataset.criticalScope = scope;
  increase.dataset.direction = "1";
  increase.setAttribute("aria-label", `Restaurar Margem de Crítico de ${item.name}`);
  increase.textContent = "+";
  increase.disabled = item.damageProfile.criticalMarginReduction <= 0;
  box.append(decrease, copy, increase);
  return box;
}

function adjustCreationCriticalMargin(scope, itemId, direction) {
  const item = getCreation(scope, itemId);
  if (!item?.damageProfile?.criticalThreshold) return;
  const maximumReduction = Math.max(0, item.damageProfile.criticalThreshold - 1);
  item.damageProfile.criticalMarginReduction = clampInteger(
    item.damageProfile.criticalMarginReduction + (direction < 0 ? 1 : -1),
    0,
    maximumReduction,
    0,
  );
  renderInventory();
  renderAbilities();
  if (!abilityDetailModal.hidden && activeAbilityDetailScope === scope && activeAbilityDetailId === itemId) {
    openAbilityDetail(itemId, activeAbilityDetailTrigger, scope);
  }
  notifySheetChanged("critical-margin");
}

function setInventoryMoveMode(shouldMove, options = {}) {
  if (!shouldMove && inventoryDragState) finishInventoryReorder();
  inventoryMoveMode = Boolean(shouldMove);
  inventoryMoveToggle.classList.toggle("is-active", inventoryMoveMode);
  inventoryMoveToggle.setAttribute("aria-pressed", String(inventoryMoveMode));
  inventoryMoveToggle.querySelector("span").textContent = inventoryMoveMode ? "Concluir" : "Mover";
  inventoryMoveHint.hidden = !inventoryMoveMode;
  inventorySearchInput.disabled = inventoryMoveMode;
  createItemButton.disabled = inventoryMoveMode;
  if (inventoryMoveMode) inventorySearchInput.value = "";
  if (options.render !== false) renderInventory();
}

function beginInventoryReorder(event) {
  if (!inventoryMoveMode || event.button > 0 || inventoryDragState) return;
  if (event.target.closest("button, input, select, textarea, a")) return;
  const source = event.target.closest("[data-inventory-sort-id]");
  if (!source) return;
  const rect = source.getBoundingClientRect();
  inventoryDragState = {
    pointerId: event.pointerId,
    source,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    dragging: false,
    ghost: null,
  };
  source.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveInventoryDragGhost(state, clientX, clientY) {
  if (!state.ghost) return;
  state.ghost.style.left = `${clientX - state.offsetX}px`;
  state.ghost.style.top = `${clientY - state.offsetY}px`;
}

function updateInventoryReorder(event) {
  const state = inventoryDragState;
  if (!state || state.pointerId !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
  if (!state.dragging && distance < 7) return;

  if (!state.dragging) {
    state.dragging = true;
    state.source.classList.add("is-dragging");
    state.ghost = state.source.cloneNode(true);
    state.ghost.classList.add("inventory-drag-ghost");
    state.ghost.classList.remove("is-dragging");
    state.ghost.style.width = `${state.width}px`;
    document.body.append(state.ghost);
    document.body.classList.add("inventory-is-dragging");
  }

  moveInventoryDragGhost(state, event.clientX, event.clientY);
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-inventory-sort-id]");
  if (target && target !== state.source && target.parentElement === inventoryList) {
    const rect = target.getBoundingClientRect();
    const withinRow = event.clientY >= rect.top && event.clientY <= rect.bottom;
    const placeBefore = withinRow
      ? event.clientX < rect.left + rect.width / 2
      : event.clientY < rect.top + rect.height / 2;
    inventoryList.insertBefore(state.source, placeBefore ? target : target.nextElementSibling);
  }

  const edge = 72;
  if (event.clientY < edge) window.scrollBy({ top: -12, behavior: "auto" });
  else if (event.clientY > window.innerHeight - edge) window.scrollBy({ top: 12, behavior: "auto" });
  event.preventDefault();
}

function finishInventoryReorder(event) {
  const state = inventoryDragState;
  if (!state || (event && state.pointerId !== event.pointerId)) return;
  if (state.source.hasPointerCapture?.(state.pointerId)) {
    state.source.releasePointerCapture(state.pointerId);
  }
  state.source.classList.remove("is-dragging");
  state.ghost?.remove();
  document.body.classList.remove("inventory-is-dragging");

  if (state.dragging) {
    const orderedIds = [...inventoryList.querySelectorAll("[data-inventory-sort-id]")]
      .map((shell) => shell.dataset.inventorySortId);
    const itemsById = new Map(inventoryItems.map((item) => [item.id, item]));
    inventoryItems = [
      ...orderedIds.map((id) => itemsById.get(id)).filter(Boolean),
      ...inventoryItems.filter((item) => !orderedIds.includes(item.id)),
    ];
    inventorySuppressClickUntil = Date.now() + 300;
    notifySheetChanged("inventory-order");
  }

  inventoryDragState = null;
  renderInventory();
}

function renderInventory() {
  if (!inventoryList || !inventoryEmpty) return;
  const query = normalizeSearchTerm(inventorySearchInput.value);
  const visible = inventoryItems
    .filter((item) => !query || normalizeSearchTerm(`${item.name} ${item.description} ${itemTypeLabel(item)} ${(item.upgrades || []).map((upgrade) => upgrade.name).join(" ")}`).includes(query));
  inventoryCount.textContent = `${visible.length} ${visible.length === 1 ? "item" : "itens"}`;
  inventoryEmpty.hidden = visible.length !== 0;
  inventoryList.hidden = visible.length === 0;
  inventoryList.classList.toggle("is-move-mode", inventoryMoveMode);
  inventoryList.replaceChildren();

  visible.forEach((rawItem) => {
    const item = getEffectiveInventoryItem(rawItem);
    const card = document.createElement("article");
    card.className = `ability-card creation-card inventory-card${item.isWeapon ? " is-weapon" : ""}${item.equipped ? " is-equipped" : ""}${item.modifiersActive ? " is-active" : ""}`;
    card.dataset.itemId = item.id;
    const icon = document.createElement("div");
    icon.className = "item-card-icon";
    icon.textContent = item.isWeapon ? "⚔" : "◇";
    const copy = document.createElement("div");
    copy.className = "ability-card-copy";

    const heading = document.createElement("div");
    heading.className = "creation-card-heading";
    const headingMain = document.createElement("div");
    headingMain.className = "creation-card-heading-main";
    const type = document.createElement("small");
    type.textContent = `Quantidade ${item.quantity}`;
    const name = document.createElement("h3");
    name.textContent = item.name;
    headingMain.append(createItemTypeBadge(item), name, type);
    if (item.equipped) {
      const headingTags = document.createElement("div");
      headingTags.className = "creation-card-heading-tags";
      const equippedTag = document.createElement("span");
      equippedTag.className = "creation-tag is-equipped";
      equippedTag.textContent = "Equipado";
      headingTags.append(equippedTag);
      headingMain.append(headingTags);
    }

    const miniActions = document.createElement("div");
    miniActions.className = "card-mini-actions";
    miniActions.append(
      createCardMiniAction("Abrir", "openItem", item.id),
      createCardMiniAction("Editar", "editItem", item.id),
      createCardMiniAction("Excluir", "deleteItem", item.id, "is-delete"),
    );
    heading.append(headingMain, miniActions);

    const description = document.createElement("div");
    setCreationDescription(description, item);
    description.className = "creation-card-description";
    copy.append(heading, description);
    appendItemUpgradeTags(copy, item);
    appendCreationQuickRolls(copy, item, "inventory", !item.isWeapon);

    const actions = document.createElement("div");
    actions.className = "creation-main-actions";
    if (UPGRADE_ITEM_TYPES.includes(item.itemType)) {
      const upgrade = document.createElement("button");
      upgrade.type = "button";
      upgrade.className = "ability-card-action";
      upgrade.dataset.openItemUpgrades = item.id;
      upgrade.textContent = "Adicionar melhorias";
      actions.append(upgrade);
    }
    if (item.isWeapon) {
      const equip = document.createElement("button");
      equip.className = `ability-card-action is-equip${item.equipped ? " is-equipped" : ""}`;
      equip.type = "button";
      equip.dataset.toggleWeaponEquipped = item.id;
      equip.textContent = item.equipped ? "Guardar" : "Equipar";
      equip.setAttribute("aria-pressed", String(item.equipped));
      actions.append(equip);
    }
    if (item.costs.length) {
      actions.append(createCreationAction(creationSpendLabel(item), "useCreation", item, "inventory", "is-spend-action"));
    }
    if (item.grantsModifiers && item.modifiers.length) {
      const toggle = document.createElement("button");
      toggle.className = `ability-card-action${item.modifiersActive ? " is-active" : ""}`;
      toggle.type = "button";
      toggle.dataset.toggleItemModifiers = item.id;
      toggle.textContent = item.modifiersActive ? "Desativar efeitos" : "Ativar efeitos";
      actions.append(toggle);
    }
    if (actions.children.length) copy.append(actions);
    card.append(icon, copy);
    inventoryList.append(createCreationCardShell(card, item, "inventory", { inventory: true }));
  });
}

function setWeaponEquipped(itemId, shouldEquip) {
  const item = inventoryItems.find((entry) => entry.id === itemId);
  if (!item?.isWeapon || item.equipped === Boolean(shouldEquip)) return;
  if (!shouldEquip && item.modifiersActive) {
    setCreationModifiersActive("inventory", item.id, false, { notify: false });
  }
  item.equipped = Boolean(shouldEquip);
  renderInventory();
  renderAbilities();
  notifySheetChanged(shouldEquip ? "weapon-equipped" : "weapon-unequipped");
}

async function deleteInventoryItem(itemId) {
  const item = inventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;
  const confirmed = await showAbyssConfirm({
    eyebrow: "Inventário",
    title: "Excluir Item?",
    message: `“${item.name}” será removido definitivamente deste Slot.`,
    confirmLabel: "Excluir",
    tone: "danger",
  });
  if (!confirmed) return;
  if (item.modifiersActive) setCreationModifiersActive("inventory", item.id, false, { notify: false });
  inventoryItems = inventoryItems.filter((entry) => entry.id !== itemId);
  renderInventory();
  renderAbilities();
  notifySheetChanged("item-deleted");
}

function rollAbilityDamage(abilityId, trigger) {
  rollCreationDamage("sheet", abilityId, trigger, false);
}

function closeAbilityRoll() {
  abilityRollModal.hidden = true;
  syncModalLock();
  if (activeAbilityTrigger?.isConnected) activeAbilityTrigger.focus();
}

function createGrimoireItem(ability, mode) {
  const card = document.createElement("article");
  card.className = "grimoire-item";

  const copy = document.createElement("div");
  copy.className = "grimoire-item-copy";

  const type = document.createElement("small");
  type.textContent = `${ability.section === "upgrades" ? upgradeTypeLabel(ability.upgradeType) : abilitySectionLabel(ability.section)} · ${abilityOriginLabel(ability, "minerva")} · ${ability.shopListed ? `Loja: ${formatVerdeons(ability.shopPrice)}` : "Fora da Loja"}`;
  const name = Object.assign(document.createElement("strong"), {
    textContent: ability.name,
  });
  const description = document.createElement("div");
  setCreationDescription(description, ability, { fallback: ability.damage });
  copy.append(type, name);
  if (ability.section !== "echoes") copy.append(description);

  const actions = document.createElement("div");
  actions.className = "grimoire-item-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "ability-card-action";
  open.dataset.openGrimoireAbility = ability.id;
  open.textContent = "Abrir";
  actions.append(open);

  if (mode === "picker") {
    const add = document.createElement("button");
    add.className = "ability-card-action";
    add.type = "button";
    add.dataset.importMinervaAbility = ability.id;
    add.textContent = "Adicionar";
    actions.append(add);
  } else {
    const edit = document.createElement("button");
    edit.className = "ability-card-action";
    edit.type = "button";
    edit.dataset.editMinervaAbility = ability.id;
    edit.textContent = "Editar";

    const remove = document.createElement("button");
    remove.className = "ability-card-action is-delete";
    remove.type = "button";
    remove.dataset.deleteMinervaAbility = ability.id;
    remove.textContent = "Excluir";
    actions.append(edit, remove);
  }

  card.append(createAbilityMediaElement(ability, "grimoire-item-media"), copy, actions);
  return card;
}

function createGrimoireInventoryItem(item) {
  const card = document.createElement("article");
  card.className = "grimoire-item";

  const icon = document.createElement("div");
  icon.className = "grimoire-item-media item-card-icon";
  icon.textContent = item.isWeapon ? "⚔" : "◇";

  const copy = document.createElement("div");
  copy.className = "grimoire-item-copy";
  const type = document.createElement("small");
  type.textContent = `${itemTypeLabel(item)} · ${formatVerdeons(item.shopPrice)} · → ${shopDestinationLabel("item", item)}`;
  const name = Object.assign(document.createElement("strong"), { textContent: item.name });
  const description = document.createElement("div");
  setCreationDescription(description, item);
  copy.append(type, name, description);

  const actions = document.createElement("div");
  actions.className = "grimoire-item-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "ability-card-action";
  open.dataset.openMinervaItem = item.id;
  open.textContent = "Abrir";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "ability-card-action";
  edit.dataset.editMinervaItem = item.id;
  edit.textContent = "Editar";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "ability-card-action is-delete";
  remove.dataset.deleteMinervaItem = item.id;
  remove.textContent = "Excluir";
  actions.append(open, edit, remove);
  card.append(icon, copy, actions);
  return card;
}

function getShopProducts() {
  return [
    ...grimoireAbilities
      .filter((ability) => ability.shopListed && ability.section !== "upgrades")
      .map((creation) => ({ kind: "ability", creation })),
    ...grimoireItems
      .filter((item) => item.shopListed)
      .map((creation) => ({ kind: "item", creation })),
  ];
}

function shopDestinationLabel(kind, creation) {
  if (kind !== "item") return `Habilidades · ${abilitySectionLabel(creation.section)}`;
  const destination = sanitizeShopDestination(creation.shopDestination);
  if (destination === "inventory") return "Inventário";
  const echo = destination === "echoes" && ECHOES[creation.shopEchoKey]
    ? ` · ${ECHOES[creation.shopEchoKey]}`
    : "";
  return `Habilidades · ${abilitySectionLabel(destination)}${echo}`;
}

function renderShop() {
  if (!shopList || !walletBalanceOutput) return;
  walletBalance = clampInteger(walletBalance, 0, 999999999, 0);
  renderVerdeonAmount(walletBalanceOutput, walletBalance);
  shopHistoryCount.textContent = String(purchaseHistory.length);

  const query = normalizeSearchTerm(shopSearchInput?.value || "");
  const products = getShopProducts()
    .filter(({ kind, creation }) => {
      const searchable = normalizeSearchTerm(
        `${creation.name} ${creation.description} ${kind === "item" ? `item inventário ${itemTypeLabel(creation)}` : abilitySectionLabel(creation.section)}`,
      );
      return !query || searchable.includes(query);
    })
    .sort((a, b) => portugueseCollator.compare(a.creation.name, b.creation.name));

  shopCount.textContent = `${products.length} ${products.length === 1 ? "produto" : "produtos"}`;
  shopList.replaceChildren();
  shopList.hidden = products.length === 0;
  shopEmpty.hidden = products.length !== 0;
  if (!products.length) {
    const title = shopEmpty.querySelector("strong");
    if (title) title.textContent = "Nenhum produto disponível";
    const message = shopEmpty.querySelector("p");
    if (message) {
      message.textContent = window.AbyssCloud?.isSignedIn()
        ? "Os produtos publicados no Grimório de Minerva aparecerão aqui."
        : "Entre com o Google e escolha um Slot para acessar a Loja.";
    }
    return;
  }

  products.forEach(({ kind, creation }) => {
    const card = document.createElement("article");
    card.className = "shop-product";
    const media = document.createElement("div");
    media.className = "shop-product-media";
    if (kind === "ability" && safeAbilityMediaUrl(creation.mediaUrl)) {
      const image = document.createElement("img");
      image.src = creation.mediaUrl;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => media.replaceChildren(document.createTextNode("✦")), { once: true });
      media.append(image);
    } else {
      media.textContent = kind === "item" ? (creation.isWeapon ? "⚔" : "◇") : "✦";
    }

    const copy = document.createElement("div");
    copy.className = "shop-product-copy";
    const destination = document.createElement("small");
    destination.textContent = shopDestinationLabel(kind, creation);
    const name = document.createElement("h3");
    name.textContent = creation.name;
    const description = document.createElement("div");
    setCreationDescription(description, creation);
    copy.append(destination, name, description);
    if (kind === "item") copy.insertBefore(createItemTypeBadge(creation), name);

    const footer = document.createElement("div");
    footer.className = "shop-product-footer";
    const price = document.createElement("span");
    price.className = "shop-price";
    renderVerdeonAmount(price, creation.shopPrice);
    const actionGroup = document.createElement("div");
    actionGroup.className = "card-mini-actions";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "card-mini-action";
    open.dataset.openShopKind = kind;
    open.dataset.openShopId = creation.id;
    open.textContent = "Abrir";
    const buy = document.createElement("button");
    buy.type = "button";
    buy.className = "shop-buy-button";
    buy.dataset.buyShopKind = kind;
    buy.dataset.buyShopId = creation.id;
    buy.textContent = "Comprar";
    buy.disabled = !window.AbyssCloud?.hasActiveSlot();
    actionGroup.append(open, buy);
    footer.append(price, actionGroup);
    card.append(media, copy, footer);
    shopList.append(card);
  });
}

function purchaseHistoryDestinationLabel(entry) {
  if (entry.kind === "item") {
    return shopDestinationLabel("item", {
      shopDestination: entry.destination,
      shopEchoKey: entry.echoKey,
    });
  }
  return `Habilidades · ${abilitySectionLabel(entry.destination)}`;
}

function formatPurchaseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function renderPurchaseHistory() {
  if (!shopHistoryList) return;
  purchaseHistory = purchaseHistory
    .map(sanitizePurchaseHistoryEntry)
    .filter(Boolean)
    .slice(0, MAX_PURCHASE_HISTORY);
  shopHistoryCount.textContent = String(purchaseHistory.length);
  shopHistoryList.replaceChildren();
  shopHistoryEmpty.hidden = purchaseHistory.length !== 0;
  shopHistoryList.hidden = purchaseHistory.length === 0;
  shopHistorySummary.textContent = purchaseHistory.length
    ? `${purchaseHistory.length} ${purchaseHistory.length === 1 ? "compra registrada" : "compras registradas"}`
    : "Nenhuma compra registrada";
  renderVerdeonAmount(
    shopHistoryTotal,
    purchaseHistory.reduce((total, entry) => total + entry.price, 0),
  );

  purchaseHistory.forEach((entry) => {
    const row = document.createElement("article");
    row.className = "shop-history-entry";
    const mark = document.createElement("span");
    mark.className = "shop-history-entry-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = entry.kind === "item" ? "◇" : "✦";
    const copy = document.createElement("div");
    copy.className = "shop-history-entry-copy";
    const name = document.createElement("strong");
    name.textContent = entry.name;
    const detail = document.createElement("small");
    const quantity = entry.quantity > 1 ? ` · ${entry.quantity} unidades` : "";
    detail.textContent = `${purchaseHistoryDestinationLabel(entry)}${quantity} · ${formatPurchaseDate(entry.purchasedAt)}`;
    copy.append(name, detail);
    const price = document.createElement("span");
    price.className = "shop-history-entry-price";
    renderVerdeonAmount(price, entry.price);
    row.append(mark, copy, price);
    shopHistoryList.append(row);
  });
}

function openPurchaseHistory(trigger = shopHistoryButton) {
  activeShopHistoryTrigger = trigger;
  renderPurchaseHistory();
  shopHistoryModal.hidden = false;
  syncModalLock();
  shopHistoryDialog.focus();
}

function closePurchaseHistory() {
  shopHistoryModal.hidden = true;
  syncModalLock();
  if (activeShopHistoryTrigger?.isConnected) activeShopHistoryTrigger.focus();
  activeShopHistoryTrigger = null;
}

async function adjustWallet(action, rawValue, trigger) {
  if (!window.AbyssCloud?.hasActiveSlot()) {
    await showAbyssAlert({
      eyebrow: "Carteira",
      title: "Escolha um Slot",
      message: "Entre com o Google e abra uma ficha antes de alterar a Carteira.",
      tone: "warning",
      trigger,
    });
    return;
  }
  const value = clampInteger(rawValue, 1, 999999999, 0);
  if (!value) return;
  if (action === "remove" && value > walletBalance) {
    await showAbyssAlert({
      eyebrow: "Carteira",
      title: "Verdeons insuficientes",
      message: `A Carteira possui ${formatVerdeons(walletBalance)} e não pode remover ${formatVerdeons(value)}.`,
      tone: "warning",
      trigger,
    });
    return;
  }
  walletBalance = clampInteger(
    action === "remove" ? walletBalance - value : walletBalance + value,
    0,
    999999999,
    0,
  );
  renderShop();
  notifySheetChanged(action === "remove" ? "wallet-removed" : "wallet-added");
}

async function purchaseShopProduct(kind, productId, trigger) {
  if (isNotebookReadOnly()) return false;
  if (!window.AbyssCloud?.hasActiveSlot()) {
    await showAbyssAlert({
      eyebrow: "Loja",
      title: "Nenhum Slot aberto",
      message: "Escolha a ficha que receberá esta compra.",
      tone: "warning",
      trigger,
    });
    return;
  }
  const source = kind === "item"
    ? grimoireItems.find((item) => item.id === productId && item.shopListed)
    : grimoireAbilities.find((ability) => ability.id === productId && ability.shopListed);
  if (!source) return;

  const itemDestination = kind === "item"
    ? sanitizeShopDestination(source.shopDestination)
    : "";
  const deliversToInventory = kind === "item" && itemDestination === "inventory";
  const deliversToAbilities = !deliversToInventory;

  if (deliversToAbilities && abilities.some((ability) => ability.sourceId === source.id)) {
    await showAbyssAlert({
      eyebrow: "Loja",
      title: "Produto já adquirido",
      message: `“${source.name}” já faz parte das Habilidades desta ficha.`,
      tone: "info",
      trigger,
    });
    return;
  }
  const stackedItem = deliversToInventory
    ? inventoryItems.find((item) => item.sourceId === source.id && !item.upgrades?.length && sanitizeItemType(item.itemType, item.isWeapon) === sanitizeItemType(source.itemType, source.isWeapon))
    : null;
  if (stackedItem && stackedItem.quantity + source.quantity > 9999) {
    await showAbyssAlert({
      eyebrow: "Loja",
      title: "Limite do Item atingido",
      message: `O Inventário não pode guardar mais de 9.999 unidades de “${source.name}”.`,
      tone: "warning",
      trigger,
    });
    return;
  }
  const price = clampInteger(source.shopPrice, 0, 999999999, 0);
  if (walletBalance < price) {
    await showAbyssAlert({
      eyebrow: "Loja",
      title: "Verdeons insuficientes",
      message: `Esta compra custa ${formatVerdeons(price)}, mas a Carteira possui ${formatVerdeons(walletBalance)}.`,
      tone: "warning",
      trigger,
    });
    return;
  }

  const confirmed = await showAbyssConfirm({
    eyebrow: "Loja",
    title: `Comprar ${source.name}?`,
    message: `${formatVerdeons(price)} serão descontados da Carteira.\n\nDestino: ${shopDestinationLabel(kind, source)}.`,
    confirmLabel: price ? "Comprar" : "Obter",
    tone: "info",
    trigger,
  });
  if (!confirmed) return;
  if (walletBalance < price) return;

  if (deliversToInventory) {
    if (stackedItem) {
      stackedItem.quantity += source.quantity;
    } else {
      inventoryItems.push(sanitizeInventoryItem({
        ...source,
        id: createAbilityId("item"),
        sourceId: source.id,
        equipped: false,
        upgrades: [],
        modifiersActive: false,
        modifiers: (source.modifiers || []).map((modifier) => ({ ...modifier, resolvedValue: 0 })),
        shopListed: false,
        shopPrice: 0,
        shopDestination: "inventory",
        shopEchoKey: "",
      }));
    }
    renderInventory();
  } else {
    const destinationSection = kind === "item" ? itemDestination : source.section;
    const deliveredAbility = sanitizeAbility({
      ...source,
      id: createAbilityId("ability"),
      section: destinationSection,
      echoKey:
        destinationSection === "echoes"
          ? kind === "item"
            ? source.shopEchoKey
            : source.echoKey
          : "",
      origin: source.origin || (kind === "item" ? "Item da Loja" : ""),
      sourceId: source.id,
      mediaOwner: kind === "ability" && source.mediaRefId ? "minerva" : "link",
      modifiersActive: false,
      modifiers: (source.modifiers || []).map((modifier) => ({ ...modifier, resolvedValue: 0 })),
      shopListed: false,
      shopPrice: 0,
    });
    if (!deliveredAbility) {
      await showAbyssAlert({
        eyebrow: "Loja",
        title: "Destino inválido",
        message: "Este produto não possui os dados necessários para ser entregue no destino escolhido.",
        tone: "warning",
        trigger,
      });
      return;
    }
    abilities.push(deliveredAbility);
    renderAbilities();
  }

  walletBalance -= price;
  const historyEntry = sanitizePurchaseHistoryEntry({
    id: createAbilityId("purchase"),
    productId: source.id,
    name: source.name,
    kind,
    destination: kind === "item" ? itemDestination : source.section,
    echoKey: kind === "item" ? source.shopEchoKey : source.echoKey,
    price,
    quantity: deliversToInventory ? source.quantity : 1,
    purchasedAt: new Date().toISOString(),
  });
  if (historyEntry) {
    purchaseHistory.unshift(historyEntry);
    purchaseHistory = purchaseHistory.slice(0, MAX_PURCHASE_HISTORY);
  }
  renderShop();
  renderPurchaseHistory();
  notifySheetChanged("shop-purchase");
  await showAbyssAlert({
    eyebrow: "Compra concluída",
    title: source.name,
    message: `O produto foi enviado para ${shopDestinationLabel(kind, source)}.`,
    tone: "info",
    trigger,
  });
  return true;
}

function grimoirePickerTypeLabel(type) {
  return ({ inventory: "Item", attacks: "Ataque", backgrounds: "Antecedência", styles: "Estilo de Luta",
    powers: "Poder", spells: "Feitiço", tricks: "Truque", echoes: "Eco", classes: "Classe", tree: "Árvore" })[type] || "Todos";
}

const GRIMOIRE_POWER_TAGS = {
  general: "Geral",
  vanguardista: "Vanguardista",
  especialista: "Especialista",
  arcanista: "Arcanista",
  umbra: "Umbra",
  lumen: "Lumen",
  caos: "Caos",
  eter: "Éter",
  ley: "Ley",
};

const GRIMOIRE_SPELL_TAGS = {
  general: GRIMOIRE_POWER_TAGS.general,
  umbra: GRIMOIRE_POWER_TAGS.umbra,
  lumen: GRIMOIRE_POWER_TAGS.lumen,
  caos: GRIMOIRE_POWER_TAGS.caos,
  eter: GRIMOIRE_POWER_TAGS.eter,
  ley: GRIMOIRE_POWER_TAGS.ley,
};

const GRIMOIRE_ECHO_TAGS = {
  determinado: "O Determinado",
  justo: "O Justiceiro",
  bondoso: "O Bondoso",
  paciente: "O Paciente",
  integro: "O Íntegro",
  bravo: "O Bravo",
  perseverante: "O Perseverante",
};

function getGrimoirePickerTagLabels(type) {
  if (type === "powers") return GRIMOIRE_POWER_TAGS;
  if (type === "spells") return GRIMOIRE_SPELL_TAGS;
  if (type === "echoes") return GRIMOIRE_ECHO_TAGS;
  return null;
}

const GRIMOIRE_POWER_TAG_IMAGES = {
  umbra: "assets/images/umbra.png",
  lumen: "assets/images/lumen.png",
  caos: "assets/images/caos.png",
  eter: "assets/images/eter.png",
  ley: "assets/images/ley.png",
};

function grimoirePickerCategory(creation, type) {
  if (type === "inventory") {
    const itemType = sanitizeItemType(creation.itemType, creation.isWeapon);
    return { key: itemType, label: ITEM_TYPES[itemType] };
  }
  if (type === "echoes") return { key: creation.echoKey, label: GRIMOIRE_ECHO_TAGS[creation.echoKey] || "Outros Ecos" };
  const origin = String(creation.origin || "").trim();
  const normalized = normalizeSearchTerm(origin);
  const tagLabels = getGrimoirePickerTagLabels(type);
  if (tagLabels) {
    const matches = Object.entries(tagLabels).find(([key, label]) => key !== "general"
      && new RegExp("\\b" + normalizeSearchTerm(label) + "\\b").test(normalized));
    const key = matches?.[0] || "general";
    return { key, label: tagLabels[key] };
  }
  return origin ? { key: "origin:" + normalized, label: origin } : { key: "general", label: "Geral" };
}

function getGrimoirePickerEntries() {
  return [
    ...grimoireAbilities.filter((ability) => !ability.shopListed && !["upgrades", "classes"].includes(ability.section))
      .map((creation) => ({ kind: "ability", type: creation.section, creation, category: grimoirePickerCategory(creation, creation.section) })),
    ...grimoireItems.filter((item) => item.shopListed)
      .map((creation) => ({ kind: "item", type: "inventory", creation, category: grimoirePickerCategory(creation, "inventory") })),
  ];
}

function getGrimoirePickerCategories(type, entries) {
  const fixed = type === "inventory" ? Object.entries(ITEM_TYPES)
    : getGrimoirePickerTagLabels(type) ? Object.entries(getGrimoirePickerTagLabels(type))
    : [];
  const categories = new Map(fixed.map(([key, label]) => [key, { key, label, count: 0 }]));
  entries.filter((entry) => entry.type === type).forEach((entry) => {
    if (!categories.has(entry.category.key)) categories.set(entry.category.key, { ...entry.category, count: 0 });
    categories.get(entry.category.key).count += 1;
  });
  return getGrimoirePickerTagLabels(type) ? [...categories.values()]
    : [...categories.values()].sort((a, b) => portugueseCollator.compare(a.label, b.label));
}

function createGrimoirePickerItem(item) {
  const card = createGrimoireInventoryItem(item);
  const actions = card.querySelector(".grimoire-item-actions");
  const open = document.createElement("button");
  open.type = "button";
  open.className = "ability-card-action";
  open.dataset.openMinervaItem = item.id;
  open.textContent = "Abrir";
  const buy = document.createElement("button");
  buy.type = "button";
  buy.className = "ability-card-action";
  buy.dataset.buyShopKind = "item";
  buy.dataset.buyShopId = item.id;
  buy.textContent = "Comprar";
  buy.disabled = !window.AbyssCloud?.hasActiveSlot();
  actions.replaceChildren(open, buy);
  return card;
}

function createGrimoirePowerTag(category) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "grimoire-power-tag";
  button.dataset.grimoirePowerTag = category.key;
  button.dataset.grimoireTag = category.key;
  const isSelected = activeGrimoirePickerCategory === category.key;
  button.setAttribute("aria-pressed", String(isSelected));
  const isSpell = activeGrimoirePickerType === "spells";
  const isEcho = activeGrimoirePickerType === "echoes";
  const singular = isEcho ? "eco" : isSpell ? "feitiço" : "poder";
  const plural = isEcho ? "ecos" : isSpell ? "feitiços" : "poderes";
  button.setAttribute("aria-label", category.label + ", " + category.count + " " + (category.count === 1 ? singular : plural));
  button.title = isSelected ? "Clique novamente para ver todos os " + plural : "Filtrar por " + category.label;
  const imageSource = GRIMOIRE_POWER_TAG_IMAGES[category.key];
  if (imageSource) {
    const image = document.createElement("img");
    image.src = imageSource;
    image.alt = "";
    image.width = 44;
    image.height = 48;
    image.draggable = false;
    image.decoding = "async";
    button.append(image);
  }
  const copy = document.createElement("span");
  copy.className = "grimoire-power-tag-copy";
  copy.append(Object.assign(document.createElement("strong"), { textContent: category.label }),
    Object.assign(document.createElement("small"), { textContent: category.count + " " + (category.count === 1 ? singular : plural) }));
  button.append(copy);
  return button;
}

function selectGrimoirePickerPowerTag(key) {
  const tagLabels = getGrimoirePickerTagLabels(activeGrimoirePickerType);
  if (!tagLabels || !Object.hasOwn(tagLabels, key)) return;
  activeGrimoirePickerCategory = activeGrimoirePickerCategory === key ? "" : key;
  renderGrimoirePicker();
  grimoirePickerPowerTags.querySelector('[data-grimoire-power-tag="' + key + '"]')?.focus({ preventScroll: true });
}

function grimoirePickerEntryKey(entry) {
  return `${entry.kind}:${entry.creation.id}`;
}

function createGrimoireCategoryTag(entry) {
  const tag = document.createElement("span");
  tag.className = "grimoire-category-tag";
  tag.textContent = entry.category.label;
  const labels = getGrimoirePickerTagLabels(entry.type);
  if (labels && Object.hasOwn(labels, entry.category.key)) tag.dataset.grimoireTag = entry.category.key;
  return tag;
}

function setGrimoirePickerFeedback(message = "", error = false) {
  grimoirePickerFeedback.textContent = message;
  grimoirePickerFeedback.hidden = !message;
  grimoirePickerFeedback.classList.toggle("is-error", error);
}

function createGrimoirePickerSymbol(entry = null) {
  const symbol = document.createElement("span");
  symbol.className = "grimoire-picker-symbol";
  symbol.setAttribute("aria-hidden", "true");
  const category = entry ? grimoirePickerCategory(entry.creation, entry.type === "spells" ? "spells" : "powers") : null;
  const source = category && GRIMOIRE_POWER_TAG_IMAGES[category.key];
  if (source) {
    symbol.dataset.entity = category.key;
    const image = document.createElement("img");
    image.src = source;
    image.alt = "";
    image.draggable = false;
    image.decoding = "async";
    symbol.append(image);
  } else if (entry && safeAbilityMediaUrl(entry.creation.mediaUrl)) {
    const image = document.createElement("img");
    image.src = safeAbilityMediaUrl(entry.creation.mediaUrl);
    image.alt = "";
    image.draggable = false;
    image.loading = "lazy";
    image.addEventListener("error", () => { symbol.replaceChildren(); symbol.innerHTML = '<svg viewBox="0 0 24 24"><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"></path></svg>'; }, { once: true });
    symbol.append(image);
  } else {
    const drawing = entry?.kind === "item"
      ? '<path d="m4 7 8-4 8 4v10l-8 4-8-4Z M4 7l8 4 8-4 M12 11v10"></path>'
      : '<path d="M12 5v15M12 5C8 3 5 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1ZM5 8l4 1M5 12l4 1M15 8l4-1M15 12l4-1"></path>';
    symbol.innerHTML = `<svg viewBox="0 0 24 24">${drawing}</svg>`;
  }
  return symbol;
}

function createGrimoirePickerChoice(entry, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "grimoire-picker-choice";
  button.dataset.selectGrimoireEntry = grimoirePickerEntryKey(entry);
  button.id = `grimoire-picker-option-${index}`;
  button.setAttribute("role", "option");
  button.setAttribute("aria-controls", "grimoire-picker-preview");
  const selected = button.dataset.selectGrimoireEntry === activeGrimoirePickerEntryKey;
  button.setAttribute("aria-selected", String(selected));
  button.tabIndex = selected || (!activeGrimoirePickerEntryKey && index === 0) ? 0 : -1;
  const copy = document.createElement("span");
  copy.className = "grimoire-picker-choice-copy";
  const details = document.createElement("small");
  if (getGrimoirePickerTagLabels(entry.type)) {
    details.className = "grimoire-picker-choice-meta";
    details.append(document.createTextNode(grimoirePickerTypeLabel(entry.type)), createGrimoireCategoryTag(entry));
  } else {
    details.textContent = `${grimoirePickerTypeLabel(entry.type)} · ${entry.category.label}${entry.kind === "item" ? ` · ${formatVerdeons(entry.creation.shopPrice)}` : ""}`;
  }
  copy.append(Object.assign(document.createElement("strong"), { textContent: entry.creation.name }), details);
  const arrow = document.createElement("span");
  arrow.className = "grimoire-picker-choice-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"></path></svg>';
  button.append(createGrimoirePickerSymbol(entry), copy, arrow);
  return button;
}

function renderGrimoirePickerPreview() {
  grimoirePickerPreview.replaceChildren();
  grimoirePickerActions.replaceChildren();
  const entry = visibleGrimoirePickerEntries.find((item) => grimoirePickerEntryKey(item) === activeGrimoirePickerEntryKey);
  if (!entry) {
    const intro = document.createElement("div");
    intro.className = "grimoire-picker-preview-intro";
    intro.append(createGrimoirePickerSymbol(),
      Object.assign(document.createElement("h3"), { textContent: "Selecione um conhecimento" }),
      Object.assign(document.createElement("p"), { textContent: "Escolha um título na lista para conhecer sua descrição, fórmulas e efeitos antes de adicioná-lo à ficha." }));
    grimoirePickerPreview.append(intro);
    return;
  }
  const creation = entry.creation;
  const header = document.createElement("header");
  header.className = "grimoire-picker-preview-head";
  const copy = document.createElement("div");
  const tags = document.createElement("div");
  tags.className = "grimoire-picker-preview-tags";
  tags.append(Object.assign(document.createElement("span"), { textContent: grimoirePickerTypeLabel(entry.type) }),
    createGrimoireCategoryTag(entry));
  const name = Object.assign(document.createElement("h3"), { textContent: creation.name, id: "grimoire-picker-selection-name" });
  const origin = document.createElement("p");
  origin.className = "grimoire-picker-preview-origin";
  origin.textContent = entry.kind === "item"
    ? `${formatVerdeons(creation.shopPrice)} · Quantidade ${creation.quantity || 1} · Destino: ${shopDestinationLabel("item", creation)}`
    : abilityOriginLabel(creation, "minerva");
  copy.append(tags, name, origin);
  header.append(copy, createGrimoirePickerSymbol(entry));
  const descriptionSection = document.createElement("section");
  descriptionSection.className = "grimoire-picker-preview-description";
  descriptionSection.append(Object.assign(document.createElement("h4"), { textContent: "Descrição" }));
  const description = document.createElement("div");
  description.className = "grimoire-picker-description creation-rich-description";
  setCreationDescription(description, creation);
  descriptionSection.append(description);
  const mechanics = document.createElement("div");
  mechanics.className = "creation-detail-mechanics";
  renderCreationDetailMechanics(creation, entry.kind === "item" ? "minerva-item" : "minerva", mechanics);
  grimoirePickerPreview.append(header, descriptionSection, mechanics);
  const action = document.createElement("button");
  action.type = "button";
  action.className = "grimoire-picker-primary-action";
  action.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>';
  if (entry.kind === "item") {
    action.dataset.buyShopKind = "item";
    action.dataset.buyShopId = creation.id;
    action.append(document.createTextNode(`Comprar · ${formatVerdeons(creation.shopPrice)}`));
  } else {
    action.dataset.importMinervaAbility = creation.id;
    action.append(document.createTextNode("Adicionar à ficha"));
  }
  action.disabled = grimoirePickerActionPending || !window.AbyssCloud?.hasActiveSlot() || isNotebookReadOnly();
  if (!window.AbyssCloud?.hasActiveSlot()) action.title = "Abra a ficha que receberá este conhecimento.";
  else if (isNotebookReadOnly()) action.title = "Esta ficha está aberta apenas para consulta.";
  grimoirePickerActions.append(action);
}

function selectGrimoirePickerEntry(key, focus = false) {
  if (!visibleGrimoirePickerEntries.some((entry) => grimoirePickerEntryKey(entry) === key)) return;
  const changed = activeGrimoirePickerEntryKey !== key;
  activeGrimoirePickerEntryKey = key;
  if (changed) setGrimoirePickerFeedback();
  const buttons = [...grimoirePickerList.querySelectorAll("[data-select-grimoire-entry]")];
  buttons.forEach((button) => {
    const selected = button.dataset.selectGrimoireEntry === key;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) {
      button.focus({ preventScroll: true });
      button.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
  renderGrimoirePickerPreview();
  if (changed) grimoirePickerPreview.scrollTop = 0;
}

async function handleGrimoirePickerAction(event) {
  const button = event.target.closest("[data-import-minerva-ability], [data-buy-shop-id]");
  if (!button || button.disabled || grimoirePickerActionPending || !window.AbyssCloud?.hasActiveSlot() || isNotebookReadOnly()) return;
  const key = activeGrimoirePickerEntryKey;
  const session = grimoirePickerSession;
  grimoirePickerActionPending = true;
  button.disabled = true;
  try {
    const succeeded = button.dataset.buyShopId
      ? await purchaseShopProduct(button.dataset.buyShopKind, button.dataset.buyShopId, button)
      : importMinervaAbility(button.dataset.importMinervaAbility, true);
    if (succeeded && session === grimoirePickerSession && !grimoirePickerModal.hidden && activeGrimoirePickerEntryKey === key) {
      const entry = visibleGrimoirePickerEntries.find((item) => grimoirePickerEntryKey(item) === key);
      if (entry) setGrimoirePickerFeedback(`“${entry.creation.name}” ${entry.kind === "item" ? "comprado e enviado" : "adicionado"} à ficha.`);
    }
  } catch (error) {
    if (session === grimoirePickerSession && !grimoirePickerModal.hidden && activeGrimoirePickerEntryKey === key) {
      setGrimoirePickerFeedback(error?.message || "Não foi possível adicionar este conhecimento. Tente novamente.", true);
    }
  } finally {
    grimoirePickerActionPending = false;
    if (session === grimoirePickerSession && !grimoirePickerModal.hidden) {
      renderGrimoirePickerPreview();
      const current = grimoirePickerActions.querySelector("button");
      if (activeGrimoirePickerEntryKey === key && current && !current.disabled) current.focus({ preventScroll: true });
    }
  }
}


function renderGrimoirePicker() {
  const entries = getGrimoirePickerEntries();
  const types = ["", "inventory", ...Object.keys(ABILITY_SECTIONS).filter((type) => !["upgrades", "classes"].includes(type))];
  grimoirePickerTypes.replaceChildren(...types.map((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.grimoirePickerType = type;
    button.setAttribute("aria-pressed", String(type === activeGrimoirePickerType));
    const count = entries.filter((entry) => !type || entry.type === type).length;
    button.append(document.createTextNode(grimoirePickerTypeLabel(type)),
      Object.assign(document.createElement("small"), { textContent: String(count) }));
    return button;
  }));
  const categories = getGrimoirePickerCategories(activeGrimoirePickerType, entries);
  if (!categories.some((category) => category.key === activeGrimoirePickerCategory)) activeGrimoirePickerCategory = "";
  const isTaggedType = Boolean(getGrimoirePickerTagLabels(activeGrimoirePickerType));
  const taggedTypeName = activeGrimoirePickerType === "echoes" ? "Ecos" : activeGrimoirePickerType === "spells" ? "Feitiços" : "Poderes";
  grimoirePickerCategoryField.hidden = !activeGrimoirePickerType || isTaggedType;
  grimoirePickerPowerTagsField.hidden = !isTaggedType;
  grimoirePickerPowerTags.setAttribute("aria-label", "Tags dos " + taggedTypeName);
  document.querySelector("#grimoire-picker-power-tags-help").textContent = "Selecione uma tag para filtrar. Clique nela novamente para ver todos os " + taggedTypeName.toLowerCase() + ".";
  grimoirePickerPowerTags.replaceChildren(...(isTaggedType ? categories.map(createGrimoirePowerTag) : []));
  grimoirePickerCategorySelect.replaceChildren(
    Object.assign(document.createElement("option"), { value: "", textContent: "Todas as categorias" }),
    ...categories.map((category) => Object.assign(document.createElement("option"), {
      value: category.key, textContent: `${category.label} (${category.count})`,
    })),
  );
  grimoirePickerCategorySelect.value = activeGrimoirePickerCategory;
  const query = normalizeSearchTerm(grimoireSearchInput.value);
  visibleGrimoirePickerEntries = entries.filter((entry) => {
    if (activeGrimoirePickerType && entry.type !== activeGrimoirePickerType) return false;
    if (activeGrimoirePickerCategory && entry.category.key !== activeGrimoirePickerCategory) return false;
    const creation = entry.creation;
    const searchable = normalizeSearchTerm(`${creation.name} ${creation.description} ${creation.damage || ""} ${creation.origin || ""} ${grimoirePickerTypeLabel(entry.type)} ${entry.category.label}`);
    return !query || searchable.includes(query);
  }).sort((a, b) => types.indexOf(a.type) - types.indexOf(b.type)
    || portugueseCollator.compare(a.category.label, b.category.label)
    || portugueseCollator.compare(a.creation.name, b.creation.name));
  if (!visibleGrimoirePickerEntries.some((entry) => grimoirePickerEntryKey(entry) === activeGrimoirePickerEntryKey)) {
    activeGrimoirePickerEntryKey = "";
    setGrimoirePickerFeedback();
  }
  if (isTaggedType) {
    grimoirePickerList.replaceChildren(...visibleGrimoirePickerEntries.map(createGrimoirePickerChoice));
  } else {
    const groups = new Map();
    visibleGrimoirePickerEntries.forEach((entry, index) => {
      const key = `${entry.type}:${entry.category.key}`;
      if (!groups.has(key)) groups.set(key, { entry, entries: [] });
      groups.get(key).entries.push({ entry, index });
    });
    grimoirePickerList.replaceChildren(...[...groups.values()].map((group) => {
      const section = document.createElement("div");
      section.className = "grimoire-picker-group";
      section.setAttribute("role", "group");
      const label = `${grimoirePickerTypeLabel(group.entry.type)} · ${group.entry.category.label}`;
      section.setAttribute("aria-label", label);
      if (!getGrimoirePickerTagLabels(group.entry.type)) {
        const heading = document.createElement("div");
        heading.className = "grimoire-picker-group-title";
        heading.setAttribute("aria-hidden", "true");
        heading.append(document.createTextNode(label), Object.assign(document.createElement("small"), {
          textContent: String(group.entries.length),
        }));
        section.append(heading);
      }
      section.append(...group.entries.map(({ entry, index }) => createGrimoirePickerChoice(entry, index)));
      return section;
    }));
  }
  const count = visibleGrimoirePickerEntries.length;
  grimoirePickerSummary.textContent = `${count} ${count === 1 ? "resultado" : "resultados"}`;
  grimoirePickerList.hidden = count === 0;
  grimoirePickerEmpty.textContent = query
    ? "Nenhum resultado nesta seleção. Tente outro termo, tipo ou categoria."
    : "Nenhuma opção disponível nesta categoria. Escolha outro tipo ou categoria.";
  grimoirePickerEmpty.hidden = count !== 0;
  renderGrimoirePickerPreview();
}


function getMinervaCatalogEntries() {
  const query = normalizeSearchTerm(minervaSearchInput.value);
  const showingItems = activeMinervaSection === "inventory";
  const showingUpgrades = activeMinervaSection === "upgrades";
  const collection = showingItems ? grimoireItems : grimoireAbilities.filter((creation) =>
    creation.section === activeMinervaSection
    && (!showingUpgrades || !minervaUpgradeFilter.value || creation.upgradeType === minervaUpgradeFilter.value));
  return collection.map((creation) => ({
    kind: showingItems ? "item" : "ability",
    type: activeMinervaSection,
    creation,
    category: showingUpgrades
      ? { key: creation.upgradeType, label: upgradeTypeLabel(creation.upgradeType) }
      : grimoirePickerCategory(creation, activeMinervaSection),
  })).filter((entry) => !query || normalizeSearchTerm(`${entry.creation.name} ${entry.creation.description || ""} ${entry.creation.origin || ""} ${entry.category.label} ${entry.creation.damage || ""}`)
    .includes(query)).sort((a, b) => portugueseCollator.compare(a.creation.name, b.creation.name));
}

function createMinervaCatalogChoice(entry, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "grimoire-picker-choice";
  button.dataset.selectMinervaEntry = grimoirePickerEntryKey(entry);
  button.id = `minerva-catalog-option-${index}`;
  button.setAttribute("role", "option");
  button.setAttribute("aria-controls", "minerva-preview");
  const selected = button.dataset.selectMinervaEntry === activeMinervaEntryKey;
  button.setAttribute("aria-selected", String(selected));
  button.tabIndex = selected || (!activeMinervaEntryKey && index === 0) ? 0 : -1;
  const copy = document.createElement("span");
  copy.className = "grimoire-picker-choice-copy";
  copy.append(Object.assign(document.createElement("strong"), { textContent: entry.creation.name }),
    Object.assign(document.createElement("small"), {
      textContent: `${entry.category.label} · ${entry.creation.shopListed ? `Loja: ${formatVerdeons(entry.creation.shopPrice)}` : "Fora da Loja"}`,
    }));
  const arrow = document.createElement("span");
  arrow.className = "grimoire-picker-choice-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"></path></svg>';
  button.append(createGrimoirePickerSymbol(entry), copy, arrow);
  return button;
}

function renderMinervaPreview() {
  minervaPreview.replaceChildren();
  minervaActions.replaceChildren();
  const entry = visibleMinervaEntries.find((candidate) => grimoirePickerEntryKey(candidate) === activeMinervaEntryKey);
  if (!entry) {
    const intro = document.createElement("div");
    intro.className = "grimoire-picker-preview-intro";
    intro.append(createGrimoirePickerSymbol(),
      Object.assign(document.createElement("h3"), { textContent: "Seu acervo de criações" }),
      Object.assign(document.createElement("p"), { textContent: "Escolha um título para revisar sua descrição e mecânicas. Use Nova criação para ampliar o Grimório." }));
    minervaPreview.append(intro);
    return;
  }
  const creation = entry.creation;
  const header = document.createElement("header");
  header.className = "grimoire-picker-preview-head";
  const copy = document.createElement("div");
  const tags = document.createElement("div");
  tags.className = "grimoire-picker-preview-tags";
  tags.append(Object.assign(document.createElement("span"), { textContent: entry.type === "upgrades" ? "Melhoria" : grimoirePickerTypeLabel(entry.type) }),
    createGrimoireCategoryTag(entry));
  const name = Object.assign(document.createElement("h3"), { textContent: creation.name, id: "minerva-selection-name" });
  const origin = document.createElement("p");
  origin.className = "grimoire-picker-preview-origin";
  origin.textContent = entry.kind === "item"
    ? `${formatVerdeons(creation.shopPrice)} · Quantidade ${creation.quantity || 1} · Destino: ${shopDestinationLabel("item", creation)}`
    : `${abilityOriginLabel(creation, "minerva")}${creation.shopListed ? ` · Loja: ${formatVerdeons(creation.shopPrice)}` : " · Fora da Loja"}`;
  copy.append(tags, name, origin);
  header.append(copy, createGrimoirePickerSymbol(entry));
  const descriptionSection = document.createElement("section");
  descriptionSection.className = "grimoire-picker-preview-description";
  descriptionSection.append(Object.assign(document.createElement("h4"), { textContent: "Descrição" }));
  const description = document.createElement("div");
  description.className = "grimoire-picker-description creation-rich-description";
  setCreationDescription(description, creation);
  descriptionSection.append(description);
  const mechanics = document.createElement("div");
  mechanics.className = "creation-detail-mechanics";
  renderCreationDetailMechanics(creation, entry.kind === "item" ? "minerva-item" : "minerva", mechanics);
  minervaPreview.append(header, descriptionSection, mechanics);
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "grimoire-picker-primary-action";
  edit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z"></path></svg>';
  edit.append(document.createTextNode("Editar criação"));
  edit.dataset[entry.kind === "item" ? "editMinervaItem" : "editMinervaAbility"] = creation.id;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "ability-card-action is-delete";
  remove.textContent = "Excluir";
  remove.dataset[entry.kind === "item" ? "deleteMinervaItem" : "deleteMinervaAbility"] = creation.id;
  const canEdit = Boolean(window.AbyssCloud?.isMinervaAdmin());
  edit.disabled = !canEdit;
  remove.disabled = !canEdit;
  minervaActions.append(edit, remove);
}

function selectMinervaEntry(key, focusChoice = false) {
  if (!visibleMinervaEntries.some((entry) => grimoirePickerEntryKey(entry) === key)) return;
  activeMinervaEntryKey = key;
  minervaList.querySelectorAll("[data-select-minerva-entry]").forEach((choice) => {
    const selected = choice.dataset.selectMinervaEntry === key;
    choice.setAttribute("aria-selected", String(selected));
    choice.tabIndex = selected ? 0 : -1;
    if (selected && focusChoice) {
      choice.focus({ preventScroll: true });
      choice.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
  renderMinervaPreview();
  minervaPreview.scrollTop = 0;
}

function renderMinervaList() {
  const focused = document.activeElement;
  const focusWasInList = !minervaModal.hidden && minervaList.contains(focused);
  const focusedAction = !minervaModal.hidden && minervaActions.contains(focused)
    ? ["editMinervaAbility", "deleteMinervaAbility", "editMinervaItem", "deleteMinervaItem"].find((key) => focused.dataset[key])
    : "";
  const showingItems = activeMinervaSection === "inventory";
  const showingUpgrades = activeMinervaSection === "upgrades";
  document.querySelector("#minerva-upgrade-filter-row").hidden = !showingUpgrades;
  visibleMinervaEntries = getMinervaCatalogEntries();
  if (!visibleMinervaEntries.some((entry) => grimoirePickerEntryKey(entry) === activeMinervaEntryKey)) activeMinervaEntryKey = "";
  minervaList.replaceChildren(...visibleMinervaEntries.map(createMinervaCatalogChoice));
  const count = visibleMinervaEntries.length;
  minervaCount.textContent = `${count} ${count === 1 ? "criação" : "criações"}`;
  minervaList.hidden = count === 0;
  minervaEmpty.textContent = minervaSearchInput.value.trim()
    ? "Nenhuma criação encontrada. Tente outro nome ou termo."
    : showingItems ? "Nenhum item neste acervo. Crie seu primeiro produto."
    : showingUpgrades ? "Nenhuma melhoria neste tipo. Crie uma nova melhoria."
    : `Nenhuma criação em ${abilitySectionLabel(activeMinervaSection)}. Use Nova criação para começar.`;
  minervaEmpty.hidden = count !== 0;
  const createButton = document.querySelector("#create-minerva-ability");
  const createLabel = createButton.querySelector("span");
  if (createLabel) createLabel.textContent = showingItems ? "Novo Item" : showingUpgrades ? "Nova Melhoria" : "Nova Habilidade";
  createButton.setAttribute("aria-label", createLabel?.textContent || "Nova criação");
  createButton.disabled = !window.AbyssCloud?.isMinervaAdmin();
  renderMinervaPreview();
  if (focusWasInList || focusedAction) {
    const choice = [...minervaList.querySelectorAll("[data-select-minerva-entry]")].find((node) => node.dataset.selectMinervaEntry === activeMinervaEntryKey)
      || minervaList.querySelector("[data-select-minerva-entry]");
    const action = focusedAction && [...minervaActions.children].find((node) => node.dataset[focusedAction]);
    (action || choice || createButton).focus({ preventScroll: true });
  }
}

function restoreMinervaEditorFocus() {
  if (minervaModal.hidden || !window.AbyssCloud?.isMinervaAdmin()
    || !abilityEditorModal.hidden || !itemEditorModal.hidden) return;
  const edit = minervaActions.querySelector("[data-edit-minerva-ability]")
    || minervaActions.querySelector("[data-edit-minerva-item]");
  const choice = [...minervaList.querySelectorAll("[data-select-minerva-entry]")].find((node) => node.dataset.selectMinervaEntry === activeMinervaEntryKey);
  (edit || choice || document.querySelector("#create-minerva-ability")).focus({ preventScroll: true });
}

function renderGrimoireCollections() {
  renderGrimoirePicker();
  renderMinervaList();
  renderShop();
}

function selectMinervaSection(sectionKey) {
  if (!ABILITY_SECTIONS[sectionKey] && sectionKey !== "inventory") return;
  if (activeMinervaSection !== sectionKey) activeMinervaEntryKey = "";
  activeMinervaSection = sectionKey;
  let activeButton = null;
  minervaSectionButtons.forEach((button) => {
    const selected = button.dataset.minervaSection === sectionKey;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    if (selected) activeButton = button;
  });
  renderMinervaList();
  minervaPreview.scrollTop = 0;
  if (activeButton && window.matchMedia("(max-width: 760px)").matches) {
    requestAnimationFrame(() => activeButton.scrollIntoView({ block: "nearest", inline: "center" }));
  }
}

async function refreshGrimoireFromCloud() {
  if (!window.AbyssCloud?.loadGrimoire) {
    throw new Error("A conexão ainda não terminou de carregar.");
  }

  const loaded = await window.AbyssCloud.loadGrimoire();
  const abilityEntries = Array.isArray(loaded) ? loaded : loaded.abilities;
  const itemEntries = Array.isArray(loaded) ? [] : loaded.items;
  grimoireAbilities = (Array.isArray(abilityEntries) ? abilityEntries : []).map(sanitizeAbility).filter(Boolean);
  grimoireItems = (Array.isArray(itemEntries) ? itemEntries : []).map(sanitizeInventoryItem).filter(Boolean);
  renderGrimoireCollections();
}

async function openGrimoirePicker() {
  if (!window.AbyssCloud?.isSignedIn()) {
    setAccountMenuOpen(true);
    window.dispatchEvent(new CustomEvent("abyss:firebase-login"));
    return;
  }
  const session = ++grimoirePickerSession;
  if (lastGrimoirePickerSection !== activeAbilitySection) {
    activeGrimoirePickerType = activeAbilitySection === "upgrades" ? "inventory" : activeAbilitySection;
    activeGrimoirePickerCategory = "";
    grimoireSearchInput.value = "";
    lastGrimoirePickerSection = activeAbilitySection;
  }
  activeGrimoirePickerEntryKey = "";
  setGrimoirePickerFeedback();
  renderGrimoirePicker();
  grimoirePickerModal.hidden = false;
  grimoirePickerList.setAttribute("aria-busy", "true");
  syncModalLock();
  grimoireSearchInput.focus({ preventScroll: true });
  try {
    await refreshGrimoireFromCloud();
  } catch {
    if (session !== grimoirePickerSession || grimoirePickerModal.hidden) return;
    visibleGrimoirePickerEntries = [];
    activeGrimoirePickerEntryKey = "";
    grimoirePickerList.replaceChildren();
    grimoirePickerList.hidden = true;
    grimoirePickerSummary.textContent = "";
    grimoirePickerEmpty.textContent = "Não foi possível abrir o Grimório. Verifique sua conexão e tente novamente.";
    grimoirePickerEmpty.hidden = false;
    renderGrimoirePickerPreview();
  } finally {
    if (session === grimoirePickerSession) grimoirePickerList.removeAttribute("aria-busy");
  }
}

function closeGrimoirePicker() {
  grimoirePickerSession += 1;
  grimoirePickerModal.hidden = true;
  grimoirePickerList.removeAttribute("aria-busy");
  syncModalLock();
  if (openGrimoirePickerButton.isConnected) openGrimoirePickerButton.focus();
}

function importMinervaAbility(abilityId, keepPickerOpen = false) {
  if (!window.AbyssCloud?.hasActiveSlot() || isNotebookReadOnly()) return false;
  const source = grimoireAbilities.find((item) => item.id === abilityId);
  if (!source || source.shopListed || source.section === "upgrades") return;

  abilities.push(
    sanitizeAbility({
      ...source,
      id: createAbilityId("ability"),
      section: source.section,
      sourceId: source.id,
      mediaOwner: source.mediaRefId ? "minerva" : "link",
      modifiersActive: false,
      modifiers: (source.modifiers || []).map((modifier) => ({ ...modifier, resolvedValue: 0 })),
      shopListed: false,
      shopPrice: 0,
    }),
  );
  selectAbilitySection(source.section);
  if (!keepPickerOpen) closeGrimoirePicker();
  notifySheetChanged("ability-imported");
  return true;
}

async function openMinervaGrimoire() {
  if (!window.AbyssCloud?.isMinervaAdmin()) return;
  const epoch = ++minervaLoadEpoch;
  minervaSearchInput.value = "";
  activeMinervaEntryKey = "";
  minervaModal.hidden = false;
  renderMinervaList();
  minervaList.setAttribute("aria-busy", "true");
  syncModalLock();
  minervaSearchInput.focus();
  try {
    await refreshGrimoireFromCloud();
  } catch {
    if (epoch !== minervaLoadEpoch || minervaModal.hidden) return;
    visibleMinervaEntries = [];
    activeMinervaEntryKey = "";
    minervaList.replaceChildren();
    minervaList.hidden = true;
    minervaCount.textContent = "0 criações";
    minervaEmpty.textContent = "Não foi possível abrir o Grimório. Verifique sua conexão e tente novamente.";
    minervaEmpty.hidden = false;
    renderMinervaPreview();
  } finally {
    if (epoch === minervaLoadEpoch) minervaList.removeAttribute("aria-busy");
  }
}

function closeMinervaGrimoire() {
  ++minervaLoadEpoch;
  minervaModal.hidden = true;
  syncModalLock();
  if (minervaButton.isConnected) minervaButton.focus();
}

function openSlotsManager() {
  slotsModal.hidden = false;
  syncModalLock();
  slotsDialog.focus();
  window.AbyssCloud?.openSlotFolders();
}

function closeSlotsManager() {
  slotsModal.hidden = true;
  syncModalLock();
  if (slotsButton.isConnected) slotsButton.focus();
}

function openRdManager() {
  rdModal.hidden = false;
  rdManagerButton.setAttribute("aria-expanded", "true");
  syncModalLock();
  rdDialog.focus();
}

function closeRdManager() {
  rdModal.hidden = true;
  rdManagerButton.setAttribute("aria-expanded", "false");
  syncModalLock();
  rdManagerButton.focus();
}

function openThemeEditor() {
  if (!themeModal.hidden) { closeThemeEditor(); return; }
  renderThemeFields();
  themeModal.hidden = false;
  themeButton.setAttribute("aria-expanded", "true");
  positionThemePopover();
  themeDialog.focus({ preventScroll: true });
}

function closeThemeEditor({ restoreFocus = true } = {}) {
  releaseThemeWheelPointer();
  closeThemeTargetPicker();
  themeModal.hidden = true;
  themeButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && themeButton.isConnected) themeButton.focus({ preventScroll: true });
}

function closeSystemPrompt(result = false) {
  if (systemPromptModal.hidden && !systemPromptResolver) return;
  systemPromptModal.hidden = true;
  const resolver = systemPromptResolver;
  const trigger = systemPromptTrigger;
  systemPromptResolver = null;
  systemPromptTrigger = null;
  syncModalLock();
  if (resolver) resolver(Boolean(result));
  if (trigger?.isConnected) trigger.focus();
}

function showSystemPrompt(options = {}) {
  if (systemPromptResolver) closeSystemPrompt(false);
  const {
    eyebrow = "Abyss RPG",
    title = "Confirmar ação",
    message = "",
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    tone = "info",
    alertOnly = false,
    trigger = document.activeElement,
  } = options;

  systemPromptTrigger = trigger instanceof HTMLElement ? trigger : null;
  systemPromptEyebrow.textContent = eyebrow;
  systemPromptTitle.textContent = title;
  systemPromptMessage.textContent = message;
  systemPromptConfirm.textContent = confirmLabel;
  systemPromptCancel.textContent = cancelLabel;
  systemPromptCancel.hidden = alertOnly;
  systemPromptMark.textContent = tone === "danger" ? "!" : tone === "warning" ? "◆" : "✦";
  systemPromptDialog.classList.remove("is-danger", "is-warning", "is-info");
  systemPromptDialog.classList.add(`is-${["danger", "warning", "info"].includes(tone) ? tone : "info"}`);
  systemPromptModal.hidden = false;
  syncModalLock();

  const response = new Promise((resolve) => {
    systemPromptResolver = resolve;
  });
  requestAnimationFrame(() => systemPromptConfirm.focus());
  return response;
}

function showAbyssConfirm(options = {}) {
  return showSystemPrompt(options);
}

function showAbyssAlert(options = {}) {
  return showSystemPrompt({
    ...options,
    alertOnly: true,
    confirmLabel: options.confirmLabel || "Entendi",
  });
}

window.showAbyssConfirm = showAbyssConfirm;
window.showAbyssAlert = showAbyssAlert;

function syncModalLock() {
  const hasOpenModal = [
    rollModal,
    skillInfoModal,
    constellationModal,
    featureDetailModal,
    customSkillModal,
    deleteSkillModal,
    trainingLimitModal,
    photoEditorModal,
    abilityEditorModal,
    itemEditorModal,
    itemUpgradeModal,
    grimoirePickerModal,
    minervaModal,
    slotsModal,
    abilityRollModal,
    abilityDetailModal,
    shopHistoryModal,
    rdModal,
    systemPromptModal,
    sheetTransferModal,
    document.querySelector("#account-settings-modal"),
    document.querySelector("#roll-history-modal"),
    document.querySelector("#audio-clip-modal"),
  ]
    .some((modal) => !modal.hidden);
  if (hasOpenModal && !themeModal.hidden) closeThemeEditor({ restoreFocus: false });
  document.body.classList.toggle("modal-open", hasOpenModal);
}

