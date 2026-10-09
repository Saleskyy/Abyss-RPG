"use strict";
accountButton.addEventListener("click", () => {
  const state = accountButton.dataset.accountState;
  if (state === "signed-out") {
    requestGoogleLogin();
    return;
  }
  setAccountMenuOpen(accountMenu.hidden);
});

accountLoginButton.addEventListener("click", requestGoogleLogin);
accountSyncNowButton.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("abyss:firebase-sync-now"));
});
accountSignOutButton.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("abyss:firebase-sign-out"));
});
document.querySelector("#close-account-menu").addEventListener("click", () => {
  setAccountMenuOpen(false);
  accountButton.focus();
});
document.addEventListener("pointerdown", (event) => {
  if (!accountMenu.hidden && !accountShell.contains(event.target)) setAccountMenuOpen(false);
});

viewButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const target = button.dataset.viewTarget;
    changeView(target);
    if (target === "shop" && window.AbyssCloud?.isSignedIn()) {
      shopList.setAttribute("aria-busy", "true");
      try {
        await refreshGrimoireFromCloud();
      } catch {
        shopList.replaceChildren();
        shopList.hidden = true;
        shopCount.textContent = "0 produtos";
        shopEmpty.hidden = false;
        shopEmpty.querySelector("strong").textContent = "Não foi possível carregar a Loja";
        shopEmpty.querySelector("p").textContent = "Verifique sua conexão e tente novamente.";
      } finally {
        shopList.removeAttribute("aria-busy");
      }
    }
  });
});

document.querySelector("#create-note").addEventListener("click", (event) => {
  if (isNotebookReadOnly()) return;
  if (!window.AbyssCloud?.hasActiveSlot()) {
    setAccountMenuOpen(true);
    if (!window.AbyssCloud?.isSignedIn()) window.dispatchEvent(new CustomEvent("abyss:firebase-login"));
    return;
  }
  commitOpenNotebookPage();
  if (!createCharacterNotebook(event.currentTarget)) return;
  renderCharacterNotes();
  const nameInput = notesList.querySelector("[data-notebook-title]");
  nameInput?.focus();
  nameInput?.select();
});

document.addEventListener("selectionchange", () => {
  const anchor = window.getSelection()?.anchorNode;
  const editor = (anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement)
    ?.closest?.("[data-note-body]");
  if (editor && notesList.contains(editor)) rememberNoteSelection(editor);
});

notesList.addEventListener("pointerdown", (event) => {
  const tool = event.target.closest(".notes-toolbar [data-note-action]");
  if (!tool) return;
  const editor = tool.closest("[data-note-id]")?.querySelector("[data-note-body]");
  if (editor) rememberNoteSelection(editor);
  event.preventDefault();
});

notesList.addEventListener("input", (event) => {
  if (isNotebookReadOnly()) return;
  const bookId = event.target.closest("[data-notebook-id]")?.dataset.notebookId;
  if (event.target.matches("[data-notebook-title]")) {
    const book = getCharacterNotebook(bookId);
    if (book && !renameCharacterNotebook(bookId, event.target.value, event.target)) event.target.value = book.title;
    return;
  }
  const card = event.target.closest("[data-note-id]");
  const note = getNoteFromCard(card);
  if (!note) return;
  if (event.target.matches("[data-note-title]")) {
    const title = event.target.value.slice(0, 100);
    if (!updateNotebookPage(bookId, note.id, { title }, event.target)) { event.target.value = note.title; return; }
    const book = getCharacterNotebook(bookId);
    const index = book.pages.indexOf(note);
    const tab = [...notesList.querySelectorAll(".notebook-page-tab")].find((button) => button.dataset.pageId === note.id);
    if (tab) tab.querySelector(".notebook-page-name").textContent = title || `Página ${index + 1}`;
  } else if (event.target.matches("[data-note-body]")) {
    commitNoteBody(event.target);
  }
});

notesList.addEventListener("focusout", (event) => {
  if (event.target.matches("[data-note-body]")) commitNoteBody(event.target);
});

notesList.addEventListener("paste", (event) => {
  const editor = event.target.closest("[data-note-body]");
  if (!editor) return;
  event.preventDefault();
  if (isNotebookReadOnly()) return;
  const file = [...(event.clipboardData?.files || [])].find((entry) => entry.type.startsWith("image/"));
  if (file) {
    rememberNoteSelection(editor);
    insertNoteFile(editor.closest("[data-note-id]"), file);
    return;
  }
  const html = event.clipboardData?.getData("text/html") || "";
  const plain = event.clipboardData?.getData("text/plain") || "";
  const safe = html ? sanitizeNoteHtml(html) : escapeHtml(plain).replaceAll("\n", "<br>");
  document.execCommand("insertHTML", false, safe);
  commitNoteBody(editor);
});

notesList.addEventListener("drop", (event) => {
  const editor = event.target.closest("[data-note-body]");
  if (!editor) return;
  event.preventDefault();
  if (isNotebookReadOnly()) return;
  const file = [...(event.dataTransfer?.files || [])].find((entry) => entry.type.startsWith("image/"));
  if (file) {
    rememberNoteSelection(editor);
    insertNoteFile(editor.closest("[data-note-id]"), file);
    return;
  }
  const plain = event.dataTransfer?.getData("text/plain") || "";
  if (plain) {
    editor.focus();
    document.execCommand("insertText", false, plain);
    commitNoteBody(editor);
  }
});
notesList.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-note-body]")) event.preventDefault();
});

notesList.addEventListener("change", (event) => {
  if (!event.target.matches("[data-note-image-file]")) return;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (file) insertNoteFile(event.target.closest("[data-note-id]"), file);
});

notesList.addEventListener("keydown", (event) => {
  if (event.target.matches("[data-notebook-title], [data-note-title]") && event.key === "Enter") {
    event.preventDefault();
    event.target.closest(".notebook-workspace")?.querySelector("[data-note-body]")?.focus();
    return;
  }
  if (!event.target.matches("[data-note-url-input]")) return;
  if (event.key === "Enter") {
    event.preventDefault();
    event.target.closest("[data-note-url-row]").querySelector('[data-note-action="insert-url"]').click();
  } else if (event.key === "Escape") {
    event.preventDefault();
    event.target.closest("[data-note-url-row]").querySelector('[data-note-action="cancel-url"]').click();
  }
});

notesList.addEventListener("click", async (event) => {
  const notebookButton = event.target.closest("[data-notebook-action]");
  if (notebookButton) { await handleNotebookAction(notebookButton); return; }
  const button = event.target.closest("[data-note-action]");
  const card = button?.closest("[data-note-id]");
  if (!button || !card) return;
  if (isNotebookReadOnly()) return;
  const action = button.dataset.noteAction;
  const note = getNoteFromCard(card);
  if (!note) return;

  if (action === "edit") {
    card.querySelector("[data-note-body]").focus();
    return;
  }
  if (action === "duplicate") {
    commitOpenNotebookPage();
    if (!addCharacterNotebookPage(card.dataset.notebookId, note.id, button)) return;
    renderCharacterNotes();
    notesList.querySelector("[data-note-title]")?.focus();
    return;
  }
  if (action === "delete") {
    const epoch = notesEpoch;
    const bookId = card.dataset.notebookId;
    const confirmed = await showAbyssConfirm({
      eyebrow: "Páginas do caderno", title: "Excluir esta página?",
      message: `A página “${note.title || "Sem título"}” e seu conteúdo serão apagados. Se for a última, uma página em branco ficará no lugar.`,
      confirmLabel: "Excluir página", tone: "danger", trigger: button,
    });
    if (!confirmed || epoch !== notesEpoch || !removeCharacterNotebookPage(bookId, note.id)) return;
    renderCharacterNotes();
    notesList.querySelector("[data-note-title]")?.focus();
    return;
  }
  if (action === "image-file") { card.querySelector("[data-note-image-file]").click(); return; }
  if (action === "cancel-url") { card.querySelector("[data-note-url-row]").hidden = true; return; }
  if (action === "link" || action === "image-url") {
    const row = card.querySelector("[data-note-url-row]");
    row.hidden = false;
    row.dataset.urlKind = action === "link" ? "link" : "image";
    const input = row.querySelector("[data-note-url-input]");
    input.placeholder = action === "link" ? "https://exemplo.com" : "https://exemplo.com/imagem.png";
    input.value = "";
    input.focus();
    return;
  }
  if (action === "insert-url") {
    const row = card.querySelector("[data-note-url-row]");
    const url = safeRemoteImageUrl(row.querySelector("[data-note-url-input]").value);
    if (!url) {
      showAbyssAlert({ eyebrow: "Página do caderno", title: "Link inválido", message: "Use um endereço que comece com https:// ou http://.", tone: "warning", trigger: button });
      return;
    }
    if (row.dataset.urlKind === "image") {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Imagem da página";
      insertNodeIntoNote(card, image);
    } else {
      const editor = restoreNoteSelection(card);
      const selectedText = window.getSelection()?.toString() || "";
      if (selectedText) {
        document.execCommand("createLink", false, url);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url;
        insertNodeIntoNote(card, link);
      }
      commitNoteBody(editor);
    }
    row.hidden = true;
    row.querySelector("[data-note-url-input]").value = "";
    return;
  }
  formatCharacterNote(card, action);
});

