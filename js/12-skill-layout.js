"use strict";

function setSkillSettingsExpanded(row, expanded) {
  row.querySelector("[data-skill-settings]").hidden = !expanded;
  row.querySelector("[data-skill-settings-toggle]").setAttribute("aria-expanded", String(expanded));
}

function openSkillSettings(row) {
  if (row) setSkillSettingsExpanded(row, true);
}

function getActiveSkillRollModifiers() {
  return getAllSheetCreations()
    .filter(({ creation }) => creation.grantsModifiers && creation.modifiersActive)
    .flatMap(({ creation }) => creation.modifiers)
    .filter((modifier) => modifier.type === "skill")
    .map((modifier) => ({ target: modifier.target, tokens: parseDamageFormula(modifier.formula).tokens || [] }));
}

function getSkillRollModifierTerms(modifiers, skillKey) {
  return modifiers
    .filter(({ target }) => target === "all" || target === skillKey)
    .flatMap(({ tokens }) => tokens)
    .map((token) => {
      if (token.type === "dice") return { ...token, group: "modifier" };
      const value = token.sign * (token.type === "attribute" ? getAttributeValue(token.attribute) : token.value);
      return { value: Math.abs(value), sign: Math.sign(value), group: "modifier" };
    })
    .filter((term) => term.sign);
}

function formatSkillRollTerms(terms) {
  return terms.map((term, index) => {
    const sign = term.sign < 0 ? "− " : index ? "+ " : "";
    const label = term.faces ? `${term.count}d${term.faces}` : term.value;
    const choice = term.choice ? ` (${term.choice})` : "";
    return `${sign}${label}${choice}`;
  }).join(" ");
}

function skillRollTermHtml(term, index) {
  const sign = term.sign < 0 ? "−" : index ? "+" : "";
  const signHtml = sign ? `<span class="skill-roll-sign${term.sign < 0 ? " is-penalty" : ""}">${sign}</span>` : "";
  let group = term.value;
  if (term.faces) {
    group = DICE_GEOMETRY[term.faces]
      ? `${term.count > 1 ? `<span>${term.count}×</span>` : ""}${dieSvg(term.faces)}`
      : `<span>${term.count}d${term.faces}</span>`;
  }
  const choice = term.choice ? `<span class="skill-roll-choice">${term.choice}</span>` : "";
  return `<span class="skill-roll-term">${signHtml}<span class="skill-roll-group is-${term.group}">${group}${choice}</span></span>`;
}

function renderSkillRollPreview(row, activeModifiers = getActiveSkillRollModifiers()) {
  const skill = SKILLS[Number(row.dataset.skillIndex)];
  const training = TRAINING[getEffectiveSkillTraining(row)];
  const attribute = row.querySelector("[data-skill-attribute]").value;
  const status = summarizeStatusEffects(getSheetStatusRollContext(skill.name, { paCost: 0 }));
  const adjustment = row.querySelector("[data-main-dice-count]").value;
  const pool = getTrainingDicePool(adjustment, training.die, -status.disadvantage);
  const parsedExtra = parseDiceModifier(row.querySelector("[data-dice-modifier]").value);
  const fixed = Number.parseInt(row.querySelector("[data-fixed-modifier]").value, 10);
  const terms = [
    {
      count: pool.count,
      faces: training.die,
      sign: 1,
      choice: pool.count > 1 ? pool.selection : "",
      group: "training",
    },
    ...getAttributeDice(attribute).map((term) => ({ ...term, group: "attribute" })),
    ...parsedExtra.terms.map((term) => ({ ...term, group: "modifier" })),
    ...[fixed].filter((value) => Number.isFinite(value) && value !== 0)
      .map((value) => ({ value: Math.abs(value), sign: Math.sign(value), group: "modifier" })),
    ...getSkillRollModifierTerms(activeModifiers, getSkillKey(skill)),
    ...[status.testPenalty].filter(Boolean)
      .map((value) => ({ value: Math.abs(value), sign: Math.sign(value), group: "modifier" })),
  ];
  const formula = formatSkillRollTerms(terms);
  const button = row.querySelector("[data-roll-index]");
  const label = parsedExtra.error
    ? `Corrigir dados extras de ${skill.name}. ${parsedExtra.error}`
    : `Rolar ${skill.name}: ${formula}`;

  row.querySelector("[data-skill-attribute-label]").textContent = attribute;
  row.querySelector("[data-skill-training-label]").textContent = training.label;
  if (button.getAttribute("aria-label") === label) return;

  const preview = row.querySelector("[data-skill-roll-preview]");
  button.setAttribute("aria-label", label);
  button.title = label;
  button.classList.toggle("has-invalid-dice", Boolean(parsedExtra.error));
  row.querySelector("[data-skill-formula-detail]").textContent = parsedExtra.error || formula;
  if (parsedExtra.error) {
    preview.textContent = "Revisar dados";
  } else {
    const summary = terms.slice(0, 4).map(skillRollTermHtml).join("");
    preview.innerHTML = terms.length > 4 ? `${summary}<span class="skill-roll-more">…</span>` : summary;
  }
}

skillsList.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-skill-settings-toggle]");
  if (!toggle) return;
  setSkillSettingsExpanded(toggle.closest(".skill-row"), toggle.getAttribute("aria-expanded") !== "true");
});

function refreshEditedSkillRollPreview(event) {
  const row = event.target.closest(".skill-row");
  if (row) renderSkillRollPreview(row);
}

skillsList.addEventListener("input", refreshEditedSkillRollPreview);
skillsList.addEventListener("change", refreshEditedSkillRollPreview);

window.addEventListener("abyss:status-sheet-rendered", () => {
  const activeModifiers = getActiveSkillRollModifiers();
  skillsList.querySelectorAll(".skill-row").forEach((row) => renderSkillRollPreview(row, activeModifiers));
});
