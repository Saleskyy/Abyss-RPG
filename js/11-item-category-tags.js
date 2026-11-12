/* Item filters affect only the visible catalogue, never its saved contents. */
(() => {
  "use strict";
  const filters = { inventory: "", shop: "", minerva: "", picker: "" };
  const ids = {
    inventory: "inventory-category-tags", shop: "shop-category-tags",
    minerva: "minerva-item-category-tags", picker: "grimoire-picker-item-category-tags",
  };
  const refresh = { inventory: () => renderInventory(), shop: () => renderShop(), minerva: () => renderMinervaList() };
  function get(scope) { return filters[scope] || ""; }
  function reset(scope) { if (Object.hasOwn(filters, scope)) filters[scope] = ""; }
  function matches(scope, item) { return !get(scope) || sanitizeItemType(item?.itemType, item?.isWeapon) === get(scope); }
  function render(scope, items, options = {}) {
    const container = document.getElementById(ids[scope]);
    if (!container) return;
    const selected = options.selected === undefined ? get(scope) : options.selected;
    const list = Array.isArray(items) ? items : [];
    const counts = new Map(Object.keys(ITEM_TYPES).map(key => [key, 0]));
    list.forEach(item => {
      const key = sanitizeItemType(item?.itemType, item?.isWeapon);
      counts.set(key, counts.get(key) + 1);
    });
    const choices = [["", "Todos"], ...Object.entries(ITEM_TYPES)];
    container.replaceChildren(...choices.map(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "item-category-tag";
      button.dataset.itemCategory = key;
      button.setAttribute("aria-pressed", String(selected === key));
      button.disabled = Boolean(options.disabled);
      const count = key ? counts.get(key) : options.totalCount ?? list.length;
      const name = document.createElement("span");
      name.textContent = label;
      const amount = document.createElement("small");
      amount.textContent = String(count);
      amount.setAttribute("aria-hidden", "true");
      button.setAttribute("aria-label", `${label}, ${count} ${count === 1 ? "registro" : "registros"}`);
      button.title = key && selected === key ? "Clique novamente para mostrar todos" : `Filtrar: ${label}`;
      button.append(name, amount);
      button.addEventListener("click", () => {
        if (button.disabled) return;
        const next = selected === key ? "" : key;
        filters[scope] = next;
        if (typeof options.onChange === "function") options.onChange(next);
        else refresh[scope]?.();
        const current = Array.from(container.querySelectorAll("[data-item-category]"))
          .find(control => control.dataset.itemCategory === next);
        current?.focus({ preventScroll: true });
      });
      return button;
    }));
  }
  Object.values(ids).forEach(id => {
    const container = document.getElementById(id);
    container?.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const current = event.target.closest("[data-item-category]");
      const controls = Array.from(container.querySelectorAll("[data-item-category]")).filter(button => !button.disabled);
      const index = controls.indexOf(current);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1
        : (index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + controls.length) % controls.length;
      controls[next]?.focus();
    });
  });
  window.AbyssItemFilters = Object.freeze({ get, reset, matches, render });
  // The first classic-script initialization precedes this optional UI module.
  renderInventory();
  renderShop();
})();