abilitySectionButtons.forEach((button) => {
  button.addEventListener("click", () => selectAbilitySection(button.dataset.abilitySection));
});

createAbilityButton.addEventListener("click", () => {
  if (!window.AbyssCloud?.hasActiveSlot()) {
    setAccountMenuOpen(true);
    if (!window.AbyssCloud?.isSignedIn()) {
      window.dispatchEvent(new CustomEvent("abyss:firebase-login"));
    }
    return;
  }
  openAbilityEditor("sheet", null, createAbilityButton);
});

openGrimoirePickerButton.addEventListener("click", openGrimoirePicker);
minervaButton.addEventListener("click", openMinervaGrimoire);
minervaUpgradeFilter.addEventListener("change", renderMinervaList);
slotsButton.addEventListener("click", openSlotsManager);
campaignButton.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("abyss:campaign-open"));
});
initializeCreationDescriptionEditor(abilityDescriptionInput);
initializeCreationDescriptionEditor(itemDescriptionInput);
abilityEditorForm.addEventListener("submit", submitAbilityEditor);
abilitySectionSelect.addEventListener("change", () => { updateAbilityEchoField(); updateAbilityUpgradeFields(); });
abilityShopListedInput.addEventListener("change", updateAbilityShopFields);
abilityHasDamageInput.addEventListener("change", () => {
  abilityDamageFields.hidden = !abilityHasDamageInput.checked;
});
abilityGrantsModifiersInput.addEventListener("change", () => {
  abilityModifiersFields.hidden = !abilityGrantsModifiersInput.checked;
});
itemIsWeaponInput.addEventListener("change", () => { if (itemIsWeaponInput.checked && itemTypeSelect.value === "utility") itemTypeSelect.value = "weapon"; updateItemWeaponFields(); });
itemGrantsModifiersInput.addEventListener("change", updateItemModifierFields);
itemShopDestinationSelect.addEventListener("change", updateItemShopDestinationFields);
itemEditorForm.addEventListener("submit", submitItemEditor);
inventorySearchInput.addEventListener("input", renderInventory);
shopSearchInput.addEventListener("input", renderShop);
shopHistoryButton.addEventListener("click", () => openPurchaseHistory(shopHistoryButton));
document.querySelectorAll("[data-close-shop-history]").forEach((button) => {
  button.addEventListener("click", closePurchaseHistory);
});
walletAdjustForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const action = event.submitter?.dataset.walletAction || "add";
  adjustWallet(action, walletAdjustAmountInput.value, event.submitter);
});
shopList.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-shop-id]");
  if (open) {
    openAbilityDetail(
      open.dataset.openShopId,
      open,
      open.dataset.openShopKind === "item" ? "minerva-item" : "minerva",
    );
    return;
  }
  const buy = event.target.closest("[data-buy-shop-id]");
  if (buy) purchaseShopProduct(buy.dataset.buyShopKind, buy.dataset.buyShopId, buy);
});
inventoryMoveToggle.addEventListener("click", () => setInventoryMoveMode(!inventoryMoveMode));
inventoryList.addEventListener("pointerdown", beginInventoryReorder);
inventoryList.addEventListener("pointermove", updateInventoryReorder);
inventoryList.addEventListener("pointerup", finishInventoryReorder);
inventoryList.addEventListener("pointercancel", finishInventoryReorder);
createItemButton.addEventListener("click", () => {
  if (!window.AbyssCloud?.hasActiveSlot()) {
    setAccountMenuOpen(true);
    if (!window.AbyssCloud?.isSignedIn()) window.dispatchEvent(new CustomEvent("abyss:firebase-login"));
    return;
  }
  openItemEditor(null, createItemButton);
});

[
  ["#add-ability-roll", "ability", "roll"],
  ["#add-ability-cost", "ability", "cost"],
  ["#add-ability-modifier", "ability", "modifier"],
  ["#add-item-roll", "item", "roll"],
  ["#add-item-cost", "item", "cost"],
  ["#add-item-modifier", "item", "modifier"],
].forEach(([selector, prefix, kind]) => {
  document.querySelector(selector).addEventListener("click", () => appendMechanicEditorRow(prefix, kind));
});

