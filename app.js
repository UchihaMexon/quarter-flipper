const coin = document.querySelector("#coin");
const result = document.querySelector("#result");
const flipButton = document.querySelector("#flipButton");
const durationInputs = document.querySelectorAll('input[name="duration"]');
const clickSound = document.querySelector("#clickSound");
let clickSoundStarted = false;

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
}

function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function setCursorLoaderPosition(event) {
  document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
}

function flipCoin() {
  const flipTime = getFlipTime();
  if (!clickSoundStarted) {
    playClickSound();
  }
  clickSoundStarted = false;
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
    coin.classList.remove("is-flipping");
    document.body.classList.remove("is-flipping");
    flipButton.disabled = false;
    setDurationDisabled(false);
    flipButton.focus();
  }, flipTime);
}

clickSound.load();

flipButton.addEventListener("pointerdown", () => {
  if (flipButton.disabled) {
    return;
  }

  playClickSound();
  clickSoundStarted = true;
});

document.addEventListener("pointermove", setCursorLoaderPosition);
flipButton.addEventListener("pointerdown", setCursorLoaderPosition);
flipButton.addEventListener("click", flipCoin);
