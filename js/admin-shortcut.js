const logo = document.querySelector("[data-admin-shortcut]");
let clickCount = 0;
let resetTimer;

logo?.addEventListener("click", (event) => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  clickCount += 1;
  window.clearTimeout(resetTimer);
  resetTimer = window.setTimeout(() => {
    clickCount = 0;
  }, 1500);

  if (clickCount === 3) {
    event.preventDefault();
    window.location.assign("admin.html");
  }
});
