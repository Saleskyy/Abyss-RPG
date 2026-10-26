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
  const name = String(rawRoll.name || "").trim();
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
  return Object.hasOwn(UPGRADE_TYPES, value) ? value : "";
}

function isUpgradeCompatible(item, upgrade) {
  if (!item || !upgrade || (upgrade.section && upgrade.section !== "upgrades")) return false;
  const itemType = sanitizeItemType(item.itemType, item.isWeapon);
  const upgradeType = sanitizeUpgradeType(upgrade.upgradeType);
  if (!upgradeType) return false;
  if (itemType !== "weapon") return upgradeType === itemType;
  const category = Object.hasOwn(WEAPON_CATEGORIES, item.weaponCategory) ? item.weaponCategory : "ranged";
  return upgradeType === "weapon" || upgradeType === `weapon-${category}`;
}

function sanitizeInventoryUpgrades(rawUpgrades, itemType, weaponCategory = "") {
  if (!UPGRADE_ITEM_TYPES.includes(itemType)) return [];
  const ids = new Set();
  const sources = new Set();
  return (Array.isArray(rawUpgrades) ? rawUpgrades : []).slice(0, 50).flatMap((raw) => {
    if (!raw || typeof raw !== "object" || !isUpgradeCompatible({ itemType, weaponCategory }, raw)) return [];
    const name = String(raw.name || "").trim();
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
      upgradeType: sanitizeUpgradeType(raw.upgradeType),
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
  const name = String(source.name || "").trim();
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

function getWeaponAmmunitionTypes() {
  return { pistol: "Munição de Pistola", rifle: "Munição de Rifle", shotgun: "Munição de Escopeta", special: "Munição Especial" };
}

function sanitizeWeaponAmmunition(rawItem) {
  const isStock = rawItem?.itemType === "ammunition";
  const enabled = Boolean(rawItem?.isWeapon && rawItem?.ammunitionEnabled && !isStock);
  const quantity = enabled ? clampInteger(rawItem.ammunitionQuantity, 0, 999999999, 0) : 0;
  const capacity = enabled ? clampInteger(rawItem.ammunitionCapacity, 1, 999999999, Math.max(1, quantity)) : 0;
  let type = Object.hasOwn(getWeaponAmmunitionTypes(), rawItem?.ammunitionType) ? rawItem.ammunitionType : "";
  if (isStock && !type) {
    const name = String(rawItem?.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const matches = Object.entries({ pistol: "pistola", rifle: "rifle", shotgun: "escopeta", special: "especial" })
      .filter(([, word]) => new RegExp(`\\b${word}\\b`).test(name));
    if (matches.length === 1) type = matches[0][0];
  }
  return {
    ammunitionEnabled: enabled,
    ammunitionQuantity: quantity,
    ammunitionCapacity: enabled ? Math.max(quantity, capacity) : 0,
    ammunitionType: isStock ? type : enabled ? type || "pistol" : "",
  };
}

function sanitizeInventoryItem(rawItem) {
  if (!rawItem || typeof rawItem !== "object") return null;
  const name = String(rawItem.name || "").trim();
  if (!name) return null;
  const mechanics = sanitizeCreationMechanics(rawItem);
  const isWeapon = Boolean(rawItem.isWeapon);
  const itemType = sanitizeItemType(rawItem.itemType, isWeapon);
  const damageProfile = sanitizeDamageProfile(rawItem.damageProfile, rawItem.damage);
  const upgrades = sanitizeInventoryUpgrades(rawItem.upgrades, itemType, rawItem.weaponCategory);
  return {
    id: String(rawItem.id || createAbilityId("item")).slice(0, 120),
    kind: "item",
    name,
    ...sanitizeCreationDescription(rawItem),
    ...sanitizeItemPackage({ ...rawItem, itemType, isWeapon }),
    weight: parseInventorySpaceValue(rawItem.weight, 1),
    itemType,
    isWeapon,
    weaponSize: isWeapon && Object.hasOwn(WEAPON_SIZES, rawItem.weaponSize) ? rawItem.weaponSize : isWeapon ? "light" : "",
    weaponCategory: isWeapon && Object.hasOwn(WEAPON_CATEGORIES, rawItem.weaponCategory) ? rawItem.weaponCategory : isWeapon ? "ranged" : "",
    weaponTestSkill: isWeapon ? String(rawItem.weaponTestSkill || "").trim() : "",
    weaponProperties: isWeapon ? [...new Set((Array.isArray(rawItem.weaponProperties) ? rawItem.weaponProperties : []).filter(property => Object.hasOwn(WEAPON_PROPERTIES, property)))] : [],
    extraDamages: isWeapon ? (Array.isArray(rawItem.extraDamages) ? rawItem.extraDamages : []).map(sanitizeCreationRoll).filter(Boolean) : [],
    ...sanitizeWeaponAmmunition(rawItem),
    equipped: isWeapon && Boolean(rawItem.equipped),
    damageProfile: isWeapon ? damageProfile : sanitizeDamageProfile({}),
    ...mechanics,
    upgrades,
    mediaUrl: safeAbilityMediaUrl(rawItem.mediaUrl),
    mediaRefId: String(rawItem.mediaRefId || "").slice(0, 120),
    mediaOwner: ["slot", "minerva"].includes(rawItem.mediaOwner) ? rawItem.mediaOwner : "link",
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

function inventoryItemQuantityLabel(item) {
  const pack = sanitizeItemPackage(item);
  return pack.isPackage
    ? `${pack.quantity} ${pack.quantity === 1 ? "pacote" : "pacotes"} · ${pack.packageRemaining}/${pack.quantity * pack.packageSize} unidades dentro`
    : `Quantidade ${pack.quantity}`;
}

function inventoryItemWeightLabel(item) {
  const pack = sanitizeItemPackage(item);
  const weight = parseInventorySpaceValue(item.weight, 1);
  return `Peso ${formatInventorySpaces(weight)} por ${pack.isPackage ? "pacote" : "unidade"} · ${formatInventorySpaces(weight * pack.quantity)} espaços`;
}

function upgradeTypeLabel(type) {
  return `Melhoria · ${UPGRADE_TYPES[sanitizeUpgradeType(type)] || "Itens"}`;
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
  badge.textContent = item.itemType === "ammunition" && getWeaponAmmunitionTypes()[item.ammunitionType]
    ? getWeaponAmmunitionTypes()[item.ammunitionType] : itemTypeLabel(item);
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
  document.querySelector("#item-upgrade-target").textContent = `${item.name} · ${item.itemType === "weapon" ? WEAPON_CATEGORIES[item.weaponCategory] || "Disparo" : itemTypeLabel(item)}`;
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
  itemUpgradeEmpty.textContent = query ? "Nenhuma melhoria compatível encontrada nesta busca." : "Ainda não há melhorias compatíveis com este item publicadas no Grimório.";
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
  document.querySelector("#item-upgrade-target").textContent = `${item.name} · ${item.itemType === "weapon" ? WEAPON_CATEGORIES[item.weaponCategory] || "Disparo" : itemTypeLabel(item)}`;
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
      <label class="builder-field"><span>Nome da rolagem</span><input data-mechanic-field="roll-name" type="text" autocomplete="off" placeholder="Ex.: Ataque" /></label>
      <label class="builder-field"><span>Fórmula</span><input data-mechanic-field="roll-formula" type="text" autocomplete="off" placeholder="Ex.: 1d20+FOR" /></label>
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
    <label class="builder-field"><span>Valor</span><input data-mechanic-field="modifier-formula" type="text" autocomplete="off" placeholder="Ex.: +2 ou 1d4" /></label>
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
  if (prefix === "item") {
    const extras = document.querySelector("#item-extra-damages-list");
    const empty = document.querySelector("#item-extra-damages-empty");
    if (extras && empty) empty.hidden = Boolean(extras.children.length);
  }
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

function appendItemExtraDamageEditorRow(data = {}) {
  const list = document.querySelector("#item-extra-damages-list");
  if (!list) return;
  const row = createMechanicEditorRow("roll", { name: `Dano Extra ${list.children.length + 1}`, ...data });
  row.dataset.mechanicKind = "extra-damage";
  row.className = "mechanics-repeat-row is-extra-damage";
  row.querySelector('[data-mechanic-field="roll-name"]').closest("label").querySelector("span").textContent = "Nome do dano";
  row.querySelector('[data-mechanic-field="roll-formula"]').placeholder = "Ex.: +5 ou +1d4+5";
  row.querySelector("[data-remove-mechanic]").setAttribute("aria-label", "Remover dano extra");
  list.append(row);
  refreshMechanicsEditor("item");
  focusCreationEditorField(row.querySelector('[data-mechanic-field="roll-formula"]'));
}

function readItemExtraDamagesEditor() {
  const extraDamages = [];
  for (const row of document.querySelector("#item-extra-damages-list")?.children || []) {
    const nameInput = row.querySelector('[data-mechanic-field="roll-name"]');
    const formulaInput = row.querySelector('[data-mechanic-field="roll-formula"]');
    const name = nameInput.value.trim();
    const parsed = parseDamageFormula(formulaInput.value);
    if (!name) return { error: "Dê um nome a cada dano extra.", input: nameInput };
    if (parsed.error || !parsed.tokens.length) return { error: parsed.error || "Preencha a fórmula do dano extra.", input: formulaInput };
    extraDamages.push(sanitizeCreationRoll({ id: row.dataset.mechanicId, name, formula: parsed.formula }));
  }
  return { extraDamages, error: "" };
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
    const available = summarizeStatusEffects().resources?.[resource] || {
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

async function applyCreationCosts(creation, trigger = null, options = {}) {
  const epoch = notesEpoch;
  const identity = window.AbyssCloud?.getRollContext?.() || {};
  const isCurrent = () => {
    const currentIdentity = window.AbyssCloud?.getRollContext?.() || {};
    return epoch === notesEpoch && !isNotebookReadOnly() && identity.sheetOwnerUid === currentIdentity.sheetOwnerUid && identity.slotId === currentIdentity.slotId
      && (!options.isCurrent || options.isCurrent());
  };
  if (!isCurrent()) return false;
  const totals = summarizeCreationCosts(creation.costs);
  const statusContext = getSheetStatusRollContext(creation.name, {
    actionName: creation.name,
    paCost: totals.pa.current + totals.pa.max,
    magic: creation.section === "spells",
  });
  const action = recordSheetStatusAction(statusContext, { checkOnly: true });
  if (!action.ok) return false;
  totals.pa.current += action.extraPA;
  if (!creation.costs?.length && !action.extraPA) {
    recordSheetStatusAction(statusContext, { chargeSurcharge: false });
    return true;
  }
  let missing = findInsufficientCreationCosts(totals);
  if (missing.length) {
    await warnInsufficientCreationCosts(creation, missing, trigger);
    return false;
  }

  const summary = [...(creation.costs || []).map(costDisplayLabel), ...(action.extraPA ? [`+${action.extraPA} PA · condições, ferimentos e medo`] : [])].join("\n");
  const confirmed = await showAbyssConfirm({
    eyebrow: "Uso de recursos",
    title: "Gastar recursos?",
    message: `“${creation.name}” consumirá:\n\n${summary}`,
    confirmLabel: "Gastar",
    tone: "warning",
    trigger,
  });
  if (!confirmed || !isCurrent()) return false;

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
  recordSheetStatusAction(statusContext, { chargeSurcharge: false });
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
  if (!chargeCosts && !recordSheetStatusAction(getSheetStatusRollContext(creation.name, { actionName: String(creation.name).trim().toLocaleLowerCase("pt-BR") === "correr" ? creation.name : roll.name, standardAction: false, actionType: "", paCost: 0, magic: creation.section === "spells" }), { checkOnly: true }).ok) return;
  if (chargeCosts && !(await applyCreationCosts(creation, trigger))) return;
  const parsed = parseDamageFormula(roll.formula);
  if (parsed.error || !parsed.tokens.length) return;
  const result = evaluateDamageFormulaDetailed(parsed);
  showCreationRollResult(`${creation.name} · ${roll.name}`, "Rolagem", parsed, result, trigger);
}

function isRangedInventoryWeapon(item) {
  return Boolean(item?.isWeapon && ["ranged", "firearm"].includes(item.weaponCategory));
}

function getWeaponAttackSkill(item) {
  return String(item?.weaponTestSkill || "").trim() || (item?.weaponCategory === "melee" ? "Luta" : "Pontaria");
}

function getCompatibleAmmunitionStocks(weapon) {
  if (!weapon?.ammunitionEnabled || !Object.hasOwn(getWeaponAmmunitionTypes(), weapon.ammunitionType)) return [];
  return inventoryItems.filter((item) => item.id !== weapon.id && !item.isWeapon && item.itemType === "ammunition"
    && sanitizeWeaponAmmunition(item).ammunitionType === weapon.ammunitionType && getInventoryItemUnits(item) > 0);
}

function refreshWeaponCombatState(creationId) {
  renderInventory();
  renderAbilities();
  if (!abilityDetailModal.hidden && activeAbilityDetailScope === "inventory" && activeAbilityDetailId === creationId) {
    const current = getCreation("inventory", creationId);
    if (current) {
      renderCreationDetailMechanics(current, "inventory");
      updateCreationDetailDamageButton(current, "inventory");
    }
  }
}

function testCreationWeapon(creationId, trigger) {
  if (isNotebookReadOnly() || trigger?.disabled) return false;
  if (trigger?.dataset?.sheetEpoch !== undefined && trigger.dataset.sheetEpoch !== String(notesEpoch)) return false;
  const item = inventoryItems.find((entry) => entry.id === creationId);
  if (!item?.isWeapon) return false;
  const skillName = getWeaponAttackSkill(item);
  const skillIndex = SKILLS.findIndex((skill) => normalizeSearchTerm(skill.name) === normalizeSearchTerm(skillName));
  if (skillIndex < 0) {
    showAbyssAlert({ eyebrow: "Teste da arma", title: "Perícia indisponível", message: `A Perícia “${skillName}” não existe nesta ficha. Edite a arma para escolher outra Perícia ou adicione a Perícia à ficha.`, trigger });
    return false;
  }
  rollSkill(skillIndex, trigger);
  return true;
}

function reloadCreationWeapon(creationId, trigger) {
  if (isNotebookReadOnly() || trigger?.disabled) return false;
  if (trigger?.dataset?.sheetEpoch !== undefined && trigger.dataset.sheetEpoch !== String(notesEpoch)) return false;
  const item = inventoryItems.find((entry) => entry.id === creationId);
  if (!isRangedInventoryWeapon(item) || !item.ammunitionEnabled) return false;
  const identity = window.AbyssCloud?.getRollContext?.() || {};
  const key = `${notesEpoch}:${identity.sheetOwnerUid || ""}:${identity.slotId || ""}:${creationId}`;
  if (shootCreationWeapon.pending?.has(key)) return false;
  const capacity = sanitizeWeaponAmmunition(item).ammunitionCapacity;
  const missing = Math.max(0, capacity - item.ammunitionQuantity);
  if (!missing) return false;
  const stocks = getCompatibleAmmunitionStocks(item);
  const available = stocks.reduce((total, stock) => total + getInventoryItemUnits(stock), 0);
  if (!available) {
    showAbyssAlert({ eyebrow: "Recarga", title: "Sem munição compatível", message: `Adicione ${getWeaponAmmunitionTypes()[item.ammunitionType]} ao Inventário para recarregar ${item.name}. O item precisa ser do tipo Munição e ter a mesma tag da arma.`, trigger });
    return false;
  }
  const loaded = Math.min(missing, available);
  let remaining = loaded;
  const spent = [];
  for (const stock of stocks) {
    if (!remaining) break;
    const stockUnits = getInventoryItemUnits(stock);
    const amount = Math.min(remaining, stockUnits);
    if (amount === stockUnits && stock.modifiersActive) setCreationModifiersActive("inventory", stock.id, false, { notify: false });
    Object.assign(stock, sanitizeItemPackage(stock));
    if (stock.isPackage) stock.packageRemaining -= amount;
    else stock.quantity -= amount;
    remaining -= amount;
    spent.push(`${stock.name}: −${amount}`);
  }
  item.ammunitionQuantity += loaded;
  refreshWeaponCombatState(creationId);
  notifySheetChanged("weapon-reloaded");
  showAbyssAlert({ eyebrow: "Recarga", title: loaded < missing ? "Recarga parcial" : "Arma recarregada", message: `${item.name}: ${item.ammunitionQuantity}/${capacity} munições.\n${spent.join("\n")}`, trigger });
  return true;
}

async function shootCreationWeapon(creationId, trigger, chargeCosts = false) {
  if (isNotebookReadOnly() || trigger?.disabled) return false;
  const item = inventoryItems.find(entry => entry.id === creationId);
  if (!isRangedInventoryWeapon(item) || !item.ammunitionEnabled) return false;
  const epoch = notesEpoch;
  if (trigger?.dataset?.sheetEpoch !== undefined && trigger.dataset.sheetEpoch !== String(epoch)) return false;
  const identity = window.AbyssCloud?.getRollContext?.() || {};
  const isCurrent = () => {
    const currentIdentity = window.AbyssCloud?.getRollContext?.() || {};
    return epoch === notesEpoch && !isNotebookReadOnly() && inventoryItems.find(entry => entry.id === creationId) === item && item.ammunitionEnabled
      && identity.sheetOwnerUid === currentIdentity.sheetOwnerUid && identity.slotId === currentIdentity.slotId;
  };
  const key = `${epoch}:${identity.sheetOwnerUid || ""}:${identity.slotId || ""}:${creationId}`;
  const pending = shootCreationWeapon.pending || (shootCreationWeapon.pending = new Set());
  if (pending.has(key)) return false;
  if (clampInteger(item.ammunitionQuantity, 0, 999999999, 0) < 1) {
    showAbyssAlert({ eyebrow: "Munição", title: "Sem munição", message: `${item.name} não tem munição para atirar. Use Recarregar para transferir munição compatível do Inventário.`, trigger });
    return false;
  }
  pending.add(key);
  if (trigger) trigger.disabled = true;
  try {
    return await rollCreationDamage("inventory", creationId, trigger, chargeCosts, {
      isCurrent,
      onRolled: () => {
        if (!isCurrent() || item.ammunitionQuantity < 1) return false;
        item.ammunitionQuantity -= 1;
        refreshWeaponCombatState(creationId);
        notifySheetChanged("weapon-ammunition");
        return true;
      },
    });
  } catch (error) {
    if (isCurrent()) showAbyssAlert({ eyebrow: "Munição", title: "Não foi possível atirar", message: "A rolagem de dano não pôde ser concluída. Confira o dano da arma e tente novamente.", trigger });
    return false;
  } finally {
    pending.delete(key);
    if (trigger) trigger.disabled = !isCurrent() || item.ammunitionQuantity < 1;
  }
}

async function rollCreationDamage(scope, creationId, trigger, chargeCosts = false, options = {}) {
  if (isNotebookReadOnly()) return false;
  const creation = getCreation(scope, creationId);
  if (scope === "inventory" && trigger?.dataset?.sheetEpoch !== undefined && trigger.dataset.sheetEpoch !== String(notesEpoch)) return false;
  const profile = creation?.damageProfile || sanitizeDamageProfile({}, creation?.damage);
  const primaryParsed = parseDamageFormula(profile.primary);
  if (!creation || primaryParsed.error || !primaryParsed.tokens.length || (options.isCurrent && !options.isCurrent())) return false;
  if (!chargeCosts && !recordSheetStatusAction(getSheetStatusRollContext(creation.name, { standardAction: false, actionType: "", paCost: 0, magic: creation.section === "spells" }), { checkOnly: true }).ok) return false;
  if (chargeCosts && !(await applyCreationCosts(creation, trigger, { isCurrent: options.isCurrent }))) return false;
  if (options.isCurrent && !options.isCurrent()) return false;

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
  return options.onRolled ? options.onRolled() : true;
}

async function rollCreationExtraDamage(scope, creationId, extraId, trigger) {
  if (isNotebookReadOnly()) return;
  const creation = getCreation(scope, creationId);
  const extra = creation?.extraDamages?.find(entry => entry.id === extraId);
  if (!extra) return;
  const parsed = parseDamageFormula(extra.formula);
  if (parsed.error || !parsed.tokens.length) return;
  const result = evaluateDamageFormulaDetailed(parsed);
  showCreationRollResult(`${creation.name} · ${extra.name}`, "Dano Extra", parsed, result, trigger, { kind: "damage", criticalDamage: false });
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

function appendWeaponCombatActions(container, creation) {
  const actions = document.createElement("div");
  actions.className = "creation-quick-rolls weapon-combat-actions";
  const profile = creation.damageProfile || sanitizeDamageProfile({}, creation.damage);
  const readOnly = isNotebookReadOnly();
  const add = (label, detail, action, className, disabled = false) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `creation-quick-roll ${className}`;
    button.dataset[action] = creation.id;
    button.dataset.creationScope = "inventory";
    button.dataset.sheetEpoch = String(notesEpoch);
    button.disabled = readOnly || disabled;
    button.setAttribute("aria-label", `${label} · ${creation.name}${detail ? ` · ${detail}` : ""}`);
    button.append(
      Object.assign(document.createElement("span"), { className: "creation-quick-roll-label", textContent: label }),
      Object.assign(document.createElement("small"), { textContent: detail }),
    );
    actions.append(button);
    return button;
  };
  add("Teste", getWeaponAttackSkill(creation), "testCreationWeapon", "is-test-roll");
  add("Dano", profile.primary ? [profile.primary, profile.additional].filter(Boolean).join(" + ") : "Defina o dano no editor", "rollCreationDamage", "is-damage-roll", !profile.primary);
  if (isRangedInventoryWeapon(creation)) {
    const ammo = sanitizeWeaponAmmunition(creation);
    const count = `${ammo.ammunitionQuantity}/${ammo.ammunitionCapacity}`;
    const shot = add("Atirar", ammo.ammunitionEnabled ? `${count} · consome 1` : "Ative Munição no editor", "shootCreationWeapon", "is-ammunition-shot", !ammo.ammunitionEnabled || !ammo.ammunitionQuantity || !profile.primary);
    shot.querySelector("small").className = "weapon-ammunition-count";
    const reserve = getCompatibleAmmunitionStocks(creation).reduce((total, stock) => total + getInventoryItemUnits(stock), 0);
    add("Recarregar", ammo.ammunitionEnabled ? `${reserve} na reserva` : "Ative Munição no editor", "reloadCreationWeapon", "is-reload-action", !ammo.ammunitionEnabled || ammo.ammunitionQuantity >= ammo.ammunitionCapacity);
  }
  container.append(actions);
  return actions;
}

function appendCreationDamageRoll(container, creation, scope, allowDamage = true) {
  const profile = creation?.damageProfile || sanitizeDamageProfile({}, creation?.damage);
  const weapon = scope === "inventory" && creation?.isWeapon;
  if (weapon) appendWeaponCombatActions(container, creation);
  else if (!allowDamage || !profile.primary) return;
  const rolls = document.createElement("div");
  rolls.className = "creation-quick-rolls";
  if (!weapon) {
    const button = document.createElement("button");
    button.className = "creation-quick-roll is-damage-roll";
    button.type = "button";
    button.dataset.rollCreationDamage = creation.id;
    button.dataset.creationScope = scope;
    if (scope === "inventory") button.dataset.sheetEpoch = String(notesEpoch);
    button.setAttribute("aria-label", `Rolar dano de ${creation.name}: ${profile.primary}`);
    button.append(
      Object.assign(document.createElement("span"), { textContent: "⚔️ Dano" }),
      Object.assign(document.createElement("small"), {
        textContent: profile.additional ? `${profile.primary} + ${profile.additional}` : profile.primary,
      }),
    );
    rolls.append(button);
  }
  (creation.extraDamages || []).forEach(extra => {
    const extraButton = document.createElement("button");
    extraButton.className = "creation-quick-roll is-damage-roll";
    extraButton.type = "button";
    extraButton.dataset.rollCreationExtraDamage = creation.id;
    extraButton.dataset.creationScope = scope;
    extraButton.dataset.extraDamageId = extra.id;
    extraButton.setAttribute("aria-label", `Rolar ${extra.name} de ${creation.name}: ${extra.formula}`);
    extraButton.append(Object.assign(document.createElement("span"), { textContent: `⚔️ ${extra.name}` }), Object.assign(document.createElement("small"), { textContent: extra.formula }));
    rolls.append(extraButton);
  });
  if (rolls.children.length) container.append(rolls);
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
  if (!options.inventory && creation.damageProfile?.criticalThreshold) {
    card.append(createCriticalMarginControl(creation, scope));
  }
  shell.append(card);
  return shell;
}

function handleCreationCardPrimaryAction(event) {
  const weaponTest = event.target.closest("[data-test-creation-weapon]");
  if (weaponTest) { testCreationWeapon(weaponTest.dataset.testCreationWeapon, weaponTest); return true; }
  const shot = event.target.closest("[data-shoot-creation-weapon]");
  if (shot) { shootCreationWeapon(shot.dataset.shootCreationWeapon, shot, false); return true; }
  const reload = event.target.closest("[data-reload-creation-weapon]");
  if (reload) { reloadCreationWeapon(reload.dataset.reloadCreationWeapon, reload); return true; }
  const extraDamage = event.target.closest("[data-roll-creation-extra-damage]");
  if (extraDamage) {
    rollCreationExtraDamage(extraDamage.dataset.creationScope, extraDamage.dataset.rollCreationExtraDamage, extraDamage.dataset.extraDamageId, extraDamage);
    return true;
  }
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
  if (scope === "inventory" && creation.isWeapon) appendWeaponCombatActions(container, creation);
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

  appendCreationDetailSection(container, "Danos Extras", (creation.extraDamages || []).map(extra => createCreationDetailRow(extra.name, extra.formula, isCatalogPreview ? null : {
    label: "Rolar dano", dataset: { rollCreationExtraDamage: creation.id, extraDamageId: extra.id, creationScope: scope },
  })));
  if (creation.kind === "item") {
    const pack = sanitizeItemPackage(creation);
    const information = [createCreationDetailRow(pack.isPackage ? "Peso por pacote" : "Peso por unidade", `${formatInventorySpaces(creation.weight)} espaços`)];
    if (pack.isPackage) {
      information.push(createCreationDetailRow("Pacotes", String(pack.quantity)), createCreationDetailRow("Unidades por pacote", String(pack.packageSize)), createCreationDetailRow("Unidades restantes", String(pack.packageRemaining)));
    }
    if (creation.isWeapon) {
      information.push(createCreationDetailRow("Teste da arma", getWeaponAttackSkill(creation)));
      information.push(createCreationDetailRow("Porte", WEAPON_SIZES[creation.weaponSize] || "Leve"), createCreationDetailRow("Categoria", WEAPON_CATEGORIES[creation.weaponCategory] || "Disparo"));
      if (creation.weaponProperties?.length) information.push(createCreationDetailRow("Propriedades", creation.weaponProperties.map(property => WEAPON_PROPERTIES[property]).join(" · ")));
      if (creation.ammunitionEnabled) information.push(createCreationDetailRow(getWeaponAmmunitionTypes()[creation.ammunitionType] || "Munição", `${creation.ammunitionQuantity}/${sanitizeWeaponAmmunition(creation).ammunitionCapacity}`));
    }
    if (creation.itemType === "ammunition") information.push(createCreationDetailRow("Tipo de munição", getWeaponAmmunitionTypes()[creation.ammunitionType] || "Escolha o tipo ao editar"));
    appendCreationDetailSection(container, "Características do item", information);
  }

  appendCreationDetailSection(
    container,
    "Rolagens",
    (creation.rolls || []).map((roll) => createCreationDetailRow(
      roll.name,
      roll.formula,
      isCatalogPreview ? null : {
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
        if (image.parentElement !== abilityMediaPreview) return;
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

function revokePendingItemPreview() {
  if (pendingItemPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(pendingItemPreviewUrl);
  pendingItemPreviewUrl = "";
}

function renderItemMediaPreview(source = "") {
  revokePendingItemPreview();
  itemMediaPreview.replaceChildren();
  const safeSource = source.startsWith("blob:") ? source : safeAbilityMediaUrl(source);
  if (safeSource) {
    const image = document.createElement("img");
    image.alt = "Prévia da imagem da criação";
    image.src = safeSource;
    image.addEventListener("error", () => {
      if (image.parentElement !== itemMediaPreview) return;
      itemMediaPreview.replaceChildren(
        Object.assign(document.createElement("span"), { textContent: "✦" }),
        Object.assign(document.createElement("small"), { textContent: "Não foi possível abrir a imagem" }),
      );
    }, { once: true });
    itemMediaPreview.append(image);
    if (source.startsWith("blob:")) pendingItemPreviewUrl = source;
    return;
  }
  itemMediaPreview.append(
    Object.assign(document.createElement("span"), { textContent: "✦" }),
    Object.assign(document.createElement("small"), { textContent: "Prévia do ícone" }),
  );
}

function abilitySectionLabel(section) {
  return ABILITY_SECTIONS[section]?.label || ABILITY_SECTIONS.attacks.label;
}

function createAbilityMediaElement(ability, className, fallback = "✦") {
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
          Object.assign(document.createElement("span"), { textContent: fallback }),
        );
      },
      { once: true },
    );
    media.append(image);
  } else {
    media.append(Object.assign(document.createElement("span"), { textContent: fallback }));
  }

  return media;
}

function updateCreationDetailDamageButton(creation, scope) {
  const primaryDamage = creation.damageProfile?.primary || creation.damage || "";
  abilityDetailDamageRoll.hidden = scope === "minerva" || scope === "minerva-item" || !primaryDamage || (scope === "inventory" && creation.isWeapon);
  abilityDetailDamageRoll.textContent = primaryDamage ? `⚔️ Dano · ${primaryDamage}` : "⚔️ Dano";
  abilityDetailDamageRoll.disabled = isNotebookReadOnly();
  if (scope === "inventory") abilityDetailDamageRoll.dataset.sheetEpoch = String(notesEpoch);
  else delete abilityDetailDamageRoll.dataset.sheetEpoch;
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
    ? `${scope === "minerva-item" ? "Loja" : "Inventário"} · ${inventoryItemQuantityLabel(ability)} · ${inventoryItemWeightLabel(ability)}`
    : abilityOriginLabel(ability, scope);
  setCreationDescription(document.querySelector("#ability-detail-description"), ability);
  const media = document.querySelector("#ability-detail-media");
  media.replaceChildren();
  media.hidden = !safeAbilityMediaUrl(ability.mediaUrl);
  if (!media.hidden) media.append(createAbilityMediaElement(ability, "ability-card-media"));
  const damage = document.querySelector("#ability-detail-damage");
  const primaryDamage = ability.damageProfile?.primary || ability.damage || "";
  damage.hidden = true;
  damage.textContent = "";
  renderCreationDetailMechanics(ability, scope);
  abilityDetailRoll.hidden = isCatalogPreview || !ability.costs?.length;
  abilityDetailRoll.textContent = creationSpendLabel(ability);
  updateCreationDetailDamageButton(ability, scope);
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
      if (ability.ammunitionEnabled) {
        const ammunitionTag = document.createElement("span");
        ammunitionTag.className = `weapon-ammunition-badge${ability.ammunitionQuantity ? "" : " is-empty"}`;
        ammunitionTag.textContent = `${getWeaponAmmunitionTypes()[ability.ammunitionType] || "Munição"} · ${ability.ammunitionQuantity}/${sanitizeWeaponAmmunition(ability).ammunitionCapacity}`;
        headingTags.append(ammunitionTag);
      }
      headingMain.append(headingTags);
      headingMain.append(Object.assign(document.createElement("small"), { className: "weapon-attack-meta", textContent: `${WEAPON_CATEGORIES[ability.weaponCategory] || "Arma"} · ${WEAPON_SIZES[ability.weaponSize] || "Leve"}${ability.weaponProperties?.length ? ` · ${ability.weaponProperties.map((key) => WEAPON_PROPERTIES[key]).join(" · ")}` : ""}` }));
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
    appendCreationDamageRoll(copy, ability, scope, Boolean(primaryDamage));
    appendCreationQuickRolls(copy, ability, scope, true);
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
      media = createAbilityMediaElement(ability, "item-card-icon", "⚔");
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
  abilityEditorForm.dataset.editorToken = createAbilityId("ability-editor");
  saveAbilityButton.disabled = false;
  const upgradeOption = abilitySectionSelect.querySelector('option[value="upgrades"]');
  upgradeOption.hidden = abilityEditorScope !== "minerva";
  upgradeOption.disabled = abilityEditorScope !== "minerva";
  abilityUpgradeTypeSelect.value = sanitizeUpgradeType(ability?.upgradeType) || sanitizeUpgradeType(minervaUpgradeFilter.value) || "weapon-melee";
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
  if (saveAbilityButton.disabled) return;
  const submittedScope = abilityEditorScope;
  const submittedToken = abilityEditorForm.dataset.editorToken;
  const submittedEpoch = notesEpoch;
  const isCurrentEditor = () => !abilityEditorModal.hidden && abilityEditorForm.dataset.editorToken === submittedToken;
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
        scope: submittedScope,
        abilityId: id,
        file,
      });
      mediaUrl = uploaded.url;
      mediaRefId = uploaded.refId;
      mediaOwner = submittedScope === "minerva" ? "minerva" : "slot";
      newlyUploadedMedia = uploaded;
    }

    if (!isCurrentEditor() || notesEpoch !== submittedEpoch || isNotebookReadOnly()) {
      throw new Error("A edição mudou durante o envio da imagem. Abra a criação novamente para salvar.");
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
      newlyUploadedMedia = null;
      await refreshGrimoireFromCloud();
      if (nextAbility.section === "upgrades") minervaUpgradeFilter.value = nextAbility.upgradeType;
      selectMinervaSection(nextAbility.section);
    } else {
      const index = abilities.findIndex((item) => item.id === id);
      if (index >= 0) abilities[index] = nextAbility;
      else abilities.push(nextAbility);
      newlyUploadedMedia = null;

      selectAbilitySection(nextAbility.section);
      notifySheetChanged(index >= 0 ? "ability-edited" : "ability-created");
    }

    const oldRefId = existing?.mediaRefId || "";
    const ownsOld =
      submittedScope === "minerva"
        ? existing?.mediaOwner === "minerva"
        : existing?.mediaOwner === "slot";

    // Minerva images remain available to previous versions and imported sheets.
    if (submittedScope !== "minerva" && oldRefId && oldRefId !== mediaRefId && ownsOld) {
      window.AbyssCloud
        ?.deleteMedia({
          scope: submittedScope,
          refId: oldRefId,
        })
        .catch(() => {});
    }

    newlyUploadedMedia = null;
    if (isCurrentEditor()) closeAbilityEditor();
  } catch (error) {
    if (newlyUploadedMedia && submittedScope !== "minerva") {
      window.AbyssCloud?.deleteMedia(newlyUploadedMedia).catch(() => {});
    }
    const friendlyCloudError = error?.code
      ? window.AbyssCloud?.describeError?.(error)
      : "";
    if (isCurrentEditor()) setAbilityEditorError(
      friendlyCloudError || userFacingErrorMessage(error) || "Não foi possível salvar a Habilidade.",
    );
  } finally {
    if (abilityEditorForm.dataset.editorToken === submittedToken) {
      saveAbilityButton.disabled = false;
      saveAbilityButton.textContent = existing ? "Salvar Alterações" : abilitySectionSelect.value === "upgrades" ? "Publicar Melhoria" : "Criar Habilidade";
    }
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
  updateItemPackageFields();
  updateItemAmmunitionFields();
}

function updateItemPackageFields() {
  const enabledInput = document.querySelector("#item-is-package");
  const isWeapon = itemIsWeaponInput.checked || itemTypeSelect.value === "weapon";
  if (isWeapon && enabledInput) enabledInput.checked = false;
  const isPackage = Boolean(!isWeapon && enabledInput?.checked);
  const toggle = document.querySelector("#item-package-toggle");
  if (toggle) toggle.hidden = isWeapon;
  if (enabledInput) enabledInput.disabled = isWeapon;
  const fields = document.querySelector("#item-package-fields");
  if (fields) fields.hidden = !isPackage;
  const size = document.querySelector("#item-package-size");
  if (size) { size.disabled = !isPackage; size.required = isPackage; }
  const remaining = document.querySelector("#item-package-remaining");
  const isInventory = itemEditorScope === "inventory";
  const remainingField = document.querySelector("#item-package-remaining-field");
  if (remainingField) remainingField.hidden = !isInventory;
  if (remaining) { remaining.disabled = !isPackage || !isInventory; remaining.required = isPackage && isInventory; }
  itemQuantityInput.min = !isPackage && itemTypeSelect.value === "ammunition" ? "0" : "1";
  const quantityLabel = document.querySelector("#item-quantity-label");
  if (quantityLabel) quantityLabel.textContent = isPackage ? "Quantidade de pacotes" : "Quantidade";
  const weightHelp = document.querySelector("#item-weight-help");
  if (weightHelp) weightHelp.textContent = isPackage ? "Espaços por pacote" : "Espaços por unidade";
  const priceHelp = document.querySelector("#item-shop-price-help");
  if (priceHelp) priceHelp.textContent = isPackage ? "O preço é por pacote. Cada compra entrega um pacote cheio." : "O preço é por unidade. O produto permanece disponível após cada compra.";
}

function readItemPackageEditor() {
  const isPackage = Boolean(!itemIsWeaponInput.checked && itemTypeSelect.value !== "weapon" && document.querySelector("#item-is-package")?.checked);
  const quantity = itemEditorScope === "minerva" ? 1 : Number(itemQuantityInput.value);
  const minimumQuantity = !isPackage && itemTypeSelect.value === "ammunition" ? 0 : 1;
  if (!Number.isInteger(quantity) || quantity < minimumQuantity || quantity > 9999 || (itemEditorScope !== "minerva" && !String(itemQuantityInput.value).trim())) {
    return { error: `Informe uma quantidade inteira entre ${minimumQuantity} e 9.999.`, input: itemQuantityInput };
  }
  if (!isPackage) return { ...sanitizeItemPackage({ isPackage: false, quantity, itemType: itemTypeSelect.value }), error: "" };
  const sizeInput = document.querySelector("#item-package-size");
  const packageSize = Number(sizeInput?.value);
  if (!String(sizeInput?.value || "").trim() || !Number.isInteger(packageSize) || packageSize < 1 || packageSize > 999999999) {
    return { error: "Informe quantas unidades há em cada pacote, entre 1 e 999.999.999.", input: sizeInput };
  }
  const remainingInput = document.querySelector("#item-package-remaining");
  const packageRemaining = itemEditorScope === "minerva" ? packageSize : Number(remainingInput?.value);
  if (itemEditorScope !== "minerva" && (!String(remainingInput?.value || "").trim() || !Number.isInteger(packageRemaining) || packageRemaining < 0 || packageRemaining > quantity * packageSize)) {
    return { error: `Informe as unidades restantes entre 0 e ${formatInventorySpaces(quantity * packageSize)}.`, input: remainingInput };
  }
  return { isPackage, quantity, packageSize, packageRemaining, error: "" };
}

function refillItemPackageEditor() {
  const remaining = document.querySelector("#item-package-remaining");
  const quantity = Number(itemQuantityInput.value);
  const size = Number(document.querySelector("#item-package-size")?.value);
  if (remaining && Number.isInteger(quantity) && quantity >= 1 && Number.isInteger(size) && size >= 1) remaining.value = String(quantity * size);
}

function updateItemAmmunitionFields() {
  const isStock = itemTypeSelect.value === "ammunition";
  const stockField = document.querySelector("#item-ammunition-stock-field");
  if (stockField) stockField.hidden = !isStock;
  const stockType = document.querySelector("#item-ammunition-stock-type");
  if (stockType) { stockType.disabled = !isStock; stockType.required = isStock; }
  const enabled = Boolean(itemIsWeaponInput.checked && document.querySelector("#item-ammunition-enabled")?.checked);
  const fields = document.querySelector("#item-ammunition-fields");
  if (fields) fields.hidden = !enabled;
  const quantity = document.querySelector("#item-ammunition-quantity");
  if (quantity) { quantity.disabled = !enabled; quantity.required = enabled; }
  const capacity = document.querySelector("#item-ammunition-capacity");
  if (capacity) { capacity.disabled = !enabled; capacity.required = enabled; }
  const type = document.querySelector("#item-ammunition-type");
  if (type) { type.disabled = !enabled; type.required = enabled; }
}

function readItemAmmunitionEditor() {
  if (itemTypeSelect.value === "ammunition") {
    const stockTypeInput = document.querySelector("#item-ammunition-stock-type");
    if (!Object.hasOwn(getWeaponAmmunitionTypes(), stockTypeInput?.value)) return { error: "Escolha o tipo desta munição para permitir a recarga de armas compatíveis.", input: stockTypeInput };
    return { ...sanitizeWeaponAmmunition({ itemType: "ammunition", ammunitionType: stockTypeInput.value }), error: "" };
  }
  const enabled = Boolean(itemIsWeaponInput.checked && document.querySelector("#item-ammunition-enabled")?.checked);
  if (!enabled) return { ...sanitizeWeaponAmmunition({}), error: "" };
  const quantityInput = document.querySelector("#item-ammunition-quantity");
  const quantity = Number(quantityInput?.value);
  if (!String(quantityInput?.value || "").trim() || !Number.isInteger(quantity) || quantity < 0 || quantity > 999999999) {
    return { error: "Informe uma quantidade inteira de munição igual ou maior que zero, até 999.999.999.", input: quantityInput };
  }
  const capacityInput = document.querySelector("#item-ammunition-capacity");
  const capacity = Number(capacityInput?.value);
  if (!String(capacityInput?.value || "").trim() || !Number.isInteger(capacity) || capacity < 1 || capacity > 999999999) {
    return { error: "Informe uma munição máxima inteira entre 1 e 999.999.999.", input: capacityInput };
  }
  if (quantity > capacity) return { error: "A munição atual não pode ultrapassar a munição máxima da arma.", input: quantityInput };
  const typeInput = document.querySelector("#item-ammunition-type");
  if (!Object.hasOwn(getWeaponAmmunitionTypes(), typeInput?.value)) return { error: "Escolha o tipo de munição da arma.", input: typeInput };
  return { ammunitionEnabled: true, ammunitionQuantity: quantity, ammunitionCapacity: capacity, ammunitionType: typeInput.value, error: "" };
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
  document.querySelector("#item-quantity-field").hidden = isShopItem;
}

function populateItemWeaponTestSkills(savedSkill = "") {
  const select = document.querySelector("#item-weapon-test-skill");
  if (!select) return;
  const selected = String(savedSkill || "").trim();
  const entries = [{ name: "Padrão da categoria", value: "" }, ...SKILLS.map(skill => ({ name: skill.name, value: skill.name }))];
  if (selected && !entries.some(entry => entry.value === selected)) entries.push({ name: `${selected} (salva na arma)`, value: selected });
  select.replaceChildren(...entries.map(entry => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.name;
    return option;
  }));
  select.dataset.preservedSkill = selected;
  select.value = selected;
}

function openItemEditor(item = null, trigger = null, scope = "inventory") {
  itemEditorScope = scope === "minerva" ? "minerva" : "inventory";
  activeItemId = item?.id || null;
  activeItemTrigger = trigger;
  itemEditorForm.reset();
  itemEditorForm.dataset.editorToken = createAbilityId("item-editor");
  saveItemButton.disabled = false;
  itemEditorForm.dataset.sheetEpoch = String(notesEpoch);
  itemTypeSelect.value = sanitizeItemType(item?.itemType, item?.isWeapon);
  itemNameInput.value = item?.name || "";
  const packaging = sanitizeItemPackage(item || {});
  itemQuantityInput.value = String(packaging.quantity);
  const packageEnabled = document.querySelector("#item-is-package");
  const packageSize = document.querySelector("#item-package-size");
  const packageRemaining = document.querySelector("#item-package-remaining");
  if (packageEnabled) packageEnabled.checked = packaging.isPackage;
  if (packageSize) packageSize.value = String(packaging.packageSize || 1);
  if (packageRemaining) packageRemaining.value = String(packaging.isPackage ? packaging.packageRemaining : packaging.quantity);
  document.querySelector("#item-weight").value = formatInventorySpaces(parseInventorySpaceValue(item?.weight, 1)).replaceAll(".", "");
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
  document.querySelector("#item-legacy-additional-damage-field").hidden = !profile.additional;
  document.querySelector("#item-weapon-size").value = Object.hasOwn(WEAPON_SIZES, item?.weaponSize) ? item.weaponSize : "light";
  document.querySelector("#item-weapon-category").value = Object.hasOwn(WEAPON_CATEGORIES, item?.weaponCategory) ? item.weaponCategory : item ? "ranged" : "melee";
  populateItemWeaponTestSkills(item?.weaponTestSkill);
  const ammunition = sanitizeWeaponAmmunition(item);
  const ammunitionEnabled = document.querySelector("#item-ammunition-enabled");
  const ammunitionQuantity = document.querySelector("#item-ammunition-quantity");
  const ammunitionCapacity = document.querySelector("#item-ammunition-capacity");
  const ammunitionType = document.querySelector("#item-ammunition-type");
  const ammunitionStockType = document.querySelector("#item-ammunition-stock-type");
  if (ammunitionEnabled) ammunitionEnabled.checked = ammunition.ammunitionEnabled;
  if (ammunitionQuantity) ammunitionQuantity.value = String(ammunition.ammunitionQuantity);
  if (ammunitionCapacity) ammunitionCapacity.value = String(ammunition.ammunitionCapacity || 1);
  if (ammunitionType) ammunitionType.value = ammunition.ammunitionType || "pistol";
  if (ammunitionStockType) ammunitionStockType.value = itemTypeSelect.value === "ammunition" ? ammunition.ammunitionType : "";
  itemEditorForm.querySelectorAll("[data-weapon-property]").forEach(input => { input.checked = Boolean(item?.weaponProperties?.includes(input.dataset.weaponProperty)); });
  document.querySelector("#item-extra-damages-list").replaceChildren();
  (item?.extraDamages || []).forEach(appendItemExtraDamageEditorRow);
  itemCriticalThresholdInput.value = profile.criticalThreshold ? String(profile.criticalThreshold) : "";
  itemCriticalBonusInput.value = profile.criticalBonus || "";
  itemEditorForm.dataset.criticalMarginReduction = String(profile.criticalMarginReduction || 0);
  itemGrantsModifiersInput.checked = Boolean(item?.grantsModifiers);
  fillMechanicsEditor("item", item || {});
  itemMediaUrlInput.value = item?.mediaOwner === "link" ? item.mediaUrl || "" : "";
  itemMediaFileInput.value = "";
  itemEditorForm.dataset.mediaCleared = "false";
  itemFileName.textContent = "PNG, JPG, WEBP ou GIF · até 8 MB. A imagem será usada como ícone da criação.";
  renderItemMediaPreview(item?.mediaUrl || "");
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
  revokePendingItemPreview();
  itemMediaFileInput.value = "";
  activeItemId = null;
  syncModalLock();
  if (activeItemTrigger?.isConnected) activeItemTrigger.focus();
  else if (itemEditorScope === "minerva") restoreMinervaEditorFocus();
}

async function submitItemEditor(event) {
  event.preventDefault();
  if (saveItemButton.disabled) return;
  if (isNotebookReadOnly() || (itemEditorScope === "inventory" && itemEditorForm.dataset.sheetEpoch !== String(notesEpoch))) return;
  const submittedScope = itemEditorScope;
  const submittedToken = itemEditorForm.dataset.editorToken;
  const submittedEpoch = notesEpoch;
  setItemEditorError("");
  const name = itemNameInput.value.trim();
  if (!name) {
    setItemEditorError("Dê um nome ao Item.");
    focusCreationEditorField(itemNameInput);
    return;
  }
  const packaging = readItemPackageEditor();
  if (packaging.error) { setItemEditorError(packaging.error); focusCreationEditorField(packaging.input); return; }
  const weightInput = document.querySelector("#item-weight");
  const weight = parseInventorySpaceValue(weightInput.value, NaN);
  if (!Number.isFinite(weight)) {
    setItemEditorError("Informe um peso igual ou maior que zero. Ex.: 0,5 ou 1,5.");
    focusCreationEditorField(weightInput);
    return;
  }
  const extras = itemIsWeaponInput.checked ? readItemExtraDamagesEditor() : { extraDamages: [], error: "" };
  if (extras.error) { setItemEditorError(extras.error); focusCreationEditorField(extras.input); return; }
  const ammunition = readItemAmmunitionEditor();
  if (ammunition.error) { setItemEditorError(ammunition.error); focusCreationEditorField(ammunition.input); return; }
  const weaponTestInput = document.querySelector("#item-weapon-test-skill");
  const weaponTestSkill = itemIsWeaponInput.checked ? String(weaponTestInput?.value || "").trim() : "";
  if (weaponTestSkill && !SKILLS.some(skill => skill.name === weaponTestSkill) && weaponTestSkill !== weaponTestInput?.dataset.preservedSkill) {
    setItemEditorError("Escolha uma Perícia disponível para o Teste da arma.");
    focusCreationEditorField(weaponTestInput);
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
  const nextUpgradeTarget = {
    itemType: sanitizeItemType(itemTypeSelect.value, itemIsWeaponInput.checked),
    isWeapon: itemIsWeaponInput.checked,
    weaponCategory: itemIsWeaponInput.checked ? document.querySelector("#item-weapon-category").value : "",
  };
  if (existing && itemEditorScope === "inventory" && (existing.upgrades || []).some((upgrade) => !isUpgradeCompatible(nextUpgradeTarget, upgrade))) {
    const epoch = notesEpoch;
    const confirmed = await showAbyssConfirm({ eyebrow: "Compatibilidade", title: "Remover melhorias incompatíveis?", message: "Ao mudar o tipo ou a categoria deste item, as melhorias incompatíveis serão removidas com seus efeitos.", confirmLabel: "Salvar mudança", tone: "warning", trigger: saveItemButton });
    if (!confirmed || epoch !== notesEpoch || inventoryItems.find((item) => item.id === existing.id) !== existing || isNotebookReadOnly()) return;
  }
  const file = itemMediaFileInput.files?.[0] || null;
  const typedUrl = itemMediaUrlInput.value.trim();
  if (typedUrl && !safeRemoteImageUrl(typedUrl)) {
    setItemEditorError("O link da imagem precisa começar com http:// ou https://.");
    focusCreationEditorField(itemMediaUrlInput);
    return;
  }
  if (file && (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024)) {
    setItemEditorError("Escolha uma imagem ou GIF de até 8 MB.");
    focusCreationEditorField(itemMediaFileInput);
    return;
  }
  const cleared = itemEditorForm.dataset.mediaCleared === "true";
  const replaceMedia = Boolean(typedUrl) || cleared;
  const nextItem = sanitizeInventoryItem({
    id: existing?.id || createAbilityId("item"),
    name,
    isPackage: packaging.isPackage,
    quantity: packaging.quantity,
    packageSize: packaging.packageSize,
    packageRemaining: packaging.packageRemaining,
    weight,
    itemType: itemTypeSelect.value,
    upgrades: existing?.upgrades || [],
    ...readCreationDescriptionEditor(itemDescriptionInput),
    isWeapon: itemIsWeaponInput.checked,
    weaponSize: document.querySelector("#item-weapon-size").value,
    weaponCategory: document.querySelector("#item-weapon-category").value,
    weaponTestSkill,
    weaponProperties: [...itemEditorForm.querySelectorAll("[data-weapon-property]")].filter(input => input.checked).map(input => input.dataset.weaponProperty),
    extraDamages: extras.extraDamages,
    ammunitionEnabled: ammunition.ammunitionEnabled,
    ammunitionQuantity: ammunition.ammunitionQuantity,
    ammunitionCapacity: ammunition.ammunitionCapacity,
    ammunitionType: ammunition.ammunitionType,
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
    mediaUrl: typedUrl ? safeRemoteImageUrl(typedUrl) : cleared ? "" : existing?.mediaUrl || "",
    mediaRefId: replaceMedia ? "" : existing?.mediaRefId || "",
    mediaOwner: replaceMedia ? "link" : existing?.mediaOwner || "link",
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
  let newlyUploadedMedia = null;
  const isCurrentEditor = () => !itemEditorModal.hidden && itemEditorForm.dataset.editorToken === submittedToken;
  saveItemButton.disabled = true;
  saveItemButton.textContent = file ? "Enviando imagem…" : "Salvando…";
  try {
    if (submittedScope === "minerva" && !window.AbyssCloud?.isMinervaAdmin()) {
      throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
    }
    if (file) {
      if (!window.AbyssCloud?.isSignedIn()) throw new Error("Entre com o Google para enviar um arquivo. Você ainda pode usar um link de imagem ou GIF.");
      newlyUploadedMedia = await window.AbyssCloud.uploadAbilityMedia({
        scope: submittedScope === "minerva" ? "minerva" : "sheet", abilityId: nextItem.id, file,
      });
      nextItem.mediaUrl = newlyUploadedMedia.url;
      nextItem.mediaRefId = newlyUploadedMedia.refId;
      nextItem.mediaOwner = submittedScope === "minerva" ? "minerva" : "slot";
    }
    if (!isCurrentEditor() || isNotebookReadOnly() || submittedEpoch !== notesEpoch) {
      throw new Error("A edição mudou durante o envio da imagem. Abra a criação novamente para salvar.");
    }
    if (submittedScope === "minerva") {
      await window.AbyssCloud.saveMinervaItem(nextItem);
      newlyUploadedMedia = null;
      await refreshGrimoireFromCloud();
      selectMinervaSection("inventory");
    } else {
      if (existing?.modifiersActive) setCreationModifiersActive("inventory", existing.id, false, { notify: false });
      if (existingIndex >= 0) inventoryItems[existingIndex] = nextItem;
      else inventoryItems.push(nextItem);
      newlyUploadedMedia = null;
      if (existing?.mediaOwner === "slot" && existing.mediaRefId && existing.mediaRefId !== nextItem.mediaRefId) {
        window.AbyssCloud?.deleteMedia({ scope: "sheet", refId: existing.mediaRefId }).catch(() => {});
      }
      renderInventory();
      renderAbilities();
      notifySheetChanged(existing ? "item-edited" : "item-created");
    }
    if (isCurrentEditor()) closeItemEditor();
  } catch (error) {
    if (newlyUploadedMedia && submittedScope !== "minerva") window.AbyssCloud?.deleteMedia(newlyUploadedMedia).catch(() => {});
    if (isCurrentEditor()) setItemEditorError(userFacingErrorMessage(error) || "Não foi possível salvar este Item.");
  } finally {
    if (itemEditorForm.dataset.editorToken === submittedToken) {
      saveItemButton.disabled = false;
      saveItemButton.textContent = existing ? "Salvar Alterações" : submittedScope === "minerva" ? "Publicar Item" : "Criar Item";
    }
  }
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
  renderInventoryCapacity();
  renderResourceState();
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
    const icon = createAbilityMediaElement(item, "item-card-icon", item.isWeapon ? "⚔" : "◇");
    const copy = document.createElement("div");
    copy.className = "ability-card-copy";

    const heading = document.createElement("div");
    heading.className = "creation-card-heading";
    const headingMain = document.createElement("div");
    headingMain.className = "creation-card-heading-main";
    const type = document.createElement("small");
    type.textContent = `${inventoryItemQuantityLabel(item)} · ${inventoryItemWeightLabel(item)}`;
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
    if (!item.isWeapon) appendCreationQuickRolls(copy, item, "inventory");

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
  if (isNotebookReadOnly()) return;
  const item = inventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;
  const epoch = notesEpoch;
  const confirmed = await showAbyssConfirm({
    eyebrow: "Inventário",
    title: "Excluir Item?",
    message: `“${item.name}” será removido definitivamente deste Slot.`,
    confirmLabel: "Excluir",
    tone: "danger",
  });
  if (!confirmed || epoch !== notesEpoch || isNotebookReadOnly() || inventoryItems.find((entry) => entry.id === itemId) !== item) return;
  if (item.modifiersActive) setCreationModifiersActive("inventory", item.id, false, { notify: false });
  inventoryItems = inventoryItems.filter((entry) => entry.id !== itemId);
  renderInventory();
  renderAbilities();
  notifySheetChanged("item-deleted");
  if (item.mediaOwner === "slot" && item.mediaRefId) {
    window.AbyssCloud?.deleteMedia({ scope: "sheet", refId: item.mediaRefId }).catch(() => {});
  }
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

  const icon = createAbilityMediaElement(item, "grimoire-item-media item-card-icon", item.isWeapon ? "⚔" : "◇");

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
  const permissions = window.AbyssCloud?.getWalletPermissions?.();
  const editable = Boolean(window.AbyssCloud?.hasActiveSlot()) && !isNotebookReadOnly();
  const canBuy = editable && !permissions?.loading && permissions?.canSpend !== false;
  const purchaseIdentity = getShopPurchaseContext();
  const creditButton = document.querySelector('[data-wallet-action="add"]');
  const debitButton = document.querySelector('[data-wallet-action="remove"]');
  if (creditButton) creditButton.disabled = !editable || !permissions?.canAdd || permissions.loading;
  if (debitButton) debitButton.disabled = !canBuy;
  const walletHelp = document.querySelector("#wallet-credit-help");
  if (walletHelp) {
    walletHelp.textContent = editable ? (permissions?.loading ? "Conferindo permissões da ficha…" : permissions?.reason || "") : "";
    walletHelp.hidden = !walletHelp.textContent;
  }

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
    const card = document.createElement("details");
    card.className = "shop-product shop-product-disclosure";
    card.open = false;
    const summary = document.createElement("summary");
    summary.className = "shop-product-summary";
    const media = createAbilityMediaElement(creation, "shop-product-media", kind === "item" ? (creation.isWeapon ? "⚔" : "◇") : "✦");

    const copy = document.createElement("div");
    copy.className = "shop-product-copy";
    const destination = document.createElement("small");
    const pack = kind === "item" ? sanitizeItemPackage(creation) : null;
    destination.textContent = `${shopDestinationLabel(kind, creation)}${kind === "item" ? `${pack.isPackage ? ` · Pacote com ${pack.packageSize} unidades` : ""} · Peso ${formatInventorySpaces(creation.weight)} por ${pack.isPackage ? "pacote" : "unidade"}` : ""}`;
    const name = document.createElement("h3");
    name.textContent = creation.name;
    const body = document.createElement("div");
    body.className = "shop-product-body";
    const description = document.createElement("div");
    description.className = "shop-product-description";
    setCreationDescription(description, creation);
    copy.append(destination, name);
    if (kind === "item") copy.insertBefore(createItemTypeBadge(creation), name);

    const footer = document.createElement("div");
    footer.className = "shop-product-footer";
    const price = document.createElement("span");
    price.className = "shop-price shop-product-price";
    renderVerdeonAmount(price, creation.shopPrice);
    const chevron = document.createElement("span");
    chevron.className = "shop-product-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
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
    buy.disabled = !canBuy;
    const deliversToInventory = kind === "item" && sanitizeShopDestination(creation.shopDestination) === "inventory";
    const purchaseOptions = document.createElement("div");
    purchaseOptions.className = "shop-purchase-options";
    const total = document.createElement("div");
    total.className = "shop-purchase-total";
    const totalLabel = document.createElement("small");
    totalLabel.textContent = "Total";
    const totalAmount = document.createElement("output");
    totalAmount.setAttribute("aria-live", "polite");
    total.append(totalLabel, totalAmount);
    if (deliversToInventory) {
      const label = document.createElement("label");
      label.className = "shop-purchase-quantity";
      const caption = document.createElement("span");
      caption.textContent = pack?.isPackage ? "Pacotes" : "Quantidade";
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = "9999";
      input.step = "1";
      input.inputMode = "numeric";
      input.dataset.shopQuantity = "";
      input.setAttribute("aria-label", `Quantidade de ${creation.name}`);
      const key = JSON.stringify([purchaseIdentity.ownerUid, purchaseIdentity.slotId, kind, creation.id]);
      renderShop.quantities ||= new Map();
      input.value = renderShop.quantities.get(key) || "1";
      input.disabled = !editable;
      const refreshTotal = () => {
        renderShop.quantities.set(key, input.value);
        const quantity = Number(input.value);
        const valid = Number.isInteger(quantity) && quantity >= 1 && quantity <= 9999;
        input.setCustomValidity(valid ? "" : "Escolha uma quantidade inteira entre 1 e 9.999.");
        buy.disabled = !canBuy || !valid;
        if (valid) renderVerdeonAmount(totalAmount, clampInteger(creation.shopPrice, 0, 999999999, 0) * quantity);
        else totalAmount.textContent = "—";
      };
      input.addEventListener("input", refreshTotal);
      refreshTotal();
      label.append(caption, input);
      purchaseOptions.append(label);
    } else {
      renderVerdeonAmount(totalAmount, creation.shopPrice);
    }
    purchaseOptions.append(total);
    actionGroup.append(open, buy);
    footer.append(purchaseOptions, actionGroup);
    summary.append(media, copy, price, chevron);
    body.append(description, footer);
    card.append(summary, body);
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

function getShopPurchaseContext() {
  const identity = window.AbyssCloud?.getRollContext?.() || {};
  return { epoch: notesEpoch, ownerUid: identity.sheetOwnerUid || "", slotId: identity.slotId || "" };
}

function isShopPurchaseContextCurrent(context) {
  const current = getShopPurchaseContext();
  return context.epoch === current.epoch && context.ownerUid === current.ownerUid && context.slotId === current.slotId && !isNotebookReadOnly();
}

async function adjustWallet(action, rawValue, trigger) {
  if (isNotebookReadOnly()) return false;
  const cloud = window.AbyssCloud;
  if (!cloud?.hasActiveSlot()) {
    await showAbyssAlert({ eyebrow: "Carteira", title: "Escolha um Slot", message: "Entre com o Google e abra uma ficha antes de alterar a Carteira.", tone: "warning", trigger });
    return false;
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1 || value > 999999999) return false;
  const context = getShopPurchaseContext();
  const permissions = cloud.getWalletPermissions?.();
  if (permissions?.loading || permissions?.canSpend === false) {
    await showAbyssAlert({ eyebrow: "Carteira", title: "Carteira indisponível", message: permissions.reason || "Aguarde a confirmação da Carteira desta ficha.", tone: "info", trigger });
    return false;
  }
  if (action === "add" && (!permissions?.canAdd || permissions.loading)) {
    await showAbyssAlert({ eyebrow: "Carteira", title: "Dinheiro da ficha", message: permissions?.reason || "Aguarde a confirmação das permissões desta ficha.", tone: "info", trigger });
    return false;
  }
  if (trigger) trigger.disabled = true;
  try {
    if (!cloud.adjustWalletBalance) throw new Error("Recarregue o site para atualizar a Carteira.");
    const result = await cloud.adjustWalletBalance(action, value, { ownerUid: context.ownerUid, slotId: context.slotId });
    if (isShopPurchaseContextCurrent(context)) {
      walletBalance = clampInteger(result.balance, 0, 999999999, 0);
      renderShop();
      notifySheetChanged(action === "remove" ? "wallet-removed" : "wallet-added");
    }
    return true;
  } catch (error) {
    if (isShopPurchaseContextCurrent(context)) await showAbyssAlert({ eyebrow: "Carteira", title: "Não foi possível alterar o dinheiro", message: error.message || "Tente novamente.", tone: "warning", trigger });
    return false;
  } finally {
    if (trigger?.isConnected) trigger.disabled = false;
    if (isShopPurchaseContextCurrent(context)) renderShop();
  }
}

async function purchaseShopProduct(kind, productId, trigger, requestedQuantity = 1) {
  if (isNotebookReadOnly()) return false;
  const cloud = window.AbyssCloud;
  if (!cloud?.hasActiveSlot()) {
    await showAbyssAlert({ eyebrow: "Loja", title: "Nenhum Slot aberto", message: "Escolha a ficha que receberá esta compra.", tone: "warning", trigger });
    return false;
  }
  const permissions = cloud.getWalletPermissions?.();
  if (permissions?.loading || permissions?.canSpend === false) {
    await showAbyssAlert({ eyebrow: "Loja", title: "Carteira indisponível", message: permissions.reason || "Aguarde a confirmação da Carteira antes de comprar.", tone: "info", trigger });
    return false;
  }
  const catalogSource = kind === "item"
    ? grimoireItems.find(item => item.id === productId && item.shopListed)
    : grimoireAbilities.find(ability => ability.id === productId && ability.shopListed);
  if (!catalogSource) return false;
  const source = JSON.parse(JSON.stringify(catalogSource));
  const sourcePackage = kind === "item" ? sanitizeItemPackage(source) : null;
  const itemDestination = kind === "item" ? sanitizeShopDestination(source.shopDestination) : "";
  const deliversToInventory = kind === "item" && itemDestination === "inventory";
  const quantity = Number(requestedQuantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999 || (!deliversToInventory && quantity !== 1)) {
    await showAbyssAlert({ eyebrow: "Loja", title: "Quantidade inválida", message: deliversToInventory ? "Escolha uma quantidade inteira entre 1 e 9.999." : "Cada habilidade pode ser adquirida uma vez por ficha.", tone: "warning", trigger });
    return false;
  }
  const context = getShopPurchaseContext();
  const pendingKey = JSON.stringify([context.epoch, context.ownerUid, context.slotId]);
  purchaseShopProduct.pendingContexts ||= new Set();
  if (purchaseShopProduct.pendingContexts.has(pendingKey)) return false;
  purchaseShopProduct.pendingContexts.add(pendingKey);
  if (trigger) trigger.disabled = true;
  const warn = (title, message) => showAbyssAlert({ eyebrow: "Loja", title, message, tone: "warning", trigger });
  try {
    const findStack = () => source.ammunitionEnabled ? null : inventoryItems.find(item => !item.ammunitionEnabled
      && item.sourceId === source.id && !item.upgrades?.length
      && parseInventorySpaceValue(item.weight, 1) === parseInventorySpaceValue(source.weight, 1)
      && sanitizeItemType(item.itemType, item.isWeapon) === sanitizeItemType(source.itemType, source.isWeapon)
      && sanitizeItemPackage(item).isPackage === sourcePackage.isPackage
      && (!sourcePackage.isPackage || sanitizeItemPackage(item).packageSize === sourcePackage.packageSize)
      && (source.itemType !== "ammunition" || sanitizeWeaponAmmunition(item).ammunitionType === sanitizeWeaponAmmunition(source).ammunitionType));
    const validateDelivery = async () => {
      if (!deliversToInventory && abilities.some(ability => ability.sourceId === source.id)) {
        await warn("Produto já adquirido", `“${source.name}” já faz parte das Habilidades desta ficha.`);
        return false;
      }
      const stack = deliversToInventory && findStack();
      if (deliversToInventory && (stack ? sanitizeItemPackage(stack).quantity : 0) + quantity > 9999) {
        await warn("Limite do Item atingido", `O Inventário não pode guardar mais de 9.999 unidades de “${source.name}” neste grupo.`);
        return false;
      }
      return true;
    };
    if (!await validateDelivery() || !isShopPurchaseContextCurrent(context)) return false;
    const unitPrice = clampInteger(source.shopPrice, 0, 999999999, 0);
    const price = unitPrice * quantity;
    if (walletBalance < price) {
      await warn("Verdeons insuficientes", `Esta compra custa ${formatVerdeons(price)}, mas a Carteira possui ${formatVerdeons(walletBalance)}.`);
      return false;
    }
    const destinationSection = kind === "item" ? itemDestination : source.section;
    const delivered = deliversToInventory ? sanitizeInventoryItem({
      ...source, ...sourcePackage, id: createAbilityId("item"), sourceId: source.id, quantity,
      packageRemaining: sourcePackage.isPackage ? quantity * sourcePackage.packageSize : 0,
      equipped: false, upgrades: [], modifiersActive: false,
      modifiers: (source.modifiers || []).map(modifier => ({ ...modifier, resolvedValue: 0 })),
      shopListed: false, shopPrice: 0, shopDestination: "inventory", shopEchoKey: "",
    }) : sanitizeAbility({
      ...source, id: createAbilityId("ability"), section: destinationSection,
      echoKey: destinationSection === "echoes" ? (kind === "item" ? source.shopEchoKey : source.echoKey) : "",
      origin: source.origin || (kind === "item" ? "Item da Loja" : ""), sourceId: source.id,
      mediaOwner: source.mediaRefId ? "minerva" : "link", modifiersActive: false,
      modifiers: (source.modifiers || []).map(modifier => ({ ...modifier, resolvedValue: 0 })),
      shopListed: false, shopPrice: 0,
    });
    if (!delivered) { await warn("Destino inválido", "Este produto não possui os dados necessários para ser entregue no destino escolhido."); return false; }
    const confirmed = await showAbyssConfirm({
      eyebrow: "Loja", title: `Comprar ${source.name}?`,
      message: `${formatVerdeons(price)} serão descontados da Carteira por ${quantity} ${sourcePackage?.isPackage ? quantity === 1 ? "pacote" : "pacotes" : quantity === 1 ? "unidade" : "unidades"}.${sourcePackage?.isPackage ? ` Cada pacote contém ${sourcePackage.packageSize} unidades.` : ""}\n\nDestino: ${shopDestinationLabel(kind, source)}.${deliversToInventory ? `\nPeso total: ${formatInventorySpaces(parseInventorySpaceValue(source.weight, 1) * quantity)} espaços.` : ""}`,
      confirmLabel: price ? "Comprar" : "Obter", tone: "info", trigger,
    });
    if (!confirmed || !isShopPurchaseContextCurrent(context) || !await validateDelivery() || !isShopPurchaseContextCurrent(context)) return false;
    if (!cloud.commitShopPurchase || !window.AbyssSheet?.captureState) throw new Error("Recarregue o site para atualizar a Loja.");
    const historyEntry = sanitizePurchaseHistoryEntry({
      id: createAbilityId("purchase"), productId: source.id, name: source.name, kind,
      destination: destinationSection, echoKey: kind === "item" ? source.shopEchoKey : source.echoKey,
      price, quantity, purchasedAt: new Date().toISOString(),
    });
    const state = JSON.parse(JSON.stringify(window.AbyssSheet.captureState()));
    const stack = deliversToInventory ? findStack() : null;
    if (stack) {
      const stagedStack = state.inventory.find(item => item.id === stack.id);
      if (!stagedStack) throw new Error("O Inventário mudou. Tente a compra novamente.");
      Object.assign(stagedStack, sanitizeItemPackage(stagedStack));
      stagedStack.quantity += quantity;
      if (stagedStack.isPackage) stagedStack.packageRemaining += quantity * sourcePackage.packageSize;
    } else (deliversToInventory ? state.inventory : state.abilities).push(delivered);
    state.profile.purchaseHistory = [historyEntry, ...purchaseHistory].filter(Boolean).slice(0, MAX_PURCHASE_HISTORY);
    let applied = false;
    const applyPurchase = result => {
      if (!result?.committed || applied || !isShopPurchaseContextCurrent(context)) return;
      applied = true;
      if (deliversToInventory) {
        const liveStack = stack && inventoryItems.find(item => item.id === stack.id);
        if (liveStack) {
          Object.assign(liveStack, sanitizeItemPackage(liveStack));
          liveStack.quantity += quantity;
          if (liveStack.isPackage) liveStack.packageRemaining += quantity * sourcePackage.packageSize;
        }
        else inventoryItems.push(delivered);
        renderInventory();
      } else { abilities.push(delivered); renderAbilities(); }
      walletBalance = clampInteger(result.balance, 0, 999999999, 0);
      if (historyEntry) purchaseHistory = [historyEntry, ...purchaseHistory].slice(0, MAX_PURCHASE_HISTORY);
      renderShop();
      renderPurchaseHistory();
      notifySheetChanged("shop-purchase");
    };
    const result = await cloud.commitShopPurchase({ cost: price, state, ownerUid: context.ownerUid, slotId: context.slotId, onCommitted: applyPurchase });
    if (!result?.committed) throw new Error("A compra não foi confirmada. Tente novamente.");
    // The cloud bridge runs this callback while autosaves are locked. Calling it
    // again is harmless and also accommodates bridges that return immediately.
    if (result.committed) applyPurchase(result);
    if (!isShopPurchaseContextCurrent(context)) return Boolean(result.committed);
    await showAbyssAlert({ eyebrow: "Compra concluída", title: source.name,
      message: `${quantity} ${sourcePackage?.isPackage ? quantity === 1 ? "pacote foi enviado" : "pacotes foram enviados" : quantity === 1 ? "unidade foi enviada" : "unidades foram enviadas"} para ${shopDestinationLabel(kind, source)}.`, tone: "info", trigger });
    return true;
  } catch (error) {
    if (isShopPurchaseContextCurrent(context)) await warn("Não foi possível concluir a compra", error.message || "Tente novamente.");
    return false;
  } finally {
    purchaseShopProduct.pendingContexts.delete(pendingKey);
    if (trigger?.isConnected) trigger.disabled = false;
  }
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
  const category = entry && ["powers", "spells"].includes(entry.type) ? grimoirePickerCategory(entry.creation, entry.type) : null;
  const entitySource = category && GRIMOIRE_POWER_TAG_IMAGES[category.key];
  const showDefault = () => {
    symbol.replaceChildren();
    delete symbol.dataset.customImage;
    delete symbol.dataset.entity;
    const drawing = entry?.kind === "item"
      ? '<path d="m4 7 8-4 8 4v10l-8 4-8-4Z M4 7l8 4 8-4 M12 11v10"></path>'
      : '<path d="M12 5v15M12 5C8 3 5 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1ZM5 8l4 1M5 12l4 1M15 8l4-1M15 12l4-1"></path>';
    symbol.innerHTML = `<svg viewBox="0 0 24 24">${drawing}</svg>`;
  };
  const showFallback = () => {
    showDefault();
    if (!entitySource) return;
    const image = document.createElement("img");
    image.src = entitySource;
    image.alt = "";
    image.draggable = false;
    image.decoding = "async";
    image.addEventListener("error", showDefault, { once: true });
    symbol.replaceChildren(image);
    symbol.dataset.entity = category.key;
  };
  const customSource = safeAbilityMediaUrl(entry?.creation?.mediaUrl);
  if (customSource) {
    const image = document.createElement("img");
    image.src = customSource;
    image.alt = "";
    image.draggable = false;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", showFallback, { once: true });
    symbol.dataset.customImage = "true";
    symbol.append(image);
  } else {
    showFallback();
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
    ? `${formatVerdeons(creation.shopPrice)} por unidade · Peso ${formatInventorySpaces(creation.weight)} espaços · Destino: ${shopDestinationLabel("item", creation)}`
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
    ? `${formatVerdeons(creation.shopPrice)} por unidade · Peso ${formatInventorySpaces(creation.weight)} espaços · Destino: ${shopDestinationLabel("item", creation)}`
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
    document.querySelector("#minerva-safety-modal"),
  ]
    .some((modal) => modal && !modal.hidden);
  if (hasOpenModal && !themeModal.hidden) closeThemeEditor({ restoreFocus: false });
  document.body.classList.toggle("modal-open", hasOpenModal);
}

window.addEventListener("abyss:minerva-restored", () => {
  if (!window.AbyssCloud?.isMinervaAdmin?.()) return;
  refreshGrimoireFromCloud().catch((error) => {
    if (minervaModal.hidden) return;
    minervaEmpty.textContent = userFacingErrorMessage(error) || "A restauração foi salva. Reabra o Grimório para atualizar a lista.";
    minervaEmpty.hidden = false;
  });
});

