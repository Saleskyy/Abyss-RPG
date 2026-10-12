"use strict";
const COMBAT_ZONES = new Set(["easy", "medium", "hard"]);
const COMBAT_MARGINS = new Set(["partial", "normal", "good", "extreme"]);
// Progressão positiva; em 0 ou abaixo, subtraem-se (1 - valor)d4.
const ATTRIBUTE_DICE = {
  1: [4],
  2: [6],
  3: [8],
  4: [10],
  5: [12],
  6: [12, 4],
  7: [12, 6],
  8: [12, 8],
  9: [12, 10],
  10: [12, 12],
};
const SENSE_DEFINITIONS = {
  ver: { name: "Ver", description: "Perceber movimentos, detalhes visuais, formas, alterações no ambiente ou elementos difíceis de distinguir através da visão." },
  ouvir: { name: "Ouvir", description: "Perceber, distinguir e localizar sons, vozes, movimentações ou outros estímulos auditivos." },
  farejar: { name: "Farejar", description: "Identificar, diferenciar, captar ou seguir odores específicos através do olfato." },
  tatear: { name: "Tatear", description: "Identificar texturas, formas, irregularidades ou detalhes através do toque." },
  degustar: { name: "Degustar", description: "Perceber sabores e diferenças através do paladar, podendo auxiliar na identificação de ingredientes, substâncias ou alterações incomuns." },
  pressentir: { name: "Pressentir", description: "Perceber alterações incomuns no ambiente, presenças estranhas, ameaças iminentes ou outros estímulos que não dependam diretamente dos cinco sentidos convencionais." },
};

const DIFFICULTIES = {
  easy: {
    label: "Fácil",
    failureMax: { 8: 4, 12: 6, 20: 7 },
    partialMax: { 8: Infinity, 12: 8, 20: 10 },
    normalMax: { 12: 11, 20: 13 },
  },
  medium: {
    label: "Normal",
    failureMax: { 8: 8, 12: 8, 20: 10 },
    partialMax: { 8: Infinity, 12: 10, 20: 13 },
    normalMax: { 12: 13, 20: 16 },
  },
  hard: {
    label: "Difícil",
    failureMax: { 8: 10, 12: 10, 20: 13 },
    partialMax: { 8: Infinity, 12: 12, 20: 16 },
    normalMax: { 12: 15, 20: 19 },
  },
};

const OUTCOMES = {
  criticalFailure: { key: "critical-failure", label: "Falha Crítica" },
  failure: { key: "failure", label: "Falha" },
  partial: { key: "partial", label: "Sucesso Parcial" },
  normal: { key: "normal", label: "Sucesso Normal" },
  good: { key: "good", label: "Sucesso Bom" },
  extreme: { key: "extreme", label: "Sucesso Extremo" },
  extremeCritical: { key: "extreme-critical", label: "Sucesso Extremo (Crítico)" },
};

const OUTCOME_CLASS_NAMES = Object.values(OUTCOMES).map((outcome) => `outcome-${outcome.key}`);

const DICE_GEOMETRY = {
  8: {
    outline: "50,4 94,50 50,96 6,50",
    facets: "M50 4 28 50 50 96M50 4l22 46-22 46M6 50h88",
  },
  12: {
    outline: "50,4 76,12 94,34 94,66 76,88 50,96 24,88 6,66 6,34 24,12",
    facets: "M50 4 66 28 94 34M94 66 66 72 50 96M6 66l28 6 16 24M6 34l28-6L50 4M34 28l-9 22 9 22h32l9-22-9-22z",
  },
  20: {
    outline: "50,4 84,17 96,50 78,87 50,96 22,87 4,50 16,17",
    facets: "M50 4 36 31 16 17M50 4l14 27 20-14M4 50l32-19h28l32 19M4 50l31 18-13 19M96 50 65 68l13 19M22 87l28-19 28 19M36 31l14 37 14-37",
  },
};

const skillsList = document.querySelector("#skills-list");
const viewButtons = [...document.querySelectorAll("[data-view-target]")];
const views = [...document.querySelectorAll("[data-view]")];
const notesList = document.querySelector("#notes-list");
const notesEmpty = document.querySelector("#notes-empty");
const notesCount = document.querySelector("#notes-count");
// Includes a small reserve so converting existing notes into pages never loses them to the notebook wrapper.
const MAX_NOTE_IMAGE_CHARS = 150000;
const MAX_NOTEBOOKS = 100;
const MAX_NOTEBOOK_PAGES = 200;
let activeNotebookId = "";
let activeNotebookPageId = "";
let characterNotes = [];
let notesEpoch = 0;
const savedNoteSelections = new Map();
const rollModal = document.querySelector("#roll-modal");
const rollDialog = document.querySelector("#roll-dialog");
const rollingDie = document.querySelector("#rolling-die");
const resultSummary = document.querySelector("#result-summary");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultOutcomeLabel = document.querySelector("#result-outcome-label");
const resultDifficultyLabel = document.querySelector("#result-difficulty-label");
const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];
const skillSearchInput = document.querySelector("#skill-search");
const attributeFilter = document.querySelector("#attribute-filter");
const trainingFilter = document.querySelector("#training-filter");
const clearSkillFiltersButton = document.querySelector("#clear-skill-filters");
const skillsEmpty = document.querySelector("#skills-empty");
const skillInfoModal = document.querySelector("#skill-info-modal");
const skillInfoDialog = document.querySelector("#skill-info-dialog");
const skillInfoAttribute = document.querySelector("#skill-info-attribute");
const skillInfoTitle = document.querySelector("#skill-info-title");
const skillInfoDescription = document.querySelector("#skill-info-description");
const skillInfoNotes = document.querySelector("#skill-info-notes");
const skillInfoUsesSection = document.querySelector("#skill-info-uses-section");
const skillInfoUses = document.querySelector("#skill-info-uses");
const openConstellationButton = document.querySelector("#open-constellation");
const constellationModal = document.querySelector("#constellation-modal");
const constellationDialog = document.querySelector("#constellation-dialog");
const constellationAttribute = document.querySelector("#constellation-attribute");
const constellationTitle = document.querySelector("#constellation-title");
const constellationTree = document.querySelector("#constellation-tree");
const constellationEmpty = document.querySelector("#constellation-empty");
const featureDetailModal = document.querySelector("#feature-detail-modal");
const featureDetailDialog = document.querySelector("#feature-detail-dialog");
const featureDetailType = document.querySelector("#feature-detail-type");
const featureDetailTitle = document.querySelector("#feature-detail-title");
const featureDetailContext = document.querySelector("#feature-detail-context");
const featureDetailDescription = document.querySelector("#feature-detail-description");
const featureDetailAbility = document.querySelector("#feature-detail-ability");
const featureDetailAbilityName = document.querySelector("#feature-detail-ability-name");
const featureDetailAbilityText = document.querySelector("#feature-detail-ability-text");
const featureDetailUsesSection = document.querySelector("#feature-detail-uses-section");
const featureDetailUses = document.querySelector("#feature-detail-uses");
const featureToggleButton = document.querySelector("#feature-toggle");
const selectedFeaturesCount = document.querySelector("#selected-features-count");
const selectedFeaturesEmpty = document.querySelector("#selected-features-empty");
const selectedFeaturesList = document.querySelector("#selected-features-list");
const characterNameInput = document.querySelector("#character-name");
const characterBackgroundInput = document.querySelector("#character-background");
const characterNameSizer = document.querySelector("#character-name-sizer");
const characterBackgroundSizer = document.querySelector("#character-background-sizer");
const echoTagSizer = document.querySelector("#echo-tag-sizer");
const characterEchoSelect = document.querySelector("#character-echo");
const characterClassSelect = document.querySelector("#character-class");
const characterLevelInput = document.querySelector("#character-level");
const echoChoiceWrap = document.querySelector("#echo-choice-wrap");
const classChoiceWrap = document.querySelector("#class-choice-wrap");
const echoChoiceTrigger = document.querySelector("#echo-choice-trigger");
const classChoiceTrigger = document.querySelector("#class-choice-trigger");
const identityOptionsMenu = document.querySelector("#identity-options-menu");
let activeIdentityChoice = null;
const identityChoices = [
  { kind: "echo", select: characterEchoSelect, trigger: echoChoiceTrigger, title: "Eco do personagem", empty: "Nenhum Eco" },
  { kind: "class", select: characterClassSelect, trigger: classChoiceTrigger, title: "Classe do personagem", empty: "Nenhuma Classe" },
];
const conditionAlerts = document.querySelector("#condition-alerts");
const defenseZoneSelect = document.querySelector("#defense-zone");
const defenseMarginSelect = document.querySelector("#defense-margin");
const defenseAttributeSelect = document.querySelector("#defense-attribute");
const evasionZoneSelect = document.querySelector("#evasion-zone");
const evasionMarginSelect = document.querySelector("#evasion-margin");
const evasionAttributeSelect = document.querySelector("#evasion-attribute");
const evasionBaseValue = document.querySelector("#evasion-base-value");
const blockValueInput = document.querySelector("#block-value");
const blockActiveInput = document.querySelector("#block-active");
const blockBaseValue = document.querySelector("#block-base-value");
const initiativeValue = document.querySelector("#initiative-value");
const initiativeFormula = document.querySelector("#initiative-formula");
const initiativeDetail = document.querySelector("#initiative-detail");
const movementValueInput = document.querySelector("#movement-value");
const movementBaseValue = document.querySelector("#movement-base-value");
const rdManagerButton = document.querySelector("#rd-manager-button");
const rdModal = document.querySelector("#rd-modal");
const rdDialog = document.querySelector("#rd-dialog");
const themeButton = document.querySelector("#theme-button");
const themeModal = document.querySelector("#theme-modal");
const themeDialog = document.querySelector("#theme-dialog");
const themeFields = document.querySelector("#theme-fields");
const systemPromptModal = document.querySelector("#system-prompt-modal");
const systemPromptDialog = document.querySelector("#system-prompt-dialog");
const systemPromptEyebrow = document.querySelector("#system-prompt-eyebrow");
const systemPromptTitle = document.querySelector("#system-prompt-title");
const systemPromptMessage = document.querySelector("#system-prompt-message");
const systemPromptMark = document.querySelector("#system-prompt-mark");
const systemPromptCancel = document.querySelector("#system-prompt-cancel");
const systemPromptConfirm = document.querySelector("#system-prompt-confirm");
const sheetTransferModal = document.querySelector("#sheet-transfer-modal");
const sheetTransferDialog = document.querySelector("#sheet-transfer-dialog");
const echoSegments = document.querySelector("#echo-segments");
const echoDecreaseButton = document.querySelector("#echo-decrease");
const echoIncreaseButton = document.querySelector("#echo-increase");
const echoPointsLabel = document.querySelector("#echo-points-label");
const echoAbilitiesList = document.querySelector("#echo-abilities-list");
const echoAbilitiesEmpty = document.querySelector("#echo-abilities-empty");
const abilityDetailModal = document.querySelector("#ability-detail-modal");
const abilityDetailDialog = document.querySelector("#ability-detail-dialog");
const abilityDetailRoll = document.querySelector("#ability-detail-roll");
const abilityDetailDamageRoll = document.querySelector("#ability-detail-damage-roll");
const rdCreateForm = document.querySelector("#rd-create-form");
const rdNameInput = document.querySelector("#rd-name");
const rdValueInput = document.querySelector("#rd-value");
const rdEmpty = document.querySelector("#rd-empty");
const rdList = document.querySelector("#rd-list");
const echoPanel = document.querySelector("#echo-panel");
const echoPanelTitle = document.querySelector("#echo-panel-title");
const echoLoreCard = document.querySelector("#echo-lore-card");
const defenseBaseValue = document.querySelector("#defense-base-value");
const dtFields = {
  spell: {
    zone: document.querySelector("#spell-dt-zone"),
    margin: document.querySelector("#spell-dt-margin"),
    base: document.querySelector("#spell-dt-base"),
  },
  ability: {
    zone: document.querySelector("#ability-dt-zone"),
    margin: document.querySelector("#ability-dt-margin"),
    base: document.querySelector("#ability-dt-base"),
  },
};
const spellDtAttributeSelect = document.querySelector("#spell-dt-attribute");
const abilityDtAttributeSelect = document.querySelector("#ability-dt-attribute");
const dtAttributeSelects = {
  spell: spellDtAttributeSelect,
  ability: abilityDtAttributeSelect,
};
const dtManual = { spell: false, ability: false };
const classCalculationNote = document.querySelector("#class-calculation-note");
const luckDieSelect = document.querySelector("#luck-die");
const misfortuneDieSelect = document.querySelector("#misfortune-die");
const rollLuckTestButton = document.querySelector("#roll-luck-test");
const wisdomValueOutput = document.querySelector("#wisdom-value");
const rollWisdomTestButton = document.querySelector("#roll-wisdom-test");
const primarySenseSelect = document.querySelector("#primary-sense");
const sensesList = document.querySelector("#senses-list");
const generateSensesButton = document.querySelector("#generate-senses");
const trainingCapStatus = document.querySelector("#training-cap-status");
const trainingLimitModal = document.querySelector("#training-limit-modal");
const trainingLimitDialog = document.querySelector("#training-limit-dialog");
const trainingLimitDescription = document.querySelector("#training-limit-description");
const confirmTrainingLimitButton = document.querySelector("#confirm-training-limit");
const openCustomSkillButton = document.querySelector("#open-custom-skill");
const customSkillModal = document.querySelector("#custom-skill-modal");
const customSkillDialog = document.querySelector("#custom-skill-dialog");
const customSkillForm = document.querySelector("#custom-skill-form");
const customSkillNameInput = document.querySelector("#custom-skill-name");
const customSkillAttributeSelect = document.querySelector("#custom-skill-attribute");
const customSkillDescriptionInput = document.querySelector("#custom-skill-description");
const customUsesList = document.querySelector("#custom-uses-list");
const customCompetenciesList = document.querySelector("#custom-competencies-list");
const customCompetenciesEmpty = document.querySelector("#custom-competencies-empty");
const customSkillError = document.querySelector("#custom-skill-error");
const deleteSkillModal = document.querySelector("#delete-skill-modal");
const deleteSkillDialog = document.querySelector("#delete-skill-dialog");
const deleteSkillDescription = document.querySelector("#delete-skill-description");
const confirmDeleteSkillButton = document.querySelector("#confirm-delete-skill");
const photoEditorModal = document.querySelector("#photo-editor-modal");
const photoEditorDialog = document.querySelector("#photo-editor-dialog");
const photoEditorViewport = document.querySelector("#photo-editor-viewport");
const photoEditorImage = document.querySelector("#photo-editor-image");
const photoZoomInput = document.querySelector("#photo-zoom");
const photoZoomOutButton = document.querySelector("#photo-zoom-out");
const photoZoomInButton = document.querySelector("#photo-zoom-in");
const photoCenterButton = document.querySelector("#photo-center");
const applyPhotoCropButton = document.querySelector("#apply-photo-crop");
const accountShell = document.querySelector(".account-shell");
const accountButton = document.querySelector("#account-button");
const accountMenu = document.querySelector("#account-menu");
const accountLoginButton = document.querySelector("#account-login");
const accountSyncNowButton = document.querySelector("#account-sync-now");
const accountSignOutButton = document.querySelector("#account-sign-out");
const minervaButton = document.querySelector("#minerva-button");
const slotsButton = document.querySelector("#slots-button");
const abilitySectionButtons = [...document.querySelectorAll("[data-ability-section]")];
const abilitiesList = document.querySelector("#abilities-list");
const abilitiesEmpty = document.querySelector("#abilities-empty");
const abilitiesCount = document.querySelector("#abilities-count");
const abilitySectionEyebrow = document.querySelector("#ability-section-eyebrow");
const abilitySectionTitle = document.querySelector("#ability-section-title");
const createAbilityButton = document.querySelector("#create-ability");
const openGrimoirePickerButton = document.querySelector("#open-grimoire-picker");
const abilityEditorModal = document.querySelector("#ability-editor-modal");
const abilityEditorDialog = document.querySelector("#ability-editor-dialog");
const abilityEditorForm = document.querySelector("#ability-editor-form");
const abilityEditorEyebrow = document.querySelector("#ability-editor-eyebrow");
const abilityEditorTitle = document.querySelector("#ability-editor-title");
const abilityNameInput = document.querySelector("#ability-name");
const abilitySectionSelect = document.querySelector("#ability-section");
const abilityOriginInput = document.querySelector("#ability-origin");
const abilityEchoSelect = document.querySelector("#ability-echo");
const abilityEchoField = document.querySelector("#ability-echo-field");
const abilityUpgradeTypeField = document.querySelector("#ability-upgrade-type-field");
const abilityUpgradeTypeSelect = document.querySelector("#ability-upgrade-type");
const abilityDescriptionInput = document.querySelector("#ability-description");
const abilityShopFields = document.querySelector("#ability-shop-fields");
const abilityShopListedInput = document.querySelector("#ability-shop-listed");
const abilityShopPriceField = document.querySelector("#ability-shop-price-field");
const abilityShopPriceInput = document.querySelector("#ability-shop-price");
const abilityDamageInput = document.querySelector("#ability-damage");
const abilityAdditionalDamageInput = document.querySelector("#ability-additional-damage");
const abilityCriticalThresholdInput = document.querySelector("#ability-critical-threshold");
const abilityCriticalBonusInput = document.querySelector("#ability-critical-bonus");
const abilityHasDamageInput = document.querySelector("#ability-has-damage");
const abilityDamageFields = document.querySelector("#ability-damage-fields");
const abilityGrantsModifiersInput = document.querySelector("#ability-grants-modifiers");
const abilityModifiersFields = document.querySelector("#ability-modifiers-fields");
const abilityMediaUrlInput = document.querySelector("#ability-media-url");
const abilityMediaFileInput = document.querySelector("#ability-media-file");
const abilityMediaPreview = document.querySelector("#ability-media-preview");
const abilityFileName = document.querySelector("#ability-file-name");
const clearAbilityMediaButton = document.querySelector("#clear-ability-media");
const abilityEditorError = document.querySelector("#ability-editor-error");
const saveAbilityButton = document.querySelector("#save-ability");
const grimoirePickerModal = document.querySelector("#grimoire-picker-modal");
const grimoirePickerDialog = document.querySelector("#grimoire-picker-dialog");
const grimoirePickerList = document.querySelector("#grimoire-picker-list");
const grimoirePickerEmpty = document.querySelector("#grimoire-picker-empty");
const grimoireSearchInput = document.querySelector("#grimoire-search");
const grimoirePickerTypes = document.querySelector("#grimoire-picker-types");
const grimoirePickerCategorySelect = document.querySelector("#grimoire-picker-category");
const grimoirePickerCategoryField = document.querySelector("#grimoire-picker-category-field");
const grimoirePickerPowerTagsField = document.querySelector("#grimoire-picker-power-tags-field");
const grimoirePickerPowerTags = document.querySelector("#grimoire-picker-power-tags");
const grimoirePickerSummary = document.querySelector("#grimoire-picker-summary");
const grimoirePickerPreview = document.querySelector("#grimoire-picker-preview");
const grimoirePickerActions = document.querySelector("#grimoire-picker-actions");
const grimoirePickerFeedback = document.querySelector("#grimoire-picker-feedback");
const minervaModal = document.querySelector("#minerva-modal");
const minervaDialog = document.querySelector("#minerva-dialog");
const minervaList = document.querySelector("#minerva-list");
const minervaSearchInput = document.querySelector("#minerva-search");
const minervaCount = document.querySelector("#minerva-count");
const minervaPreview = document.querySelector("#minerva-preview");
const minervaActions = document.querySelector("#minerva-actions");
const minervaEmpty = document.querySelector("#minerva-empty");
const minervaUpgradeFilter = document.querySelector("#minerva-upgrade-filter");
const minervaSectionButtons = [...document.querySelectorAll("[data-minerva-section]")];
const slotsModal = document.querySelector("#slots-modal");
const slotsDialog = document.querySelector("#slots-dialog");
const abilityRollModal = document.querySelector("#ability-roll-modal");
const abilityRollDialog = document.querySelector("#ability-roll-dialog");
const abilityDetailModifiers = document.querySelector("#ability-detail-modifiers");
const inventoryList = document.querySelector("#inventory-list");
const inventoryEmpty = document.querySelector("#inventory-empty");
const inventoryCount = document.querySelector("#inventory-count");
const inventorySearchInput = document.querySelector("#inventory-search");
const createItemButton = document.querySelector("#create-item");
const inventoryMoveToggle = document.querySelector("#inventory-move-toggle");
const inventoryMoveHint = document.querySelector("#inventory-move-hint");
const itemEditorModal = document.querySelector("#item-editor-modal");
const itemEditorDialog = document.querySelector("#item-editor-dialog");
const itemEditorForm = document.querySelector("#item-editor-form");
const itemEditorEyebrow = document.querySelector("#item-editor-eyebrow");
const itemEditorTitle = document.querySelector("#item-editor-title");
const itemNameInput = document.querySelector("#item-name");
const itemQuantityInput = document.querySelector("#item-quantity");
const itemTypeSelect = document.querySelector("#item-type");
const itemShopPriceField = document.querySelector("#item-shop-price-field");
const itemShopPriceInput = document.querySelector("#item-shop-price");
const itemShopDestinationField = document.querySelector("#item-shop-destination-field");
const itemShopDestinationSelect = document.querySelector("#item-shop-destination");
const itemShopEchoField = document.querySelector("#item-shop-echo-field");
const itemShopEchoSelect = document.querySelector("#item-shop-echo");
const itemDescriptionInput = document.querySelector("#item-description");
const itemIsWeaponInput = document.querySelector("#item-is-weapon");
const itemWeaponFields = document.querySelector("#item-weapon-fields");
const itemPrimaryDamageInput = document.querySelector("#item-primary-damage");
const itemAdditionalDamageInput = document.querySelector("#item-additional-damage");
const itemCriticalThresholdInput = document.querySelector("#item-critical-threshold");
const itemCriticalBonusInput = document.querySelector("#item-critical-bonus");
const itemGrantsModifiersInput = document.querySelector("#item-grants-modifiers");
const itemModifiersFields = document.querySelector("#item-modifiers-fields");
const itemMediaUrlInput = document.querySelector("#item-media-url");
const itemMediaFileInput = document.querySelector("#item-media-file");
const itemMediaPreview = document.querySelector("#item-media-preview");
const itemFileName = document.querySelector("#item-file-name");
const clearItemMediaButton = document.querySelector("#clear-item-media");
const itemEditorError = document.querySelector("#item-editor-error");
const saveItemButton = document.querySelector("#save-item");
const itemUpgradeModal = document.querySelector("#item-upgrade-modal");
const itemUpgradeDialog = document.querySelector("#item-upgrade-dialog");
const itemUpgradeList = document.querySelector("#item-upgrade-list");
const itemUpgradeEmpty = document.querySelector("#item-upgrade-empty");
const itemUpgradeSearch = document.querySelector("#item-upgrade-search");
let activeItemUpgradeId = "";
let activeItemUpgradeTrigger = null;
let activeItemUpgradeEpoch = 0;
let itemUpgradeRequestToken = 0;
const walletBalanceOutput = document.querySelector("#wallet-balance");
const walletAdjustForm = document.querySelector("#wallet-adjust-form");
const walletAdjustAmountInput = document.querySelector("#wallet-adjust-amount");
const shopSearchInput = document.querySelector("#shop-search");
const shopList = document.querySelector("#shop-list");
const shopEmpty = document.querySelector("#shop-empty");
const shopCount = document.querySelector("#shop-count");
const shopHistoryButton = document.querySelector("#shop-history-button");
const shopHistoryCount = document.querySelector("#shop-history-count");
const shopHistoryModal = document.querySelector("#shop-history-modal");
const shopHistoryDialog = document.querySelector("#shop-history-dialog");
const shopHistoryList = document.querySelector("#shop-history-list");
const shopHistoryEmpty = document.querySelector("#shop-history-empty");
const shopHistorySummary = document.querySelector("#shop-history-summary");
const shopHistoryTotal = document.querySelector("#shop-history-total");
const campaignButton = document.querySelector("#campaign-button");
const MECHANIC_EDITORS = {
  ability: {
    rolls: document.querySelector("#ability-rolls-list"),
    rollsEmpty: document.querySelector("#ability-rolls-empty"),
    costs: document.querySelector("#ability-costs-list"),
    costsEmpty: document.querySelector("#ability-costs-empty"),
    modifiers: document.querySelector("#ability-modifiers-list"),
    modifiersEmpty: document.querySelector("#ability-modifiers-empty"),
  },
  item: {
    rolls: document.querySelector("#item-rolls-list"),
    rollsEmpty: document.querySelector("#item-rolls-empty"),
    costs: document.querySelector("#item-costs-list"),
    costsEmpty: document.querySelector("#item-costs-empty"),
    modifiers: document.querySelector("#item-modifiers-list"),
    modifiersEmpty: document.querySelector("#item-modifiers-empty"),
  },
};
const selectedFeatureIds = new Set();
let rollInterval;
let rollTimeout;
let activeRollButton;
let activeSkillInfoButton;
let activeSkillInfoIndex = null;
let activeConstellationTrigger;
let activeFeatureTrigger;
let activeFeatureId = null;
let constellationDrawFrame;
let selectedDifficulty = "medium";
let activeCustomSkillTrigger;
let pendingDeleteSkillId = null;
let pendingDeleteTrigger;
let activePhotoTrigger;
let isApplyingExternalState = false;
let abilities = [];
let inventoryItems = [];
let inventoryMoveMode = false;
let inventoryDragState = null;
let inventorySuppressClickUntil = 0;
let activeAbilitySection = "attacks";
let activeAbilityId = null;
let activeAbilityTrigger = null;
let abilityEditorScope = "sheet";
let itemEditorScope = "inventory";
let pendingAbilityPreviewUrl = "";
let pendingItemPreviewUrl = "";
let grimoireAbilities = [];
let grimoireItems = [];
let activeGrimoirePickerType = "attacks";
let activeGrimoirePickerCategory = "";
let activeGrimoirePickerEntryKey = "";
let visibleGrimoirePickerEntries = [];
let lastGrimoirePickerSection = "";
let grimoirePickerSession = 0;
let grimoirePickerActionPending = false;
let activeMinervaSection = "attacks";
let activeMinervaEntryKey = "";
let visibleMinervaEntries = [];
let minervaLoadEpoch = 0;
let walletBalance = 0;
let purchaseHistory = [];
let activeShopHistoryTrigger = null;
let damageReductions = [];
let echoPoints = 0;
let activeAbilityDetailId = null;
let activeAbilityDetailScope = "sheet";
let activeAbilityDetailTrigger = null;
let activeItemId = null;
let activeItemTrigger = null;
let themeSettings = {};
let sheetRollSounds = {};
let slotRollSoundsInitialized = false;
// The campaign owns effects. Only turn bookkeeping belongs to the editable sheet.
let currentSlotStatusEffects = [];
let sheetStatusRuntime = normalizeSheetStatusRuntime();
let systemPromptResolver = null;
let systemPromptTrigger = null;
const resourceMaxManual = { pv: false, pa: false, sa: false };
let defenseWasManuallySet = false;
let blockWasManuallySet = false;
let movementWasManuallySet = false;
const senseManual = { ver: false, ouvir: false, farejar: false, tatear: false, degustar: false, pressentir: false };
const senseValues = { ver: null, ouvir: null, farejar: null, tatear: null, degustar: null, pressentir: null };
const skillLimitApprovedKeys = new Set();
const trainingLimitQueue = [];
let activeTrainingLimitRequest = null;
const photoEditorState = {
  source: "",
  image: null,
  zoom: 1.08,
  x: 0,
  y: 0,
  pointerId: null,
  dragStartX: 0,
  dragStartY: 0,
  originX: 0,
  originY: 0,
};

