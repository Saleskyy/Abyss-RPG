"use strict";
function updateTrainingIndicator(row, trainingKey) {
  row.dataset.training = trainingKey;
  row.classList.toggle("is-leigo", trainingKey === "leigo");
  row.classList.toggle("is-adepto", trainingKey === "adepto");
  row.classList.toggle("is-treinado", trainingKey === "treinado");
}

function filterSkills() {
  const nameQuery = normalizeSearchTerm(skillSearchInput.value);
  const selectedAttribute = attributeFilter.value;
  const selectedTraining = trainingFilter.value;
  let visibleCount = 0;

  skillFilterEntries.forEach(({ row, name, attributeSelect, trainingSelect }) => {
    const currentAttribute = attributeSelect.value;
    const currentTraining = trainingSelect.value;
    const matchesName = name.includes(nameQuery);
    const matchesAttribute = selectedAttribute === "all" || currentAttribute === selectedAttribute;
    const matchesTraining = selectedTraining === "all" || currentTraining === selectedTraining;
    const isVisible = matchesName && matchesAttribute && matchesTraining;

    row.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  skillsEmpty.hidden = visibleCount !== 0;
}

function clearSkillFilters() {
  skillSearchInput.value = "";
  attributeFilter.value = "all";
  trainingFilter.value = "all";
  filterSkills();
  skillSearchInput.focus();
}

function featureDisplayName(feature) {
  return feature.type === "specialization"
    ? `${feature.name} — ${feature.ability}`
    : feature.name;
}

function createUseCard(use) {
  const card = document.createElement("article");
  card.className = "skill-use-card";

  const heading = document.createElement("h4");
  heading.textContent = use.name;

  const description = document.createElement("p");
  description.textContent = use.text;

  card.append(heading, description);
  return card;
}

function loadSelectedFeatures() {
  selectedFeatureIds.clear();
}

function persistSelectedFeatures() {
  // Persistido junto ao Slot da conta Firebase.
}

function renderSelectedFeatures() {
  const selected = FEATURE_CATALOG.filter((feature) => selectedFeatureIds.has(feature.id));
  selectedFeaturesCount.textContent = `${selected.length} ${selected.length === 1 ? "adicionada" : "adicionadas"}`;
  selectedFeaturesEmpty.hidden = selected.length !== 0;
  selectedFeaturesList.hidden = selected.length === 0;
  selectedFeaturesList.replaceChildren();

  selected.forEach((feature) => {
    const card = document.createElement("article");
    card.className = "selected-feature-card";
    card.dataset.featureId = feature.id;

    const star = document.createElement("span");
    star.className = "selected-feature-star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "✦";

    const copy = document.createElement("div");
    copy.className = "selected-feature-copy";

    const metadata = document.createElement("small");
    metadata.textContent = feature.type === "competency"
      ? `Competência · ${feature.skillName}`
      : `Especialização · ${feature.skillName} › ${feature.competencyName}`;

    const name = document.createElement("strong");
    name.className = "selected-feature-name";
    name.textContent = featureDisplayName(feature);

    const summary = document.createElement("p");
    summary.textContent = feature.description;

    const actions = document.createElement("div");
    actions.className = "selected-feature-actions";

    const open = document.createElement("button");
    open.className = "selected-feature-open";
    open.type = "button";
    open.dataset.openSelectedFeature = feature.id;
    open.textContent = "Abrir";
    open.setAttribute("aria-label", `Abrir informações de ${featureDisplayName(feature)}`);

    const remove = document.createElement("button");
    remove.className = "selected-feature-remove";
    remove.type = "button";
    remove.dataset.removeSelectedFeature = feature.id;
    remove.textContent = "Remover";
    remove.setAttribute("aria-label", `Remover ${featureDisplayName(feature)} da ficha`);

    actions.append(open, remove);
    copy.append(metadata, name, summary);
    card.append(star, copy, actions);
    selectedFeaturesList.append(card);
  });
}

function syncFeatureDetailState() {
  if (!activeFeatureId) return;
  const isAdded = selectedFeatureIds.has(activeFeatureId);
  featureDetailDialog.classList.toggle("is-added", isAdded);
  featureToggleButton.classList.toggle("is-added", isAdded);
  featureToggleButton.setAttribute("aria-pressed", String(isAdded));
  featureToggleButton.querySelector("span").textContent = isAdded ? "Remover da ficha" : "Adicionar à ficha";
}

function scheduleConstellationDraw() {
  window.cancelAnimationFrame(constellationDrawFrame);
  constellationDrawFrame = window.requestAnimationFrame(drawConstellationConnections);
}

function refreshConstellationSelectionStates() {
  constellationTree.querySelectorAll("[data-feature-id]").forEach((node) => {
    node.classList.toggle("is-added", selectedFeatureIds.has(node.dataset.featureId));
  });
  if (!constellationModal.hidden) scheduleConstellationDraw();
}

function toggleFeatureSelection(featureId) {
  if (!FEATURE_BY_ID.has(featureId)) return;
  if (selectedFeatureIds.has(featureId)) {
    selectedFeatureIds.delete(featureId);
  } else {
    selectedFeatureIds.add(featureId);
  }
  persistSelectedFeatures();
  renderSelectedFeatures();
  refreshConstellationSelectionStates();
  syncFeatureDetailState();
  notifySheetChanged("feature-selection");
}

function createConstellationNode(feature, type) {
  const button = document.createElement("button");
  button.className = `constellation-node is-${type}`;
  button.type = "button";
  button.dataset.featureId = feature.id;
  button.dataset.openFeature = feature.id;
  button.classList.toggle("is-added", selectedFeatureIds.has(feature.id));
  button.setAttribute("aria-label", `Abrir informações de ${featureDisplayName(feature)}`);

  const star = document.createElement("span");
  star.className = "constellation-node-star";
  star.setAttribute("aria-hidden", "true");
  star.textContent = "✦";

  const kind = document.createElement("small");
  kind.textContent = feature.type === "competency" ? "Competência" : "Especialização";

  const name = document.createElement("strong");
  name.textContent = feature.name;

  const detail = document.createElement("em");
  if (feature.type === "competency") {
    const useLabel = feature.uses.length === 1 ? "uso" : "usos";
    const specializationLabel = feature.specializationCount === 1 ? "especialização" : "especializações";
    detail.textContent = `${feature.uses.length} ${useLabel} · ${feature.specializationCount} ${specializationLabel}`;
  } else {
    detail.textContent = `[${feature.ability}]`;
  }

  button.append(star, kind, name, detail);
  return button;
}

function renderConstellation(skill) {
  const competencies = COMPETENCY_TREES[skill.name] || [];
  constellationTree.replaceChildren();
  constellationEmpty.hidden = competencies.length !== 0;
  constellationTree.hidden = competencies.length === 0;

  competencies.forEach((competency) => {
    const branch = document.createElement("section");
    branch.className = "constellation-branch";

    const connections = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    connections.classList.add("constellation-connections");
    connections.setAttribute("aria-hidden", "true");

    const core = document.createElement("div");
    core.className = "constellation-core";
    const competencyId = makeFeatureId("competency", skill.name, competency.name);
    const competencyFeature = FEATURE_BY_ID.get(competencyId);
    core.append(createConstellationNode(competencyFeature, "competency"));

    const children = document.createElement("div");
    children.className = "constellation-children";
    competency.specializations.forEach((specialization) => {
      const specializationId = makeFeatureId(
        "specialization",
        skill.name,
        competency.name,
        specialization.name,
        specialization.ability,
      );
      children.append(createConstellationNode(FEATURE_BY_ID.get(specializationId), "specialization"));
    });
    children.hidden = competency.specializations.length === 0;

    branch.append(connections, core, children);
    constellationTree.append(branch);
  });

  scheduleConstellationDraw();
}

function drawConstellationConnections() {
  if (constellationModal.hidden) return;

  constellationTree.querySelectorAll(".constellation-branch").forEach((branch) => {
    const svg = branch.querySelector(".constellation-connections");
    const core = branch.querySelector(".constellation-node.is-competency");
    const children = [...branch.querySelectorAll(".constellation-node.is-specialization")];
    svg.replaceChildren();
    if (!core || children.length === 0) return;

    const branchRect = branch.getBoundingClientRect();
    const coreRect = core.getBoundingClientRect();
    const width = branch.clientWidth;
    const height = branch.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");

    const startX = coreRect.left - branchRect.left + coreRect.width / 2;
    const startY = coreRect.bottom - branchRect.top;
    children.forEach((child) => {
      const childRect = child.getBoundingClientRect();
      const endX = childRect.left - branchRect.left + childRect.width / 2;
      const endY = childRect.top - branchRect.top;
      const bendY = startY + (endY - startY) * 0.5;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${startX} ${startY} C ${startX} ${bendY}, ${endX} ${bendY}, ${endX} ${endY}`);
      path.classList.toggle("is-lit", selectedFeatureIds.has(child.dataset.featureId));
      svg.append(path);
    });
  });
}

function openConstellation(triggerButton) {
  const skill = SKILLS[activeSkillInfoIndex];
  if (!skill || !(COMPETENCY_TREES[skill.name] || []).length) return;

  activeConstellationTrigger = triggerButton;
  constellationAttribute.textContent = skill.attribute;
  constellationTitle.textContent = skill.name;
  renderConstellation(skill);
  skillInfoModal.inert = true;
  constellationModal.hidden = false;
  syncModalLock();
  constellationDialog.querySelector(".constellation-content").scrollTop = 0;
  constellationDialog.focus();
  scheduleConstellationDraw();
}

function closeConstellation() {
  constellationModal.hidden = true;
  skillInfoModal.inert = false;
  syncModalLock();
  if (activeConstellationTrigger?.isConnected) activeConstellationTrigger.focus();
}

function openFeatureDetail(featureId, triggerButton) {
  const feature = FEATURE_BY_ID.get(featureId);
  if (!feature) return;

  activeFeatureId = featureId;
  activeFeatureTrigger = triggerButton;
  featureDetailType.textContent = feature.type === "competency" ? "Competência" : "Especialização";
  featureDetailTitle.textContent = feature.name;
  featureDetailContext.textContent = feature.type === "competency"
    ? feature.skillName
    : `${feature.skillName} · ${feature.competencyName}`;

  const isCompetency = feature.type === "competency";
  featureDetailDescription.hidden = !isCompetency;
  featureDetailDescription.textContent = isCompetency ? feature.description : "";
  featureDetailAbility.hidden = isCompetency;
  featureDetailUsesSection.hidden = !isCompetency || feature.uses.length === 0;
  featureDetailUses.replaceChildren();

  if (isCompetency) {
    feature.uses.forEach((use) => featureDetailUses.append(createUseCard(use)));
  } else {
    featureDetailAbilityName.textContent = feature.ability;
    featureDetailAbilityText.textContent = feature.description;
  }

  syncFeatureDetailState();
  if (!constellationModal.hidden) constellationModal.inert = true;
  featureDetailModal.hidden = false;
  syncModalLock();
  featureDetailDialog.querySelector(".feature-detail-content").scrollTop = 0;
  featureDetailDialog.focus();
}

function closeFeatureDetail() {
  featureDetailModal.hidden = true;
  constellationModal.inert = false;
  syncModalLock();
  if (activeFeatureTrigger?.isConnected) {
    activeFeatureTrigger.focus();
  } else if (!constellationModal.hidden) {
    constellationDialog.focus();
  }
}

function openSkillInfo(skillIndex, triggerButton) {
  const skill = SKILLS[skillIndex];
  const details = SKILL_DETAILS[skill?.name];
  if (!skill || !details) return;

  activeSkillInfoButton = triggerButton;
  activeSkillInfoIndex = skillIndex;
  skillInfoAttribute.textContent = skill.attribute;
  skillInfoTitle.textContent = skill.name;
  skillInfoDescription.textContent = details.description;
  skillInfoNotes.replaceChildren();
  skillInfoUses.replaceChildren();

  const notes = details.notes || [];
  notes.forEach((noteText) => {
    const note = document.createElement("p");
    note.className = "skill-info-note";
    note.textContent = noteText;
    skillInfoNotes.append(note);
  });
  skillInfoNotes.hidden = notes.length === 0;

  details.uses.forEach((use) => {
    const card = document.createElement("article");
    card.className = "skill-use-card";

    const heading = document.createElement("h4");
    heading.textContent = use.name;

    const description = document.createElement("p");
    description.textContent = use.text;

    card.append(heading, description);
    skillInfoUses.append(card);
  });
  skillInfoUsesSection.hidden = details.uses.length === 0;

  const competencyCount = (COMPETENCY_TREES[skill.name] || []).length;
  openConstellationButton.disabled = competencyCount === 0;
  openConstellationButton.querySelector("span").textContent = competencyCount === 0
    ? "Sem Competências"
    : "Competências";
  openConstellationButton.title = competencyCount === 0
    ? "Nenhuma Competência cadastrada para esta perícia"
    : `Abrir ${competencyCount === 1 ? "a Competência" : "as Competências"} de ${skill.name}`;

  skillInfoModal.hidden = false;
  syncModalLock();
  skillInfoDialog.querySelector(".skill-info-content").scrollTop = 0;
  skillInfoDialog.focus();
}

function closeSkillInfo() {
  skillInfoModal.hidden = true;
  syncModalLock();
  if (activeSkillInfoButton?.isConnected) activeSkillInfoButton.focus();
}

function changeView(viewName) {
  viewButtons.forEach((button) => {
    const isCurrent = button.dataset.viewTarget === viewName;
    button.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  views.forEach((view) => {
    const isCurrent = view.dataset.view === viewName;
    view.hidden = !isCurrent;
    view.classList.toggle("is-active", isCurrent);

    if (isCurrent) {
      view.classList.remove("is-entering");
      requestAnimationFrame(() => view.classList.add("is-entering"));
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function parseDiceModifier(rawValue) {
  const compact = String(rawValue ?? "").trim().toLowerCase()
    .replace(/[−–—]/g, "-").replace(/\s+/g, "");
  const empty = { terms: [], count: 0, faces: 0, formula: "", error: "" };
  if (!compact) return empty;
  const formatError = "Use dados separados por +, − ou vírgula. Ex.: 1d8 + 1d12 − 1d4.";
  const parts = compact.split(",");
  if (parts.some((part) => !part)) return { ...empty, error: formatError };
  const expression = parts.map((part, index) => index && !/^[+-]/.test(part) ? `+${part}` : part).join("");
  const pattern = /([+-]?)(\d*)d(\d+)/g;
  const terms = [];
  let cursor = 0;
  let totalDice = 0;
  let match;
  while ((match = pattern.exec(expression))) {
    if (match.index !== cursor || (terms.length && !match[1])) return { ...empty, error: formatError };
    const count = Number(match[2] || 1);
    const faces = Number(match[3]);
    if (!Number.isInteger(count) || count < 1 || count > 20 || !Number.isInteger(faces) || faces < 2 || faces > 1000) {
      return { ...empty, error: "Cada grupo pode ter de 1 a 20 dados, com 2 a 1000 faces." };
    }
    totalDice += count;
    terms.push({ sign: match[1] === "-" ? -1 : 1, count, faces });
    cursor = pattern.lastIndex;
  }
  if (cursor !== expression.length || !terms.length) return { ...empty, error: formatError };
  if (terms.length > 30 || totalDice > 100) {
    return { ...empty, error: "Use no máximo 30 grupos e 100 dados extras no total." };
  }
  const formula = terms.map((term, index) => `${term.sign < 0 ? index ? " − " : "− " : index ? " + " : ""}${term.count}d${term.faces}`).join("");
  return { terms, count: totalDice, faces: terms.length === 1 ? terms[0].faces : 0, formula, error: "" };
}

function rollDiceModifier(modifier) {
  const groups = (modifier.terms || []).map((term) => {
    const results = rollDice(term.count, term.faces);
    return { ...term, results, total: term.sign * sum(results) };
  });
  const total = sum(groups.map((group) => group.total));
  const breakdown = groups.map((group, index) => {
    const sign = group.sign < 0 ? index ? " − " : "− " : index ? " + " : "";
    return `${sign}${group.count}d${group.faces} [${group.results.join(" + ")}]`;
  }).join("");
  return { groups, total, breakdown };
}

function normalizeMainDiceCountValue(value) {
  const parsed = Number.parseInt(String(value ?? "").trim().replace(/[−–—]/g, "-"), 10);
  return Number.isFinite(parsed) ? Math.min(20, Math.max(-20, parsed)) : 0;
}

function rollTrainingDice(adjustment, faces) {
  const advantage = normalizeMainDiceCountValue(adjustment);
  const count = Math.abs(advantage) + 1;
  const results = rollDice(count, faces);
  const result = advantage < 0 ? Math.min(...results) : Math.max(...results);
  const selection = count === 1 ? "único" : advantage < 0 ? "pior" : "melhor";
  const formula = `${count}d${faces}${count > 1 ? ` (${selection})` : ""}`;
  return { count, results, result, selection, formula };
}

function normalizeMainDiceCount(input) {
  const count = normalizeMainDiceCountValue(input.value);
  input.value = String(count);
  return count;
}

function rollDice(count, faces) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * faces) + 1);
}



function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatSigned(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

function evaluateOutcome(faces, naturalResult, total, difficultyKey) {
  const difficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.medium;

  if (naturalResult === 1) return OUTCOMES.criticalFailure;
  if (faces === 8 && naturalResult === 8) return OUTCOMES.normal;

  let outcome;
  if (total <= difficulty.failureMax[faces]) {
    outcome = OUTCOMES.failure;
  } else if (faces === 8 || total <= difficulty.partialMax[faces]) {
    outcome = OUTCOMES.partial;
  } else if (total <= difficulty.normalMax[faces]) {
    outcome = OUTCOMES.normal;
  } else {
    outcome = OUTCOMES.good;
  }

  const isSuccessful = outcome !== OUTCOMES.failure;
  const isExtremeNatural = (faces === 12 && naturalResult === 12) || (faces === 20 && naturalResult === 19);
  return isSuccessful && isExtremeNatural ? OUTCOMES.extreme : outcome;
}

function selectDifficulty(difficultyKey) {
  if (!DIFFICULTIES[difficultyKey]) return;
  selectedDifficulty = difficultyKey;

  difficultyButtons.forEach((button) => {
    const isSelected = button.dataset.difficulty === difficultyKey;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  notifySheetChanged("difficulty");
}

function clearOutcomeStyle() {
  rollDialog.classList.remove(...OUTCOME_CLASS_NAMES);
  rollDialog.classList.remove("is-special-result");
}

function setRollingDie(faces, value) {
  const label = rollingDie.querySelector("text");
  if (rollingDie.dataset.faces === String(faces) && label && value !== null) {
    label.textContent = String(value);
  } else {
    rollingDie.innerHTML = dieSvg(faces, value);
    rollingDie.dataset.faces = String(faces);
  }
  rollingDie.setAttribute("aria-label", `Dado de ${faces} faces mostrando ${value}`);
}

function addBreakdownLine(label, detail, value, signed = true) {
  const line = document.createElement("div");
  line.className = "breakdown-line";

  const copy = document.createElement("span");
  copy.textContent = label;

  const metadata = document.createElement("small");
  metadata.textContent = detail;
  copy.append(metadata);

  const amount = document.createElement("strong");
  amount.textContent = signed ? formatSigned(value) : String(value);

  line.append(copy, amount);
  document.querySelector("#result-breakdown").append(line);
}

function showSpecialTestResult({
  title,
  context,
  icon = "",
  outcome,
  outcomeDetail,
  outcomeKey = "",
  total,
  breakdown = [],
  trigger,
}) {
  clearRollTimers();
  clearOutcomeStyle();
  rollDialog.classList.add("is-special-result");
  if (outcomeKey) rollDialog.classList.add(`outcome-${outcomeKey}`);
  activeRollButton = trigger;
  resultEyebrow.textContent = "Teste Especial";
  document.querySelector("#result-skill").textContent = title;
  const contextElement = document.querySelector("#result-context");
  contextElement.textContent = context;
  const sourceIcon = icon ? document.querySelector(`[data-special-test="${icon}"] .special-test-icon svg`) : null;
  if (sourceIcon) {
    const drawing = sourceIcon.cloneNode(true);
    drawing.style.color = getComputedStyle(sourceIcon).color;
    contextElement.prepend(drawing);
  }
  resultOutcomeLabel.textContent = outcome;
  resultDifficultyLabel.textContent = outcomeDetail;
  document.querySelector("#result-total").textContent = String(total);
  document.querySelector("#result-breakdown").replaceChildren();
  breakdown.forEach((line) => addBreakdownLine(line.label, line.detail, line.value, line.signed));
  resultSummary.hidden = false;
  rollModal.hidden = false;
  syncModalLock();
  rollDialog.focus();
  window.AbyssCloud?.recordRoll?.({ kind: "special", title, total, formula: context, breakdown, outcome: outcomeKey, outcomeLabel: outcome, context: window.AbyssCloud?.getRollContext?.() });
}

function clearRollTimers() {
  window.clearInterval(rollInterval);
  window.clearTimeout(rollTimeout);
}

function closeRollModal() {
  clearRollTimers();
  rollModal.hidden = true;
  syncModalLock();
  if (activeRollButton?.isConnected) activeRollButton.focus();
}

function rollSkill(skillIndex, triggerButton) {
  const skill = SKILLS[skillIndex];
  const trainingSelect = document.querySelector(`[data-training-index="${skillIndex}"]`);
  const attributeSelect = document.querySelector(`[data-skill-attribute="${skillIndex}"]`);
  const mainDiceInput = document.querySelector(`[data-main-dice-count="${skillIndex}"]`);
  const diceInput = document.querySelector(`[data-dice-modifier="${skillIndex}"]`);
  const fixedInput = document.querySelector(`[data-fixed-modifier="${skillIndex}"]`);
  const diceModifier = parseDiceModifier(diceInput.value);

  diceInput.setCustomValidity(diceModifier.error);
  diceInput.classList.toggle("is-invalid", Boolean(diceModifier.error));
  diceInput.toggleAttribute("aria-invalid", Boolean(diceModifier.error));
  if (diceModifier.error) {
    diceInput.reportValidity();
    diceInput.focus();
    return;
  }

  playRollSound();
  const training = TRAINING[trainingSelect.value];
  const attribute = attributeSelect.value;
  const attributeValue = getAttributeValue(attribute);
  const attributeRoll = rollAttributeDice(attributeValue);
  const attributeMagnitude = Math.abs(attributeRoll.total);
  const attributePenalty = attributeValue <= 0 ? attributeMagnitude : 0;
  const attributeBonus = attributeValue > 0 ? attributeMagnitude : 0;
  const attributeResult = attributeBonus - attributePenalty;
  const attributeFormula = attributeRoll.formula;
  const attributeBreakdown = attributeRoll.breakdown;
  const parsedFixed = Number.parseInt(fixedInput.value, 10);
  const fixedModifier = Number.isFinite(parsedFixed) ? parsedFixed : 0;
  const mainDiceCount = normalizeMainDiceCount(mainDiceInput);
  const trainingRoll = rollTrainingDice(mainDiceCount, training.die);
  const mainDiceQuantity = trainingRoll.count;
  const mainResults = trainingRoll.results;
  const mainResult = trainingRoll.result;
  const mainDiceFormula = trainingRoll.formula;
  const extraRoll = rollDiceModifier(diceModifier);
  const extraTotal = extraRoll.total;
  const grantedModifiers = rollActiveCreationModifiers("skill", getSkillKey(skill));
  const total = mainResult + attributeBonus - attributePenalty + extraTotal + fixedModifier + grantedModifiers.total;
  const baseFormula = `${mainDiceFormula} ${attributeValue <= 0 ? "" : "+ "}${attributeFormula}`;
  const extraFormula = extraRoll.groups.length ? `${diceModifier.terms[0].sign < 0 ? " " : " + "}${diceModifier.formula}` : "";
  const fixedFormula = fixedModifier ? ` ${fixedModifier < 0 ? "−" : "+"} ${Math.abs(fixedModifier)}` : "";
  const grantedFormula = grantedModifiers.total ? ` ${grantedModifiers.total < 0 ? "−" : "+"} ${Math.abs(grantedModifiers.total)}` : "";
  const rollFormula = baseFormula + extraFormula + fixedFormula + grantedFormula;
  const rollContext = window.AbyssCloud?.getRollContext?.();
  const difficulty = DIFFICULTIES[selectedDifficulty];
  const outcome = evaluateOutcome(training.die, mainResult, total, selectedDifficulty);

  clearRollTimers();
  clearOutcomeStyle();
  activeRollButton = triggerButton;
  resultEyebrow.textContent = "Teste de perícia";
  document.querySelector("#result-skill").textContent = skill.name;
  document.querySelector("#result-context").textContent = `${training.label} · ${rollFormula} · ${attribute} (${attributeValue})`;
  document.querySelector("#roll-status").textContent = `Rolando ${mainDiceFormula}...`;
  resultOutcomeLabel.textContent = outcome.label;
  resultDifficultyLabel.textContent = `Zona ${difficulty.label}`;
  document.querySelector("#result-total").textContent = total;
  document.querySelector("#result-breakdown").replaceChildren();
  resultSummary.hidden = true;

  setRollingDie(training.die, Math.floor(Math.random() * training.die) + 1);
  rollingDie.classList.remove("is-settled", "is-rolling");
  void rollingDie.offsetWidth;
  rollingDie.classList.add("is-rolling");

  rollModal.hidden = false;
  syncModalLock();
  rollDialog.focus();

  rollInterval = window.setInterval(() => {
    setRollingDie(training.die, Math.floor(Math.random() * training.die) + 1);
  }, 72);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  rollTimeout = window.setTimeout(() => {
    window.clearInterval(rollInterval);
    setRollingDie(training.die, mainResult);
    rollingDie.classList.remove("is-rolling");
    rollingDie.classList.add("is-settled");
    document.querySelector("#roll-status").textContent = `${mainDiceQuantity > 1 ? mainDiceCount < 0 ? "Pior resultado natural" : "Melhor resultado natural" : "Resultado natural"}: ${mainResult}`;
    rollDialog.classList.add(`outcome-${outcome.key}`);

    const mainDiceDetail = `${training.label} · ${mainDiceFormula} → ${mainResults.join(" · ")} → ${mainResult}`;
    addBreakdownLine(mainDiceQuantity > 1 ? "Dados principais" : "Dado principal", mainDiceDetail, mainResult, false);
    addBreakdownLine("Dado de Atributo", `${attribute} · ${ATTRIBUTES[attribute]} · ${attributeBreakdown}${attributePenalty ? " · subtraído do total" : ""}`, attributeResult);
    if (extraRoll.groups.length) {
      addBreakdownLine("Dados extras", extraRoll.breakdown, extraTotal);
    }
    if (fixedModifier !== 0) {
      addBreakdownLine("Modificador fixo", "Valor informado", fixedModifier);
    }
    if (grantedModifiers.total || grantedModifiers.breakdown.length) {
      addBreakdownLine(
        "Modificadores concedidos",
        grantedModifiers.breakdown.join(" · "),
        grantedModifiers.total,
      );
    }

    resultSummary.hidden = false;
  }, reducedMotion ? 120 : 920);
  window.AbyssCloud?.recordRoll?.({
      kind: "skill", title: skill.name, total, natural: mainResult, outcome: outcome.key, outcomeLabel: outcome.label,
      difficulty: difficulty.label, context: rollContext,
      soundDelay: reducedMotion ? 120 : 920,
      formula: rollFormula,
      breakdown: [`Treinamento: ${mainDiceFormula} → ${mainResults.join(" · ")} → ${mainResult}`, `Atributo ${attribute}: ${attributeBreakdown} → ${attributeResult}`,
        `Dados extras: ${extraRoll.breakdown || "0"} → ${extraTotal}`, `Modificador fixo: ${fixedModifier}`, ...grantedModifiers.breakdown, `Total: ${total}`],
  });
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getPhotoEditorScale() {
  if (!photoEditorState.image) return 1;
  const viewportWidth = photoEditorViewport.clientWidth || 1;
  const viewportHeight = photoEditorViewport.clientHeight || viewportWidth;
  const coverScale = Math.max(
    viewportWidth / photoEditorState.image.naturalWidth,
    viewportHeight / photoEditorState.image.naturalHeight,
  );
  return coverScale * photoEditorState.zoom;
}

function clampPhotoEditorPosition() {
  if (!photoEditorState.image) return;
  const viewportWidth = photoEditorViewport.clientWidth || 1;
  const viewportHeight = photoEditorViewport.clientHeight || viewportWidth;
  const scale = getPhotoEditorScale();
  const maximumX = Math.max(
    0,
    (photoEditorState.image.naturalWidth * scale - viewportWidth) / 2,
  );
  const maximumY = Math.max(
    0,
    (photoEditorState.image.naturalHeight * scale - viewportHeight) / 2,
  );
  photoEditorState.x = clamp(photoEditorState.x, -maximumX, maximumX);
  photoEditorState.y = clamp(photoEditorState.y, -maximumY, maximumY);
}

function renderPhotoEditor() {
  if (!photoEditorState.image) return;
  clampPhotoEditorPosition();
  const scale = getPhotoEditorScale();
  const viewportWidth = photoEditorViewport.clientWidth || 1;
  const viewportHeight = photoEditorViewport.clientHeight || viewportWidth;
  photoEditorImage.style.width = `${photoEditorState.image.naturalWidth}px`;
  photoEditorImage.style.height = `${photoEditorState.image.naturalHeight}px`;
  photoEditorImage.style.left = `${viewportWidth / 2 + photoEditorState.x}px`;
  photoEditorImage.style.top = `${viewportHeight / 2 + photoEditorState.y}px`;
  photoEditorImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  photoZoomInput.value = String(photoEditorState.zoom);
}

function setPhotoZoom(nextZoom) {
  photoEditorState.zoom = clamp(Number(nextZoom) || 1, 1, 3);
  renderPhotoEditor();
}

function centerPhotoEditor() {
  photoEditorState.x = 0;
  photoEditorState.y = 0;
  renderPhotoEditor();
}

function openPhotoEditor(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      photoEditorState.source = String(reader.result);
      photoEditorState.image = image;
      photoEditorState.zoom = 1.08;
      photoEditorState.x = 0;
      photoEditorState.y = 0;
      photoEditorImage.src = photoEditorState.source;
      activePhotoTrigger = document.querySelector(".portrait-frame");
      photoEditorModal.hidden = false;
      syncModalLock();
      photoEditorDialog.focus();
      requestAnimationFrame(() => {
        renderPhotoEditor();
        photoEditorViewport.focus();
      });
    });
    image.src = String(reader.result);
  });
  reader.readAsDataURL(file);
}

function closePhotoEditor() {
  const activePointerId = photoEditorState.pointerId;
  if (
    activePointerId !== null &&
    photoEditorViewport.hasPointerCapture?.(activePointerId)
  ) {
    photoEditorViewport.releasePointerCapture(activePointerId);
  }
  photoEditorModal.hidden = true;
  photoEditorState.pointerId = null;
  photoEditorViewport.classList.remove("is-dragging");
  document.querySelector("#portrait-input").value = "";
  syncModalLock();
  if (activePhotoTrigger?.isConnected) activePhotoTrigger.focus();
}

function applyPhotoCrop() {
  if (!photoEditorState.image) return;
  const viewportSize = photoEditorViewport.clientWidth || 1;
  const scale = getPhotoEditorScale();
  const sourceSize = viewportSize / scale;
  const sourceX = photoEditorState.image.naturalWidth / 2 - photoEditorState.x / scale - sourceSize / 2;
  const sourceY = photoEditorState.image.naturalHeight / 2 - photoEditorState.y / scale - sourceSize / 2;
  const outputSize = 720;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  context.fillStyle = "#0b0c0f";
  context.fillRect(0, 0, outputSize, outputSize);
  context.drawImage(
    photoEditorState.image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  const preview = document.querySelector("#portrait-preview");
  preview.src = canvas.toDataURL("image/jpeg", 0.9);
  preview.hidden = false;
  document.querySelector("#portrait-empty").hidden = true;
  closePhotoEditor();
  notifySheetChanged("portrait");
}

function trapDialogFocus(event) {
  if (event.key !== "Tab" || rollModal.hidden) return;
  const focusable = [...rollDialog.querySelectorAll("button:not([disabled])")];
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === rollDialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function trapSkillInfoFocus(event) {
  if (event.key !== "Tab" || skillInfoModal.hidden || !constellationModal.hidden || !featureDetailModal.hidden) return;
  const focusable = [...skillInfoDialog.querySelectorAll("button:not([disabled])")];
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === skillInfoDialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function trapConstellationFocus(event) {
  if (event.key !== "Tab" || constellationModal.hidden || !featureDetailModal.hidden) return;
  const focusable = [...constellationDialog.querySelectorAll("button:not([disabled])")];
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === constellationDialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function trapFeatureDetailFocus(event) {
  if (event.key !== "Tab" || featureDetailModal.hidden) return;
  const focusable = [...featureDetailDialog.querySelectorAll("button:not([disabled])")];
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === featureDetailDialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function trapInteractiveModalFocus(event, modal, dialog) {
  if (event.key !== "Tab" || modal.hidden || !dialog.contains(document.activeElement)) return;
  const focusable = [...dialog.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
  )].filter(isCreationEditorControlVisible);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setAccountMenuOpen(isOpen) {
  accountMenu.hidden = !isOpen;
  accountButton.setAttribute("aria-expanded", String(isOpen));
}

function requestGoogleLogin() {
  window.dispatchEvent(new CustomEvent("abyss:firebase-login"));
}