[abilityEditorDialog, itemEditorDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-mechanic]");
    if (!remove) return;
    const row = remove.closest("[data-mechanic-kind]");
    const prefix = dialog === abilityEditorDialog ? "ability" : "item";
    row?.remove();
    refreshMechanicsEditor(prefix);
  });
  dialog.addEventListener("change", (event) => {
    if (!event.target.matches('[data-mechanic-field="modifier-type"]')) return;
    updateModifierTargetRow(event.target.closest("[data-mechanic-kind]"));
  });
});
document.querySelector("#manage-echo-abilities").addEventListener("click", () => {
  selectAbilitySection("echoes");
  changeView("abilities");
});
echoDecreaseButton.addEventListener("click", () => changeEchoPoints(-1));
echoIncreaseButton.addEventListener("click", () => changeEchoPoints(1));
echoAbilitiesList.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-ability]");
  if (open) openAbilityDetail(open.dataset.openAbility, open);
});
abilityDetailRoll.addEventListener("click", () => {
  if (activeAbilityDetailScope !== "minerva") useCreation(activeAbilityDetailScope, activeAbilityDetailId, abilityDetailRoll);
});
abilityDetailDamageRoll.addEventListener("click", () => {
  if (activeAbilityDetailScope === "sheet") {
    rollCreationDamage("sheet", activeAbilityDetailId, abilityDetailDamageRoll, false);
  }
});
abilityDetailModifiers.addEventListener("click", () => {
  const creation = getCreation(activeAbilityDetailScope, activeAbilityDetailId);
  if (creation) setCreationModifiersActive(activeAbilityDetailScope, creation.id, !creation.modifiersActive);
});
document.querySelector("#ability-detail-mechanics").addEventListener("click", (event) => {
  const critical = event.target.closest("[data-adjust-critical]");
  if (critical) {
    adjustCreationCriticalMargin(
      critical.dataset.criticalScope || activeAbilityDetailScope,
      critical.dataset.adjustCritical,
      Number.parseInt(critical.dataset.direction, 10),
    );
    return;
  }
  const roll = event.target.closest("[data-detail-roll]");
  if (!roll) return;
  rollNamedCreation(roll.dataset.creationScope, roll.dataset.creationId, roll.dataset.detailRoll, roll, false);
});
document.querySelectorAll("[data-close-ability-detail]").forEach((button) => {
  button.addEventListener("click", closeAbilityDetail);
});
document.querySelectorAll("[data-close-rd]").forEach((button) => {
  button.addEventListener("click", closeRdManager);
});
document.querySelectorAll("[data-close-theme]").forEach((button) => {
  button.addEventListener("click", closeThemeEditor);
});
document.querySelectorAll("[data-system-prompt-cancel]").forEach((button) => {
  button.addEventListener("click", () => closeSystemPrompt(false));
});
systemPromptCancel.addEventListener("click", () => closeSystemPrompt(false));
systemPromptConfirm.addEventListener("click", () => closeSystemPrompt(true));
themeButton.addEventListener("click", openThemeEditor);
document.querySelector("#theme-reset").addEventListener("click", resetThemePalette);
document.querySelector("#theme-background-upload").addEventListener("click", () => {
  if (!isNotebookReadOnly() && !themeBackgroundBusy) document.querySelector("#theme-background-file").click();
});
document.querySelector("#theme-background-file").addEventListener("change", (event) => {
  uploadThemeBackground(event.target.files?.[0]);
});
document.querySelectorAll("[data-background-setting]").forEach((input) => {
  input.addEventListener("input", () => updateThemeBackgroundSetting(input.dataset.backgroundSetting, input.value));
});
document.querySelector("#theme-background-center").addEventListener("click", centerThemeBackground);
document.querySelector("#theme-background-remove").addEventListener("click", removeThemeBackground);
document.querySelector("#theme-target").addEventListener("click", () => {
  if (document.querySelector("#theme-target-options").hidden) openThemeTargetPicker();
  else closeThemeTargetPicker();
});
document.querySelector("#theme-target").addEventListener("keydown", handleThemeTargetKeydown);
document.querySelector("#theme-target-options").addEventListener("keydown", handleThemeTargetOptionsKeydown);
document.querySelector("#theme-target-options").addEventListener("click", (event) => {
  const option = event.target.closest("[data-theme-option]");
  if (!option) return;
  selectThemeTarget(option.dataset.themeOption);
  closeThemeTargetPicker({ restoreFocus: true });
});
document.querySelector("#theme-target-options").addEventListener("focusout", (event) => {
  if (event.relatedTarget && !document.querySelector(".theme-target-picker").contains(event.relatedTarget)) closeThemeTargetPicker();
});
themeFields.addEventListener("click", (event) => {
  const control = event.target.closest("[data-theme-key]");
  if (control) selectThemeTarget(control.dataset.themeKey);
});
{
  const wheel = document.querySelector("#theme-color-wheel");
  wheel.addEventListener("pointerdown", handleThemeWheelPointer);
  wheel.addEventListener("pointermove", handleThemeWheelPointer);
  wheel.addEventListener("pointerup", releaseThemeWheelPointer);
  wheel.addEventListener("pointercancel", releaseThemeWheelPointer);
  wheel.addEventListener("lostpointercapture", releaseThemeWheelPointer);
  wheel.addEventListener("keydown", handleThemeWheelKeydown);
}
document.querySelector("#theme-brightness").addEventListener("input", handleThemeBrightnessInput);
document.querySelector("#theme-hex").addEventListener("input", handleThemeHexInput);
document.querySelector("#theme-hex").addEventListener("change", handleThemeHexInput);
document.querySelector(".theme-palette-list").addEventListener("toggle", positionThemePopover);
document.addEventListener("pointerdown", (event) => {
  if (!document.querySelector(".theme-target-picker").contains(event.target)) closeThemeTargetPicker();
  if (!themeModal.hidden && !themeDialog.contains(event.target) && !themeButton.contains(event.target)) closeThemeEditor({ restoreFocus: false });
});
window.addEventListener("resize", positionThemePopover);
window.visualViewport?.addEventListener("resize", positionThemePopover);
window.visualViewport?.addEventListener("scroll", positionThemePopover);
grimoireSearchInput.addEventListener("input", renderGrimoirePicker);
grimoirePickerTypes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-grimoire-picker-type]");
  if (!button) return;
  activeGrimoirePickerType = button.dataset.grimoirePickerType;
  activeGrimoirePickerCategory = "";
  renderGrimoirePicker();
  grimoirePickerTypes.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
});
grimoirePickerPowerTags.addEventListener("click", (event) => {
  const button = event.target.closest("[data-grimoire-power-tag]");
  if (button) selectGrimoirePickerPowerTag(button.dataset.grimoirePowerTag);
});
grimoirePickerPowerTags.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  const button = event.target.closest("[data-grimoire-power-tag]");
  if (!button) return;
  const buttons = [...grimoirePickerPowerTags.querySelectorAll("[data-grimoire-power-tag]")];
  const index = buttons.indexOf(button);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
    : (index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
  buttons[next]?.focus();
});
grimoirePickerCategorySelect.addEventListener("change", () => {
  activeGrimoirePickerCategory = grimoirePickerCategorySelect.value;
  renderGrimoirePicker();
});
minervaSectionButtons.forEach((button) => {
  button.addEventListener("click", () => selectMinervaSection(button.dataset.minervaSection));
});

abilityMediaFileInput.addEventListener("change", () => {
  const file = abilityMediaFileInput.files?.[0];
  if (!file) return;
  abilityMediaUrlInput.value = "";
  abilityEditorForm.dataset.mediaCleared = "false";
  abilityFileName.textContent = `${file.name} · ${Math.ceil(file.size / 1024)} KB`;
  renderAbilityMediaPreview(URL.createObjectURL(file));
});

abilityMediaUrlInput.addEventListener("input", () => {
  if (abilityMediaUrlInput.value.trim()) {
    abilityMediaFileInput.value = "";
    abilityFileName.textContent = "A imagem será carregada pelo link informado.";
  }
  abilityEditorForm.dataset.mediaCleared = "false";
  renderAbilityMediaPreview(abilityMediaUrlInput.value.trim());
});

clearAbilityMediaButton.addEventListener("click", () => {
  abilityMediaUrlInput.value = "";
  abilityMediaFileInput.value = "";
  abilityEditorForm.dataset.mediaCleared = "true";
  abilityFileName.textContent = "A habilidade ficará sem imagem.";
  renderAbilityMediaPreview("");
});

abilitiesList.addEventListener("click", async (event) => {
  const critical = event.target.closest("[data-adjust-critical]");
  if (critical) {
    adjustCreationCriticalMargin(critical.dataset.criticalScope || "sheet", critical.dataset.adjustCritical, Number.parseInt(critical.dataset.direction, 10));
    return;
  }
  if (handleCreationCardPrimaryAction(event)) return;
  const open = event.target.closest("[data-open-ability]");
  if (open) {
    openAbilityDetail(open.dataset.openAbility, open);
    return;
  }
  const openEquipped = event.target.closest("[data-open-equipped-weapon]");
  if (openEquipped) {
    openAbilityDetail(openEquipped.dataset.openEquippedWeapon, openEquipped, "inventory");
    return;
  }
  const toggleModifiers = event.target.closest("[data-toggle-ability-modifiers]");
  const toggleEquippedModifiers = event.target.closest("[data-toggle-equipped-modifiers]");
  const edit = event.target.closest("[data-edit-ability]");
  const editEquipped = event.target.closest("[data-edit-equipped-weapon]");
  const remove = event.target.closest("[data-delete-ability]");
  const unequip = event.target.closest("[data-unequip-weapon]");

  if (toggleEquippedModifiers) {
    const item = inventoryItems.find((entry) => entry.id === toggleEquippedModifiers.dataset.toggleEquippedModifiers);
    if (item) setCreationModifiersActive("inventory", item.id, !item.modifiersActive);
    return;
  }
  if (toggleModifiers) {
    const ability = abilities.find((item) => item.id === toggleModifiers.dataset.toggleAbilityModifiers);
    if (ability) setCreationModifiersActive("sheet", ability.id, !ability.modifiersActive);
    return;
  }
  if (edit) {
    const ability = abilities.find((item) => item.id === edit.dataset.editAbility);
    if (ability) {
      if (ability.modifiersActive) {
        await showAbyssAlert({
          eyebrow: "Efeitos ativos",
          title: "Desative antes de editar",
          message: "Desative os modificadores desta Habilidade antes de editá-la.",
          tone: "warning",
          trigger: edit,
        });
        return;
      }
      openAbilityEditor("sheet", ability, edit);
    }
    return;
  }
  if (editEquipped) {
    const item = inventoryItems.find((entry) => entry.id === editEquipped.dataset.editEquippedWeapon);
    if (item) {
      if (item.modifiersActive) {
        await showAbyssAlert({
          eyebrow: "Efeitos ativos",
          title: "Desative antes de editar",
          message: "Desative os modificadores desta Arma antes de editá-la.",
          tone: "warning",
          trigger: editEquipped,
        });
        return;
      }
      openItemEditor(item, editEquipped);
    }
    return;
  }
  if (unequip) {
    setWeaponEquipped(unequip.dataset.unequipWeapon, false);
    return;
  }
  if (remove) deleteSheetAbility(remove.dataset.deleteAbility);
});