function dieSvg(faces, value = faces) {
  const geometry = DICE_GEOMETRY[faces] || DICE_GEOMETRY[20];
  const shownValue = value === null ? "" : String(value);

  return `
    <svg class="poly-die" viewBox="0 0 100 100" aria-hidden="true">
      <polygon class="die-outline" points="${geometry.outline}"></polygon>
      <path class="die-facet" d="${geometry.facets}"></path>
      ${shownValue ? `<text x="50" y="58">${shownValue}</text>` : ""}
    </svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const creationDescriptionEditors = new WeakMap();

function sanitizeCreationDescriptionHtml(value) {
  if (!value) return "";
  const template = document.createElement("template");
  template.innerHTML = String(value);
  const output = document.createElement("div");
  const allowed = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "DEL", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE"]);
  const discard = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "IMG", "VIDEO", "AUDIO", "SOURCE", "LINK", "META", "BASE", "TEMPLATE"]);
  // Walk iteratively so large descriptions and deep pasted markup retain their text.
  const pending = Array.from(template.content.childNodes).reverse().map((node) => ({ node, parent: output }));
  while (pending.length) {
    const { node, parent } = pending.pop();
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent));
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || discard.has(node.tagName)) continue;
    if (node.tagName === "BR") { parent.append(document.createElement("br")); continue; }
    let childParent = parent;
    if (allowed.has(node.tagName)) {
      childParent = document.createElement(node.tagName.toLowerCase());
      parent.append(childParent);
    }
    if (node.tagName === "SPAN") {
      const style = String(node.getAttribute("style") || "").toLowerCase();
      [
        [/font-weight\s*:\s*(?:bold|[7-9]00)/, "strong"],
        [/font-style\s*:\s*italic/, "em"],
        [/text-decoration(?:-line)?\s*:[^;]*underline/, "u"],
        [/text-decoration(?:-line)?\s*:[^;]*line-through/, "s"],
      ].reverse().forEach(([pattern, tag]) => {
        if (!pattern.test(style)) return;
        const wrapper = document.createElement(tag);
        childParent.append(wrapper);
        childParent = wrapper;
      });
    }
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) {
      pending.push({ node: node.childNodes[index], parent: childParent });
    }
  }
  return output.innerHTML;
}

function creationDescriptionToText(html) {
  if (!html) return "";
  const template = document.createElement("template");
  template.innerHTML = html;
  const blocks = new Set(["P", "DIV", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE"]);
  const parts = [];
  let endsInNewline = false;
  const append = (value) => { if (value) { parts.push(value); endsInNewline = value.endsWith("\n"); } };
  const pending = Array.from(template.content.childNodes).reverse().map((node) => ({ node }));
  while (pending.length) {
    const { node, endBlock } = pending.pop();
    if (endBlock) { if (!endsInNewline) append("\n"); continue; }
    if (node.nodeType === Node.TEXT_NODE) { append(node.textContent); continue; }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    if (node.tagName === "BR") { append("\n"); continue; }
    const block = blocks.has(node.tagName);
    if (block && parts.length && !endsInNewline) append("\n");
    if (block) pending.push({ endBlock: true });
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) pending.push({ node: node.childNodes[index] });
  }
  return parts.join("").replaceAll("\u00a0", " ").replace(/\r\n?/g, "\n").trim();
}

function sanitizeCreationDescription(raw) {
  const html = sanitizeCreationDescriptionHtml(raw?.descriptionHtml);
  const richText = creationDescriptionToText(html);
  return {
    description: richText || String(raw?.description || "").replace(/\r\n?/g, "\n").trim(),
    descriptionHtml: richText ? html : "",
  };
}

// Format only the displayed text; keep saved markers and editor selections intact.
function renderCreationDescriptionText(value) {
  let formatted = false;
  let changed = false;
  const wrappers = {
    "*": ["<em>", "</em>"],
    "**": ["<strong>", "</strong>"],
    "***": ["<strong><em>", "</em></strong>"],
    "_": ["<u>", "</u>"],
  };
  const html = String(value).split("\n").map((line) => {
    const stack = [{ marker: "", html: "" }];
    let wordStart = 0;
    for (const token of line.matchAll(/\\[\\*_]|\*+|_+|[^\\*_]+|\\/g)) {
      const marker = token[0];
      for (const space of marker.matchAll(/\s/g)) wordStart = token.index + space.index + 1;
      const current = stack.at(-1);
      if (marker.startsWith("\\") && marker.length === 2) {
        current.html += escapeHtml(marker[1]);
        changed = true;
        continue;
      }
      if (!Object.hasOwn(wrappers, marker)) {
        current.html += escapeHtml(marker);
        continue;
      }
      const before = line[token.index - 1] || "";
      const after = line[token.index + marker.length] || "";
      // Underscores in identifiers and URLs are ordinary text.
      const ordinaryUnderscore = marker === "_" && (
        /[\p{L}\p{N}]/u.test(before) && /[\p{L}\p{N}]/u.test(after)
        || /^(?:https?:\/\/|www\.)/i.test(line.slice(wordStart, token.index))
      );
      const canOpen = !ordinaryUnderscore && after !== "" && !/\s/.test(after);
      const canClose = !ordinaryUnderscore && before !== "" && !/\s/.test(before);
      const closingIndex = canClose ? stack.map((frame) => frame.marker).lastIndexOf(marker) : -1;
      if (closingIndex > 0) {
        // A stray inner marker must not block a complete outer pair.
        while (stack.length - 1 > closingIndex) {
          const incomplete = stack.pop();
          stack.at(-1).html += escapeHtml(incomplete.marker) + incomplete.html;
        }
        const paired = stack.pop();
        const [open, close] = wrappers[marker];
        stack.at(-1).html += open + paired.html + close;
        formatted = true;
        changed = true;
      } else if (canOpen && stack.length < 17) {
        stack.push({ marker, html: "" });
      } else {
        current.html += escapeHtml(marker);
      }
    }
    // Incomplete pairs stay visible, including any valid formatting inside them.
    while (stack.length > 1) {
      const current = stack.pop();
      stack.at(-1).html += escapeHtml(current.marker) + current.html;
    }
    return stack[0].html;
  }).join("\n");
  return { html, formatted, changed };
}

function renderCreationDescriptionHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = sanitizeCreationDescriptionHtml(value);
  let formatted = false;
  let changed = false;
  const parts = [];
  const pending = Array.from(template.content.childNodes).reverse().map((node) => ({ node }));
  while (pending.length) {
    const { node, closingTag } = pending.pop();
    if (closingTag) { parts.push(`</${closingTag}>`); continue; }
    if (node.nodeType === Node.TEXT_NODE) {
      const result = renderCreationDescriptionText(node.textContent);
      formatted ||= result.formatted;
      changed ||= result.changed;
      parts.push(result.html);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = node.tagName.toLowerCase();
    parts.push(`<${tag}>`);
    if (tag === "br") continue;
    pending.push({ closingTag: tag });
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) pending.push({ node: node.childNodes[index] });
  }
  return { html: parts.join(""), formatted, changed };
}

function setCreationDescription(element, creation, options = {}) {
  if (!element) return;
  const description = sanitizeCreationDescription(creation);
  const text = description.description || (options.fallback ?? "Sem descrição.");
  const rendered = renderCreationDescriptionHtml(description.descriptionHtml || escapeHtml(text).replaceAll("\n", "<br>"));
  const rich = Boolean(description.descriptionHtml) || rendered.formatted;
  element.classList.add("creation-description");
  element.classList.toggle("is-rich-description", rich);
  element.classList.toggle("is-plain-description", !rich);
  if (rich || rendered.changed) element.innerHTML = rendered.html;
  else element.textContent = text;
}

function rememberCreationDescriptionSelection(state) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !state.editor.contains(selection.anchorNode) || !state.editor.contains(selection.focusNode)) return;
  state.range = selection.getRangeAt(0).cloneRange();
}

function syncCreationDescriptionEditor(state) {
  const normalized = sanitizeCreationDescription({ descriptionHtml: state.editor.innerHTML });
  state.textarea.value = normalized.description;
  state.counter.textContent = `${normalized.description.length} caracteres`;
  return normalized;
}

function runCreationDescriptionCommand(state, command, value = null) {
  state.editor.focus({ preventScroll: true });
  const selection = window.getSelection();
  if (state.range && state.editor.contains(state.range.commonAncestorContainer)) {
    selection?.removeAllRanges();
    selection?.addRange(state.range);
  }
  document.execCommand(command, false, value);
  rememberCreationDescriptionSelection(state);
  syncCreationDescriptionEditor(state);
  updateCreationDescriptionToolbar(state);
}

function updateCreationDescriptionToolbar(state) {
  state.toolbar.querySelectorAll("[data-description-command]").forEach((button) => {
    const command = button.dataset.descriptionCommand;
    if (!["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].includes(command)) return;
    let active = false;
    try { active = document.queryCommandState(command); } catch (_) { /* Formatting state is optional. */ }
    button.setAttribute("aria-pressed", String(Boolean(active)));
  });
}

function initializeCreationDescriptionEditor(textarea) {
  if (!textarea || creationDescriptionEditors.has(textarea)) return creationDescriptionEditors.get(textarea);
  const wrapper = document.createElement("div");
  wrapper.className = "creation-text-editor";
  const toolbar = document.createElement("div");
  toolbar.className = "creation-text-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Formatação da descrição");
  const tools = [
    ["bold", "Negrito (Ctrl+B)", "<b>B</b>"],
    ["italic", "Itálico (Ctrl+I)", "<i>I</i>"],
    ["underline", "Sublinhado (Ctrl+U)", "<u>U</u>"],
    ["strikeThrough", "Tachado", "<s>S</s>"],
    ["insertUnorderedList", "Lista com marcadores", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>'],
    ["insertOrderedList", "Lista numerada", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M10 6h11M10 12h11M10 18h11M3 3v6M2 3h1M2 9h3M2 12c0-2 4-2 4 0l-4 5h4"/></svg>'],
    ["formatBlock", "Parágrafo", "¶", "p"],
    ["formatBlock", "Subtítulo", "H", "h3"],
    ["removeFormat", "Limpar formatação", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 4h14M11 4l-4 14M15 14l6 6M21 14l-6 6"/></svg>'],
  ];
  tools.forEach(([command, label, icon, value]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "creation-text-tool";
    button.dataset.descriptionCommand = command;
    if (value) button.dataset.descriptionValue = value;
    button.title = label;
    button.setAttribute("aria-label", label);
    if (["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].includes(command)) button.setAttribute("aria-pressed", "false");
    button.innerHTML = icon;
    toolbar.append(button);
  });
  const editor = document.createElement("div");
  editor.id = `${textarea.id}-rich`;
  editor.className = "creation-text-body creation-description";
  editor.contentEditable = "true";
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-multiline", "true");
  editor.setAttribute("aria-label", "Descrição");
  editor.setAttribute("spellcheck", "true");
  editor.dataset.placeholder = textarea.placeholder;
  const footer = document.createElement("div");
  footer.className = "creation-text-footer";
  const hint = document.createElement("span");
  hint.textContent = "Ao visualizar: *itálico* · **negrito** · ***ambos*** · _sublinhado_";
  hint.title = "Enter: novo parágrafo · Shift+Enter: quebra de linha. Use uma barra invertida antes de um marcador para exibi-lo como texto.";
  const counter = document.createElement("span");
  counter.className = "creation-text-count";
  counter.textContent = "0 caracteres";
  footer.append(hint, counter);
  wrapper.append(toolbar, editor, footer);
  textarea.hidden = true;
  textarea.setAttribute("aria-hidden", "true");
  textarea.tabIndex = -1;
  textarea.after(wrapper);
  const state = { textarea, editor, toolbar, counter, range: null };
  creationDescriptionEditors.set(textarea, state);
  toolbar.addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-description-command]")) { rememberCreationDescriptionSelection(state); event.preventDefault(); }
  });
  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-description-command]");
    if (!button) return;
    event.preventDefault();
    runCreationDescriptionCommand(state, button.dataset.descriptionCommand, button.dataset.descriptionValue || null);
  });
  editor.addEventListener("input", (event) => {
    if (!event.isComposing) syncCreationDescriptionEditor(state);
    rememberCreationDescriptionSelection(state);
    updateCreationDescriptionToolbar(state);
  });
  editor.addEventListener("compositionend", () => syncCreationDescriptionEditor(state));
  editor.addEventListener("keyup", () => { rememberCreationDescriptionSelection(state); updateCreationDescriptionToolbar(state); });
  editor.addEventListener("pointerup", () => { rememberCreationDescriptionSelection(state); updateCreationDescriptionToolbar(state); });
  editor.addEventListener("focus", () => updateCreationDescriptionToolbar(state));
  editor.addEventListener("blur", () => { rememberCreationDescriptionSelection(state); syncCreationDescriptionEditor(state); });
  editor.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const command = { b: "bold", i: "italic", u: "underline" }[event.key.toLowerCase()];
    if (!command) return;
    event.preventDefault();
    rememberCreationDescriptionSelection(state);
    runCreationDescriptionCommand(state, command);
  });
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const html = event.clipboardData?.getData("text/html") || "";
    const plain = event.clipboardData?.getData("text/plain") || "";
    const safe = html ? sanitizeCreationDescriptionHtml(html) : escapeHtml(plain).replace(/\r\n?|\n/g, "<br>");
    document.execCommand("insertHTML", false, safe);
    syncCreationDescriptionEditor(state);
    rememberCreationDescriptionSelection(state);
  });
  editor.addEventListener("drop", (event) => event.preventDefault());
  setCreationDescriptionEditor(textarea, { description: textarea.value });
  return state;
}

function setCreationDescriptionEditor(textarea, creation) {
  const state = creationDescriptionEditors.get(textarea) || initializeCreationDescriptionEditor(textarea);
  if (!state) return;
  const description = sanitizeCreationDescription(creation);
  state.range = null;
  state.editor.innerHTML = description.descriptionHtml || escapeHtml(description.description).replaceAll("\n", "<br>");
  textarea.value = description.description;
  state.counter.textContent = `${description.description.length} caracteres`;
  state.toolbar.querySelectorAll("[aria-pressed]").forEach((button) => button.setAttribute("aria-pressed", "false"));
}

function readCreationDescriptionEditor(textarea) {
  const state = creationDescriptionEditors.get(textarea);
  return state ? syncCreationDescriptionEditor(state) : sanitizeCreationDescription({ description: textarea?.value || "" });
}


function sanitizeNoteHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value || "");
  const clean = document.createElement("div");
  const allowed = new Set([
    "P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "H2", "H3",
    "UL", "OL", "LI", "BLOCKQUOTE", "A", "IMG",
  ]);
  const discard = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "FORM", "INPUT", "BUTTON"]);

  const pending = Array.from(template.content.childNodes).reverse().map((node) => ({ node, parent: clean }));
  while (pending.length) {
    const { node, parent } = pending.pop();
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent));
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || discard.has(node.tagName)) continue;
    if (node.tagName === "IMG") {
      const source = String(node.getAttribute("src") || "").trim();
      const isSmallInlineImage = source.length <= MAX_NOTE_IMAGE_CHARS &&
        /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(source);
      const url = isSmallInlineImage ? source : safeRemoteImageUrl(source);
      if (!url) continue;
      const image = document.createElement("img");
      image.src = url;
      image.alt = String(node.getAttribute("alt") || "Imagem da página");
      image.loading = "lazy";
      parent.append(image);
      continue;
    }
    if (node.tagName === "BR") { parent.append(document.createElement("br")); continue; }
    let childParent = parent;
    if (node.tagName === "A") {
      const href = safeRemoteImageUrl(node.getAttribute("href"));
      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        parent.append(link);
        childParent = link;
      }
    } else if (allowed.has(node.tagName)) {
      childParent = document.createElement(node.tagName.toLowerCase());
      parent.append(childParent);
    }
    if (node.tagName === "SPAN") {
      const style = String(node.getAttribute("style") || "").toLowerCase();
      const formats = [
        [/font-weight\s*:\s*(?:bold|[7-9]00)/, "strong"],
        [/font-style\s*:\s*italic/, "em"],
        [/text-decoration(?:-line)?\s*:[^;]*underline/, "u"],
      ];
      formats.reverse().forEach(([pattern, tag]) => {
        if (!pattern.test(style)) return;
        const wrapper = document.createElement(tag);
        childParent.append(wrapper);
        childParent = wrapper;
      });
    }
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) pending.push({ node: node.childNodes[index], parent: childParent });
  }
  return clean.innerHTML;
}

function normalizeCharacterNote(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 90);
  if (!id) return null;
  return { id, title: String(raw.title || "").trim(), html: sanitizeNoteHtml(raw.html) };
}

function notesSizeInBytes(list) {
  return new TextEncoder().encode(JSON.stringify(list)).length;
}

function normalizeCharacterNotes(raw) {
  const entries = Array.isArray(raw) ? raw : [];
  const result = [];
  const bookIds = new Set();
  const reservedIds = new Set(entries.filter((entry) => Array.isArray(entry?.pages)).map((entry) => String(entry.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 90)));
  let legacyId = "notebook-legacy";
  while (reservedIds.has(legacyId)) legacyId += "-old";
  let legacyBook = null;
  for (const entry of entries.slice(0, MAX_NOTEBOOKS + MAX_NOTEBOOK_PAGES)) {
    if (!entry || typeof entry !== "object") continue;
    if (!Array.isArray(entry.pages)) {
      const page = normalizeCharacterNote(entry);
      if (!page) continue;
      if (!legacyBook) {
        if (result.length >= MAX_NOTEBOOKS) continue;
        legacyBook = { id: legacyId, title: "Anotações", pages: [] };
        result.push(legacyBook);
        bookIds.add(legacyId);
      }
      if (legacyBook.pages.length >= MAX_NOTEBOOK_PAGES || legacyBook.pages.some((item) => item.id === page.id)) continue;
      legacyBook.pages.push(page);
      continue;
    }
    const id = String(entry.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 90);
    if (!id || bookIds.has(id) || result.length >= MAX_NOTEBOOKS) continue;
    const book = { id, title: String(entry.title || "").trim(), pages: [] };
    const pageIds = new Set();
    result.push(book);
    for (const rawPage of entry.pages.slice(0, MAX_NOTEBOOK_PAGES)) {
      const page = normalizeCharacterNote(rawPage);
      if (!page || pageIds.has(page.id)) continue;
      book.pages.push(page);
      pageIds.add(page.id);
    }
    if (!book.pages.length) book.pages.push({ id: `${id.slice(0, 78)}-page-1`, title: "", html: "" });
    bookIds.add(id);
  }
  return result.filter((book) => book.pages.length > 0);
}

function createCharacterNoteId() {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function getCharacterNotebook(id) {
  return characterNotes.find((book) => book.id === id) || null;
}

function getCharacterNotebookPage(bookId, pageId) {
  return getCharacterNotebook(bookId)?.pages.find((page) => page.id === pageId) || null;
}

function getNoteFromCard(card) {
  if (!card || card.isConnected === false || (card.dataset.notesEpoch !== undefined && card.dataset.notesEpoch !== String(notesEpoch))) return null;
  return getCharacterNotebookPage(card.dataset.notebookId, card.dataset.noteId);
}

function isNotebookReadOnly() {
  return Boolean(document.body?.classList?.contains("campaign-sheet-session") && document.body?.classList?.contains("is-readonly"));
}

function setCampaignSheetReadOnly(readOnly) {
  const main = document.querySelector("#main-content");
  main.inert = false;
  [...main.children].forEach((view) => { view.inert = Boolean(readOnly && view.id !== "notes-view"); });
  document.body.classList.toggle("is-readonly", Boolean(readOnly));
  document.querySelector("#create-note").disabled = Boolean(readOnly);
  if (readOnly) invalidateThemeBackgroundUpload();
  syncThemeBackgroundControls();
  renderCharacterNotes();
}

function updateNotebookPage(bookId, pageId, changes, trigger) {
  if (isNotebookReadOnly()) return false;
  const page = getCharacterNotebookPage(bookId, pageId);
  if (!page) return false;
  if (Object.entries(changes).some(([key, value]) => page[key] !== value)) {
    Object.assign(page, changes);
    notifySheetChanged("notes");
  }
  return true;
}

function renameCharacterNotebook(bookId, title, trigger) {
  if (isNotebookReadOnly()) return false;
  const book = getCharacterNotebook(bookId);
  if (!book) return false;
  const nextTitle = String(title || "");
  if (book.title !== nextTitle) { book.title = nextTitle; notifySheetChanged("notes"); }
  return true;
}

function createCharacterNotebook(trigger) {
  if (isNotebookReadOnly()) return null;
  if (characterNotes.length >= MAX_NOTEBOOKS) { warnNoteCapacity(trigger); return null; }
  const book = { id: createCharacterNoteId(), title: "Novo caderno", pages: [{ id: createCharacterNoteId(), title: "", html: "" }] };
  characterNotes.unshift(book);
  activeNotebookId = book.id;
  activeNotebookPageId = book.pages[0].id;
  notifySheetChanged("notes");
  return book;
}

function addCharacterNotebookPage(bookId, sourcePageId, trigger) {
  if (isNotebookReadOnly()) return null;
  const book = getCharacterNotebook(bookId);
  if (!book) return null;
  if (book.pages.length >= MAX_NOTEBOOK_PAGES) { warnNoteCapacity(trigger); return null; }
  const source = book.pages.find((page) => page.id === sourcePageId);
  const page = { id: createCharacterNoteId(), title: source ? `${source.title || "Página"} (cópia)` : "", html: source?.html || "" };
  const pages = [...book.pages];
  pages.splice(source ? pages.indexOf(source) + 1 : pages.length, 0, page);
  book.pages = pages;
  activeNotebookId = book.id;
  activeNotebookPageId = page.id;
  notifySheetChanged("notes");
  return page;
}

function removeCharacterNotebookPage(bookId, pageId) {
  if (isNotebookReadOnly()) return false;
  const book = getCharacterNotebook(bookId);
  const index = book?.pages.findIndex((page) => page.id === pageId) ?? -1;
  if (!book || index < 0) return false;
  book.pages.splice(index, 1);
  if (!book.pages.length) book.pages.push({ id: createCharacterNoteId(), title: "", html: "" });
  if (activeNotebookId === bookId && activeNotebookPageId === pageId) activeNotebookPageId = book.pages[Math.min(index, book.pages.length - 1)].id;
  notifySheetChanged("notes");
  return true;
}

function removeCharacterNotebook(bookId) {
  if (isNotebookReadOnly()) return false;
  if (!getCharacterNotebook(bookId)) return false;
  characterNotes = characterNotes.filter((book) => book.id !== bookId);
  if (activeNotebookId === bookId) { activeNotebookId = ""; activeNotebookPageId = ""; }
  notifySheetChanged("notes");
  return true;
}

function commitOpenNotebookPage() {
  const editor = notesList.querySelector("[data-note-body]");
  if (editor) commitNoteBody(editor);
}

function openCharacterNotebook(bookId, pageId) {
  const book = getCharacterNotebook(bookId);
  if (!book) return false;
  commitOpenNotebookPage();
  activeNotebookId = bookId;
  activeNotebookPageId = book.pages.some((page) => page.id === pageId) ? pageId : book.pages[0].id;
  renderCharacterNotes();
  return true;
}

function renderCharacterNotes() {
  savedNoteSelections.clear();
  notesList.replaceChildren();
  const count = characterNotes.length;
  notesCount.textContent = `${count} ${count === 1 ? "caderno" : "cadernos"}`;
  notesEmpty.hidden = count > 0;
  const book = getCharacterNotebook(activeNotebookId);
  if (!book) {
    activeNotebookId = "";
    activeNotebookPageId = "";
    if (!count) return;
    const library = document.createElement("div");
    library.className = "notebook-library";
    characterNotes.forEach((item) => {
      const cover = document.createElement("article");
      cover.className = "notebook-item";
      cover.dataset.notebookId = item.id;
      cover.innerHTML = `
        <button class="notebook-cover" type="button" data-notebook-action="open" aria-label="Abrir caderno: ${escapeHtml(item.title || "Sem título")}">
          <span class="notebook-cover-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 3h13a2 2 0 0 1 2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM7 3v18M11 8h5M11 12h5M11 16h3"/></svg></span>
          <strong class="notebook-cover-title">${escapeHtml(item.title || "Sem título")}</strong>
          <small class="notebook-cover-meta">${item.pages.length} ${item.pages.length === 1 ? "página" : "páginas"}</small>
          <span class="notebook-cover-open">Abrir caderno <span aria-hidden="true">→</span></span>
        </button>
        <div class="notebook-cover-actions">
          <button class="notes-small-button" type="button" data-notebook-action="rename" aria-label="Renomear caderno: ${escapeHtml(item.title || "Sem título")}">Renomear</button>
          <button class="notes-small-button is-danger" type="button" data-notebook-action="delete-notebook" aria-label="Excluir caderno: ${escapeHtml(item.title || "Sem título")}">Excluir</button>
        </div>`;
      library.append(cover);
    });
    notesList.append(library);
    return;
  }
  const page = getCharacterNotebookPage(book.id, activeNotebookPageId) || book.pages[0];
  activeNotebookPageId = page.id;
  const index = book.pages.indexOf(page);
  const workspace = document.createElement("section");
  workspace.className = "notebook-workspace";
  workspace.dataset.notebookId = book.id;
  workspace.setAttribute("aria-label", "Caderno aberto");
  workspace.innerHTML = `
    <header class="notebook-workspace-head">
      <button class="notes-small-button notebook-back" type="button" data-notebook-action="library"><span aria-hidden="true">←</span> Cadernos</button>
      <input class="notebook-title-input" data-notebook-title type="text" placeholder="Nome do caderno" aria-label="Nome do caderno" autocomplete="off" />
      <div class="notebook-actions">
        <button class="notes-small-button" type="button" data-notebook-action="add-page"><span aria-hidden="true">+</span> Nova página</button>
        <button class="notes-small-button is-danger" type="button" data-notebook-action="delete-notebook">Excluir caderno</button>
      </div>
    </header>
    <div class="notebook-spread">
      <nav class="notebook-page-list" aria-label="Páginas do caderno"><span class="notebook-index-title">Índice</span></nav>
      <div class="notebook-paper"></div>
    </div>`;
  workspace.querySelector("[data-notebook-title]").value = book.title;
  workspace.querySelector("[data-notebook-title]").readOnly = isNotebookReadOnly();
  const navigation = workspace.querySelector(".notebook-page-list");
  book.pages.forEach((item, number) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "notebook-page-tab";
    button.dataset.notebookAction = "open-page";
    button.dataset.pageId = item.id;
    button.classList.toggle("is-active", item.id === page.id);
    if (item.id === page.id) button.setAttribute("aria-current", "page");
    button.innerHTML = `<span class="notebook-page-number">${number + 1}</span><span class="notebook-page-name">${escapeHtml(item.title || `Página ${number + 1}`)}</span>`;
    navigation.append(button);
  });
  const paper = workspace.querySelector(".notebook-paper");
  paper.append(createNotebookPageCard(book, page));
  const pagination = document.createElement("footer");
  pagination.className = "notebook-pagination";
  pagination.setAttribute("aria-label", "Navegação entre páginas");
  pagination.innerHTML = `
    <button class="notes-small-button" type="button" data-notebook-action="open-page" data-page-id="${book.pages[index - 1]?.id || ""}" ${index === 0 ? "disabled" : ""}><span aria-hidden="true">←</span> Anterior</button>
    <span aria-live="polite">Página ${index + 1} de ${book.pages.length}</span>
    <button class="notes-small-button" type="button" data-notebook-action="open-page" data-page-id="${book.pages[index + 1]?.id || ""}" ${index === book.pages.length - 1 ? "disabled" : ""}>Próxima <span aria-hidden="true">→</span></button>`;
  paper.append(pagination);
  notesList.append(workspace);
}

async function handleNotebookAction(button) {
  if (button.disabled) return;
  const action = button.dataset.notebookAction;
  const bookId = button.closest("[data-notebook-id]")?.dataset.notebookId;
  const book = getCharacterNotebook(bookId);
  if (action === "library") {
    commitOpenNotebookPage();
    activeNotebookId = "";
    activeNotebookPageId = "";
    renderCharacterNotes();
    notesList.querySelector('[data-notebook-action="open"]')?.focus();
    return;
  }
  if (!book) return;
  if (isNotebookReadOnly() && !["open", "open-page"].includes(action)) return;
  if (action === "open" || action === "rename" || action === "open-page") {
    if (!openCharacterNotebook(bookId, button.dataset.pageId)) return;
    const target = notesList.querySelector(action === "open-page" ? "[data-note-title]" : "[data-notebook-title]");
    target?.focus();
    if (action === "rename") target?.select();
    return;
  }
  if (action === "add-page") {
    commitOpenNotebookPage();
    if (!addCharacterNotebookPage(bookId, "", button)) return;
    renderCharacterNotes();
    notesList.querySelector("[data-note-title]")?.focus();
    return;
  }
  if (action === "delete-notebook") {
    const epoch = notesEpoch;
    const confirmed = await showAbyssConfirm({
      eyebrow: "Cadernos do personagem", title: "Excluir este caderno?",
      message: `O caderno “${book.title || "Sem título"}” será apagado com ${book.pages.length === 1 ? "sua página" : `suas ${book.pages.length} páginas`} e todo o conteúdo.`,
      confirmLabel: "Excluir caderno", tone: "danger", trigger: button,
    });
    if (!confirmed || epoch !== notesEpoch || !removeCharacterNotebook(bookId)) return;
    renderCharacterNotes();
    document.querySelector("#create-note")?.focus();
  }
}

function warnNoteCapacity(trigger) {
  showAbyssAlert({
    eyebrow: "Cadernos do personagem", title: "Limite do caderno atingido",
    message: "Cada personagem pode ter até 100 cadernos, com 200 páginas em cada um.",
    tone: "warning", trigger,
  });
}

function commitNoteBody(editor) {
  if (isNotebookReadOnly()) return false;
  const card = editor.closest("[data-note-id]");
  const page = getNoteFromCard(card);
  if (!page) return false;
  const nextHtml = sanitizeNoteHtml(editor.innerHTML);
  if (!updateNotebookPage(card.dataset.notebookId, page.id, { html: nextHtml }, editor)) {
    editor.innerHTML = page.html;
    return false;
  }
  return true;
}


function createNotebookPageCard(book, note) {
  const card = document.createElement("article");
  card.className = "notes-card";
  card.dataset.noteId = note.id;
  card.dataset.notebookId = book.id;
  card.dataset.notesEpoch = String(notesEpoch);
  card.innerHTML = `
    <header class="notes-card-head">
      <input class="notes-card-title" data-note-title type="text"
        aria-label="Título da página" placeholder="Título da página" autocomplete="off" />
      <div class="notes-card-actions">
        <button class="notes-small-button" type="button" data-note-action="edit" title="Editar texto">Editar</button>
        <button class="notes-small-button" type="button" data-note-action="duplicate" title="Duplicar página">Duplicar página</button>
        <button class="notes-small-button is-danger" type="button" data-note-action="delete" title="Excluir página">Excluir página</button>
      </div>
    </header>
    <div class="notes-toolbar" role="toolbar" aria-label="Formatação da página">
      <button class="notes-tool" type="button" data-note-action="bold" aria-label="Negrito" title="Negrito"><b>B</b></button>
      <button class="notes-tool" type="button" data-note-action="italic" aria-label="Itálico" title="Itálico"><i>I</i></button>
      <button class="notes-tool" type="button" data-note-action="underline" aria-label="Sublinhado" title="Sublinhado">U</button>
      <span class="notes-tool-separator" aria-hidden="true"></span>
      <button class="notes-tool" type="button" data-note-action="heading" aria-label="Título no texto" title="Título no texto">H2</button>
      <button class="notes-tool" type="button" data-note-action="subheading" aria-label="Subtítulo no texto" title="Subtítulo no texto">H3</button>
      <button class="notes-tool" type="button" data-note-action="paragraph" aria-label="Parágrafo" title="Parágrafo">¶</button>
      <button class="notes-tool" type="button" data-note-action="bullets" aria-label="Lista com marcadores" title="Lista com marcadores">• Lista</button>
      <button class="notes-tool" type="button" data-note-action="numbers" aria-label="Lista numerada" title="Lista numerada">1. Lista</button>
      <button class="notes-tool" type="button" data-note-action="quote" aria-label="Citação" title="Citação">❝</button>
      <span class="notes-tool-separator" aria-hidden="true"></span>
      <button class="notes-tool" type="button" data-note-action="link" aria-label="Inserir link" title="Inserir link">↗ Link</button>
      <button class="notes-tool" type="button" data-note-action="image-file" aria-label="Adicionar imagem do aparelho" title="Adicionar imagem do aparelho">▣ Imagem</button>
      <button class="notes-tool" type="button" data-note-action="image-url" aria-label="Adicionar imagem por link" title="Adicionar imagem por link">↗ Imagem</button>
      <input type="file" data-note-image-file accept="image/png,image/jpeg,image/webp,image/gif" hidden />
    </div>
    <div class="notes-link-row" data-note-url-row hidden>
      <input type="url" data-note-url-input placeholder="https://exemplo.com/imagem.png" aria-label="Endereço do link" />
      <button class="notes-small-button" type="button" data-note-action="insert-url">Inserir</button>
      <button class="notes-small-button" type="button" data-note-action="cancel-url">Cancelar</button>
    </div>
    <div class="notes-card-body" data-note-body contenteditable="true" role="textbox" aria-multiline="true"
      aria-label="Texto da página" spellcheck="true" data-placeholder="Escreva aqui. Selecione um trecho para formatar."></div>
  `;
  card.querySelector("[data-note-title]").value = note.title;
  card.querySelector("[data-note-title]").readOnly = isNotebookReadOnly();
  card.querySelector("[data-note-body]").innerHTML = note.html;
  card.querySelector("[data-note-body]").contentEditable = String(!isNotebookReadOnly());
  return card;
}


function rememberNoteSelection(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return;
  const card = editor.closest("[data-note-id]");
  if (card) savedNoteSelections.set(`${card.dataset.notebookId}:${card.dataset.noteId}`, selection.getRangeAt(0).cloneRange());
}

function restoreNoteSelection(card) {
  const editor = card.querySelector("[data-note-body]");
  editor.focus();
  const selection = window.getSelection();
  const saved = savedNoteSelections.get(`${card.dataset.notebookId}:${card.dataset.noteId}`);
  const isValid = saved?.startContainer?.isConnected && editor.contains(saved.startContainer);
  const range = isValid ? saved.cloneRange() : document.createRange();
  if (!isValid) {
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
  return editor;
}

function insertNodeIntoNote(card, node) {
  const editor = restoreNoteSelection(card);
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  rememberNoteSelection(editor);
  commitNoteBody(editor);
}

function formatCharacterNote(card, action) {
  if (isNotebookReadOnly()) return;
  const editor = restoreNoteSelection(card);
  const commands = {
    bold: ["bold"], italic: ["italic"], underline: ["underline"],
    heading: ["formatBlock", "h2"], subheading: ["formatBlock", "h3"],
    paragraph: ["formatBlock", "p"], quote: ["formatBlock", "blockquote"],
    bullets: ["insertUnorderedList"], numbers: ["insertOrderedList"],
  };
  const command = commands[action];
  if (!command) return;
  document.execCommand(command[0], false, command[1] || null);
  rememberNoteSelection(editor);
  commitNoteBody(editor);
}

function readNoteImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

async function optimizeNoteImage(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    throw new Error("Escolha uma imagem PNG, JPEG, WebP ou GIF.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Escolha uma imagem de até 8 MB.");
  }
  if (file.size < 100000) {
    const original = await readNoteImageFile(file);
    if (original.length <= MAX_NOTE_IMAGE_CHARS) return original;
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
      image.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador não conseguiu preparar a imagem.");
    for (const edge of [1200, 960, 760, 600, 450]) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = "#121418";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [.76, .62, .48]) {
        const source = canvas.toDataURL("image/webp", quality);
        if (source.startsWith("data:image/webp;") && source.length <= MAX_NOTE_IMAGE_CHARS) return source;
        const jpeg = canvas.toDataURL("image/jpeg", quality);
        if (jpeg.length <= MAX_NOTE_IMAGE_CHARS) return jpeg;
      }
    }
    throw new Error("A imagem é grande demais para uma página. Use uma versão menor ou um link.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function insertNoteFile(card, file) {
  if (isNotebookReadOnly()) return;
  const epoch = notesEpoch;
  try {
    const source = await optimizeNoteImage(file);
    if (epoch !== notesEpoch || !card.isConnected || !getNoteFromCard(card) || isNotebookReadOnly()) return;
    const image = document.createElement("img");
    image.src = source;
    image.alt = String(file.name || "Imagem da página");
    insertNodeIntoNote(card, image);
  } catch (error) {
    if (epoch !== notesEpoch || !card.isConnected || !getNoteFromCard(card)) return;
    showAbyssAlert({ eyebrow: "Imagem da página", title: "Não foi possível inserir", message: userFacingErrorMessage(error) || "Não foi possível inserir a imagem.", tone: "warning", trigger: card.querySelector('[data-note-action="image-file"]') });
  }
}

function getSkillKey(skill) {
  return skill.id || `core:${normalizeSearchTerm(skill.name)}`;
}

function sortSkillsAlphabetically() {
  SKILLS.sort((a, b) => portugueseCollator.compare(a.name, b.name));
}

function captureSkillRowState() {
  const state = new Map();
  skillsList.querySelectorAll(".skill-row").forEach((row) => {
    const skillIndex = Number.parseInt(row.dataset.skillIndex, 10);
    const skill = SKILLS[skillIndex];
    if (!skill) return;
    state.set(getSkillKey(skill), {
      attribute: row.querySelector("[data-skill-attribute]")?.value,
      training: row.querySelector("[data-training-index]")?.value,
      mainDiceCount: row.querySelector("[data-main-dice-count]")?.value,
      mainDiceMode: "advantage",
      diceModifier: row.querySelector("[data-dice-modifier]")?.value,
      fixedModifier: row.querySelector("[data-fixed-modifier]")?.value,
    });
  });
  return state;
}

function clampInteger(value, minimum = 0, maximum = 999999, fallback = minimum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function normalizeAttributeValue(value) {
  return clampInteger(value, -999999, 10, 1);
}

function getAttributeValue(attribute) {
  const input = document.querySelector(`[data-attribute="${attribute}"]`);
  return normalizeAttributeValue(input?.value);
}

function getAttributeDice(attributeOrValue) {
  const value = typeof attributeOrValue === "string" && ATTRIBUTES[attributeOrValue]
    ? getAttributeValue(attributeOrValue)
    : normalizeAttributeValue(attributeOrValue);
  if (value <= 0) return [{ count: 1 - value, faces: 4, sign: -1 }];
  return ATTRIBUTE_DICE[value].map((faces) => ({ count: 1, faces, sign: 1 }));
}

function formatAttributeDice(dice, results) {
  return dice.map(({ count, faces, sign }, index) => {
    const prefix = sign < 0 ? "− " : index > 0 ? "+ " : "";
    const detail = results ? ` → [${results[index]}]` : "";
    return `${prefix}${count}d${faces}${detail}`;
  }).join(" ");
}

function getAttributeDieFormula(attributeOrValue) {
  return formatAttributeDice(getAttributeDice(attributeOrValue));
}

function rollAttributeDice(attributeOrValue) {
  const dice = getAttributeDice(attributeOrValue);
  const results = dice.map(({ count, faces }) => {
    if (count <= 20) {
      const rolls = rollDice(count, faces);
      return { total: sum(rolls), detail: rolls.join(", ") };
    }
    // Group large penalties by face instead of storing or displaying every die.
    const frequencies = Array(faces).fill(0);
    let total = 0;
    for (let index = 0; index < count; index += 1) {
      const value = Math.floor(Math.random() * faces) + 1;
      frequencies[value - 1] += 1;
      total += value;
    }
    const detail = frequencies.map((frequency, index) => frequency ? `${frequency}×${index + 1}` : "")
      .filter(Boolean).join(", ");
    return { total, detail };
  });
  const total = dice.reduce((subtotal, { sign }, index) => subtotal + results[index].total * sign, 0);
  return {
    total,
    formula: formatAttributeDice(dice),
    breakdown: formatAttributeDice(dice, results.map((result) => result.detail)),
  };
}

function updateAttributeDice() {
  document.querySelectorAll("[data-roll-attribute]").forEach((button) => {
    const attribute = button.dataset.rollAttribute;
    const formula = getAttributeDieFormula(attribute);
    button.textContent = formula;
    button.setAttribute("aria-label", `Rolar Dados de ${ATTRIBUTES[attribute]}: ${formula}`);
  });
}

function getReflexesTraining() {
  const skillIndex = SKILLS.findIndex((skill) => normalizeSearchTerm(skill.name) === "reflexos");
  const trainingKey = document.querySelector(`[data-training-index="${skillIndex}"]`)?.value;
  return TRAINING[trainingKey] || TRAINING.leigo;
}

function normalizeSheetStatusRuntime(raw = {}) {
  const value = raw && typeof raw === "object" ? raw : {};
  return {
    turnActive: Boolean(value.turnActive),
    firstTest: (value.firstTestPending ?? value.firstTest) !== false,
    firstFightOrShot: (value.firstFightOrShotPending ?? value.firstFightOrShot) !== false,
    firstStandardAction: (value.firstStandardActionPending ?? value.firstStandardAction) !== false,
    firstAgainstSource: (value.firstAgainstSourcePending ?? value.firstAgainstSource) !== false,
    firstDamageThisRound: (value.firstDamageThisRoundPending ?? value.firstDamageThisRound) !== false,
    afterDamage: Boolean(value.afterDamage),
    paActionsThisTurn: clampInteger(value.paActionsThisTurn, 0, 999999, 0),
    mainActionsThisTurn: clampInteger(value.mainActionsThisTurn, 0, 999999, 0),
    skipTurn: Boolean(value.skipTurn),
    fearWillSucceeded: Boolean(value.fearWillSucceeded),
    authorityEventId: String(value.authorityEventId || ""),
    exhausted: Boolean(value.exhausted),
  };
}

function getSheetStatusResources() {
  return Object.fromEntries(["pv", "pa", "sa"].map((key) => [key, readResourceValues(key)]));
}

function getSheetStatusRollContext(skillName = "", extra = {}) {
  const selected = window.AbyssConditionsUi?.getRollContext?.(skillName) || {};
  return { ...selected, ...sheetStatusRuntime, skillName, runtime: { ...sheetStatusRuntime }, ...extra };
}

function summarizeStatusEffects(context = {}) {
  const resources = getSheetStatusResources();
  const combat = {
    movement: clampInteger(movementValueInput.value, 0, 999999, 6),
    block: clampInteger(blockValueInput.value, 0, 999999, 0) + getActiveModifierTotal("block"),
    constitution: getAttributeValue("CON"),
  };
  const engine = window.AbyssStatusEffects;
  if (!engine?.summarize) return {
    effects: [], derivedEffects: [], activeEffects: [], modifiers: [], notes: [], flags: {}, adjustments: {},
    resources, limits: { wound: Math.ceil(resources.pv.max / 2), spirit: Math.ceil(resources.sa.max / 3) },
    effectiveMovement: combat.movement, effectiveBlock: combat.block, testPenalty: 0, disadvantage: 0, paSurcharge: 0,
    runtime: { ...sheetStatusRuntime },
  };
  return engine.summarize(currentSlotStatusEffects, resources, {
    ...combat, ...getSheetStatusRollContext(context.skillName || ""), ...context,
  });
}

function setSheetStatusEffects(effects, options = {}) {
  currentSlotStatusEffects = Array.isArray(effects) ? JSON.parse(JSON.stringify(effects)) : [];
  if (options.runtime) sheetStatusRuntime = normalizeSheetStatusRuntime(options.runtime);
  renderResourceState();
  renderDamageReductions();
  updateDerivedCombatStats();
  updateEvasionFromDefense();
  if (options.persist === true) notifySheetChanged("status-runtime");
}

function beginSheetStatusTurn() {
  sheetStatusRuntime = normalizeSheetStatusRuntime({ exhausted: sheetStatusRuntime.exhausted, turnActive: true });
  renderResourceState();
  notifySheetChanged("status-turn");
  return { ...sheetStatusRuntime };
}

function endSheetStatusTurn() {
  sheetStatusRuntime.turnActive = false;
  renderResourceState();
  notifySheetChanged("status-turn");
  return { ...sheetStatusRuntime };
}

function recordSheetStatusDamage(amount) {
  if (!(Number(amount) > 0)) return;
  sheetStatusRuntime.afterDamage = true;
  renderStatusSheetAdjustments();
  notifySheetChanged("status-runtime");
}

function applySheetStatusTurn(result = {}) {
  if (result.runtime) sheetStatusRuntime = normalizeSheetStatusRuntime({ ...sheetStatusRuntime, ...result.runtime });
  // Effective maxima must never replace the player's stored base maxima.
  ["pv", "pa", "sa"].forEach((key) => {
    const current = result.resources?.[key]?.current;
    if (Number.isFinite(Number(current))) getResourceInputs(key).current.value = String(Math.max(0, Math.floor(Number(current))));
  });
  renderResourceState();
  notifySheetChanged("status-turn");
  return summarizeStatusEffects();
}

function recordSheetStatusTest(skillName, failed = false, outcomeKey = "") {
  const before = summarizeStatusEffects({ skillName });
  const context = getSheetStatusRollContext(skillName);
  sheetStatusRuntime.firstTest = false;
  if (["luta", "pontaria"].includes(normalizeSearchTerm(skillName))) sheetStatusRuntime.firstFightOrShot = false;
  sheetStatusRuntime.afterDamage = false;
  if (context.againstSource || context.againstFearSource) {
    sheetStatusRuntime.firstAgainstSource = false;
    if (normalizeSearchTerm(skillName) === "vontade" && ["normal", "good", "extreme", "critical"].includes(outcomeKey)) sheetStatusRuntime.fearWillSucceeded = true;
  }
  if (failed && before.flags?.frustrated) {
    const input = getResourceInputs("sa").current;
    input.value = String(Math.max(0, clampInteger(input.value, 0, 999999, 0) - 1));
  }
  renderResourceState();
  notifySheetChanged("status-test");
}

function recordSheetStatusAction(context = {}, options = {}) {
  const selected = { ...getSheetStatusRollContext(), ...context };
  const status = summarizeStatusEffects(selected);
  const actionType = selected.actionType || (selected.standardAction ? "standard" : "");
  const isMainAction = ["standard", "movement", "interference"].includes(actionType);
  // Restrictions that have no numeric value stay in the shared notes; the
  // player and Master adjudicate those actions at the table.
  const extraPA = Number(status.paSurcharge || 0);
  const input = getResourceInputs("pa").current;
  const current = clampInteger(input.value, 0, 999999, 0);
  if (options.chargeSurcharge !== false && extraPA > current) {
    showAbyssAlert({ eyebrow: "Efeito ativo", title: "PA insuficientes", message: `Esta ação exige +${extraPA} PA pelos efeitos ativos.`, tone: "warning" });
    return { ok: false, extraPA, status };
  }
  if (options.checkOnly) return { ok: true, extraPA, status };
  if (options.chargeSurcharge !== false && extraPA) input.value = String(Math.max(0, current - extraPA));
  if (selected.standardAction) sheetStatusRuntime.firstStandardAction = false;
  if (Number(selected.paCost || 0) > 0 || extraPA > 0) sheetStatusRuntime.paActionsThisTurn += 1;
  if (isMainAction) sheetStatusRuntime.mainActionsThisTurn += 1;
  renderResourceState();
  notifySheetChanged("status-action");
  return { ok: true, extraPA, status };
}

function setStatusEffectiveOutput(anchor, key, text, active, title = "Valor com os efeitos ativos") {
  if (!anchor?.parentElement) return;
  let output = anchor.parentElement.querySelector(`[data-status-effective="${key}"]`);
  if (!output) {
    output = document.createElement("output");
    output.className = "status-effective-value status-modified";
    output.dataset.statusEffective = key;
    anchor.parentElement.append(output);
  }
  output.hidden = !active;
  output.textContent = text;
  output.title = title;
  anchor.classList.toggle("status-has-adjustment", active);
}

function renderStatusSheetAdjustments(summary = summarizeStatusEffects()) {
  setStatusEffectiveOutput(movementValueInput, "movement", `Atual: ${summary.effectiveMovement}■`, summary.effectiveMovement !== clampInteger(movementValueInput.value, 0, 999999, 6));
  const blockBase = clampInteger(blockValueInput.value, 0, 999999, 0) + getActiveModifierTotal("block");
  setStatusEffectiveOutput(blockValueInput, "block", `Atual: ${summary.effectiveBlock}`, summary.effectiveBlock !== blockBase);
  const defense = summary.adjustments?.defense || {};
  const defenseOutput = document.querySelector("#status-defense-adjustments");
  if (defenseOutput) {
    const parts = [];
    if (defense.global) parts.push(`${formatSigned(defense.global)} Defesa`);
    if (defense.projectile) parts.push(`${formatSigned(defense.projectile)} contra projéteis`);
    if (defense.melee) parts.push(`${formatSigned(defense.melee)} contra corpo a corpo`);
    if (defense.nextHit) parts.push(`${formatSigned(defense.nextHit)} no próximo ataque`);
    const calculation = calculateClassStatistics();
    if (calculation && summary.defensePenalty) {
      const value = calculation.defense + summary.defensePenalty;
      const phrase = defensePhraseForValue(value);
      const marginLabel = { partial: "Parcial", normal: "Normal", good: "Bom" }[phrase.margin] || phrase.margin;
      parts.push(`Defesa atual ${value} · ${DIFFICULTIES[phrase.zone]?.label || phrase.zone} · ${marginLabel}`);
    }
    defenseOutput.textContent = parts.join(" · ");
    defenseOutput.hidden = !parts.length;
    defenseOutput.classList.toggle("status-modified", parts.length > 0);
  }
  const evasionRestricted = Boolean(summary.flags?.evasionCannotRaiseHardMargin && evasionZoneSelect.value === "hard");
  setStatusEffectiveOutput(evasionMarginSelect, "evasion", "Zona Difícil: não aumenta a Margem Necessária", evasionRestricted);
  skillsList.querySelectorAll(".skill-row").forEach((row) => {
    const skill = SKILLS[Number.parseInt(row.dataset.skillIndex, 10)];
    if (!skill) return;
    const effect = summarizeStatusEffects({ skillName: skill.name });
    const fixed = row.querySelector("[data-fixed-modifier]");
    const base = Number.parseInt(fixed?.value, 10) || 0;
    setStatusEffectiveOutput(fixed, "skill-fixed", `Atual: ${formatSigned(base + effect.testPenalty)}`, Boolean(effect.testPenalty), "Modificador fixo somado aos efeitos ativos");
    const dice = row.querySelector("[data-main-dice-count]");
    const diceBase = clampInteger(dice?.value, -20, 20, 0);
    setStatusEffectiveOutput(dice, "skill-dice", `Atual: ${formatSigned(diceBase - effect.disadvantage)}`, Boolean(effect.disadvantage), "Vantagens e desvantagens se compensam; resultado negativo usa o pior dado");
  });
  Object.entries(SENSE_DEFINITIONS).forEach(([key, definition]) => {
    const input = sensesList.querySelector(`[data-sense-value="${key}"]`);
    const effect = summarizeStatusEffects({ skillName: definition.name, senses: true, perception: true });
    const base = senseValues[key];
    const fail = Boolean(effect.automaticFailure);
    setStatusEffectiveOutput(input, `sense-${key}`, fail ? "Falha automática" : `Atual: ${Math.max(0, (base || 0) + effect.testPenalty)}`, fail || Boolean(effect.testPenalty && Number.isFinite(base)));
  });
  const wisdomStatus = summarizeStatusEffects({ skillName: "Sabedoria" });
  wisdomValueOutput.textContent = String(Math.max(0, getWisdomValue() + wisdomStatus.testPenalty));
  wisdomValueOutput.classList.toggle("status-modified", Boolean(wisdomStatus.testPenalty));
  if (typeof CustomEvent === "function") window.dispatchEvent(new CustomEvent("abyss:status-sheet-rendered", { detail: { summary } }));
}

function updateDerivedCombatStats() {
  updateAttributeDice();
  const blockBase = Math.max(0, 3 + getAttributeValue("CON"));
  blockBaseValue.textContent = `Base ${blockBase}`;
  if (!blockWasManuallySet) blockValueInput.value = String(blockBase);

  const reflexesTraining = getReflexesTraining();
  const initiativeDieHalf = Math.floor(reflexesTraining.die / 2);
  const initiative = initiativeDieHalf + getAttributeValue("AGI");
  initiativeValue.textContent = String(initiative);
  initiativeFormula.textContent = `${initiativeDieHalf} + AGI`;
  initiativeDetail.textContent = `${reflexesTraining.label} em Reflexos · metade de d${reflexesTraining.die} + AGI`;

  movementBaseValue.textContent = "Base 6■";
  if (!movementWasManuallySet) movementValueInput.value = "6";
  renderStatusSheetAdjustments();
}

function getWisdomValue() {
  return 20 + getAttributeValue("INT") * 15;
}

function getPrimarySenseValue() {
  return Math.max(0, 20 + getAttributeValue("POD") * 15);
}

function rollSecondarySenseValue() {
  return Math.max(0, 10 + getAttributeValue("POD") * 10 + rollDice(1, 20)[0]);
}

function renderSpecialTests() {
  const primaryKey = SENSE_DEFINITIONS[primarySenseSelect.value] ? primarySenseSelect.value : "ver";
  primarySenseSelect.value = primaryKey;
  wisdomValueOutput.textContent = String(getWisdomValue());
  if (!senseManual[primaryKey]) senseValues[primaryKey] = getPrimarySenseValue();

  sensesList.replaceChildren();
  Object.entries(SENSE_DEFINITIONS).forEach(([key, definition]) => {
    const row = document.createElement("article");
    row.className = `sense-row${key === primaryKey ? " is-primary" : ""}`;
    row.dataset.senseKey = key;

    const copy = document.createElement("div");
    copy.className = "sense-copy";
    const title = document.createElement("strong");
    title.textContent = definition.name;
    if (key === primaryKey) {
      const marker = document.createElement("em");
      marker.textContent = "Principal";
      title.append(marker);
    }
    copy.append(title);

    const value = document.createElement("input");
    value.type = "number";
    value.min = "0";
    value.max = "999";
    value.step = "1";
    value.inputMode = "numeric";
    value.className = "sense-value-input";
    value.dataset.senseValue = key;
    value.value = senseValues[key] === null ? "" : String(senseValues[key]);
    value.setAttribute("aria-label", `Valor de ${definition.name}`);

    const test = document.createElement("button");
    test.type = "button";
    test.className = "roll-button sense-test-button";
    test.dataset.testSense = key;
    test.innerHTML = dieSvg(20, null);
    test.title = `Testar ${definition.name}`;
    test.setAttribute("aria-label", test.title);

    const reroll = document.createElement("button");
    reroll.type = "button";
    reroll.className = "sense-reroll-button";
    reroll.dataset.rerollSense = key;
    reroll.textContent = "↻";
    reroll.disabled = key === primaryKey;
    reroll.title = key === primaryKey ? "O Sentido Principal é calculado automaticamente" : `Refazer o valor de ${definition.name}`;
    reroll.setAttribute("aria-label", reroll.title);

    row.append(copy, value, test, reroll);
    sensesList.append(row);
  });
  primarySenseSelect.dataset.previousValue = primaryKey;
  renderStatusSheetAdjustments();
}

function rollSenseTest(key, triggerButton) {
  const value = senseValues[key];
  if (!Number.isFinite(value)) {
    showAbyssAlert({
      eyebrow: "Teste de Sentidos",
      title: `${SENSE_DEFINITIONS[key].name} ainda não possui valor`,
      message: "Gere os valores dos Sentidos ou escreva um valor antes de realizar o teste.",
      tone: "warning",
    });
    return;
  }
  const status = summarizeStatusEffects({ ...getSheetStatusRollContext(SENSE_DEFINITIONS[key].name), senses: true, perception: true });
  const adjustedValue = Math.max(0, value + status.testPenalty);
  const automaticFailure = (status.flags?.automaticFailureSenses || []).some((name) => normalizeSearchTerm(name) === normalizeSearchTerm(SENSE_DEFINITIONS[key].name));
  if (!recordSheetStatusAction(getSheetStatusRollContext(SENSE_DEFINITIONS[key].name)).ok) return;
  playRollSound();
  const rolled = rollDice(1, 100)[0];
  const success = !automaticFailure && rolled <= adjustedValue;
  showSpecialTestResult({
    title: SENSE_DEFINITIONS[key].name,
    context: "Sentidos · 1d100",
    icon: "senses",
    outcome: success ? "Sucesso" : "Falha",
    outcomeDetail: automaticFailure ? "Falha automática pelo efeito ativo" : `Resultado ${success ? "igual ou inferior" : "superior"} a ${adjustedValue}`,
    outcomeKey: success ? "normal" : "failure",
    total: rolled,
    trigger: triggerButton,
    breakdown: [
      { label: `Valor de ${SENSE_DEFINITIONS[key].name}`, detail: "Limite do teste", value, signed: false },
      ...(status.testPenalty ? [{ label: "Condições, ferimentos e medo", detail: "Ajuste do limite", value: status.testPenalty, status: true }] : []),
    ],
  });
  recordSheetStatusTest(SENSE_DEFINITIONS[key].name, !success);
}

function getCharacterLevel() {
  return clampInteger(characterLevelInput.value, 1, 15, 1);
}

function getResourceInputs(resource) {
  return {
    card: document.querySelector(`[data-resource="${resource}"]`),
    current: document.querySelector(`[data-resource-current="${resource}"]`),
    maximum: document.querySelector(`[data-resource-max="${resource}"]`),
    delta: document.querySelector(`[data-resource-delta="${resource}"]`),
    temporary: document.querySelector(`[data-resource-temporary="${resource}"]`),
  };
}

function readResourceValues(resource) {
  const inputs = getResourceInputs(resource);
  const maximum = clampInteger(inputs.maximum?.value, 0, 999999, 0);
  let current = clampInteger(inputs.current?.value, 0, 999999, 0);
  if (resource === "sa") current = Math.min(current, maximum);
  return { current, max: maximum, maxManual: Boolean(resourceMaxManual[resource]) };
}

function setResourceValues(resource, values, options = {}) {
  const inputs = getResourceInputs(resource);
  const maximum = clampInteger(values?.max, 0, 999999, 0);
  let current = clampInteger(values?.current, 0, 999999, 0);
  if (resource === "sa") current = Math.min(current, maximum);
  inputs.maximum.value = String(maximum);
  inputs.current.value = String(current);
  if (options.setManual !== false) resourceMaxManual[resource] = Boolean(values?.maxManual);
}

function calculateClassStatistics() {
  const classDefinition = CHARACTER_CLASSES[characterClassSelect.value];
  if (!classDefinition) return null;
  const level = getCharacterLevel();
  const constitution = getAttributeValue("CON");
  const power = getAttributeValue("POD");
  const intellect = getAttributeValue("INT");
  const defenseAttribute = ATTRIBUTES[defenseAttributeSelect.value] ? defenseAttributeSelect.value : "AGI";
  const evasionAttribute = ATTRIBUTES[evasionAttributeSelect.value] ? evasionAttributeSelect.value : "AGI";
  return {
    pv: Math.max(0, classDefinition.pvInitial + (classDefinition.pvPerLevel + constitution) * level),
    pa: Math.max(0, classDefinition.paInitial + (classDefinition.paPerLevel + power) * level),
    sa: Math.max(0, classDefinition.saInitial + (classDefinition.saPerLevel + intellect) * level),
    defense: classDefinition.defenseBase + getAttributeValue(defenseAttribute) + getActiveModifierTotal("defense"),
    evasion: classDefinition.defenseBase + getAttributeValue(evasionAttribute) + getActiveModifierTotal("evasion"),
    trainingCap: Math.max(0, classDefinition.adeptBase + getAttributeValue("INT")),
    classDefinition,
    level,
  };
}

function defensePhraseForValue(value) {
  if (value <= 10) return { zone: "easy", margin: "partial" };
  if (value <= 13) return { zone: "medium", margin: "partial" };
  if (value <= 16) return { zone: "hard", margin: "partial" };
  if (value <= 19) return { zone: "hard", margin: "normal" };
  return { zone: "hard", margin: "good" };
}

function evasionPhraseForDefense(zone, margin) {
  const zones = ["easy", "medium", "hard"];
  const safeZone = COMBAT_ZONES.has(zone) ? zone : "medium";
  if (margin === "partial") return { zone: safeZone, margin: "normal" };
  if (margin === "normal") return { zone: safeZone, margin: "good" };
  const nextZone = zones[Math.min(zones.length - 1, zones.indexOf(safeZone) + 1)];
  return { zone: nextZone, margin: "good" };
}

function updateDifficultyTargets() {
  const values = {
    spell: 12 + getAttributeValue(spellDtAttributeSelect.value) + getActiveModifierTotal("spellDt"),
    ability: 10 + getAttributeValue(abilityDtAttributeSelect.value) + getActiveModifierTotal("abilityDt"),
  };
  Object.entries(dtFields).forEach(([key, fields]) => {
    fields.base.textContent = `Base ${values[key]}`;
    if (!dtManual[key]) {
      const phrase = defensePhraseForValue(values[key]);
      fields.zone.value = phrase.zone;
      fields.margin.value = phrase.margin;
    }
  });
}

function captureDifficultyTarget(key) {
  return {
    zone: dtFields[key].zone.value,
    margin: dtFields[key].margin.value,
    manual: dtManual[key],
    attribute: dtAttributeSelects[key].value,
  };
}

function updateEvasionFromDefense() {
  const calculation = calculateClassStatistics();
  const basePhrase = calculation
    ? defensePhraseForValue(calculation.evasion)
    : { zone: defenseZoneSelect.value, margin: defenseMarginSelect.value };
  const status = summarizeStatusEffects();
  const restricted = Boolean(status.flags?.evasionCannotRaiseHardMargin && basePhrase.zone === "hard");
  const phrase = restricted ? basePhrase : evasionPhraseForDefense(basePhrase.zone, basePhrase.margin);
  evasionBaseValue.textContent = calculation ? `Base ${calculation.evasion}` : "Base —";
  evasionZoneSelect.value = phrase.zone;
  evasionMarginSelect.value = phrase.margin;
  evasionMarginSelect.classList.toggle("status-modified", restricted);
}

function renderEchoCounter() {
  echoPoints = clampInteger(echoPoints, 0, 5, 0);
  [...echoSegments.children].forEach((segment, index) => {
    segment.classList.toggle("is-filled", index < echoPoints);
  });
  echoSegments.setAttribute("aria-valuenow", String(echoPoints));
  echoPointsLabel.textContent = `${echoPoints} / 5`;
  echoDecreaseButton.disabled = echoPoints === 0;
  echoIncreaseButton.disabled = echoPoints === 5;
}

function changeEchoPoints(delta) {
  echoPoints = clampInteger(echoPoints + delta, 0, 5, 0);
  renderEchoCounter();
  notifySheetChanged("echo-points");
}

function abilityOriginLabel(ability, scope = "sheet") {
  const origin = [];
  if (ability.section === "echoes" && ECHOES[ability.echoKey]) origin.push(ECHOES[ability.echoKey]);
  if (ability.origin) origin.push(ability.origin);
  origin.push(ability.sourceId || scope === "minerva" ? "Grimório de Minerva" : "Criação do personagem");
  return origin.join(" · ");
}

function createEchoAbilityRow(ability, inProfile = false) {
  const card = document.createElement("article");
  card.className = "echo-ability-row";
  const copy = document.createElement("div");
  copy.className = "selected-feature-copy";
  const name = document.createElement("strong");
  name.className = "selected-feature-name";
  name.textContent = ability.name;
  const origin = document.createElement("small");
  origin.textContent = abilityOriginLabel(ability);
  copy.append(name, origin);
  const actions = document.createElement("div");
  actions.className = "selected-feature-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "selected-feature-open";
  open.dataset.openAbility = ability.id;
  open.textContent = "Abrir";
  open.setAttribute("aria-label", `Abrir informações de ${ability.name}`);
  actions.append(open);
  if (!inProfile) {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "selected-feature-open";
    edit.dataset.editAbility = ability.id;
    edit.textContent = "Editar";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "selected-feature-remove";
    remove.dataset.deleteAbility = ability.id;
    remove.textContent = "Remover";
    actions.append(edit, remove);
  }
  card.append(copy, actions);
  return card;
}

function renderEchoAbilities() {
  const selected = abilities.filter((ability) =>
    ability.section === "echoes" && ability.echoKey === characterEchoSelect.value && Boolean(characterEchoSelect.value)
  ).sort((a, b) => portugueseCollator.compare(a.name, b.name));
  echoAbilitiesList.replaceChildren(...selected.map((ability) => createEchoAbilityRow(ability, true)));
  echoAbilitiesEmpty.hidden = selected.length > 0;
  echoAbilitiesEmpty.textContent = characterEchoSelect.value
    ? "Adicione uma habilidade deste Eco em Habilidades → Ecos."
    : "Escolha seu Eco ao lado do Nome para ver suas habilidades.";
}

function renderEchoPanel() {
  const echoKey = ECHOES[characterEchoSelect.value] ? characterEchoSelect.value : "";
  const details = ECHO_DETAILS[echoKey];
  echoPanel.dataset.echo = echoKey;
  renderEchoCounter();
  renderEchoAbilities();
  echoPanelTitle.textContent = echoKey ? ECHOES[echoKey] : "Escolha um Eco";
  echoLoreCard.replaceChildren();

  const createParagraph = (text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  };

  if (!echoKey) {
    echoLoreCard.append(createParagraph("Escolha um Eco ao lado do nome para revelar sua descrição."));
    return;
  }
  const title = document.createElement("h3");
  title.textContent = details.title;
  echoLoreCard.append(title, ...details.intro.map(createParagraph));
  if (details.characterTitle || details.characters.length) {
    const characterTitle = document.createElement("h3");
    characterTitle.textContent = details.characterTitle;
    echoLoreCard.append(characterTitle, ...details.characters.map(createParagraph));
  }
}

function updateCharacterIdentityWidths() {
  const nameText = characterNameInput.value || characterNameInput.placeholder || "Nome";
  const backgroundText = characterBackgroundInput.value || characterBackgroundInput.placeholder || "Sua Origem";
  const selectedEcho = ECHOES[characterEchoSelect.value] || "Escolher Eco";
  // Complete DOM writes before measuring the labels to avoid repeated layout.
  characterNameSizer.textContent = nameText;
  characterBackgroundSizer.textContent = backgroundText;
  echoTagSizer.textContent = selectedEcho;
  const measuredNameWidth = characterNameSizer.getBoundingClientRect?.().width || nameText.length * 12;
  const measuredBackgroundWidth = characterBackgroundSizer.getBoundingClientRect?.().width || backgroundText.length * 12;
  const measuredEchoWidth = echoTagSizer.getBoundingClientRect?.().width || selectedEcho.length * 12;
  const nameWidth = Math.min(420, Math.max(160, Math.ceil(measuredNameWidth + 4)));
  const backgroundWidth = Math.min(560, Math.max(nameWidth - 24, Math.ceil(measuredBackgroundWidth + 16)));
  const echoWidth = Math.min(360, Math.max(190, Math.ceil(measuredEchoWidth + 76)));
  characterNameInput.style.setProperty("--character-name-width", nameWidth + "px");
  characterBackgroundInput.style.setProperty("--character-background-width", backgroundWidth + "px");
  characterNameInput.size = Math.min(40, Math.max(8, [...nameText].length + 1));
  echoChoiceWrap.style.setProperty("--echo-tag-width", echoWidth + "px");
}

let identityWidthFrame = 0;
function scheduleCharacterIdentityWidths() {
  if (identityWidthFrame) return;
  identityWidthFrame = requestAnimationFrame(() => {
    identityWidthFrame = 0;
    updateCharacterIdentityWidths();
  });
}

function syncIdentityChoiceControls() {
  identityChoices.forEach(({ select, trigger }) => {
    const option = select.selectedOptions[0] || select.options[0];
    trigger.querySelector(".identity-choice-trigger-label").textContent = option?.textContent || "";
  });
}

function closeIdentityOptions({ returnFocus = false } = {}) {
  if (!activeIdentityChoice) return;
  const trigger = activeIdentityChoice.trigger;
  trigger.setAttribute("aria-expanded", "false");
  trigger.classList.remove("is-open");
  identityOptionsMenu.hidden = true;
  identityOptionsMenu.replaceChildren();
  activeIdentityChoice = null;
  if (returnFocus) trigger.focus();
}

function positionIdentityOptions() {
  if (!activeIdentityChoice) return;
  const rect = activeIdentityChoice.trigger.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const width = Math.min(viewportWidth - 20, Math.max(226, rect.width + 28));
  identityOptionsMenu.style.width = `${Math.max(150, width)}px`;
  const below = viewportHeight - rect.bottom - 12;
  const above = rect.top - 12;
  const desiredHeight = Math.min(385, identityOptionsMenu.scrollHeight);
  const openAbove = below < Math.min(260, desiredHeight) && above > below;
  const availableHeight = Math.max(90, openAbove ? above : below);
  const menuHeight = Math.min(desiredHeight, availableHeight);
  identityOptionsMenu.style.maxHeight = `${menuHeight}px`;
  identityOptionsMenu.style.left = `${Math.max(10, Math.min(rect.left, viewportWidth - width - 10))}px`;
  identityOptionsMenu.style.top = `${Math.max(10, openAbove ? rect.top - menuHeight - 7 : rect.bottom + 7)}px`;
}

function openIdentityOptions(choice, focusEnd = false) {
  if (activeIdentityChoice?.kind === choice.kind) { closeIdentityOptions({ returnFocus: true }); return; }
  closeIdentityOptions();
  activeIdentityChoice = choice;
  identityOptionsMenu.replaceChildren();
  identityOptionsMenu.dataset.kind = choice.kind;
  identityOptionsMenu.setAttribute("aria-label", choice.title);

  const heading = document.createElement("p");
  heading.className = "identity-options-heading";
  heading.setAttribute("role", "presentation");
  heading.textContent = choice.title;
  identityOptionsMenu.append(heading);
  [...choice.select.options].forEach((option) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "identity-option";
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(option.value === choice.select.value));
    item.tabIndex = -1;
    item.dataset.value = option.value;
    if (!option.value) item.dataset.empty = "true";
    const marker = document.createElement("span");
    marker.className = "identity-option-mark";
    marker.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = option.value ? option.textContent : choice.empty;
    item.append(marker, label);
    identityOptionsMenu.append(item);
  });
  choice.trigger.classList.add("is-open");
  choice.trigger.setAttribute("aria-expanded", "true");
  identityOptionsMenu.hidden = false;
  positionIdentityOptions();
  const options = [...identityOptionsMenu.querySelectorAll(".identity-option")];
  const selected = options.find((item) => item.dataset.value === choice.select.value);
  (focusEnd ? options.at(-1) : selected || options[0])?.focus({ preventScroll: true });
}

function chooseIdentityOption(value) {
  const choice = activeIdentityChoice;
  if (!choice) return;
  const valid = [...choice.select.options].some((option) => option.value === value);
  if (!valid) return;
  closeIdentityOptions();
  if (choice.select.value !== value) {
    choice.select.value = value;
    choice.select.dispatchEvent(new Event("change", { bubbles: true }));
  }
  choice.trigger.focus();
}

function updateIdentityChoiceAppearance() {
  const echo = ECHOES[characterEchoSelect.value] ? characterEchoSelect.value : "";
  const classKey = CHARACTER_CLASSES[characterClassSelect.value] ? characterClassSelect.value : "";
  echoChoiceWrap.classList.toggle("has-value", Boolean(echo));
  echoChoiceWrap.dataset.echo = echo;
  classChoiceWrap.classList.toggle("has-value", Boolean(classKey));
  classChoiceWrap.dataset.characterClass = classKey;
  syncIdentityChoiceControls();
  updateCharacterIdentityWidths();
  renderEchoPanel();
}

function applyClassCalculations(options = {}) {
  const calculation = calculateClassStatistics();
  updateIdentityChoiceAppearance();
  updateDifficultyTargets();
  updateDerivedCombatStats();
  renderSpecialTests();

  if (!calculation) {
    defenseBaseValue.textContent = "Base —";
    classCalculationNote.textContent = "Escolha uma Classe para calcular os valores iniciais.";
    updateEvasionFromDefense();
    updateTrainingCapStatus();
    renderResourceState();
    return;
  }

  ["pv", "pa", "sa"].forEach((resource) => {
    const inputs = getResourceInputs(resource);
    const oldMaximum = clampInteger(inputs.maximum.value, 0, 999999, 0);
    const oldCurrent = clampInteger(inputs.current.value, 0, 999999, 0);
    if (!resourceMaxManual[resource]) {
      inputs.maximum.value = String(calculation[resource]);
      if (options.initializeCurrent && oldMaximum === 0 && oldCurrent === 0) {
        inputs.current.value = String(calculation[resource]);
      }
    }
  });

  defenseBaseValue.textContent = `Base ${calculation.defense}`;
  const hasManualMaximum = ["pv", "pa", "sa"].some((resource) => resourceMaxManual[resource]);
  classCalculationNote.textContent = `${calculation.classDefinition.label} · Nível ${calculation.level} · ${hasManualMaximum ? "máximos manuais preservados" : "máximos calculados automaticamente"}`;
  if (!defenseWasManuallySet) {
    const phrase = defensePhraseForValue(calculation.defense);
    defenseZoneSelect.value = phrase.zone;
    defenseMarginSelect.value = phrase.margin;
  }
  updateEvasionFromDefense();
  renderResourceState();
  updateTrainingCapStatus();
}

function createConditionAlert(label, resource, critical = false) {
  const alert = document.createElement("span");
  alert.className = `condition-alert is-${resource}${critical ? " is-critical" : ""}`;
  alert.textContent = label;
  return alert;
}

function renderResourceState() {
  const status = summarizeStatusEffects();
  if (typeof status.runtime?.exhausted === "boolean") sheetStatusRuntime.exhausted = status.runtime.exhausted;
  const values = {};
  ["pv", "pa", "sa"].forEach((resource) => {
    const inputs = getResourceInputs(resource);
    const baseMaximum = clampInteger(inputs.maximum.value, 0, 999999, 0);
    const maximum = status.resources?.[resource]?.max ?? baseMaximum;
    const current = status.resources?.[resource]?.current ?? clampInteger(inputs.current.value, 0, 999999, 0);
    if (resource === "pv" && maximum < baseMaximum) inputs.current.value = String(Math.min(current, maximum));
    setStatusEffectiveOutput(inputs.maximum, `${resource}-max`, `Máximo atual: ${maximum}`, maximum !== baseMaximum);
    values[resource] = { current, max: maximum };
    const percentage = maximum > 0 ? Math.min(100, Math.max(0, (current / maximum) * 100)) : 0;
    const meter = inputs.card.querySelector(".resource-meter");
    const fill = meter.querySelector(".resource-meter-fill");
    fill.style.width = `${percentage}%`;
    meter.setAttribute("aria-valuemax", String(maximum));
    meter.setAttribute("aria-valuenow", String(Math.min(current, maximum)));

    const temporary = resource !== "sa" ? Math.max(0, current - maximum) : 0;
    inputs.card.classList.toggle("has-temporary", temporary > 0);
    if (inputs.temporary) {
      inputs.temporary.hidden = temporary === 0;
      inputs.temporary.textContent = temporary ? `+${temporary} temporários` : "";
    }
  });
  const wound = document.querySelector("#wound-limit");
  const spirit = document.querySelector("#spirit-value");
  if (wound) {
    wound.textContent = String(status.limits?.wound ?? Math.ceil(values.pv.max / 2));
    wound.classList.toggle("status-modified", values.pv.max !== clampInteger(getResourceInputs("pv").maximum.value, 0, 999999, 0));
  }
  if (spirit) spirit.textContent = String(status.limits?.spirit ?? Math.ceil(values.sa.max / 3));

  const alerts = [];
  if (values.pv.max > 0) {
    if (values.pv.current <= 0) alerts.push(createConditionAlert("Últimos Fôlegos", "pv", true));
    else if (values.pv.current <= values.pv.max / 2) alerts.push(createConditionAlert("Machucado", "pv"));
  }
  if (sheetStatusRuntime.exhausted || values.pa.max > 0 && values.pa.current <= 0) {
    alerts.push(createConditionAlert("Exausto", "pa", true));
  }
  if (values.sa.max > 0) {
    if (values.sa.current <= 0) alerts.push(createConditionAlert("Enlouquecido", "sa", true));
    else if (values.sa.current <= values.sa.max / 2) alerts.push(createConditionAlert("Perturbado", "sa"));
  }
  conditionAlerts.replaceChildren(...alerts);
  renderStatusSheetAdjustments(status);
}

function normalizeResourceInput(resource, field) {
  const inputs = getResourceInputs(resource);
  const maximum = clampInteger(inputs.maximum.value, 0, 999999, 0);
  let current = clampInteger(inputs.current.value, 0, 999999, 0);
  if (resource === "sa") current = Math.min(current, maximum);
  inputs.maximum.value = String(maximum);
  inputs.current.value = String(current);
  if (field === "max") resourceMaxManual[resource] = true;
  renderResourceState();
  notifySheetChanged("resources");
}

function sanitizeDamageReduction(rawReduction) {
  if (!rawReduction || typeof rawReduction !== "object") return null;
  const name = String(rawReduction.name || "").trim();
  if (!name) return null;
  return {
    id: String(rawReduction.id || `rd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 100),
    name,
    value: clampInteger(rawReduction.value, 0, 999999, 0),
    active: Boolean(rawReduction.active),
  };
}

