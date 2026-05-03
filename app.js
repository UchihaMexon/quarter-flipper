const coin = document.querySelector("#coin");
const result = document.querySelector("#result");
const flipButton = document.querySelector("#flipButton");
const soundButton = document.querySelector("#soundButton");
const resetButton = document.querySelector("#resetButton");
const durationInputs = document.querySelectorAll('input[name="duration"]');
const clickSound = document.querySelector("#clickSound");
const resultSound = document.querySelector("#resultSound");
let clickSoundStarted = false;
let soundEnabled = localStorage.getItem("quarterFlipperSound") !== "off";

const sides = [
  {
    label: "Heads",
    sideOffset: 0,
    image: "assets/coin-heads-clean.png",
  },
  {
    label: "Tails",
    sideOffset: 180,
    image: "assets/coin-tails-clean.png",
  },
];

let currentRotation = 0;

function getFlipTime() {
  return Number(document.querySelector('input[name="duration"]:checked').value);
}

function setDurationDisabled(isDisabled) {
  durationInputs.forEach((input) => {
    input.disabled = isDisabled;
  });

  resetButton.disabled = isDisabled;
}

function playSound(sound) {
  if (!soundEnabled) {
    return;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function stopSound(sound) {
  sound.pause();
  sound.currentTime = 0;
}

function updateSoundButton() {
  soundButton.setAttribute("aria-pressed", String(!soundEnabled));
  soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  soundButton.classList.toggle("is-muted", !soundEnabled);
}

function setCursorLoaderPosition(event) {
  document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
}

function flipCoin() {
  if (flipButton.disabled) {
    return;
  }

  const flipTime = getFlipTime();
  if (!clickSoundStarted) {
    playSound(clickSound);
  }
  clickSoundStarted = false;
  stopSound(resultSound);
  document.body.style.setProperty("--flip-time", `${flipTime}ms`);
  document.body.classList.add("is-flipping");
  flipButton.disabled = true;
  setDurationDisabled(true);
  result.classList.remove("is-pop");
  result.textContent = "Flipping...";

  const side = sides[Math.floor(Math.random() * sides.length)];
  const fullSpins = Math.max(5, Math.round(flipTime / 260)) + Math.floor(Math.random() * 3);
  const currentSideOffset = ((currentRotation % 360) + 360) % 360;
  const sideAdjustment = (side.sideOffset - currentSideOffset + 360) % 360;
  currentRotation += fullSpins * 360 + sideAdjustment;

  requestAnimationFrame(() => {
    coin.classList.add("is-flipping");
    coin.style.setProperty("--flip-time", `${flipTime}ms`);
    coin.style.setProperty("--coin-rotation", `${currentRotation}deg`);
  });

  window.setTimeout(() => {
    result.innerHTML = `It landed on <span class="result-side">${side.label}</span>`;
    result.classList.add("is-pop");
    playSound(resultSound);
    coin.classList.remove("is-flipping");
    document.body.classList.remove("is-flipping");
    flipButton.disabled = false;
    setDurationDisabled(false);
    flipButton.focus();
  }, flipTime);
}

function resetCoin() {
  if (flipButton.disabled) {
    return;
  }

  currentRotation = 0;
  stopSound(resultSound);
  result.classList.remove("is-pop");
  result.textContent = "Press the button.";
  coin.classList.remove("is-flipping");
  coin.style.setProperty("--flip-time", "420ms");
  coin.style.setProperty("--coin-rotation", "0deg");
  document.body.classList.remove("is-flipping");
}

clickSound.load();
resultSound.load();
updateSoundButton();

flipButton.addEventListener("pointerdown", () => {
  if (flipButton.disabled) {
    return;
  }

  playSound(clickSound);
  clickSoundStarted = true;
});

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("quarterFlipperSound", soundEnabled ? "on" : "off");
  if (!soundEnabled) {
    stopSound(clickSound);
    stopSound(resultSound);
  }
  updateSoundButton();
});

resetButton.addEventListener("click", resetCoin);
document.addEventListener("pointermove", setCursorLoaderPosition);
flipButton.addEventListener("pointerdown", setCursorLoaderPosition);
flipButton.addEventListener("click", flipCoin);
