(() => {
  const items = JSON.parse(document.querySelector("#lesson-data").textContent);
  const state = {
    index: 0,
    autoRunning: false,
    runId: 0,
    audio: null,
    finishAudio: null,
  };

  const $ = (selector) => document.querySelector(selector);
  const delay = (milliseconds) =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  document.querySelectorAll("[data-total]").forEach((node) => {
    node.textContent = String(items.length);
  });

  function stopAudio() {
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      state.audio = null;
    }
    if (state.finishAudio) {
      const finish = state.finishAudio;
      state.finishAudio = null;
      finish(false);
    }
    $(".speaking-status").classList.remove("is-speaking");
    $("#statusText").textContent = "Sẵn sàng";
  }

  function updateAutoButton() {
    $("#autoLabel").textContent = state.autoRunning ? "Tạm dừng" : "Học tự động";
    $("#autoButton").querySelector("[aria-hidden]").textContent =
      state.autoRunning ? "Ⅱ" : "▶";
  }

  function stopAuto() {
    state.runId += 1;
    state.autoRunning = false;
    stopAudio();
    updateAutoButton();
  }

  function currentItem() {
    return items[state.index];
  }

  function renderDots() {
    $("#learnDots").replaceChildren(
      ...items.map((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(index + 1);
        button.classList.toggle("is-active", index === state.index);
        button.setAttribute("aria-label", `Mở từ ${index + 1}`);
        button.addEventListener("click", () => {
          stopAuto();
          state.index = index;
          render();
        });
        return button;
      }),
    );
  }

  function render() {
    const item = currentItem();
    $("#learnImage").src = `assets/images/${item.slug}.webp`;
    $("#learnImage").alt = item.word;
    $("#word").textContent = item.word;
    $("#ipa").textContent = item.ipa;
    $("#meaning").textContent = item.meaning;
    $("#focus").textContent = item.focus;
    $("#example").textContent = item.example;
    $("#learnNumber").textContent = String(state.index + 1);
    $("#learnProgress").style.width = `${((state.index + 1) / items.length) * 100}%`;
    renderDots();
  }

  function playCurrent() {
    const item = currentItem();
    return new Promise((resolve) => {
      stopAudio();
      const audio = new Audio(`assets/audio/${item.slug}.mp3`);
      let settled = false;

      const finish = (played) => {
        if (settled) return;
        settled = true;
        if (state.audio === audio) state.audio = null;
        if (state.finishAudio === finish) state.finishAudio = null;
        $(".speaking-status").classList.remove("is-speaking");
        $("#statusText").textContent = played ? "Đã nghe xong" : "Sẵn sàng";
        resolve(played);
      };

      state.audio = audio;
      state.finishAudio = finish;
      audio.preload = "auto";
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      $(".speaking-status").classList.add("is-speaking");
      $("#statusText").textContent = "Nghe kỹ và đọc theo";
      audio.play().catch(() => {
        $("#autoplayGate").hidden = false;
        finish(false);
      });
    });
  }

  async function runAuto() {
    stopAuto();
    const token = ++state.runId;
    state.autoRunning = true;
    updateAutoButton();
    const startIndex = state.index;

    for (let offset = 0; offset < items.length; offset += 1) {
      if (token !== state.runId) return;
      state.index = (startIndex + offset) % items.length;
      render();
      const played = await playCurrent();
      if (!played || token !== state.runId) break;
      await delay(900);
    }

    if (token === state.runId) {
      state.autoRunning = false;
      stopAudio();
      updateAutoButton();
    }
  }

  function move(step) {
    stopAuto();
    state.index = (state.index + step + items.length) % items.length;
    render();
  }

  $("#previousWord").addEventListener("click", () => move(-1));
  $("#nextWord").addEventListener("click", () => move(1));
  $("#pictureButton").addEventListener("click", () => {
    stopAuto();
    playCurrent();
  });
  $("#replayButton").addEventListener("click", () => {
    stopAuto();
    playCurrent();
  });
  $("#autoButton").addEventListener("click", () => {
    if (state.autoRunning) stopAuto();
    else runAuto();
  });
  $("#unlockAudio").addEventListener("click", () => {
    $("#autoplayGate").hidden = true;
    runAuto();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  render();
  window.setTimeout(runAuto, 500);
})();
