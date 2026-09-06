const $ = selector => document.querySelector(selector);
let activeModal = null;

export function openModal(title, body, footer = "", { onClose } = {}) {
  if (activeModal) closeModal();
  const backdrop = $("#modalBackdrop");
  activeModal = { onClose, trigger: document.activeElement };
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalBody").querySelectorAll("form").forEach(form => { form.noValidate = true; });
  const actions = $("#modalFooter");
  actions.innerHTML = footer;
  if (![...actions.querySelectorAll("[data-close-modal]")].some(button => button.textContent.trim() === "Cancel")) {
    actions.insertAdjacentHTML("afterbegin", '<button class="modal-button" type="button" data-close-modal>Cancel</button>');
  }
  backdrop.hidden = false;
  document.body.classList.add("modal-open");
  $(".app-shell").inert = true;
  $("#modifierPopover").inert = true;
  $("#modalBody").scrollTop = 0;
  backdrop.scrollTop = 0;
  updateViewport();
  window.visualViewport?.addEventListener("resize", updateViewport);
  window.visualViewport?.addEventListener("scroll", updateViewport);
  backdrop.addEventListener("keydown", trapFocus);
  // Focusing a form field here opens a mobile keyboard before the user requests it.
  requestAnimationFrame(() => {
    if (!backdrop.hidden) $(".modal > header [data-close-modal]").focus({ preventScroll: true });
  });
}

export function closeModal(reason = "cancel") {
  const session = activeModal;
  activeModal = null;
  $("#modalBackdrop").hidden = true;
  document.body.classList.remove("modal-open");
  $(".app-shell").inert = false;
  $("#modifierPopover").inert = false;
  window.visualViewport?.removeEventListener("resize", updateViewport);
  window.visualViewport?.removeEventListener("scroll", updateViewport);
  $("#modalBackdrop").removeEventListener("keydown", trapFocus);
  session?.onClose?.(reason);
  if (session?.trigger?.isConnected) session.trigger.focus({ preventScroll: true });
}

function updateViewport() {
  const viewport = window.visualViewport;
  const style = $("#modalBackdrop").style;
  style.setProperty("--modal-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
  style.setProperty("--modal-viewport-top", `${viewport?.offsetTop ?? 0}px`);
}

function trapFocus(event) {
  if (event.key !== "Tab") return;
  const controls = [...$(".modal").querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')]
    .filter(element => !element.disabled && element.getClientRects().length);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function modalButtons(primary = "Save", includeDelete = false) {
  return `${includeDelete ? '<button class="modal-button danger" type="button" data-modal-delete>Delete</button>' : ""}<button class="modal-button" type="button" data-close-modal>Cancel</button><button class="modal-button primary" type="button" data-modal-save>${primary}</button>`;
}