inventoryList.addEventListener("click", async (event) => {
  if (inventoryMoveMode || Date.now() < inventorySuppressClickUntil) {
    event.preventDefault();
    return;
  }
  const critical = event.target.closest("[data-adjust-critical]");
  if (critical) {
    adjustCreationCriticalMargin(critical.dataset.criticalScope || "inventory", critical.dataset.adjustCritical, Number.parseInt(critical.dataset.direction, 10));
    return;
  }
  if (handleCreationCardPrimaryAction(event)) return;
  const equip = event.target.closest("[data-toggle-weapon-equipped]");
  if (equip) {
    const item = inventoryItems.find((entry) => entry.id === equip.dataset.toggleWeaponEquipped);
    if (item) setWeaponEquipped(item.id, !item.equipped);
    return;
  }
  const toggle = event.target.closest("[data-toggle-item-modifiers]");
  if (toggle) {
    const item = inventoryItems.find((entry) => entry.id === toggle.dataset.toggleItemModifiers);
    if (item) setCreationModifiersActive("inventory", item.id, !item.modifiersActive);
    return;
  }
  const open = event.target.closest("[data-open-item]");
  if (open) {
    openAbilityDetail(open.dataset.openItem, open, "inventory");
    return;
  }
  const edit = event.target.closest("[data-edit-item]");
  if (edit) {
    const item = inventoryItems.find((entry) => entry.id === edit.dataset.editItem);
    if (item) {
      if (item.modifiersActive) {
        await showAbyssAlert({
          eyebrow: "Efeitos ativos",
          title: "Desative antes de editar",
          message: "Desative os modificadores deste Item antes de editá-lo.",
          tone: "warning",
          trigger: edit,
        });
        return;
      }
      openItemEditor(item, edit);
    }
    return;
  }
  const remove = event.target.closest("[data-delete-item]");
  if (remove) deleteInventoryItem(remove.dataset.deleteItem);
});

grimoirePickerList.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-select-grimoire-entry]");
  if (choice) selectGrimoirePickerEntry(choice.dataset.selectGrimoireEntry);
});

grimoirePickerList.addEventListener("keydown", (event) => {
  const choice = event.target.closest("[data-select-grimoire-entry]");
  if (!choice) return;
  const buttons = [...grimoirePickerList.querySelectorAll("[data-select-grimoire-entry]")];
  const index = buttons.indexOf(choice);
  let next = index;
  if (event.key === "ArrowDown") next = Math.min(buttons.length - 1, index + 1);
  else if (event.key === "ArrowUp") next = Math.max(0, index - 1);
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = buttons.length - 1;
  else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectGrimoirePickerEntry(choice.dataset.selectGrimoireEntry);
    return;
  } else return;
  event.preventDefault();
  if (buttons[next]) selectGrimoirePickerEntry(buttons[next].dataset.selectGrimoireEntry, true);
});

grimoirePickerActions.addEventListener("click", handleGrimoirePickerAction);


document.querySelector("#create-minerva-ability").addEventListener("click", (event) => {
  if (!window.AbyssCloud?.isMinervaAdmin()) return;
  if (activeMinervaSection === "inventory") {
    openItemEditor(null, event.currentTarget, "minerva");
  } else {
    openAbilityEditor("minerva", null, event.currentTarget);
  }
});

minervaSearchInput.addEventListener("input", renderMinervaList);
minervaList.addEventListener("keydown", (event) => {
  if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  const choice = event.target.closest("[data-select-minerva-entry]");
  if (!choice) return;
  const choices = [...minervaList.querySelectorAll("[data-select-minerva-entry]")];
  const index = choices.indexOf(choice);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1
    : (index + (event.key === "ArrowUp" ? -1 : 1) + choices.length) % choices.length;
  selectMinervaEntry(choices[next].dataset.selectMinervaEntry, true);
});
minervaDialog.addEventListener("click", async (event) => {
  const choice = event.target.closest("[data-select-minerva-entry]");
  if (choice) { selectMinervaEntry(choice.dataset.selectMinervaEntry); return; }
  if (!window.AbyssCloud?.isMinervaAdmin()) return;
  const openItem = event.target.closest("[data-open-minerva-item]");
  if (openItem) {
    openAbilityDetail(openItem.dataset.openMinervaItem, openItem, "minerva-item");
    return;
  }
  const editItem = event.target.closest("[data-edit-minerva-item]");
  if (editItem) {
    const item = grimoireItems.find((entry) => entry.id === editItem.dataset.editMinervaItem);
    if (item) openItemEditor(item, editItem, "minerva");
    return;
  }
  const removeItem = event.target.closest("[data-delete-minerva-item]");
  if (removeItem) {
    const item = grimoireItems.find((entry) => entry.id === removeItem.dataset.deleteMinervaItem);
    if (!item) return;
    const confirmed = await showAbyssConfirm({
      eyebrow: "Loja de Minerva",
      title: "Excluir produto?",
      message: `“${item.name}” deixará de aparecer na Loja para todos os jogadores.`,
      confirmLabel: "Excluir",
      tone: "danger",
      trigger: removeItem,
    });
    if (!confirmed) return;
    removeItem.disabled = true;
    try {
      await window.AbyssCloud.deleteMinervaItem(item);
      await refreshGrimoireFromCloud();
    } catch (error) {
      await showAbyssAlert({
        eyebrow: "Loja de Minerva",
        title: "Exclusão não concluída",
        message: userFacingErrorMessage(error) || "Não foi possível excluir o produto.",
        tone: "danger",
        trigger: removeItem,
      });
    } finally {
      removeItem.disabled = false;
    }
    return;
  }
  const open = event.target.closest("[data-open-grimoire-ability]");
  if (open) {
    openAbilityDetail(open.dataset.openGrimoireAbility, open, "minerva");
    return;
  }
  const edit = event.target.closest("[data-edit-minerva-ability]");
  if (edit) {
    const ability = grimoireAbilities.find(
      (item) => item.id === edit.dataset.editMinervaAbility,
    );
    if (ability) openAbilityEditor("minerva", ability, edit);
    return;
  }

  const remove = event.target.closest("[data-delete-minerva-ability]");
  if (!remove) return;

  const ability = grimoireAbilities.find(
    (item) => item.id === remove.dataset.deleteMinervaAbility,
  );
  if (!ability) return;
  const confirmed = await showAbyssConfirm({
    eyebrow: "Grimório de Minerva",
    title: "Excluir do Grimório?",
    message: `“${ability.name}” deixará de ficar disponível para todos os jogadores.`,
    confirmLabel: "Excluir",
    tone: "danger",
    trigger: remove,
  });
  if (!confirmed) return;

  remove.disabled = true;
  try {
    await window.AbyssCloud.deleteMinervaAbility(ability);
    await refreshGrimoireFromCloud();
  } catch (error) {
    await showAbyssAlert({
      eyebrow: "Grimório de Minerva",
      title: "Exclusão não concluída",
      message: userFacingErrorMessage(error) || "Não foi possível excluir a Habilidade do Grimório.",
      tone: "danger",
      trigger: remove,
    });
  } finally {
    remove.disabled = false;
  }
});

