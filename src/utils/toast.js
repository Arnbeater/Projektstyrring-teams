export function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast-overlay toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  // Trigger animation on next frame
  requestAnimationFrame(() => el.classList.add("toast-visible"));
  setTimeout(() => {
    el.classList.remove("toast-visible");
    setTimeout(() => document.body.removeChild(el), 300);
  }, 3200);
}