function renderDamageReductions() {
  rdList.replaceChildren();
  rdEmpty.hidden = damageReductions.length > 0;
  damageReductions.forEach((reduction) => {
    const item = document.createElement("div");
    item.className = `rd-item${reduction.active ? " is-active" : ""}`;
    item.dataset.rdId = reduction.id;

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = reduction.active;
    toggle.dataset.rdField = "active";
    toggle.setAttribute("aria-label", `Ativar ${reduction.name}`);

    const name = document.createElement("input");
    name.type = "text";
    name.value = reduction.name;
    name.dataset.rdField = "name";
    name.setAttribute("aria-label", "Nome da redução de dano");

    const value = document.createElement("input");
    value.type = "number";
    value.value = String(reduction.value);
    value.min = "0";
    value.max = "999999";
    value.step = "1";
    value.inputMode = "numeric";
    value.dataset.rdField = "value";
    value.setAttribute("aria-label", `Valor de ${reduction.name}`);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "rd-delete-button";
    remove.dataset.rdDelete = reduction.id;
    remove.setAttribute("aria-label", `Excluir ${reduction.name}`);
    remove.textContent = "×";
    item.append(toggle, name, value, remove);
    rdList.append(item);
  });
  const physicalRD = summarizeStatusEffects().flags?.physicalRD || 0;
  if (physicalRD) {
    const item = document.createElement("div");
    item.className = "rd-item is-active status-modified";
    const label = document.createElement("strong");
    label.textContent = `Petrificado · RD Física ${physicalRD}`;
    item.append(label);
    rdList.append(item);
    rdEmpty.hidden = true;
  }
}