document.querySelectorAll("[data-close-ability-editor]").forEach((button) => {
  button.addEventListener("click", closeAbilityEditor);
});
document.querySelectorAll("[data-close-item-upgrades]").forEach((button) => button.addEventListener("click", closeItemUpgradePicker));
itemUpgradeSearch.addEventListener("input", renderItemUpgradePicker);
itemUpgradeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apply-item-upgrade]");
  if (!button || button.disabled || isNotebookReadOnly() || activeItemUpgradeEpoch !== notesEpoch || itemUpgradeList.getAttribute("aria-busy") === "true") return;
  const item = inventoryItems.find((entry) => entry.id === activeItemUpgradeId);
  const source = grimoireAbilities.find((entry) => entry.id === button.dataset.applyItemUpgrade);
  if (!item || !source || !applyInventoryUpgrade(item, source)) return;
  notifyItemUpgradeChanged(item, "item-upgrade-added");
  renderItemUpgradePicker();
  document.querySelector("#item-upgrade-feedback").textContent = `“${source.name}” adicionada a “${item.name}”.${source.grantsModifiers && !item.modifiersActive ? " Ative os efeitos do item para usar seus modificadores." : ""}`;
});
document.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-item-upgrades]");
  if (open) { if (!inventoryMoveMode && Date.now() >= inventorySuppressClickUntil) openItemUpgradePicker(open.dataset.openItemUpgrades, open); return; }
  const remove = event.target.closest("[data-remove-item-upgrade]");
  if (remove && !inventoryMoveMode && Date.now() >= inventorySuppressClickUntil) confirmRemoveItemUpgrade(remove.dataset.upgradeItemId, remove.dataset.removeItemUpgrade, remove);
});

document.querySelectorAll("[data-close-item-editor]").forEach((button) => {
  button.addEventListener("click", closeItemEditor);
});
document.querySelectorAll("[data-close-grimoire-picker]").forEach((button) => {
  button.addEventListener("click", closeGrimoirePicker);
});
document.querySelectorAll("[data-close-minerva]").forEach((button) => {
  button.addEventListener("click", closeMinervaGrimoire);
});
document.querySelectorAll("[data-close-slots]").forEach((button) => {
  button.addEventListener("click", closeSlotsManager);
});
document.querySelectorAll("[data-close-ability-roll]").forEach((button) => {
  button.addEventListener("click", closeAbilityRoll);
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
});

skillSearchInput.addEventListener("input", filterSkills);
attributeFilter.addEventListener("change", filterSkills);
trainingFilter.addEventListener("change", filterSkills);
clearSkillFiltersButton.addEventListener("click", clearSkillFilters);
openConstellationButton.addEventListener("click", () => openConstellation(openConstellationButton));
featureToggleButton.addEventListener("click", () => toggleFeatureSelection(activeFeatureId));
openCustomSkillButton.addEventListener("click", () => openCustomSkill(openCustomSkillButton));
customSkillForm.addEventListener("submit", submitCustomSkill);
document.querySelector("#add-custom-use").addEventListener("click", () => {
  customUsesList.append(createBuilderUseItem("skill"));
  customUsesList.lastElementChild.querySelector("input").focus();
});
document.querySelector("#add-custom-competency").addEventListener("click", () => {
  const card = createBuilderCompetencyCard();
  customCompetenciesList.append(card);
  renumberBuilderCompetencies();
  card.querySelector("input").focus();
});

customSkillDialog.addEventListener("click", (event) => {
  const removeUseButton = event.target.closest("[data-remove-builder-use]");
  if (removeUseButton) {
    removeUseButton.closest(".builder-repeat-item")?.remove();
    return;
  }

  const competencyCard = event.target.closest(".builder-competency-card");
  if (!competencyCard) return;

  if (event.target.closest("[data-remove-builder-competency]")) {
    competencyCard.remove();
    renumberBuilderCompetencies();
    return;
  }
  if (event.target.closest("[data-add-competency-use]")) {
    const list = competencyCard.querySelector("[data-competency-uses]");
    list.append(createBuilderUseItem("competency"));
    list.lastElementChild.querySelector("input").focus();
    return;
  }
  if (event.target.closest("[data-add-specialization]")) {
    const list = competencyCard.querySelector("[data-competency-specializations]");
    list.append(createBuilderSpecializationItem());
    list.lastElementChild.querySelector("input").focus();
    return;
  }
  const removeSpecializationButton = event.target.closest("[data-remove-builder-specialization]");
  if (removeSpecializationButton) removeSpecializationButton.closest(".builder-repeat-item")?.remove();
});

constellationTree.addEventListener("click", (event) => {
  const featureButton = event.target.closest("[data-open-feature]");
  if (!featureButton) return;
  openFeatureDetail(featureButton.dataset.openFeature, featureButton);
});

selectedFeaturesList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-selected-feature]");
  if (removeButton) {
    toggleFeatureSelection(removeButton.dataset.removeSelectedFeature);
    return;
  }

  const openButton = event.target.closest("[data-open-selected-feature]");
  if (openButton) openFeatureDetail(openButton.dataset.openSelectedFeature, openButton);
});

skillsList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-custom-skill]");
  if (deleteButton) {
    openDeleteSkill(deleteButton.dataset.deleteCustomSkill, deleteButton);
    return;
  }

  const infoButton = event.target.closest("[data-skill-info]");
  if (infoButton) {
    openSkillInfo(Number.parseInt(infoButton.dataset.skillInfo, 10), infoButton);
    return;
  }

  const rollButton = event.target.closest("[data-roll-index]");
  if (!rollButton) return;
  rollSkill(Number.parseInt(rollButton.dataset.rollIndex, 10), rollButton);
});

skillsList.addEventListener("change", (event) => {
  if (event.target.matches("[data-training-index]")) {
    const training = TRAINING[event.target.value];
    const row = event.target.closest(".skill-row");
    const skill = SKILLS[Number.parseInt(row.dataset.skillIndex, 10)];
    const previousTraining = TRAINING[event.target.dataset.previousTraining]
      ? event.target.dataset.previousTraining
      : "leigo";
    const icon = row.querySelector(".training-die");
    icon.innerHTML = dieSvg(training.die);
    updateTrainingIndicator(row, event.target.value);
    filterSkills();
    if (event.target.value === "leigo") {
      skillLimitApprovedKeys.delete(getSkillKey(skill));
      event.target.dataset.previousTraining = "leigo";
    } else if (
      previousTraining === "leigo" &&
      getTrainingLimit() !== null &&
      getTrainedSkillEntries().length > getTrainingLimit()
    ) {
      queueTrainingLimitRequest(
        { row, select: event.target, skill, key: getSkillKey(skill) },
        previousTraining,
      );
    } else {
      event.target.dataset.previousTraining = event.target.value;
    }
    updateTrainingCapStatus();
    auditTrainingLimit();
    updateDerivedCombatStats();
  }

  if (event.target.matches("[data-skill-attribute]")) {
    filterSkills();
  }

  if (event.target.matches("[data-main-dice-count]")) {
    normalizeMainDiceCount(event.target);
  }

  if (event.target.matches("[data-training-index], [data-skill-attribute], [data-main-dice-count], [data-fixed-modifier]")) {
    notifySheetChanged("skill-settings");
  }
});

skillsList.addEventListener("input", (event) => {
  if (event.target.matches("[data-dice-modifier]")) {
    event.target.setCustomValidity("");
    event.target.classList.remove("is-invalid");
    event.target.removeAttribute("aria-invalid");
  }
  if (event.target.matches("[data-main-dice-count], [data-dice-modifier], [data-fixed-modifier]")) {
    notifySheetChanged("skill-settings");
  }
});

document.querySelectorAll("#character-name, #character-background").forEach((input) => {
  input.addEventListener("input", () => notifySheetChanged("profile"));
  input.addEventListener("change", () => notifySheetChanged("profile"));
});
characterNameInput.addEventListener("input", scheduleCharacterIdentityWidths);
characterBackgroundInput.addEventListener("input", scheduleCharacterIdentityWidths);

identityChoices.forEach((choice) => {
  choice.trigger.addEventListener("click", () => openIdentityOptions(choice));
  choice.trigger.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    openIdentityOptions(choice, event.key === "ArrowUp");
  });
});

identityOptionsMenu.addEventListener("click", (event) => {
  const option = event.target.closest(".identity-option");
  if (option) chooseIdentityOption(option.dataset.value);
});

