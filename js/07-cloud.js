
/*
 * FIREBASE — CONFIGURAÇÃO DO SEU APLICATIVO WEB
 * No Console do Firebase, abra Configurações do projeto > Geral > Seus apps.
 * Copie o objeto firebaseConfig do seu app Web e substitua o bloco abaixo.
 * Estes identificadores pertencem ao front-end; a proteção dos dados é feita
 * pelas Regras do Firestore vinculadas ao UID de cada usuário.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCStSJViKOb-wvemW5lBrXRB9XZGJX8G2c",
  authDomain: "abyssrpg.firebaseapp.com",
  projectId: "abyssrpg",
  messagingSenderId: "799391481878",
  appId: "1:799391481878:web:acbb7404cdbbe2e19fb537",
  measurementId: "G-ERGJ6DNFMH",
};

const FIREBASE_SDK_VERSION = "12.18.0";
const sheetBridge = window.AbyssSheet;
const MINERVA_ADMIN_EMAILS = new Set([
  "zkyokoo007@gmail.com",
  "anthonysousabr002@gmail.com",
  "annysousa314@gmail.com",
]);
const FIRESTORE_MEDIA_CHUNK_SIZE = 650000;
const MAX_ABILITY_MEDIA_BYTES = 8 * 1024 * 1024;
const ALLOWED_ABILITY_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const firebaseUi = {
  button: document.querySelector("#account-button"),
  label: document.querySelector("#account-label"),
  shortStatus: document.querySelector("#account-status"),
  icon: document.querySelector("#account-icon"),
  avatar: document.querySelector("#account-avatar"),
  menu: document.querySelector("#account-menu"),
  menuAvatar: document.querySelector("#account-menu-avatar"),
  placeholder: document.querySelector("#account-person-placeholder"),
  name: document.querySelector("#account-menu-name"),
  email: document.querySelector("#account-menu-email"),
  syncCard: document.querySelector("#account-sync-card"),
  syncTitle: document.querySelector("#account-sync-title"),
  syncMessage: document.querySelector("#account-sync-message"),
  login: document.querySelector("#account-login"),
  syncNow: document.querySelector("#account-sync-now"),
  exportSheet: document.querySelector("#account-export-sheet"),
  importSheet: document.querySelector("#account-import-sheet"),
  reset: document.querySelector("#account-reset-sheet"),
  signOut: document.querySelector("#account-sign-out"),
  slotCard: document.querySelector("#account-slot-card"),
  slotName: document.querySelector("#account-slot-name"),
  minervaButton: document.querySelector("#minerva-button"),
  slotsDialog: document.querySelector("#slots-dialog"),
  slotsWorkspace: document.querySelector("#slots-workspace"),
  slotsFolderList: document.querySelector("#slots-folder-list"),
  slotsSearch: document.querySelector("#slots-search"),
  slotsVisibleCount: document.querySelector("#slots-visible-count"),
  slotsList: document.querySelector("#slots-list"),
  slotsLoginNote: document.querySelector("#slots-login-note"),
  createSlotForm: document.querySelector("#create-slot-form"),
  newSlotName: document.querySelector("#new-slot-name"),
  newSlotFolder: document.querySelector("#new-slot-folder"),
  createSlotFolderForm: document.querySelector("#create-slot-folder-form"),
  newSlotFolderName: document.querySelector("#new-slot-folder-name"),
  slotsFolderNav: document.querySelector("#slots-folder-nav"),
  slotsFolderBack: document.querySelector("#slots-folder-back"),
  slotsFolderName: document.querySelector("#slots-folder-name"),
  slotsFolderStatus: document.querySelector("#slots-folder-status"),
  slotsTransferPanel: document.querySelector("#slots-transfer-panel"),
  slotsExportCurrent: document.querySelector("#slots-export-current"),
  slotsImportCode: document.querySelector("#slots-import-code"),
  startupGate: document.querySelector("#startup-slot-gate"),
  startupGateDialog: document.querySelector("#startup-slot-gate .slot-gate-dialog"),
  startupGateDescription: document.querySelector("#startup-slot-description"),
  startupGateSpinner: document.querySelector("#startup-slot-spinner"),
  startupGateStatus: document.querySelector("#startup-slot-status"),
  startupGateSummary: document.querySelector("#startup-slot-summary"),
  startupGateList: document.querySelector("#startup-slot-list"),
  startupFolderNav: document.querySelector("#startup-folder-nav"),
  startupFolderBack: document.querySelector("#startup-folder-back"),
  startupFolderName: document.querySelector("#startup-folder-name"),
  startupGateActions: document.querySelector("#startup-slot-actions"),
  startupGateRetry: document.querySelector("#startup-slot-retry"),
  startupGateSignOut: document.querySelector("#startup-slot-sign-out"),
  startupCreateForm: document.querySelector("#startup-create-form"),
  startupCreateName: document.querySelector("#startup-create-name"),
  startupCreateFolder: document.querySelector("#startup-create-folder"),
  startupCreateButton: document.querySelector("#startup-create-button"),
  startupCreateCancel: document.querySelector("#startup-create-cancel"),
  startupCreateSubmit: document.querySelector("#startup-create-submit"),
  startupCreateStatus: document.querySelector("#startup-create-status"),
  transferModal: document.querySelector("#sheet-transfer-modal"),
  transferDialog: document.querySelector("#sheet-transfer-dialog"),
  transferTitle: document.querySelector("#sheet-transfer-title"),
  transferDescription: document.querySelector("#sheet-transfer-description"),
  transferCode: document.querySelector("#sheet-transfer-code"),
  transferCount: document.querySelector("#sheet-transfer-count"),
  transferStatus: document.querySelector("#sheet-transfer-status"),
  transferCopy: document.querySelector("#sheet-transfer-copy"),
  transferPrimary: document.querySelector("#sheet-transfer-primary"),
  transferSlotField: document.querySelector("#sheet-transfer-slot-field"),
  transferSlotName: document.querySelector("#sheet-transfer-slot-name"),
};

let firebaseAuth = null;
let firestoreDb = null;
let authApi = null;
let firestoreApi = null;
let currentFirebaseUser = null;
let sheetTransferMode = "export";
let sheetTransferSlotId = "";
let sheetTransferTrigger = null;
let currentSlotId = null;
let currentSlots = [];
const UNFILED_SLOT_FOLDER = "__unfiled__";
let currentSlotFolders = [];
let currentSlotFolderId = null;
const pendingSlotMoves = new Map();
let startupSlotFolderId = null;
let startupCreateBusy = false;
let authChangeSequence = 0;
let cloudSaveTimer = null;
let cloudSavePromise = null;
let stateRevision = 0;
let lastSavedRevision = 0;
let isHydratingCloudState = false;
let preferredStartupSlotId = "";

const campaignUi = {
  app: document.querySelector("#campaign-app"),
  openButton: document.querySelector("#campaign-button"),
  exit: document.querySelector("#campaign-exit"),
  userAvatar: document.querySelector("#campaign-user-avatar"),
  userFallback: document.querySelector("#campaign-user-fallback"),
  userName: document.querySelector("#campaign-user-name"),
  loading: document.querySelector("#campaign-loading"),
  dashboard: document.querySelector("#campaign-dashboard"),
  masterList: document.querySelector("#campaign-master-list"),
  playerList: document.querySelector("#campaign-player-list"),
  createButtons: [...document.querySelectorAll("#campaign-create-button, [data-open-campaign-create]")],
  joinButtons: [...document.querySelectorAll("#campaign-join-button, [data-open-campaign-join]")],
  detail: document.querySelector("#campaign-detail"),
  detailBack: document.querySelector("#campaign-detail-back"),
  hero: document.querySelector("#campaign-hero"),
  detailRole: document.querySelector("#campaign-detail-role"),
  detailMembersCount: document.querySelector("#campaign-detail-members-count"),
  detailName: document.querySelector("#campaign-detail-name"),
  detailSynopsis: document.querySelector("#campaign-detail-synopsis"),
  detailCode: document.querySelector("#campaign-detail-code"),
  codeValue: document.querySelector("#campaign-code-value"),
  copyCode: document.querySelector("#campaign-copy-code"),
  shieldButton: document.querySelector("#campaign-shield-button"),
  attachSheet: document.querySelector("#campaign-attach-sheet"),
  edit: document.querySelector("#campaign-edit-button"),
  leave: document.querySelector("#campaign-leave-button"),
  remove: document.querySelector("#campaign-delete-button"),
  sheetLimitNote: document.querySelector("#campaign-sheet-limit-note"),
  sheetCount: document.querySelector("#campaign-sheet-count"),
  sheetList: document.querySelector("#campaign-sheet-list"),
  membersList: document.querySelector("#campaign-members-list"),
  shield: document.querySelector("#campaign-shield"),
  shieldBack: document.querySelector("#campaign-shield-back"),
  shieldHero: document.querySelector("#campaign-shield-hero"),
  shieldName: document.querySelector("#campaign-shield-name"),
  shieldToggleWrap: document.querySelector("#campaign-shield-toggle-wrap"),
  shieldHideStats: document.querySelector("#campaign-shield-hide-stats"),
  shieldVisibility: document.querySelector("#campaign-shield-visibility"),
  shieldControlNote: document.querySelector("#campaign-shield-control-note"),
  shieldCount: document.querySelector("#campaign-shield-count"),
  shieldRoster: document.querySelector("#campaign-shield-roster"),
  editorModal: document.querySelector("#campaign-editor-modal"),
  editorDialog: document.querySelector("#campaign-editor-dialog"),
  editorForm: document.querySelector("#campaign-editor-form"),
  editorTitle: document.querySelector("#campaign-editor-title"),
  editorSubmit: document.querySelector("#campaign-editor-submit"),
  editorError: document.querySelector("#campaign-editor-error"),
  name: document.querySelector("#campaign-name"),
  synopsis: document.querySelector("#campaign-synopsis"),
  bannerUrl: document.querySelector("#campaign-banner-url"),
  bannerFile: document.querySelector("#campaign-banner-file"),
  bannerPreview: document.querySelector("#campaign-banner-preview"),
  bannerCropModal: document.querySelector("#campaign-banner-crop-modal"),
  bannerCropDialog: document.querySelector("#campaign-banner-crop-dialog"),
  bannerCropViewport: document.querySelector("#campaign-banner-crop-viewport"),
  bannerCropImage: document.querySelector("#campaign-banner-crop-image"),
  bannerZoom: document.querySelector("#campaign-banner-zoom"),
  bannerZoomOut: document.querySelector("#campaign-banner-zoom-out"),
  bannerZoomIn: document.querySelector("#campaign-banner-zoom-in"),
  bannerCenter: document.querySelector("#campaign-banner-center"),
  bannerCropApply: document.querySelector("#campaign-banner-crop-apply"),
  bannerCropNote: document.querySelector("#campaign-banner-crop-note"),
  joinModal: document.querySelector("#campaign-join-modal"),
  joinDialog: document.querySelector("#campaign-join-dialog"),
  joinForm: document.querySelector("#campaign-join-form"),
  joinCode: document.querySelector("#campaign-join-code"),
  joinError: document.querySelector("#campaign-join-error"),
  joinSubmit: document.querySelector("#campaign-join-submit"),
  slotModal: document.querySelector("#campaign-slot-modal"),
  slotDialog: document.querySelector("#campaign-slot-dialog"),
  slotForm: document.querySelector("#campaign-slot-form"),
  slotList: document.querySelector("#campaign-slot-list"),
  slotPrivate: document.querySelector("#campaign-slot-private"),
  slotError: document.querySelector("#campaign-slot-error"),
  slotSubmit: document.querySelector("#campaign-slot-submit"),
  sheetSessionBar: document.querySelector("#campaign-sheet-session-bar"),
  sheetSessionTitle: document.querySelector("#campaign-sheet-session-title"),
  sheetSessionStatus: document.querySelector("#campaign-sheet-session-status"),
  sheetSessionBack: document.querySelector("#campaign-sheet-session-back"),
};

let campaignRecords = [];
let activeCampaign = null;
let activeCampaignMembers = [];
let activeCampaignSheets = [];
let campaignEditorId = "";
let campaignBannerDraft = "";
let campaignBannerCropped = "";
let campaignSheetSession = null;
let campaignShieldUnsubscribers = [];
const campaignShieldProfiles = new Map();
let campaignBusy = false;
const campaignBannerCropState = {
  source: "",
  image: null,
  zoom: 1.04,
  x: 0,
  y: 0,
  pointerId: null,
  dragStartX: 0,
  dragStartY: 0,
  originX: 0,
  originY: 0,
  inputType: "",
};



function normalizeCampaignCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function campaignSheetLinkId(ownerUid, slotId) {
  return `${String(ownerUid || "").replaceAll("/", "_")}_${String(slotId || "").replaceAll("/", "_")}`;
}

function safeCampaignBanner(value) {
  const source = String(value || "").trim();
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(source)) return source;
  try {
    const url = new URL(source);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function campaignTimestamp(value) {
  if (value?.toMillis) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function setCampaignBanner(element, value) {
  if (!element) return;
  const banner = safeCampaignBanner(value);
  element.style.backgroundImage = banner ? `url("${banner.replaceAll('"', '%22')}")` : "";
  element.classList.toggle("has-image", Boolean(banner));
}

function setCampaignFormError(element, message = "") {
  element.textContent = message;
  element.hidden = !message;
}

function setCampaignModal(modal, dialog, open) {
  modal.hidden = !open;
  document.body.classList.toggle(
    "modal-open",
    open || [...document.querySelectorAll(".campaign-modal")].some((item) => !item.hidden),
  );
  if (open) requestAnimationFrame(() => dialog.focus());
}

function closeAllCampaignModals() {
  const pointerId = campaignBannerCropState.pointerId;
  campaignBannerCropState.pointerId = null;
  campaignUi.bannerCropViewport?.classList.remove("is-dragging");
  if (pointerId !== null && campaignUi.bannerCropViewport?.hasPointerCapture?.(pointerId)) {
    campaignUi.bannerCropViewport.releasePointerCapture(pointerId);
  }
  document.querySelectorAll(".campaign-modal").forEach((modal) => { modal.hidden = true; });
  document.body.classList.remove("modal-open");
}

function renderCampaignIdentity() {
  const user = currentFirebaseUser;
  const identity = getEffectiveIdentity(user);
  const name = identity.displayName;
  campaignUi.userName.textContent = name;
  campaignUi.userFallback.textContent = name.trim().charAt(0).toUpperCase() || "A";
  campaignUi.userAvatar.hidden = !identity.photoURL;
  campaignUi.userFallback.hidden = Boolean(identity.photoURL);
  if (identity.photoURL) campaignUi.userAvatar.src = identity.photoURL;
  else campaignUi.userAvatar.removeAttribute("src");
}

function campaignEmptyLane(title, description) {
  const empty = document.createElement("div");
  empty.className = "campaign-empty-lane";
  const copy = document.createElement("div");
  const mark = document.createElement("span");
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "✦";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = description;
  copy.append(mark, heading, text);
  empty.append(copy);
  return empty;
}

function createCampaignCard(record) {
  const card = document.createElement("article");
  card.className = "campaign-card";
  card.tabIndex = 0;
  card.dataset.campaignId = record.id;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Abrir Campanha ${record.name}`);

  const banner = document.createElement("div");
  banner.className = "campaign-card-banner";
  setCampaignBanner(banner, record.banner);
  const role = document.createElement("span");
  role.className = "campaign-card-role";
  role.textContent = record.role === "master" ? "Mestre" : "Jogador";
  banner.append(role);

  const copy = document.createElement("div");
  copy.className = "campaign-card-copy";
  const name = document.createElement("strong");
  name.textContent = record.name || "Campanha sem nome";
  const synopsis = document.createElement("p");
  synopsis.textContent = record.synopsis || "Sem sinopse.";
  const meta = document.createElement("div");
  meta.className = "campaign-card-meta";
  const owner = document.createElement("span");
  owner.textContent = record.role === "master" ? "Sua criação" : `Mestre: ${record.ownerName || "Campanha"}`;
  const action = document.createElement("b");
  action.textContent = "Abrir →";
  meta.append(owner, action);
  copy.append(name, synopsis, meta);
  card.append(banner, copy);
  return card;
}

function renderCampaignDashboard() {
  const masters = campaignRecords.filter((record) => record.role === "master");
  const players = campaignRecords.filter((record) => record.role !== "master");
  campaignUi.masterList.replaceChildren();
  campaignUi.playerList.replaceChildren();

  if (masters.length) masters.forEach((record) => campaignUi.masterList.append(createCampaignCard(record)));
  else campaignUi.masterList.append(campaignEmptyLane("Nenhuma Campanha como Mestre", "Crie uma jornada e compartilhe o código com seus jogadores."));

  if (players.length) players.forEach((record) => campaignUi.playerList.append(createCampaignCard(record)));
  else campaignUi.playerList.append(campaignEmptyLane("Você ainda não entrou em uma Campanha", "Use o código recebido de um Mestre para participar."));
}

async function loadCampaignRecords() {
  if (!currentFirebaseUser || !firestoreDb || !firestoreApi) return [];
  const recordsUid = currentFirebaseUser.uid;
  const recordsEpoch = accountRollEpoch;
  const indexRef = firestoreApi.collection(
    firestoreDb,
    "users",
    currentFirebaseUser.uid,
    "campaigns",
  );
  const indexSnapshot = await withCloudTimeout(
    firestoreApi.getDocs(indexRef),
    20000,
    "As Campanhas demoraram demais para carregar.",
  );
  const records = await Promise.all(indexSnapshot.docs.map(async (indexDoc) => {
    const campaignSnapshot = await firestoreApi.getDoc(
      firestoreApi.doc(firestoreDb, "campaigns", indexDoc.id),
    );
    if (!campaignSnapshot.exists()) return null;
    const indexData = indexDoc.data() || {};
    const data = campaignSnapshot.data() || {};
    return {
      id: campaignSnapshot.id,
      ...data,
      role: indexData.role === "master" || data.ownerUid === recordsUid
        ? "master"
        : "player",
      joinedAt: indexData.joinedAt || data.createdAt,
    };
  }));
  if (currentFirebaseUser?.uid !== recordsUid || accountRollEpoch !== recordsEpoch) return [];
  campaignRecords = records
    .filter(Boolean)
    .sort((a, b) => campaignTimestamp(b.updatedAt || b.createdAt) - campaignTimestamp(a.updatedAt || a.createdAt));
  syncRollCampaignSubscriptions();
  return campaignRecords;
}

async function openCampaignPortal() {
  if (campaignSheetSession) {
    await closeCampaignSheetSession();
    return;
  }
  if (!currentFirebaseUser) {
    window.dispatchEvent(new CustomEvent("abyss:firebase-login"));
    await window.showAbyssAlert?.({
      eyebrow: "Campanhas",
      title: "Entre com o Google",
      message: "As Campanhas são compartilhadas através da sua conta Google.",
      tone: "info",
      trigger: campaignUi.openButton,
    });
    return;
  }
  if (!firestoreDb || !firestoreApi || campaignBusy) return;
  renderCampaignIdentity();
  campaignUi.app.hidden = false;
  campaignUi.loading.hidden = false;
  campaignUi.loading.textContent = "Carregando Campanhas…";
  campaignUi.loading.classList.remove("is-error");
  campaignUi.dashboard.hidden = true;
  campaignUi.detail.hidden = true;
  campaignUi.shield.hidden = true;
  stopCampaignShieldRealtime();
  document.body.classList.add("campaign-mode");
  campaignBusy = true;
  try {
    await loadCampaignRecords();
    renderCampaignDashboard();
    campaignUi.loading.hidden = true;
    campaignUi.dashboard.hidden = false;
    campaignUi.dashboard.querySelector("h1")?.focus?.();
  } catch (error) {
    campaignUi.loading.textContent = describeFirebaseError(error);
    campaignUi.loading.classList.add("is-error");
  } finally {
    campaignBusy = false;
  }
}

function closeCampaignPortal() {
  closeAllCampaignModals();
  stopCampaignShieldRealtime();
  campaignShieldProfiles.clear();
  campaignUi.app.hidden = true;
  document.body.classList.remove("campaign-mode");
  activeCampaign = null;
  activeCampaignMembers = [];
  activeCampaignSheets = [];
  campaignUi.openButton.focus();
}

function showCampaignDashboard() {
  stopCampaignShieldRealtime();
  campaignShieldProfiles.clear();
  activeCampaign = null;
  activeCampaignMembers = [];
  activeCampaignSheets = [];
  campaignUi.detail.hidden = true;
  campaignUi.shield.hidden = true;
  campaignUi.loading.hidden = true;
  campaignUi.dashboard.hidden = false;
  renderCampaignDashboard();
  campaignUi.app.scrollTo({ top: 0, behavior: "smooth" });
}

function createCampaignMemberRow(member) {
  const row = document.createElement("article");
  row.className = "campaign-member";
  const avatar = document.createElement("span");
  avatar.className = "campaign-member-avatar";
  if (member.photoURL) {
    const image = document.createElement("img");
    image.src = member.photoURL;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    avatar.append(image);
  } else {
    avatar.textContent = String(member.displayName || "A").charAt(0).toUpperCase();
  }
  const copy = document.createElement("div");
  copy.className = "campaign-member-copy";
  const name = document.createElement("strong");
  name.textContent = member.displayName || "Jogador";
  const role = document.createElement("small");
  role.textContent = member.role === "master" ? "Mestre" : "Jogador";
  copy.append(name, role);
  row.append(avatar, copy);
  return row;
}

function canViewCampaignSheet(sheet, role = activeCampaign?.role, uid = currentFirebaseUser?.uid) {
  return Boolean(sheet && uid && (sheet.ownerUid === uid || role === "master" || sheet.privateToPlayers === false));
}

function createCampaignSheetCard(sheet) {
  const card = document.createElement("article");
  card.className = "campaign-sheet-card";
  const avatar = document.createElement("span");
  avatar.className = "campaign-sheet-avatar";
  const portrait = safeCampaignBanner(sheet.portrait);
  if (portrait) {
    const image = document.createElement("img");
    image.src = portrait;
    image.alt = "";
    avatar.append(image);
  } else {
    avatar.textContent = String(sheet.characterName || sheet.slotName || "A").charAt(0).toUpperCase();
  }
  const copy = document.createElement("div");
  copy.className = "campaign-sheet-copy";
  const name = document.createElement("strong");
  name.textContent = sheet.characterName || sheet.slotName || "Ficha sem nome";
  const owner = document.createElement("small");
  owner.textContent = `${sheet.ownerName || "Jogador"} · ${sheet.slotName || "Slot"}`;
  const tags = document.createElement("div");
  tags.className = "campaign-sheet-tags";
  const access = document.createElement("span");
  access.className = `campaign-sheet-tag${sheet.privateToPlayers ? " is-private" : ""}`;
  access.textContent = sheet.privateToPlayers ? "Privada para jogadores" : "Visível aos jogadores";
  tags.append(access);
  if (sheet.ownerUid === currentFirebaseUser?.uid) {
    const mine = document.createElement("span");
    mine.className = "campaign-sheet-tag";
    mine.textContent = "Sua ficha";
    tags.append(mine);
  }
  copy.append(name, owner, tags);

  const actions = document.createElement("div");
  actions.className = "campaign-sheet-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "is-primary";
  open.dataset.openCampaignSheet = sheet.id;
  const canEdit = activeCampaign?.role === "master" || sheet.ownerUid === currentFirebaseUser?.uid;
  open.textContent = canEdit ? "Abrir e editar" : "Visualizar";
  if (!canViewCampaignSheet(sheet)) {
    open.disabled = true;
    open.classList.add("is-locked");
    open.title = "A ficha continua na Campanha, mas somente o dono e o Mestre podem abri-la.";
    open.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4.5" y="8.5" width="11" height="8" rx="1.5"/><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 12v1.5"/></svg><span>Ficha privada</span>';
  }
  actions.append(open);

  if (sheet.ownerUid === currentFirebaseUser?.uid) {
    const privacy = document.createElement("button");
    privacy.type = "button";
    privacy.dataset.toggleCampaignSheetPrivacy = sheet.id;
    privacy.textContent = sheet.privateToPlayers ? "Tornar visível" : "Privar de jogadores";
    actions.append(privacy);
  }
  if (sheet.ownerUid === currentFirebaseUser?.uid || activeCampaign?.role === "master") {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "is-danger";
    remove.dataset.unlinkCampaignSheet = sheet.id;
    remove.textContent = "Desvincular";
    actions.append(remove);
  }
  card.append(avatar, copy, actions);
  return card;
}

function stopCampaignShieldRealtime() {
  campaignShieldUnsubscribers.forEach((unsubscribe) => {
    try {
      unsubscribe?.();
    } catch {
      // Uma assinatura já encerrada não exige nenhuma ação adicional.
    }
  });
  campaignShieldUnsubscribers = [];
}

function campaignShieldResourceValues(profile, resource) {
  const stored = profile?.resources?.[resource];
  const currentValue = Number.parseInt(stored?.current, 10);
  const maximumValue = Number.parseInt(stored?.max, 10);
  const current = Number.isFinite(currentValue) ? Math.min(999999, Math.max(0, currentValue)) : 0;
  const max = Number.isFinite(maximumValue) ? Math.min(999999, Math.max(0, maximumValue)) : 0;
  return {
    current,
    max,
    temporary: resource === "sa" ? 0 : Math.max(0, current - max),
    percent: max > 0 ? Math.min(100, (Math.min(current, max) / max) * 100) : (current > 0 ? 100 : 0),
  };
}

function createCampaignShieldStat(profile, resource) {
  const labels = { pv: "PV", pa: "PA", sa: "SA" };
  const values = campaignShieldResourceValues(profile, resource);
  const row = document.createElement("div");
  row.className = "campaign-shield-stat";
  row.dataset.stat = resource;

  const copy = document.createElement("div");
  copy.className = "campaign-shield-stat-copy";
  const label = document.createElement("span");
  label.textContent = labels[resource];
  const value = document.createElement("strong");
  value.textContent = `${values.current} / ${values.max}`;
  copy.append(label, value);
  if (values.temporary > 0) {
    const temporary = document.createElement("em");
    temporary.textContent = `+${values.temporary} temporários`;
    copy.append(temporary);
  }

  const track = document.createElement("div");
  track.className = "campaign-shield-stat-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", `${labels[resource]} de ${values.current} em ${values.max}`);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(values.max));
  track.setAttribute("aria-valuenow", String(Math.min(values.current, values.max)));
  const fill = document.createElement("span");
  fill.className = "campaign-shield-stat-fill";
  fill.style.width = `${values.percent}%`;
  track.append(fill);
  row.append(copy, track);
  return row;
}

function campaignShieldStatsHiddenForViewer() {
  return activeCampaign?.role !== "master" && Boolean(activeCampaign?.hideShieldStats);
}

function createCampaignShieldCharacter(sheet) {
  const cached = campaignShieldProfiles.get(sheet.id) || { loading: true };
  const profile = cached.profile || {};
  const characterName = String(profile.name || sheet.characterName || sheet.slotName || "Ficha sem nome");
  const portrait = safeCampaignBanner(profile.portrait || sheet.portrait);
  const canEdit = activeCampaign?.role === "master" || sheet.ownerUid === currentFirebaseUser?.uid;
  const card = document.createElement("article");
  card.className = "campaign-shield-character";

  const art = document.createElement("div");
  art.className = "campaign-shield-character-art";
  setCampaignBanner(art, portrait);
  card.append(art);
  if (!portrait) {
    const initial = document.createElement("span");
    initial.className = "campaign-shield-character-initial";
    initial.setAttribute("aria-hidden", "true");
    initial.textContent = characterName.charAt(0).toUpperCase() || "A";
    card.append(initial);
  }

  const body = document.createElement("div");
  body.className = "campaign-shield-character-body";
  const tags = document.createElement("div");
  tags.className = "campaign-shield-character-tags";
  const ownerRole = activeCampaignMembers.find((member) => member.id === sheet.ownerUid)?.role;
  if (ownerRole === "master") {
    const masterTag = document.createElement("span");
    masterTag.textContent = "Mestre";
    tags.append(masterTag);
  }
  if (sheet.ownerUid === currentFirebaseUser?.uid) {
    const mineTag = document.createElement("span");
    mineTag.textContent = "Sua ficha";
    tags.append(mineTag);
  }
  if (sheet.privateToPlayers) {
    const privateTag = document.createElement("span");
    privateTag.className = "is-private";
    privateTag.textContent = "Privada";
    tags.append(privateTag);
  }

  const name = document.createElement("div");
  name.className = "campaign-shield-character-name";
  const title = document.createElement("strong");
  title.textContent = characterName;
  const owner = document.createElement("small");
  owner.textContent = `${sheet.ownerName || "Jogador"} · ${sheet.slotName || "Slot"}`;
  name.append(title, owner);

  const stats = document.createElement("div");
  stats.className = "campaign-shield-stats";
  if (campaignShieldStatsHiddenForViewer()) {
    stats.classList.add("campaign-shield-hidden-stats");
    stats.textContent = "Estatísticas ocultas pelo Mestre";
  } else if (cached.loading) {
    stats.classList.add("campaign-shield-hidden-stats", "campaign-shield-loading-stats");
    stats.textContent = "Sincronizando PV, PA e SA…";
  } else if (cached.error) {
    stats.classList.add("campaign-shield-hidden-stats");
    stats.textContent = "Estatísticas indisponíveis";
  } else {
    ["pv", "pa", "sa"].forEach((resource) => stats.append(createCampaignShieldStat(profile, resource)));
  }

  const open = document.createElement("button");
  open.type = "button";
  open.className = "campaign-shield-character-action";
  open.dataset.openCampaignShieldSheet = sheet.id;
  open.textContent = canEdit ? "Abrir e editar ficha" : "Visualizar ficha";
  body.append(tags, name, stats, open);
  card.append(body);
  return card;
}

function renderCampaignShieldRoster() {
  if (!activeCampaign) return;
  campaignUi.shieldCount.textContent = `${activeCampaignSheets.length} ${activeCampaignSheets.length === 1 ? "personagem" : "personagens"}`;
  campaignUi.shieldRoster.replaceChildren();
  if (activeCampaignSheets.length) {
    activeCampaignSheets.forEach((sheet) => campaignUi.shieldRoster.append(createCampaignShieldCharacter(sheet)));
    return;
  }
  const empty = document.createElement("div");
  empty.className = "campaign-shield-empty";
  const copy = document.createElement("div");
  const mark = document.createElement("span");
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "♜";
  const title = document.createElement("strong");
  title.textContent = "O Escudo ainda está vazio";
  const text = document.createElement("p");
  text.textContent = "Volte à Campanha e vincule uma ficha para trazer um personagem à cena.";
  copy.append(mark, title, text);
  empty.append(copy);
  campaignUi.shieldRoster.append(empty);
}

function renderCampaignShield() {
  if (!activeCampaign) return;
  const isMaster = activeCampaign.role === "master";
  const hidden = Boolean(activeCampaign.hideShieldStats);
  setCampaignBanner(campaignUi.shieldHero, activeCampaign.banner);
  campaignUi.shieldName.textContent = activeCampaign.name || "Campanha sem nome";
  campaignUi.shieldToggleWrap.hidden = !isMaster;
  campaignUi.shieldHideStats.checked = hidden;
  campaignUi.shieldVisibility.classList.toggle("is-hidden", hidden);
  if (isMaster) {
    campaignUi.shieldVisibility.textContent = hidden ? "Ocultas para jogadores" : "Visíveis para todos";
    campaignUi.shieldControlNote.textContent = hidden
      ? "Você continua vendo as barras; os jogadores veem apenas os Banners."
      : "PV, PA e SA estão visíveis para todos os membros.";
  } else {
    campaignUi.shieldVisibility.textContent = hidden ? "Estatísticas ocultas" : "Estatísticas visíveis";
    campaignUi.shieldControlNote.textContent = hidden
      ? "O Mestre ocultou PV, PA e SA nesta visão."
      : "PV, PA e SA estão visíveis para todos os membros.";
  }
  renderCampaignShieldRoster();
}

function startCampaignShieldRealtime() {
  stopCampaignShieldRealtime();
  campaignShieldProfiles.clear();
  activeCampaignSheets.forEach((sheet) => campaignShieldProfiles.set(sheet.id, { loading: true }));
  renderCampaignShield();
  if (!activeCampaign || typeof firestoreApi?.onSnapshot !== "function") return;

  const campaignId = activeCampaign.id;
  const campaignReference = firestoreApi.doc(firestoreDb, "campaigns", campaignId);
  campaignShieldUnsubscribers.push(firestoreApi.onSnapshot(
    campaignReference,
    (snapshot) => {
      if (!snapshot.exists() || activeCampaign?.id !== campaignId) return;
      const role = activeCampaign.role;
      const member = activeCampaign.member;
      activeCampaign = { id: snapshot.id, ...snapshot.data(), role, member };
      const record = campaignRecords.find((item) => item.id === campaignId);
      if (record) Object.assign(record, snapshot.data());
      renderCampaignShield();
    },
    () => {},
  ));

  activeCampaignSheets.forEach((sheet) => {
    const profileReference = firestoreApi.doc(
      firestoreDb,
      "users",
      sheet.ownerUid,
      "slots",
      sheet.slotId,
      "data",
      "profile",
    );
    campaignShieldUnsubscribers.push(firestoreApi.onSnapshot(
      profileReference,
      (snapshot) => {
        if (activeCampaign?.id !== campaignId) return;
        campaignShieldProfiles.set(sheet.id, {
          loading: false,
          profile: snapshot.exists() ? snapshot.data() : {},
        });
        if (!campaignUi.shield.hidden) renderCampaignShieldRoster();
      },
      () => {
        campaignShieldProfiles.set(sheet.id, { loading: false, error: true });
        if (!campaignUi.shield.hidden) renderCampaignShieldRoster();
      },
    ));
  });
}

async function openCampaignShield() {
  if (!activeCampaign || campaignBusy) return;
  campaignUi.dashboard.hidden = true;
  campaignUi.detail.hidden = true;
  campaignUi.loading.hidden = true;
  campaignUi.shield.hidden = false;
  renderCampaignShield();
  startCampaignShieldRealtime();
  campaignUi.app.scrollTo({ top: 0, behavior: "smooth" });

  const currentSheetLinked = activeCampaignSheets.some(
    (sheet) => sheet.ownerUid === currentFirebaseUser?.uid && sheet.slotId === currentSlotId,
  );
  if (currentSheetLinked && stateRevision > lastSavedRevision) {
    try {
      await flushCloudSave();
    } catch {
      // A assinatura exibirá o último valor confirmado sem bloquear o Escudo.
    }
  }
}

function closeCampaignShield() {
  stopCampaignShieldRealtime();
  campaignShieldProfiles.clear();
  campaignUi.shield.hidden = true;
  campaignUi.loading.hidden = true;
  campaignUi.dashboard.hidden = true;
  campaignUi.detail.hidden = false;
  renderCampaignDetail();
  campaignUi.app.scrollTo({ top: 0, behavior: "smooth" });
}

async function toggleCampaignShieldStats(trigger) {
  if (!activeCampaign || activeCampaign.role !== "master" || campaignBusy) return;
  const previous = Boolean(activeCampaign.hideShieldStats);
  const next = Boolean(trigger.checked);
  activeCampaign.hideShieldStats = next;
  renderCampaignShield();
  campaignBusy = true;
  trigger.disabled = true;
  try {
    await firestoreApi.setDoc(
      firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id),
      { hideShieldStats: next, updatedAt: firestoreApi.serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    activeCampaign.hideShieldStats = previous;
    renderCampaignShield();
    await window.showAbyssAlert?.({
      eyebrow: "Escudo do Mestre",
      title: "Não foi possível alterar a visibilidade",
      message: describeFirebaseError(error),
      tone: "warning",
      trigger,
    });
  } finally {
    campaignBusy = false;
    trigger.disabled = false;
  }
}

function renderCampaignDetail() {
  if (!activeCampaign) return;
  const isMaster = activeCampaign.role === "master";
  setCampaignBanner(campaignUi.hero, activeCampaign.banner);
  campaignUi.detailRole.textContent = isMaster ? "Mestre" : "Jogador";
  campaignUi.detailMembersCount.textContent = `${activeCampaignMembers.length} ${activeCampaignMembers.length === 1 ? "membro" : "membros"}`;
  campaignUi.detailName.textContent = activeCampaign.name || "Campanha sem nome";
  campaignUi.detailSynopsis.textContent = activeCampaign.synopsis || "Sem sinopse.";
  campaignUi.detailCode.hidden = !isMaster;
  campaignUi.codeValue.textContent = activeCampaign.joinCode || "";
  campaignUi.edit.hidden = !isMaster;
  campaignUi.remove.hidden = !isMaster;
  campaignUi.leave.hidden = isMaster;
  campaignUi.sheetLimitNote.textContent = isMaster
    ? "Como Mestre, você pode vincular quantos Slots quiser."
    : "Como Jogador, você pode vincular até quatro Slots nesta Campanha.";
  campaignUi.sheetCount.textContent = `${activeCampaignSheets.length} ${activeCampaignSheets.length === 1 ? "ficha" : "fichas"}`;

  campaignUi.sheetList.replaceChildren();
  if (activeCampaignSheets.length) {
    activeCampaignSheets.forEach((sheet) => campaignUi.sheetList.append(createCampaignSheetCard(sheet)));
  } else {
    const empty = document.createElement("div");
    empty.className = "campaign-panel-empty";
    const title = document.createElement("strong");
    title.textContent = "Nenhuma ficha vinculada";
    const text = document.createElement("p");
    text.textContent = "Use “Vincular ficha” para colocar um dos seus Slots nesta Campanha.";
    empty.append(title, text);
    campaignUi.sheetList.append(empty);
  }
  campaignUi.membersList.replaceChildren(...activeCampaignMembers.map(createCampaignMemberRow));
}

async function openCampaignDetail(campaignId) {
  if (!currentFirebaseUser || !campaignId) return;
  stopCampaignShieldRealtime();
  campaignShieldProfiles.clear();
  campaignBusy = true;
  campaignUi.dashboard.hidden = true;
  campaignUi.detail.hidden = true;
  campaignUi.shield.hidden = true;
  campaignUi.loading.hidden = false;
  campaignUi.loading.textContent = "Abrindo Campanha…";
  campaignUi.loading.classList.remove("is-error");
  try {
    const campaignRef = firestoreApi.doc(firestoreDb, "campaigns", campaignId);
    const membersRef = firestoreApi.collection(firestoreDb, "campaigns", campaignId, "members");
    const sheetsRef = firestoreApi.collection(firestoreDb, "campaigns", campaignId, "sheets");
    const [campaignSnapshot, membersSnapshot, sheetsSnapshot] = await Promise.all([
      firestoreApi.getDoc(campaignRef),
      firestoreApi.getDocs(membersRef),
      firestoreApi.getDocs(sheetsRef),
    ]);
    if (!campaignSnapshot.exists()) throw new Error("Esta Campanha não existe mais.");
    activeCampaignMembers = membersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const ownMember = activeCampaignMembers.find((member) => member.id === currentFirebaseUser.uid);
    if (!ownMember) throw Object.assign(new Error("Você não faz mais parte desta Campanha."), { code: "permission-denied" });
    const sheets = new Map();
    sheetsSnapshot.docs.forEach((doc) => sheets.set(doc.id, { id: doc.id, ...doc.data() }));
    await ensureCurrentUserCampaignSheetAccess(
      campaignId,
      ownMember.role === "master" ? "master" : "player",
      [...sheets.values()],
    );
    activeCampaignSheets = [...sheets.values()].sort(
      (a, b) => campaignTimestamp(a.addedAt) - campaignTimestamp(b.addedAt),
    );
    activeCampaign = {
      id: campaignSnapshot.id,
      ...campaignSnapshot.data(),
      role: ownMember.role === "master" ? "master" : "player",
      member: ownMember,
    };
    renderCampaignDetail();
    campaignUi.loading.hidden = true;
    campaignUi.detail.hidden = false;
    campaignUi.app.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    campaignUi.loading.textContent = userFacingErrorMessage(error) || describeFirebaseError(error);
    campaignUi.loading.classList.add("is-error");
  } finally {
    campaignBusy = false;
  }
}

function updateCampaignBannerPreview(value = campaignBannerCropped || campaignUi.bannerUrl.value || campaignBannerDraft) {
  const banner = safeCampaignBanner(value);
  setCampaignBanner(campaignUi.bannerPreview, banner);
  campaignUi.bannerPreview.classList.toggle("has-image", Boolean(banner));
}

function openCampaignEditor(record = null) {
  campaignEditorId = record?.id || "";
  campaignBannerDraft = safeCampaignBanner(record?.banner);
  campaignBannerCropped = "";
  campaignUi.editorForm.reset();
  campaignUi.name.value = record?.name || "";
  campaignUi.synopsis.value = record?.synopsis || "";
  campaignUi.bannerUrl.value = campaignBannerDraft && !campaignBannerDraft.startsWith("data:")
    ? campaignBannerDraft
    : "";
  campaignUi.editorTitle.textContent = record ? "Editar Campanha" : "Criar Campanha";
  campaignUi.editorSubmit.textContent = record ? "Salvar Alterações" : "Criar Campanha";
  setCampaignFormError(campaignUi.editorError);

  updateCampaignBannerPreview(campaignBannerDraft);
  setCampaignModal(campaignUi.editorModal, campaignUi.editorDialog, true);
  requestAnimationFrame(() => campaignUi.name.focus());
}

function closeCampaignEditor() {
  if (!campaignUi.bannerCropModal.hidden) closeCampaignBannerCrop({ restorePreview: false });
  setCampaignModal(campaignUi.editorModal, campaignUi.editorDialog, false);
  campaignEditorId = "";
  campaignBannerDraft = "";
  campaignBannerCropped = "";
}

function openCampaignJoin() {
  campaignUi.joinForm.reset();
  setCampaignFormError(campaignUi.joinError);
  setCampaignModal(campaignUi.joinModal, campaignUi.joinDialog, true);
  requestAnimationFrame(() => campaignUi.joinCode.focus());
}

function closeCampaignJoin() {
  setCampaignModal(campaignUi.joinModal, campaignUi.joinDialog, false);
}

async function copyText(value, successMessage, trigger) {
  try {
    await navigator.clipboard.writeText(value);
    const original = trigger.textContent;
    trigger.textContent = "Copiado";
    window.setTimeout(() => { trigger.textContent = original; }, 1300);
  } catch {
    await window.showAbyssAlert?.({
      eyebrow: "Área de transferência",
      title: "Não foi possível copiar",
      message: "Selecione o conteúdo manualmente e copie pelo navegador.",
      tone: "warning",
      trigger,
    });
  }
}

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("Não foi possível abrir o Banner escolhido.")), { once: true });
    image.src = source;
  });
}

function getCampaignBannerCropScale() {
  if (!campaignBannerCropState.image) return 1;
  const viewportWidth = campaignUi.bannerCropViewport.clientWidth || 1;
  const viewportHeight = campaignUi.bannerCropViewport.clientHeight || viewportWidth * .4;
  const coverScale = Math.max(
    viewportWidth / campaignBannerCropState.image.naturalWidth,
    viewportHeight / campaignBannerCropState.image.naturalHeight,
  );
  return coverScale * campaignBannerCropState.zoom;
}

function clampCampaignBannerCropPosition() {
  if (!campaignBannerCropState.image) return;
  const viewportWidth = campaignUi.bannerCropViewport.clientWidth || 1;
  const viewportHeight = campaignUi.bannerCropViewport.clientHeight || viewportWidth * .4;
  const scale = getCampaignBannerCropScale();
  const maximumX = Math.max(0, (campaignBannerCropState.image.naturalWidth * scale - viewportWidth) / 2);
  const maximumY = Math.max(0, (campaignBannerCropState.image.naturalHeight * scale - viewportHeight) / 2);
  campaignBannerCropState.x = Math.min(maximumX, Math.max(-maximumX, campaignBannerCropState.x));
  campaignBannerCropState.y = Math.min(maximumY, Math.max(-maximumY, campaignBannerCropState.y));
}

function renderCampaignBannerCrop() {
  if (!campaignBannerCropState.image) return;
  clampCampaignBannerCropPosition();
  const scale = getCampaignBannerCropScale();
  const viewportWidth = campaignUi.bannerCropViewport.clientWidth || 1;
  const viewportHeight = campaignUi.bannerCropViewport.clientHeight || viewportWidth * .4;
  campaignUi.bannerCropImage.style.width = `${campaignBannerCropState.image.naturalWidth}px`;
  campaignUi.bannerCropImage.style.height = `${campaignBannerCropState.image.naturalHeight}px`;
  campaignUi.bannerCropImage.style.left = `${viewportWidth / 2 + campaignBannerCropState.x}px`;
  campaignUi.bannerCropImage.style.top = `${viewportHeight / 2 + campaignBannerCropState.y}px`;
  campaignUi.bannerCropImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  campaignUi.bannerZoom.value = String(campaignBannerCropState.zoom);
}

function setCampaignBannerZoom(nextZoom) {
  campaignBannerCropState.zoom = Math.min(4, Math.max(1, Number(nextZoom) || 1));
  renderCampaignBannerCrop();
}

function centerCampaignBannerCrop() {
  campaignBannerCropState.x = 0;
  campaignBannerCropState.y = 0;
  renderCampaignBannerCrop();
}

async function openCampaignBannerCrop(file) {
  if (!file) return;
  if (!new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]).has(file.type)) {
    throw new Error("Use um Banner em PNG, JPG, WEBP ou GIF.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("O Banner deve ter no máximo 10 MB.");
  const source = await readFileAsDataUrl(file);
  const image = await loadImageElement(source);
  campaignBannerCropState.source = source;
  campaignBannerCropState.image = image;
  campaignBannerCropState.inputType = file.type;
  campaignBannerCropState.zoom = 1.04;
  campaignBannerCropState.x = 0;
  campaignBannerCropState.y = 0;
  campaignBannerCropState.pointerId = null;
  campaignUi.bannerCropImage.src = source;
  campaignUi.bannerCropNote.textContent = file.type === "image/gif"
    ? "O GIF será convertido em uma imagem estática ao aplicar o recorte. Arraste, use o zoom ou as setas do teclado."
    : "Mouse ou toque: arraste diretamente. Teclado: use as setas. A moldura corresponde ao Banner final.";
  setCampaignModal(campaignUi.bannerCropModal, campaignUi.bannerCropDialog, true);
  requestAnimationFrame(() => {
    renderCampaignBannerCrop();
    campaignUi.bannerCropViewport.focus();
  });
}

function closeCampaignBannerCrop({ restorePreview = true } = {}) {
  const pointerId = campaignBannerCropState.pointerId;
  campaignBannerCropState.pointerId = null;
  if (pointerId !== null && campaignUi.bannerCropViewport.hasPointerCapture?.(pointerId)) {
    campaignUi.bannerCropViewport.releasePointerCapture(pointerId);
  }
  campaignUi.bannerCropViewport.classList.remove("is-dragging");
  campaignUi.bannerCropModal.hidden = true;
  campaignUi.bannerFile.value = "";
  if (restorePreview) updateCampaignBannerPreview();
  document.body.classList.toggle(
    "modal-open",
    [...document.querySelectorAll(".campaign-modal")].some((item) => !item.hidden),
  );
  requestAnimationFrame(() => campaignUi.bannerFile.focus());
}

function applyCampaignBannerCrop() {
  if (!campaignBannerCropState.image) return;
  const viewportWidth = campaignUi.bannerCropViewport.clientWidth || 1;
  const viewportHeight = campaignUi.bannerCropViewport.clientHeight || viewportWidth * .4;
  const scale = getCampaignBannerCropScale();
  const sourceWidth = viewportWidth / scale;
  const sourceHeight = viewportHeight / scale;
  const sourceX = campaignBannerCropState.image.naturalWidth / 2
    - campaignBannerCropState.x / scale
    - sourceWidth / 2;
  const sourceY = campaignBannerCropState.image.naturalHeight / 2
    - campaignBannerCropState.y / scale
    - sourceHeight / 2;
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 560;
  const context = canvas.getContext("2d");
  if (!context) {
    setCampaignFormError(campaignUi.editorError, "O navegador não conseguiu preparar o recorte do Banner.");
    return;
  }
  context.fillStyle = "#090a0d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    campaignBannerCropState.image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  let result = canvas.toDataURL("image/jpeg", .82);
  if (result.length > 720000) result = canvas.toDataURL("image/jpeg", .62);
  if (result.length > 850000) result = canvas.toDataURL("image/jpeg", .46);
  if (result.length > 900000) {
    setCampaignFormError(campaignUi.editorError, "O Banner ainda ficou grande demais. Escolha uma imagem mais simples.");
    closeCampaignBannerCrop();
    return;
  }
  campaignBannerCropped = result;
  campaignUi.bannerUrl.value = "";
  setCampaignFormError(campaignUi.editorError);

  setCampaignBanner(campaignUi.bannerPreview, result);
  campaignUi.bannerPreview.classList.add("has-image");
  closeCampaignBannerCrop({ restorePreview: false });
}

function generateCampaignCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const random = crypto.getRandomValues(new Uint8Array(8));
  random.forEach((value) => { code += alphabet[value % alphabet.length]; });
  return code;
}

async function submitCampaignEditor(event) {
  event.preventDefault();
  if (!currentFirebaseUser || campaignBusy) return;
  setCampaignFormError(campaignUi.editorError);

  const name = campaignUi.name.value.trim().replace(/\s+/g, " ").slice(0, 90);
  const synopsis = campaignUi.synopsis.value.trim().slice(0, 1800);
  if (!name) {
    setCampaignFormError(campaignUi.editorError, "Dê um nome à Campanha.");
    campaignUi.name.focus();
    return;
  }
  if (!synopsis) {
    setCampaignFormError(campaignUi.editorError, "Escreva uma sinopse para a Campanha.");
    campaignUi.synopsis.focus();
    return;
  }
  const linkedBanner = safeCampaignBanner(campaignUi.bannerUrl.value);
  if (campaignUi.bannerUrl.value.trim() && !linkedBanner) {
    setCampaignFormError(campaignUi.editorError, "O link do Banner precisa começar com http:// ou https://.");
    campaignUi.bannerUrl.focus();
    return;
  }
  campaignBusy = true;
  campaignUi.editorSubmit.disabled = true;
  campaignUi.editorSubmit.textContent = campaignEditorId ? "Salvando…" : "Criando…";
  let creationStage = campaignEditorId ? "editar a Campanha" : "criar o registro da Campanha";
  let orphanCampaignRef = null;
  try {
    const banner = campaignBannerCropped || linkedBanner || campaignBannerDraft;
    if (campaignEditorId) {
      const existing = campaignRecords.find((record) => record.id === campaignEditorId) || activeCampaign;
      if (!existing || existing.ownerUid !== currentFirebaseUser.uid) throw new Error("Somente o Mestre pode editar esta Campanha.");
      await firestoreApi.setDoc(
        firestoreApi.doc(firestoreDb, "campaigns", campaignEditorId),
        { name, synopsis, banner, updatedAt: firestoreApi.serverTimestamp() },
        { merge: true },
      );
      const editedId = campaignEditorId;
      closeCampaignEditor();
      await loadCampaignRecords();
      renderCampaignDashboard();
      await openCampaignDetail(editedId);
      return;
    }

    const campaignRef = firestoreApi.doc(firestoreApi.collection(firestoreDb, "campaigns"));
    const campaignId = campaignRef.id;
    const joinCode = generateCampaignCode();
    const timestamp = firestoreApi.serverTimestamp();
    const memberRef = firestoreApi.doc(firestoreDb, "campaigns", campaignId, "members", currentFirebaseUser.uid);
    const indexRef = firestoreApi.doc(firestoreDb, "users", currentFirebaseUser.uid, "campaigns", campaignId);
    const codeRef = firestoreApi.doc(firestoreDb, "campaignCodes", joinCode);
    await withCloudTimeout(firestoreApi.setDoc(campaignRef, {
      name,
      synopsis,
      banner,
      joinCode,
      ownerUid: currentFirebaseUser.uid,
      ownerName: getEffectiveIdentity().displayName,
      hideShieldStats: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }), 20000, "O registro da Campanha demorou demais para ser criado.");
    orphanCampaignRef = campaignRef;

    creationStage = "criar o Mestre e o código de convite";
    const batch = firestoreApi.writeBatch(firestoreDb);
    batch.set(memberRef, {
      uid: currentFirebaseUser.uid,
      role: "master",
      displayName: getEffectiveIdentity().displayName,
      photoURL: getEffectiveIdentity().photoURL,
      hideRolls: currentAccountSettings.hideRolls,
      sheetIds: [],
      joinedAt: timestamp,
    });
    batch.set(indexRef, { campaignId, role: "master", joinedAt: timestamp });
    batch.set(codeRef, { campaignId, ownerUid: currentFirebaseUser.uid, createdAt: timestamp });
    await withCloudTimeout(batch.commit(), 20000, "A Campanha demorou demais para ser criada.");
    orphanCampaignRef = null;
    closeCampaignEditor();
    await loadCampaignRecords();
    renderCampaignDashboard();
    await openCampaignDetail(campaignId);
  } catch (error) {
    const permissionDenied = String(error?.code || "").includes("permission-denied")
      || /missing or insufficient permissions/i.test(String(error?.message || ""));
    if (orphanCampaignRef && permissionDenied) {
      await firestoreApi.deleteDoc(orphanCampaignRef).catch(() => {});
    }

    setCampaignFormError(
      campaignUi.editorError,
      permissionDenied
        ? `Não foi possível concluir a etapa de ${creationStage}. Tente novamente mais tarde.`
        : (userFacingErrorMessage(error) || describeFirebaseError(error)),
    );
  } finally {
    campaignBusy = false;
    campaignUi.editorSubmit.disabled = false;
    campaignUi.editorSubmit.textContent = campaignEditorId ? "Salvar Alterações" : "Criar Campanha";
  }
}

async function submitCampaignJoin(event) {
  event.preventDefault();
  if (!currentFirebaseUser || campaignBusy) return;
  setCampaignFormError(campaignUi.joinError);
  const code = normalizeCampaignCode(campaignUi.joinCode.value);
  campaignUi.joinCode.value = code;
  if (code.length < 6) {
    setCampaignFormError(campaignUi.joinError, "Digite o código completo enviado pelo Mestre.");
    campaignUi.joinCode.focus();
    return;
  }
  campaignBusy = true;
  campaignUi.joinSubmit.disabled = true;
  campaignUi.joinSubmit.textContent = "Entrando…";
  try {
    const codeSnapshot = await firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "campaignCodes", code));
    if (!codeSnapshot.exists()) throw new Error("Nenhuma Campanha foi encontrada com este código.");
    const campaignId = String(codeSnapshot.data()?.campaignId || "");
    const campaignSnapshot = await firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "campaigns", campaignId));
    if (!campaignSnapshot.exists()) throw new Error("Esta Campanha não existe mais.");
    if (campaignSnapshot.data()?.ownerUid === currentFirebaseUser.uid) {
      throw new Error("Você já é o Mestre desta Campanha.");
    }
    const memberRef = firestoreApi.doc(firestoreDb, "campaigns", campaignId, "members", currentFirebaseUser.uid);
    if ((await firestoreApi.getDoc(memberRef)).exists()) throw new Error("Você já faz parte desta Campanha.");
    const timestamp = firestoreApi.serverTimestamp();
    const indexRef = firestoreApi.doc(firestoreDb, "users", currentFirebaseUser.uid, "campaigns", campaignId);
    const batch = firestoreApi.writeBatch(firestoreDb);
    batch.set(memberRef, {
      uid: currentFirebaseUser.uid,
      role: "player",
      joinCode: code,
      displayName: getEffectiveIdentity().displayName,
      photoURL: getEffectiveIdentity().photoURL,
      hideRolls: currentAccountSettings.hideRolls,
      sheetIds: [],
      joinedAt: timestamp,
    });
    batch.set(indexRef, { campaignId, role: "player", joinedAt: timestamp });
    await withCloudTimeout(batch.commit(), 20000, "A entrada na Campanha demorou demais.");
    await grantCurrentPlayerPublicCampaignSheets(campaignId).catch(() => {});
    closeCampaignJoin();
    await loadCampaignRecords();
    renderCampaignDashboard();
    await openCampaignDetail(campaignId);
  } catch (error) {
    setCampaignFormError(campaignUi.joinError, userFacingErrorMessage(error) || describeFirebaseError(error));
  } finally {
    campaignBusy = false;
    campaignUi.joinSubmit.disabled = false;
    campaignUi.joinSubmit.textContent = "Entrar";
  }
}

function campaignAccessRef(ownerUid, slotId, granteeUid) {
  return firestoreApi.doc(
    firestoreDb,
    "users",
    ownerUid,
    "slots",
    slotId,
    "campaignAccess",
    granteeUid,
  );
}

async function addCampaignAccess({ ownerUid, slotId, granteeUid, campaignId, edit = false }) {
  const field = edit ? "editCampaignIds" : "viewCampaignIds";
  await firestoreApi.setDoc(
    campaignAccessRef(ownerUid, slotId, granteeUid),
    {
      ownerUid,
      slotId,
      granteeUid,
      grantCampaignId: campaignId,
      updatedAt: firestoreApi.serverTimestamp(),
      [field]: firestoreApi.arrayUnion(campaignId),
    },
    { merge: true },
  );
}

async function removeCampaignAccess({ ownerUid, slotId, granteeUid, campaignId, edit = false }) {
  const field = edit ? "editCampaignIds" : "viewCampaignIds";
  await firestoreApi.setDoc(
    campaignAccessRef(ownerUid, slotId, granteeUid),
    {
      ownerUid,
      slotId,
      granteeUid,
      grantCampaignId: campaignId,
      [field]: firestoreApi.arrayRemove(campaignId),
      updatedAt: firestoreApi.serverTimestamp(),
    },
    { merge: true },
  );
}

async function ensureCurrentUserCampaignSheetAccess(campaignId, role, sheets) {
  if (!currentFirebaseUser) return;
  const edit = role === "master";
  const field = edit ? "editCampaignIds" : "viewCampaignIds";
  const visibleSheets = sheets.filter(
    (sheet) => sheet.ownerUid
      && sheet.slotId
      && sheet.ownerUid !== currentFirebaseUser.uid
      && (edit || !sheet.privateToPlayers),
  );
  await Promise.all(visibleSheets.map(async (sheet) => {
    const reference = campaignAccessRef(sheet.ownerUid, sheet.slotId, currentFirebaseUser.uid);
    const snapshot = await firestoreApi.getDoc(reference);
    const campaignIds = snapshot.exists() && Array.isArray(snapshot.data()?.[field])
      ? snapshot.data()[field]
      : [];
    if (campaignIds.includes(campaignId)) return;
    await addCampaignAccess({
      ownerUid: sheet.ownerUid,
      slotId: sheet.slotId,
      granteeUid: currentFirebaseUser.uid,
      campaignId,
      edit,
    });
  }));
}

async function grantCurrentPlayerPublicCampaignSheets(campaignId) {
  if (!currentFirebaseUser) return;
  const sheetsRef = firestoreApi.collection(firestoreDb, "campaigns", campaignId, "sheets");
  const snapshot = await firestoreApi.getDocs(
    firestoreApi.query(sheetsRef, firestoreApi.where("privateToPlayers", "==", false)),
  );
  for (const sheetDoc of snapshot.docs) {
    const sheet = sheetDoc.data() || {};
    if (!sheet.ownerUid || !sheet.slotId || sheet.ownerUid === currentFirebaseUser.uid) continue;
    await addCampaignAccess({
      ownerUid: sheet.ownerUid,
      slotId: sheet.slotId,
      granteeUid: currentFirebaseUser.uid,
      campaignId,
      edit: false,
    });
  }
}

function openCampaignSlotPicker() {
  if (!activeCampaign || !currentFirebaseUser) return;
  const ownLinkedIds = new Set(
    activeCampaignSheets
      .filter((sheet) => sheet.ownerUid === currentFirebaseUser.uid)
      .map((sheet) => sheet.slotId),
  );
  const ownCount = ownLinkedIds.size;
  if (activeCampaign.role !== "master" && ownCount >= 4) {
    window.showAbyssAlert?.({
      eyebrow: "Campanha",
      title: "Limite de fichas atingido",
      message: "Jogadores podem vincular até quatro fichas em cada Campanha.",
      tone: "warning",
      trigger: campaignUi.attachSheet,
    });
    return;
  }
  campaignUi.slotForm.reset();
  campaignUi.slotList.replaceChildren();
  const available = currentSlots.filter((slot) => !ownLinkedIds.has(slot.id));
  if (!available.length) {
    const empty = document.createElement("div");
    empty.className = "campaign-panel-empty";
    const title = document.createElement("strong");
    title.textContent = "Todos os seus Slots já estão vinculados";
    const text = document.createElement("p");
    text.textContent = "Crie outro Slot na ficha principal para adicionar mais um personagem.";
    empty.append(title, text);
    campaignUi.slotList.append(empty);
    campaignUi.slotSubmit.disabled = true;
  } else {
    available.forEach((slot, index) => {
      const label = document.createElement("label");
      label.className = "campaign-slot-choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "campaign-slot";
      input.value = slot.id;
      input.required = true;
      input.checked = index === 0;
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = slot.name;
      const detail = document.createElement("small");
      detail.textContent = slot.id === currentSlotId ? "Slot aberto agora" : "Slot salvo na conta";
      copy.append(name, detail);
      label.append(input, copy);
      campaignUi.slotList.append(label);
    });
    campaignUi.slotSubmit.disabled = false;
  }
  setCampaignFormError(campaignUi.slotError);
  setCampaignModal(campaignUi.slotModal, campaignUi.slotDialog, true);
}

function closeCampaignSlotPicker() {
  setCampaignModal(campaignUi.slotModal, campaignUi.slotDialog, false);
}

async function readSlotStateForCampaign(slotId) {
  if (slotId === currentSlotId) {
    if (cloudSavePromise && !(await cloudSavePromise)) throw new Error("A ficha atual ainda não terminou de salvar.");
    if (stateRevision > lastSavedRevision && !(await flushCloudSave())) {
      throw new Error("Salve a ficha atual antes de vinculá-la.");
    }
    return sheetBridge.captureState();
  }
  return readCloudSheet(currentFirebaseUser, slotId);
}

async function grantSheetCampaignAccess(sheet, members, campaign) {
  const operations = [];
  if (sheet.ownerUid !== campaign.ownerUid) {
    operations.push(addCampaignAccess({
      ownerUid: sheet.ownerUid,
      slotId: sheet.slotId,
      granteeUid: campaign.ownerUid,
      campaignId: campaign.id,
      edit: true,
    }));
  }
  if (!sheet.privateToPlayers) {
    members
      .filter((member) => member.role !== "master" && member.id !== sheet.ownerUid)
      .forEach((member) => operations.push(addCampaignAccess({
        ownerUid: sheet.ownerUid,
        slotId: sheet.slotId,
        granteeUid: member.id,
        campaignId: campaign.id,
        edit: false,
      })));
  }
  await Promise.all(operations);
}

async function revokeSheetCampaignAccess(sheet, members, campaign) {
  const operations = [];
  if (sheet.ownerUid !== campaign.ownerUid) {
    operations.push(removeCampaignAccess({
      ownerUid: sheet.ownerUid,
      slotId: sheet.slotId,
      granteeUid: campaign.ownerUid,
      campaignId: campaign.id,
      edit: true,
    }));
  }
  members
    .filter((member) => member.role !== "master" && member.id !== sheet.ownerUid)
    .forEach((member) => operations.push(removeCampaignAccess({
      ownerUid: sheet.ownerUid,
      slotId: sheet.slotId,
      granteeUid: member.id,
      campaignId: campaign.id,
      edit: false,
    })));
  await Promise.all(operations);
}

async function submitCampaignSlot(event) {
  event.preventDefault();
  if (!activeCampaign || !currentFirebaseUser || campaignBusy) return;
  const slotId = campaignUi.slotForm.querySelector('input[name="campaign-slot"]:checked')?.value || "";
  const slot = currentSlots.find((item) => item.id === slotId);
  if (!slot) {
    setCampaignFormError(campaignUi.slotError, "Escolha um Slot válido.");
    return;
  }
  const ownCount = activeCampaignSheets.filter((sheet) => sheet.ownerUid === currentFirebaseUser.uid).length;
  if (activeCampaign.role !== "master" && ownCount >= 4) {
    setCampaignFormError(campaignUi.slotError, "Você já vinculou o máximo de quatro fichas.");
    return;
  }
  campaignBusy = true;
  campaignUi.slotSubmit.disabled = true;
  campaignUi.slotSubmit.textContent = "Vinculando…";
  try {
    const state = await readSlotStateForCampaign(slotId);
    const profile = state.profile || {};
    const linkId = campaignSheetLinkId(currentFirebaseUser.uid, slotId);
    const privateToPlayers = campaignUi.slotPrivate.checked;
    const portrait = await compactPortraitForFirestore(String(profile.portrait || ""));
    const sheet = {
      id: linkId,
      ownerUid: currentFirebaseUser.uid,
      ownerName: getEffectiveIdentity().displayName,
      ownerPhotoURL: getEffectiveIdentity().photoURL,
      slotId,
      slotName: characterSlotName(profile.name, slot.name),
      characterName: characterSlotName(profile.name, slot.name),
      portrait,
      privateToPlayers,
      addedAt: firestoreApi.serverTimestamp(),
      updatedAt: firestoreApi.serverTimestamp(),
    };
    const sheetRef = firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id, "sheets", linkId);
    const memberRef = firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id, "members", currentFirebaseUser.uid);
    const batch = firestoreApi.writeBatch(firestoreDb);
    batch.set(sheetRef, sheet);
    batch.set(memberRef, { sheetIds: firestoreApi.arrayUnion(linkId) }, { merge: true });
    await batch.commit();
    await grantSheetCampaignAccess({ ...sheet, addedAt: Date.now() }, activeCampaignMembers, activeCampaign);
    closeCampaignSlotPicker();
    await openCampaignDetail(activeCampaign.id);
  } catch (error) {
    setCampaignFormError(campaignUi.slotError, userFacingErrorMessage(error) || describeFirebaseError(error));
  } finally {
    campaignBusy = false;
    campaignUi.slotSubmit.disabled = false;
    campaignUi.slotSubmit.textContent = "Vincular ficha";
  }
}

async function toggleCampaignSheetPrivacy(sheetId, trigger) {
  const sheet = activeCampaignSheets.find((item) => item.id === sheetId);
  if (!sheet || sheet.ownerUid !== currentFirebaseUser?.uid || campaignBusy) return;
  campaignBusy = true;
  trigger.disabled = true;
  const nextPrivate = !sheet.privateToPlayers;
  try {
    const sheetRef = firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id, "sheets", sheet.id);
    const players = activeCampaignMembers.filter((member) => member.role !== "master" && member.id !== sheet.ownerUid);
    if (nextPrivate) {
      for (const player of players) {
        await removeCampaignAccess({
          ownerUid: sheet.ownerUid,
          slotId: sheet.slotId,
          granteeUid: player.id,
          campaignId: activeCampaign.id,
          edit: false,
        });
      }
    }
    await firestoreApi.setDoc(
      sheetRef,
      { privateToPlayers: nextPrivate, updatedAt: firestoreApi.serverTimestamp() },
      { merge: true },
    );
    if (!nextPrivate) {
      for (const player of players) {
        await addCampaignAccess({
          ownerUid: sheet.ownerUid,
          slotId: sheet.slotId,
          granteeUid: player.id,
          campaignId: activeCampaign.id,
          edit: false,
        });
      }
    }
    sheet.privateToPlayers = nextPrivate;
    renderCampaignDetail();
  } catch (error) {
    await window.showAbyssAlert?.({
      eyebrow: "Privacidade da ficha",
      title: "Não foi possível alterar",
      message: describeFirebaseError(error),
      tone: "warning",
      trigger,
    });
  } finally {
    campaignBusy = false;
    trigger.disabled = false;
  }
}

async function unlinkCampaignSheet(sheetId, trigger, { skipConfirm = false } = {}) {
  const sheet = activeCampaignSheets.find((item) => item.id === sheetId);
  if (!sheet || !activeCampaign || campaignBusy) return false;
  if (!skipConfirm) {
    const confirmed = await window.showAbyssConfirm?.({
      eyebrow: "Campanha",
      title: "Desvincular ficha?",
      message: `“${sheet.characterName || sheet.slotName}” sairá desta Campanha, mas o Slot continuará intacto na conta do proprietário.`,
      confirmLabel: "Desvincular",
      tone: "danger",
      trigger,
    });
    if (!confirmed) return false;
  }
  campaignBusy = true;
  if (trigger) trigger.disabled = true;
  try {
    await revokeSheetCampaignAccess(sheet, activeCampaignMembers, activeCampaign);
    const batch = firestoreApi.writeBatch(firestoreDb);
    batch.delete(firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id, "sheets", sheet.id));
    batch.set(
      firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id, "members", sheet.ownerUid),
      { sheetIds: firestoreApi.arrayRemove(sheet.id) },
      { merge: true },
    );
    await batch.commit();
    activeCampaignSheets = activeCampaignSheets.filter((item) => item.id !== sheet.id);
    const ownerMember = activeCampaignMembers.find((member) => member.id === sheet.ownerUid);
    if (ownerMember) ownerMember.sheetIds = (ownerMember.sheetIds || []).filter((id) => id !== sheet.id);
    renderCampaignDetail();
    return true;
  } catch (error) {
    await window.showAbyssAlert?.({
      eyebrow: "Campanha",
      title: "Não foi possível desvincular",
      message: describeFirebaseError(error),
      tone: "warning",
      trigger,
    });
    return false;
  } finally {
    campaignBusy = false;
    if (trigger) trigger.disabled = false;
  }
}

async function leaveActiveCampaign(trigger) {
  if (!activeCampaign || activeCampaign.role === "master" || campaignBusy) return;
  const confirmed = await window.showAbyssConfirm?.({
    eyebrow: "Campanha",
    title: "Sair da Campanha?",
    message: `Você deixará “${activeCampaign.name}”. Suas fichas serão desvinculadas, mas os Slots continuarão na sua conta.`,
    confirmLabel: "Sair",
    tone: "danger",
    trigger,
  });
  if (!confirmed) return;
  campaignBusy = true;
  try {
    const campaignId = activeCampaign.id;
    const ownSheets = activeCampaignSheets.filter((sheet) => sheet.ownerUid === currentFirebaseUser.uid);
    for (const sheet of ownSheets) {
      await revokeSheetCampaignAccess(sheet, activeCampaignMembers, activeCampaign);
      await firestoreApi.deleteDoc(firestoreApi.doc(firestoreDb, "campaigns", campaignId, "sheets", sheet.id));
    }
    const publicOthers = activeCampaignSheets.filter(
      (sheet) => sheet.ownerUid !== currentFirebaseUser.uid && !sheet.privateToPlayers,
    );
    for (const sheet of publicOthers) {
      await removeCampaignAccess({
        ownerUid: sheet.ownerUid,
        slotId: sheet.slotId,
        granteeUid: currentFirebaseUser.uid,
        campaignId,
        edit: false,
      });
    }
    const batch = firestoreApi.writeBatch(firestoreDb);
    batch.delete(firestoreApi.doc(firestoreDb, "campaigns", campaignId, "members", currentFirebaseUser.uid));
    batch.delete(firestoreApi.doc(firestoreDb, "users", currentFirebaseUser.uid, "campaigns", campaignId));
    await batch.commit();
    await loadCampaignRecords();
    showCampaignDashboard();
  } catch (error) {
    await window.showAbyssAlert?.({
      eyebrow: "Campanha",
      title: "Não foi possível sair",
      message: describeFirebaseError(error),
      tone: "warning",
      trigger,
    });
  } finally {
    campaignBusy = false;
  }
}

async function commitCampaignDeletes(references) {
  for (let index = 0; index < references.length; index += 400) {
    const batch = firestoreApi.writeBatch(firestoreDb);
    references.slice(index, index + 400).forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}

async function deleteActiveCampaign(trigger) {
  if (!activeCampaign || activeCampaign.role !== "master" || campaignBusy) return;
  const confirmed = await window.showAbyssConfirm?.({
    eyebrow: "Campanha do Mestre",
    title: "Excluir Campanha definitivamente?",
    message: `“${activeCampaign.name}” será removida para todos os jogadores. As fichas originais permanecerão nas contas de seus donos.`,
    confirmLabel: "Excluir Campanha",
    tone: "danger",
    trigger,
  });
  if (!confirmed) return;
  campaignBusy = true;
  try {
    const campaignId = activeCampaign.id;
    for (const sheet of activeCampaignSheets) {
      await revokeSheetCampaignAccess(sheet, activeCampaignMembers, activeCampaign);
    }
    const references = [
      ...activeCampaignSheets.map((sheet) => firestoreApi.doc(firestoreDb, "campaigns", campaignId, "sheets", sheet.id)),
      ...activeCampaignMembers.map((member) => firestoreApi.doc(firestoreDb, "campaigns", campaignId, "members", member.id)),
      ...activeCampaignMembers.map((member) => firestoreApi.doc(firestoreDb, "users", member.id, "campaigns", campaignId)),
      firestoreApi.doc(firestoreDb, "campaignCodes", activeCampaign.joinCode),
    ];
    await commitCampaignDeletes(references);
    await firestoreApi.deleteDoc(firestoreApi.doc(firestoreDb, "campaigns", campaignId));
    await loadCampaignRecords();
    showCampaignDashboard();
  } catch (error) {
    await window.showAbyssAlert?.({
      eyebrow: "Campanha",
      title: "Não foi possível excluir",
      message: describeFirebaseError(error),
      tone: "warning",
      trigger,
    });
  } finally {
    campaignBusy = false;
  }
}

async function openCampaignSheet(sheetId, trigger) {
  const sheet = activeCampaignSheets.find((item) => item.id === sheetId);
  if (!sheet || !activeCampaign || !currentFirebaseUser || campaignBusy) return;
  campaignBusy = true;
  if (trigger) trigger.disabled = true;
  try {
    if (!canViewCampaignSheet(sheet)) {
      throw new Error("Esta ficha é privada. Somente o dono e o Mestre podem abri-la.");
    }
    const linkSnapshot = await firestoreApi.getDoc(
      firestoreApi.doc(firestoreDb, "campaigns", activeCampaign.id, "sheets", sheet.id),
    );
    if (!linkSnapshot.exists()) throw new Error("Esta ficha não está mais vinculada à Campanha.");
    sheet.privateToPlayers = linkSnapshot.data().privateToPlayers;
    if (!canViewCampaignSheet(sheet)) {
      renderCampaignDetail();
      throw new Error("Esta ficha foi privada. Somente o dono e o Mestre podem abri-la.");
    }
    if (cloudSavePromise && !(await cloudSavePromise)) throw new Error("A ficha atual ainda não terminou de salvar.");
    if (stateRevision > lastSavedRevision && !(await flushCloudSave())) {
      throw new Error("Não foi possível salvar a ficha atual antes de abrir a Campanha.");
    }
    const remoteState = await readCloudSheet({ uid: sheet.ownerUid }, sheet.slotId);
    const canEdit = activeCampaign.role === "master" || sheet.ownerUid === currentFirebaseUser.uid;
    const returnSlotId = currentSlotId;
    const returnCampaignId = activeCampaign.id;
    campaignSheetSession = {
      token: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      campaignId: activeCampaign.id,
      campaignName: activeCampaign.name,
      sheetId: sheet.id,
      ownerUid: sheet.ownerUid,
      ownerName: sheet.ownerName,
      slotId: sheet.slotId,
      slotName: sheet.slotName,
      canEdit,
      returnSlotId,
      returnCampaignId,
    };
    isHydratingCloudState = true;
    sheetBridge.applyState(remoteState, { persistLocal: false });
    stateRevision = 0;
    lastSavedRevision = 0;
    isHydratingCloudState = false;
    stopCampaignShieldRealtime();
    campaignShieldProfiles.clear();
    campaignUi.app.hidden = true;
    document.body.classList.remove("campaign-mode");
    document.body.classList.add("campaign-sheet-session");
    document.body.classList.toggle("is-readonly", !canEdit);
    setCampaignSheetReadOnly(!canEdit);
    campaignUi.sheetSessionBar.hidden = false;
    campaignUi.sheetSessionTitle.textContent = sheet.characterName || sheet.slotName || "Ficha da Campanha";
    campaignUi.sheetSessionStatus.textContent = canEdit
      ? `Edição autorizada · ${activeCampaign.name}`
      : `Somente visualização · ${activeCampaign.name}`;
    document.querySelector('[data-view-target="profile"]')?.click();
    window.scrollTo({ top: 0, behavior: "auto" });
  } catch (error) {
    isHydratingCloudState = false;
    campaignSheetSession = null;
    setCampaignSheetReadOnly(false);
    await window.showAbyssAlert?.({
      eyebrow: "Ficha da Campanha",
      title: "Não foi possível abrir",
      message: userFacingErrorMessage(error) || describeFirebaseError(error),
      tone: "warning",
      trigger,
    });
  } finally {
    campaignBusy = false;
    if (trigger) trigger.disabled = !canViewCampaignSheet(sheet);
  }
}

async function closeCampaignSheetSession() {
  const session = campaignSheetSession;
  if (!session || campaignBusy) return;
  campaignBusy = true;
  campaignUi.sheetSessionBack.disabled = true;
  try {
    if (session.canEdit && stateRevision > lastSavedRevision) {
      const saved = await flushCloudSave();
      if (!saved) throw new Error("A ficha compartilhada ainda não pôde ser salva.");
    }
    campaignSheetSession = null;
    setCampaignSheetReadOnly(false);
    document.body.classList.remove("campaign-sheet-session", "is-readonly");
    campaignUi.sheetSessionBar.hidden = true;
    if (currentFirebaseUser && session.returnSlotId) {
      await hydrateSlot(currentFirebaseUser, session.returnSlotId, { announce: false });
    }
    campaignBusy = false;
    await openCampaignPortal();
    await openCampaignDetail(session.returnCampaignId);
  } catch (error) {
    await window.showAbyssAlert?.({
      eyebrow: "Ficha da Campanha",
      title: "Não foi possível voltar",
      message: userFacingErrorMessage(error) || describeFirebaseError(error),
      tone: "warning",
      trigger: campaignUi.sheetSessionBack,
    });
  } finally {
    campaignBusy = false;
    campaignUi.sheetSessionBack.disabled = false;
  }
}

function clearCampaignSheetSession() {
  campaignSheetSession = null;
  setCampaignSheetReadOnly(false);
  document.body.classList.remove("campaign-sheet-session", "is-readonly", "campaign-mode");
  campaignUi.sheetSessionBar.hidden = true;
  campaignUi.app.hidden = true;
}

function openStartupSlotGate({ loading = true, message = "Carregando Slots…" } = {}) {
  firebaseUi.startupGate.hidden = false;
  firebaseUi.startupGate.setAttribute("aria-busy", String(loading));
  firebaseUi.startupGateSpinner.hidden = !loading;
  firebaseUi.startupGateStatus.classList.remove("is-error");
  firebaseUi.startupGateStatus.textContent = message;
  firebaseUi.startupGateActions.hidden = true;
  if (loading) {
    firebaseUi.startupCreateButton.hidden = true;
    firebaseUi.startupCreateButton.setAttribute("aria-expanded", "false");
    firebaseUi.startupCreateForm.hidden = true;
    firebaseUi.startupGateSummary.hidden = true;
    startupSlotFolderId = null;
    firebaseUi.startupFolderNav.hidden = true;
    firebaseUi.startupGateList.replaceChildren();
  }
  document.body.classList.add("slot-gate-open");
  requestAnimationFrame(() => firebaseUi.startupGateDialog.focus());
}

function closeStartupSlotGate() {
  firebaseUi.startupGate.hidden = true;
  firebaseUi.startupGate.setAttribute("aria-busy", "false");
  firebaseUi.startupCreateForm.hidden = true;
  firebaseUi.startupCreateButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("slot-gate-open");
}

function showStartupSlotGateError(message) {
  openStartupSlotGate({ loading: false, message });
  firebaseUi.startupGateStatus.classList.add("is-error");
  firebaseUi.startupGateActions.hidden = false;
}

function renderStartupSlotChoices() {
  firebaseUi.startupGateList.replaceChildren();
  firebaseUi.startupGateSpinner.hidden = true;
  firebaseUi.startupGate.setAttribute("aria-busy", String(startupCreateBusy));
  firebaseUi.startupGateActions.hidden = true;
  firebaseUi.startupGateStatus.classList.remove("is-error");
  firebaseUi.startupCreateButton.hidden = !currentFirebaseUser;
  if (!firebaseUi.startupCreateForm.hidden) fillSlotFolderSelect(firebaseUi.startupCreateFolder, firebaseUi.startupCreateFolder.value);
  if (startupSlotFolderId !== null && startupSlotFolderId !== UNFILED_SLOT_FOLDER && !normalizeSlotFolderId(startupSlotFolderId)) {
    startupSlotFolderId = null;
  }
  firebaseUi.startupFolderNav.hidden = startupSlotFolderId === null;
  firebaseUi.startupFolderName.textContent = getSlotFolderName(startupSlotFolderId);
  firebaseUi.startupGateStatus.textContent = startupSlotFolderId === null ? "Escolha uma pasta para ver suas fichas." : "Selecione o Slot que deseja abrir.";
  firebaseUi.startupGateDescription.textContent = "Suas fichas estão organizadas por pastas. Cada personagem continua independente.";
  firebaseUi.startupGateSummary.hidden = false;

  if (startupSlotFolderId === null) {
    const folders = getSlotFolderEntries();
    firebaseUi.startupGateSummary.textContent = `${folders.length} ${folders.length === 1 ? "pasta" : "pastas"} · ${currentSlots.length} ${currentSlots.length === 1 ? "ficha" : "fichas"}`;
    folders.forEach((folder) => firebaseUi.startupGateList.append(createSlotFolderCard(folder, true)));
    setStartupCreateAvailability(startupCreateBusy);
    return;
  }
  const visibleSlots = currentSlots.filter((slot) => getSlotFolderId(slot) === startupSlotFolderId);
  firebaseUi.startupGateSummary.textContent = `${visibleSlots.length} ${visibleSlots.length === 1 ? "ficha" : "fichas"}`;
  if (!visibleSlots.length) firebaseUi.startupGateStatus.textContent = "Esta pasta ainda não tem fichas. Volte às pastas para escolher outra.";

  visibleSlots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-gate-choice";
    button.dataset.startupSlot = slot.id;
    button.title = slot.name;
    const marker = createSlotAvatar(slot, "slot-gate-avatar");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = slot.name;
    const detail = document.createElement("small");
    detail.textContent = slot.id === preferredStartupSlotId ? "Último Slot usado" : `Slot ${currentSlots.indexOf(slot) + 1}`;
    copy.append(name, detail);
    const action = document.createElement("b");
    action.textContent = "Abrir";
    button.append(marker, copy, action);
    firebaseUi.startupGateList.append(button);
  });
  setStartupCreateAvailability(startupCreateBusy);
}

function setStartupCreateAvailability(busy = startupCreateBusy) {
  firebaseUi.startupGate.querySelectorAll("button, input, select").forEach((control) => { control.disabled = busy; });
  firebaseUi.startupCreateSubmit.textContent = startupCreateBusy ? "Criando…" : "Criar e abrir";
}

function openStartupCreateSheet() {
  if (!currentFirebaseUser || firebaseUi.startupGate.hidden || startupCreateBusy || isHydratingCloudState) return;
  fillSlotFolderSelect(firebaseUi.startupCreateFolder, startupSlotFolderId || UNFILED_SLOT_FOLDER);
  firebaseUi.startupCreateName.value = "";
  firebaseUi.startupCreateStatus.textContent = "";
  firebaseUi.startupCreateStatus.classList.remove("is-error");
  firebaseUi.startupCreateForm.hidden = false;
  firebaseUi.startupCreateButton.setAttribute("aria-expanded", "true");
  firebaseUi.startupCreateName.focus();
}

function closeStartupCreateSheet({ restoreFocus = true } = {}) {
  if (startupCreateBusy) return;
  firebaseUi.startupCreateForm.hidden = true;
  firebaseUi.startupCreateButton.setAttribute("aria-expanded", "false");
  firebaseUi.startupCreateStatus.textContent = "";
  if (restoreFocus) firebaseUi.startupCreateButton.focus();
}

async function submitStartupCreateSheet(event) {
  event.preventDefault();
  if (!currentFirebaseUser || firebaseUi.startupGate.hidden || firebaseUi.startupCreateForm.hidden || startupCreateBusy || isHydratingCloudState) return;
  const user = currentFirebaseUser;
  const epoch = accountRollEpoch;
  const name = characterSlotName(firebaseUi.startupCreateName.value, `Personagem ${currentSlots.length + 1}`);
  const selectedFolder = firebaseUi.startupCreateFolder.value;
  const folderId = normalizeSlotFolderId(selectedFolder);
  if (selectedFolder !== UNFILED_SLOT_FOLDER && !folderId) {
    fillSlotFolderSelect(firebaseUi.startupCreateFolder);
    firebaseUi.startupCreateStatus.textContent = "Essa pasta não está mais disponível. Escolha outra pasta ou “Sem pasta”.";
    firebaseUi.startupCreateStatus.classList.add("is-error");
    firebaseUi.startupCreateFolder.focus();
    return;
  }
  const sameAccount = () => epoch === accountRollEpoch && currentFirebaseUser?.uid === user.uid;
  startupCreateBusy = true;
  setStartupCreateAvailability(true);
  firebaseUi.startupGate.setAttribute("aria-busy", "true");
  firebaseUi.startupCreateStatus.classList.remove("is-error");
  firebaseUi.startupCreateStatus.textContent = "Criando sua nova ficha…";
  try {
    if (currentSlotId) {
      if (cloudSavePromise && !(await cloudSavePromise)) throw new Error("Não foi possível salvar a ficha atual. Tente novamente.");
      if (stateRevision > lastSavedRevision && !(await flushCloudSave())) throw new Error("Não foi possível salvar a ficha atual. Tente novamente.");
    }
    if (!sameAccount()) return;
    const slot = await createCloudSlot(name, { folderId });
    if (!sameAccount() || currentSlotId !== slot.id) return;
    currentSlotFolderId = getSlotFolderId(slot);
    preferredStartupSlotId = slot.id;
    firebaseUi.startupCreateName.value = "";
    closeStartupSlotGate();
    renderAccountIdentity(user, "signed-in");
  } catch (error) {
    if (!sameAccount()) return;
    firebaseUi.startupCreateStatus.textContent = userFacingErrorMessage(error) || "Não foi possível criar a ficha. Tente novamente.";
    firebaseUi.startupCreateStatus.classList.add("is-error");
  } finally {
    if (sameAccount()) {
      startupCreateBusy = false;
      setStartupCreateAvailability(false);
      firebaseUi.startupGate.setAttribute("aria-busy", "false");
    }
  }
}

function firebaseConfigIsReady() {
  const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];
  return requiredFields.every((field) => {
    const value = String(FIREBASE_CONFIG[field] || "").trim();
    return value && !value.includes("COLE_");
  });
}

function openAccountMenu() {
  firebaseUi.menu.hidden = false;
  firebaseUi.button.setAttribute("aria-expanded", "true");
}

function closeAccountMenu() {
  firebaseUi.menu.hidden = true;
  firebaseUi.button.setAttribute("aria-expanded", "false");
}

function setSyncStatus(state, shortText, title, message) {
  firebaseUi.button.dataset.syncState = state;
  firebaseUi.syncCard.dataset.syncState = state;
  firebaseUi.shortStatus.textContent = shortText;
  firebaseUi.syncTitle.textContent = title;
  firebaseUi.syncMessage.textContent = message;
}

function setAvatar(image, fallback, photoUrl, displayName) {
  const hasPhoto = Boolean(photoUrl);
  image.hidden = !hasPhoto;
  if (hasPhoto) image.src = photoUrl;
  else image.removeAttribute("src");
  if (fallback) {
    fallback.hidden = hasPhoto;
    fallback.textContent = String(displayName || "G").trim().charAt(0).toUpperCase() || "G";
  }
}

function isMinervaAdmin(user = currentFirebaseUser) {
  const email = String(user?.email || "").trim().toLowerCase();
  return Boolean(user?.emailVerified && email && MINERVA_ADMIN_EMAILS.has(email));
}

function renderAccountIdentity(user, state = user ? "signed-in" : "signed-out") {
  const signedIn = Boolean(user);
  const identity = getEffectiveIdentity(user);
  const displayName = identity.displayName;
  const firstName = currentAccountSettings.nickname || displayName.trim().split(/\s+/)[0] || "Minha conta";

  firebaseUi.button.dataset.accountState = state;
  firebaseUi.button.disabled = state === "signing-in";
  firebaseUi.label.textContent = signedIn ? firstName : state === "missing" ? "Configurar" : "Entrar";
  firebaseUi.button.setAttribute(
    "aria-label",
    signedIn ? `Abrir conta de ${displayName}` : "Entrar com o Google e sincronizar a ficha",
  );

  firebaseUi.icon.hidden = signedIn;
  setAvatar(firebaseUi.avatar, null, identity.photoURL, displayName);
  setAvatar(firebaseUi.menuAvatar, firebaseUi.placeholder, identity.photoURL, displayName);
  firebaseUi.name.textContent = signedIn ? displayName : "Nenhuma conta conectada";
  firebaseUi.email.textContent = signedIn ? (user.email || "Conta Google") : "Entre para sincronizar esta ficha.";

  firebaseUi.login.hidden = signedIn || state === "missing" || state === "loading" || state === "signing-in";
  firebaseUi.syncNow.hidden = !signedIn;
  firebaseUi.exportSheet.hidden = !signedIn || !currentSlotId;
  firebaseUi.importSheet.hidden = !signedIn || !currentSlotId;
  firebaseUi.reset.hidden = !signedIn;
  firebaseUi.signOut.hidden = !signedIn;
  rollAccountUi.settingsButton.hidden = !signedIn;
  firebaseUi.slotCard.hidden = !signedIn || !currentSlotId;
  firebaseUi.minervaButton.hidden = !signedIn || !isMinervaAdmin(user);
  firebaseUi.slotsLoginNote.hidden = signedIn;
  firebaseUi.createSlotForm.hidden = !signedIn;
  firebaseUi.createSlotFolderForm.hidden = !signedIn;
  firebaseUi.slotsFolderNav.hidden = !signedIn;
  firebaseUi.slotsTransferPanel.hidden = !signedIn;
  renderCampaignIdentity();
}

function bytesToBase64Url(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function streamBytes(bytes, StreamConstructor) {
  const stream = new Blob([bytes]).stream().pipeThrough(new StreamConstructor("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function encodeSheetTransferCode(state, options = {}) {
  const payload = {
    type: "abyss-rpg-sheet",
    version: 1,
    exportedAt: new Date().toISOString(),
    slotName: characterSlotName(state?.profile?.name, characterSlotName(options.slotName, "")),
    state,
  };
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  let method = "J";
  let bytes = raw;
  if (typeof CompressionStream === "function") {
    const compressed = await streamBytes(raw, CompressionStream);
    if (compressed.length < raw.length) {
      method = "G";
      bytes = compressed;
    }
  }
  return `ABYSS1-${method}-${bytesToBase64Url(bytes)}`;
}

async function decodeSheetTransferCode(code) {
  const compact = String(code || "").replace(/\s+/g, "");
  if (compact.length < 20 || compact.length > 50 * 1024 * 1024) {
    throw new Error("O código está vazio ou ultrapassa o tamanho aceito.");
  }
  const match = compact.match(/^ABYSS1-([GJ])-([A-Za-z0-9_-]+)$/);
  if (!match) throw new Error("Este não parece ser um código de ficha do Abyss RPG.");
  let bytes = base64UrlToBytes(match[2]);
  if (match[1] === "G") {
    if (typeof DecompressionStream !== "function") {
      throw new Error("Este navegador não consegue descompactar o código. Atualize-o ou use outro navegador.");
    }
    bytes = await streamBytes(bytes, DecompressionStream);
  }
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (payload?.type !== "abyss-rpg-sheet" || !payload.state || typeof payload.state !== "object") {
    throw new Error("O conteúdo do código não é uma ficha válida.");
  }
  return {
    state: payload.state,
    slotName: characterSlotName(payload.state?.profile?.name, characterSlotName(payload.slotName, "")),
  };
}

function dataUrlToImageFile(dataUrl, name = "imagem-importada") {
  const match = String(dataUrl || "").match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  const binary = atob(match[2]);
  if (binary.length > MAX_ABILITY_MEDIA_BYTES) throw new Error("Uma imagem da ficha ultrapassa 8 MB.");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  return new File([bytes], `${name}.${extension}`, { type: match[1].toLowerCase() });
}

function updateSheetTransferCount() {
  const count = firebaseUi.transferCode.value.length;
  firebaseUi.transferCount.textContent = `${count.toLocaleString("pt-BR")} ${count === 1 ? "caractere" : "caracteres"}`;
}

function setSheetTransferStatus(message = "", isError = false) {
  firebaseUi.transferStatus.textContent = message;
  firebaseUi.transferStatus.classList.toggle("is-error", isError);
}

function closeSheetTransfer() {
  firebaseUi.transferModal.hidden = true;
  sheetBridge.syncModalLock?.();
  const trigger = sheetTransferTrigger || (sheetTransferMode === "import" ? firebaseUi.importSheet : firebaseUi.exportSheet);
  sheetTransferTrigger = null;
  sheetTransferSlotId = "";
  if (trigger?.isConnected) trigger.focus();
}

async function generateSheetTransferCode() {
  firebaseUi.transferPrimary.disabled = true;
  firebaseUi.transferCopy.disabled = true;
  firebaseUi.transferCode.value = "Gerando código…";
  updateSheetTransferCount();
  setSheetTransferStatus("Reunindo e compactando os dados deste Slot.");
  try {
    const targetSlotId = sheetTransferSlotId || currentSlotId;
    const targetSlot = currentSlots.find((entry) => entry.id === targetSlotId);
    if (!targetSlotId || !targetSlot) throw new Error("Escolha um Slot válido para exportar.");

    let state;
    if (targetSlotId === currentSlotId) {
      if (cloudSavePromise && !(await cloudSavePromise)) {
        throw new Error("As alterações pendentes ainda não puderam ser salvas.");
      }
      if (stateRevision > lastSavedRevision && !(await flushCloudSave())) {
        throw new Error("Salve as alterações do Slot antes de exportá-lo.");
      }
      state = sheetBridge.captureState();
    } else {
      state = await readCloudSheet(currentFirebaseUser, targetSlotId);
    }

    const code = await encodeSheetTransferCode(state, { slotName: targetSlot.name });
    firebaseUi.transferCode.value = code;
    updateSheetTransferCount();
    setSheetTransferStatus(`Código de “${targetSlot.name}” pronto. Guarde-o inteiro; qualquer caractere ausente invalida a importação.`);
  } catch (error) {
    firebaseUi.transferCode.value = "";
    updateSheetTransferCount();
    setSheetTransferStatus(userFacingErrorMessage(error) || "Não foi possível gerar o código.", true);
  } finally {
    firebaseUi.transferPrimary.disabled = false;
    firebaseUi.transferCopy.disabled = false;
  }
}

function openSheetTransfer(mode, options = {}) {
  if (!currentFirebaseUser || !currentSlotId) return;
  sheetTransferMode = mode === "import-new" ? "import-new" : mode === "import" ? "import" : "export";
  sheetTransferSlotId = options.slotId || currentSlotId;
  const importing = sheetTransferMode !== "export";
  const creatingSlot = sheetTransferMode === "import-new";
  const targetSlot = currentSlots.find((entry) => entry.id === sheetTransferSlotId);
  sheetTransferTrigger = options.trigger || (creatingSlot ? firebaseUi.slotsImportCode : importing ? firebaseUi.importSheet : firebaseUi.exportSheet);
  firebaseUi.transferTitle.textContent = creatingSlot
    ? "Importar novo Slot"
    : importing
      ? "Importar ficha"
      : `Exportar ${targetSlot?.name || "ficha"}`;
  firebaseUi.transferDescription.textContent = creatingSlot
    ? "Cole o código recebido para criar uma nova ficha independente na sua conta."
    : importing
      ? "Cole um código para substituir somente o Slot aberto. Os outros Slots não serão alterados."
      : "Copie o código para guardar ou entregar esta ficha a outra pessoa.";
  firebaseUi.transferCode.value = "";
  firebaseUi.transferCode.readOnly = !importing;
  firebaseUi.transferCode.placeholder = importing ? "Cole aqui o código ABYSS1-…" : "";
  firebaseUi.transferSlotField.hidden = !creatingSlot;
  firebaseUi.transferSlotName.value = "";
  firebaseUi.transferCopy.hidden = importing;
  firebaseUi.transferPrimary.textContent = creatingSlot
    ? "Criar Slot com o código"
    : importing
      ? "Importar neste Slot"
      : "Gerar novamente";
  setSheetTransferStatus(creatingSlot
    ? "A ficha recebida será adicionada como um novo Slot; nenhuma ficha existente será substituída."
    : importing
      ? "A importação exige confirmação antes de substituir a ficha."
      : "");
  updateSheetTransferCount();
  closeAccountMenu();
  firebaseUi.transferModal.hidden = false;
  sheetBridge.syncModalLock?.();
  requestAnimationFrame(() => firebaseUi.transferDialog.focus());
  if (!importing) generateSheetTransferCode();
}

async function prepareImportedAbilityMedia(state, target = {}) {
  const uploadedReferences = [];
  const importedAbilities = Array.isArray(state.abilities) ? state.abilities : [];
  for (let index = 0; index < importedAbilities.length; index += 1) {
    const ability = importedAbilities[index];
    if (!ability || typeof ability !== "object") continue;
    if (ability.mediaOwner === "minerva" && ability.mediaRefId) continue;
    const file = dataUrlToImageFile(ability.mediaUrl, `habilidade-${index + 1}`);
    if (file) {
      setSheetTransferStatus(`Transferindo mídia ${index + 1} de ${importedAbilities.length}…`);
      const uploaded = await uploadAbilityMedia({
        scope: "sheet",
        abilityId: ability.id || `import-${index}`,
        file,
        ownerUid: target.uid,
        slotId: target.slotId,
      });
      ability.mediaUrl = uploaded.url;
      ability.mediaOwner = "slot";
      ability.mediaRefId = uploaded.refId;
      uploadedReferences.push(uploaded);
    } else {
      ability.mediaUrl = safeRemoteImageUrlForTransfer(ability.mediaUrl);
      ability.mediaOwner = "link";
      ability.mediaRefId = "";
    }
  }
  return uploadedReferences;
}

function safeRemoteImageUrlForTransfer(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function importSheetTransferCode() {
  if (!currentFirebaseUser || !currentSlotId) return;
  const slot = currentSlots.find((entry) => entry.id === currentSlotId);
  let importedState;
  try {
    setSheetTransferStatus("Validando o código…");
    const decoded = await decodeSheetTransferCode(firebaseUi.transferCode.value);
    importedState = decoded.state;
  } catch (error) {
    setSheetTransferStatus(userFacingErrorMessage(error) || "O código não pôde ser lido.", true);
    return;
  }
  const confirmed = await window.showAbyssConfirm({
    eyebrow: "Importação de ficha",
    title: `Substituir “${slot?.name || "Personagem"}”?`,
    message: "A ficha atual deste Slot será substituída pelo conteúdo do código. Os demais Slots permanecerão intactos.",
    confirmLabel: "Importar ficha",
    tone: "warning",
    trigger: firebaseUi.transferPrimary,
  });
  if (!confirmed) return;

  window.clearTimeout(cloudSaveTimer);
  if (cloudSavePromise) await cloudSavePromise;
  const previousState = sheetBridge.captureState();
  const oldMediaReferences = (previousState.abilities || [])
    .filter((ability) => ability.mediaOwner === "slot" && ability.mediaRefId)
    .map((ability) => ({ scope: "sheet", refId: ability.mediaRefId, uid: currentFirebaseUser.uid, slotId: currentSlotId }));
  let uploadedReferences = [];
  firebaseUi.transferPrimary.disabled = true;
  firebaseUi.transferCode.readOnly = true;
  isHydratingCloudState = true;
  try {
    uploadedReferences = await prepareImportedAbilityMedia(importedState);
    if (!sheetBridge.applyState(importedState, { persistLocal: false })) {
      throw new Error("A ficha do código não contém dados aplicáveis.");
    }
    const normalizedState = sheetBridge.captureState();
    stateRevision += 1;
    setSheetTransferStatus("Salvando a ficha importada na conta…");
    await writeCloudSheet(currentFirebaseUser, currentSlotId, normalizedState, { slotName: slot?.name });
    lastSavedRevision = stateRevision;
    await Promise.allSettled(oldMediaReferences.map((reference) => deleteMedia(reference)));
    setSyncStatus("saved", "Ficha importada", "Importação concluída", `O Slot “${slot?.name || "Personagem"}” foi atualizado e salvo.`);
    closeSheetTransfer();
    await window.showAbyssAlert({
      eyebrow: "Importação concluída",
      title: "Ficha aplicada ao Slot",
      message: "Todos os dados válidos do código já estão na ficha e foram sincronizados.",
      tone: "info",
    });
  } catch (error) {
    sheetBridge.applyState(previousState, { persistLocal: false });
    await Promise.allSettled(uploadedReferences.map((reference) => deleteMedia(reference)));
    setSheetTransferStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true);
  } finally {
    isHydratingCloudState = false;
    firebaseUi.transferPrimary.disabled = false;
    firebaseUi.transferCode.readOnly = false;
  }
}

function normalizeImportedSheetState(importedState) {
  const previousState = sheetBridge.captureState();
  const wasHydrating = isHydratingCloudState;
  isHydratingCloudState = true;
  try {
    if (!sheetBridge.applyState(importedState, { persistLocal: false })) {
      throw new Error("A ficha do código não contém dados aplicáveis.");
    }
    return sheetBridge.captureState();
  } finally {
    sheetBridge.applyState(previousState, { persistLocal: false });
    isHydratingCloudState = wasHydrating;
  }
}

async function importSheetTransferAsNewSlot() {
  if (!currentFirebaseUser || !currentSlotId) return;

  let decoded;
  try {
    setSheetTransferStatus("Validando o código…");
    decoded = await decodeSheetTransferCode(firebaseUi.transferCode.value);
  } catch (error) {
    setSheetTransferStatus(userFacingErrorMessage(error) || "O código não pôde ser lido.", true);
    return;
  }

  const suggestedName = characterSlotName(
    firebaseUi.transferSlotName.value || decoded.state?.profile?.name || decoded.slotName,
    `Ficha importada ${currentSlots.length + 1}`,
  );
  firebaseUi.transferSlotName.value = suggestedName;
  const confirmed = await window.showAbyssConfirm({
    eyebrow: "Importar por código",
    title: `Criar “${suggestedName}”?`,
    message: "Um novo Slot independente será criado com os dados recebidos. Nenhuma das suas fichas atuais será substituída.",
    confirmLabel: "Criar novo Slot",
    tone: "info",
    trigger: firebaseUi.transferPrimary,
  });
  if (!confirmed) return;

  window.clearTimeout(cloudSaveTimer);
  if (cloudSavePromise && !(await cloudSavePromise)) {
    setSheetTransferStatus("As alterações do Slot atual ainda não puderam ser salvas.", true);
    return;
  }
  if (stateRevision > lastSavedRevision && !(await flushCloudSave())) {
    setSheetTransferStatus("Salve as alterações do Slot atual antes de importar outra ficha.", true);
    return;
  }

  const previousSlotId = currentSlotId;
  const previousState = sheetBridge.captureState();
  const previousRevision = stateRevision;
  const previousSavedRevision = lastSavedRevision;
  const slotRef = firestoreApi.doc(
    firestoreApi.collection(firestoreDb, "users", currentFirebaseUser.uid, "slots"),
  );
  const slot = {
    id: slotRef.id,
    name: suggestedName,
    folderId: normalizeSlotFolderId(currentSlotFolderId || firebaseUi.newSlotFolder.value),
    portrait: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  let uploadedReferences = [];
  let slotCommitted = false;

  firebaseUi.transferPrimary.disabled = true;
  firebaseUi.transferCode.readOnly = true;
  firebaseUi.transferSlotName.disabled = true;
  isHydratingCloudState = true;
  try {
    setSheetTransferStatus("Preparando os dados da ficha recebida…");
    const normalizedState = normalizeImportedSheetState(decoded.state);
    normalizedState.profile.name = suggestedName;
    uploadedReferences = await prepareImportedAbilityMedia(normalizedState, {
      uid: currentFirebaseUser.uid,
      slotId: slot.id,
    });

    currentSlots.push(slot);
    currentSlotId = slot.id;
    if (!sheetBridge.applyState(normalizedState, { persistLocal: false })) {
      throw new Error("A ficha do código não contém dados aplicáveis.");
    }
    stateRevision = previousRevision + 1;
    setSheetTransferStatus("Criando e salvando o novo Slot…");
    await writeCloudSheet(currentFirebaseUser, slot.id, normalizedState, {
      slotName: slot.name,
      created: true,
      folderId: slot.folderId,
    });
    slotCommitted = true;
    lastSavedRevision = stateRevision;
    currentSlotFolderId = getSlotFolderId(slot);
    renderSlots();
    setSyncStatus(
      "saved",
      "Ficha importada",
      "Novo Slot criado",
      `“${slot.name}” foi adicionado à sua conta e já está aberto.`,
    );
    closeSheetTransfer();
  } catch (error) {
    currentSlots = currentSlots.filter((entry) => entry.id !== slot.id);
    currentSlotId = previousSlotId;
    stateRevision = previousRevision;
    lastSavedRevision = previousSavedRevision;
    sheetBridge.applyState(previousState, { persistLocal: false });
    if (slotCommitted) {
      await deleteKnownSlotDocuments(currentFirebaseUser, slot.id).catch(() => {});
    }
    await Promise.allSettled(uploadedReferences.map((reference) => deleteMedia(reference)));
    renderSlots();
    setSheetTransferStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true);
    return;
  } finally {
    isHydratingCloudState = false;
    firebaseUi.transferPrimary.disabled = false;
    firebaseUi.transferCode.readOnly = false;
    firebaseUi.transferSlotName.disabled = false;
  }

  await window.showAbyssAlert({
    eyebrow: "Importação concluída",
    title: "Ficha adicionada aos Slots",
    message: `“${slot.name}” agora é uma ficha independente. Alterações nela não afetam a ficha de quem enviou o código.`,
    tone: "info",
  });
}

function describeFirebaseError(error) {
  const code = String(error?.code || "");
  if (code.includes("unauthorized-domain")) {
    return "Não foi possível conectar sua conta neste endereço. Tente novamente mais tarde.";
  }
  if (code.includes("popup-blocked")) return "O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente novamente.";
  if (code.includes("popup-closed-by-user")) return "A entrada foi cancelada antes de escolher uma conta.";
  if (code.includes("permission-denied")) {
    return "Não foi possível acessar estes dados. Tente entrar novamente.";
  }
  if (code.includes("not-found") || code.includes("failed-precondition")) return "O serviço está indisponível. Tente novamente mais tarde.";
  if (code.includes("invalid-api-key") || code.includes("invalid-app-id")) {
    return "Não foi possível conectar sua conta. Tente novamente mais tarde.";
  }
  if (code.includes("unavailable") || !navigator.onLine) {
    return "Sem conexão. Alterações feitas agora ainda não foram salvas.";
  }
  if (code === "abyss/bridge-missing") return "A ficha não terminou de carregar. Atualize a página e tente novamente.";
  return "Não foi possível concluir a sincronização. Verifique sua conexão e tente novamente.";
}

function finiteAttributeValue(value) {
  return sheetBridge.normalizeAttributeValue(value);
}

let portraitCompressionCache = null;

async function compactPortraitForFirestore(source) {
  if (!source || source.length < 700000 || !source.startsWith("data:image/")) {
    portraitCompressionCache = null;
    return source || "";
  }
  if (portraitCompressionCache?.source === source) return portraitCompressionCache.promise;
  const entry = { source, promise: null };
  portraitCompressionCache = entry;
  entry.promise = compressPortraitForFirestore(source).then((portrait) => {
    if (!portrait && portraitCompressionCache === entry) portraitCompressionCache = null;
    return portrait;
  });
  return entry.promise;
}

async function compressPortraitForFirestore(source) {
  if (!source || source.length < 700000 || !source.startsWith("data:image/")) return source || "";
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      const targetSize = 560;
      canvas.width = targetSize;
      canvas.height = targetSize;
      const context = canvas.getContext("2d");
      if (!context) { resolve(""); return; }
      context.fillStyle = "#0b0c0f";
      context.fillRect(0, 0, targetSize, targetSize);
      context.drawImage(image, 0, 0, targetSize, targetSize);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    }, { once: true });
    image.addEventListener("error", () => resolve(""), { once: true });
    image.src = source;
  });
}

function normalizeSlotName(value, fallback = "Personagem") {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 60) || fallback;
}

function characterSlotName(value, fallback = "Personagem") {
  return String(value ?? "").trim().slice(0, 120) || fallback;
}

function syncCharacterSlotName(ownerUid, slotId, value) {
  const name = characterSlotName(value);
  let directoryChanged = false;
  if (currentFirebaseUser?.uid === ownerUid) {
    const slot = currentSlots.find((entry) => entry.id === slotId);
    if (slot && slot.name !== name) {
      slot.name = name;
      directoryChanged = true;
    }
  }
  if (campaignSheetSession?.ownerUid === ownerUid && campaignSheetSession.slotId === slotId) {
    campaignSheetSession.slotName = name;
    campaignUi.sheetSessionTitle.textContent = name;
  }
  activeCampaignSheets.forEach((sheet) => {
    if (sheet.ownerUid === ownerUid && sheet.slotId === slotId) {
      sheet.slotName = name;
      sheet.characterName = name;
    }
  });
  if (directoryChanged) {
    renderSlots();
    if (!firebaseUi.startupGate.hidden && !isHydratingCloudState) renderStartupSlotChoices();
  } else {
    updateActiveSlotDisplay();
  }
  return name;
}

async function getCampaignSlotNameRefs(ownerUid, slotId, session = null) {
  let campaignIds = [];
  if (currentFirebaseUser?.uid === ownerUid) {
    const index = await firestoreApi.getDocs(
      firestoreApi.collection(firestoreDb, "users", ownerUid, "campaigns"),
    );
    campaignIds = index.docs.map((entry) => entry.id);
  } else if (session?.ownerUid === ownerUid && session.slotId === slotId && session.canEdit) {
    campaignIds = [session.campaignId];
  }
  const snapshots = await Promise.allSettled([...new Set(campaignIds)].map(async (campaignId) => {
    const reference = firestoreApi.doc(firestoreDb, "campaigns", campaignId, "sheets", campaignSheetLinkId(ownerUid, slotId));
    const snapshot = await firestoreApi.getDoc(reference);
    return snapshot.exists() ? reference : null;
  }));
  // A stale membership index must not prevent saving the character's own sheet.
  return snapshots.filter((entry) => entry.status === "fulfilled" && entry.value).map((entry) => entry.value);
}

function getCloudDocumentRefs(uid, slotId) {
  const { doc } = firestoreApi;
  return {
    user: doc(firestoreDb, "users", uid),
    slot: doc(firestoreDb, "users", uid, "slots", slotId),
    profile: doc(firestoreDb, "users", uid, "slots", slotId, "data", "profile"),
    sheet: doc(firestoreDb, "users", uid, "slots", slotId, "data", "sheet"),
    customSkills: doc(
      firestoreDb,
      "users",
      uid,
      "slots",
      slotId,
      "data",
      "customSkills",
    ),
    abilities: doc(firestoreDb, "users", uid, "slots", slotId, "data", "abilities"),
  };
}

function normalizeMediaRefId(value) {
  return String(value || "")
    .trim()
    .replaceAll("/", "_")
    .slice(0, 120);
}

function getFirestoreMediaRefs({
  scope,
  refId,
  uid = campaignSheetSession?.ownerUid || currentFirebaseUser?.uid,
  slotId = campaignSheetSession?.slotId || currentSlotId,
}) {
  const normalizedRefId = normalizeMediaRefId(refId);
  if (!normalizedRefId) throw new Error("A imagem não possui uma referência válida.");

  if (scope === "minerva") {
    const metadata = firestoreApi.doc(
      firestoreDb,
      "minervaAbilityMedia",
      normalizedRefId,
    );
    return {
      metadata,
      chunk: (version, index) => firestoreApi.doc(
        firestoreDb,
        "minervaAbilityMedia",
        normalizedRefId,
        "chunks",
        `${version}-${String(index).padStart(3, "0")}`,
      ),
    };
  }

  if (!uid || !slotId) throw new Error("Nenhum Slot está ativo.");
  const metadata = firestoreApi.doc(
    firestoreDb,
    "users",
    uid,
    "slots",
    slotId,
    "abilityMedia",
    normalizedRefId,
  );
  return {
    metadata,
    chunk: (version, index) => firestoreApi.doc(
      firestoreDb,
      "users",
      uid,
      "slots",
      slotId,
      "abilityMedia",
      normalizedRefId,
      "chunks",
      `${version}-${String(index).padStart(3, "0")}`,
    ),
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")), {
      once: true,
    });
    reader.addEventListener(
      "error",
      () => reject(new Error("Não foi possível ler o arquivo escolhido.")),
      { once: true },
    );
    reader.readAsDataURL(file);
  });
}

function withCloudTimeout(promise, milliseconds, message) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), milliseconds);
    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

async function commitFirestoreOperations(operations) {
  const operationsPerBatch = 8;
  for (let index = 0; index < operations.length; index += operationsPerBatch) {
    const batch = firestoreApi.writeBatch(firestoreDb);
    operations.slice(index, index + operationsPerBatch).forEach((operation) => {
      if (operation.type === "delete") batch.delete(operation.ref);
      else batch.set(operation.ref, operation.data);
    });
    await withCloudTimeout(
      batch.commit(),
      25000,
      "O envio da imagem demorou demais. Verifique sua conexão e tente novamente.",
    );
  }
}

async function readFirestoreMedia(reference) {
  const refs = getFirestoreMediaRefs(reference);
  const metadataSnapshot = await withCloudTimeout(
    firestoreApi.getDoc(refs.metadata),
    20000,
    "A imagem demorou demais para carregar.",
  );
  if (!metadataSnapshot.exists()) return "";

  const metadata = metadataSnapshot.data();
  const contentType = String(metadata.contentType || "");
  const version = String(metadata.version || "");
  const chunkCount = Number.parseInt(metadata.chunkCount, 10);
  if (
    !ALLOWED_ABILITY_MEDIA_TYPES.has(contentType) ||
    !version ||
    !Number.isInteger(chunkCount) ||
    chunkCount < 1 ||
    chunkCount > 32
  ) {
    return "";
  }

  const snapshots = await withCloudTimeout(
    Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        firestoreApi.getDoc(refs.chunk(version, index)),
      ),
    ),
    25000,
    "A imagem demorou demais para carregar.",
  );
  if (snapshots.some((snapshot) => !snapshot.exists())) return "";

  const payload = snapshots
    .map((snapshot) => String(snapshot.data().data || ""))
    .join("");
  if (!payload || payload.length > 12 * 1024 * 1024) return "";
  return `data:${contentType};base64,${payload}`;
}

async function hydrateAbilityMedia(rawAbilities, context) {
  const list = Array.isArray(rawAbilities) ? rawAbilities : [];
  return Promise.all(
    list.map(async (rawAbility) => {
      const ability = rawAbility && typeof rawAbility === "object" ? rawAbility : {};
      const refId = normalizeMediaRefId(ability.mediaRefId);
      if (!refId || !["slot", "minerva"].includes(ability.mediaOwner)) {
        return ability;
      }

      try {
        const mediaUrl = await readFirestoreMedia({
          scope: ability.mediaOwner === "minerva" ? "minerva" : "sheet",
          refId,
          uid: context.uid,
          slotId: context.slotId,
        });
        return { ...ability, mediaUrl };
      } catch {
        return { ...ability, mediaUrl: "" };
      }
    }),
  );
}

async function readCloudSheet(user, slotId) {
  const refs = getCloudDocumentRefs(user.uid, slotId);
  const [profileSnapshot, sheetSnapshot, customSkillsSnapshot, abilitiesSnapshot] =
    await Promise.all([
      firestoreApi.getDoc(refs.profile),
      firestoreApi.getDoc(refs.sheet),
      firestoreApi.getDoc(refs.customSkills),
      firestoreApi.getDoc(refs.abilities),
    ]);

  const clean = sheetBridge.createCleanState();
  const profileData = profileSnapshot.exists() ? profileSnapshot.data() : {};
  const sheetData = sheetSnapshot.exists() ? sheetSnapshot.data() : {};
  const customData = customSkillsSnapshot.exists() ? customSkillsSnapshot.data() : {};
  const abilitiesData = abilitiesSnapshot.exists() ? abilitiesSnapshot.data() : {};
  const hydratedAbilities = await hydrateAbilityMedia(abilitiesData.items, {
    uid: user.uid,
    slotId,
  });

  return {
    schemaVersion: Math.max(
      Number.parseInt(profileData.schemaVersion, 10) || 0,
      Number.parseInt(sheetData.schemaVersion, 10) || 0,
      Number.parseInt(customData.schemaVersion, 10) || 0,
      Number.parseInt(abilitiesData.schemaVersion, 10) || 0,
    ),
    profile: {
      ...clean.profile,
      ...profileData,
      rollSounds: profileData.rollSounds,
      attributes: {
        ...clean.profile.attributes,
        ...(profileData.attributes || {}),
      },
      resources: {
        pv: { ...clean.profile.resources.pv, ...(profileData.resources?.pv || {}) },
        pa: { ...clean.profile.resources.pa, ...(profileData.resources?.pa || {}) },
        sa: { ...clean.profile.resources.sa, ...(profileData.resources?.sa || {}) },
      },
      wallet: {
        ...clean.profile.wallet,
        ...(profileData.wallet || {}),
      },
      purchaseHistory: Array.isArray(profileData.purchaseHistory)
        ? profileData.purchaseHistory
        : [],
      combat: {
        ...clean.profile.combat,
        ...(profileData.combat || {}),
        defense: {
          ...clean.profile.combat.defense,
          ...(profileData.combat?.defense || {}),
        },
        evasion: {
          ...clean.profile.combat.evasion,
          ...(profileData.combat?.evasion || {}),
        },
      },
    },
    sheet: {
      ...clean.sheet,
      ...sheetData,
      skillRows: sheetData.skillRows || {},
      selectedFeatureIds: sheetData.selectedFeatureIds || [],
      skillLimitApprovedIds: sheetData.skillLimitApprovedIds || [],
      notes: Array.isArray(sheetData.notes) ? sheetData.notes : [],
    },
    customSkills: Array.isArray(customData.items) ? customData.items : [],
    abilities: hydratedAbilities,
    inventory: Array.isArray(abilitiesData.inventoryItems) ? abilitiesData.inventoryItems : [],
  };
}

async function writeCloudSheet(user, slotId, state, options = {}) {
  if (!slotId) throw new Error("Nenhum Slot está ativo.");

  const actorUid = currentFirebaseUser?.uid;
  const actorEpoch = accountRollEpoch;
  const name = characterSlotName(state.profile?.name);
  const refs = getCloudDocumentRefs(user.uid, slotId);
  const timestamp = firestoreApi.serverTimestamp();
  const portrait = await compactPortraitForFirestore(String(state.profile?.portrait || ""));
  const campaignNameRefs = await getCampaignSlotNameRefs(user.uid, slotId, options.campaignSession);
  if (currentFirebaseUser?.uid !== actorUid || accountRollEpoch !== actorEpoch) {
    throw new Error("A conta mudou durante a sincronização da ficha.");
  }
  const attributes = {};
  ["FOR", "AGI", "INT", "CON", "POD"].forEach((attribute) => {
    attributes[attribute] = finiteAttributeValue(state.profile?.attributes?.[attribute]);
  });
  const cloudAbilities = (Array.isArray(state.abilities) ? state.abilities : [])
    .map((ability) => sheetBridge.serializeAbility(ability))
    .filter(Boolean);
  const cloudInventory = (Array.isArray(state.inventory) ? state.inventory : [])
    .map((item) => sheetBridge.serializeItem(item))
    .filter(Boolean);
  const cloudPurchaseHistory = (Array.isArray(state.profile?.purchaseHistory)
    ? state.profile.purchaseHistory
    : [])
    .slice(0, 200)
    .map((entry) => ({
      id: String(entry?.id || "").slice(0, 120),
      productId: String(entry?.productId || "").slice(0, 120),
      name: String(entry?.name || "").slice(0, 100),
      kind: entry?.kind === "item" ? "item" : "ability",
      destination: String(entry?.destination || "inventory").slice(0, 32),
      echoKey: String(entry?.echoKey || "").slice(0, 24),
      price: Math.min(999999999, Math.max(0, Number.parseInt(entry?.price, 10) || 0)),
      quantity: Math.min(9999, Math.max(1, Number.parseInt(entry?.quantity, 10) || 1)),
      purchasedAt: String(entry?.purchasedAt || "").slice(0, 40),
    }))
    .filter((entry) => entry.id && entry.name && entry.purchasedAt);

  const batch = firestoreApi.writeBatch(firestoreDb);
  if (!options.skipDirectoryWrites) {
    batch.set(
      refs.user,
      {
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        activeSlotId: slotId,
        lastActiveAt: timestamp,
      },
      { merge: true },
    );
    batch.set(
      refs.slot,
      {
        name,
        portrait,
        updatedAt: timestamp,
        ...(options.created ? { createdAt: timestamp, folderId: normalizeSlotFolderId(options.folderId) } : {}),
      },
      { merge: true },
    );
  } else {
    batch.set(refs.slot, { name, updatedAt: timestamp }, { merge: true });
  }
  campaignNameRefs.forEach((reference) => batch.set(reference, {
    slotName: name, characterName: name, portrait, updatedAt: timestamp,
  }, { merge: true }));
  batch.set(refs.profile, {
    schemaVersion: 12,
    name: String(state.profile?.name || "").trim().slice(0, 120),
    background: String(state.profile?.background || "").slice(0, 240),
    portrait,
    ...(Object.hasOwn(state.profile || {}, "rollSounds")
      ? { rollSounds: sheetBridge.normalizeRollSounds(state.profile.rollSounds) }
      : {}),
    echo: String(state.profile?.echo || "").slice(0, 24),
    echoPoints: Math.min(5, Math.max(0, Number.parseInt(state.profile?.echoPoints ?? 0, 10) || 0)),
    appearance: state.profile?.appearance || {},
    classKey: String(state.profile?.classKey || "").slice(0, 24),
    level: Math.min(15, Math.max(1, Number.parseInt(state.profile?.level, 10) || 1)),
    attributes,
    resources: state.profile?.resources || {},
    wallet: {
      verdeons: Math.min(
        999999999,
        Math.max(0, Number.parseInt(state.profile?.wallet?.verdeons, 10) || 0),
      ),
    },
    purchaseHistory: cloudPurchaseHistory,
    combat: state.profile?.combat || {},
    specialTests: state.profile?.specialTests || {},
    updatedAt: timestamp,
  });
  batch.set(refs.sheet, {
    schemaVersion: 12,
    difficulty: ["easy", "medium", "hard"].includes(state.sheet?.difficulty)
      ? state.sheet.difficulty
      : "medium",
    skillRows: state.sheet?.skillRows || {},
    selectedFeatureIds: Array.isArray(state.sheet?.selectedFeatureIds)
      ? state.sheet.selectedFeatureIds
      : [],
    skillLimitApprovedIds: Array.isArray(state.sheet?.skillLimitApprovedIds)
      ? state.sheet.skillLimitApprovedIds
      : [],
    notes: Array.isArray(state.sheet?.notes) ? state.sheet.notes : [],
    updatedAt: timestamp,
  });
  batch.set(refs.customSkills, {
    schemaVersion: 12,
    items: Array.isArray(state.customSkills) ? state.customSkills : [],
    updatedAt: timestamp,
  });
  batch.set(refs.abilities, {
    schemaVersion: 12,
    items: cloudAbilities,
    inventoryItems: cloudInventory,
    updatedAt: timestamp,
  });
  await batch.commit();
  if (currentFirebaseUser?.uid === actorUid && accountRollEpoch === actorEpoch) {
    const liveOwnerUid = campaignSheetSession?.ownerUid || currentFirebaseUser?.uid;
    const liveSlotId = campaignSheetSession?.slotId || currentSlotId;
    const liveName = liveOwnerUid === user.uid && liveSlotId === slotId
      ? sheetBridge.captureState().profile?.name
      : name;
    syncCharacterSlotName(user.uid, slotId, liveName);
  }
  if (!options.skipDirectoryWrites && currentFirebaseUser?.uid === user.uid && accountRollEpoch === actorEpoch) {
    const slot = currentSlots.find((entry) => entry.id === slotId);
    if (slot) {
      slot.portrait = portrait;
      slot.updatedAt = Date.now();
      const row = [...firebaseUi.slotsList.querySelectorAll("[data-slot-id]")]
        .find((entry) => entry.dataset.slotId === slotId);
      row?.querySelector(".slot-avatar")?.replaceWith(createSlotAvatar(slot, "slot-avatar"));
    }
    updateActiveSlotDisplay();
  }
}

function slotTimestampValue(value) {
  if (value?.toMillis) return value.toMillis();
  return typeof value === "number" ? value : 0;
}

function updateActiveSlotDisplay() {
  const active = currentSlots.find((slot) => slot.id === currentSlotId);
  firebaseUi.slotName.textContent = active?.name || "Nenhum Slot";
  firebaseUi.slotCard.hidden = !currentFirebaseUser || !active;
  firebaseUi.exportSheet.hidden = !currentFirebaseUser || !active;
  firebaseUi.importSheet.hidden = !currentFirebaseUser || !active;
  firebaseUi.slotsExportCurrent.disabled = !currentFirebaseUser || !active;
  firebaseUi.slotsImportCode.disabled = !currentFirebaseUser;

  document.querySelector("#slots-button")?.setAttribute(
    "title",
    active ? `Slot atual: ${active.name}` : "Organizar Slots",
  );
}

function createSlotAvatar(slot, className) {
  const avatar = document.createElement("span");
  avatar.className = className;
  const portrait = String(slot?.portrait || "");
  if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(portrait)) {
    const image = document.createElement("img");
    image.src = portrait;
    image.alt = "";
    avatar.append(image);
  } else {
    avatar.textContent = String(slot?.name || "P").trim().charAt(0).toUpperCase() || "P";
    avatar.setAttribute("aria-hidden", "true");
  }
  return avatar;
}

function normalizeSlotFolders(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw.filter((folder) => folder && typeof folder === "object").map((folder) => ({
    id: String(folder.id || "").trim().slice(0, 120),
    name: normalizeSlotName(folder.name, ""),
    createdAt: Number.isFinite(Number(folder.createdAt)) ? Number(folder.createdAt) : 0,
  })).filter((folder) => {
    if (!folder.id || folder.id === UNFILED_SLOT_FOLDER || !folder.name || seen.has(folder.id)) return false;
    seen.add(folder.id);
    return true;
  });
}

function normalizeSlotFolderId(id) {
  return currentSlotFolders.some((folder) => folder.id === id) ? id : "";
}

function getSlotFolderId(slot) {
  // Deleted or unknown folders return their sheets to Sem pasta.
  return normalizeSlotFolderId(slot?.folderId) || UNFILED_SLOT_FOLDER;
}

function getSlotFolderName(id) {
  return currentSlotFolders.find((folder) => folder.id === id)?.name || "Sem pasta";
}

function getSlotFolderEntries() {
  const counts = new Map([[UNFILED_SLOT_FOLDER, 0], ...currentSlotFolders.map((folder) => [folder.id, 0])]);
  currentSlots.forEach((slot) => {
    const id = getSlotFolderId(slot);
    counts.set(id, counts.get(id) + 1);
  });
  return [...currentSlotFolders, { id: UNFILED_SLOT_FOLDER, name: "Sem pasta" }]
    .map((folder) => ({ ...folder, count: counts.get(folder.id) || 0 }));
}

function fillSlotFolderSelect(select, preferredId = UNFILED_SLOT_FOLDER) {
  select.replaceChildren();
  const folders = [{ id: UNFILED_SLOT_FOLDER, name: "Sem pasta" }, ...currentSlotFolders];
  folders.forEach((folder) => {
    const option = document.createElement("option");
    option.value = folder.id;
    option.textContent = folder.name;
    select.append(option);
  });
  select.value = normalizeSlotFolderId(preferredId) || UNFILED_SLOT_FOLDER;
}

function createSlotFolderSymbol() {
  const symbol = document.createElement("span");
  symbol.className = "slot-folder-symbol";
  symbol.setAttribute("aria-hidden", "true");
  symbol.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 7V5h7l2 2h9v12H3V7ZM3 9h18"></path></svg>';
  return symbol;
}

function createSlotFolderCard(folder, startup = false) {
  const open = document.createElement("button");
  open.type = "button";
  open.className = startup ? "slot-gate-choice" : "slot-folder-open";
  if (startup) open.dataset.startupFolder = folder.id;
  else open.dataset.openSlotFolder = folder.id;
  const copy = document.createElement("span");
  copy.className = "slot-folder-copy";
  const name = document.createElement("strong");
  name.textContent = folder.name;
  if (startup) open.title = folder.name;
  const count = document.createElement("small");
  count.textContent = `${folder.count} ${folder.count === 1 ? "ficha" : "fichas"}`;
  copy.append(name, count);
  open.append(createSlotFolderSymbol(), copy);
  if (startup) {
    const action = document.createElement("b");
    action.textContent = "Entrar";
    open.append(action);
    return open;
  }
  const card = document.createElement("article");
  card.className = "slot-folder-card";
  card.dataset.slotFolderId = folder.id;
  card.dataset.dropSlotFolder = folder.id;
  card.classList.toggle("is-selected", currentSlotFolderId === folder.id);
  if (currentSlotFolderId === folder.id) open.setAttribute("aria-current", "true");
  card.append(open);
  if (folder.id !== UNFILED_SLOT_FOLDER) {
    const actions = document.createElement("div");
    actions.className = "slot-actions";
    const rename = document.createElement("button");
    rename.type = "button";
    rename.dataset.renameSlotFolder = folder.id;
    rename.title = `Renomear pasta ${folder.name}`;
    rename.setAttribute("aria-label", rename.title);
    rename.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 4 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15z"/></svg>';
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "slot-delete";
    remove.dataset.deleteSlotFolder = folder.id;
    remove.title = `Excluir pasta ${folder.name}`;
    remove.setAttribute("aria-label", remove.title);
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7"/></svg>';
    actions.append(rename, remove);
    card.append(actions);
  }
  return card;
}

function setSlotFolderStatus(message = "", error = false) {
  firebaseUi.slotsFolderStatus.textContent = message;
  firebaseUi.slotsFolderStatus.hidden = !message;
  firebaseUi.slotsFolderStatus.classList.toggle("is-error", error);
}

function refreshSlotFolderViews() {
  renderSlots();
  if (!firebaseUi.startupGate.hidden) renderStartupSlotChoices();
}

function openSlotFolders() {
  currentSlotFolderId = null;
  firebaseUi.newSlotFolder.value = UNFILED_SLOT_FOLDER;
  firebaseUi.slotsSearch.value = "";
  setSlotFolderStatus();
  renderSlots();
}

async function updateCloudSlotFolders(mutator) {
  const user = currentFirebaseUser;
  if (!user) throw new Error("Entre com o Google para organizar suas pastas.");
  const reference = firestoreApi.doc(firestoreDb, "users", user.uid);
  const folders = await firestoreApi.runTransaction(firestoreDb, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const stored = normalizeSlotFolders(snapshot.exists() ? snapshot.data().slotFolders : []);
    const next = normalizeSlotFolders(mutator(stored));
    transaction.set(reference, { slotFolders: next }, { merge: true });
    return next;
  });
  if (currentFirebaseUser?.uid !== user.uid) throw new Error("A conta conectada foi alterada.");
  currentSlotFolders = folders;
  return folders;
}

async function createCloudSlotFolder(proposedName) {
  const name = normalizeSlotName(proposedName, "");
  if (!name) throw new Error("Digite um nome para a pasta.");
  const folder = {
    id: window.crypto?.randomUUID?.() || `folder-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name,
    createdAt: Date.now(),
  };
  await updateCloudSlotFolders((folders) => {
    if (folders.some((entry) => entry.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      throw new Error("Já existe uma pasta com esse nome.");
    }
    return [...folders, folder];
  });
  currentSlotFolderId = folder.id;
  refreshSlotFolderViews();
  setSlotFolderStatus(`Pasta “${name}” criada.`);
  return folder;
}

async function renameCloudSlotFolder(id, proposedName) {
  const name = normalizeSlotName(proposedName, "");
  if (!name) throw new Error("Digite um nome para a pasta.");
  await updateCloudSlotFolders((folders) => {
    if (!folders.some((folder) => folder.id === id)) throw new Error("Esta pasta não está mais disponível.");
    if (folders.some((folder) => folder.id !== id && folder.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      throw new Error("Já existe uma pasta com esse nome.");
    }
    return folders.map((folder) => folder.id === id ? { ...folder, name } : folder);
  });
  refreshSlotFolderViews();
  setSlotFolderStatus("Nome da pasta atualizado.");
}

async function deleteCloudSlotFolder(id) {
  const folder = currentSlotFolders.find((entry) => entry.id === id);
  if (!folder || !currentFirebaseUser) return;
  const confirmed = await window.showAbyssConfirm({
    eyebrow: "Organizar fichas",
    title: `Excluir a pasta “${folder.name}”?`,
    message: "As fichas desta pasta irão para “Sem pasta”. Nenhum personagem será excluído.",
    confirmLabel: "Excluir pasta",
    tone: "warning",
  });
  if (!confirmed) return;
  await updateCloudSlotFolders((folders) => folders.filter((entry) => entry.id !== id));
  currentSlots.forEach((slot) => { if (slot.folderId === id) slot.folderId = ""; });
  if (currentSlotFolderId === id) currentSlotFolderId = null;
  if (startupSlotFolderId === id) startupSlotFolderId = null;
  refreshSlotFolderViews();
  setSlotFolderStatus("Pasta excluída. As fichas foram mantidas em “Sem pasta”.");
}

async function moveCloudSlot(slotId, destinationId) {
  const user = currentFirebaseUser;
  const epoch = accountRollEpoch;
  const slot = currentSlots.find((entry) => entry.id === slotId);
  if (!user || !slot) return false;
  if (destinationId !== UNFILED_SLOT_FOLDER && !normalizeSlotFolderId(destinationId)) {
    throw new Error("Escolha uma pasta disponível.");
  }
  if (getSlotFolderId(slot) === destinationId) return false;
  const moveKey = `${user.uid}:${epoch}:${slotId}`;
  if (pendingSlotMoves.has(moveKey)) return false;
  const move = {};
  pendingSlotMoves.set(moveKey, move);
  const folderId = normalizeSlotFolderId(destinationId);
  try {
    await firestoreApi.setDoc(
      firestoreApi.doc(firestoreDb, "users", user.uid, "slots", slotId),
      { folderId, updatedAt: firestoreApi.serverTimestamp() },
      { merge: true },
    );
    if (currentFirebaseUser?.uid !== user.uid || accountRollEpoch !== epoch || !currentSlots.includes(slot)) return false;
    slot.folderId = normalizeSlotFolderId(folderId);
    refreshSlotFolderViews();
    setSlotFolderStatus(`“${slot.name}” movido para “${getSlotFolderName(getSlotFolderId(slot))}”.`);
    return true;
  } finally {
    if (pendingSlotMoves.get(moveKey) === move) pendingSlotMoves.delete(moveKey);
  }
}

function beginSlotFolderRename(id) {
  cancelSlotDrag();
  const folder = currentSlotFolders.find((entry) => entry.id === id);
  const card = firebaseUi.slotsFolderList.querySelector(`[data-slot-folder-id="${CSS.escape(id)}"]`);
  if (!folder || !card) return;
  const form = document.createElement("form");
  form.className = "slot-rename-row";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 60;
  input.required = true;
  input.value = folder.name;
  input.setAttribute("aria-label", "Nome da pasta");
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Salvar";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancelar";
  form.append(input, save, cancel);
  card.removeAttribute("data-drop-slot-folder");
  card.querySelector(".slot-folder-open").replaceWith(form);
  card.querySelector(".slot-actions").hidden = true;
  input.focus();
  input.select();
  cancel.addEventListener("click", () => renderSlots());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    try { await renameCloudSlotFolder(id, input.value); }
    catch (error) { setSlotFolderStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true); }
    finally { if (save.isConnected) save.disabled = false; }
  });
}

let slotDragSession = null;
let slotDragTokenSequence = 0;
const slotDragPendingMoves = new Set();
const SLOT_DRAG_MIME = "application/x-abyss-slot";

function slotDragIsCurrent(session) {
  return Boolean(session && currentFirebaseUser?.uid === session.uid
    && accountRollEpoch === session.epoch
    && currentSlots.find((slot) => slot.id === session.slot.id) === session.slot
    && !document.querySelector("#slots-modal")?.hidden);
}

function cancelSlotDrag() {
  const session = slotDragSession;
  slotDragSession = null;
  if (!session) return;
  session.row.classList.remove("is-dragging");
  session.target?.classList.remove("is-drop-target");
  session.ghost?.remove();
  if (session.scrollFrame) window.cancelAnimationFrame(session.scrollFrame);
  document.body.classList.remove("is-slot-dragging");
  if (session.handle?.hasPointerCapture?.(session.pointerId)) {
    session.handle.releasePointerCapture(session.pointerId);
  }
  if (session.started && currentFirebaseUser?.uid === session.uid && accountRollEpoch === session.epoch) {
    setSlotFolderStatus(session.previousMessage, session.previousError);
  }
}

function createSlotDragSession(row, mode) {
  const user = currentFirebaseUser;
  const slot = currentSlots.find((entry) => entry.id === row?.dataset.slotId);
  const modal = document.querySelector("#slots-modal");
  if (!user || !slot || !modal || modal.hidden) return null;
  const moveKey = `${user.uid}:${accountRollEpoch}:${slot.id}`;
  if (slotDragPendingMoves.has(moveKey) || pendingSlotMoves.has(moveKey)) return null;
  cancelSlotDrag();
  return slotDragSession = {
    slot, row, uid: user.uid, epoch: accountRollEpoch, mode, moveKey,
    token: `${Date.now()}:${++slotDragTokenSequence}`,
    started: false, target: null, ghost: null,
    previousMessage: firebaseUi.slotsFolderStatus.textContent,
    previousError: firebaseUi.slotsFolderStatus.classList.contains("is-error"),
  };
}

function startSlotDrag(session) {
  if (!slotDragIsCurrent(session)) { cancelSlotDrag(); return false; }
  session.started = true;
  session.row.classList.add("is-dragging");
  document.body.classList.add("is-slot-dragging");
  setSlotFolderStatus(`Arraste “${session.slot.name}” até uma pasta.`);
  return true;
}

function findSlotDropTarget(element) {
  const target = element?.closest?.("[data-drop-slot-folder]");
  const dialog = document.querySelector("#slots-dialog");
  if (!target || !dialog?.contains(target)) return null;
  const folderId = target.dataset.dropSlotFolder;
  return folderId === UNFILED_SLOT_FOLDER || normalizeSlotFolderId(folderId) ? target : null;
}

function updateSlotDropTarget(session, target) {
  if (session.target === target) return;
  session.target?.classList.remove("is-drop-target");
  session.target = target;
  if (!target) {
    setSlotFolderStatus(`Arraste “${session.slot.name}” até uma pasta.`);
    return;
  }
  const destination = target.dataset.dropSlotFolder;
  const unchanged = getSlotFolderId(session.slot) === destination;
  target.classList.toggle("is-drop-target", !unchanged);
  setSlotFolderStatus(unchanged ? "A ficha já está nesta pasta."
    : `Solte para mover “${session.slot.name}” para “${getSlotFolderName(destination)}”.`);
}

async function finishSlotDrag(session, target) {
  const valid = slotDragIsCurrent(session);
  const destination = target?.dataset.dropSlotFolder;
  cancelSlotDrag();
  if (!valid || !destination || (destination !== UNFILED_SLOT_FOLDER && !normalizeSlotFolderId(destination))
    || getSlotFolderId(session.slot) === destination || slotDragPendingMoves.has(session.moveKey)
    || pendingSlotMoves.has(session.moveKey)) return;
  slotDragPendingMoves.add(session.moveKey);
  const movingMessage = `Movendo “${session.slot.name}”…`;
  setSlotFolderStatus(movingMessage);
  try {
    const moved = await moveCloudSlot(session.slot.id, destination);
    if (moved === false && slotDragIsCurrent(session) && firebaseUi.slotsFolderStatus.textContent === movingMessage) {
      setSlotFolderStatus(session.previousMessage, session.previousError);
    }
  } catch (error) {
    if (currentFirebaseUser?.uid === session.uid && accountRollEpoch === session.epoch) {
      setSlotFolderStatus(describeFirebaseError(error), true);
    }
  } finally {
    slotDragPendingMoves.delete(session.moveKey);
  }
}

function slotDragTransferIsOwn(event) {
  const session = slotDragSession;
  return Boolean(session?.mode === "native" && session.started && slotDragIsCurrent(session)
    && Array.from(event.dataTransfer?.types || []).includes(SLOT_DRAG_MIME)
    && !Array.from(event.dataTransfer?.types || []).includes("Files"));
}

function onSlotNativeDragStart(event) {
  const dialog = document.querySelector("#slots-dialog");
  const row = event.target?.closest?.(".slot-item[data-slot-id]");
  if (!row || !dialog?.contains(row)) return;
  if (event.target.closest("button, input, select, textarea, summary, details, .slot-actions")) {
    event.preventDefault();
    return;
  }
  const session = createSlotDragSession(row, "native");
  if (!session || !event.dataTransfer || !startSlotDrag(session)) { event.preventDefault(); return; }
  try {
    event.dataTransfer.setData(SLOT_DRAG_MIME, session.token);
    event.dataTransfer.effectAllowed = "move";
  } catch {
    cancelSlotDrag();
    event.preventDefault();
  }
}

function onSlotNativeDragOver(event) {
  if (!slotDragTransferIsOwn(event)) return;
  event.preventDefault();
  const session = slotDragSession;
  const target = findSlotDropTarget(event.target);
  updateSlotDropTarget(session, target);
  event.dataTransfer.dropEffect = target && getSlotFolderId(session.slot) !== target.dataset.dropSlotFolder ? "move" : "none";
  scrollSlotDropFolders(event);
}

function onSlotNativeDrop(event) {
  if (!slotDragTransferIsOwn(event)) return;
  event.preventDefault();
  const session = slotDragSession;
  if (event.dataTransfer.getData(SLOT_DRAG_MIME) !== session.token) { cancelSlotDrag(); return; }
  event.stopPropagation();
  return finishSlotDrag(session, findSlotDropTarget(event.target));
}

function onSlotPointerDown(event) {
  if (event.button !== 0 || event.isPrimary === false) return;
  const handle = event.target?.closest?.("[data-slot-drag-handle]");
  const row = handle?.closest(".slot-item[data-slot-id]");
  if (!handle || handle.disabled || !row || row.draggable === false || !document.querySelector("#slots-dialog")?.contains(row)) return;
  const session = createSlotDragSession(row, "pointer");
  if (!session) return;
  Object.assign(session, { handle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY });
  event.preventDefault();
  handle.setPointerCapture?.(event.pointerId);
}

function positionSlotDragGhost(session, event) {
  if (!session.ghost) {
    const ghost = document.createElement("div");
    ghost.className = "slot-drag-ghost";
    ghost.setAttribute("aria-hidden", "true");
    const avatar = session.row.querySelector(".slot-avatar");
    if (avatar) ghost.append(avatar.cloneNode(true));
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = session.slot.name;
    const hint = document.createElement("small");
    hint.textContent = "Arraste para uma pasta";
    copy.append(name, hint);
    ghost.append(copy);
    document.body.append(ghost);
    session.ghost = ghost;
  }
  const width = session.ghost.offsetWidth || 240;
  session.ghost.style.left = `${Math.max(8, Math.min(event.clientX + 16, window.innerWidth - width - 8))}px`;
  session.ghost.style.top = `${Math.max(8, Math.min(event.clientY + 16, window.innerHeight - 76))}px`;
}

function scrollSlotDropFolders(event) {
  const rail = document.querySelector("#slots-folder-list");
  if (!rail?.scrollBy) return false;
  const rect = rail.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return false;
  const edge = 28;
  const left = rail.scrollWidth > rail.clientWidth
    ? event.clientX < rect.left + edge ? -18 : event.clientX > rect.right - edge ? 18 : 0 : 0;
  const top = rail.scrollHeight > rail.clientHeight
    ? event.clientY < rect.top + edge ? -18 : event.clientY > rect.bottom - edge ? 18 : 0 : 0;
  if (!left && !top) return false;
  const previousLeft = rail.scrollLeft;
  const previousTop = rail.scrollTop;
  rail.scrollBy({ left, top, behavior: "auto" });
  return rail.scrollLeft !== previousLeft || rail.scrollTop !== previousTop;
}

function queueSlotFolderAutoScroll(session) {
  if (session.scrollFrame || !session.started || session.mode !== "pointer") return;
  session.scrollFrame = window.requestAnimationFrame(() => {
    session.scrollFrame = null;
    if (slotDragSession !== session) return;
    if (!slotDragIsCurrent(session)) { cancelSlotDrag(); return; }
    if (!scrollSlotDropFolders(session.scrollPoint)) return;
    const { clientX, clientY } = session.scrollPoint;
    updateSlotDropTarget(session, findSlotDropTarget(document.elementFromPoint(clientX, clientY)));
    queueSlotFolderAutoScroll(session);
  });
}

function onSlotPointerMove(event) {
  const session = slotDragSession;
  if (session?.mode !== "pointer" || session.pointerId !== event.pointerId) return;
  if (!slotDragIsCurrent(session)) { cancelSlotDrag(); return; }
  if (!session.started && Math.hypot(event.clientX - session.startX, event.clientY - session.startY) < 6) return;
  if (!session.started && !startSlotDrag(session)) return;
  event.preventDefault();
  positionSlotDragGhost(session, event);
  updateSlotDropTarget(session, findSlotDropTarget(document.elementFromPoint(event.clientX, event.clientY)));
  session.scrollPoint = { clientX: event.clientX, clientY: event.clientY };
  if (scrollSlotDropFolders(event)) {
    updateSlotDropTarget(session, findSlotDropTarget(document.elementFromPoint(event.clientX, event.clientY)));
    queueSlotFolderAutoScroll(session);
  }
}

function onSlotPointerEnd(event) {
  const session = slotDragSession;
  if (session?.mode !== "pointer" || session.pointerId !== event.pointerId) return;
  if (!session.started || event.type === "pointercancel") { cancelSlotDrag(); return; }
  event.preventDefault();
  return finishSlotDrag(session, findSlotDropTarget(document.elementFromPoint(event.clientX, event.clientY)));
}

function bindSlotDragInteractions() {
  const dialog = document.querySelector("#slots-dialog");
  const modal = document.querySelector("#slots-modal");
  if (!dialog || !modal) return;
  dialog.addEventListener("dragstart", onSlotNativeDragStart);
  dialog.addEventListener("dragover", onSlotNativeDragOver);
  dialog.addEventListener("drop", onSlotNativeDrop);
  dialog.addEventListener("dragend", cancelSlotDrag);
  dialog.addEventListener("pointerdown", onSlotPointerDown);
  document.addEventListener("pointermove", onSlotPointerMove, { passive: false });
  document.addEventListener("pointerup", onSlotPointerEnd);
  document.addEventListener("pointercancel", onSlotPointerEnd);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") cancelSlotDrag(); }, true);
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelSlotDrag(); });
  window.addEventListener("blur", cancelSlotDrag);
  new MutationObserver(() => { if (modal.hidden) cancelSlotDrag(); }).observe(modal, { attributes: true, attributeFilter: ["hidden"] });
}

function beginSlotMove(id) {
  const slot = currentSlots.find((entry) => entry.id === id);
  const row = firebaseUi.slotsList.querySelector(`[data-slot-id="${CSS.escape(id)}"]`);
  if (!slot || !row) return;
  const form = document.createElement("form");
  form.className = "slot-move-form slot-rename-row";
  const select = document.createElement("select");
  select.setAttribute("aria-label", `Pasta de ${slot.name}`);
  fillSlotFolderSelect(select, getSlotFolderId(slot));
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Mover";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancelar";
  form.append(select, save, cancel);
  row.querySelector(".slot-name-editor").append(form);
  row.querySelector(".slot-actions").hidden = true;
  select.focus();
  cancel.addEventListener("click", () => renderSlots());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    try { await moveCloudSlot(id, select.value); }
    catch (error) { setSlotFolderStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true); }
    finally { if (save.isConnected) save.disabled = false; }
  });
}

function renderSlots() {
  cancelSlotDrag();
  firebaseUi.slotsList.replaceChildren();
  firebaseUi.slotsFolderList.replaceChildren();
  const signedIn = Boolean(currentFirebaseUser);
  firebaseUi.slotsLoginNote.hidden = signedIn;
  firebaseUi.createSlotForm.hidden = !signedIn;
  firebaseUi.slotsTransferPanel.hidden = !signedIn;
  firebaseUi.createSlotFolderForm.hidden = !signedIn;
  firebaseUi.slotsFolderNav.hidden = !signedIn;
  firebaseUi.slotsWorkspace.hidden = !signedIn;

  if (!signedIn) {
    firebaseUi.slotsSearch.value = "";
    firebaseUi.slotsVisibleCount.textContent = "";
    setSlotFolderStatus();
    updateActiveSlotDisplay();
    return;
  }

  if (currentSlotFolderId !== null && currentSlotFolderId !== UNFILED_SLOT_FOLDER && !normalizeSlotFolderId(currentSlotFolderId)) {
    currentSlotFolderId = null;
  }
  firebaseUi.slotsFolderBack.hidden = true;
  firebaseUi.slotsFolderName.textContent = currentSlotFolderId === null ? "Todas as fichas" : getSlotFolderName(currentSlotFolderId);
  fillSlotFolderSelect(firebaseUi.newSlotFolder, currentSlotFolderId || firebaseUi.newSlotFolder.value);

  const all = document.createElement("article");
  all.className = "slot-folder-card is-all-folders";
  all.classList.toggle("is-selected", currentSlotFolderId === null);
  const allOpen = document.createElement("button");
  allOpen.type = "button";
  allOpen.className = "slot-folder-open";
  allOpen.dataset.openAllSlots = "";
  if (currentSlotFolderId === null) allOpen.setAttribute("aria-current", "true");
  const allCopy = document.createElement("span");
  allCopy.className = "slot-folder-copy";
  allCopy.append(
    Object.assign(document.createElement("strong"), { textContent: "Todas as fichas" }),
    Object.assign(document.createElement("small"), { textContent: `${currentSlots.length} ${currentSlots.length === 1 ? "ficha" : "fichas"}` }),
  );
  allOpen.append(createSlotFolderSymbol(), allCopy);
  all.append(allOpen);
  firebaseUi.slotsFolderList.append(all);
  getSlotFolderEntries().forEach((folder) => firebaseUi.slotsFolderList.append(createSlotFolderCard(folder)));

  const folderSlots = currentSlotFolderId === null
    ? currentSlots
    : currentSlots.filter((slot) => getSlotFolderId(slot) === currentSlotFolderId);
  const search = firebaseUi.slotsSearch.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const visibleSlots = folderSlots.filter((slot) => !search || String(slot.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(search));
  firebaseUi.slotsVisibleCount.textContent = search
    ? `${visibleSlots.length} de ${folderSlots.length} fichas`
    : `${visibleSlots.length} ${visibleSlots.length === 1 ? "ficha" : "fichas"}`;

  if (!visibleSlots.length) {
    const empty = document.createElement("p");
    empty.className = "slots-folder-empty";
    empty.textContent = search
      ? "Nenhuma ficha encontrada com esse nome."
      : currentSlotFolderId === null
        ? "Crie sua primeira ficha no campo acima."
        : "Esta pasta está vazia. Arraste uma ficha para cá ou crie uma nova nesta pasta.";
    firebaseUi.slotsList.append(empty);
  }
  visibleSlots.forEach((slot) => {
    const row = document.createElement("article");
    row.className = "slot-item";
    row.classList.toggle("is-active", slot.id === currentSlotId);
    row.dataset.slotId = slot.id;
    row.draggable = true;
    const grip = document.createElement("button");
    grip.type = "button";
    grip.className = "slot-drag-handle";
    grip.dataset.slotDragHandle = slot.id;
    grip.title = "Arraste para uma pasta";
    grip.setAttribute("aria-label", `Arrastar ficha ${slot.name} para uma pasta`);
    grip.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="6" r="1"/><circle cx="16" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="18" r="1"/><circle cx="16" cy="18" r="1"/></svg>';
    const marker = createSlotAvatar(slot, "slot-avatar");
    const portrait = marker.querySelector("img");
    if (portrait) portrait.draggable = false;
    const copy = document.createElement("div");
    copy.className = "slot-name-editor";
    const name = Object.assign(document.createElement("strong"), { textContent: slot.name });
    name.title = slot.name;
    const detail = Object.assign(document.createElement("small"), {
      textContent: `${getSlotFolderName(getSlotFolderId(slot))}${slot.id === currentSlotId ? " · Em uso" : ""}`,
    });
    copy.append(name, detail);

    const actions = document.createElement("div");
    actions.className = "slot-actions";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "slot-open-button";
    open.dataset.openSlot = slot.id;
    open.textContent = slot.id === currentSlotId ? "Em uso" : "Abrir";
    open.disabled = slot.id === currentSlotId;
    actions.append(open);

    const more = document.createElement("details");
    more.className = "slot-more-actions";
    const summary = document.createElement("summary");
    summary.title = "Mais opções";
    summary.setAttribute("aria-label", `Mais opções para ${slot.name}`);
    summary.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
    const menu = document.createElement("div");
    menu.className = "slot-more-menu";
    const exportSlot = document.createElement("button");
    exportSlot.type = "button";
    exportSlot.dataset.exportSlot = slot.id;
    exportSlot.textContent = "Exportar";
    const rename = document.createElement("button");
    rename.type = "button";
    rename.dataset.renameSlot = slot.id;
    rename.textContent = "Renomear";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "slot-delete";
    remove.dataset.deleteSlot = slot.id;
    remove.textContent = "Excluir";
    const moveLabel = document.createElement("label");
    moveLabel.className = "slot-quick-move";
    const moveText = document.createElement("span");
    moveText.textContent = "Mover para";
    const destination = document.createElement("select");
    destination.dataset.quickMoveSlot = slot.id;
    destination.setAttribute("aria-label", `Mover ${slot.name} para uma pasta`);
    fillSlotFolderSelect(destination, getSlotFolderId(slot));
    moveLabel.append(moveText, destination);
    menu.append(exportSlot, rename, remove, moveLabel);
    more.append(summary, menu);
    actions.append(more);
    row.append(grip, marker, copy, actions);
    firebaseUi.slotsList.append(row);
  });

  updateActiveSlotDisplay();
}

async function loadSlotDirectory(user) {
  const epoch = accountRollEpoch;
  const sameAccount = () => currentFirebaseUser?.uid === user.uid && accountRollEpoch === epoch;
  const [userSnapshot, slotsSnapshot] = await Promise.all([
    firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "users", user.uid)),
    firestoreApi.getDocs(firestoreApi.collection(firestoreDb, "users", user.uid, "slots")),
  ]);

  const slots = slotsSnapshot.docs
    .map((snapshot) => {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        name: characterSlotName(data.name),
        folderId: normalizeSlotFolderId(data.folderId),
        portrait: String(data.portrait || ""),
        createdAt: slotTimestampValue(data.createdAt),
        updatedAt: slotTimestampValue(data.updatedAt),
      };
    })
    .sort(
      (a, b) =>
        (a.createdAt || a.updatedAt) - (b.createdAt || b.updatedAt) ||
        a.name.localeCompare(b.name, "pt-BR"),
    );

  const nameRepairs = [];
  await Promise.all(slots.map(async (slot) => {
    try {
      const profileSnapshot = await firestoreApi.getDoc(
        firestoreApi.doc(firestoreDb, "users", user.uid, "slots", slot.id, "data", "profile"),
      );
      if (profileSnapshot.exists()) {
        const profile = profileSnapshot.data();
        slot.portrait = String(profile.portrait || "");
        const name = characterSlotName(profile.name, slot.name);
        if (name !== slot.name) {
          slot.name = name;
          nameRepairs.push({ reference: firestoreApi.doc(firestoreDb, "users", user.uid, "slots", slot.id), name });
        }
        if (!String(profile.name || "").trim()) {
          nameRepairs.push({ reference: firestoreApi.doc(firestoreDb, "users", user.uid, "slots", slot.id, "data", "profile"), name });
        }
      }
    } catch {
      slot.portrait = slot.portrait || "";
    }
  }));

  if (!sameAccount()) return { activeSlotId: "", stale: true };
  for (let offset = 0; offset < nameRepairs.length; offset += 400) {
    const batch = firestoreApi.writeBatch(firestoreDb);
    nameRepairs.slice(offset, offset + 400).forEach((repair) => batch.set(repair.reference,
      { name: repair.name, updatedAt: firestoreApi.serverTimestamp() }, { merge: true }));
    await batch.commit();
    if (!sameAccount()) return { activeSlotId: "", stale: true };
  }
  currentSlots = slots;
  currentSlotFolders = normalizeSlotFolders(userSnapshot.exists() ? userSnapshot.data().slotFolders : []);
  currentSlotFolderId = null;
  startupSlotFolderId = null;

  return {
    activeSlotId: userSnapshot.exists()
      ? String(userSnapshot.data().activeSlotId || "")
      : "",
  };
}

async function createCloudSlot(name, { announce = true, folderId = "" } = {}) {
  if (!currentFirebaseUser) throw new Error("Entre com o Google para criar um Slot.");
  const user = currentFirebaseUser;
  const epoch = accountRollEpoch;
  const sameAccount = () => currentFirebaseUser?.uid === user.uid && accountRollEpoch === epoch;

  const previousSlotId = currentSlotId;
  const previousState = sheetBridge.captureState();
  const slotRef = firestoreApi.doc(
    firestoreApi.collection(firestoreDb, "users", user.uid, "slots"),
  );
  const slot = {
    id: slotRef.id,
    name: characterSlotName(name, `Personagem ${currentSlots.length + 1}`),
    folderId: normalizeSlotFolderId(folderId),
    portrait: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  currentSlots.push(slot);
  currentSlotId = slot.id;
  isHydratingCloudState = true;

  try {
    const clean = sheetBridge.createCleanState();
    clean.profile.name = slot.name;
    sheetBridge.applyState(clean, { persistLocal: false });
    await writeCloudSheet(user, slot.id, clean, {
      slotName: slot.name,
      created: true,
      folderId: slot.folderId,
    });
    if (!sameAccount()) throw new Error("A conta mudou durante a criação da ficha.");
    lastSavedRevision = stateRevision;
    renderSlots();

    if (announce) {
      setSyncStatus(
        "saved",
        "Salvo na conta",
        "Novo Slot criado",
        `“${slot.name}” está pronto e vazio.`,
      );
    }
    return slot;
  } catch (error) {
    if (sameAccount()) {
      currentSlots = currentSlots.filter((item) => item.id !== slot.id);
      currentSlotId = previousSlotId;
      sheetBridge.applyState(previousState, { persistLocal: false });
      renderSlots();
    }
    throw error;
  } finally {
    if (sameAccount()) isHydratingCloudState = false;
  }
}

async function hydrateSlot(user, slotId, { announce = true } = {}) {
  if (!slotId || !currentSlots.some((slot) => slot.id === slotId)) return;

  const sequence = ++authChangeSequence;
  isHydratingCloudState = true;
  setSyncStatus(
    "saving",
    "Carregando Slot…",
    "Abrindo ficha",
    "Buscando somente os dados deste Slot.",
  );

  try {
    const state = await readCloudSheet(user, slotId);
    if (sequence !== authChangeSequence || currentFirebaseUser?.uid !== user.uid) return;

    currentSlotId = slotId;
    const slot = currentSlots.find((entry) => entry.id === slotId);
    if (!String(state.profile?.name || "").trim()) state.profile.name = characterSlotName(slot?.name);
    sheetBridge.applyState(state, { persistLocal: false });
    syncCharacterSlotName(user.uid, slotId, state.profile.name);
    await firestoreApi.setDoc(
      firestoreApi.doc(firestoreDb, "users", user.uid),
      {
        activeSlotId: slotId,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        lastActiveAt: firestoreApi.serverTimestamp(),
      },
      { merge: true },
    );

    if (sequence !== authChangeSequence || currentFirebaseUser?.uid !== user.uid) return;

    lastSavedRevision = stateRevision;
    renderSlots();

    if (announce) {
      const slotName =
        currentSlots.find((item) => item.id === slotId)?.name || "Personagem";
      setSyncStatus("saved", "Salvo na conta", "Slot carregado", `“${slotName}” está ativo.`);
    }
  } finally {
    if (sequence === authChangeSequence) isHydratingCloudState = false;
  }
}

async function initializeUserSlots(user) {
  const directory = await loadSlotDirectory(user);
  if (directory.stale || currentFirebaseUser?.uid !== user.uid) return;

  if (!currentSlots.length) {
    const slot = await createCloudSlot("Personagem 1", { announce: false });
    preferredStartupSlotId = slot.id;
    currentSlotId = null;
    sheetBridge.resetState();
    renderSlots();
    return;
  }

  preferredStartupSlotId = currentSlots.some((slot) => slot.id === directory.activeSlotId)
    ? directory.activeSlotId
    : currentSlots[0].id;
  currentSlotId = null;
  renderSlots();
}

async function switchCloudSlot(slotId) {
  if (!currentFirebaseUser || slotId === currentSlotId) return;

  if (cloudSavePromise && !(await cloudSavePromise)) return;
  if (stateRevision > lastSavedRevision && !(await flushCloudSave())) return;
  await hydrateSlot(currentFirebaseUser, slotId);
}

async function renameCloudSlot(slotId, proposedName) {
  if (!currentFirebaseUser) return;

  const user = currentFirebaseUser;
  const epoch = accountRollEpoch;
  const slot = currentSlots.find((item) => item.id === slotId);
  if (!slot) return;

  const name = characterSlotName(proposedName, slot.name);
  const editsOpenSheet = campaignSheetSession
    ? campaignSheetSession.ownerUid === user.uid && campaignSheetSession.slotId === slotId && campaignSheetSession.canEdit
    : slotId === currentSlotId;
  if (editsOpenSheet) {
    const input = document.querySelector("#character-name");
    input.value = name;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (!(await flushCloudSave())) throw new Error("O novo nome ainda não pôde ser salvo. Tente sincronizar novamente.");
  } else {
    const refs = getCloudDocumentRefs(user.uid, slotId);
    const campaignRefs = await getCampaignSlotNameRefs(user.uid, slotId);
    if (currentFirebaseUser?.uid !== user.uid || accountRollEpoch !== epoch) return;
    const batch = firestoreApi.writeBatch(firestoreDb);
    const timestamp = firestoreApi.serverTimestamp();
    batch.set(refs.slot, { name, updatedAt: timestamp }, { merge: true });
    batch.set(refs.profile, { name, updatedAt: timestamp }, { merge: true });
    campaignRefs.forEach((reference) => batch.set(reference,
      { slotName: name, characterName: name, updatedAt: timestamp }, { merge: true }));
    await batch.commit();
  }
  if (currentFirebaseUser?.uid !== user.uid || accountRollEpoch !== epoch) return;
  syncCharacterSlotName(user.uid, slotId, editsOpenSheet ? sheetBridge.captureState().profile?.name : name);
  slot.updatedAt = Date.now();
  renderSlots();

  if (slotId === currentSlotId) {
    setSyncStatus("saved", "Salvo na conta", "Slot renomeado", `A ficha agora se chama “${name}”.`);
  }
}

function beginSlotRename(slotId) {
  cancelSlotDrag();
  const slot = currentSlots.find((item) => item.id === slotId);
  const row = firebaseUi.slotsList.querySelector(
    `[data-slot-id="${CSS.escape(slotId)}"]`,
  );
  if (!slot || !row) return;

  row.draggable = false;
  const grip = row.querySelector("[data-slot-drag-handle]");
  if (grip) grip.disabled = true;
  const copy = row.querySelector(".slot-name-editor");
  const actions = row.querySelector(".slot-actions");
  const form = document.createElement("form");
  form.className = "slot-rename-row";

  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 120;
  input.value = slot.name;
  input.setAttribute("aria-label", "Novo nome do personagem e do Slot");

  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Salvar";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancelar";

  form.append(input, save, cancel);
  copy.replaceChildren(form);
  actions.hidden = true;
  input.focus();
  input.select();

  cancel.addEventListener("click", renderSlots);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    try {
      await renameCloudSlot(slotId, input.value);
    } catch (error) {
      setSyncStatus(
        "error",
        "Erro no Slot",
        "Não foi possível renomear",
        describeFirebaseError(error),
      );
      renderSlots();
    }
  });
}

async function deleteKnownSlotDocuments(user, slotId) {
  const refs = getCloudDocumentRefs(user.uid, slotId);
  const batch = firestoreApi.writeBatch(firestoreDb);
  batch.delete(refs.profile);
  batch.delete(refs.sheet);
  batch.delete(refs.customSkills);
  batch.delete(refs.abilities);
  batch.delete(refs.slot);
  await batch.commit();
}

async function deleteCloudSlot(slotId) {
  if (!currentFirebaseUser) return;

  const slot = currentSlots.find((item) => item.id === slotId);
  if (!slot) return;
  const confirmed = await window.showAbyssConfirm({
    eyebrow: "Slots de Ficha",
    title: "Excluir Slot?",
    message: `“${slot.name}” e todos os dados dessa ficha serão excluídos definitivamente. Esta ação não pode ser desfeita.`,
    confirmLabel: "Excluir Slot",
    tone: "danger",
  });
  if (!confirmed) return;

  if (slotId === currentSlotId) {
    window.clearTimeout(cloudSaveTimer);
    if (cloudSavePromise) await cloudSavePromise;
    lastSavedRevision = stateRevision;
  }

  const state =
    slotId === currentSlotId
      ? sheetBridge.captureState()
      : await readCloudSheet(currentFirebaseUser, slotId);
  const mediaReferences = (state.abilities || [])
    .filter((ability) => ability.mediaOwner === "slot" && ability.mediaRefId)
    .map((ability) => ({
      scope: "sheet",
      refId: ability.mediaRefId,
      uid: currentFirebaseUser.uid,
      slotId,
    }));

  await deleteKnownSlotDocuments(currentFirebaseUser, slotId);
  await Promise.allSettled(mediaReferences.map((reference) => deleteMedia(reference)));
  currentSlots = currentSlots.filter((item) => item.id !== slotId);

  if (!currentSlots.length) {
    currentSlotId = null;
    sheetBridge.resetState();
    await createCloudSlot("Personagem 1", { announce: true });
  } else if (slotId === currentSlotId) {
    await hydrateSlot(currentFirebaseUser, currentSlots[0].id);
  } else {
    renderSlots();
  }
}

async function resetCurrentSlot() {
  if (!currentFirebaseUser || !currentSlotId) return;

  window.clearTimeout(cloudSaveTimer);
  if (cloudSavePromise) await cloudSavePromise;

  const slot = currentSlots.find((item) => item.id === currentSlotId);
  const currentState = sheetBridge.captureState();
  const mediaReferences = (currentState.abilities || [])
    .filter((ability) => ability.mediaOwner === "slot" && ability.mediaRefId)
    .map((ability) => ({
      scope: "sheet",
      refId: ability.mediaRefId,
      uid: currentFirebaseUser.uid,
      slotId: currentSlotId,
    }));

  isHydratingCloudState = true;
  try {
    const clean = sheetBridge.createCleanState();
    clean.profile.name = characterSlotName(currentState.profile?.name, slot?.name || "Personagem");
    sheetBridge.applyState(clean, { persistLocal: false });
    stateRevision += 1;
    await writeCloudSheet(currentFirebaseUser, currentSlotId, clean, {
      slotName: slot?.name,
    });
    lastSavedRevision = stateRevision;
    setSyncStatus(
      "saved",
      "Ficha limpa",
      "Slot resetado",
      `“${slot?.name || "Personagem"}” voltou ao estado inicial.`,
    );
    closeAccountMenu();
    await Promise.allSettled(mediaReferences.map((reference) => deleteMedia(reference)));
  } catch (error) {
    sheetBridge.applyState(currentState, { persistLocal: false });
    throw error;
  } finally {
    isHydratingCloudState = false;
  }
}

async function requestResetConfirmation() {
  const slot = currentSlots.find((item) => item.id === currentSlotId);
  const confirmed = await window.showAbyssConfirm({
    eyebrow: "Ficha do personagem",
    title: "Resetar esta ficha?",
    message: `Todos os dados de “${slot?.name || "Personagem"}” voltarão ao estado inicial. Esta ação não pode ser desfeita.`,
    confirmLabel: "Resetar ficha",
    tone: "danger",
    trigger: firebaseUi.reset,
  });
  if (!confirmed) return;

  firebaseUi.reset.textContent = "Resetando…";
  firebaseUi.reset.disabled = true;
  try {
    await resetCurrentSlot();
  } catch (error) {
    setSyncStatus("error", "Erro ao resetar", "Reset incompleto", describeFirebaseError(error));
    openAccountMenu();
  } finally {
    firebaseUi.reset.disabled = false;
    firebaseUi.reset.textContent = "Resetar ficha";
  }
}

async function uploadAbilityMedia({ scope, abilityId, file, ownerUid = "", slotId = "" }) {
  if (!currentFirebaseUser || !firestoreDb || !firestoreApi) {
    throw new Error("Entre com o Google antes de enviar um arquivo.");
  }
  if (
    !ALLOWED_ABILITY_MEDIA_TYPES.has(file?.type) ||
    file.size > MAX_ABILITY_MEDIA_BYTES
  ) {
    throw new Error("Escolha uma imagem ou GIF de até 8 MB.");
  }
  const targetSlotId = slotId || campaignSheetSession?.slotId || currentSlotId;
  const targetOwnerUid = ownerUid || campaignSheetSession?.ownerUid || currentFirebaseUser.uid;
  if (scope !== "minerva" && !targetSlotId) {
    throw new Error("Nenhum Slot está ativo.");
  }
  if (scope !== "minerva" && campaignSheetSession && !campaignSheetSession.canEdit) {
    throw new Error("Esta ficha está aberta somente para visualização.");
  }
  if (scope === "minerva" && !isMinervaAdmin()) {
    throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
  }
  if (!navigator.onLine) {
    throw new Error("Você está sem conexão. Reconecte-se antes de enviar a imagem.");
  }

  const dataUrl = await withCloudTimeout(
    readFileAsDataUrl(file),
    15000,
    "O navegador demorou demais para ler a imagem. Escolha o arquivo novamente.",
  );
  const expectedPrefix = `data:${file.type};base64,`;
  if (!dataUrl.startsWith(expectedPrefix)) {
    throw new Error("O formato desse arquivo não pôde ser reconhecido.");
  }

  const payload = dataUrl.slice(expectedPrefix.length);
  const chunks = [];
  for (let index = 0; index < payload.length; index += FIRESTORE_MEDIA_CHUNK_SIZE) {
    chunks.push(payload.slice(index, index + FIRESTORE_MEDIA_CHUNK_SIZE));
  }

  const mediaScope = scope === "minerva" ? "minerva" : "sheet";
  const refId = normalizeMediaRefId(
    `${String(abilityId).slice(0, 80)}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  );
  const reference = {
    scope: mediaScope,
    refId,
    uid: targetOwnerUid,
    slotId: mediaScope === "sheet" ? targetSlotId : "",
  };
  const refs = getFirestoreMediaRefs(reference);
  const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const newChunkOperations = chunks.map((data, index) => ({
    type: "set",
    ref: refs.chunk(version, index),
    data: { data },
  }));

  try {
    await commitFirestoreOperations(newChunkOperations);
    await withCloudTimeout(
      firestoreApi.setDoc(refs.metadata, {
        contentType: file.type,
        fileName: String(file.name || "imagem").slice(0, 180),
        byteSize: file.size,
        chunkCount: chunks.length,
        version,
        updatedAt: firestoreApi.serverTimestamp(),
      }),
      25000,
      "O envio da imagem demorou demais. Verifique sua conexão e tente novamente.",
    );
  } catch (error) {
    await withCloudTimeout(
      commitFirestoreOperations(
        newChunkOperations.map((operation) => ({
          type: "delete",
          ref: operation.ref,
        })),
      ),
      12000,
      "",
    ).catch(() => {});
    throw error;
  }

  return { ...reference, url: dataUrl };
}

async function deleteMedia(reference) {
  if (!reference || typeof reference !== "object" || !firestoreDb || !firestoreApi) {
    return;
  }

  const refs = getFirestoreMediaRefs(reference);
  const metadataSnapshot = await withCloudTimeout(
    firestoreApi.getDoc(refs.metadata),
    20000,
    "A mídia demorou demais para responder.",
  );
  if (!metadataSnapshot.exists()) return;

  const metadata = metadataSnapshot.data();
  const version = String(metadata.version || "");
  const chunkCount = Math.min(
    32,
    Math.max(0, Number.parseInt(metadata.chunkCount, 10) || 0),
  );
  const operations = version
    ? Array.from({ length: chunkCount }, (_, index) => ({
        type: "delete",
        ref: refs.chunk(version, index),
      }))
    : [];
  operations.push({ type: "delete", ref: refs.metadata });
  await commitFirestoreOperations(operations);
}

async function loadGrimoire() {
  if (!currentFirebaseUser) return { abilities: [], items: [] };
  const snapshot = await withCloudTimeout(
    firestoreApi.getDocs(
      firestoreApi.collection(firestoreDb, "minervaAbilities"),
    ),
    20000,
    "O Grimório demorou demais para responder. Verifique sua conexão e tente novamente.",
  );
  const entries = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  const rawAbilities = entries.filter((entry) => entry.kind !== "item");
  const items = entries.filter((entry) => entry.kind === "item");
  const abilities = await hydrateAbilityMedia(rawAbilities, {
    uid: currentFirebaseUser.uid,
    slotId: "",
  });
  return { abilities, items };
}

async function saveMinervaAbility(ability) {
  if (!isMinervaAdmin()) {
    throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
  }

  const serialized = sheetBridge.serializeAbility(ability);
  if (!serialized) throw new Error("A Habilidade não possui dados válidos.");
  const { id, ...fields } = serialized;

  await withCloudTimeout(
    firestoreApi.setDoc(
      firestoreApi.doc(firestoreDb, "minervaAbilities", id),
      {
        ...fields,
        kind: "ability",
        updatedBy: currentFirebaseUser.email || "",
        updatedAt: firestoreApi.serverTimestamp(),
      },
    ),
    20000,
    "O Grimório demorou demais para salvar. Verifique sua conexão e tente novamente.",
  );
}

async function saveMinervaItem(item) {
  if (!isMinervaAdmin()) {
    throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
  }
  const serialized = sheetBridge.serializeItem(item);
  if (!serialized) throw new Error("O Item não possui dados válidos.");
  const { id, ...fields } = serialized;
  await withCloudTimeout(
    firestoreApi.setDoc(
      firestoreApi.doc(firestoreDb, "minervaAbilities", id),
      {
        ...fields,
        kind: "item",
        shopListed: true,
        updatedBy: currentFirebaseUser.email || "",
        updatedAt: firestoreApi.serverTimestamp(),
      },
    ),
    20000,
    "A Loja demorou demais para salvar. Verifique sua conexão e tente novamente.",
  );
}

async function deleteMinervaAbility(ability) {
  if (!isMinervaAdmin()) {
    throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
  }

  await withCloudTimeout(
    firestoreApi.deleteDoc(
      firestoreApi.doc(firestoreDb, "minervaAbilities", ability.id),
    ),
    20000,
    "O Grimório demorou demais para excluir esta Habilidade.",
  );
  if (ability.mediaOwner === "minerva" && ability.mediaRefId) {
    await deleteMedia({ scope: "minerva", refId: ability.mediaRefId }).catch(() => {});
  }
}

async function deleteMinervaItem(item) {
  if (!isMinervaAdmin()) {
    throw new Error("Esta conta não possui acesso ao Grimório de Minerva.");
  }
  await withCloudTimeout(
    firestoreApi.deleteDoc(
      firestoreApi.doc(firestoreDb, "minervaAbilities", item.id),
    ),
    20000,
    "A Loja demorou demais para excluir este Item.",
  );
}

// Perfil, preferências de áudio e histórico de rolagens da conta.
const ROLL_SOUND_CHUNK_SIZE = 266664;
const MAX_ROLL_SOUND_BYTES = 20000000;
const MAX_ROLL_SOUND_CHUNKS = 101;
const ROLL_AUDIO_TYPES = new Set(["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4", "video/mp4"]);
const ROLL_SOUND_KEYS = ["extreme", "failure", "criticalFailure", "criticalDamage"];
const rollAccountUi = {
  settingsButton: document.querySelector("#account-settings-button"),
  settingsModal: document.querySelector("#account-settings-modal"),
  settingsDialog: document.querySelector("#account-settings-dialog"),
  settingsForm: document.querySelector("#account-settings-form"),
  nickname: document.querySelector("#account-settings-nickname"),
  avatarUrl: document.querySelector("#account-settings-avatar-url"),
  avatarFile: document.querySelector("#account-settings-avatar-file"),
  avatarPreview: document.querySelector("#account-settings-avatar-preview"),
  ownVolume: document.querySelector("#settings-own-volume"),
  ownVolumeValue: document.querySelector("#settings-own-volume-value"),
  othersEnabled: document.querySelector("#settings-others-enabled"),
  othersVolume: document.querySelector("#settings-others-volume"),
  othersVolumeValue: document.querySelector("#settings-others-volume-value"),
  playerVolumes: document.querySelector("#settings-player-volumes"),
  settingsStatus: document.querySelector("#settings-status"),
  save: document.querySelector("#account-settings-save"),
  historyButton: document.querySelector("#open-roll-history"),
  historyModal: document.querySelector("#roll-history-modal"),
  historyDialog: document.querySelector("#roll-history-dialog"),
  historyScope: document.querySelector("#roll-history-scope"),
  hidden: document.querySelector("#roll-history-hidden"),
  historyStatus: document.querySelector("#roll-history-status"),
  historyList: document.querySelector("#roll-history-list"),
};

function clampRollVolume(value, fallback = .7) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

function normalizeAccountAvatar(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (source.length <= 90000 && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(source)) return source;
  if (source.length > 2048) return "";
  try {
    const url = new URL(source);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function normalizeRollSoundRef(raw) {
  if (!raw || typeof raw !== "object") return null;
  const uid = String(raw.uid || "");
  const id = String(raw.id || "");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  if (raw.kind === "youtube" && raw.mimeType === "video/youtube") {
    const clip = normalizeYoutubeRollClip(raw);
    return clip ? { uid, id, ...clip } : null;
  }
  if (raw.kind === "video" && raw.mimeType === "video/mp4") {
    const clip = normalizeVideoRollClip(raw);
    return clip ? { uid, id, ...clip } : null;
  }
  if (raw.mimeType === "video/mp4" || !ROLL_AUDIO_TYPES.has(raw.mimeType)) return null;
  return { uid, id, name: String(raw.name || "Áudio").slice(0, 120), mimeType: raw.mimeType };
}

function normalizeAccountSettings(raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) raw = {};
  const playerVolumes = {};
  Object.entries(raw.playerVolumes || {}).slice(0, 300).forEach(([uid, volume]) => {
    if (/^[A-Za-z0-9_-]{1,128}$/.test(uid)) playerVolumes[uid] = clampRollVolume(volume, 1);
  });
  return {
    nickname: String(raw.nickname || "").trim().replace(/\s+/g, " ").slice(0, 40),
    soundScope: raw.soundScope === "slot" ? "slot" : "legacy",
    avatar: normalizeAccountAvatar(raw.avatar),
    sounds: Object.fromEntries(ROLL_SOUND_KEYS.map((key) => [key, normalizeRollSoundRef(raw.sounds?.[key])])),
    ownVolume: clampRollVolume(raw.ownVolume ?? .7),
    othersEnabled: raw.othersEnabled === true,
    othersVolume: clampRollVolume(raw.othersVolume ?? .7),
    playerVolumes,
    hideRolls: raw.hideRolls === true,
  };
}

// Sounds belong to the loaded sheet; identity and listening preferences belong to the account.
let settingsSoundContext = null;
let slotSoundLoadEpoch = 0;
let legacySoundMigrationSlotId = "";
let legacySoundMigrationPromise = null;
let legacySoundMigrationTimer = null;


function normalizeSlotRollSounds(raw) {
  return Object.fromEntries(ROLL_SOUND_KEYS.map((key) => {
    const ref = normalizeRollSoundRef(raw?.[key]);
    return [key, ref?.kind === "youtube" ? null : ref];
  }));
}

function getActiveSlotRollSounds() {
  return normalizeSlotRollSounds(sheetBridge?.getRollSounds?.() || {});
}

function getSettingsSoundContext() {
  const userUid = currentFirebaseUser?.uid || "";
  const ownerUid = campaignSheetSession?.ownerUid || userUid;
  const slotId = campaignSheetSession?.slotId || currentSlotId || "";
  return {
    userUid, ownerUid, slotId,
    sessionToken: campaignSheetSession?.token || "",
    accountEpoch: accountRollEpoch,
    loadEpoch: slotSoundLoadEpoch,
    canEdit: Boolean(userUid && slotId && ownerUid === userUid
      && (!campaignSheetSession || campaignSheetSession.canEdit)
      && !isHydratingCloudState),
  };
}

function isSettingsSoundContextCurrent(context) {
  if (!context) return false;
  const current = getSettingsSoundContext();
  return context.userUid === current.userUid && context.ownerUid === current.ownerUid
    && context.slotId === current.slotId && context.sessionToken === current.sessionToken
    && context.accountEpoch === current.accountEpoch && context.loadEpoch === current.loadEpoch;
}

function canEditSettingsSlotSounds() {
  return Boolean(accountSettingsDraft && settingsSoundContext?.canEdit
    && isSettingsSoundContextCurrent(settingsSoundContext) && getSettingsSoundContext().canEdit);
}

function cancelStaleSlotSoundSettings() {
  closeAudioClipEditor({ restoreSettings: false });
  stopMp4RollPlayback();
  rollAccountUi.settingsModal.hidden = true;
  accountSettingsDraft = null;
  stagedRollSounds = {};
  settingsSoundContext = null;
  settingsBusy = false;
  rollAccountUi.hidden.disabled = !currentFirebaseUser || rollPrivacySaving;
  pendingSettingsMedia.clear();
  rollAccountUi.save.textContent = "Salvar configurações";
  updateSettingsFormAvailability();
  syncModalLock();
}

function scheduleLegacySlotSoundMigration() {
  window.clearTimeout(legacySoundMigrationTimer);
  const context = getSettingsSoundContext();
  if (!context.userUid || !context.slotId || context.ownerUid !== context.userUid
    || currentAccountSettings.soundScope === "slot") return;
  legacySoundMigrationTimer = window.setTimeout(() => {
    legacySoundMigrationTimer = null;
    if (!isSettingsSoundContextCurrent(context)) return;
    if (isHydratingCloudState || settingsBusy) { scheduleLegacySlotSoundMigration(); return; }
    migrateLegacySlotSounds().catch((error) => {
      if (isSettingsSoundContextCurrent(context)) setRollFeatureStatus(rollAccountUi.settingsStatus,
        `Seus sons anteriores ainda precisam ser sincronizados. ${audioAdditionErrorMessage(error)}`, true);
    });
  }, 150);
}

async function migrateLegacySlotSounds() {
  const context = getSettingsSoundContext();
  const user = currentFirebaseUser;
  if (!context.canEdit || !user || currentAccountSettings.soundScope === "slot") return false;
  if (legacySoundMigrationPromise) return legacySoundMigrationPromise;
  if (legacySoundMigrationSlotId && legacySoundMigrationSlotId !== context.slotId) return false;
  if (sheetBridge?.hasSlotRollSounds?.() && !legacySoundMigrationSlotId) return false;
  const sounds = normalizeSlotRollSounds(currentAccountSettings.sounds);
  if (!ROLL_SOUND_KEYS.some((key) => sounds[key])) return false;
  legacySoundMigrationSlotId = context.slotId;
  const operation = (async () => {
    if (!sheetBridge.hasSlotRollSounds()) {
      if (!isSettingsSoundContextCurrent(context) || !sheetBridge.setRollSounds(sounds)) return false;
    }
    // A previous upload may have prepared local references while the sheet write failed.
    if (!(await flushCloudSave()) || !isSettingsSoundContextCurrent(context)) return false;
    if (!isSettingsSoundContextCurrent(context)) return false;
    await firestoreApi.setDoc(firestoreApi.doc(firestoreDb, "users", user.uid),
      { appSettings: { soundScope: "slot" } }, { merge: true });
    if (!isSettingsSoundContextCurrent(context)) return false;
    currentAccountSettings.soundScope = "slot";
    return true;
  })();
  legacySoundMigrationPromise = operation;
  try { return await operation; }
  finally { if (legacySoundMigrationPromise === operation) legacySoundMigrationPromise = null; }
}

function handleSlotSoundsLoaded() {
  slotSoundLoadEpoch += 1;
  stopMp4RollPlayback();
  if (accountSettingsDraft || audioClipSession) cancelStaleSlotSoundSettings();
  scheduleLegacySlotSoundMigration();
}

let currentAccountSettings = normalizeAccountSettings();
let accountSettingsDraft = null;
let stagedRollSounds = {};
let settingsBusy = false;
let rollPrivacySaving = false;
const pendingSettingsMedia = new Set();
const settingsSoundReadVersions = {};
let settingsAvatarReadVersion = 0;
let accountRollEpoch = 0;
let accountSettingsUnsubscribe = null;
let personalHistoryUnsubscribe = null;
let campaignIndexUnsubscribe = null;
let personalRollHistory = [];
let rollHistoryLimit = 200;
let historyLastError = "";
const rollCampaignSubscriptions = new Map();
const rollAudioCache = new Map();
const rollDecodedAudioCache = new Map();
const pendingOutcomeAudio = [];
const playedCampaignRolls = new Set();
const activeOutcomeAudio = new Set();
let outcomeAudioContext = null;

function getEffectiveIdentity(user = currentFirebaseUser) {
  const overrides = user?.uid && user.uid === currentFirebaseUser?.uid ? currentAccountSettings : null;
  return {
    displayName: overrides?.nickname || user?.displayName || user?.email || "Conta Google",
    photoURL: overrides?.avatar || normalizeAccountAvatar(user?.photoURL || ""),
  };
}

function rollFeatureError(error) {
  if (String(error?.code || "").includes("permission-denied")) {
    return "Não foi possível acessar o histórico ou os áudios. Tente novamente mais tarde.";
  }
  return userFacingErrorMessage(error) || "Não foi possível sincronizar. Verifique sua conexão e tente novamente.";
}

function setRollFeatureStatus(element, message = "", error = false) {
  element.textContent = message;
  element.classList.toggle("is-error", error);
}

function resetAccountRollSession() {
  cancelSlotDrag();
  accountRollEpoch += 1;
  window.clearTimeout(legacySoundMigrationTimer);
  legacySoundMigrationTimer = null;
  legacySoundMigrationSlotId = "";
  legacySoundMigrationPromise = null;
  settingsSoundContext = null;
  slotSoundLoadEpoch += 1;
  closeAudioClipEditor({ restoreSettings: false });
  stopMp4RollPlayback();
  startupCreateBusy = false;
  firebaseUi.startupCreateForm.hidden = true;
  firebaseUi.startupCreateButton.hidden = true;
  firebaseUi.startupCreateButton.setAttribute("aria-expanded", "false");
  setStartupCreateAvailability(false);
  accountSettingsUnsubscribe?.();
  personalHistoryUnsubscribe?.();
  campaignIndexUnsubscribe?.();
  accountSettingsUnsubscribe = personalHistoryUnsubscribe = campaignIndexUnsubscribe = null;
  rollCampaignSubscriptions.forEach(stopRollCampaignSubscription);
  rollCampaignSubscriptions.clear();
  activeOutcomeAudio.forEach((audio) => audio.pause());
  activeOutcomeAudio.clear();
  playedCampaignRolls.clear();
  rollAudioCache.clear();
  rollDecodedAudioCache.clear();
  pendingOutcomeAudio.length = 0;
  hideOutcomeAudioNotice();
  currentAccountSettings = normalizeAccountSettings();
  accountSettingsDraft = null;
  stagedRollSounds = {};
  campaignRecords = [];
  activeCampaign = null;
  activeCampaignMembers = [];
  activeCampaignSheets = [];
  stopCampaignShieldRealtime();
  clearCampaignSheetSession();
  closeAllCampaignModals();
  pendingSettingsMedia.clear();
  settingsBusy = false;
  rollPrivacySaving = false;
  rollAccountUi.save.textContent = "Salvar configurações";
  personalRollHistory = [];
  historyLastError = "";
  rollHistoryLimit = 200;
  rollAccountUi.settingsModal.hidden = true;
  rollAccountUi.historyModal.hidden = true;
  updateRollHistoryScopes();
  renderRollHistory();
}

async function initializeAccountRollSession(user) {
  const epoch = accountRollEpoch;
  const userRef = firestoreApi.doc(firestoreDb, "users", user.uid);
  try {
    const snapshot = await firestoreApi.getDoc(userRef);
    if (epoch !== accountRollEpoch || currentFirebaseUser?.uid !== user.uid) return;
    currentAccountSettings = normalizeAccountSettings(snapshot.data()?.appSettings);
    scheduleLegacySlotSoundMigration();
    renderAccountIdentity(user);
    accountSettingsUnsubscribe = firestoreApi.onSnapshot(userRef, (nextSnapshot) => {
      if (epoch !== accountRollEpoch) return;
      currentAccountSettings = normalizeAccountSettings(nextSnapshot.data()?.appSettings);
    scheduleLegacySlotSoundMigration();
      rollAccountUi.hidden.checked = currentAccountSettings.hideRolls;
      renderAccountIdentity(currentFirebaseUser);
      renderRollHistory();
    }, (error) => {
      if (epoch === accountRollEpoch) setRollFeatureStatus(rollAccountUi.settingsStatus, rollFeatureError(error), true);
    });
    startPersonalRollHistory();
    campaignIndexUnsubscribe = firestoreApi.onSnapshot(
      firestoreApi.collection(firestoreDb, "users", user.uid, "campaigns"),
      () => { if (epoch === accountRollEpoch) loadCampaignRecords().catch(reportRollHistoryError); },
      (error) => { if (epoch === accountRollEpoch) reportRollHistoryError(error); },
    );
  } catch (error) {
    if (epoch === accountRollEpoch) reportRollHistoryError(error);
  }
}

function getRollContext() {
  return {
    actorUid: currentFirebaseUser?.uid || "",
    sheetOwnerUid: campaignSheetSession?.ownerUid || currentFirebaseUser?.uid || "",
    slotId: campaignSheetSession?.slotId || currentSlotId || "",
    campaignId: campaignSheetSession?.campaignId || "",
    characterName: String(sheetBridge?.captureState?.()?.profile?.name || campaignSheetSession?.slotName || currentSlots.find((slot) => slot.id === currentSlotId)?.name || "Personagem").slice(0, 120),
  };
}

function outcomeSoundKey(outcome) {
  if (outcome === "extreme" || outcome === "extreme-critical") return "extreme";
  if (outcome === "criticalFailure" || outcome === "critical-failure") return "criticalFailure";
  if (outcome === "criticalDamage" || outcome === "critical-damage") return "criticalDamage";
  return outcome === "failure" ? "failure" : "";
}

function normalizeCompletedRoll(raw = {}) {
  const total = Number(raw.total);
  if (!Number.isFinite(total)) return null;
  const context = raw.context && typeof raw.context === "object" ? raw.context : getRollContext();
  const actorUid = String(raw.actorUid || context.actorUid || "").slice(0, 128);
  const sheetOwnerUid = String(raw.sheetOwnerUid || context.sheetOwnerUid || "").slice(0, 128);
  const slotId = String(raw.slotId || context.slotId || "").slice(0, 128);
  const knownOutcomes = ["extreme", "extreme-critical", "failure", "critical-failure", "criticalFailure", "critical-damage", "criticalDamage", "partial", "normal", "good"];
  const outcome = knownOutcomes.includes(raw.outcome || raw.outcomeKey) ? (raw.outcome || raw.outcomeKey) : "";
  const soundRef = normalizeRollSoundRef(raw.soundRef);
  return {
    id: String(raw.id || "").slice(0, 128),
    actorUid, sheetOwnerUid, slotId,
    sheetId: campaignSheetLinkId(sheetOwnerUid, slotId),
    characterName: String(raw.characterName || context.characterName || "Personagem").slice(0, 120),
    actorNickname: String(raw.actorNickname || "Jogador").slice(0, 120),
    title: String(raw.title || "Rolagem").slice(0, 160),
    kind: String(raw.kind || "skill").slice(0, 30),
    total,
    natural: raw.natural != null && Number.isFinite(Number(raw.natural)) ? Number(raw.natural) : null,
    outcome,
    outcomeLabel: String(raw.outcomeLabel || "").slice(0, 80),
    formula: String(raw.formula || "").slice(0, 500),
    breakdown: (Array.isArray(raw.breakdown) ? raw.breakdown.join(" · ") : String(raw.breakdown || "")).slice(0, 5000),
    difficulty: String(raw.difficulty || "").slice(0, 80),
    clientTime: Number.isFinite(Number(raw.clientTime)) ? Number(raw.clientTime) : Date.now(),
    createdAt: raw.createdAt || null,
    campaignIds: Array.isArray(raw.campaignIds) ? raw.campaignIds.filter((id) => typeof id === "string" && !id.includes("/")).slice(0, 100) : [],
    publicCampaignIds: Array.isArray(raw.publicCampaignIds) ? raw.publicCampaignIds.filter((id) => typeof id === "string" && !id.includes("/")).slice(0, 100) : [],
    hidden: raw.hidden === true,
    visibility: raw.visibility === "public" ? "public" : "private",
    soundRef,
  };
}

function shouldPublishCampaignRoll(record, campaign, link, ownerSharesRolls = false) {
  return !currentAccountSettings.hideRolls && !record.hidden && Boolean(record.actorUid)
    && record.actorUid === currentFirebaseUser?.uid
    && Boolean(link)
    && link.ownerUid === record.sheetOwnerUid && link.slotId === record.slotId
    && (record.sheetOwnerUid === record.actorUid || ownerSharesRolls === true)
    && (record.sheetOwnerUid === record.actorUid || campaign?.ownerUid === record.actorUid);
}

async function getRollCampaignLinks(record, context) {
  if (!record.actorUid || !record.slotId || !record.sheetOwnerUid) return [];
  if (!campaignRecords.length) await loadCampaignRecords();
  const candidates = context.campaignId && record.sheetOwnerUid !== record.actorUid
    ? campaignRecords.filter((campaign) => campaign.id === context.campaignId)
    : campaignRecords;
  const links = await Promise.allSettled(candidates.map(async (campaign) => {
    const snapshot = await firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "campaigns", campaign.id, "sheets", record.sheetId));
    if (!snapshot.exists()) return null;
    const link = snapshot.data();
    if (link.ownerUid !== record.sheetOwnerUid || link.slotId !== record.slotId) return null;
    if (record.actorUid !== link.ownerUid && record.actorUid !== campaign.ownerUid) return null;
    let ownerSharesRolls = !currentAccountSettings.hideRolls;
    if (link.ownerUid !== record.actorUid) {
      const owner = await firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "campaigns", campaign.id, "members", link.ownerUid));
      ownerSharesRolls = owner.exists() && owner.data()?.hideRolls !== true;
    }
    return { campaign, link, ownerSharesRolls };
  }));
  const failure = links.find((result) => result.status === "rejected");
  if (failure) reportRollHistoryError(failure.reason);
  return links.filter((result) => result.status === "fulfilled" && result.value).map((result) => result.value);
}

async function recordCompletedRoll(event) {
  const epoch = accountRollEpoch;
  const context = event.context || getRollContext();
  const identity = getEffectiveIdentity();
  const record = normalizeCompletedRoll({ ...event, context, actorNickname: identity.displayName,
    hidden: currentAccountSettings.hideRolls, clientTime: Date.now() });
  if (!record) return;
  record.id = `roll_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  const soundKey = outcomeSoundKey(record.outcome);
  record.soundRef = soundKey ? getActiveSlotRollSounds()[soundKey] : null;
  const ownVolume = currentAccountSettings.ownVolume;
  const soundContext = getSettingsSoundContext();
  const canPlayOwnOutcome = () => epoch === accountRollEpoch && isSettingsSoundContextCurrent(soundContext);
  const playOwnOutcome = () => {
    if (canPlayOwnOutcome() && soundKey) playOutcomeSound(soundKey, record.soundRef, ownVolume, "", canPlayOwnOutcome,
      { getVolume: () => currentAccountSettings.ownVolume }).catch(reportOutcomeAudioError);
  };
  const soundDelay = Math.max(0, Math.min(2000, Number(event.soundDelay) || 0));
  if (soundDelay) window.setTimeout(playOwnOutcome, soundDelay);
  else playOwnOutcome();
  personalRollHistory = [record, ...personalRollHistory].slice(0, rollHistoryLimit);
  renderRollHistory();
  const user = currentFirebaseUser;
  if (!user || !firestoreDb || !firestoreApi || context.actorUid !== user.uid) return;
  const privateRef = firestoreApi.doc(firestoreDb, "users", user.uid, "rollHistory", record.id);
  try {
    // Guardar primeiro na conta garante histórico mesmo se uma Campanha não estiver disponível.
    await firestoreApi.setDoc(privateRef, { ...record, createdAt: firestoreApi.serverTimestamp() });
    const links = await getRollCampaignLinks(record, context);
    if (epoch !== accountRollEpoch || currentFirebaseUser?.uid !== user.uid) return;
    record.campaignIds = links.map(({ campaign }) => campaign.id);
    record.hidden = record.hidden || currentAccountSettings.hideRolls;
    await firestoreApi.setDoc(privateRef, { campaignIds: record.campaignIds, hidden: record.hidden }, { merge: true });
    const publicLinks = links.filter(({ campaign, link, ownerSharesRolls }) => shouldPublishCampaignRoll(record, campaign, link, ownerSharesRolls));
    const writes = await Promise.allSettled(publicLinks.map(({ campaign }) =>
      firestoreApi.setDoc(firestoreApi.doc(firestoreDb, "campaigns", campaign.id, "rollHistory", user.uid, "owners", record.sheetOwnerUid, "entries", record.id), {
        ...record, visibility: "public", createdAt: firestoreApi.serverTimestamp(),
      }),
    ));
    record.publicCampaignIds = publicLinks.filter((_, index) => writes[index].status === "fulfilled").map(({ campaign }) => campaign.id);
    record.visibility = record.publicCampaignIds.length ? "public" : "private";
    if (epoch !== accountRollEpoch) return;
    await firestoreApi.setDoc(privateRef, { publicCampaignIds: record.publicCampaignIds, visibility: record.visibility }, { merge: true });
    const failure = writes.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
  } catch (error) {
    if (epoch === accountRollEpoch) reportRollHistoryError(error);
  }
}

function reportRollHistoryError(error) {
  historyLastError = rollFeatureError(error);
  setRollFeatureStatus(rollAccountUi.historyStatus, historyLastError, true);
}

function startPersonalRollHistory() {
  personalHistoryUnsubscribe?.();
  if (!currentFirebaseUser) return;
  const epoch = accountRollEpoch;
  const query = firestoreApi.query(firestoreApi.collection(firestoreDb, "users", currentFirebaseUser.uid, "rollHistory"),
    firestoreApi.orderBy("createdAt", "desc"), firestoreApi.limit(rollHistoryLimit));
  personalHistoryUnsubscribe = firestoreApi.onSnapshot(query, (snapshot) => {
    if (epoch !== accountRollEpoch) return;
    const saved = snapshot.docs.map((item) => normalizeCompletedRoll({ ...item.data(), id: item.id })).filter(Boolean);
    const pending = personalRollHistory.filter((record) => !record.createdAt && !saved.some((item) => item.id === record.id));
    personalRollHistory = [...pending, ...saved].slice(0, rollHistoryLimit);
    renderRollHistory();
  }, (error) => { if (epoch === accountRollEpoch) reportRollHistoryError(error); });
}

function stopCampaignActorHistory(actor) {
  actor.active = false;
  actor.unsubscribe?.();
  actor.unsubscribe = null;
  if (actor.retryTimer != null) window.clearTimeout(actor.retryTimer);
  actor.retryTimer = null;
}

function stopRollCampaignSubscription(subscription) {
  subscription.membersUnsubscribe?.();
  subscription.actors.forEach(stopCampaignActorHistory);
  subscription.actors.clear();
  subscription.retryAttempts?.clear();
}

async function reconnectRollCampaignAudio() {
  if (!currentFirebaseUser) return;
  historyLastError = "";
  rollCampaignSubscriptions.forEach(stopRollCampaignSubscription);
  rollCampaignSubscriptions.clear();
  await loadCampaignRecords();
}

function syncRollCampaignSubscriptions() {
  if (!currentFirebaseUser || !firestoreApi?.onSnapshot) return;
  const ids = new Set(campaignRecords.map((campaign) => campaign.id));
  rollCampaignSubscriptions.forEach((subscription, id) => {
    if (!ids.has(id)) { stopRollCampaignSubscription(subscription); rollCampaignSubscriptions.delete(id); }
  });
  const epoch = accountRollEpoch;
  campaignRecords.forEach((campaign) => {
    if (rollCampaignSubscriptions.has(campaign.id)) return;
    const subscription = { campaign, members: new Map(), actors: new Map(), membersUnsubscribe: null };
    rollCampaignSubscriptions.set(campaign.id, subscription);
    subscription.membersUnsubscribe = firestoreApi.onSnapshot(
      firestoreApi.collection(firestoreDb, "campaigns", campaign.id, "members"),
      (snapshot) => {
        if (epoch !== accountRollEpoch) return;
        subscription.members = new Map(snapshot.docs.map((item) => [item.id, { ...item.data(), uid: item.id, id: item.id }]));
        syncCampaignActorHistory(subscription);
        if (activeCampaign?.id === campaign.id && subscription.members.has(currentFirebaseUser.uid)) {
          activeCampaignMembers = [...subscription.members.values()];
          campaignUi.membersList.replaceChildren(...activeCampaignMembers.map(createCampaignMemberRow));
          campaignUi.detailMembersCount.textContent = `${activeCampaignMembers.length} ${activeCampaignMembers.length === 1 ? "membro" : "membros"}`;
        }
        renderSettingsPlayerVolumes();
        renderRollHistory();
      },
      (error) => {
        if (epoch !== accountRollEpoch) return;
        stopRollCampaignSubscription(subscription);
        subscription.members.clear();
        rollCampaignSubscriptions.delete(campaign.id);
        renderRollHistory();
        reportRollHistoryError(error);
        if (currentAccountSettings.othersEnabled) showOutcomeAudioNotice("A conexão com os sons da Campanha foi interrompida. Use “Sincronizar agora” no menu da conta para tentar novamente.");
      },
    );
  });
  updateRollHistoryScopes();
  renderRollHistory();
}

function isFreshCampaignRoll(roll, initial = false) {
  const timestamp = campaignTimestamp(roll.createdAt) || Number(roll.clientTime);
  const age = Date.now() - timestamp;
  return !initial && Number.isFinite(timestamp) && age >= -5000 && age < 30000;
}

function campaignRollStreamKey(actorUid, ownerUid) {
  return JSON.stringify([actorUid, ownerUid]);
}

function campaignRollMemberShares(subscription, uid) {
  const member = subscription.members.get(uid);
  return Boolean(member) && member.hideRolls !== true
    && (uid !== currentFirebaseUser?.uid || !currentAccountSettings.hideRolls);
}

function canReadCampaignRollOwner(subscription, actorUid, ownerUid, viewerUid = currentFirebaseUser?.uid) {
  return subscription.members.has(viewerUid) && subscription.members.has(actorUid) && subscription.members.has(ownerUid)
    && (actorUid === viewerUid || (campaignRollMemberShares(subscription, actorUid)
      && (ownerUid === viewerUid || campaignRollMemberShares(subscription, ownerUid))));
}

function canReceiveSharedCampaignRoll(subscription, roll) {
  return !roll.hidden && subscription.members.has(currentFirebaseUser?.uid)
    && campaignRollMemberShares(subscription, roll.actorUid)
    && campaignRollMemberShares(subscription, roll.sheetOwnerUid);
}

function mergeCampaignActorHistory(actor) {
  const records = new Map();
  (actor.legacyRecords || []).forEach((roll) => records.set(roll.id, roll));
  (actor.newRecords || []).forEach((roll) => records.set(roll.id, roll));
  actor.records = [...records.values()].sort((a, b) =>
    (campaignTimestamp(b.createdAt) || b.clientTime) - (campaignTimestamp(a.createdAt) || a.clientTime))
    .slice(0, rollHistoryLimit);
}

async function loadLegacyCampaignActorHistory(subscription, actor, streamKey, epoch) {
  const isCurrent = () => epoch === accountRollEpoch && actor.active && !actor.failed
    && subscription.actors.get(streamKey) === actor
    && canReadCampaignRollOwner(subscription, actor.actorUid, actor.ownerUid);
  const source = firestoreApi.collection(firestoreDb, "campaigns", subscription.campaign.id, "rollHistory", actor.actorUid, "entries");
  let cursor = null;
  try {
    while (isCurrent()) {
      const clauses = [firestoreApi.where("sheetOwnerUid", "==", actor.ownerUid), firestoreApi.limit(200)];
      if (cursor) clauses.push(firestoreApi.startAfter(cursor));
      const snapshot = await firestoreApi.getDocs(firestoreApi.query(source, ...clauses));
      if (!isCurrent()) return;
      const page = snapshot.docs.map((item) => normalizeCompletedRoll({ ...item.data(), id: item.id }))
        .filter((roll) => roll && roll.actorUid === actor.actorUid && roll.sheetOwnerUid === actor.ownerUid && !roll.hidden);
      actor.legacyRecords = [...(actor.legacyRecords || []), ...page].sort((a, b) =>
        (campaignTimestamp(b.createdAt) || b.clientTime) - (campaignTimestamp(a.createdAt) || a.clientTime))
        .slice(0, rollHistoryLimit);
      mergeCampaignActorHistory(actor);
      renderRollHistory();
      if (snapshot.docs.length < 200) return;
      cursor = snapshot.docs.at(-1);
    }
  } catch (error) {
    if (isCurrent()) reportRollHistoryError(error);
  }
}

function syncCampaignActorHistory(subscription) {
  const selfUid = currentFirebaseUser?.uid;
  subscription.retryAttempts ??= new Map();
  // A própria saída da Campanha encerra os streams, mesmo antes de atualizar o índice da conta.
  if (!subscription.members.has(selfUid)) {
    subscription.actors.forEach(stopCampaignActorHistory);
    subscription.actors.clear();
    subscription.retryAttempts.clear();
    return;
  }
  // Cada stream tem um único dono de ficha, para respeitar a escolha dele também quando o Mestre rola.
  const visibleStreams = new Map();
  subscription.members.forEach((member, actorUid) => {
    const ownerUids = actorUid === subscription.campaign.ownerUid ? [...subscription.members.keys()] : [actorUid];
    ownerUids.forEach((ownerUid) => {
      if (canReadCampaignRollOwner(subscription, actorUid, ownerUid, selfUid)) {
        visibleStreams.set(campaignRollStreamKey(actorUid, ownerUid), { actorUid, ownerUid });
      }
    });
  });
  subscription.actors.forEach((actor, streamKey) => {
    if (!visibleStreams.has(streamKey)) {
      stopCampaignActorHistory(actor);
      subscription.actors.delete(streamKey);
      subscription.retryAttempts.delete(streamKey);
    }
  });
  const epoch = accountRollEpoch;
  visibleStreams.forEach(({ actorUid: uid, ownerUid }, streamKey) => {
    if (subscription.actors.has(streamKey)) return;
    const actor = { actorUid: uid, ownerUid, records: [], newRecords: [], legacyRecords: [], active: true,
      unsubscribe: null, retryTimer: null, failed: false, initial: true, observedIds: new Set() };
    subscription.actors.set(streamKey, actor);
    const query = firestoreApi.query(
      firestoreApi.collection(firestoreDb, "campaigns", subscription.campaign.id, "rollHistory", uid, "owners", ownerUid, "entries"),
      firestoreApi.orderBy("createdAt", "desc"), firestoreApi.limit(rollHistoryLimit),
    );
    actor.unsubscribe = firestoreApi.onSnapshot(query, { includeMetadataChanges: true }, (snapshot) => {
      if (epoch !== accountRollEpoch || !actor.active || subscription.actors.get(streamKey) !== actor
        || !canReadCampaignRollOwner(subscription, uid, ownerUid, selfUid)) return;
      if (!snapshot.metadata?.fromCache && !snapshot.metadata?.hasPendingWrites) subscription.retryAttempts.delete(streamKey);
      const initial = actor.initial;
      actor.initial = false;
      actor.newRecords = snapshot.docs.map((item) => normalizeCompletedRoll({ ...item.data(), id: item.id }))
        .filter((roll) => roll && roll.actorUid === uid && roll.sheetOwnerUid === ownerUid && !roll.hidden);
      mergeCampaignActorHistory(actor);
      if (initial) {
        snapshot.docs.forEach((item) => actor.observedIds.add(item.id));
      } else if (!snapshot.metadata?.fromCache) {
        const recordsById = new Map(actor.newRecords.map((roll) => [roll.id, roll]));
        snapshot.docs.forEach((item) => {
          if (actor.observedIds.has(item.id) || item.metadata?.hasPendingWrites) return;
          actor.observedIds.add(item.id);
          if (uid === selfUid) return;
          const roll = recordsById.get(item.id);
          if (!roll || !canReceiveSharedCampaignRoll(subscription, roll) || !isFreshCampaignRoll(roll)) return;
          const sound = outcomeSoundKey(roll.outcome);
          const volume = getReceivedRollVolume(uid);
          const videoClip = normalizeVideoRollClip(roll.soundRef);
          if (!sound || (volume <= 0 && !videoClip)) return;
          const key = `${uid}:${roll.id}`;
          if (playedCampaignRolls.has(key)) return;
          playedCampaignRolls.add(key);
          if (playedCampaignRolls.size > 1000) playedCampaignRolls.delete(playedCampaignRolls.values().next().value);
          playOutcomeSound(sound, roll.soundRef, volume, "", () =>
            subscription.actors.get(streamKey) === actor && actor.active && !actor.failed && canReceiveSharedCampaignRoll(subscription, roll)
              && (Boolean(videoClip) || getReceivedRollVolume(uid) > 0),
            { getVolume: () => getReceivedRollVolume(uid) },
          ).catch(reportOutcomeAudioError);
        });
        while (actor.observedIds.size > Math.max(1000, rollHistoryLimit * 2)) actor.observedIds.delete(actor.observedIds.values().next().value);
      }
      renderRollHistory();
    }, (error) => {
      if (epoch !== accountRollEpoch || subscription.actors.get(streamKey) !== actor) return;
      actor.records = [];
      actor.newRecords = [];
      actor.legacyRecords = [];
      actor.failed = true;
      stopCampaignActorHistory(actor);
      const attempt = (subscription.retryAttempts.get(streamKey) || 0) + 1;
      subscription.retryAttempts.set(streamKey, attempt);
      const maxAttempts = 3;
      if (attempt <= maxAttempts) {
        const delays = [1000, 2000, 4000];
        actor.retryTimer = window.setTimeout(() => {
          actor.retryTimer = null;
          if (epoch !== accountRollEpoch || currentFirebaseUser?.uid !== selfUid || subscription.actors.get(streamKey) !== actor
            || !canReadCampaignRollOwner(subscription, uid, ownerUid, selfUid)) return;
          subscription.actors.delete(streamKey);
          syncCampaignActorHistory(subscription);
        }, delays[attempt - 1]);
      }
      if (attempt > maxAttempts && uid !== selfUid && currentAccountSettings.othersEnabled) showOutcomeAudioNotice("Não foi possível receber os sons da Campanha. Use “Sincronizar agora” no menu da conta para tentar novamente.");
      renderRollHistory();
      reportRollHistoryError(error);
    });
    loadLegacyCampaignActorHistory(subscription, actor, streamKey, epoch);
  });
}

function updateRollHistoryScopes() {
  const selected = rollAccountUi.historyScope.value;
  const personal = new Option("Minhas rolagens", "personal");
  rollAccountUi.historyScope.replaceChildren(personal, ...campaignRecords.map((campaign) => new Option(campaign.name || "Campanha", campaign.id)));
  rollAccountUi.historyScope.value = campaignRecords.some((campaign) => campaign.id === selected) ? selected : "personal";
  rollAccountUi.hidden.disabled = !currentFirebaseUser || settingsBusy || rollPrivacySaving;
  rollAccountUi.hidden.checked = currentAccountSettings.hideRolls;
}

function getVisibleRollHistory(scope = "personal") {
  if (scope === "personal") return [...personalRollHistory];
  const subscription = rollCampaignSubscriptions.get(scope);
  const records = new Map();
  subscription?.actors.forEach((actor) => {
    if (!canReadCampaignRollOwner(subscription, actor.actorUid, actor.ownerUid)) return;
    actor.records.filter((record) => !record.hidden).forEach((record) => records.set(`${record.actorUid}:${record.id}`, record));
  });
  personalRollHistory.filter((record) => record.campaignIds.includes(scope)).forEach((record) => records.set(`${record.actorUid}:${record.id}`, record));
  return [...records.values()];
}

function getRollHistoryIdentity(record, subscription) {
  if (record.actorUid === currentFirebaseUser?.uid) return getEffectiveIdentity();
  let member = subscription?.members.get(record.actorUid);
  if (!member && !subscription) {
    for (const item of rollCampaignSubscriptions.values()) {
      member = item.members.get(record.actorUid);
      if (member) break;
    }
  }
  return { displayName: member?.displayName || record.actorNickname || "Jogador", photoURL: normalizeAccountAvatar(member?.photoURL || "") };
}

function createRollHistoryAvatar(identity) {
  const avatar = document.createElement("span");
  avatar.className = "roll-history-avatar";
  avatar.setAttribute("aria-hidden", "true");
  const fallback = document.createElement("span");
  fallback.className = "roll-history-avatar-fallback";
  fallback.textContent = Array.from(String(identity.displayName || "Jogador").trim())[0]?.toUpperCase() || "J";
  avatar.append(fallback);
  const source = normalizeAccountAvatar(identity.photoURL);
  if (source) {
    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.remove(), { once: true });
    image.src = source;
    avatar.append(image);
  }
  return avatar;
}

function createRollHistoryEntry(record, scope, subscription) {
  const article = document.createElement("article");
  article.className = "roll-history-entry";
  article.dataset.outcome = outcomeSoundKey(record.outcome) || record.outcome || "roll";
  const identity = getRollHistoryIdentity(record, subscription);
  const head = document.createElement("div"); head.className = "roll-history-entry-head";
  const actor = document.createElement("div"); actor.className = "roll-history-actor";
  const actorCopy = document.createElement("div"); actorCopy.className = "roll-history-actor-copy";
  const actorName = document.createElement("strong"); actorName.className = "roll-history-actor-name";
  actorName.textContent = identity.displayName;
  const character = document.createElement("span"); character.className = "roll-history-character";
  character.textContent = record.characterName;
  actorCopy.append(actorName, character);
  actor.append(createRollHistoryAvatar(identity), actorCopy);
  const timestamp = campaignTimestamp(record.createdAt) || record.clientTime;
  const moment = new Date(timestamp);
  const date = document.createElement("time"); date.className = "roll-history-time";
  if (Number.isFinite(moment.getTime())) {
    date.dateTime = moment.toISOString();
    date.textContent = moment.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    date.title = moment.toLocaleString("pt-BR");
    date.setAttribute("aria-label", date.title);
  } else date.textContent = "—";
  head.append(actor, date);
  const result = document.createElement("div"); result.className = "roll-history-result";
  const resultCopy = document.createElement("div"); resultCopy.className = "roll-history-result-copy";
  const title = document.createElement("h3"); title.className = "roll-history-roll-title"; title.textContent = record.title;
  const badges = document.createElement("div"); badges.className = "roll-history-badges";
  const outcome = document.createElement("span"); outcome.className = "roll-history-outcome";
  outcome.dataset.outcome = article.dataset.outcome;
  outcome.textContent = record.outcomeLabel || ({ "critical-failure": "Falha Crítica", criticalFailure: "Falha Crítica", "critical-damage": "Dano Crítico", criticalDamage: "Dano Crítico", failure: "Falha", extreme: "Sucesso Extremo", "extreme-critical": "Sucesso Extremo (Crítico)", partial: "Sucesso Parcial", normal: "Sucesso Normal", good: "Sucesso Bom" }[record.outcome] || "Rolagem");
  badges.append(outcome);
  const isPublicHere = scope === "personal" ? record.visibility === "public" : record.publicCampaignIds.includes(scope) || record.visibility === "public";
  const hidden = record.actorUid === currentFirebaseUser?.uid && (currentAccountSettings.hideRolls || record.hidden || !isPublicHere);
  if (hidden) {
    const privateBadge = document.createElement("span"); privateBadge.className = "roll-history-private";
    privateBadge.textContent = "Privada";
    badges.append(privateBadge);
  }
  if (record.difficulty) {
    const difficulty = document.createElement("span"); difficulty.className = "roll-history-difficulty";
    difficulty.textContent = `Zona ${record.difficulty}`;
    badges.append(difficulty);
  }
  resultCopy.append(title, badges);
  const total = document.createElement("strong"); total.className = "roll-history-total";
  total.textContent = String(record.total);
  total.setAttribute("aria-label", `Resultado: ${record.total}`);
  result.append(resultCopy, total);
  article.append(head, result);
  const details = document.createElement("dl"); details.className = "roll-history-detail";
  const detailRows = [["Dado final", record.natural], ["Fórmula", record.formula], ["Dados e modificadores", record.breakdown]];
  detailRows.forEach(([label, value]) => {
    if (value == null || value === "") return;
    const row = document.createElement("div"); row.className = "roll-history-detail-row";
    const term = document.createElement("dt"); term.textContent = label;
    const detail = document.createElement("dd"); detail.textContent = String(value);
    row.append(term, detail); details.append(row);
  });
  if (details.children.length) article.append(details);
  return article;
}

function renderRollHistory() {
  if (rollAccountUi.historyModal.hidden) return;
  const scope = rollAccountUi.historyScope.value || "personal";
  const records = getVisibleRollHistory(scope).sort((a, b) => (campaignTimestamp(b.createdAt) || b.clientTime) - (campaignTimestamp(a.createdAt) || a.clientTime));
  const subscription = rollCampaignSubscriptions.get(scope);
  const nodes = [];
  let previousDay = "";
  records.forEach((record) => {
    const moment = new Date(campaignTimestamp(record.createdAt) || record.clientTime);
    const day = Number.isFinite(moment.getTime()) ? moment.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Data não informada";
    if (day !== previousDay) {
      const separator = document.createElement("p"); separator.className = "roll-history-day";
      separator.textContent = day; nodes.push(separator); previousDay = day;
    }
    nodes.push(createRollHistoryEntry(record, scope, subscription));
  });
  if (!nodes.length) {
    const empty = document.createElement("p"); empty.className = "roll-history-empty";
    empty.textContent = "Nenhuma rolagem registrada nesta seção. Novas rolagens aparecerão aqui.";
    nodes.push(empty);
  }
  if (records.length >= rollHistoryLimit) {
    const more = document.createElement("button"); more.type = "button"; more.className = "dialog-button"; more.textContent = "Carregar rolagens anteriores";
    more.addEventListener("click", () => {
      rollHistoryLimit += 200;
      startPersonalRollHistory();
      rollCampaignSubscriptions.forEach((item) => { item.actors.forEach(stopCampaignActorHistory); item.actors.clear(); item.retryAttempts?.clear(); syncCampaignActorHistory(item); });
    });
    nodes.push(more);
  }
  rollAccountUi.historyList.replaceChildren(...nodes);
  if (!historyLastError) setRollFeatureStatus(rollAccountUi.historyStatus,
    currentFirebaseUser ? "Histórico atualizado em tempo real. Rolagens ocultas ficam visíveis somente para você." : "Entre com Google para salvar o histórico. Estas rolagens são temporárias.");
}

function getReceivedRollVolume(actorUid) {
  if (actorUid === currentFirebaseUser?.uid) return currentAccountSettings.ownVolume;
  if (!currentAccountSettings.othersEnabled) return 0;
  return currentAccountSettings.othersVolume * (currentAccountSettings.playerVolumes[actorUid] ?? 1);
}

async function unlockOutcomeAudio() {
  const AudioContextApi = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextApi) return null;
  if (!outcomeAudioContext || outcomeAudioContext.state === "closed") {
    outcomeAudioContext = new AudioContextApi();
    rollDecodedAudioCache.clear();
  }
  const audioContext = outcomeAudioContext;
  if (audioContext.state !== "running") {
    let timer;
    try {
      await Promise.race([
        audioContext.resume(),
        new Promise((_, reject) => {
          timer = window.setTimeout(() => reject(Object.assign(new Error("Clique em “Ativar sons” para liberar o áudio."), { name: "NotAllowedError" })), 1500);
        }),
      ]);
    } catch (error) {
      if (audioContext.state !== "running") throw Object.assign(new Error("Clique em “Ativar sons” para liberar o áudio."), { name: "NotAllowedError" });
    } finally { window.clearTimeout(timer); }
  }
  if (audioContext.state !== "running") throw Object.assign(new Error("Clique em “Ativar sons” para liberar o áudio."), { name: "NotAllowedError" });
  if (document.querySelector("#roll-audio-notice")?.dataset.needsUnlock === "true") hideOutcomeAudioNotice();
  const pending = pendingOutcomeAudio.splice(0);
  pending.forEach((item) => {
    if (item.epoch === accountRollEpoch && Date.now() - item.time < 10000 && item.canPlay()) {
      playOutcomeSound(item.key, item.ref, item.volume, item.localSource, item.canPlay).catch(reportOutcomeAudioError);
    }
  });
  return audioContext;
}

function showOutcomeAudioNotice(message, needsUnlock = false) {
  const notice = document.querySelector("#roll-audio-notice");
  if (!notice) return;
  notice.dataset.needsUnlock = String(needsUnlock);
  document.querySelector("#roll-audio-notice-message").textContent = message;
  document.querySelector("#roll-audio-unlock").hidden = !needsUnlock;
  notice.hidden = false;
}

function hideOutcomeAudioNotice() {
  const notice = document.querySelector("#roll-audio-notice");
  if (notice) notice.hidden = true;
}

function queuePendingOutcomeSound(item) {
  pendingOutcomeAudio.push({ ...item, time: Date.now() });
  while (pendingOutcomeAudio.length > 3) pendingOutcomeAudio.shift();
}

function reportOutcomeAudioError(error) {
  if (error?.name === "AbortError") return;
  const message = error?.name === "NotAllowedError"
    ? "O navegador bloqueou o áudio. Clique em “Ativar sons” para ouvir as rolagens."
    : error?.name === "NotSupportedError"
      ? "Este navegador não conseguiu reproduzir o áudio personalizado. Use um arquivo MP3 ou WAV."
    : rollFeatureError(error);
  setRollFeatureStatus(rollAccountUi.settingsStatus, message, true);
  showOutcomeAudioNotice(message, error?.name === "NotAllowedError");
}

function playDefaultOutcomeSound(key, volume) {
  if (!outcomeAudioContext || volume <= 0) return;
  const frequencies = key === "extreme" ? [523.25, 659.25, 783.99] : key === "criticalDamage" ? [110, 440, 880, 660] : key === "criticalFailure" ? [220, 164.81, 110] : [293.66, 220];
  frequencies.forEach((frequency, index) => {
    const oscillator = outcomeAudioContext.createOscillator();
    const gain = outcomeAudioContext.createGain();
    const start = outcomeAudioContext.currentTime + index * (key === "criticalDamage" ? .075 : .12);
    oscillator.type = key === "extreme" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume * .16, start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .32);
    oscillator.connect(gain); gain.connect(outcomeAudioContext.destination);
    oscillator.start(start); oscillator.stop(start + .34);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}

async function readSharedRollAudio(ref) {
  ref = normalizeRollSoundRef(ref);
  if (!ref || !currentFirebaseUser) return "";
  const key = `${ref.uid}/${ref.id}`;
  if (rollAudioCache.has(key)) return rollAudioCache.get(key);
  const loading = (async () => {
    const metaRef = firestoreApi.doc(firestoreDb, "users", ref.uid, "rollSounds", ref.id);
    const metaSnapshot = await firestoreApi.getDoc(metaRef);
    if (!metaSnapshot.exists()) throw new Error("O áudio selecionado não está disponível.");
    const meta = metaSnapshot.data();
    if (meta.ownerUid !== ref.uid || !ROLL_AUDIO_TYPES.has(meta.mimeType) || !Number.isInteger(meta.chunkCount) || meta.chunkCount < 1 || meta.chunkCount > MAX_ROLL_SOUND_CHUNKS || (meta.byteSize != null && (!Number.isInteger(meta.byteSize) || meta.byteSize < 1 || meta.byteSize > MAX_ROLL_SOUND_BYTES))) throw new Error("Áudio inválido.");
    if (ref.kind === "video") {
      const clip = normalizeVideoRollClip(meta);
      if (!clip || clip.startSeconds !== ref.startSeconds || clip.endSeconds !== ref.endSeconds || clip.sourceDuration !== ref.sourceDuration) throw new Error("O trecho de MP4 é inválido.");
    }
    const chunks = await Promise.all(Array.from({ length: meta.chunkCount }, (_, index) => firestoreApi.getDoc(firestoreApi.doc(metaRef, "chunks", String(index)))));
    const data = chunks.map((snapshot, index) => {
      const text = snapshot.data()?.data;
      const maxLength = index === MAX_ROLL_SOUND_CHUNKS - 1 ? 4 * Math.ceil(MAX_ROLL_SOUND_BYTES / 3) - index * ROLL_SOUND_CHUNK_SIZE : ROLL_SOUND_CHUNK_SIZE;
      if (!snapshot.exists() || typeof text !== "string" || !text.length || text.length > maxLength || !/^[A-Za-z0-9+/=]+$/.test(text)) throw new Error("Áudio incompleto.");
      return text;
    }).join("");
    if (data.length % 4 || data.length > 4 * Math.ceil(MAX_ROLL_SOUND_BYTES / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("Áudio inválido.");
    const byteSize = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
    if (byteSize > MAX_ROLL_SOUND_BYTES || (meta.byteSize != null && meta.byteSize !== byteSize)) throw new Error("Áudio inválido.");
    return `data:${meta.mimeType};base64,${data}`;
  })();
  rollAudioCache.set(key, loading);
  try { return await loading; } catch (error) { rollAudioCache.delete(key); throw error; }
}

async function decodeRollAudio(source, ref, audioContext) {
  const cacheKey = ref ? `${ref.uid}/${ref.id}` : "";
  if (cacheKey && rollDecodedAudioCache.has(cacheKey)) return rollDecodedAudioCache.get(cacheKey);
  const loading = (async () => {
    try {
      const response = await fetch(source);
      const data = await response.arrayBuffer();
      return await audioContext.decodeAudioData(data);
    } catch (error) {
      throw Object.assign(new Error("Não foi possível reproduzir este áudio. Tente um arquivo MP3 ou WAV."), { name: "NotSupportedError" });
    }
  })();
  if (cacheKey) {
    rollDecodedAudioCache.set(cacheKey, loading);
    while (rollDecodedAudioCache.size > 8) rollDecodedAudioCache.delete(rollDecodedAudioCache.keys().next().value);
  }
  try {
    const buffer = await loading;
    if (cacheKey && rollDecodedAudioCache.get(cacheKey) === loading) {
      const bytes = buffer.length * buffer.numberOfChannels * 4;
      if (bytes > 16 * 1024 * 1024) rollDecodedAudioCache.delete(cacheKey);
      else rollDecodedAudioCache.set(cacheKey, buffer);
      const cachedBytes = () => [...rollDecodedAudioCache.values()].reduce((total, item) => total + (Number(item.length) * Number(item.numberOfChannels) * 4 || 0), 0);
      while (cachedBytes() > 64 * 1024 * 1024) rollDecodedAudioCache.delete(rollDecodedAudioCache.keys().next().value);
    }
    return buffer;
  } catch (error) {
    if (cacheKey && rollDecodedAudioCache.get(cacheKey) === loading) rollDecodedAudioCache.delete(cacheKey);
    throw error;
  }
}

function playBufferedOutcomeSound(buffer, volume, audioContext, offset = 0, duration = null) {
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain); gain.connect(audioContext.destination);
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    source.disconnect(); gain.disconnect();
    activeOutcomeAudio.delete(playback);
  };
  const playback = { pause: () => { try { source.stop(); } finally { finish(); } } };
  source.onended = finish;
  activeOutcomeAudio.add(playback);
  try { if (duration == null) source.start(); else source.start(0, offset, duration); } catch (error) { finish(); throw error; }
  return playback;
}

async function playOutcomeSound(key, ref, volume, localSource = "", canPlay = () => true, playbackOptions = {}) {
  volume = clampRollVolume(volume, 0);
  const videoClip = localSource?.kind === "video" ? normalizeVideoRollClip(localSource) : ref?.kind === "video" ? normalizeVideoRollClip(ref) : null;
  if (!ROLL_SOUND_KEYS.includes(key) || (volume === 0 && !videoClip) || !canPlay()) return;
  const epoch = accountRollEpoch;
  if (ref?.kind === "youtube" || localSource?.kind === "youtube") return;
  const local = typeof localSource === "string" ? localSource : localSource?.source || "";
  if (videoClip) {
    stopMp4RollPlayback({ closePanel: false });
    const requestVersion = mp4RollPlaybackVersion;
    ensureMp4RollPanel().hidden = false;
    document.querySelector("#roll-media-player-title").textContent = videoClip.name;
    document.querySelector("#roll-media-player-host").replaceChildren();
    const status = document.querySelector("#roll-media-player-status");
    status.textContent = "Recebendo o trecho de MP4…";
    status.dataset.error = "false";
    try {
      const source = local || await readSharedRollAudio(ref);
      if (requestVersion !== mp4RollPlaybackVersion) return;
      if (epoch !== accountRollEpoch || !canPlay()) { stopMp4RollPlayback(); return; }
      await playMp4OutcomeClip(source, videoClip, volume, () => epoch === accountRollEpoch && canPlay(),
        { ...playbackOptions, requestVersion });
    } catch (error) {
      if (requestVersion !== mp4RollPlaybackVersion || epoch !== accountRollEpoch) return;
      if (!canPlay()) { stopMp4RollPlayback(); return; }
      status.textContent = "Não foi possível receber este MP4. Tente sincronizar novamente.";
      status.dataset.error = "true";
      throw error;
    }
    return;
  }
  let audioContext;
  try { audioContext = await unlockOutcomeAudio(); } catch (error) {
    if (error?.name === "NotAllowedError" && epoch === accountRollEpoch && canPlay()) queuePendingOutcomeSound({ key, ref, volume, localSource, canPlay, epoch });
    throw error;
  }
  const source = local || (ref ? await readSharedRollAudio(ref) : "");
  if (epoch !== accountRollEpoch || !canPlay()) return;
  if (!source) { playDefaultOutcomeSound(key, volume); return; }
  if (audioContext) {
    const buffer = await decodeRollAudio(source, local ? null : ref, audioContext);
    if (epoch !== accountRollEpoch || !canPlay()) return;
    if (audioContext.state !== "running") {
      queuePendingOutcomeSound({ key, ref, volume, localSource, canPlay, epoch });
      throw Object.assign(new Error("Clique em “Ativar sons” para liberar o áudio."), { name: "NotAllowedError" });
    }
    playBufferedOutcomeSound(buffer, volume, audioContext); return;
  }
  const audio = new Audio(source); audio.volume = volume; activeOutcomeAudio.add(audio);
  audio.onended = audio.onerror = () => activeOutcomeAudio.delete(audio);
  try { await audio.play(); } catch (error) { activeOutcomeAudio.delete(audio); throw error; }
}

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onabort = () => reject(new Error("A leitura do arquivo foi interrompida. Escolha o arquivo novamente."));
    reader.readAsDataURL(file);
  });
}

function getRollSoundMimeType(file) {
  const aliases = { "audio/mp3": "audio/mpeg", "audio/x-m4a": "audio/mp4", "audio/m4a": "audio/mp4", "audio/vnd.wave": "audio/wav", "audio/wave": "audio/wav", "application/ogg": "audio/ogg", "audio/x-ogg": "audio/ogg", "video/webm": "audio/webm", "video/mp4": "audio/mp4" };
  const declared = String(file?.type || "").toLowerCase().split(";")[0].trim();
  const mimeType = aliases[declared] || declared;
  if (ROLL_AUDIO_TYPES.has(mimeType)) return mimeType;
  const extension = String(file?.name || "").split(".").at(-1)?.toLowerCase();
  return { mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", webm: "audio/webm", m4a: "audio/mp4", mp4: "audio/mp4" }[extension] || "";
}

async function stageRollSound(key, file) {
  if (!file || !canEditSettingsSlotSounds()) return false;
  const version = settingsSoundReadVersions[key] = (settingsSoundReadVersions[key] || 0) + 1;
  const mimeType = getRollSoundMimeType(file);
  if (!ROLL_AUDIO_TYPES.has(mimeType)) throw new Error("Escolha um áudio MP3, WAV, OGG, WebM ou M4A.");
  if (!file.size || file.size > MAX_ROLL_SOUND_BYTES) throw new Error("O áudio precisa ter até 20 MB.");
  const draft = accountSettingsDraft;
  const source = await readFileDataUrl(file);
  if (accountSettingsDraft !== draft || !canEditSettingsSlotSounds() || version !== settingsSoundReadVersions[key]) return false;
  const data = source.slice(source.indexOf(",") + 1);
  if (!data || data.length % 4 || data.length > 4 * Math.ceil(MAX_ROLL_SOUND_BYTES / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("O arquivo de áudio é inválido ou muito grande.");
  const byteSize = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (byteSize > MAX_ROLL_SOUND_BYTES) throw new Error("O áudio precisa ter até 20 MB.");
  stagedRollSounds[key] = { name: file.name.slice(0, 120), mimeType, byteSize, data, source: `data:${mimeType};base64,${data}` };
  renderSettingsSoundNames();
  return true;
}

async function uploadRollSound(clip, user, onProgress = () => {}) {
  if (clip?.kind === "video") return uploadVideoRollSound(clip, user, onProgress);
  const data = clip.data;
  if (typeof data !== "string" || !data.length || data.length % 4 || data.length > 4 * Math.ceil(MAX_ROLL_SOUND_BYTES / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("O áudio é inválido ou ultrapassa o limite de 20 MB.");
  const byteSize = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (byteSize > MAX_ROLL_SOUND_BYTES) throw new Error("O áudio precisa ter até 20 MB.");
  const ref = firestoreApi.doc(firestoreApi.collection(firestoreDb, "users", user.uid, "rollSounds"));
  const chunks = Array.from({ length: Math.ceil(clip.data.length / ROLL_SOUND_CHUNK_SIZE) }, (_, index) => clip.data.slice(index * ROLL_SOUND_CHUNK_SIZE, (index + 1) * ROLL_SOUND_CHUNK_SIZE));
  if (!chunks.length || chunks.length > MAX_ROLL_SOUND_CHUNKS) throw new Error("O áudio precisa ter até 20 MB.");
  for (let offset = 0; offset < chunks.length; offset += 8) {
    const batch = firestoreApi.writeBatch(firestoreDb);
    const end = Math.min(offset + 8, chunks.length);
    for (let index = offset; index < end; index += 1) batch.set(firestoreApi.doc(ref, "chunks", String(index)), { data: chunks[index] });
    if (end === chunks.length) batch.set(ref, { ownerUid: user.uid, name: clip.name, mimeType: clip.mimeType, byteSize, chunkCount: chunks.length, createdAt: firestoreApi.serverTimestamp() });
    await withCloudTimeout(batch.commit(), 45000, "O envio do áudio demorou demais. Tente novamente.");
    onProgress(Math.round(end / chunks.length * 100));
  }
  const soundRef = { uid: user.uid, id: ref.id, name: clip.name, mimeType: clip.mimeType };
  rollAudioCache.set(`${user.uid}/${ref.id}`, clip.source);
  return soundRef;
}

async function compactAccountAvatar(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error("Escolha uma imagem PNG, JPG ou WebP com até 8 MB.");
  const source = await readFileDataUrl(file);
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error("Não foi possível abrir a imagem.")); image.src = source; });
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  context.fillStyle = "#18191c"; context.fillRect(0, 0, 256, 256);
  context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
  const compact = canvas.toDataURL("image/jpeg", .75);
  if (compact.length > 90000) throw new Error("Não foi possível reduzir esta imagem. Escolha outra.");
  return compact;
}

function settingsSoundFieldKey(key) { return key === "criticalFailure" ? "critical-failure" : key === "criticalDamage" ? "critical-damage" : key; }

function setSettingsSoundFeedback(key, state, message) {
  const feedback = document.querySelector(`#settings-sound-status-${settingsSoundFieldKey(key)}`);
  if (!feedback) return;
  feedback.dataset.state = state;
  feedback.textContent = message;
  feedback.setAttribute("role", state === "error" ? "alert" : "status");
  feedback.setAttribute("aria-live", state === "error" ? "assertive" : "polite");
}

function audioAdditionErrorMessage(error) {
  if (String(error?.code || "").includes("permission-denied")) return "Sua conta não tem permissão para salvar este áudio.";
  if (String(error?.code || "").includes("unavailable") || !navigator.onLine) return "Sem conexão. Reconecte-se e tente salvar novamente.";
  return userFacingErrorMessage(error) || "Não foi possível salvar o áudio na sua conta. Tente novamente.";
}

async function handleSettingsSoundSelection(key, input) {
  const file = input.files?.[0];
  if (!file || !canEditSettingsSlotSounds() || settingsBusy) return;
  setSettingsSoundFeedback(key, "loading", "Escolha o início e o fim do áudio no editor de trecho.");
  input.value = "";
  await openAudioClipEditor(key, { file });
}

function renderSettingsSoundNames() {
  ROLL_SOUND_KEYS.forEach((key) => {
    document.querySelector(`#settings-sound-name-${settingsSoundFieldKey(key)}`).textContent = stagedRollSounds[key]?.name || accountSettingsDraft?.sounds[key]?.name || "Som padrão";
    const edit = document.querySelector(`[data-edit-audio-outcome="${key}"]`);
    if (edit) edit.disabled = settingsBusy || !canEditSettingsSlotSounds() || !Boolean(stagedRollSounds[key] || accountSettingsDraft?.sounds[key]);
  });
}

function renderSettingsAvatarPreview() {
  const source = accountSettingsDraft?.avatar || normalizeAccountAvatar(currentFirebaseUser?.photoURL || "");
  rollAccountUi.avatarPreview.hidden = !source;
  if (source) rollAccountUi.avatarPreview.src = source;
  else rollAccountUi.avatarPreview.removeAttribute("src");
}

function renderSettingsPlayerVolumes() {
  if (!accountSettingsDraft || rollAccountUi.settingsModal.hidden) return;
  const players = new Map();
  rollCampaignSubscriptions.forEach((subscription) => subscription.members.forEach((member, uid) => {
    if (uid !== currentFirebaseUser?.uid) players.set(uid, member);
  }));
  const rows = [...players.values()].sort((a, b) => String(a.displayName || "").localeCompare(String(b.displayName || ""), "pt-BR")).map((member) => {
    const row = document.createElement("div"); row.className = "settings-player-volume";
    const label = document.createElement("label"); label.textContent = member.displayName || "Jogador";
    const range = document.createElement("input"); range.type = "range"; range.min = "0"; range.max = "100"; range.step = "1";
    range.id = `player-roll-volume-${member.uid}`; label.htmlFor = range.id;
    range.value = String(Math.round((accountSettingsDraft.playerVolumes[member.uid] ?? 1) * 100));
    range.disabled = !accountSettingsDraft.othersEnabled;
    const output = document.createElement("output"); output.htmlFor = range.id; output.textContent = `${range.value}%`;
    range.addEventListener("input", () => { accountSettingsDraft.playerVolumes[member.uid] = Number(range.value) / 100; output.textContent = `${range.value}%`; });
    row.append(label, range, output); return row;
  });
  if (!rows.length) { const note = document.createElement("p"); note.className = "settings-note"; note.textContent = "Os participantes das suas Campanhas aparecerão aqui."; rows.push(note); }
  rollAccountUi.playerVolumes.replaceChildren(...rows);
}

function openAccountSettings() {
  if (!currentFirebaseUser) return;
  closeAccountMenu();
  settingsSoundContext = getSettingsSoundContext();
  settingsSoundContext.initialSounds = getActiveSlotRollSounds();
  accountSettingsDraft = normalizeAccountSettings(currentAccountSettings);
  accountSettingsDraft.sounds = getActiveSlotRollSounds();
  stagedRollSounds = {};
  rollAccountUi.nickname.value = accountSettingsDraft.nickname || getEffectiveIdentity().displayName;
  rollAccountUi.avatarUrl.value = accountSettingsDraft.avatar.startsWith("data:") ? "" : accountSettingsDraft.avatar;
  rollAccountUi.avatarFile.value = "";
  const note = document.querySelector("#settings-slot-sound-note");
  if (note) {
    const name = getRollContext().characterName;
    note.textContent = settingsSoundContext.canEdit
      ? `Os sons serão salvos apenas na ficha “${name}”. Cada Slot tem seus próprios sons.`
      : settingsSoundContext.slotId
        ? `Sons da ficha “${name}”. Apenas o proprietário pode alterá-los.`
        : "Abra uma ficha para escolher seus sons. O nick e os volumes continuam disponíveis.";
  }
  ROLL_SOUND_KEYS.forEach((key) => {
    document.querySelector(`#settings-sound-${settingsSoundFieldKey(key)}`).value = "";
    setSettingsSoundFeedback(key, accountSettingsDraft.sounds[key] ? "saved" : "default",
      accountSettingsDraft.sounds[key] ? "Som personalizado salvo nesta ficha." : "Som padrão ativo.");
  });
  rollAccountUi.ownVolume.value = String(Math.round(accountSettingsDraft.ownVolume * 100));
  rollAccountUi.ownVolumeValue.textContent = `${rollAccountUi.ownVolume.value}%`;
  rollAccountUi.othersEnabled.checked = accountSettingsDraft.othersEnabled;
  rollAccountUi.othersVolume.value = String(Math.round(accountSettingsDraft.othersVolume * 100));
  rollAccountUi.othersVolumeValue.textContent = `${rollAccountUi.othersVolume.value}%`;
  rollAccountUi.othersVolume.disabled = !accountSettingsDraft.othersEnabled;
  setRollFeatureStatus(rollAccountUi.settingsStatus);
  rollAccountUi.settingsModal.hidden = false;
  renderSettingsAvatarPreview(); renderSettingsSoundNames(); renderSettingsPlayerVolumes();
  updateSettingsFormAvailability();
  syncModalLock(); rollAccountUi.settingsDialog.focus();
  unlockOutcomeAudio().catch(() => {});
  loadCampaignRecords().catch((error) => setRollFeatureStatus(rollAccountUi.settingsStatus, rollFeatureError(error), true));
}

function closeAccountSettings() {
  if (settingsBusy) return;
  closeAudioClipEditor({ restoreSettings: false });
  stopMp4RollPlayback();
  rollAccountUi.settingsModal.hidden = true;
  accountSettingsDraft = null; stagedRollSounds = {}; settingsSoundContext = null;
  syncModalLock(); firebaseUi.button.focus();
}

function updateSettingsFormAvailability() {
  rollAccountUi.settingsForm.querySelectorAll("input, button").forEach((element) => { element.disabled = settingsBusy; });
  const canEditSounds = canEditSettingsSlotSounds();
  document.querySelectorAll(".settings-sound-actions input, .settings-sound-actions button").forEach((element) => {
    if (element.dataset.previewOutcome) return;
    element.disabled = settingsBusy || !canEditSounds;
  });
  document.querySelectorAll("[data-edit-audio-outcome]").forEach((button) => {
    const key = button.dataset.editAudioOutcome;
    button.disabled = settingsBusy || !canEditSounds || !Boolean(stagedRollSounds[key] || accountSettingsDraft?.sounds[key]);
  });
  rollAccountUi.save.disabled = settingsBusy || pendingSettingsMedia.size > 0;
  rollAccountUi.othersVolume.disabled = settingsBusy || !accountSettingsDraft?.othersEnabled;
  rollAccountUi.playerVolumes.querySelectorAll("input").forEach((element) => { element.disabled = settingsBusy || !accountSettingsDraft?.othersEnabled; });
  rollAccountUi.settingsDialog.querySelectorAll("[data-close-account-settings]").forEach((element) => { element.disabled = settingsBusy; });
}

async function readSettingsMedia(operation) {
  const token = Symbol("media");
  pendingSettingsMedia.add(token);
  updateSettingsFormAvailability();
  try { return await operation(); }
  finally { pendingSettingsMedia.delete(token); updateSettingsFormAvailability(); }
}

async function propagateAccountIdentity(user, settings) {
  const identity = getEffectiveIdentity(user);
  const memberships = await firestoreApi.getDocs(firestoreApi.collection(firestoreDb, "users", user.uid, "campaigns"));
  const results = await Promise.allSettled(memberships.docs.map(async (index) => {
    const memberRef = firestoreApi.doc(firestoreDb, "campaigns", index.id, "members", user.uid);
    const member = await firestoreApi.getDoc(memberRef);
    if (!member.exists()) return;
    await firestoreApi.setDoc(memberRef, { displayName: identity.displayName, photoURL: identity.photoURL, hideRolls: settings.hideRolls }, { merge: true });
    const campaignRef = firestoreApi.doc(firestoreDb, "campaigns", index.id);
    const campaign = await firestoreApi.getDoc(campaignRef);
    if (campaign.exists() && campaign.data().ownerUid === user.uid) await firestoreApi.setDoc(campaignRef, { ownerName: identity.displayName }, { merge: true });
    await Promise.all((member.data().sheetIds || []).filter((id) => typeof id === "string").map(async (id) => {
      const sheetRef = firestoreApi.doc(firestoreDb, "campaigns", index.id, "sheets", id);
      const sheet = await firestoreApi.getDoc(sheetRef);
      if (sheet.exists() && sheet.data().ownerUid === user.uid) await firestoreApi.setDoc(sheetRef, { ownerName: identity.displayName, ownerPhotoURL: identity.photoURL }, { merge: true });
    }));
  }));
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  if (currentFirebaseUser?.uid !== user.uid) return;
  if (activeCampaign) {
    activeCampaignMembers = activeCampaignMembers.map((member) => member.uid === user.uid ? { ...member, displayName: identity.displayName, photoURL: identity.photoURL, hideRolls: settings.hideRolls } : member);
    activeCampaignSheets = activeCampaignSheets.map((sheet) => sheet.ownerUid === user.uid ? { ...sheet, ownerName: identity.displayName, ownerPhotoURL: identity.photoURL } : sheet);
    renderCampaignDetail();
  }
}

async function saveAccountSettings(event) {
  event.preventDefault();
  if (settingsBusy || !currentFirebaseUser || !accountSettingsDraft) return;
  if (pendingSettingsMedia.size) { setRollFeatureStatus(rollAccountUi.settingsStatus, "Aguarde o arquivo terminar de carregar."); return; }
  const user = currentFirebaseUser, epoch = accountRollEpoch;
  const draft = accountSettingsDraft, soundContext = settingsSoundContext;
  const isCurrent = () => epoch === accountRollEpoch && currentFirebaseUser?.uid === user.uid
    && accountSettingsDraft === draft && isSettingsSoundContextCurrent(soundContext);
  if (!isCurrent()) { cancelStaleSlotSoundSettings(); return; }
  const nickname = rollAccountUi.nickname.value.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!nickname) { setRollFeatureStatus(rollAccountUi.settingsStatus, "Digite seu nick.", true); rollAccountUi.nickname.focus(); return; }
  const typedAvatar = rollAccountUi.avatarUrl.value.trim();
  if (typedAvatar && !normalizeAccountAvatar(typedAvatar)) { setRollFeatureStatus(rollAccountUi.settingsStatus, "Use um link de imagem que comece com https:// ou http://.", true); return; }
  const initialSounds = soundContext.initialSounds || getActiveSlotRollSounds();
  const pendingSoundKeys = ROLL_SOUND_KEYS.filter((key) => Boolean(stagedRollSounds[key]));
  const hasSoundChanges = soundContext.soundWritePending === true || pendingSoundKeys.length > 0
    || ROLL_SOUND_KEYS.some((key) => JSON.stringify(draft.sounds[key]) !== JSON.stringify(initialSounds[key]));
  if (hasSoundChanges && !canEditSettingsSlotSounds()) {
    setRollFeatureStatus(rollAccountUi.settingsStatus, "Abra uma ficha sua para alterar os sons.", true); return;
  }
  let uploadingSoundKey = "", slotSoundsSaved = false;
  settingsBusy = true;
  if (draft.othersEnabled) unlockOutcomeAudio().catch(reportOutcomeAudioError);
  updateSettingsFormAvailability();
  rollAccountUi.save.textContent = "Salvando…";
  rollAccountUi.hidden.disabled = true;
  setRollFeatureStatus(rollAccountUi.settingsStatus, "Salvando configurações…");
  try {
    const settings = normalizeAccountSettings({ ...draft, nickname, hideRolls: currentAccountSettings.hideRolls });
    settings.sounds = normalizeSlotRollSounds(draft.sounds);
    for (const key of pendingSoundKeys) {
      if (!isCurrent()) return;
      uploadingSoundKey = key;
      const staged = stagedRollSounds[key];
      setSettingsSoundFeedback(key, "uploading", "Enviando o trecho para esta ficha…");
      const uploaded = staged.uploadedRef || await uploadRollSound(staged, user, (progress) => {
        if (isCurrent()) setSettingsSoundFeedback(key, "uploading", `Enviando o trecho… ${progress}%`);
      });
      if (!isCurrent()) return;
      staged.uploadedRef = uploaded;
      settings.sounds[key] = uploaded;
      draft.sounds[key] = uploaded;
      setSettingsSoundFeedback(key, "uploading", "Trecho preparado. Salvando na ficha…");
    }
    uploadingSoundKey = "";
    if (!isCurrent()) return;
    if (hasSoundChanges) {
      soundContext.soundWritePending = true;
      if (!getSettingsSoundContext().canEdit || !sheetBridge.setRollSounds(settings.sounds)) throw new Error("Não foi possível alterar os sons desta ficha.");
      if (!(await flushCloudSave())) throw new Error("A ficha ainda não foi sincronizada. Reconecte-se e tente salvar novamente.");
      if (!isCurrent()) return;
      slotSoundsSaved = true;
      stagedRollSounds = {};
      settings.soundScope = "slot";
      draft.soundScope = "slot";
      soundContext.initialSounds = normalizeSlotRollSounds(settings.sounds);
      soundContext.soundWritePending = false;
      renderSettingsSoundNames();
      ROLL_SOUND_KEYS.forEach((key) => setSettingsSoundFeedback(key, settings.sounds[key] ? "saved" : "default",
        settings.sounds[key] ? "Som adicionado e salvo nesta ficha!" : "Som padrão salvo nesta ficha."));
    }
    const { hideRolls: ignoredPrivacy, sounds: ignoredAccountSounds, ...savedSettings } = settings;
    await firestoreApi.setDoc(firestoreApi.doc(firestoreDb, "users", user.uid), { appSettings: savedSettings }, { merge: true });
    if (!isCurrent()) return;
    settings.hideRolls = currentAccountSettings.hideRolls;
    const legacySounds = currentAccountSettings.sounds;
    currentAccountSettings = normalizeAccountSettings({ ...settings, sounds: legacySounds });
    accountSettingsDraft = normalizeAccountSettings(settings);
    accountSettingsDraft.sounds = getActiveSlotRollSounds();
    stagedRollSounds = {};
    renderAccountIdentity(user); renderSettingsSoundNames(); renderRollHistory();
    const savedMessage = hasSoundChanges ? "Sons salvos nesta ficha! Configurações salvas." : "Configurações salvas.";
    setRollFeatureStatus(rollAccountUi.settingsStatus, savedMessage);
    try {
      await propagateAccountIdentity(user, settings);
      if (epoch === accountRollEpoch && isSettingsSoundContextCurrent(soundContext)) setRollFeatureStatus(rollAccountUi.settingsStatus, savedMessage);
    } catch (error) {
      if (epoch === accountRollEpoch && isSettingsSoundContextCurrent(soundContext)) setRollFeatureStatus(rollAccountUi.settingsStatus, `${savedMessage} A atualização do perfil nas Campanhas está pendente. Tente salvar novamente.`, true);
    }
  } catch (error) {
    if (isCurrent()) {
      const reason = audioAdditionErrorMessage(error);
      if (slotSoundsSaved) {
        draft.sounds = getActiveSlotRollSounds();
        setRollFeatureStatus(rollAccountUi.settingsStatus, `Os sons foram salvos nesta ficha. O perfil e os volumes ainda precisam ser sincronizados. ${reason}`, true);
      } else {
        pendingSoundKeys.forEach((key) => setSettingsSoundFeedback(key, "error", key === uploadingSoundKey
          ? `Trecho não adicionado: ${reason}` : `Trecho ainda não salvo: ${reason} Tente novamente.`));
        setRollFeatureStatus(rollAccountUi.settingsStatus, hasSoundChanges ? `Os sons ainda não foram sincronizados nesta ficha. ${reason}` : rollFeatureError(error), true);
      }
    }
  } finally {
    if (epoch === accountRollEpoch && isSettingsSoundContextCurrent(soundContext)) {
      settingsBusy = false;
      updateSettingsFormAvailability();
      rollAccountUi.save.textContent = "Salvar configurações";
      rollAccountUi.hidden.disabled = !currentFirebaseUser || rollPrivacySaving;
      scheduleLegacySlotSoundMigration();
    }
  }
}

async function persistRollPrivacy(hidden) {
  if (!currentFirebaseUser || settingsBusy || rollPrivacySaving) return;
  const user = currentFirebaseUser; const epoch = accountRollEpoch;
  const previousPrivacy = currentAccountSettings.hideRolls;
  rollPrivacySaving = true;
  if (hidden) currentAccountSettings.hideRolls = true;
  rollAccountUi.hidden.disabled = true;
  setRollFeatureStatus(rollAccountUi.historyStatus, "Atualizando privacidade…");
  try {
    await firestoreApi.setDoc(firestoreApi.doc(firestoreDb, "users", user.uid), { appSettings: { hideRolls: hidden } }, { merge: true });
    if (epoch !== accountRollEpoch) return;
    currentAccountSettings.hideRolls = hidden;
    if (accountSettingsDraft) accountSettingsDraft.hideRolls = hidden;
    await propagateAccountIdentity(user, currentAccountSettings);
    historyLastError = "";
    renderRollHistory();
    setRollFeatureStatus(rollAccountUi.historyStatus, hidden ? "Novas rolagens e sons das suas fichas ficam privados, inclusive se o Mestre usar a ficha. Você continua vendo seu histórico." : "Novas rolagens e sons das suas fichas serão compartilhados, mesmo com a ficha privada. Rolagens feitas enquanto estavam ocultas continuam privadas.");
  } catch (error) {
    if (epoch === accountRollEpoch) {
      const saved = await firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "users", user.uid)).catch(() => null);
      if (epoch !== accountRollEpoch || currentFirebaseUser?.uid !== user.uid) return;
      currentAccountSettings.hideRolls = saved ? saved.data()?.appSettings?.hideRolls === true : previousPrivacy;
      reportRollHistoryError(error);
    }
  } finally {
    if (epoch === accountRollEpoch) {
      rollPrivacySaving = false;
      rollAccountUi.hidden.checked = currentAccountSettings.hideRolls;
      rollAccountUi.hidden.disabled = !currentFirebaseUser || settingsBusy;
    }
  }
}

async function openRollHistory() {
  rollAccountUi.historyModal.hidden = false;
  updateRollHistoryScopes(); renderRollHistory();
  syncModalLock(); rollAccountUi.historyDialog.focus();
  unlockOutcomeAudio().catch(() => {});
  if (currentFirebaseUser) {
    try { await loadCampaignRecords(); } catch (error) { reportRollHistoryError(error); }
  }
}

function closeRollHistory() {
  rollAccountUi.historyModal.hidden = true;
  syncModalLock(); rollAccountUi.historyButton.focus();
}

rollAccountUi.settingsButton.addEventListener("click", openAccountSettings);
rollAccountUi.settingsForm.addEventListener("submit", saveAccountSettings);
rollAccountUi.historyButton.addEventListener("click", openRollHistory);
rollAccountUi.historyScope.addEventListener("change", renderRollHistory);
rollAccountUi.hidden.addEventListener("change", () => persistRollPrivacy(rollAccountUi.hidden.checked));
document.querySelectorAll("[data-close-account-settings]").forEach((button) => button.addEventListener("click", closeAccountSettings));
document.querySelectorAll("[data-close-roll-history]").forEach((button) => button.addEventListener("click", closeRollHistory));
document.querySelector("#roll-history-refresh").addEventListener("click", async () => {
  if (!currentFirebaseUser) { renderRollHistory(); return; }
  historyLastError = "";
  rollCampaignSubscriptions.forEach(stopRollCampaignSubscription); rollCampaignSubscriptions.clear();
  startPersonalRollHistory();
  try { await loadCampaignRecords(); } catch (error) { reportRollHistoryError(error); }
});
rollAccountUi.ownVolume.addEventListener("input", () => {
  if (!accountSettingsDraft) return;
  accountSettingsDraft.ownVolume = Number(rollAccountUi.ownVolume.value) / 100;
  rollAccountUi.ownVolumeValue.textContent = `${rollAccountUi.ownVolume.value}%`;
});
rollAccountUi.othersVolume.addEventListener("input", () => {
  if (!accountSettingsDraft) return;
  accountSettingsDraft.othersVolume = Number(rollAccountUi.othersVolume.value) / 100;
  rollAccountUi.othersVolumeValue.textContent = `${rollAccountUi.othersVolume.value}%`;
});
rollAccountUi.othersEnabled.addEventListener("change", () => {
  if (!accountSettingsDraft) return;
  accountSettingsDraft.othersEnabled = rollAccountUi.othersEnabled.checked;
  if (accountSettingsDraft.othersEnabled) unlockOutcomeAudio().catch(reportOutcomeAudioError);
  rollAccountUi.othersVolume.disabled = !accountSettingsDraft.othersEnabled;
  renderSettingsPlayerVolumes();
});
rollAccountUi.avatarUrl.addEventListener("input", () => {
  if (!accountSettingsDraft) return;
  settingsAvatarReadVersion += 1;
  accountSettingsDraft.avatar = normalizeAccountAvatar(rollAccountUi.avatarUrl.value);
  rollAccountUi.avatarFile.value = ""; renderSettingsAvatarPreview();
});
rollAccountUi.avatarFile.addEventListener("change", async () => {
  const file = rollAccountUi.avatarFile.files?.[0]; const draft = accountSettingsDraft;
  if (!file || !draft) return;
  const version = ++settingsAvatarReadVersion;
  try {
    const avatar = await readSettingsMedia(() => compactAccountAvatar(file));
    if (accountSettingsDraft !== draft || version !== settingsAvatarReadVersion) return;
    draft.avatar = avatar; rollAccountUi.avatarUrl.value = ""; renderSettingsAvatarPreview();
  } catch (error) { setRollFeatureStatus(rollAccountUi.settingsStatus, rollFeatureError(error), true); }
});
document.querySelector("#account-settings-avatar-reset").addEventListener("click", () => {
  if (!accountSettingsDraft) return;
  settingsAvatarReadVersion += 1;
  accountSettingsDraft.avatar = ""; rollAccountUi.avatarUrl.value = ""; rollAccountUi.avatarFile.value = ""; renderSettingsAvatarPreview();
});
ROLL_SOUND_KEYS.forEach((key) => {
  document.querySelector(`#settings-sound-${settingsSoundFieldKey(key)}`).addEventListener("change", (event) => {
    handleSettingsSoundSelection(key, event.target);
  });
});
document.querySelectorAll("[data-preview-outcome]").forEach((button) => button.addEventListener("click", () => {
  if (!accountSettingsDraft) return;
  const key = button.dataset.previewOutcome;
  activeOutcomeAudio.forEach((audio) => audio.pause()); activeOutcomeAudio.clear();
  stopMp4RollPlayback();
  const draft = accountSettingsDraft;
  unlockOutcomeAudio().then(() => {
    if (accountSettingsDraft !== draft) return;
    return playOutcomeSound(key, draft.sounds[key], draft.ownVolume, stagedRollSounds[key] || "");
  }).catch((error) => {
    if (accountSettingsDraft !== draft) return;
    const message = error?.name === "NotSupportedError"
      ? "Não foi possível ouvir esse arquivo. Tente um áudio em MP3 ou WAV."
      : error?.name === "NotAllowedError"
        ? "O navegador bloqueou o som. Clique em “Ouvir” novamente para liberar."
        : `Não foi possível ouvir o som: ${audioAdditionErrorMessage(error)}`;
    setSettingsSoundFeedback(key, "error", message);
    setRollFeatureStatus(rollAccountUi.settingsStatus, message, true);
  });
}));
document.querySelectorAll("[data-reset-outcome]").forEach((button) => button.addEventListener("click", () => {
  if (!accountSettingsDraft) return;
  if (!canEditSettingsSlotSounds() || settingsBusy) return;
  const key = button.dataset.resetOutcome;
  settingsSoundReadVersions[key] = (settingsSoundReadVersions[key] || 0) + 1;
  accountSettingsDraft.sounds[key] = null; delete stagedRollSounds[key];
  document.querySelector(`#settings-sound-${settingsSoundFieldKey(key)}`).value = ""; renderSettingsSoundNames();
  setSettingsSoundFeedback(key, "selected", "Som padrão escolhido. Clique em “Salvar configurações” para confirmar.");
}));
document.querySelector("#roll-audio-unlock").addEventListener("click", () => unlockOutcomeAudio().catch(reportOutcomeAudioError));
document.querySelector("#roll-audio-notice-close").addEventListener("click", hideOutcomeAudioNotice);
document.addEventListener("pointerdown", () => unlockOutcomeAudio().catch(() => {}), { passive: true });
document.addEventListener("keydown", (event) => {
  if (event.isTrusted && !event.repeat) unlockOutcomeAudio().catch(() => {});
  const modal = !audioClipUi.modal.hidden ? audioClipUi.modal : !rollAccountUi.settingsModal.hidden ? rollAccountUi.settingsModal : !rollAccountUi.historyModal.hidden ? rollAccountUi.historyModal : null;
  if (!modal) return;
  if (event.key === "Escape") { event.preventDefault(); modal === audioClipUi.modal ? closeAudioClipEditor() : modal === rollAccountUi.settingsModal ? closeAccountSettings() : closeRollHistory(); }
  if (event.key !== "Tab") return;
  const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], iframe, audio[controls], [tabindex="0"]')].filter((element) => !element.closest("[hidden]") && element.tabIndex !== -1);
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === modal.querySelector('[role="dialog"]'))) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});


// Files are decoded locally; only the selected WAV segment is staged for saving.
const MAX_AUDIO_CLIP_SOURCE_BYTES = 100000000;
const MAX_AUDIO_CLIP_SOURCE_SECONDS = 15 * 60;
const MAX_AUDIO_CLIP_DECODE_BYTES = 256 * 1024 * 1024;

function parseAudioClipTime(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim().replace(",", ".");
  if (!text || !/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(text)) return null;
  const pieces = text.split(":");
  if (pieces.length > 1 && pieces.slice(1).some((part) => Number(part) >= 60)) return null;
  const seconds = pieces.reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isFinite(seconds) ? seconds : null;
}

function formatAudioClipTime(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const milliseconds = Math.round(seconds * 1000);
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const wholeSeconds = totalSeconds % 60;
  const fraction = milliseconds % 1000;
  const suffix = fraction ? `.${String(fraction).padStart(3, "0").replace(/0+$/, "")}` : "";
  return `${hours ? `${hours}:${String(minutes).padStart(2, "0")}` : Math.floor(totalSeconds / 60)}:${String(wholeSeconds).padStart(2, "0")}${suffix}`;
}

function audioClipOutputChannels(numberOfChannels) {
  return Number(numberOfChannels) === 1 ? 1 : 2;
}

function validateAudioClipRange(startValue, endValue, totalDuration, options = {}) {
  const start = parseAudioClipTime(startValue);
  let end = parseAudioClipTime(endValue);
  const total = Number(totalDuration);
  // Inputs show milliseconds; keep a rounded-up whole-file endpoint inside its real buffer.
  if (end != null && Number.isFinite(total) && end > total && end - total <= .000501) end = total;
  const sampleRate = Number(options.sampleRate || 44100);
  const channels = audioClipOutputChannels(options.channels || 2);
  const maxBytes = options.maxBytes ?? MAX_ROLL_SOUND_BYTES;
  const result = { ok: false, start, end, duration: end == null || start == null ? 0 : end - start, error: "" };
  if (start == null || end == null) result.error = "Informe os tempos em segundos ou no formato 0:00.";
  else if (!Number.isFinite(total) || total <= 0) result.error = "A duração deste áudio não está disponível.";
  else if (end <= start) result.error = "O fim do trecho precisa ser depois do início.";
  else if (start >= total || end > total) result.error = "O trecho precisa ficar dentro da duração do áudio.";
  else if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 384000) result.error = "A taxa de áudio deste arquivo não é compatível.";
  if (result.error) return result;
  const totalFrames = Number.isInteger(options.frames) ? options.frames : Math.round(total * sampleRate);
  const frameStart = Math.max(0, Math.min(totalFrames, Math.round(start * sampleRate)));
  const frameEnd = Math.max(0, Math.min(totalFrames, Math.round(end * sampleRate)));
  const frameCount = frameEnd - frameStart;
  const byteSize = 44 + frameCount * channels * 2;
  Object.assign(result, { frameStart, frameEnd, frameCount, byteSize, channels, sampleRate });
  if (frameCount < 1) result.error = "Escolha um trecho um pouco maior.";
  else if (byteSize > maxBytes) {
    const maxSeconds = Math.floor((maxBytes - 44) / (channels * 2)) / sampleRate;
    result.error = `O trecho precisa ter até ${formatAudioClipTime(maxSeconds)} para caber no limite de 20 MB.`;
  }
  result.ok = !result.error;
  return result;
}

function encodeAudioClipWav(buffer, start, end) {
  if (!buffer || typeof buffer.getChannelData !== "function" || !Number.isInteger(buffer.numberOfChannels) || buffer.numberOfChannels < 1 || buffer.numberOfChannels > 32 || !Number.isInteger(buffer.length)) {
    throw new Error("Não foi possível ler os canais deste áudio.");
  }
  const range = validateAudioClipRange(start, end, buffer.duration, { sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, frames: buffer.length });
  if (!range.ok) throw new Error(range.error);
  const samples = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  if (samples.some((channel) => channel.length < range.frameEnd)) throw new Error("O arquivo de áudio está incompleto.");
  const data = new ArrayBuffer(range.byteSize);
  const view = new DataView(data);
  const writeText = (offset, value) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeText(0, "RIFF"); view.setUint32(4, range.byteSize - 8, true); writeText(8, "WAVE");
  writeText(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, range.channels, true); view.setUint32(24, range.sampleRate, true);
  view.setUint32(28, range.sampleRate * range.channels * 2, true);
  view.setUint16(32, range.channels * 2, true); view.setUint16(34, 16, true);
  writeText(36, "data"); view.setUint32(40, range.byteSize - 44, true);
  let offset = 44;
  const extraWeight = buffer.numberOfChannels > 2 ? .5 / (buffer.numberOfChannels - 2) : 0;
  for (let frame = range.frameStart; frame < range.frameEnd; frame += 1) {
    let extra = 0;
    if (extraWeight) for (let channel = 2; channel < samples.length; channel += 1) extra += (Number.isFinite(samples[channel][frame]) ? samples[channel][frame] : 0) * extraWeight;
    for (let channel = 0; channel < range.channels; channel += 1) {
      let sample = Number.isFinite(samples[channel][frame]) ? samples[channel][frame] : 0;
      if (extraWeight) sample = sample * .5 + extra;
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
      offset += 2;
    }
  }
  return new Blob([data], { type: "audio/wav" });
}

function audioClipAbortError() {
  return Object.assign(new Error("A seleção do áudio foi cancelada."), { name: "AbortError" });
}

function awaitAudioClipOperation(operation, signal, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(audioClipAbortError()); return; }
    let settled = false;
    const finish = (action, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      action(result);
    };
    const abort = () => finish(reject, audioClipAbortError());
    const timer = setTimeout(() => finish(reject, new Error(timeoutMessage)), timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    Promise.resolve(operation).then((result) => finish(resolve, result), (error) => finish(reject, error));
  });
}

async function readAudioClipMetadata(file, { signal } = {}) {
  const source = URL.createObjectURL(file);
  const audio = new Audio();
  audio.preload = "metadata";
  try {
    const ready = new Promise((resolve, reject) => {
      audio.onloadedmetadata = () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) reject(new Error("Não foi possível descobrir a duração deste áudio. Tente um MP3 ou WAV."));
        else resolve(audio.duration);
      };
      audio.onerror = () => reject(new Error("Não foi possível abrir este áudio. Tente um MP3 ou WAV."));
      audio.src = source;
      audio.load();
    });
    return await awaitAudioClipOperation(ready, signal, 30000, "O arquivo demorou demais para abrir. Tente um MP3 ou WAV.");
  } finally {
    audio.onloadedmetadata = audio.onerror = null;
    audio.pause(); audio.removeAttribute("src"); audio.load();
    URL.revokeObjectURL(source);
  }
}

async function decodeAudioClipFile(file, { signal, isCurrent = () => true } = {}) {
  const mimeType = getRollSoundMimeType(file);
  if (!file || !ROLL_AUDIO_TYPES.has(mimeType)) throw new Error("Escolha um áudio MP3, WAV, OGG, WebM ou M4A.");
  if (!file.size || file.size > MAX_AUDIO_CLIP_SOURCE_BYTES) throw new Error("O arquivo completo precisa ter até 100 MB.");
  if (!isCurrent() || signal?.aborted) return null;
  const duration = await readAudioClipMetadata(file, { signal });
  if (!isCurrent() || signal?.aborted) return null;
  if (duration > MAX_AUDIO_CLIP_SOURCE_SECONDS) throw new Error("Escolha um arquivo com até 15 minutos para recortar o trecho.");
  const AudioContextApi = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextApi) throw new Error("Este navegador não consegue recortar áudio. Tente uma versão recente do Chrome, Edge, Firefox ou Safari.");
  let context;
  try {
    try { context = new AudioContextApi({ sampleRate: 44100 }); }
    catch { context = new AudioContextApi(); }
    if (duration * context.sampleRate * 2 * 4 > MAX_AUDIO_CLIP_DECODE_BYTES) throw new Error("O arquivo é longo demais para recortar neste navegador. Escolha uma versão mais curta.");
    const bytes = await awaitAudioClipOperation(file.arrayBuffer(), signal, 30000, "Não foi possível ler o áudio a tempo. Escolha o arquivo novamente.");
    if (!isCurrent() || signal?.aborted) return null;
    let buffer;
    try {
      buffer = await awaitAudioClipOperation(context.decodeAudioData(bytes), signal, 90000, "Não foi possível preparar o áudio a tempo. Tente um arquivo menor.");
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new Error(error?.name === "EncodingError" || error?.name === "NotSupportedError" ? "Não foi possível decodificar este áudio. Tente um MP3 ou WAV." : error?.message || "Não foi possível preparar este áudio.");
    }
    if (!isCurrent() || signal?.aborted) return null;
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > MAX_AUDIO_CLIP_SOURCE_SECONDS || buffer.length * buffer.numberOfChannels * 4 > MAX_AUDIO_CLIP_DECODE_BYTES) throw new Error("O áudio ocupa memória demais para recortar. Escolha um arquivo menor.");
    return { buffer, name: String(file.name || "Áudio").slice(0, 120), mimeType, duration: buffer.duration, sourceBytes: file.size };
  } finally {
    if (context && context.state !== "closed") await context.close().catch(() => {});
  }
}

function audioClipFileName(name, start, end) {
  const base = String(name || "Áudio").replace(/\.[^.]+$/, "").slice(0, 72);
  return `${base} (${formatAudioClipTime(start)}–${formatAudioClipTime(end)}).wav`.slice(0, 120);
}


const MAX_YOUTUBE_ROLL_TIME = 86400;
const MAX_YOUTUBE_ROLL_CLIP = 600;
function normalizeYoutubeRollClip(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(raw.videoId || ""))) return null;
  const startSeconds = Number(raw.startSeconds);
  const endSeconds = Number(raw.endSeconds);
  if (typeof raw.startSeconds !== "number" || typeof raw.endSeconds !== "number"
    || !Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)
    || startSeconds < 0 || endSeconds > MAX_YOUTUBE_ROLL_TIME || endSeconds <= startSeconds
    || endSeconds - startSeconds > MAX_YOUTUBE_ROLL_CLIP) return null;
  const start = Math.round(startSeconds * 1000) / 1000;
  const end = Math.round(endSeconds * 1000) / 1000;
  if (end <= start) return null;
  return {
    kind: "youtube", mimeType: "video/youtube", videoId: String(raw.videoId),
    startSeconds: start, endSeconds: end,
    name: String(raw.name || `YouTube · ${raw.videoId}`).trim().slice(0, 120) || "Trecho do YouTube",
  };
}

// MP4 clips keep their original video, with a bounded playback interval.
const MAX_VIDEO_ROLL_CLIP_SECONDS = 600;
const MAX_VIDEO_ROLL_SOURCE_SECONDS = 900;
let activeMp4RollPlayback = null;
let mp4RollPlaybackVersion = 0;

function getRollVideoMimeType(file) {
  const type = String(file?.type || "").toLowerCase().split(";")[0].trim();
  const extension = String(file?.name || "").split(".").at(-1)?.toLowerCase();
  return type === "video/mp4" || extension === "mp4" ? "video/mp4" : "";
}

function normalizeVideoRollClip(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)
    || raw.kind !== "video" || raw.mimeType !== "video/mp4") return null;
  const { startSeconds, endSeconds, sourceDuration } = raw;
  if (![startSeconds, endSeconds, sourceDuration].every((value) => typeof value === "number" && Number.isFinite(value))
    || startSeconds < 0 || endSeconds <= startSeconds || sourceDuration <= 0
    || endSeconds > sourceDuration || sourceDuration > MAX_VIDEO_ROLL_SOURCE_SECONDS
    || endSeconds - startSeconds > MAX_VIDEO_ROLL_CLIP_SECONDS) return null;
  // Keep the real endpoint: rounding can otherwise place the selected end past a short source.
  return {
    kind: "video", mimeType: "video/mp4", startSeconds, endSeconds, sourceDuration,
    name: String(raw.name || "Trecho de MP4").trim().slice(0, 120) || "Trecho de MP4",
  };
}

async function readVideoClipMetadata(file, { signal } = {}) {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata"; video.playsInline = true; video.muted = true;
  try {
    const operation = new Promise((resolve, reject) => {
      video.onloadedmetadata = () => Number.isFinite(video.duration) && video.duration > 0
        ? resolve(video.duration)
        : reject(new Error("Não foi possível descobrir a duração deste MP4."));
      video.onerror = () => reject(new Error("Este MP4 não é compatível com o navegador. Tente um MP4 com vídeo H.264 e áudio AAC."));
      video.src = objectUrl; video.load();
    });
    return await awaitAudioClipOperation(operation, signal, 30000, "O MP4 demorou demais para abrir. Escolha um arquivo menor.");
  } finally {
    video.onloadedmetadata = video.onerror = null;
    video.pause(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(objectUrl);
  }
}

async function readVideoClipFile(file, { signal, isCurrent = () => true } = {}) {
  if (!file || !getRollVideoMimeType(file)) throw new Error("Escolha um arquivo MP4.");
  if (!Number.isInteger(file.size) || file.size < 1 || file.size > MAX_ROLL_SOUND_BYTES) {
    throw new Error("Para usar o vídeo, o MP4 completo precisa ter até 20 MB. Para usar só o áudio, escolha “Somente áudio”.");
  }
  if (!isCurrent() || signal?.aborted) return null;
  const duration = await readVideoClipMetadata(file, { signal });
  if (!isCurrent() || signal?.aborted) return null;
  if (duration > MAX_VIDEO_ROLL_SOURCE_SECONDS) throw new Error("Escolha um MP4 com até 15 minutos.");
  const clip = normalizeVideoRollClip({ kind: "video", mimeType: "video/mp4", name: file.name,
    startSeconds: 0, endSeconds: Math.min(duration, 10), sourceDuration: duration });
  return { clip, name: clip.name, mimeType: clip.mimeType, duration, sourceBytes: file.size };
}

async function stageVideoRollSound(file, start, end, { sourceDuration, signal, isCurrent = () => true } = {}) {
  if (!file || !getRollVideoMimeType(file) || !file.size || file.size > MAX_ROLL_SOUND_BYTES) {
    throw new Error("O MP4 completo precisa ter até 20 MB.");
  }
  const clip = normalizeVideoRollClip({ kind: "video", mimeType: "video/mp4", name: file.name,
    startSeconds: start, endSeconds: end, sourceDuration });
  if (!clip) throw new Error("Escolha um trecho válido de MP4 com até 10 minutos.");
  if (!isCurrent() || signal?.aborted) return null;
  const source = await awaitAudioClipOperation(readFileDataUrl(file), signal, 30000, "Não foi possível ler o MP4 a tempo.");
  if (!isCurrent() || signal?.aborted) return null;
  const data = source.slice(source.indexOf(",") + 1);
  if (!data || data.length % 4 || data.length > 4 * Math.ceil(MAX_ROLL_SOUND_BYTES / 3)
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("O MP4 é inválido ou ultrapassa 20 MB.");
  const byteSize = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (byteSize !== file.size || byteSize > MAX_ROLL_SOUND_BYTES) throw new Error("O MP4 está incompleto ou ultrapassa 20 MB.");
  return { ...clip, byteSize, data, source: `data:video/mp4;base64,${data}`, sourceFile: file,
    selectedRange: { start, end } };
}

async function uploadVideoRollSound(raw, user, onProgress = () => {}) {
  const clip = normalizeVideoRollClip(raw);
  if (!clip || !user?.uid) throw new Error("Escolha um trecho válido de MP4.");
  const data = raw.data;
  if (typeof data !== "string" || !data.length || data.length % 4
    || data.length > 4 * Math.ceil(MAX_ROLL_SOUND_BYTES / 3)
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error("O MP4 é inválido ou ultrapassa 20 MB.");
  const byteSize = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (byteSize < 1 || byteSize > MAX_ROLL_SOUND_BYTES) throw new Error("O MP4 precisa ter até 20 MB.");
  const ref = firestoreApi.doc(firestoreApi.collection(firestoreDb, "users", user.uid, "rollSounds"));
  const chunks = Array.from({ length: Math.ceil(data.length / ROLL_SOUND_CHUNK_SIZE) }, (_, index) => data.slice(index * ROLL_SOUND_CHUNK_SIZE, (index + 1) * ROLL_SOUND_CHUNK_SIZE));
  if (!chunks.length || chunks.length > MAX_ROLL_SOUND_CHUNKS) throw new Error("O MP4 precisa ter até 20 MB.");
  for (let offset = 0; offset < chunks.length; offset += 8) {
    const batch = firestoreApi.writeBatch(firestoreDb);
    const end = Math.min(offset + 8, chunks.length);
    for (let index = offset; index < end; index += 1) batch.set(firestoreApi.doc(ref, "chunks", String(index)), { data: chunks[index] });
    if (end === chunks.length) batch.set(ref, { ownerUid: user.uid, ...clip, byteSize,
      chunkCount: chunks.length, createdAt: firestoreApi.serverTimestamp() });
    await withCloudTimeout(batch.commit(), 45000, "O envio do MP4 demorou demais. Tente novamente.");
    onProgress(Math.round(end / chunks.length * 100));
  }
  rollAudioCache.set(`${user.uid}/${ref.id}`, `data:video/mp4;base64,${data}`);
  return { uid: user.uid, id: ref.id, ...clip };
}

function ensureMp4RollPanel() {
  let panel = document.querySelector("#roll-media-player-panel");
  if (panel) return panel;
  panel = document.createElement("section"); panel.id = "roll-media-player-panel";
  panel.className = "roll-media-player-panel"; panel.hidden = true;
  panel.setAttribute("role", "region"); panel.setAttribute("aria-label", "Vídeo da rolagem");
  const header = document.createElement("div"); header.className = "roll-media-player-head";
  const title = document.createElement("strong"); title.id = "roll-media-player-title";
  const close = document.createElement("button"); close.type = "button"; close.className = "button button-quiet";
  close.textContent = "Fechar"; close.setAttribute("aria-label", "Fechar vídeo da rolagem");
  close.addEventListener("click", () => stopMp4RollPlayback()); header.append(title, close);
  const host = document.createElement("div"); host.id = "roll-media-player-host";
  const status = document.createElement("p"); status.id = "roll-media-player-status"; status.setAttribute("role", "status");
  const actions = document.createElement("div"); actions.className = "roll-media-player-actions";
  const replay = document.createElement("button"); replay.type = "button"; replay.className = "button button-quiet";
  replay.textContent = "Reproduzir trecho"; replay.addEventListener("click", () => activeMp4RollPlayback?.replay());
  actions.append(replay); panel.append(header, host, status, actions); document.body.append(panel);
  return panel;
}

function stopMp4RollPlayback({ closePanel = true } = {}) {
  mp4RollPlaybackVersion += 1;
  activeMp4RollPlayback?.pause(); activeMp4RollPlayback = null;
  if (closePanel) { const panel = document.querySelector("#roll-media-player-panel"); if (panel) panel.hidden = true; }
}

async function playMp4RollClip(source, raw, volume = .7, options = {}) {
  const clip = normalizeVideoRollClip(raw);
  if (!clip || typeof source !== "string" || !/^(?:data:video\/mp4;base64,|blob:)/.test(source)) throw new Error("O MP4 escolhido não está disponível.");
  const canPlay = options.canPlay || (() => true);
  if (!canPlay() || (options.requestVersion != null && options.requestVersion !== mp4RollPlaybackVersion)) return null;
  stopMp4RollPlayback({ closePanel: false });
  const version = mp4RollPlaybackVersion;
  const hostId = options.hostId || "roll-media-player-host";
  const corner = hostId === "roll-media-player-host";
  if (corner) {
    ensureMp4RollPanel().hidden = false;
    document.querySelector("#roll-media-player-title").textContent = clip.name;
  } else { const panel = document.querySelector("#roll-media-player-panel"); if (panel) panel.hidden = true; }
  const host = document.querySelector(`#${hostId}`);
  if (!host || !host.isConnected || host.closest("[hidden]")) return null;
  const video = document.createElement("video");
  video.className = "roll-media-player-video"; video.controls = true; video.playsInline = true;
  video.preload = "metadata";
  const syncVolume = () => {
    video.volume = clampRollVolume(options.getVolume ? options.getVolume() : volume, 0);
    video.muted = video.volume === 0;
  };
  syncVolume();
  video.setAttribute("aria-label", `${clip.name}, trecho selecionado`);
  host.replaceChildren(video);
  let timer = null, frameRequest = null, disposed = false, ended = false, cancelLoad = null;
  const current = () => !disposed && version === mp4RollPlaybackVersion && activeMp4RollPlayback === playback;
  const status = (message, error = false) => {
    if (corner) { const element = document.querySelector("#roll-media-player-status"); element.textContent = message; element.dataset.error = String(error); }
    options.onStatus?.(message, error);
  };
  const clearWatch = () => {
    clearTimeout(timer); timer = null;
    if (frameRequest != null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
    frameRequest = null;
  };
  const finish = () => {
    clearWatch(); ended = true; video.pause(); activeOutcomeAudio.delete(playback);
    if (video.currentTime >= clip.endSeconds) video.currentTime = Math.max(clip.startSeconds, clip.endSeconds - .002);
    if (current()) status("Trecho concluído. Clique em “Reproduzir trecho” para assistir novamente.");
  };
  const checkBoundary = () => {
    if (!current()) return false;
    if (!canPlay() || !host.isConnected || host.closest("[hidden]")) {
      playback.pause();
      if (corner) { const panel = document.querySelector("#roll-media-player-panel"); if (panel) panel.hidden = true; }
      return false;
    }
    syncVolume();
    if (document.hidden) { video.pause(); clearWatch(); activeOutcomeAudio.delete(playback); return false; }
    if (video.currentTime >= clip.endSeconds - .002) { finish(); return false; }
    if (video.currentTime < clip.startSeconds) video.currentTime = clip.startSeconds;
    return true;
  };
  const watch = () => {
    clearWatch(); if (!checkBoundary()) return;
    if (!video.paused && video.requestVideoFrameCallback) frameRequest = video.requestVideoFrameCallback(() => { frameRequest = null; checkBoundary(); });
    const remaining = Math.max(0, clip.endSeconds - video.currentTime) / Math.max(.1, video.playbackRate || 1);
    timer = setTimeout(watch, video.paused ? 250 : Math.min(50, Math.max(5, remaining * 1000)));
  };
  const start = async () => {
    if (!current() || !canPlay() || document.hidden || host.closest("[hidden]")) { playback.pause(); return false; }
    if (ended || video.currentTime >= clip.endSeconds || video.currentTime < clip.startSeconds) video.currentTime = clip.startSeconds;
    ended = false; syncVolume(); activeOutcomeAudio.add(playback);
    try { await video.play(); if (!checkBoundary()) return false; watch(); status(`Reproduzindo ${formatAudioClipTime(clip.startSeconds)}–${formatAudioClipTime(clip.endSeconds)}.`); return true; }
    catch (error) {
      activeOutcomeAudio.delete(playback); clearWatch();
      if (current()) {
        status(error?.name === "NotAllowedError" ? "Vídeo pronto. Clique em “Reproduzir trecho” para assistir e ouvir." : "Não foi possível reproduzir este MP4.", true);
        watch(); options.onError?.(error);
      }
      return false;
    }
  };
  const playback = {
    video, clip,
    pause() {
      if (disposed) return;
      disposed = true; clearWatch(); video.pause();
      cancelLoad?.(); cancelLoad = null;
      video.onloadedmetadata = video.onerror = null;
      video.removeAttribute("src"); video.load(); activeOutcomeAudio.delete(playback);
      if (activeMp4RollPlayback === playback) activeMp4RollPlayback = null;
    },
    replay: () => start(),
  };
  activeMp4RollPlayback = playback;
  video.addEventListener("play", () => {
    if (!current() || !canPlay() || document.hidden) { video.pause(); return; }
    if (ended || video.currentTime >= clip.endSeconds || video.currentTime < clip.startSeconds) video.currentTime = clip.startSeconds;
    ended = false; activeOutcomeAudio.add(playback); watch();
    status(`Reproduzindo ${formatAudioClipTime(clip.startSeconds)}–${formatAudioClipTime(clip.endSeconds)}.`);
  });
  video.addEventListener("seeking", () => {
    if (!current()) return;
    if (video.currentTime < clip.startSeconds) video.currentTime = clip.startSeconds;
    else if (video.currentTime >= clip.endSeconds) finish();
  });
  video.addEventListener("timeupdate", checkBoundary);
  video.addEventListener("ended", finish);
  video.addEventListener("ratechange", () => { if (current() && !ended) watch(); });
  status("Carregando o trecho de MP4…");
  try {
    const metadata = new Promise((resolve, reject) => {
      cancelLoad = () => reject(audioClipAbortError());
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error("Este MP4 não pode ser reproduzido neste navegador."));
      video.src = source; video.load();
    });
    const duration = await awaitAudioClipOperation(metadata, options.signal, 30000, "O MP4 demorou demais para carregar.");
    cancelLoad = null;
    if (!current() || !canPlay()) { playback.pause(); return null; }
    if (!Number.isFinite(duration) || duration <= clip.startSeconds || clip.endSeconds > duration + .001) throw new Error("O trecho selecionado está fora da duração deste MP4.");
    video.onloadedmetadata = null;
    video.onerror = () => { if (current()) { const error = new Error("Não foi possível reproduzir este MP4."); status(error.message, true); options.onError?.(error); playback.pause(); } };
    video.currentTime = clip.startSeconds;
    if (options.autoplay !== false) await start();
    return current() ? playback : null;
  } catch (error) {
    if (current()) { status(error.message || "Não foi possível abrir este MP4.", true); options.onError?.(error); playback.pause(); }
    if (error?.name !== "AbortError") throw error;
    return null;
  }
}

function playMp4OutcomeClip(source, clip, volume, canPlay = () => true, options = {}) {
  return playMp4RollClip(source, clip, volume, { ...options, canPlay, onError: (error) => {
    if (error?.name === "NotAllowedError") {
      showOutcomeAudioNotice("O vídeo da rolagem está pronto no canto da tela. Clique em “Reproduzir trecho” para assistir.");
      return;
    }
    reportOutcomeAudioError(error);
  } });
}

function previewMp4RollClip(source, clip, volume, options = {}) {
  return playMp4RollClip(source, clip, volume, options);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && activeMp4RollPlayback) activeMp4RollPlayback.video.pause();
});


const audioClipUi = {
  modal: document.querySelector("#audio-clip-modal"),
  dialog: document.querySelector("#audio-clip-dialog"),
  file: document.querySelector("#audio-clip-file"),
  videoFile: document.querySelector("#audio-clip-video-file"),
  start: document.querySelector("#audio-clip-start"),
  end: document.querySelector("#audio-clip-end"),
  startRange: document.querySelector("#audio-clip-start-range"),
  endRange: document.querySelector("#audio-clip-end-range"),
  duration: document.querySelector("#audio-clip-duration"),
  sourceName: document.querySelector("#audio-clip-source-name"),
  sourceDuration: document.querySelector("#audio-clip-source-duration"),
  audio: document.querySelector("#audio-clip-audio"),
  empty: document.querySelector("#audio-clip-empty"),
  videoStage: document.querySelector("#audio-clip-video-stage"),
  status: document.querySelector("#audio-clip-status"),
  preview: document.querySelector("#audio-clip-preview"),
  stop: document.querySelector("#audio-clip-stop"),
  apply: document.querySelector("#audio-clip-apply"),
};
let audioClipSession = null;

function isAudioClipSessionCurrent(session) {
  return Boolean(session) && audioClipSession === session && session.draft === accountSettingsDraft && session.epoch === accountRollEpoch && isSettingsSoundContextCurrent(session.soundContext);
}

function setAudioClipStatus(message, state = "idle") {
  audioClipUi.status.textContent = message;
  audioClipUi.status.dataset.state = state;
  audioClipUi.status.setAttribute("role", state === "error" ? "alert" : "status");
}

function stopAudioClipPreview() {
  const session = audioClipSession;
  if (session) session.previewVersion = (session.previewVersion || 0) + 1;
  session?.preview?.pause();
  if (session) session.preview = null;
  session?.sourceVideo?.pause();
  audioClipUi.audio.pause();
  audioClipUi.stop.disabled = true;
}

function clearAudioClipSource() {
  stopAudioClipPreview();
  const session = audioClipSession;
  if (!session) return;
  session.abort?.abort();
  session.loadVersion += 1;
  if (session.sourceVideo) { session.sourceVideo.pause(); session.sourceVideo.removeAttribute("src"); session.sourceVideo.load(); }
  document.querySelector("#audio-clip-video-player").replaceChildren();
  if (session.objectUrl) URL.revokeObjectURL(session.objectUrl);
  Object.assign(session, { objectUrl: "", buffer: null, file: null, clip: null, duration: 0, sourceVideo: null, busy: false });
  audioClipUi.audio.removeAttribute("src"); audioClipUi.audio.load();
  audioClipUi.audio.hidden = true;
  audioClipUi.videoStage.hidden = true;
  audioClipUi.empty.hidden = false;
  audioClipUi.sourceName.textContent = "Nenhum áudio escolhido";
  audioClipUi.sourceDuration.textContent = "—";
  stopMp4RollPlayback();
}

function setAudioClipSourceMode(mode) {
  if (!audioClipSession || !["file", "video"].includes(mode)) return;
  if (audioClipSession.mode !== mode) clearAudioClipSource();
  audioClipSession.mode = mode;
  document.querySelectorAll("[data-audio-clip-source]").forEach((tab) => {
    const selected = tab.dataset.audioClipSource === mode;
    tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelector("#audio-clip-file-panel").hidden = mode !== "file";
  document.querySelector("#audio-clip-video-panel").hidden = mode !== "video";
  syncAudioClipControls();
}

function getAudioClipSelection(session = audioClipSession) {
  if (!session?.buffer && !session?.clip) return { ok: false, error: "Escolha um arquivo para começar.", duration: 0 };
  if (session.mode === "file") return validateAudioClipRange(audioClipUi.start.value, audioClipUi.end.value, session.duration, {
    sampleRate: session.buffer.sampleRate, channels: session.buffer.numberOfChannels, frames: session.buffer.length,
  });
  const range = validateAudioClipRange(audioClipUi.start.value, audioClipUi.end.value, session.duration, { maxBytes: Number.MAX_SAFE_INTEGER });
  if (range.ok && !normalizeVideoRollClip({ ...session.clip, startSeconds: range.start, endSeconds: range.end })) {
    range.ok = false; range.error = "Escolha um trecho de MP4 com até 10 minutos, dentro da duração do vídeo.";
  }
  return range;
}

function syncAudioClipControls({ showError = false } = {}) {
  const session = audioClipSession;
  const ready = Boolean(session?.buffer || session?.clip);
  const busy = Boolean(session?.busy);
  const range = getAudioClipSelection();
  [audioClipUi.start, audioClipUi.end, audioClipUi.startRange, audioClipUi.endRange].forEach((input) => { input.disabled = !ready || busy; });
  [audioClipUi.file, audioClipUi.videoFile, ...document.querySelectorAll("[data-audio-clip-source]")].forEach((input) => { input.disabled = busy; });
  audioClipUi.apply.disabled = !range.ok || busy;
  audioClipUi.preview.disabled = !range.ok || busy;
  audioClipUi.duration.textContent = `${formatAudioClipTime(Math.max(0, range.duration || 0))} selecionados`;
  const max = session?.duration || Math.max(300, (range.start || 0) + 60, range.end || 0);
  for (const [slider, seconds] of [[audioClipUi.startRange, range.start], [audioClipUi.endRange, range.end]]) {
    slider.max = String(max); slider.value = String(seconds || 0);
    slider.setAttribute("aria-valuetext", formatAudioClipTime(seconds || 0));
  }
  audioClipUi.sourceDuration.textContent = session?.duration ? `Total ${formatAudioClipTime(session.duration)}` : ready ? "Duração a confirmar" : "—";
  if (showError && ready && !range.ok) setAudioClipStatus(range.error, "error");
  else if (ready && !busy && audioClipUi.status.dataset.state === "error" && range.ok) setAudioClipStatus("Trecho válido. Clique em “Ouvir trecho” para conferir.", "ready");
}

function setAudioClipRange(start, end) {
  audioClipUi.start.value = formatAudioClipTime(start);
  audioClipUi.end.value = formatAudioClipTime(end);
  syncAudioClipControls();
}

async function loadAudioClipFile(file, initialRange = null) {
  const session = audioClipSession;
  if (!isAudioClipSessionCurrent(session) || !file) return;
  clearAudioClipSource(); session.abort = new AbortController();
  const version = session.loadVersion;
  const isCurrent = () => isAudioClipSessionCurrent(session) && session.loadVersion === version;
  session.busy = true; setAudioClipStatus(`Preparando “${file.name}”…`, "loading"); syncAudioClipControls();
  try {
    const candidate = await readSettingsMedia(() => session.mode === "video"
      ? readVideoClipFile(file, { signal: session.abort.signal, isCurrent })
      : decodeAudioClipFile(file, { signal: session.abort.signal, isCurrent }));
    if (!candidate || !isCurrent()) return;
    Object.assign(session, candidate, { file, busy: false });
    session.objectUrl = URL.createObjectURL(file); audioClipUi.empty.hidden = true;
    if (session.mode === "video") {
      audioClipUi.videoStage.hidden = false;
      const video = document.createElement("video"); video.controls = true; video.playsInline = true; video.preload = "metadata";
      video.src = session.objectUrl; video.volume = session.draft.ownVolume;
      video.setAttribute("aria-label", "Vídeo original para escolher o trecho");
      video.addEventListener("play", () => {
        if (!isCurrent()) { video.pause(); return; }
        session.previewVersion = (session.previewVersion || 0) + 1; session.preview?.pause(); session.preview = null; audioClipUi.stop.disabled = false;
      });
      session.sourceVideo = video; document.querySelector("#audio-clip-video-player").replaceChildren(video);
    } else {
      audioClipUi.audio.src = session.objectUrl; audioClipUi.audio.volume = session.draft.ownVolume; audioClipUi.audio.hidden = false;
    }
    audioClipUi.sourceName.textContent = candidate.name;
    setAudioClipRange(Math.min(initialRange?.start ?? 0, candidate.duration), Math.min(initialRange?.end ?? 10, candidate.duration));
    setAudioClipStatus(session.mode === "video" ? "MP4 carregado. O vídeo será salvo e tocará apenas no intervalo escolhido, na caixa do canto." : "Arquivo carregado. Apenas o áudio do trecho escolhido será salvo.", "ready");
  } catch (error) { if (isCurrent() && error?.name !== "AbortError") { session.busy = false; setAudioClipStatus(audioAdditionErrorMessage(error), "error"); } }
  finally { if (isCurrent()) { session.busy = false; syncAudioClipControls(); } }
}



async function openAudioClipEditor(key, { mode = "file", file = null, editExisting = false } = {}) {
  if (!ROLL_SOUND_KEYS.includes(key) || !accountSettingsDraft || settingsBusy || !settingsSoundContext?.canEdit) return;
  if (audioClipSession) closeAudioClipEditor({ restoreSettings: false });
  const session = audioClipSession = { key, draft: accountSettingsDraft, epoch: accountRollEpoch, soundContext: settingsSoundContext,
    mode, loadVersion: 0, busy: false, opener: document.activeElement };
  audioClipUi.file.value = ""; audioClipUi.videoFile.value = ""; audioClipUi.start.value = "0:00"; audioClipUi.end.value = "0:00";
  document.querySelector("#audio-clip-outcome").textContent = document.querySelector(`[data-outcome="${key}"] strong`)?.textContent || "Som da rolagem";
  rollAccountUi.settingsModal.hidden = true; audioClipUi.modal.hidden = false;
  setAudioClipSourceMode(mode); clearAudioClipSource(); setAudioClipStatus("O som atual da ficha será mantido até você aplicar o novo trecho.");
  syncAudioClipControls(); syncModalLock(); audioClipUi.dialog.focus();
  if (file) { await loadAudioClipFile(file); return; }
  if (!editExisting) { (mode === "video" ? audioClipUi.videoFile : audioClipUi.file).focus(); return; }
  const staged = stagedRollSounds[key], ref = session.draft.sounds[key], existing = staged || ref;
  if (existing?.kind === "youtube") { setAudioClipStatus("A opção do YouTube foi removida. Envie um arquivo de áudio ou MP4 para substituir esse som.", "error"); return; }
  if (existing?.kind === "video") setAudioClipSourceMode("video");
  if (staged?.sourceFile) { await loadAudioClipFile(staged.sourceFile, staged.selectedRange); return; }
  if (!staged?.source && !ref) return;
  session.busy = true; syncAudioClipControls(); setAudioClipStatus("Carregando o arquivo salvo nesta ficha…", "loading");
  try {
    const source = staged?.source || await readSharedRollAudio(ref);
    if (!isAudioClipSessionCurrent(session)) return;
    const response = await fetch(source), blob = await response.blob();
    if (!isAudioClipSessionCurrent(session)) return;
    const savedFile = new File([blob], existing.name || "Áudio.wav", { type: existing.mimeType });
    await loadAudioClipFile(savedFile, existing.kind === "video" ? { start: existing.startSeconds, end: existing.endSeconds } : { start: 0, end: Number.MAX_SAFE_INTEGER });
  } catch (error) { if (isAudioClipSessionCurrent(session)) { session.busy = false; setAudioClipStatus(audioAdditionErrorMessage(error), "error"); syncAudioClipControls(); } }
}

function closeAudioClipEditor({ restoreSettings = true, applied = false } = {}) {
  const session = audioClipSession;
  if (!session) return;
  settingsSoundReadVersions[session.key] = (settingsSoundReadVersions[session.key] || 0) + 1;
  clearAudioClipSource(); audioClipSession = null;
  audioClipUi.modal.hidden = true;
  if (restoreSettings && session.draft === accountSettingsDraft) {
    rollAccountUi.settingsModal.hidden = false;
    if (!applied) {
      const staged = stagedRollSounds[session.key], saved = session.draft.sounds[session.key];
      setSettingsSoundFeedback(session.key, staged ? "selected" : saved ? "saved" : "default",
        staged ? "O trecho anterior foi mantido. Salve as configurações para confirmar." : saved ? "Seu som salvo foi mantido." : "Som padrão ativo.");
    }
    updateSettingsFormAvailability();
    (session.opener?.isConnected ? session.opener : rollAccountUi.settingsDialog).focus();
  }
  syncModalLock();
}

async function previewAudioClipSelection() {
  const session = audioClipSession, range = getAudioClipSelection();
  if (!isAudioClipSessionCurrent(session) || !range.ok || session.busy) return;
  stopAudioClipPreview(); const previewVersion = session.previewVersion;
  const canPlay = () => isAudioClipSessionCurrent(session) && session.previewVersion === previewVersion && !document.hidden;
  let playback;
  try {
    if (session.mode === "video") {
      playback = await previewMp4RollClip(session.objectUrl, { ...session.clip, startSeconds: range.start, endSeconds: range.end }, session.draft.ownVolume, {
        hostId: "audio-clip-video-player", canPlay, onStatus(message, error) { if (canPlay()) setAudioClipStatus(message, error ? "error" : "ready"); },
      });
      if (!playback) return;
    } else {
      const context = await unlockOutcomeAudio(); if (!canPlay()) return;
      if (!context) throw new Error("Este navegador não consegue reproduzir a prévia do trecho.");
      playback = playBufferedOutcomeSound(session.buffer, session.draft.ownVolume, context, range.start, range.duration);
    }
    if (!canPlay()) { playback?.pause(); return; }
    session.preview = playback; audioClipUi.stop.disabled = false;
    if (session.mode === "file") setAudioClipStatus(`Prévia do trecho ${formatAudioClipTime(range.start)}–${formatAudioClipTime(range.end)}.`, "ready");
  } catch (error) { if (canPlay() && error?.name !== "AbortError") setAudioClipStatus(audioAdditionErrorMessage(error), "error"); }
}

async function applyAudioClipSelection() {
  const session = audioClipSession, range = getAudioClipSelection();
  if (!isAudioClipSessionCurrent(session) || session.busy) return;
  if (!range.ok) { setAudioClipStatus(range.error, "error"); return; }
  stopAudioClipPreview(); session.busy = true; syncAudioClipControls(); setAudioClipStatus("Preparando o trecho escolhido…", "processing");
  try {
    if (session.mode === "video") {
      const version = settingsSoundReadVersions[session.key] = (settingsSoundReadVersions[session.key] || 0) + 1;
      const staged = await readSettingsMedia(() => stageVideoRollSound(session.file, range.start, range.end, {
        sourceDuration: session.duration, signal: session.abort?.signal,
        isCurrent: () => isAudioClipSessionCurrent(session) && version === settingsSoundReadVersions[session.key],
      }));
      if (!staged || !isAudioClipSessionCurrent(session) || version !== settingsSoundReadVersions[session.key]) return;
      stagedRollSounds[session.key] = staged;
    } else {
      const wav = encodeAudioClipWav(session.buffer, range.start, range.end);
      const file = new File([wav], audioClipFileName(session.file.name, range.start, range.end), { type: "audio/wav" });
      const staged = await readSettingsMedia(() => stageRollSound(session.key, file));
      if (!staged || !isAudioClipSessionCurrent(session)) return;
      stagedRollSounds[session.key].sourceFile = session.file; stagedRollSounds[session.key].selectedRange = { start: range.start, end: range.end };
    }
    if (!isAudioClipSessionCurrent(session)) return;
    const key = session.key; renderSettingsSoundNames(); closeAudioClipEditor({ applied: true });
    setSettingsSoundFeedback(key, "selected", "Trecho escolhido! Clique em “Ouvir” para testar e em “Salvar configurações” para salvar nesta ficha.");
    setRollFeatureStatus(rollAccountUi.settingsStatus, "Trecho preparado. Salve as configurações para usá-lo nas rolagens desta ficha.");
  } catch (error) { if (isAudioClipSessionCurrent(session)) setAudioClipStatus(audioAdditionErrorMessage(error), "error"); }
  finally { if (isAudioClipSessionCurrent(session)) { session.busy = false; syncAudioClipControls(); } }
}

document.querySelectorAll("[data-close-audio-clip]").forEach((button) => button.addEventListener("click", () => closeAudioClipEditor()));
document.querySelectorAll("[data-audio-clip-source]").forEach((tab) => {
  tab.addEventListener("click", () => { setAudioClipSourceMode(tab.dataset.audioClipSource); syncAudioClipControls(); });
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); const mode = event.key === "Home" ? "file" : event.key === "End" ? "video" : tab.dataset.audioClipSource === "file" ? "video" : "file";
    setAudioClipSourceMode(mode); document.querySelector(`[data-audio-clip-source="${mode}"]`).focus();
  });
});
audioClipUi.file.addEventListener("change", () => loadAudioClipFile(audioClipUi.file.files?.[0]));
audioClipUi.videoFile.addEventListener("change", () => loadAudioClipFile(audioClipUi.videoFile.files?.[0]));
for (const [slider, input] of [[audioClipUi.startRange, audioClipUi.start], [audioClipUi.endRange, audioClipUi.end]]) {
  slider.addEventListener("input", () => { stopAudioClipPreview(); input.value = formatAudioClipTime(Number(slider.value)); syncAudioClipControls({ showError: true }); });
  input.addEventListener("input", () => { stopAudioClipPreview(); syncAudioClipControls({ showError: true }); });
  input.addEventListener("change", () => { const value = parseAudioClipTime(input.value); if (value != null) input.value = formatAudioClipTime(value); syncAudioClipControls({ showError: true }); });
}
audioClipUi.preview.addEventListener("click", previewAudioClipSelection);
audioClipUi.stop.addEventListener("click", stopAudioClipPreview);
audioClipUi.apply.addEventListener("click", applyAudioClipSelection);
audioClipUi.audio.addEventListener("play", () => { if (audioClipSession) { audioClipSession.previewVersion = (audioClipSession.previewVersion || 0) + 1; audioClipSession.preview?.pause(); audioClipSession.preview = null; audioClipUi.stop.disabled = false; } });
document.querySelectorAll("[data-video-audio-outcome]").forEach((button) => button.addEventListener("click", () => openAudioClipEditor(button.dataset.videoAudioOutcome, { mode: "video" })));
document.querySelectorAll("[data-edit-audio-outcome]").forEach((button) => button.addEventListener("click", () => openAudioClipEditor(button.dataset.editAudioOutcome, { editExisting: true })));
document.addEventListener("visibilitychange", () => { if (document.hidden) stopAudioClipPreview(); });


bindSlotDragInteractions();

window.AbyssCloud = Object.freeze({
  isSignedIn: () => Boolean(currentFirebaseUser),
  hasActiveSlot: () => Boolean(currentFirebaseUser && currentSlotId),
  isMinervaAdmin,
  uploadAbilityMedia,
  deleteMedia,
  loadGrimoire,
  saveMinervaAbility,
  deleteMinervaAbility,
  saveMinervaItem,
  deleteMinervaItem,
  renderSlots,
  openSlotFolders,
  getRollContext,
  getOwnRollVolume: () => currentAccountSettings.ownVolume,
  recordRoll: (event) => recordCompletedRoll(event).catch(reportRollHistoryError),
  describeError: describeFirebaseError,
});

function scheduleCloudSave() {
  if (!currentFirebaseUser || isHydratingCloudState) return;
  if (campaignSheetSession && !campaignSheetSession.canEdit) return;
  window.clearTimeout(cloudSaveTimer);
  setSyncStatus(
    "saving",
    "Alterações pendentes",
    "Aguardando sincronização",
    "As mudanças serão enviadas automaticamente em instantes.",
  );
  cloudSaveTimer = window.setTimeout(() => flushCloudSave(), 850);
}

async function flushCloudSave() {
  window.clearTimeout(cloudSaveTimer);
  const signedUser = currentFirebaseUser;
  const session = campaignSheetSession ? { ...campaignSheetSession } : null;
  if (session && !session.canEdit) return true;
  const user = session
    ? { uid: session.ownerUid, displayName: session.ownerName || "", email: "", photoURL: "" }
    : signedUser;
  const slotId = session?.slotId || currentSlotId;
  if (!user || !slotId || !sheetBridge) return false;
  if (!navigator.onLine) {
    setSyncStatus(
      "offline",
      "Não salvo",
      "Sem conexão",
      "As alterações atuais ainda não foram salvas. Mantenha esta página aberta e reconecte-se.",
    );
    return false;
  }
  const isSaveContextCurrent = () =>
    currentFirebaseUser?.uid === signedUser?.uid &&
    (session
      ? campaignSheetSession?.token === session.token
      : !campaignSheetSession && currentSlotId === slotId);
  const finishSavingChanges = async (pendingSave) => {
    const saved = await pendingSave;
    if (!saved || !isSaveContextCurrent()) return false;
    // Edits made during a write must also finish before a caller changes Slots.
    return stateRevision > lastSavedRevision ? flushCloudSave() : true;
  };
  if (cloudSavePromise) return finishSavingChanges(cloudSavePromise);

  const revisionBeingSaved = stateRevision;
  const state = sheetBridge.captureState();
  setSyncStatus(
    "saving",
    "Salvando…",
    "Sincronizando ficha",
    "Enviando as alterações para a sua conta Google.",
  );
  firebaseUi.syncNow.disabled = true;
  cloudSavePromise = (async () => {
    try {
      await writeCloudSheet(user, slotId, state, { skipDirectoryWrites: Boolean(session), campaignSession: session });
      if (session) {
        await firestoreApi.setDoc(
          firestoreApi.doc(firestoreDb, "campaigns", session.campaignId, "sheets", session.sheetId),
          {
            slotName: characterSlotName(state.profile?.name),
            characterName: characterSlotName(state.profile?.name),
            portrait: await compactPortraitForFirestore(String(state.profile?.portrait || "")),
            updatedAt: firestoreApi.serverTimestamp(),
          },
          { merge: true },
        );
      }
      if (!isSaveContextCurrent()) return false;
      lastSavedRevision = Math.max(lastSavedRevision, revisionBeingSaved);
      setSyncStatus(
        "saved",
        "Salvo na conta",
        session ? "Ficha da Campanha sincronizada" : "Ficha sincronizada",
        session
          ? "As alterações foram aplicadas diretamente ao Slot vinculado."
          : "Todas as alterações estão salvas nesta conta Google.",
      );
      return true;
    } catch (error) {
      setSyncStatus(
        navigator.onLine ? "error" : "offline",
        navigator.onLine ? "Erro ao salvar" : "Offline",
        "Sincronização interrompida",
        describeFirebaseError(error),
      );
      openAccountMenu();
      return false;
    } finally {
      cloudSavePromise = null;
      firebaseUi.syncNow.disabled = false;
      if (
        isSaveContextCurrent() &&
        stateRevision > revisionBeingSaved
      ) {
        scheduleCloudSave();
      }
    }
  })();
  return finishSavingChanges(cloudSavePromise);
}

async function hydrateUserSheet(user) {
  ++authChangeSequence;
  isHydratingCloudState = true;
  setSyncStatus(
    "saving",
    "Carregando Slots…",
    "Abrindo sua conta",
    "Buscando as fichas vinculadas a esta conta.",
  );
  try {
    await initializeUserSlots(user);
    if (currentFirebaseUser?.uid !== user.uid) return;
    renderSlots();
    renderStartupSlotChoices();
    closeAccountMenu();
  } catch (error) {
    if (currentFirebaseUser?.uid !== user.uid) return;
    setSyncStatus(
      navigator.onLine ? "error" : "offline",
      navigator.onLine ? "Erro de acesso" : "Offline",
      "Não foi possível abrir a nuvem",
      describeFirebaseError(error),
    );
    showStartupSlotGateError(describeFirebaseError(error));
  } finally {
    if (currentFirebaseUser?.uid === user.uid) isHydratingCloudState = false;
  }
}

firebaseUi.startupGateList.addEventListener("click", async (event) => {
  if (startupCreateBusy || isHydratingCloudState) return;
  const folder = event.target.closest("[data-startup-folder]");
  if (folder && currentFirebaseUser) {
    startupSlotFolderId = folder.dataset.startupFolder;
    renderStartupSlotChoices();
    firebaseUi.startupFolderBack.focus();
    return;
  }
  const choice = event.target.closest("[data-startup-slot]");
  if (!choice || !currentFirebaseUser) return;
  const slotId = choice.dataset.startupSlot;
  const user = currentFirebaseUser;
  const epoch = accountRollEpoch;
  setStartupCreateAvailability(true);
  firebaseUi.startupGateSpinner.hidden = false;
  firebaseUi.startupGate.setAttribute("aria-busy", "true");
  firebaseUi.startupGateStatus.textContent = "Abrindo a ficha escolhida…";
  try {
    await hydrateSlot(user, slotId);
    if (epoch !== accountRollEpoch || currentFirebaseUser?.uid !== user.uid) return;
    if (currentSlotId === slotId) {
      closeStartupSlotGate();
      renderAccountIdentity(currentFirebaseUser, "signed-in");
    }
  } catch (error) {
    if (epoch === accountRollEpoch && currentFirebaseUser?.uid === user.uid) showStartupSlotGateError(describeFirebaseError(error));
  } finally {
    if (epoch === accountRollEpoch && currentFirebaseUser?.uid === user.uid) {
      setStartupCreateAvailability(false);
      firebaseUi.startupGateSpinner.hidden = true;
      firebaseUi.startupGate.setAttribute("aria-busy", "false");
    }
  }
});

firebaseUi.startupFolderBack.addEventListener("click", () => {
  if (startupCreateBusy || isHydratingCloudState) return;
  startupSlotFolderId = null;
  renderStartupSlotChoices();
  firebaseUi.startupGateList.querySelector("button")?.focus();
});

firebaseUi.startupGateRetry.addEventListener("click", () => {
  if (startupCreateBusy || isHydratingCloudState) return;
  if (currentFirebaseUser) {
    openStartupSlotGate();
    hydrateUserSheet(currentFirebaseUser);
  }
});

firebaseUi.startupGateSignOut.addEventListener("click", () => {
  if (startupCreateBusy || isHydratingCloudState) return;
  requestFirebaseSignOut();
});

firebaseUi.startupCreateButton.addEventListener("click", () => {
  if (firebaseUi.startupCreateForm.hidden) openStartupCreateSheet();
  else closeStartupCreateSheet();
});
firebaseUi.startupCreateCancel.addEventListener("click", () => closeStartupCreateSheet());
firebaseUi.startupCreateForm.addEventListener("submit", submitStartupCreateSheet);

document.addEventListener("keydown", (event) => {
  if (firebaseUi.startupGate.hidden) return;
  if (event.key === "Escape") {
    if (!firebaseUi.startupCreateForm.hidden) closeStartupCreateSheet();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...firebaseUi.startupGate.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && element.getClientRects().length);
  if (!focusable.length) {
    event.preventDefault();
    firebaseUi.startupGateDialog.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === firebaseUi.startupGateDialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}, true);

async function requestFirebaseLogin() {
  if (!firebaseAuth || !authApi) {
    if (firebaseConfigIsReady()) {
      await initializeFirebaseSync();
      if (firebaseAuth && authApi) return requestFirebaseLogin();
    }
    openAccountMenu();
    return;
  }
  renderAccountIdentity(null, "signing-in");
  setSyncStatus(
    "saving",
    "Abrindo Google…",
    "Entrar com o Google",
    "Escolha a conta que guardará esta ficha.",
  );
  try {
    const provider = new authApi.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await authApi.signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    renderAccountIdentity(null, "error");
    setSyncStatus(
      "error",
      "Login não concluído",
      "Não foi possível entrar",
      describeFirebaseError(error),
    );
    openAccountMenu();
  }
}

async function requestFirebaseSignOut() {
  if (!firebaseAuth || !authApi || !currentFirebaseUser) return;
  firebaseUi.signOut.disabled = true;
  try {
    if (cloudSavePromise && !(await cloudSavePromise)) return;
    if (stateRevision > lastSavedRevision && !(await flushCloudSave())) return;
    await authApi.signOut(firebaseAuth);
  } catch (error) {
    setSyncStatus(
      "error",
      "Erro ao sair",
      "Não foi possível desconectar",
      describeFirebaseError(error),
    );
  } finally {
    firebaseUi.signOut.disabled = false;
  }
}

firebaseUi.reset.addEventListener("click", requestResetConfirmation);
firebaseUi.exportSheet.addEventListener("click", () => openSheetTransfer("export"));
firebaseUi.importSheet.addEventListener("click", () => openSheetTransfer("import"));
firebaseUi.slotsExportCurrent.addEventListener("click", () => openSheetTransfer("export", {
  slotId: currentSlotId,
  trigger: firebaseUi.slotsExportCurrent,
}));
firebaseUi.slotsImportCode.addEventListener("click", () => openSheetTransfer("import-new", {
  trigger: firebaseUi.slotsImportCode,
}));
firebaseUi.transferPrimary.addEventListener("click", () => {
  if (sheetTransferMode === "import-new") importSheetTransferAsNewSlot();
  else if (sheetTransferMode === "import") importSheetTransferCode();
  else generateSheetTransferCode();
});
firebaseUi.transferCopy.addEventListener("click", async () => {
  const code = firebaseUi.transferCode.value;
  if (!code || code === "Gerando código…") return;
  try {
    await navigator.clipboard.writeText(code);
    setSheetTransferStatus("Código copiado para a área de transferência.");
  } catch {
    firebaseUi.transferCode.focus();
    firebaseUi.transferCode.select();
    setSheetTransferStatus("O código foi selecionado. Use Ctrl+C ou toque em Copiar.");
  }
});
firebaseUi.transferCode.addEventListener("input", () => {
  updateSheetTransferCount();
  if (sheetTransferMode.startsWith("import")) setSheetTransferStatus("Pronto para validar e importar.");
});
document.querySelectorAll("[data-close-sheet-transfer]").forEach((button) => {
  button.addEventListener("click", closeSheetTransfer);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || firebaseUi.transferModal.hidden) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  closeSheetTransfer();
}, true);

firebaseUi.createSlotFolderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = firebaseUi.createSlotFolderForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  setSlotFolderStatus("Criando pasta…");
  try {
    await createCloudSlotFolder(firebaseUi.newSlotFolderName.value);
    firebaseUi.newSlotFolderName.value = "";
    firebaseUi.newSlotName.focus();
  } catch (error) {
    setSlotFolderStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true);
  } finally {
    submit.disabled = false;
  }
});

firebaseUi.slotsFolderBack.addEventListener("click", () => {
  openSlotFolders();
  firebaseUi.slotsFolderList.querySelector("[data-open-all-slots]")?.focus();
});

firebaseUi.createSlotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = characterSlotName(
    firebaseUi.newSlotName.value,
    `Personagem ${currentSlots.length + 1}`,
  );
  const submit = firebaseUi.createSlotForm.querySelector('button[type="submit"]');
  submit.disabled = true;

  try {
    if (cloudSavePromise && !(await cloudSavePromise)) return;
    if (stateRevision > lastSavedRevision && !(await flushCloudSave())) return;
    const slot = await createCloudSlot(name, { folderId: normalizeSlotFolderId(firebaseUi.newSlotFolder.value) });
    currentSlotFolderId = getSlotFolderId(slot);
    renderSlots();
    firebaseUi.newSlotName.value = "";
  } catch (error) {
    setSyncStatus(
      "error",
      "Erro no Slot",
      "Não foi possível criar",
      describeFirebaseError(error),
    );
    openAccountMenu();
  } finally {
    submit.disabled = false;
  }
});

firebaseUi.slotsSearch.addEventListener("input", renderSlots);

firebaseUi.slotsList.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-quick-move-slot]");
  if (!select) return;
  const userUid = currentFirebaseUser?.uid;
  const epoch = accountRollEpoch;
  const restoreFocus = document.activeElement === select;
  select.disabled = true;
  try {
    const moved = await moveCloudSlot(select.dataset.quickMoveSlot, select.value);
    if (moved && restoreFocus && currentFirebaseUser?.uid === userUid && accountRollEpoch === epoch
      && !document.querySelector("#slots-modal").hidden
      && (document.activeElement === select || document.activeElement === document.body)) {
      const row = firebaseUi.slotsList.querySelector(`[data-slot-id="${CSS.escape(select.dataset.quickMoveSlot)}"]`);
      const destination = firebaseUi.slotsFolderList.querySelector(`[data-open-slot-folder="${CSS.escape(select.value)}"]`);
      (row?.querySelector(".slot-more-actions > summary") || destination || firebaseUi.slotsSearch).focus();
    }
    if (!moved && select.isConnected && currentFirebaseUser?.uid === userUid && accountRollEpoch === epoch) {
      const slot = currentSlots.find((entry) => entry.id === select.dataset.quickMoveSlot);
      if (slot) select.value = getSlotFolderId(slot);
    }
  }
  catch (error) {
    if (currentFirebaseUser?.uid === userUid && accountRollEpoch === epoch) {
      setSlotFolderStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true);
      const slot = currentSlots.find((entry) => entry.id === select.dataset.quickMoveSlot);
      if (slot) select.value = getSlotFolderId(slot);
    }
  } finally {
    if (select.isConnected) {
      select.disabled = false;
      if (restoreFocus && currentFirebaseUser?.uid === userUid && accountRollEpoch === epoch
        && !document.querySelector("#slots-modal").hidden && document.activeElement === document.body) select.focus();
    }
  }
});

firebaseUi.slotsDialog.addEventListener("click", async (event) => {
  const allOpen = event.target.closest("[data-open-all-slots]");
  const folderOpen = event.target.closest("[data-open-slot-folder]");
  if (allOpen || folderOpen) {
    currentSlotFolderId = folderOpen ? folderOpen.dataset.openSlotFolder : null;
    firebaseUi.slotsSearch.value = "";
    setSlotFolderStatus();
    renderSlots();
    const selector = folderOpen ? `[data-open-slot-folder="${CSS.escape(currentSlotFolderId)}"]` : "[data-open-all-slots]";
    firebaseUi.slotsFolderList.querySelector(selector)?.focus();
    return;
  }
  const folderRename = event.target.closest("[data-rename-slot-folder]");
  if (folderRename) {
    beginSlotFolderRename(folderRename.dataset.renameSlotFolder);
    return;
  }
  const folderDelete = event.target.closest("[data-delete-slot-folder]");
  if (folderDelete) {
    folderDelete.disabled = true;
    try { await deleteCloudSlotFolder(folderDelete.dataset.deleteSlotFolder); }
    catch (error) { setSlotFolderStatus(userFacingErrorMessage(error) || describeFirebaseError(error), true); }
    finally { if (folderDelete.isConnected) folderDelete.disabled = false; }
    return;
  }
  const open = event.target.closest("[data-open-slot]");
  const exportSlot = event.target.closest("[data-export-slot]");
  const rename = event.target.closest("[data-rename-slot]");
  const remove = event.target.closest("[data-delete-slot]");
  const action = open || exportSlot || rename || remove;
  if (!action || action.disabled) return;

  action.disabled = true;
  try {
    if (open) await switchCloudSlot(open.dataset.openSlot);
    else if (exportSlot) openSheetTransfer("export", { slotId: exportSlot.dataset.exportSlot, trigger: exportSlot });
    else if (rename) beginSlotRename(rename.dataset.renameSlot);
    else await deleteCloudSlot(remove.dataset.deleteSlot);
  } catch (error) {
    setSyncStatus("error", "Erro no Slot", "Operação não concluída", describeFirebaseError(error));
    openAccountMenu();
  } finally { if (action.isConnected) action.disabled = false; }
});

window.addEventListener("abyss:slot-sounds-loaded", handleSlotSoundsLoaded);
window.addEventListener("abyss:sheet-changed", (event) => {
  if (!isHydratingCloudState && event.detail?.reason === "profile" && currentFirebaseUser) {
    const ownerUid = campaignSheetSession?.ownerUid || currentFirebaseUser.uid;
    const slotId = campaignSheetSession?.slotId || currentSlotId;
    if (slotId && (!campaignSheetSession || campaignSheetSession.canEdit)) {
      syncCharacterSlotName(ownerUid, slotId, sheetBridge.captureState().profile?.name);
    }
  }
  stateRevision += 1;
  if (currentFirebaseUser) scheduleCloudSave();
});
window.addEventListener("abyss:firebase-login", requestFirebaseLogin);
window.addEventListener("abyss:firebase-sync-now", () => {
  unlockOutcomeAudio().catch(reportOutcomeAudioError);
  flushCloudSave();
  reconnectRollCampaignAudio().catch((error) => { reportRollHistoryError(error); reportOutcomeAudioError(error); });
});
window.addEventListener("abyss:firebase-sign-out", requestFirebaseSignOut);
window.addEventListener("offline", () => {
  if (currentFirebaseUser) {
    setSyncStatus(
      "offline",
      "Não salvo",
      "Sem conexão",
      "As alterações atuais ainda não foram salvas. Mantenha esta página aberta e reconecte-se.",
    );
  }
});
window.addEventListener("online", () => {
  if (currentFirebaseUser && stateRevision > lastSavedRevision) flushCloudSave();
  if (currentFirebaseUser) reconnectRollCampaignAudio().catch((error) => { reportRollHistoryError(error); reportOutcomeAudioError(error); });
});

function campaignCardActivation(event) {
  const card = event.target.closest("[data-campaign-id]");
  if (!card) return;
  if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
  if (event.type === "keydown") event.preventDefault();
  openCampaignDetail(card.dataset.campaignId);
}

function trapCampaignModalFocus(event) {
  if (event.key !== "Tab") return;
  const modal = [...document.querySelectorAll(".campaign-modal")].filter((item) => !item.hidden).at(-1);
  if (!modal) return;
  const focusable = [...modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.closest("[hidden]"));
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || document.activeElement === modal.querySelector("[role=dialog]"))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

window.addEventListener("abyss:campaign-open", openCampaignPortal);
campaignUi.exit.addEventListener("click", closeCampaignPortal);
campaignUi.masterList.addEventListener("click", campaignCardActivation);
campaignUi.masterList.addEventListener("keydown", campaignCardActivation);
campaignUi.playerList.addEventListener("click", campaignCardActivation);
campaignUi.playerList.addEventListener("keydown", campaignCardActivation);
campaignUi.createButtons.forEach((button) => button.addEventListener("click", () => openCampaignEditor()));
campaignUi.joinButtons.forEach((button) => button.addEventListener("click", openCampaignJoin));
campaignUi.detailBack.addEventListener("click", showCampaignDashboard);
campaignUi.shieldButton.addEventListener("click", openCampaignShield);
campaignUi.shieldBack.addEventListener("click", closeCampaignShield);
campaignUi.shieldHideStats.addEventListener("change", () => toggleCampaignShieldStats(campaignUi.shieldHideStats));
campaignUi.attachSheet.addEventListener("click", openCampaignSlotPicker);
campaignUi.edit.addEventListener("click", () => openCampaignEditor(activeCampaign));
campaignUi.leave.addEventListener("click", () => leaveActiveCampaign(campaignUi.leave));
campaignUi.remove.addEventListener("click", () => deleteActiveCampaign(campaignUi.remove));
campaignUi.copyCode.addEventListener("click", () => copyText(activeCampaign?.joinCode || "", "Código copiado", campaignUi.copyCode));
campaignUi.editorForm.addEventListener("submit", submitCampaignEditor);
campaignUi.joinForm.addEventListener("submit", submitCampaignJoin);
campaignUi.slotForm.addEventListener("submit", submitCampaignSlot);
campaignUi.sheetSessionBack.addEventListener("click", closeCampaignSheetSession);

campaignUi.joinCode.addEventListener("input", () => {
  campaignUi.joinCode.value = normalizeCampaignCode(campaignUi.joinCode.value);
});
campaignUi.bannerUrl.addEventListener("input", () => {
  campaignBannerCropped = "";
  campaignUi.bannerFile.value = "";
  updateCampaignBannerPreview(campaignUi.bannerUrl.value || campaignBannerDraft);
});
campaignUi.bannerFile.addEventListener("change", async () => {
  const file = campaignUi.bannerFile.files?.[0];
  if (!file) {
    updateCampaignBannerPreview();
    return;
  }
  try {
    setCampaignFormError(campaignUi.editorError);

    await openCampaignBannerCrop(file);
  } catch (error) {
    campaignUi.bannerFile.value = "";
    setCampaignFormError(campaignUi.editorError, userFacingErrorMessage(error) || "Não foi possível abrir o Banner.");
  }
});

campaignUi.bannerCropApply.addEventListener("click", applyCampaignBannerCrop);
campaignUi.bannerCenter.addEventListener("click", centerCampaignBannerCrop);
campaignUi.bannerZoom.addEventListener("input", () => setCampaignBannerZoom(campaignUi.bannerZoom.value));
campaignUi.bannerZoomOut.addEventListener("click", () => setCampaignBannerZoom(campaignBannerCropState.zoom - .1));
campaignUi.bannerZoomIn.addEventListener("click", () => setCampaignBannerZoom(campaignBannerCropState.zoom + .1));

campaignUi.bannerCropViewport.addEventListener("pointerdown", (event) => {
  if (!campaignBannerCropState.image) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (campaignBannerCropState.pointerId !== null) return;
  event.preventDefault();
  campaignBannerCropState.pointerId = event.pointerId;
  campaignBannerCropState.dragStartX = event.clientX;
  campaignBannerCropState.dragStartY = event.clientY;
  campaignBannerCropState.originX = campaignBannerCropState.x;
  campaignBannerCropState.originY = campaignBannerCropState.y;
  campaignUi.bannerCropViewport.classList.add("is-dragging");
  try {
    campaignUi.bannerCropViewport.setPointerCapture(event.pointerId);
  } catch {
    // O acompanhamento global mantém o arraste em navegadores sem captura.
  }
});

window.addEventListener("pointermove", (event) => {
  if (campaignBannerCropState.pointerId !== event.pointerId) return;
  event.preventDefault();
  campaignBannerCropState.x = campaignBannerCropState.originX + event.clientX - campaignBannerCropState.dragStartX;
  campaignBannerCropState.y = campaignBannerCropState.originY + event.clientY - campaignBannerCropState.dragStartY;
  renderCampaignBannerCrop();
}, { passive: false });

function finishCampaignBannerDrag(event) {
  if (campaignBannerCropState.pointerId !== event.pointerId) return;
  const pointerId = campaignBannerCropState.pointerId;
  campaignBannerCropState.pointerId = null;
  campaignUi.bannerCropViewport.classList.remove("is-dragging");
  if (campaignUi.bannerCropViewport.hasPointerCapture?.(pointerId)) {
    campaignUi.bannerCropViewport.releasePointerCapture(pointerId);
  }
}

window.addEventListener("pointerup", finishCampaignBannerDrag);
window.addEventListener("pointercancel", finishCampaignBannerDrag);
campaignUi.bannerCropViewport.addEventListener("lostpointercapture", finishCampaignBannerDrag);
campaignUi.bannerCropImage.addEventListener("dragstart", (event) => event.preventDefault());
campaignUi.bannerCropViewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  setCampaignBannerZoom(campaignBannerCropState.zoom + (event.deltaY < 0 ? .08 : -.08));
}, { passive: false });
campaignUi.bannerCropViewport.addEventListener("keydown", (event) => {
  const movement = event.shiftKey ? 20 : 8;
  const direction = {
    ArrowLeft: [-movement, 0],
    ArrowRight: [movement, 0],
    ArrowUp: [0, -movement],
    ArrowDown: [0, movement],
  }[event.key];
  if (!direction) return;
  event.preventDefault();
  campaignBannerCropState.x += direction[0];
  campaignBannerCropState.y += direction[1];
  renderCampaignBannerCrop();
});
window.addEventListener("resize", () => {
  if (!campaignUi.bannerCropModal.hidden) renderCampaignBannerCrop();
});

document.querySelectorAll("[data-close-campaign-editor]").forEach((button) => button.addEventListener("click", closeCampaignEditor));
document.querySelectorAll("[data-close-campaign-banner-crop]").forEach((button) => button.addEventListener("click", () => closeCampaignBannerCrop()));
document.querySelectorAll("[data-close-campaign-join]").forEach((button) => button.addEventListener("click", closeCampaignJoin));
document.querySelectorAll("[data-close-campaign-slot]").forEach((button) => button.addEventListener("click", closeCampaignSlotPicker));

campaignUi.sheetList.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-campaign-sheet]");
  if (open) {
    openCampaignSheet(open.dataset.openCampaignSheet, open);
    return;
  }
  const privacy = event.target.closest("[data-toggle-campaign-sheet-privacy]");
  if (privacy) {
    toggleCampaignSheetPrivacy(privacy.dataset.toggleCampaignSheetPrivacy, privacy);
    return;
  }
  const unlink = event.target.closest("[data-unlink-campaign-sheet]");
  if (unlink) unlinkCampaignSheet(unlink.dataset.unlinkCampaignSheet, unlink);
});

campaignUi.shieldRoster.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-campaign-shield-sheet]");
  if (open) openCampaignSheet(open.dataset.openCampaignShieldSheet, open);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!campaignUi.bannerCropModal.hidden) closeCampaignBannerCrop();
    else if (!campaignUi.slotModal.hidden) closeCampaignSlotPicker();
    else if (!campaignUi.joinModal.hidden) closeCampaignJoin();
    else if (!campaignUi.editorModal.hidden) closeCampaignEditor();
  }
  trapCampaignModalFocus(event);
});

async function initializeFirebaseSync() {
  if (!sheetBridge) {
    closeStartupSlotGate();
    renderAccountIdentity(null, "error");
    setSyncStatus(
      "error",
      "Ficha indisponível",
      "Falha ao preparar a ficha",
      describeFirebaseError({ code: "abyss/bridge-missing" }),
    );
    return;
  }
  if (!firebaseConfigIsReady()) {
    closeStartupSlotGate();
    renderAccountIdentity(null, "missing");
    setSyncStatus(
      "idle",
      "Conexão pendente",
      "Conta indisponível",
      "Não foi possível conectar sua conta. Sem login, a ficha atual é apenas temporária.",
    );
    return;
  }

  try {
    const sdkBase = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
    const [appModule, loadedAuthApi, loadedFirestoreApi] = await Promise.all([
      import(`${sdkBase}/firebase-app.js`),
      import(`${sdkBase}/firebase-auth.js`),
      import(`${sdkBase}/firebase-firestore.js`),
    ]);
    authApi = loadedAuthApi;
    firestoreApi = loadedFirestoreApi;
    const app = appModule.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = authApi.getAuth(app);
    firestoreDb = firestoreApi.getFirestore(app);
    firebaseAuth.useDeviceLanguage();
    await authApi.setPersistence(firebaseAuth, authApi.browserLocalPersistence).catch(() => {});

    authApi.onAuthStateChanged(firebaseAuth, async (user) => {
      resetAccountRollSession();
      currentFirebaseUser = user;
      if (!user) {
        clearCampaignSheetSession();
        closeAllCampaignModals();
        campaignRecords = [];
        activeCampaign = null;
        authChangeSequence += 1;
        isHydratingCloudState = false;
        window.clearTimeout(cloudSaveTimer);
        currentSlotId = null;
        currentSlots = [];
        currentSlotFolders = [];
        currentSlotFolderId = null;
        startupSlotFolderId = null;
        setSlotFolderStatus();
        stateRevision = 0;
        lastSavedRevision = 0;
        sheetBridge.resetState();
        preferredStartupSlotId = "";
        closeStartupSlotGate();
        renderAccountIdentity(null, "signed-out");
        renderSlots();
        setSyncStatus(
          "idle",
          "Entrar para salvar",
          "Ficha temporária",
          "Entre com o Google para abrir seus Slots. Nenhum dado desta tela é salvo localmente.",
        );
        return;
      }

      currentSlotId = null;
      currentSlots = [];
      currentSlotFolders = [];
      currentSlotFolderId = null;
      startupSlotFolderId = null;
      setSlotFolderStatus();
      sheetBridge.resetState();
      openStartupSlotGate({ loading: true, message: "Buscando os Slots desta conta…" });
      renderAccountIdentity(user, "signed-in");
      await initializeAccountRollSession(user);
      await hydrateUserSheet(user);
    });
  } catch (error) {
    closeStartupSlotGate();
    renderAccountIdentity(null, "error");
    setSyncStatus(
      "error",
      "Serviço indisponível",
      "Não foi possível iniciar a conexão",
      describeFirebaseError(error),
    );
    openAccountMenu();
  }
}

initializeFirebaseSync();
    