function getActiveProtection(resource, context = {}) {
  const status = summarizeStatusEffects(context);
  const reductions = damageReductions
    .filter((reduction) => reduction.active)
    .reduce((total, reduction) => total + reduction.value, 0);
  const block = resource === "pv" && blockActiveInput.checked
    ? Math.max(0, status.effectiveBlock)
    : 0;
  const physical = resource === "pv" && (context.damageType === "physical" || context.physicalDamage)
    ? Number(status.flags?.physicalRD || 0) : 0;
  return reductions + block + physical;
}

function showResourceAdjustment(resource, requested, absorbed, actualLoss) {
  const feedback = document.querySelector(`[data-resource-feedback="${resource}"]`);
  if (!feedback) return;
  if (absorbed <= 0) {
    feedback.hidden = true;
    feedback.textContent = "";
    return;
  }
  feedback.hidden = false;
  feedback.textContent = `${requested} de perda − ${absorbed} de proteção = ${actualLoss}`;
}

function adjustResource(resource, amount, context = {}) {
  if (!Number.isInteger(amount) || amount === 0) return;
  const inputs = getResourceInputs(resource);
  const delta = Math.abs(amount);
  context = { ...getSheetStatusRollContext(), ...context };
  const status = summarizeStatusEffects(context);
  const maximum = status.resources?.[resource]?.max ?? clampInteger(inputs.maximum.value, 0, 999999, 0);
  const current = clampInteger(inputs.current.value, 0, 999999, 0);
  const fragilized = resource === "pv" && maximum < clampInteger(inputs.maximum.value, 0, 999999, 0);
  const upperBound = resource === "sa" || fragilized ? maximum : 999999;
  if (amount < 0) {
    const physical = resource === "pv" && (context.damageType === "physical" || context.physicalDamage);
    const protection = physical && status.flags?.physicalDamageImmune ? delta : context.bypassProtection ? 0 : getActiveProtection(resource, context);
    const absorbed = Math.min(delta, protection);
    const actualLoss = Math.max(0, delta - protection);
    inputs.current.value = String(Math.max(0, current - actualLoss));
    if (resource === "pv" && actualLoss > 0) sheetStatusRuntime.afterDamage = true;
    showResourceAdjustment(resource, delta, absorbed, actualLoss);
  } else {
    const recovery = context.regeneration ? Math.floor(delta * (status.flags?.regenerationMultiplier ?? 1)) : delta;
    inputs.current.value = String(Math.min(upperBound, current + recovery));
    showResourceAdjustment(resource, 0, 0, 0);
  }
  renderResourceState();
  notifySheetChanged("resources");
}