identityOptionsMenu.addEventListener("keydown", (event) => {
  const options = [...identityOptionsMenu.querySelectorAll(".identity-option")];
  const current = options.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeIdentityOptions({ returnFocus: true });
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    const target = activeIdentityChoice?.kind === "echo"
      ? document.querySelector(event.shiftKey ? "#character-name" : "#character-background")
      : document.querySelector(event.shiftKey ? "#character-background" : "#character-level");
    closeIdentityOptions();
    target?.focus();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const option = options[current];
    if (option) chooseIdentityOption(option.dataset.value);
    return;
  }
  let next = current;
  if (event.key === "ArrowDown") next = (current + 1) % options.length;
  else if (event.key === "ArrowUp") next = (current - 1 + options.length) % options.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = options.length - 1;
  else return;
  event.preventDefault();
  options[next]?.focus({ preventScroll: true });
  options[next]?.scrollIntoView({ block: "nearest" });
});

document.addEventListener("pointerdown", (event) => {
  if (!activeIdentityChoice) return;
  if (identityOptionsMenu.contains(event.target) || activeIdentityChoice.trigger.contains(event.target)) return;
  closeIdentityOptions();
});
window.addEventListener("scroll", (event) => {
  if (activeIdentityChoice && !identityOptionsMenu.contains(event.target)) closeIdentityOptions();
}, true);
window.addEventListener("resize", () => {
  if (activeIdentityChoice) positionIdentityOptions();
});

document.querySelectorAll("[data-attribute]").forEach((input) => {
  input.addEventListener("input", () => {
    applyClassCalculations();
    notifySheetChanged("profile");
  });
  input.addEventListener("change", () => {
    input.value = String(normalizeAttributeValue(input.value));
    applyClassCalculations();
    if (input.dataset.attribute === "INT") auditTrainingLimit();
    notifySheetChanged("profile");
  });
});

document.querySelectorAll("[data-roll-attribute]").forEach((button) => {
  button.addEventListener("click", () => {
    const attribute = button.dataset.rollAttribute;
    const { total: result, breakdown, formula } = rollAttributeDice(attribute);
    window.AbyssCloud?.recordRoll?.({ kind: "attribute", title: ATTRIBUTES[attribute], total: result, formula, breakdown, context: window.AbyssCloud?.getRollContext?.() });
    playRollSound();
    showAbyssAlert({
      eyebrow: `Dado de Atributo · ${attribute}`,
      title: `${ATTRIBUTES[attribute]}: ${result}`,
      message: `${breakdown} = ${result}`,
      tone: "info",
      trigger: button,
    });
  });
});

characterEchoSelect.addEventListener("change", () => {
  updateIdentityChoiceAppearance();
  notifySheetChanged("echo");
});

characterClassSelect.addEventListener("change", () => {
  const previousClass = CHARACTER_CLASSES[characterClassSelect.dataset.previousValue]
    ? characterClassSelect.dataset.previousValue
    : "";
  skillLimitApprovedKeys.clear();
  applyClassCalculations({ initializeCurrent: !previousClass && Boolean(characterClassSelect.value) });
  characterClassSelect.dataset.previousValue = characterClassSelect.value;
  notifySheetChanged("class");
  auditTrainingLimit();
});

characterLevelInput.addEventListener("input", () => {
  applyClassCalculations();
  notifySheetChanged("level");
});
characterLevelInput.addEventListener("change", () => {
  characterLevelInput.value = String(getCharacterLevel());
  applyClassCalculations();
  notifySheetChanged("level");
});

document.querySelectorAll("[data-resource-current], [data-resource-max]").forEach((input) => {
  input.addEventListener("input", () => {
    const resource = input.dataset.resourceCurrent || input.dataset.resourceMax;
    if (input.matches("[data-resource-max]")) {
      resourceMaxManual[resource] = true;
      applyClassCalculations();
    } else {
      renderResourceState();
    }
    notifySheetChanged("resources");
  });
  input.addEventListener("change", () => {
    const resource = input.dataset.resourceCurrent || input.dataset.resourceMax;
    normalizeResourceInput(resource, input.matches("[data-resource-max]") ? "max" : "current");
  });
});

document.querySelectorAll("[data-resource-delta]").forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!input.value) return;
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    const amount = Number(input.value);
    input.value = "";
    adjustResource(input.dataset.resourceDelta, amount);
  });
});

document.querySelectorAll("[data-resource-adjust]").forEach((button) => {
  button.addEventListener("click", () => {
    adjustResource(button.dataset.resourceAdjust, Number.parseInt(button.dataset.direction, 10));
  });
});

[defenseZoneSelect, defenseMarginSelect].forEach((select) => {
  select.addEventListener("change", () => {
    defenseWasManuallySet = true;
    updateEvasionFromDefense();
    notifySheetChanged("defense");
  });
});
defenseAttributeSelect.addEventListener("change", () => {
  defenseWasManuallySet = false;
  applyClassCalculations();
  notifySheetChanged("defense");
});
evasionAttributeSelect.addEventListener("change", () => {
  updateEvasionFromDefense();
  notifySheetChanged("evasion");
});
document.querySelector("[data-reset-defense]").addEventListener("click", () => {
  defenseWasManuallySet = false;
  applyClassCalculations();
  notifySheetChanged("defense");
});
blockValueInput.addEventListener("input", () => {
  blockWasManuallySet = true;
  notifySheetChanged("block");
});
blockValueInput.addEventListener("change", () => {
  blockValueInput.value = String(clampInteger(blockValueInput.value, 0, 999999, 0));
  blockWasManuallySet = true;
  notifySheetChanged("block");
});
document.querySelector("[data-reset-block]").addEventListener("click", () => {
  blockWasManuallySet = false;
  updateDerivedCombatStats();
  notifySheetChanged("block");
});
movementValueInput.addEventListener("input", () => {
  movementWasManuallySet = true;
  notifySheetChanged("movement");
});
movementValueInput.addEventListener("change", () => {
  movementValueInput.value = String(clampInteger(movementValueInput.value, 0, 999999, 6));
  movementWasManuallySet = true;
  notifySheetChanged("movement");
});
document.querySelector("[data-reset-movement]").addEventListener("click", () => {
  movementWasManuallySet = false;
  updateDerivedCombatStats();
  notifySheetChanged("movement");
});
blockActiveInput.addEventListener("change", () => notifySheetChanged("block"));
Object.entries(dtFields).forEach(([key, fields]) => {
  [fields.zone, fields.margin].forEach((input) => {
    input.addEventListener("change", () => {
      dtManual[key] = true;
      notifySheetChanged("difficulty-targets");
    });
  });
});
Object.entries(dtAttributeSelects).forEach(([key, select]) => {
  select.addEventListener("change", () => {
    dtManual[key] = false;
    updateDifficultyTargets();
    notifySheetChanged("difficulty-targets");
  });
});
document.querySelectorAll("[data-reset-dt]").forEach((button) => {
  button.addEventListener("click", () => {
    dtManual[button.dataset.resetDt] = false;
    updateDifficultyTargets();
    notifySheetChanged("difficulty-targets");
  });
});

