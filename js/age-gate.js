const ageGate = document.querySelector("#ageGate");
const ageCard = ageGate.querySelector(".age-gate__card");
const confirmButton = document.querySelector("#ageYes");
const denyButton = document.querySelector("#ageNo");
const deniedMessage = document.querySelector("#ageDenied");
const ageStorageKey = "cannabisEducationAgeConfirmed18";

function closeAgeGate() {
  ageGate.hidden = true;
  document.body.classList.remove("age-gate-open");
}

function openAgeGate() {
  ageGate.hidden = false;
  document.body.classList.add("age-gate-open");
  confirmButton.focus();
}

try {
  if (sessionStorage.getItem(ageStorageKey) === "true") {
    closeAgeGate();
  } else {
    openAgeGate();
  }
} catch (error) {
  console.error("Could not read the age-confirmation session.", error);
  openAgeGate();
}

confirmButton.addEventListener("click", () => {
  try {
    sessionStorage.setItem(ageStorageKey, "true");
  } catch (error) {
    console.error("Could not save the age confirmation for this session.", error);
  }

  closeAgeGate();
});

denyButton.addEventListener("click", () => {
  confirmButton.hidden = true;
  denyButton.hidden = true;
  deniedMessage.hidden = false;
  deniedMessage.focus();
});

ageGate.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...ageGate.querySelectorAll("button:not([hidden])")];
  if (focusable.length === 0) {
    event.preventDefault();
    ageCard.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