function setResourceLimit(resource, limit) {
  const inputs = getResourceInputs(resource);
  inputs.current.value = limit === "max"
    ? String(summarizeStatusEffects().resources?.[resource]?.max ?? clampInteger(inputs.maximum.value, 0, 999999, 0))
    : "0";
  showResourceAdjustment(resource, 0, 0, 0);
  renderResourceState();
  notifySheetChanged("resources");
}

function getTrainingLimit() {
  return calculateClassStatistics()?.trainingCap ?? null;
}

function getTrainedSkillEntries() {
  return [...skillsList.querySelectorAll(".skill-row")]
    .map((row) => {
      const select = row.querySelector("[data-training-index]");
      const skill = SKILLS[Number.parseInt(row.dataset.skillIndex, 10)];
      return skill && select && select.value !== "leigo"
        ? { row, select, skill, key: getSkillKey(skill) }
        : null;
    })
    .filter(Boolean);
}

function updateTrainingCapStatus() {
  const limit = getTrainingLimit();
  const trainedCount = getTrainedSkillEntries().length;
  trainingCapStatus.classList.remove("is-ready", "is-over");
  if (limit === null) {
    trainingCapStatus.textContent = "Escolha uma Classe no Perfil";
    return;
  }
  trainingCapStatus.textContent = `${trainedCount} / ${limit} Perícias da Classe`;
  trainingCapStatus.classList.add(trainedCount > limit ? "is-over" : "is-ready");
}