[luckDieSelect, misfortuneDieSelect].forEach((select) => {
  select.addEventListener("change", () => notifySheetChanged("special-tests"));
});
rollLuckTestButton.addEventListener("click", () => {
  const luckFaces = clampInteger(luckDieSelect.value, 2, 1000, 8);
  const misfortuneFaces = clampInteger(misfortuneDieSelect.value, 2, 1000, 8);
  const luckRoll = rollDice(1, luckFaces)[0];
  const misfortuneRoll = rollDice(1, misfortuneFaces)[0];
  const total = luckRoll - misfortuneRoll;
  const state = total > 0 ? "Sorte" : total < 0 ? "Azar" : "Neutro";
  playRollSound();
  showSpecialTestResult({
    title: "Sorte",
    context: `d${luckFaces} − d${misfortuneFaces}`,
    icon: "luck",
    outcome: state,
    outcomeDetail: "Dado de Sorte − Dado de Azar",
    outcomeKey: total > 0 ? "good" : total < 0 ? "failure" : "",
    total: formatSigned(total),
    trigger: rollLuckTestButton,
    breakdown: [
      { label: "Dado de Sorte", detail: `1d${luckFaces}`, value: luckRoll, signed: false },
      { label: "Dado de Azar", detail: `1d${misfortuneFaces} subtraído`, value: -misfortuneRoll },
    ],
  });
});
rollWisdomTestButton.addEventListener("click", () => {
  const value = getWisdomValue();
  const rolled = rollDice(1, 100)[0];
  const success = rolled <= value;
  playRollSound();
  showSpecialTestResult({
    title: "Sabedoria",
    context: "Teste Especial · 1d100",
    icon: "wisdom",
    outcome: success ? "Sucesso" : "Falha",
    outcomeDetail: `Resultado ${success ? "igual ou inferior" : "superior"} a ${value}`,
    outcomeKey: success ? "normal" : "failure",
    total: rolled,
    trigger: rollWisdomTestButton,
    breakdown: [
      { label: "Valor de Sabedoria", detail: "20 + (INT × 15)", value, signed: false },
    ],
  });
});
primarySenseSelect.addEventListener("change", () => {
  const previousKey = SENSE_DEFINITIONS[primarySenseSelect.dataset.previousValue]
    ? primarySenseSelect.dataset.previousValue
    : "ver";
  const nextKey = SENSE_DEFINITIONS[primarySenseSelect.value] ? primarySenseSelect.value : "ver";
  if (previousKey !== nextKey && !senseManual[previousKey]) {
    senseValues[previousKey] = rollSecondarySenseValue();
  }
  senseManual[nextKey] = false;
  senseValues[nextKey] = getPrimarySenseValue();
  renderSpecialTests();
  notifySheetChanged("special-tests");
});
generateSensesButton.addEventListener("click", () => {
  const primaryKey = primarySenseSelect.value;
  Object.keys(SENSE_DEFINITIONS).forEach((key) => {
    if (key === primaryKey) {
      if (!senseManual[key]) senseValues[key] = getPrimarySenseValue();
      return;
    }
    senseValues[key] = rollSecondarySenseValue();
    senseManual[key] = false;
  });
  playRollSound();
  renderSpecialTests();
  notifySheetChanged("special-tests");
});
sensesList.addEventListener("input", (event) => {
  const key = event.target.dataset.senseValue;
  if (!SENSE_DEFINITIONS[key]) return;
  const parsed = Number.parseInt(event.target.value, 10);
  senseValues[key] = Number.isFinite(parsed) ? parsed : null;
  senseManual[key] = true;
  notifySheetChanged("special-tests");
});
sensesList.addEventListener("change", (event) => {
  const key = event.target.dataset.senseValue;
  if (!SENSE_DEFINITIONS[key]) return;
  const parsed = Number.parseInt(event.target.value, 10);
  senseValues[key] = Number.isFinite(parsed) ? clampInteger(parsed, 0, 999, 0) : null;
  event.target.value = senseValues[key] === null ? "" : String(senseValues[key]);
  senseManual[key] = true;
  notifySheetChanged("special-tests");
});
sensesList.addEventListener("click", (event) => {
  const test = event.target.closest("[data-test-sense]");
  if (test) {
    rollSenseTest(test.dataset.testSense, test);
    return;
  }
  const reroll = event.target.closest("[data-reroll-sense]");
  if (!reroll || reroll.disabled) return;
  const key = reroll.dataset.rerollSense;
  senseValues[key] = rollSecondarySenseValue();
  senseManual[key] = false;
  playRollSound();
  renderSpecialTests();
  notifySheetChanged("special-tests");
});

rdManagerButton.addEventListener("click", openRdManager);
document.querySelectorAll("[data-resource-limit]").forEach((button) => {
  button.addEventListener("click", () => setResourceLimit(button.dataset.resourceLimit, button.dataset.limit));
});

rdCreateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const reduction = sanitizeDamageReduction({
    name: rdNameInput.value,
    value: rdValueInput.value,
    active: false,
  });
  if (!reduction) {
    rdNameInput.focus();
    return;
  }
  damageReductions.push(reduction);
  rdCreateForm.reset();
  rdValueInput.value = "0";
  renderDamageReductions();
  notifySheetChanged("damage-reductions");
  rdNameInput.focus();
});

rdList.addEventListener("input", (event) => {
  const item = event.target.closest("[data-rd-id]");
  const reduction = damageReductions.find((entry) => entry.id === item?.dataset.rdId);
  if (!reduction) return;
  if (event.target.dataset.rdField === "name") {
    reduction.name = String(event.target.value || "").slice(0, 50);
  } else if (event.target.dataset.rdField === "value") {
    reduction.value = clampInteger(event.target.value, 0, 999999, 0);
  }
  notifySheetChanged("damage-reductions");
});

rdList.addEventListener("change", (event) => {
  const item = event.target.closest("[data-rd-id]");
  const reduction = damageReductions.find((entry) => entry.id === item?.dataset.rdId);
  if (!reduction) return;
  if (event.target.dataset.rdField === "active") {
    reduction.active = event.target.checked;
  } else if (event.target.dataset.rdField === "name") {
    reduction.name = String(event.target.value || "").trim().slice(0, 50) || "RD sem nome";
  } else if (event.target.dataset.rdField === "value") {
    reduction.value = clampInteger(event.target.value, 0, 999999, 0);
  }
  item.classList.toggle("is-active", reduction.active);
  if (event.target.dataset.rdField !== "active") {
    event.target.value = String(reduction[event.target.dataset.rdField]);
  }
  item.querySelector('[data-rd-field="active"]').setAttribute("aria-label", `Ativar ${reduction.name}`);
  item.querySelector('[data-rd-field="value"]').setAttribute("aria-label", `Valor de ${reduction.name}`);
  item.querySelector("[data-rd-delete]").setAttribute("aria-label", `Excluir ${reduction.name}`);
  notifySheetChanged("damage-reductions");
});

rdList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rd-delete]");
  if (!button) return;
  damageReductions = damageReductions.filter((entry) => entry.id !== button.dataset.rdDelete);
  renderDamageReductions();
  notifySheetChanged("damage-reductions");
});

document.querySelectorAll("[data-close-training-limit]").forEach((button) => {
  button.addEventListener("click", () => resolveTrainingLimitRequest(false));
});
confirmTrainingLimitButton.addEventListener("click", () => resolveTrainingLimitRequest(true));

document.querySelector("#portrait-input").addEventListener("change", (event) => {
  openPhotoEditor(event.target.files?.[0]);
});

document.querySelector(".portrait-frame").addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  document.querySelector("#portrait-input").click();
});

document.querySelectorAll("[data-close-custom-skill]").forEach((button) => {
  button.addEventListener("click", closeCustomSkill);
});

document.querySelectorAll("[data-close-delete-skill]").forEach((button) => {
  button.addEventListener("click", closeDeleteSkill);
});
confirmDeleteSkillButton.addEventListener("click", deletePendingCustomSkill);

document.querySelectorAll("[data-close-photo-editor]").forEach((button) => {
  button.addEventListener("click", closePhotoEditor);
});
applyPhotoCropButton.addEventListener("click", applyPhotoCrop);
photoCenterButton.addEventListener("click", centerPhotoEditor);
photoZoomInput.addEventListener("input", () => setPhotoZoom(photoZoomInput.value));
photoZoomOutButton.addEventListener("click", () => setPhotoZoom(photoEditorState.zoom - 0.1));
photoZoomInButton.addEventListener("click", () => setPhotoZoom(photoEditorState.zoom + 0.1));

photoEditorViewport.addEventListener("pointerdown", (event) => {
  if (!photoEditorState.image) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (photoEditorState.pointerId !== null) return;
  event.preventDefault();
  photoEditorState.pointerId = event.pointerId;
  photoEditorState.dragStartX = event.clientX;
  photoEditorState.dragStartY = event.clientY;
  photoEditorState.originX = photoEditorState.x;
  photoEditorState.originY = photoEditorState.y;
  photoEditorViewport.classList.add("is-dragging");
  try {
    photoEditorViewport.setPointerCapture(event.pointerId);
  } catch {
    // O acompanhamento global abaixo mantém o arraste funcionando sem captura.
  }
});

