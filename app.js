const coin = document.querySelector("#coin");
const coinView = document.querySelector(".coin-view");
const result = document.querySelector("#result");
const flipButton = document.querySelector("#flipButton");
const soundButton = document.querySelector("#soundButton");
const resetButton = document.querySelector("#resetButton");
const durationInputs = Array.from(document.querySelectorAll('input[name="duration"]'));
const cursorLoader = document.querySelector("#cursorLoader");
const clickSound = document.querySelector("#clickSound");
const resultSound = document.querySelector("#resultSound");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mouseCursor = window.matchMedia("(hover: hover) and (pointer: fine)");
const soundKey = "quarterFlipperSound";

let soundEnabled = true;
try {
  soundEnabled = localStorage.getItem(soundKey) !== "off";
} catch {
  // Sound still works when storage is unavailable.
}

let currentAngle = 0;
let spin = null;
let lift = null;
let resetMotion = null;
let mousePosition = null;

clickSound.volume = 0.8;
resultSound.volume = 0.8;

function stopSound(sound) {
  sound.pause();
  if (sound.currentTime > 0) {
    sound.currentTime = 0;
  }
}

function playSound(sound) {
  if (soundEnabled) {
    stopSound(sound);
    sound.play().catch(() => {});
  }
}

function updateSoundButton() {
  soundButton.setAttribute("aria-pressed", String(!soundEnabled));
  soundButton.title = soundEnabled ? "Mute sound" : "Unmute sound";
}

function updateCursor() {
  const visible = Boolean(mousePosition && mouseCursor.matches);
  document.body.classList.toggle("has-mouse", visible);
  if (visible) {
    const { x, y } = mousePosition;
    cursorLoader.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
}

function trackPointer(event) {
  mousePosition = event.pointerType === "mouse" ? { x: event.clientX, y: event.clientY } : null;
  if (spin) {
    updateCursor();
  }
}

function setSpinning(isSpinning) {
  document.body.classList.toggle("is-flipping", isSpinning);
  if (isSpinning) {
    flipButton.setAttribute("aria-disabled", "true");
    updateCursor();
  } else {
    flipButton.removeAttribute("aria-disabled");
    document.body.classList.remove("has-mouse");
  }
  durationInputs.forEach((input) => {
    input.disabled = isSpinning;
  });
}

function rotation(angle) {
  return `rotateY(${angle}deg)`;
}

function settleCoin(angle) {
  currentAngle = angle;
  coin.style.transform = rotation(angle);
  if (spin) {
    spin.onfinish = null;
    spin.cancel();
  }
  lift?.cancel();
  spin = null;
  lift = null;
  setSpinning(false);
}

function flipCoin() {
  if (spin || resetMotion) {
    return;
  }

  playSound(clickSound);
  stopSound(resultSound);

  const duration = Number(durationInputs.find((input) => input.checked).value);
  const isHeads = Math.random() < 0.5;
  const angle = isHeads ? 0 : 180;
  const side = isHeads ? "Heads" : "Tails";
  const motionEnabled = !reduceMotion.matches;
  const turns = Math.round(duration / 550);
  const adjustment = (angle - currentAngle + 360) % 360;
  const endAngle = motionEnabled ? currentAngle + turns * 360 + adjustment : currentAngle;

  spin = coin.animate(
    [{ transform: rotation(currentAngle) }, { transform: rotation(endAngle) }],
    { duration, fill: "forwards", easing: "cubic-bezier(0.24, 0.37, 0.59, 1)" },
  );
  if (motionEnabled) {
    const restingPose = "translateY(0) rotateZ(0deg) scale(1)";
    lift = coinView.animate(
      [
        { transform: restingPose, easing: "cubic-bezier(0.2, 0.65, 0.35, 1)" },
        {
          transform: "translateY(-21px) rotateZ(-4deg) scale(1.035)",
          offset: 460 / duration,
          easing: "ease-in-out",
        },
        { transform: restingPose },
      ],
      { duration },
    );
  }

  setSpinning(true);
  result.textContent = "Flipping...";

  spin.onfinish = () => {
    settleCoin(angle);
    const message = document.createElement("span");
    const outcome = document.createElement("strong");
    outcome.className = "result-side";
    outcome.dataset.side = side;
    outcome.textContent = side;
    message.append("It landed on ", outcome);
    result.replaceChildren(message);
    playSound(resultSound);
  };
}

function resetCoin() {
  if (resetMotion) {
    return;
  }

  stopSound(clickSound);
  stopSound(resultSound);
  result.textContent = "";

  if (reduceMotion.matches || (!spin && currentAngle === 0)) {
    settleCoin(0);
    return;
  }

  // Capture the visible pose before cancelling the cast.
  const transform = new DOMMatrixReadOnly(getComputedStyle(coin).transform);
  const startAngle = Math.atan2(transform.m31, transform.m11) * 180 / Math.PI;
  const liftedPose = getComputedStyle(coinView).transform;
  const timing = { duration: 340, easing: "cubic-bezier(0.23, 0.45, 0.38, 1)" };
  settleCoin(0);

  flipButton.setAttribute("aria-disabled", "true");
  resetMotion = coin.animate(
    [{ transform: rotation(startAngle) }, { transform: rotation(0) }],
    timing,
  );
  if (liftedPose !== "none") {
    coinView.animate([{ transform: liftedPose }, { transform: "none" }], timing);
  }
  resetMotion.onfinish = () => {
    resetMotion = null;
    flipButton.removeAttribute("aria-disabled");
  };
}

updateSoundButton();
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem(soundKey, soundEnabled ? "on" : "off");
  } catch {
    // The setting remains available for this page visit.
  }
  if (!soundEnabled) {
    stopSound(clickSound);
    stopSound(resultSound);
  }
  updateSoundButton();
});

resetButton.addEventListener("click", resetCoin);
flipButton.addEventListener("click", flipCoin);
document.addEventListener("pointermove", trackPointer);
document.addEventListener("pointerdown", trackPointer);
document.addEventListener("pointerout", (event) => {
  if (!event.relatedTarget) {
    mousePosition = null;
    if (spin) {
      updateCursor();
    }
  }
});