function queueTrainingLimitRequest(entry, previousTraining = "leigo") {
  if (!entry || skillLimitApprovedKeys.has(entry.key)) return;
  if (activeTrainingLimitRequest?.key === entry.key) return;
  if (trainingLimitQueue.some((request) => request.key === entry.key)) return;
  trainingLimitQueue.push({ ...entry, previousTraining: TRAINING[previousTraining] ? previousTraining : "leigo" });
  showNextTrainingLimitRequest();
}

function showNextTrainingLimitRequest() {
  if (activeTrainingLimitRequest || trainingLimitModal.hidden === false) return;
  activeTrainingLimitRequest = trainingLimitQueue.shift() || null;
  if (!activeTrainingLimitRequest) return;
  const limit = getTrainingLimit();
  const classLabel = CHARACTER_CLASSES[characterClassSelect.value]?.label || "Classe escolhida";
  trainingLimitDescription.textContent = `${activeTrainingLimitRequest.skill.name} ultrapassa o limite de ${limit ?? 0} escolhas concedidas pela Classe ${classLabel}. Deseja mantê-la mesmo assim?`;
  trainingLimitModal.hidden = false;
  syncModalLock();
  trainingLimitDialog.focus();
}

function resolveTrainingLimitRequest(keepTraining) {
  const request = activeTrainingLimitRequest;
  if (!request) return;
  if (keepTraining) {
    skillLimitApprovedKeys.add(request.key);
    request.select.dataset.previousTraining = request.select.value;
  } else {
    request.select.value = request.previousTraining;
    request.select.dataset.previousTraining = request.previousTraining;
    request.row.querySelector(".training-die").innerHTML = dieSvg(TRAINING[request.previousTraining].die);
    updateTrainingIndicator(request.row, request.previousTraining);
    skillLimitApprovedKeys.delete(request.key);
  }
  activeTrainingLimitRequest = null;
  trainingLimitModal.hidden = true;
  syncModalLock();
  filterSkills();
  updateTrainingCapStatus();
  updateDerivedCombatStats();
  notifySheetChanged("training-limit");
  auditTrainingLimit();
  showNextTrainingLimitRequest();
}

function auditTrainingLimit() {
  updateTrainingCapStatus();
  if (isApplyingExternalState) return;
  const limit = getTrainingLimit();
  if (limit === null) return;
  const trained = getTrainedSkillEntries();
  const trainedKeys = new Set(trained.map((entry) => entry.key));
  [...skillLimitApprovedKeys].forEach((key) => {
    if (!trainedKeys.has(key)) skillLimitApprovedKeys.delete(key);
  });
  const excess = Math.max(0, trained.length - limit);
  if (excess === 0) {
    skillLimitApprovedKeys.clear();
    return;
  }
  const approvedCount = trained.filter((entry) => skillLimitApprovedKeys.has(entry.key)).length;
  const pendingKeys = new Set([
    ...(activeTrainingLimitRequest ? [activeTrainingLimitRequest.key] : []),
    ...trainingLimitQueue.map((request) => request.key),
  ]);
  const pendingCount = trained.filter((entry) => pendingKeys.has(entry.key)).length;
  const needed = Math.max(0, excess - approvedCount - pendingCount);
  if (!needed) return;
  trained
    .filter((entry) => !skillLimitApprovedKeys.has(entry.key) && !pendingKeys.has(entry.key))
    .slice(-needed)
    .forEach((entry) => queueTrainingLimitRequest(entry, "leigo"));
}

function normalizeSheetRollSounds(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const sounds = {};
  const audioTypes = new Set(["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4"]);
  ["extreme", "failure", "criticalFailure", "criticalDamage"].forEach((key) => {
    const ref = raw[key];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return;
    const uid = String(ref.uid || "");
    const id = String(ref.id || "");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return;
    const name = String(ref.name || "Áudio").trim() || "Áudio";
    if (ref.kind === "youtube" && ref.mimeType === "video/youtube") {
      if (!/^[A-Za-z0-9_-]{11}$/.test(String(ref.videoId || ""))) return;
      if (typeof ref.startSeconds !== "number" || typeof ref.endSeconds !== "number"
        || !Number.isFinite(ref.startSeconds) || !Number.isFinite(ref.endSeconds)
        || ref.startSeconds < 0 || ref.endSeconds > 86400 || ref.endSeconds <= ref.startSeconds
        || ref.endSeconds - ref.startSeconds > 600) return;
      const startSeconds = Math.round(ref.startSeconds * 1000) / 1000;
      const endSeconds = Math.round(ref.endSeconds * 1000) / 1000;
      if (endSeconds <= startSeconds) return;
      sounds[key] = { uid, id, name, kind: "youtube", mimeType: "video/youtube", videoId: String(ref.videoId), startSeconds, endSeconds };
      return;
    }
    if (ref.kind === "video" ? ref.mimeType !== "video/mp4" : !audioTypes.has(ref.mimeType)) return;
    const result = { uid, id, name, mimeType: ref.mimeType };
    if (ref.kind === "video") {
      result.kind = "video";
      if (typeof ref.startSeconds !== "number" || typeof ref.endSeconds !== "number" || typeof ref.sourceDuration !== "number"
        || !Number.isFinite(ref.startSeconds) || !Number.isFinite(ref.endSeconds) || !Number.isFinite(ref.sourceDuration)
        || ref.sourceDuration <= 0 || ref.sourceDuration > 900 || ref.startSeconds < 0
        || ref.endSeconds > ref.sourceDuration || ref.endSeconds <= ref.startSeconds
        || ref.endSeconds - ref.startSeconds > 600) return;
      result.startSeconds = ref.startSeconds;
      result.endSeconds = ref.endSeconds;
      result.sourceDuration = ref.sourceDuration;
      if (result.endSeconds <= result.startSeconds || result.endSeconds > result.sourceDuration) return;
    }
    sounds[key] = result;
  });
  return sounds;
}

function setSheetRollSounds(raw, { notify = true } = {}) {
  if (isNotebookReadOnly()) return false;
  const sounds = normalizeSheetRollSounds(raw);
  const changed = !slotRollSoundsInitialized || JSON.stringify(sounds) !== JSON.stringify(sheetRollSounds);
  sheetRollSounds = sounds;
  slotRollSoundsInitialized = true;
  if (notify && changed) notifySheetChanged("roll-sounds");
  return true;
}

function captureCompleteSheetState() {
  const attributes = {};
  document.querySelectorAll("[data-attribute]").forEach((input) => {
    attributes[input.dataset.attribute] = normalizeAttributeValue(input.value);
  });

  const skillRows = {};
  captureSkillRowState().forEach((value, key) => {
    skillRows[key] = {
      attribute: ATTRIBUTES[value.attribute] ? value.attribute : "INT",
      training: TRAINING[value.training] ? value.training : "leigo",
      mainDiceCount: String(normalizeMainDiceCountValue(value.mainDiceCount)),
      mainDiceMode: "advantage",
      diceModifier: String(value.diceModifier || "").trim(),
      fixedModifier: String(value.fixedModifier || "").trim(),
    };
  });

  const portraitPreview = document.querySelector("#portrait-preview");
  return {
    schemaVersion: 12,
    profile: {
      name: document.querySelector("#character-name").value.trim(),
      background: document.querySelector("#character-background").value.trim(),
      portrait: portraitPreview.hidden ? "" : String(portraitPreview.src || ""),
      echo: ECHOES[characterEchoSelect.value] ? characterEchoSelect.value : "",
      echoPoints: clampInteger(echoPoints, 0, 5, 0),
      appearance: sanitizeTheme(themeSettings),
      ...(slotRollSoundsInitialized ? { rollSounds: normalizeSheetRollSounds(sheetRollSounds) } : {}),
      classKey: CHARACTER_CLASSES[characterClassSelect.value] ? characterClassSelect.value : "",
      level: getCharacterLevel(),
      attributes,
      resources: {
        pv: readResourceValues("pv"),
        pa: readResourceValues("pa"),
        sa: readResourceValues("sa"),
      },
      wallet: {
        verdeons: clampInteger(walletBalance, 0, 999999999, 0),
      },
      purchaseHistory: purchaseHistory
        .map(sanitizePurchaseHistoryEntry)
        .filter(Boolean)
        .slice(0, MAX_PURCHASE_HISTORY),
      combat: {
        defense: {
          zone: COMBAT_ZONES.has(defenseZoneSelect.value) ? defenseZoneSelect.value : "medium",
          margin: COMBAT_MARGINS.has(defenseMarginSelect.value) ? defenseMarginSelect.value : "normal",
          manual: defenseWasManuallySet,
          attribute: ATTRIBUTES[defenseAttributeSelect.value] ? defenseAttributeSelect.value : "AGI",
        },
        evasion: {
          zone: COMBAT_ZONES.has(evasionZoneSelect.value) ? evasionZoneSelect.value : "medium",
          margin: COMBAT_MARGINS.has(evasionMarginSelect.value) ? evasionMarginSelect.value : "normal",
          attribute: ATTRIBUTES[evasionAttributeSelect.value] ? evasionAttributeSelect.value : "AGI",
        },
        block: clampInteger(blockValueInput.value, 0, 999999, 0),
        blockManual: blockWasManuallySet,
        movement: clampInteger(movementValueInput.value, 0, 999999, 6),
        movementManual: movementWasManuallySet,
        spellDt: captureDifficultyTarget("spell"),
        abilityDt: captureDifficultyTarget("ability"),
        blockActive: blockActiveInput.checked,
        reductions: damageReductions.map((reduction) => ({ ...reduction })),
      },
      specialTests: {
        luckDie: clampInteger(luckDieSelect.value, 2, 1000, 8),
        misfortuneDie: clampInteger(misfortuneDieSelect.value, 2, 1000, 8),
        primarySense: SENSE_DEFINITIONS[primarySenseSelect.value] ? primarySenseSelect.value : "ver",
        senses: Object.fromEntries(Object.keys(SENSE_DEFINITIONS).map((key) => [
          key,
          {
            value: Number.isFinite(senseValues[key]) ? clampInteger(senseValues[key], 0, 999, 0) : null,
            manual: Boolean(senseManual[key]),
          },
        ])),
      },
    },
    sheet: {
      difficulty: DIFFICULTIES[selectedDifficulty] ? selectedDifficulty : "medium",
      skillRows,
      selectedFeatureIds: [...selectedFeatureIds],
      skillLimitApprovedIds: [...skillLimitApprovedKeys].filter(
        (key) => skillRows[key] && skillRows[key].training !== "leigo",
      ),
      notes: normalizeCharacterNotes(characterNotes),
      statusRuntime: { ...sheetStatusRuntime },
    },
    customSkills: getCustomSkillsForCloud(),
    abilities: abilities.map((ability) => ({ ...ability })),
    inventory: inventoryItems.map(sanitizeInventoryItem).filter(Boolean),
  };
}

function writeLocalSheetCache() {
  // A ficha é persistida exclusivamente no Slot da conta Firebase.
}

function readLocalSheetCache() {
  return null;
}

function notifySheetChanged(reason = "sheet") {
  if (isApplyingExternalState) return;
  window.dispatchEvent(new CustomEvent("abyss:sheet-changed", { detail: { reason } }));
}

function replaceCustomSkills(rawCustomSkills) {
  for (let index = SKILLS.length - 1; index >= 0; index -= 1) {
    const skill = SKILLS[index];
    if (!skill.isCustom) continue;
    delete SKILL_DETAILS[skill.name];
    delete COMPETENCY_TREES[skill.name];
    SKILLS.splice(index, 1);
  }

  const usedNames = new Set(SKILLS.map((skill) => normalizeSearchTerm(skill.name)));
  const usedIds = new Set();
  (Array.isArray(rawCustomSkills) ? rawCustomSkills : []).forEach((rawSkill) => {
    const customSkill = sanitizeCustomSkill(rawSkill);
    if (!customSkill) return;
    const normalizedName = normalizeSearchTerm(customSkill.name);
    if (!normalizedName || usedNames.has(normalizedName) || usedIds.has(customSkill.id)) return;
    usedNames.add(normalizedName);
    usedIds.add(customSkill.id);
    registerCustomSkill(customSkill);
  });
}

function sanitizeStoredRowState(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  const legacyCount = Number.parseInt(state.mainDiceCount, 10);
  // Earlier sheets stored the total number of training dice; current rows store advantage/disadvantage.
  const adjustment = state.mainDiceMode === "advantage" ? state.mainDiceCount : legacyCount > 0 ? legacyCount - 1 : legacyCount;
  const fixedModifier = String(state.fixedModifier ?? "").trim();
  return {
    attribute: ATTRIBUTES[state.attribute] ? state.attribute : undefined,
    training: TRAINING[state.training] ? state.training : "leigo",
    mainDiceCount: String(normalizeMainDiceCountValue(adjustment)),
    mainDiceMode: "advantage",
    diceModifier: String(state.diceModifier || "").trim(),
    fixedModifier: /^[-+]?\d+$/.test(fixedModifier) ? fixedModifier : "",
  };
}