window.addEventListener("pointermove", (event) => {
  if (photoEditorState.pointerId !== event.pointerId) return;
  event.preventDefault();
  photoEditorState.x = photoEditorState.originX + event.clientX - photoEditorState.dragStartX;
  photoEditorState.y = photoEditorState.originY + event.clientY - photoEditorState.dragStartY;
  renderPhotoEditor();
}, { passive: false });

function finishPhotoDrag(event) {
  if (photoEditorState.pointerId !== event.pointerId) return;
  const finishedPointerId = photoEditorState.pointerId;
  photoEditorState.pointerId = null;
  photoEditorViewport.classList.remove("is-dragging");
  if (photoEditorViewport.hasPointerCapture?.(finishedPointerId)) {
    photoEditorViewport.releasePointerCapture(finishedPointerId);
  }
}

window.addEventListener("pointerup", finishPhotoDrag);
window.addEventListener("pointercancel", finishPhotoDrag);
photoEditorViewport.addEventListener("lostpointercapture", finishPhotoDrag);
photoEditorImage.addEventListener("dragstart", (event) => event.preventDefault());
photoEditorViewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  setPhotoZoom(photoEditorState.zoom + (event.deltaY < 0 ? 0.08 : -0.08));
}, { passive: false });
photoEditorViewport.addEventListener("keydown", (event) => {
  const movement = event.shiftKey ? 18 : 7;
  const directions = {
    ArrowLeft: [-movement, 0],
    ArrowRight: [movement, 0],
    ArrowUp: [0, -movement],
    ArrowDown: [0, movement],
  };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  photoEditorState.x += direction[0];
  photoEditorState.y += direction[1];
  renderPhotoEditor();
});

document.querySelectorAll("[data-close-roll]").forEach((button) => {
  button.addEventListener("click", closeRollModal);
});

document.querySelectorAll("[data-close-skill-info]").forEach((button) => {
  button.addEventListener("click", closeSkillInfo);
});

document.querySelectorAll("[data-close-constellation]").forEach((button) => {
  button.addEventListener("click", closeConstellation);
});

document.querySelectorAll("[data-close-feature-detail]").forEach((button) => {
  button.addEventListener("click", closeFeatureDetail);
});

window.addEventListener("resize", () => {
  if (!constellationModal.hidden) scheduleConstellationDraw();
  if (!photoEditorModal.hidden) renderPhotoEditor();
  scheduleCharacterIdentityWidths();
});

document.addEventListener("keydown", (event) => {
  if (document.querySelector("#audio-clip-modal")?.hidden === false) return;
  if (event.key === "Escape" && !systemPromptModal.hidden) {
    closeSystemPrompt(false);
  } else if (event.key === "Escape" && !themeModal.hidden) {
    closeThemeEditor();
  } else if (event.key === "Escape" && !rdModal.hidden) {
    closeRdManager();
  } else if (event.key === "Escape" && !shopHistoryModal.hidden) {
    closePurchaseHistory();
  } else if (event.key === "Escape" && !abilityRollModal.hidden) {
    closeAbilityRoll();
  } else if (event.key === "Escape" && !abilityDetailModal.hidden) {
    closeAbilityDetail();
  } else if (event.key === "Escape" && !abilityEditorModal.hidden) {
    closeAbilityEditor();
  } else if (event.key === "Escape" && !itemUpgradeModal.hidden) {
    closeItemUpgradePicker();
  } else if (event.key === "Escape" && !itemEditorModal.hidden) {
    closeItemEditor();
  } else if (event.key === "Escape" && !grimoirePickerModal.hidden) {
    closeGrimoirePicker();
  } else if (event.key === "Escape" && !minervaModal.hidden) {
    closeMinervaGrimoire();
  } else if (event.key === "Escape" && !slotsModal.hidden) {
    closeSlotsManager();
  } else if (event.key === "Escape" && !trainingLimitModal.hidden) {
    resolveTrainingLimitRequest(false);
  } else if (event.key === "Escape" && !deleteSkillModal.hidden) {
    closeDeleteSkill();
  } else if (event.key === "Escape" && !photoEditorModal.hidden) {
    closePhotoEditor();
  } else if (event.key === "Escape" && !customSkillModal.hidden) {
    closeCustomSkill();
  } else if (event.key === "Escape" && !featureDetailModal.hidden) {
    closeFeatureDetail();
  } else if (event.key === "Escape" && !constellationModal.hidden) {
    closeConstellation();
  } else if (event.key === "Escape" && !skillInfoModal.hidden) {
    closeSkillInfo();
  } else if (event.key === "Escape" && !rollModal.hidden) {
    closeRollModal();
  } else if (event.key === "Escape" && !accountMenu.hidden) {
    setAccountMenuOpen(false);
    accountButton.focus();
  }
  trapDialogFocus(event);
  trapSkillInfoFocus(event);
  trapConstellationFocus(event);
  trapFeatureDetailFocus(event);
  trapInteractiveModalFocus(event, customSkillModal, customSkillDialog);
  trapInteractiveModalFocus(event, deleteSkillModal, deleteSkillDialog);
  trapInteractiveModalFocus(event, trainingLimitModal, trainingLimitDialog);
  trapInteractiveModalFocus(event, photoEditorModal, photoEditorDialog);
  trapInteractiveModalFocus(event, abilityEditorModal, abilityEditorDialog);
  trapInteractiveModalFocus(event, itemEditorModal, itemEditorDialog);
  trapInteractiveModalFocus(event, itemUpgradeModal, itemUpgradeDialog);
  trapInteractiveModalFocus(event, grimoirePickerModal, grimoirePickerDialog);
  trapInteractiveModalFocus(event, minervaModal, minervaDialog);
  trapInteractiveModalFocus(event, slotsModal, slotsDialog);
  trapInteractiveModalFocus(event, abilityRollModal, abilityRollDialog);
  trapInteractiveModalFocus(event, abilityDetailModal, abilityDetailDialog);
  trapInteractiveModalFocus(event, shopHistoryModal, shopHistoryDialog);
  trapInteractiveModalFocus(event, rdModal, rdDialog);
  trapInteractiveModalFocus(event, systemPromptModal, systemPromptDialog);
  trapInteractiveModalFocus(event, sheetTransferModal, sheetTransferDialog);
});

applyTheme();
renderThemeFields();
loadCustomSkills();
sortSkillsAlphabetically();
rebuildFeatureCatalog();
renderSkills();
hydrateLegendDice();
loadSelectedFeatures();
renderSelectedFeatures();
renderAbilities();
renderCharacterNotes();
renderInventory();
renderShop();
renderPurchaseHistory();
updateIdentityChoiceAppearance();
renderDamageReductions();
characterClassSelect.dataset.previousValue = characterClassSelect.value;
renderResourceState();
applyClassCalculations();
if (document.fonts?.ready) {
  document.fonts.ready.then(updateCharacterIdentityWidths).catch(() => {});
}

window.AbyssSheet = Object.freeze({
  captureState: captureCompleteSheetState,
  applyState: applyCompleteSheetState,
  normalizeAttributeValue,
  normalizeRollSounds: normalizeSheetRollSounds,
  getRollSounds: () => normalizeSheetRollSounds(sheetRollSounds),
  hasSlotRollSounds: () => slotRollSoundsInitialized,
  setRollSounds: setSheetRollSounds,
  serializeAbility: serializeAbilityForCloud,
  serializeItem: serializeInventoryItemForCloud,
  persistLocalNow: writeLocalSheetCache,
  getLocalOwner: () => null,
  setLocalOwner: () => {},
  createCleanState: createCleanSheetState,
  resetState: () => applyCompleteSheetState(createCleanSheetState(), { persistLocal: false }),
  syncModalLock,
});
window.AbyssAbilities = Object.freeze({
  refreshGrimoire: refreshGrimoireFromCloud,
  renderGrimoire: renderGrimoireCollections,
});
window.dispatchEvent(new CustomEvent("abyss:sheet-ready"));

    