function createCleanSheetState() {
  return {
    schemaVersion: 12,
    profile: {
      name: "",
      background: "",
      portrait: "",
      echo: "",
      echoPoints: 0,
      appearance: {},
      rollSounds: {},
      classKey: "",
      level: 1,
      attributes: { FOR: 1, AGI: 1, INT: 1, CON: 1, POD: 1 },
      resources: {
        pv: { current: 0, max: 0, maxManual: false },
        pa: { current: 0, max: 0, maxManual: false },
        sa: { current: 0, max: 0, maxManual: false },
      },
      wallet: { verdeons: 0 },
      purchaseHistory: [],
      combat: {
        defense: { zone: "medium", margin: "normal", manual: false, attribute: "AGI" },
        evasion: { zone: "medium", margin: "normal", attribute: "AGI" },
        block: 4,
        blockManual: false,
        movement: 6,
        movementManual: false,
        spellDt: { zone: "medium", margin: "partial", manual: false, attribute: "POD" },
        abilityDt: { zone: "medium", margin: "partial", manual: false, attribute: "POD" },
        blockActive: false,
        reductions: [],
      },
      specialTests: {
        luckDie: 8,
        misfortuneDie: 8,
        primarySense: "ver",
        senses: Object.fromEntries(Object.keys(SENSE_DEFINITIONS).map((key) => [key, { value: null, manual: false }])),
      },
    },
    sheet: {
      difficulty: "medium",
      skillRows: {},
      selectedFeatureIds: [],
      skillLimitApprovedIds: [],
      notes: [],
    },
    customSkills: [],
    abilities: [],
    inventory: [],
  };
}

function safeRemoteImageUrl(value) {
  const source = String(value || "").trim();
  if (!source) return "";

  try {
    const url = new URL(source);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safeAbilityMediaUrl(value) {
  const source = String(value || "").trim();
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(source)) {
    return source;
  }
  return safeRemoteImageUrl(source);
}

function serializeAbilityForCloud(rawAbility) {
  const ability = sanitizeAbility(rawAbility);
  if (!ability) return null;
  const hasFirestoreMedia =
    Boolean(ability.mediaRefId) && ["slot", "minerva"].includes(ability.mediaOwner);

  return {
    ...ability,
    mediaUrl: hasFirestoreMedia ? "" : safeRemoteImageUrl(ability.mediaUrl),
    mediaOwner: hasFirestoreMedia ? ability.mediaOwner : "link",
  };
}

function serializeInventoryItemForCloud(rawItem) {
  const item = sanitizeInventoryItem(rawItem);
  if (!item) return null;
  const hasCloudMedia = Boolean(item.mediaRefId) && ["slot", "minerva"].includes(item.mediaOwner);
  return {
    ...item,
    mediaUrl: hasCloudMedia ? "" : safeRemoteImageUrl(item.mediaUrl),
    mediaOwner: hasCloudMedia ? item.mediaOwner : "link",
  };
}

function sanitizePurchaseHistoryEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") return null;
  const name = String(rawEntry.name || "").trim();
  if (!name) return null;
  const parsedDate = new Date(rawEntry.purchasedAt);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const kind = rawEntry.kind === "item" ? "item" : "ability";
  const destination = kind === "item"
    ? sanitizeShopDestination(rawEntry.destination)
    : ABILITY_SECTIONS[rawEntry.destination]
      ? rawEntry.destination
      : "attacks";
  return {
    id: String(rawEntry.id || createAbilityId("purchase")).slice(0, 120),
    productId: String(rawEntry.productId || "").slice(0, 120),
    name,
    kind,
    destination,
    echoKey: Object.hasOwn(ECHOES, rawEntry.echoKey) ? rawEntry.echoKey : "",
    price: clampInteger(rawEntry.price, 0, 999999999, 0),
    quantity: clampInteger(rawEntry.quantity, 1, 9999, 1),
    purchasedAt: parsedDate.toISOString(),
  };
}

function sanitizeAbility(rawAbility) {
  if (!rawAbility || typeof rawAbility !== "object") return null;

  const name = String(rawAbility.name || "").trim();
  if (!name) return null;
  const section = ABILITY_SECTIONS[rawAbility.section] ? rawAbility.section : "attacks";
  const upgradeType = section === "upgrades" ? sanitizeUpgradeType(rawAbility.upgradeType) : "";
  if (section === "upgrades" && !upgradeType) return null;
  const echoKey = Object.hasOwn(ECHOES, rawAbility.echoKey) ? rawAbility.echoKey : "";
  if (section === "echoes" && !echoKey) return null;
  const mechanics = sanitizeCreationMechanics(rawAbility);
  const damageProfile = sanitizeDamageProfile(rawAbility.damageProfile, rawAbility.damage);
  const hasDamage = section !== "upgrades" && Boolean(rawAbility.hasDamage ?? damageProfile.primary);

  return {
    id: String(
      rawAbility.id || `ability-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ).slice(0, 120),
    section,
    upgradeType,
    name,
    ...sanitizeCreationDescription(rawAbility),
    origin: String(rawAbility.origin || "").trim(),
    echoKey,
    hasDamage,
    damage: hasDamage ? damageProfile.primary : "",
    damageProfile: hasDamage ? damageProfile : sanitizeDamageProfile({}),
    ...mechanics,
    mediaUrl: safeAbilityMediaUrl(rawAbility.mediaUrl),
    mediaRefId: String(rawAbility.mediaRefId || "").slice(0, 120),
    mediaOwner:
      rawAbility.mediaOwner === "minerva"
        ? "minerva"
        : rawAbility.mediaOwner === "slot"
          ? "slot"
          : "link",
    sourceId: String(rawAbility.sourceId || "").slice(0, 120),
    shopListed: section !== "upgrades" && Boolean(rawAbility.shopListed),
    shopPrice: clampInteger(rawAbility.shopPrice, 0, 999999999, 0),
  };
}

function applyCompleteSheetState(rawState, options = {}) {
  if (!rawState || typeof rawState !== "object") return false;
  invalidateThemeBackgroundUpload();
  const profile = rawState.profile && typeof rawState.profile === "object" ? rawState.profile : {};
  const sheet = rawState.sheet && typeof rawState.sheet === "object" ? rawState.sheet : {};
  currentSlotStatusEffects = [];
  sheetStatusRuntime = normalizeSheetStatusRuntime(sheet.statusRuntime);
  let appliedSuccessfully = false;
  isApplyingExternalState = true;

  try {
    trainingLimitQueue.length = 0;
    activeTrainingLimitRequest = null;
    trainingLimitModal.hidden = true;
    rdModal.hidden = true;
    releaseThemeWheelPointer();
    themeModal.hidden = true;
    themeButton.setAttribute("aria-expanded", "false");
    shopHistoryModal.hidden = true;
    activeShopHistoryTrigger = null;
    abilityDetailModal.hidden = true;
    itemUpgradeModal.hidden = true;
    activeItemUpgradeId = "";
    itemUpgradeRequestToken += 1;
    activeAbilityDetailId = null;
    rdManagerButton.setAttribute("aria-expanded", "false");
    document.querySelectorAll("[data-resource-feedback]").forEach((feedback) => {
      feedback.hidden = true;
      feedback.textContent = "";
    });
    syncModalLock();
    replaceCustomSkills(rawState.customSkills);
    sortSkillsAlphabetically();
    rebuildFeatureCatalog();
    notesEpoch += 1;
    activeNotebookId = "";
    activeNotebookPageId = "";
    savedNoteSelections.clear();
    characterNotes = normalizeCharacterNotes(sheet.notes);
    renderCharacterNotes();

    const rowStates = new Map();
    const storedRows = sheet.skillRows && typeof sheet.skillRows === "object" ? sheet.skillRows : {};
    Object.entries(storedRows).forEach(([key, value]) => {
      rowStates.set(key, sanitizeStoredRowState(value));
    });
    renderSkills(rowStates);

    document.querySelector("#character-name").value = String(profile.name || "");
    document.querySelector("#character-background").value = String(profile.background || "");
    characterEchoSelect.value = ECHOES[profile.echo] ? profile.echo : "";
    echoPoints = clampInteger(profile.echoPoints, 0, 5, 0);
    themeSettings = sanitizeTheme(profile.appearance);
    slotRollSoundsInitialized = Object.hasOwn(profile, "rollSounds") && Boolean(profile.rollSounds)
      && typeof profile.rollSounds === "object" && !Array.isArray(profile.rollSounds);
    sheetRollSounds = normalizeSheetRollSounds(profile.rollSounds);
    applyTheme();
    renderThemeFields();
    characterClassSelect.value = CHARACTER_CLASSES[profile.classKey] ? profile.classKey : "";
    characterLevelInput.value = String(clampInteger(profile.level, 1, 15, 1));
    document.querySelectorAll("[data-attribute]").forEach((input) => {
      input.value = String(normalizeAttributeValue(profile.attributes?.[input.dataset.attribute]));
    });

    const storedResources = profile.resources && typeof profile.resources === "object"
      ? profile.resources
      : {};
    ["pv", "pa", "sa"].forEach((resource) => {
      const stored = storedResources[resource] && typeof storedResources[resource] === "object"
        ? storedResources[resource]
        : {};
      setResourceValues(resource, {
        current: stored.current,
        max: stored.max,
        maxManual: Boolean(stored.maxManual),
      });
    });
    walletBalance = clampInteger(profile.wallet?.verdeons, 0, 999999999, 0);
    purchaseHistory = (Array.isArray(profile.purchaseHistory) ? profile.purchaseHistory : [])
      .map(sanitizePurchaseHistoryEntry)
      .filter(Boolean)
      .slice(0, MAX_PURCHASE_HISTORY);

    const storedCombat = profile.combat && typeof profile.combat === "object" ? profile.combat : {};
    const storedDefense = storedCombat.defense && typeof storedCombat.defense === "object"
      ? storedCombat.defense
      : {};
    defenseWasManuallySet = Boolean(storedDefense.manual);
    defenseAttributeSelect.value = ATTRIBUTES[storedDefense.attribute] ? storedDefense.attribute : "AGI";
    defenseZoneSelect.value = COMBAT_ZONES.has(storedDefense.zone) ? storedDefense.zone : "medium";
    defenseMarginSelect.value = COMBAT_MARGINS.has(storedDefense.margin) ? storedDefense.margin : "normal";
    const storedEvasion = storedCombat.evasion && typeof storedCombat.evasion === "object"
      ? storedCombat.evasion
      : {};
    evasionAttributeSelect.value = ATTRIBUTES[storedEvasion.attribute] ? storedEvasion.attribute : "AGI";
    const storedBlock = clampInteger(storedCombat.block, 0, 999999, 4);
    blockWasManuallySet = typeof storedCombat.blockManual === "boolean"
      ? storedCombat.blockManual
      : storedBlock > 0 && clampInteger(rawState.schemaVersion, 0, 999, 0) < 12;
    blockValueInput.value = String(storedBlock);
    const storedMovement = clampInteger(storedCombat.movement, 0, 999999, 6);
    movementWasManuallySet = typeof storedCombat.movementManual === "boolean"
      ? storedCombat.movementManual
      : storedMovement !== 6;
    movementValueInput.value = String(storedMovement);
    blockActiveInput.checked = Boolean(storedCombat.blockActive);
    Object.entries(dtFields).forEach(([key, fields]) => {
      const stored = storedCombat[key + "Dt"] || {};
      dtManual[key] = Boolean(stored.manual);
      fields.zone.value = COMBAT_ZONES.has(stored.zone) ? stored.zone : "medium";
      fields.margin.value = COMBAT_MARGINS.has(stored.margin) ? stored.margin : "partial";
    });
    Object.entries(dtAttributeSelects).forEach(([key, select]) => {
      const storedAttribute = storedCombat[key + "Dt"]?.attribute;
      select.value = ATTRIBUTES[storedAttribute] ? storedAttribute : "POD";
    });
    damageReductions = (Array.isArray(storedCombat.reductions) ? storedCombat.reductions : [])
      .map(sanitizeDamageReduction)
      .filter(Boolean);
    renderDamageReductions();

    const storedSpecialTests = profile.specialTests && typeof profile.specialTests === "object"
      ? profile.specialTests
      : {};
    const supportedSpecialDice = new Set([4, 6, 8, 10, 12, 20]);
    const storedLuckDie = clampInteger(storedSpecialTests.luckDie, 2, 1000, 8);
    const storedMisfortuneDie = clampInteger(storedSpecialTests.misfortuneDie, 2, 1000, 8);
    luckDieSelect.value = String(supportedSpecialDice.has(storedLuckDie) ? storedLuckDie : 8);
    misfortuneDieSelect.value = String(supportedSpecialDice.has(storedMisfortuneDie) ? storedMisfortuneDie : 8);
    primarySenseSelect.value = SENSE_DEFINITIONS[storedSpecialTests.primarySense]
      ? storedSpecialTests.primarySense
      : "ver";
    Object.keys(SENSE_DEFINITIONS).forEach((key) => {
      const storedSense = storedSpecialTests.senses?.[key];
      const parsedValue = Number.parseInt(storedSense?.value, 10);
      senseValues[key] = Number.isFinite(parsedValue) ? clampInteger(parsedValue, 0, 999, 0) : null;
      senseManual[key] = Boolean(storedSense?.manual);
    });

    skillLimitApprovedKeys.clear();
    (Array.isArray(sheet.skillLimitApprovedIds) ? sheet.skillLimitApprovedIds : []).forEach((key) => {
      if (typeof key === "string") skillLimitApprovedKeys.add(key);
    });

    const shouldInitializeClassValues = Boolean(characterClassSelect.value) && ["pv", "pa", "sa"]
      .every((resource) => readResourceValues(resource).max === 0 && !resourceMaxManual[resource]);
    applyClassCalculations({ initializeCurrent: shouldInitializeClassValues });
    characterClassSelect.dataset.previousValue = characterClassSelect.value;
    renderResourceState();

    const portraitPreview = document.querySelector("#portrait-preview");
    const portraitEmpty = document.querySelector("#portrait-empty");
    const portrait = String(profile.portrait || "");
    const hasSafePortrait = /^data:image\/(?:png|jpe?g|webp);base64,/i.test(portrait);
    portraitPreview.src = hasSafePortrait ? portrait : "";
    portraitPreview.hidden = !hasSafePortrait;
    portraitEmpty.hidden = hasSafePortrait;

    selectDifficulty(DIFFICULTIES[sheet.difficulty] ? sheet.difficulty : "medium");
    selectedFeatureIds.clear();
    (Array.isArray(sheet.selectedFeatureIds) ? sheet.selectedFeatureIds : []).forEach((featureId) => {
      if (FEATURE_BY_ID.has(featureId)) selectedFeatureIds.add(featureId);
    });

    abilities = (Array.isArray(rawState.abilities) ? rawState.abilities : [])
      .map(sanitizeAbility)
      .filter(Boolean);
    inventoryItems = (Array.isArray(rawState.inventory) ? rawState.inventory : [])
      .map(sanitizeInventoryItem)
      .filter(Boolean);
    setInventoryMoveMode(false, { render: false });

    migrateLegacyDynamicModifiers(rawState.schemaVersion);
    applyClassCalculations();

    persistCustomSkills();
    persistSelectedFeatures();
    renderSelectedFeatures();
    renderAbilities();
    renderInventory();
    renderShop();
    renderPurchaseHistory();
    skillSearchInput.value = "";
    attributeFilter.value = "all";
    trainingFilter.value = "all";
    filterSkills();
    updateTrainingCapStatus();
    queueMicrotask(() => auditTrainingLimit());
    appliedSuccessfully = true;
    return true;
  } finally {
    isApplyingExternalState = false;
    if (appliedSuccessfully) window.dispatchEvent(new CustomEvent("abyss:slot-sounds-loaded"));
  }
}

function renderSkills(rowStates = captureSkillRowState()) {
  const attributeOptions = Object.entries(ATTRIBUTES)
    .map(([code, name]) => `<option value="${code}">${code} · ${name}</option>`)
    .join("");

  skillsList.innerHTML = SKILLS.map(
    (skill, index) => {
      const safeName = escapeHtml(skill.name);
      const deleteButton = skill.isCustom
        ? `<button class="delete-custom-skill" type="button" data-delete-custom-skill="${escapeHtml(skill.id)}" aria-label="Excluir Perícia ${safeName}" title="Excluir Perícia personalizada">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
            </svg>
          </button>`
        : "";

      return `
      <article class="skill-row${skill.isCustom ? " is-custom" : ""}" data-skill-index="${index}" data-skill-key="${escapeHtml(getSkillKey(skill))}" data-training="leigo">
        <div class="skill-info">
          <div class="skill-info-title">
            <strong>${safeName}</strong>
            ${deleteButton}
          </div>
        </div>

        <div class="attribute-control">
          <button
            class="skill-info-button"
            type="button"
            data-skill-info="${index}"
            aria-label="Ver informações de ${safeName}"
            title="Informações de ${safeName}"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5.2C11.4 3.8 10.2 3 8.8 3A3.3 3.3 0 0 0 5.5 6.3v.3A3.7 3.7 0 0 0 4 13.4a3.5 3.5 0 0 0 2.3 3.3A3.3 3.3 0 0 0 9.5 21c1 0 1.9-.5 2.5-1.2"></path>
              <path d="M12 5.2C12.6 3.8 13.8 3 15.2 3a3.3 3.3 0 0 1 3.3 3.3v.3a3.7 3.7 0 0 1 1.5 6.8 3.5 3.5 0 0 1-2.3 3.3 3.3 3.3 0 0 1-3.2 4.3c-1 0-1.9-.5-2.5-1.2V5.2Z"></path>
              <path d="M8 8.2c1.3 0 2.3.9 2.3 2.1M16 8.2c-1.3 0-2.3.9-2.3 2.1M7.2 14c1.5-.4 2.8.3 3.3 1.6M16.8 14c-1.5-.4-2.8.3-3.3 1.6"></path>
            </svg>
          </button>

          <label class="skill-select-wrap">
            <span class="control-caption">Atributo</span>
            <select class="attribute-select" data-skill-attribute="${index}" aria-label="Atributo usado em ${safeName}">
              ${attributeOptions}
            </select>
          </label>
        </div>

        <div class="training-control">
          <span class="control-caption">Treinamento</span>
          <span class="training-die" aria-hidden="true">${dieSvg(8)}</span>
          <label>
            <span class="sr-only">Treinamento em ${safeName}</span>
            <select class="training-select" data-training-index="${index}" aria-label="Treinamento em ${safeName}">
              <option value="leigo">Leigo</option>
              <option value="adepto">Adepto</option>
              <option value="treinado">Treinado</option>
            </select>
          </label>
        </div>

        <label class="modifier-control">
          <span class="control-caption">Vantagem / desvantagem</span>
          <input
            class="modifier-input main-dice-count"
            type="number"
            inputmode="text"
            min="-20"
            max="20"
            step="1"
            value="0"
            data-main-dice-count="${index}"
            aria-label="Vantagens ou desvantagens em ${safeName}; zero rola um dado, positivo usa o melhor, negativo usa o pior"
            title="0: 1 dado. +1: 2 dados, use o melhor. −1: 2 dados, use o pior. Cada ponto acrescenta um dado."
          />
        </label>

        <label class="modifier-control">
          <span class="control-caption">Dados extras</span>
          <input
            class="modifier-input dice-modifier"
            type="text"
            inputmode="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Ex: 1d8"
            title="Some ou subtraia grupos: 1d8 + 1d12 − 1d4. Também aceita vírgulas."
            data-dice-modifier="${index}"
            aria-label="Dados extras positivos ou negativos em ${safeName}"
          />
        </label>

        <label class="modifier-control">
          <span class="control-caption">Mod. fixo</span>
          <input
            class="modifier-input fixed-modifier"
            type="number"
            inputmode="numeric"
            step="1"
            placeholder="0"
            data-fixed-modifier="${index}"
            aria-label="Modificador fixo em ${safeName}"
          />
        </label>

        <button class="roll-button" type="button" data-roll-index="${index}" aria-label="Rolar ${safeName}" title="Rolar ${safeName}">
          ${dieSvg(20, null)}
        </button>
      </article>`;
    },
  ).join("");

  skillFilterEntries = [];
  const rows = skillsList.children;
  SKILLS.forEach((skill, index) => {
    const row = rows[index];
    const state = rowStates.get(getSkillKey(skill)) || {};
    const attributeSelect = row.querySelector("[data-skill-attribute]");
    const trainingSelect = row.querySelector("[data-training-index]");
    const mainDiceInput = row.querySelector("[data-main-dice-count]");
    const diceInput = row.querySelector("[data-dice-modifier]");
    const fixedInput = row.querySelector("[data-fixed-modifier]");
    skillFilterEntries.push({ row, name: normalizeSearchTerm(skill.name), attributeSelect, trainingSelect });
    const attribute = ATTRIBUTES[state.attribute] ? state.attribute : skill.attribute;
    const training = TRAINING[state.training] ? state.training : "leigo";

    attributeSelect.value = attribute;
    trainingSelect.value = training;
    trainingSelect.dataset.previousTraining = training;
    mainDiceInput.value = String(state.mainDiceCount ?? "0");
    diceInput.value = state.diceModifier || "";
    fixedInput.value = state.fixedModifier || "";
    row.querySelector(".training-die").innerHTML = dieSvg(TRAINING[training].die);
    updateTrainingIndicator(row, training);
  });
  updateTrainingCapStatus();
  updateDerivedCombatStats();
}

function hydrateLegendDice() {
  document.querySelectorAll("[data-static-die]").forEach((icon) => {
    icon.innerHTML = dieSvg(Number(icon.dataset.staticDie), icon.hasAttribute("data-die-empty") ? null : undefined);
  });
}

function normalizeSearchTerm(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function makeFeatureId(...parts) {
  return parts
    .map((part) => normalizeSearchTerm(part).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join("--");
}

function rebuildFeatureCatalog() {
  FEATURE_CATALOG = Object.entries(COMPETENCY_TREES).flatMap(([skillName, competencies]) =>
    competencies.flatMap((competency) => {
      const specializations = competency.specializations || [];
      const competencyId = makeFeatureId("competency", skillName, competency.name);
      const competencyFeature = {
        id: competencyId,
        type: "competency",
        skillName,
        name: competency.name,
        description: competency.description,
        uses: competency.uses || [],
        specializationCount: specializations.length,
      };

      const specializationFeatures = specializations.map((specialization) => ({
        id: makeFeatureId("specialization", skillName, competency.name, specialization.name, specialization.ability),
        type: "specialization",
        skillName,
        competencyName: competency.name,
        name: specialization.name,
        ability: specialization.ability,
        description: specialization.text,
      }));

      return [competencyFeature, ...specializationFeatures];
    }),
  );

  FEATURE_BY_ID.clear();
  FEATURE_CATALOG.forEach((feature) => FEATURE_BY_ID.set(feature.id, feature));
}

function createCustomSkillId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeUse(rawUse) {
  if (!rawUse || typeof rawUse !== "object") return null;
  const name = String(rawUse.name || "").trim();
  const text = String(rawUse.text || "").trim();
  return name && text ? { name, text } : null;
}

function sanitizeCompetency(rawCompetency) {
  if (!rawCompetency || typeof rawCompetency !== "object") return null;
  const name = String(rawCompetency.name || "").trim();
  const description = String(rawCompetency.description || "").trim();
  if (!name || !description) return null;

  const uses = Array.isArray(rawCompetency.uses)
    ? rawCompetency.uses.map(sanitizeUse).filter(Boolean).slice(0, 30)
    : [];
  const specializations = Array.isArray(rawCompetency.specializations)
    ? rawCompetency.specializations.map((rawSpecialization) => {
        if (!rawSpecialization || typeof rawSpecialization !== "object") return null;
        const specializationName = String(rawSpecialization.name || "").trim();
        const ability = String(rawSpecialization.ability || "").trim();
        const text = String(rawSpecialization.text || "").trim();
        return specializationName && ability && text
          ? { name: specializationName, ability, text }
          : null;
      }).filter(Boolean).slice(0, 40)
    : [];

  return { name, description, uses, specializations };
}

function sanitizeCustomSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== "object") return null;
  const name = String(rawSkill.name || "").trim();
  const attribute = ATTRIBUTES[rawSkill.attribute] ? rawSkill.attribute : "INT";
  const description = String(rawSkill.description || "").trim();
  if (!name || !description) return null;

  const uses = Array.isArray(rawSkill.uses)
    ? rawSkill.uses.map(sanitizeUse).filter(Boolean).slice(0, 40)
    : [];
  const competencies = Array.isArray(rawSkill.competencies)
    ? rawSkill.competencies.map(sanitizeCompetency).filter(Boolean).slice(0, 20)
    : [];

  return {
    id: String(rawSkill.id || createCustomSkillId()).slice(0, 100),
    name,
    attribute,
    description,
    uses,
    competencies,
  };
}

function registerCustomSkill(customSkill) {
  SKILLS.push({
    id: customSkill.id,
    name: customSkill.name,
    attribute: customSkill.attribute,
    isCustom: true,
  });
  Object.defineProperty(SKILL_DETAILS, customSkill.name, {
    value: { description: customSkill.description, uses: customSkill.uses },
    configurable: true,
    enumerable: true,
    writable: true,
  });
  Object.defineProperty(COMPETENCY_TREES, customSkill.name, {
    value: customSkill.competencies,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}

function getCustomSkillsForCloud() {
  return SKILLS.filter((skill) => skill.isCustom).map((skill) => ({
    id: skill.id,
    name: skill.name,
    attribute: skill.attribute,
    description: SKILL_DETAILS[skill.name]?.description || "",
    uses: SKILL_DETAILS[skill.name]?.uses || [],
    competencies: COMPETENCY_TREES[skill.name] || [],
  }));
}

function persistCustomSkills() {
  // Persistido junto ao Slot da conta Firebase.
}

function loadCustomSkills() {
  // Não existe carregamento local: o Firebase fornece os dados do Slot ativo.
}

function createBuilderUseItem(kind = "skill") {
  const item = document.createElement("article");
  item.className = "builder-repeat-item";
  item.dataset.builderUse = kind;
  item.innerHTML = `
    <label class="builder-field">
      <span>Nome do uso</span>
      <input class="builder-use-name" type="text" autocomplete="off" placeholder="Ex.: Orientar" />
    </label>
    <label class="builder-field">
      <span>Descrição do uso</span>
      <textarea class="builder-use-text" rows="2" placeholder="Explique quando e como este uso funciona."></textarea>
    </label>
    <button class="builder-remove-button" type="button" data-remove-builder-use>Remover</button>`;
  return item;
}

function createBuilderSpecializationItem() {
  const item = document.createElement("article");
  item.className = "builder-repeat-item builder-specialization-item";
  item.dataset.builderSpecialization = "";
  item.innerHTML = `
    <label class="builder-field">
      <span>Especialização</span>
      <input class="builder-specialization-name" type="text" autocomplete="off" placeholder="Ex.: Cartografia" />
    </label>
    <label class="builder-field">
      <span>Nome do uso</span>
      <input class="builder-specialization-ability" type="text" autocomplete="off" placeholder="Ex.: Ler Mapas" />
    </label>
    <label class="builder-field builder-specialization-description">
      <span>Descrição</span>
      <textarea class="builder-specialization-text" rows="2" placeholder="Descreva o benefício ou uso da Especialização."></textarea>
    </label>
    <button class="builder-remove-button" type="button" data-remove-builder-specialization>Remover</button>`;
  return item;
}

function renumberBuilderCompetencies() {
  const cards = [...customCompetenciesList.querySelectorAll(".builder-competency-card")];
  cards.forEach((card, index) => {
    card.querySelector("[data-competency-number]").textContent = `Competência ${index + 1}`;
  });
  customCompetenciesEmpty.hidden = cards.length !== 0;
}

function createBuilderCompetencyCard() {
  const card = document.createElement("article");
  card.className = "builder-competency-card";
  card.innerHTML = `
    <header class="builder-competency-head">
      <strong data-competency-number>Competência</strong>
      <button class="builder-remove-button" type="button" data-remove-builder-competency>Remover Competência</button>
    </header>
    <div class="builder-grid builder-competency-fields">
      <label class="builder-field">
        <span>Nome da Competência</span>
        <input class="builder-competency-name" type="text" autocomplete="off" placeholder="Ex.: Domínio Náutico" />
      </label>
      <label class="builder-field builder-field-wide">
        <span>Descrição</span>
        <textarea class="builder-competency-description" rows="3" placeholder="O que este conhecimento representa?"></textarea>
      </label>
    </div>
    <section class="builder-subgroup">
      <header class="builder-subgroup-head">
        <strong>Usos da Competência</strong>
        <button class="builder-mini-add" type="button" data-add-competency-use>+ Adicionar uso</button>
      </header>
      <div class="builder-subgroup-list" data-competency-uses></div>
    </section>
    <section class="builder-subgroup">
      <header class="builder-subgroup-head">
        <strong>Especializações</strong>
        <button class="builder-mini-add" type="button" data-add-specialization>+ Adicionar Especialização</button>
      </header>
      <div class="builder-subgroup-list" data-competency-specializations></div>
    </section>`;
  return card;
}

function creationEditorPrefix(form) {
  return form.id === "item-editor-form" ? "item" : "ability";
}

function setCreationEditorNavigationSection(form, key = "information") {
  const buttons = [...form.querySelectorAll("[data-creation-jump]")];
  const available = buttons.filter((button) => !button.hidden);
  const selected = available.find((button) => form.querySelector(`#${button.dataset.creationJump}`)?.dataset.creationSection === key) || available[0];
  form.dataset.creationActiveSection = selected ? form.querySelector(`#${selected.dataset.creationJump}`).dataset.creationSection : "information";
  buttons.forEach((button) => {
    const active = button === selected;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
}

function updateCreationEditorNavigation(form) {
  const prefix = creationEditorPrefix(form);
  const name = form.querySelector(`#${prefix}-name`);
  const type = form.querySelector(prefix === "item" ? "#item-type" : "#ability-section");
  const heading = form.querySelector("[data-creation-name]");
  const category = form.querySelector("[data-creation-category]");
  if (heading) heading.textContent = name?.value.trim() || (prefix === "item" ? "Novo item" : "Novo conhecimento");
  if (category) category.textContent = type?.selectedOptions?.[0]?.textContent || (prefix === "item" ? "Item" : "Habilidade");
  form.querySelectorAll("[data-creation-jump]").forEach((button) => {
    const section = form.querySelector(`#${button.dataset.creationJump}`);
    button.hidden = !section || section.hidden;
  });
  setCreationEditorNavigationSection(form, form.dataset.creationActiveSection || "information");
}

function goToCreationEditorSection(form, key) {
  const section = [...form.querySelectorAll("[data-creation-section]")].find((entry) => entry.dataset.creationSection === key);
  if (!section || section.hidden) return false;
  if (section.tagName === "DETAILS") section.open = true;
  setCreationEditorNavigationSection(form, key);
  const richEditor = section.querySelector('[contenteditable="true"]');
  const control = richEditor || [...section.querySelectorAll("input, select, textarea, button")].find((entry) => !entry.disabled && isCreationEditorControlVisible(entry)) || section.querySelector(":scope > summary");
  if (control) focusCreationEditorField(control, { preventScroll: true });
  const content = form.querySelector(".ability-editor-content");
  if (content) {
    const top = Math.max(0, content.scrollTop + section.getBoundingClientRect().top - content.getBoundingClientRect().top - 20);
    if (content.scrollTo) content.scrollTo({ top, behavior: "auto" });
    else content.scrollTop = top;
  }
  return true;
}

function initializeCreationEditorNavigation(form) {
  if (!form.dataset.creationNavigationReady) {
    form.dataset.creationNavigationReady = "true";
    form.addEventListener("click", (event) => {
      const button = event.target.closest("[data-creation-jump]");
      if (!button || !form.contains(button) || button.hidden) return;
      const section = form.querySelector(`#${button.dataset.creationJump}`);
      if (section) goToCreationEditorSection(form, section.dataset.creationSection);
    });
    form.addEventListener("input", () => updateCreationEditorNavigation(form));
    form.addEventListener("change", () => updateCreationEditorNavigation(form));
    form.addEventListener("focusin", (event) => {
      const section = event.target.closest("[data-creation-section]");
      if (section && form.contains(section)) setCreationEditorNavigationSection(form, section.dataset.creationSection);
    });
  }
  form.dataset.creationActiveSection = "information";
  updateCreationEditorNavigation(form);
  const content = form.querySelector(".ability-editor-content");
  if (content) content.scrollTop = 0;
}


function revealCreationEditorField(field) {
  let panel = field?.closest?.("details");
  while (panel) {
    panel.open = true;
    panel = panel.parentElement?.closest?.("details");
  }
}

function focusCreationEditorField(field, options = {}) {
  if (!field) return;
  revealCreationEditorField(field);
  try { field.focus(options); } catch { field.focus(); }
  if (!options.preventScroll) field.scrollIntoView?.({ block: "nearest", behavior: "auto" });
}

function setCreationEditorPanels(form, creation = null) {
  const hasMechanics = Boolean(creation && (
    creation.rolls?.length || creation.costs?.length || creation.hasDamage || creation.isWeapon ||
    creation.damageProfile?.primary || creation.grantsModifiers || creation.modifiers?.length
  ));
  const hasMedia = Boolean(creation?.mediaUrl || creation?.mediaRefId);
  form.querySelectorAll("details[data-editor-panel]").forEach((panel) => {
    panel.open = panel.dataset.editorPanel === "mechanics" ? hasMechanics :
      panel.dataset.editorPanel === "media" ? hasMedia : false;
  });
}

function isCreationEditorControlVisible(control) {
  if (control.closest("[hidden]")) return false;
  let panel = control.closest("details");
  while (panel) {
    const summary = panel.querySelector(":scope > summary");
    if (!panel.open && !summary?.contains(control)) return false;
    panel = panel.parentElement?.closest?.("details");
  }
  return true;
}

function setBuilderError(message, field) {
  customSkillError.textContent = message;
  customSkillError.hidden = !message;
  if (field) {
    field.classList.add("is-invalid");
    focusCreationEditorField(field, { preventScroll: true });
    field.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function readBuilderUses(container, label) {
  const uses = [];
  container.querySelectorAll(":scope > [data-builder-use]").forEach((item) => {
    const nameInput = item.querySelector(".builder-use-name");
    const textInput = item.querySelector(".builder-use-text");
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name && !text) return;
    if (!name) throw { message: `Dê um nome ao ${label}.`, field: nameInput };
    if (!text) throw { message: `Escreva a descrição de “${name}”.`, field: textInput };
    uses.push({ name, text });
  });
  return uses;
}

function assertUniqueNames(items, label) {
  const seen = new Set();
  items.forEach((item) => {
    const normalized = normalizeSearchTerm(item.name);
    if (seen.has(normalized)) throw { message: `${label} não podem repetir o mesmo nome.` };
    seen.add(normalized);
  });
}

function readCustomSkillForm() {
  customSkillForm.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
  setBuilderError("");

  const name = customSkillNameInput.value.trim();
  const description = customSkillDescriptionInput.value.trim();
  if (!name) throw { message: "Dê um nome à nova Perícia.", field: customSkillNameInput };
  if (SKILLS.some((skill) => normalizeSearchTerm(skill.name) === normalizeSearchTerm(name))) {
    throw { message: `Já existe uma Perícia chamada “${name}”.`, field: customSkillNameInput };
  }
  if (!description) throw { message: "Escreva o que esta Perícia representa.", field: customSkillDescriptionInput };

  const uses = readBuilderUses(customUsesList, "Uso Geral");
  assertUniqueNames(uses, "Os Usos Gerais");

  const competencies = [...customCompetenciesList.querySelectorAll(":scope > .builder-competency-card")].map((card) => {
    const nameInput = card.querySelector(".builder-competency-name");
    const descriptionInput = card.querySelector(".builder-competency-description");
    const competencyName = nameInput.value.trim();
    const competencyDescription = descriptionInput.value.trim();
    if (!competencyName) throw { message: "Dê um nome à Competência.", field: nameInput };
    if (!competencyDescription) throw { message: `Escreva a descrição de “${competencyName}”.`, field: descriptionInput };

    const competencyUses = readBuilderUses(card.querySelector("[data-competency-uses]"), "uso da Competência");
    assertUniqueNames(competencyUses, `Os usos de “${competencyName}”`);
    const specializations = [...card.querySelectorAll("[data-builder-specialization]")].map((item) => {
      const specializationNameInput = item.querySelector(".builder-specialization-name");
      const abilityInput = item.querySelector(".builder-specialization-ability");
      const textInput = item.querySelector(".builder-specialization-text");
      const specializationName = specializationNameInput.value.trim();
      const ability = abilityInput.value.trim();
      const text = textInput.value.trim();
      if (!specializationName) throw { message: `Dê um nome a uma Especialização de “${competencyName}”.`, field: specializationNameInput };
      if (!ability) throw { message: `Dê um nome ao uso de “${specializationName}”.`, field: abilityInput };
      if (!text) throw { message: `Escreva a descrição de “${specializationName}”.`, field: textInput };
      return { name: specializationName, ability, text };
    });
    assertUniqueNames(specializations, `As Especializações de “${competencyName}”`);

    return {
      name: competencyName,
      description: competencyDescription,
      uses: competencyUses,
      specializations,
    };
  });
  assertUniqueNames(competencies, "As Competências");

  return {
    id: createCustomSkillId(),
    name,
    attribute: customSkillAttributeSelect.value,
    description,
    uses,
    competencies,
  };
}

function resetCustomSkillForm() {
  customSkillForm.reset();
  customUsesList.replaceChildren(createBuilderUseItem("skill"));
  customCompetenciesList.replaceChildren();
  renumberBuilderCompetencies();
  setBuilderError("");
}

function openCustomSkill(triggerButton) {
  activeCustomSkillTrigger = triggerButton;
  resetCustomSkillForm();
  customSkillModal.hidden = false;
  syncModalLock();
  customSkillDialog.focus();
  requestAnimationFrame(() => customSkillNameInput.focus());
}

function closeCustomSkill() {
  customSkillModal.hidden = true;
  syncModalLock();
  if (activeCustomSkillTrigger?.isConnected) activeCustomSkillTrigger.focus();
}

function submitCustomSkill(event) {
  event.preventDefault();
  try {
    const rowStates = captureSkillRowState();
    const customSkill = readCustomSkillForm();
    registerCustomSkill(customSkill);
    sortSkillsAlphabetically();
    persistCustomSkills();
    rebuildFeatureCatalog();
    renderSkills(rowStates);
    skillSearchInput.value = customSkill.name;
    attributeFilter.value = "all";
    trainingFilter.value = "all";
    filterSkills();
    closeCustomSkill();

    const newRow = [...skillsList.querySelectorAll("[data-skill-key]")]
      .find((row) => row.dataset.skillKey === customSkill.id);
    if (newRow) {
      newRow.classList.add("is-new");
      newRow.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    notifySheetChanged("custom-skill-created");
  } catch (error) {
    setBuilderError(userFacingErrorMessage(error) || "Não foi possível criar a Perícia. Revise os campos.", error?.field);
  }
}

function openDeleteSkill(skillId, triggerButton) {
  const skill = SKILLS.find((item) => item.id === skillId && item.isCustom);
  if (!skill) return;
  pendingDeleteSkillId = skillId;
  pendingDeleteTrigger = triggerButton;
  deleteSkillDescription.textContent = `“${skill.name}” e toda a sua constelação serão removidas desta ficha.`;
  deleteSkillModal.hidden = false;
  syncModalLock();
  deleteSkillDialog.focus();
  requestAnimationFrame(() => confirmDeleteSkillButton.focus());
}

function closeDeleteSkill() {
  deleteSkillModal.hidden = true;
  syncModalLock();
  if (pendingDeleteTrigger?.isConnected) pendingDeleteTrigger.focus();
  pendingDeleteSkillId = null;
  pendingDeleteTrigger = null;
}

function deletePendingCustomSkill() {
  const skillIndex = SKILLS.findIndex((skill) => skill.id === pendingDeleteSkillId && skill.isCustom);
  if (skillIndex < 0) return closeDeleteSkill();
  const rowStates = captureSkillRowState();
  const [skill] = SKILLS.splice(skillIndex, 1);

  [...selectedFeatureIds].forEach((featureId) => {
    if (FEATURE_BY_ID.get(featureId)?.skillName === skill.name) selectedFeatureIds.delete(featureId);
  });
  delete SKILL_DETAILS[skill.name];
  delete COMPETENCY_TREES[skill.name];
  if (normalizeSearchTerm(skillSearchInput.value) === normalizeSearchTerm(skill.name)) {
    skillSearchInput.value = "";
  }
  persistCustomSkills();
  rebuildFeatureCatalog();
  persistSelectedFeatures();
  renderSelectedFeatures();
  renderSkills(rowStates);
  filterSkills();
  closeDeleteSkill();
  openCustomSkillButton.focus();
  notifySheetChanged("custom-skill-deleted");
}

