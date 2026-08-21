const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const mobilePanel = document.querySelector(".mobile-panel");

function setPanel(open) {
  body.classList.toggle("panel-open", open);
  mobilePanel.hidden = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
}

menuToggle.addEventListener("click", () => {
  setPanel(mobilePanel.hidden);
});

mobilePanel.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setPanel(false));
});

document.querySelectorAll("[data-player-announcement-modal]").forEach((modal) => {
  const tweetUrl = modal.dataset.tweetUrl;
  const closeButtons = modal.querySelectorAll("[data-announcement-close]");
  const params = new URLSearchParams(window.location.search);
  const forcePreview = params.has("previewAnnouncement");
  const storageKey = `spektr-player-announcement:${tweetUrl}`;

  if (!tweetUrl || (!forcePreview && localStorage.getItem(storageKey) === "seen")) {
    return;
  }

  function closeAnnouncement() {
    localStorage.setItem(storageKey, "seen");
    modal.hidden = true;
    body.classList.remove("modal-open");
  }

  function loadXEmbed() {
    if (window.twttr?.widgets) {
      window.twttr.widgets.load(modal);
      return;
    }

    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      script.onload = () => window.twttr?.widgets?.load(modal);
      document.head.appendChild(script);
      return;
    }

    window.twttr?.widgets?.load(modal);
  }

  function openAnnouncement() {
    modal.hidden = false;
    body.classList.add("modal-open");
    loadXEmbed();
  }

  openAnnouncement();

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeAnnouncement);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeAnnouncement();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.hidden && event.key === "Escape") {
      closeAnnouncement();
    }
  });
});

document.querySelectorAll(".roster-grid").forEach((grid) => {
  const cards = Array.from(grid.querySelectorAll(".player-card"));
  const tilePattern = [
    "tile-hero",
    "",
    "tile-tall",
    "",
    "tile-wide",
    "",
    "",
    "tile-tall",
    "tile-wide",
    "",
    "tile-hero",
    "",
    "",
    "tile-tall"
  ];

  for (let index = cards.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
  }

  cards.forEach((card, position) => {
    const playerName = card.querySelector("h2")?.textContent?.trim() || "";
    const compactName = playerName.replace(/\s|_/g, "");
    card.classList.remove("tile-hero", "tile-wide", "tile-tall", "long-name", "extra-long-name");
    if (compactName.length >= 11) {
      card.classList.add("long-name");
    }
    if (compactName.length >= 15) {
      card.classList.add("extra-long-name");
    }
    const tileClass = tilePattern[position % tilePattern.length];
    if (tileClass) {
      card.classList.add(tileClass);
    }
    grid.appendChild(card);
  });
});

document.querySelectorAll(".player-card[data-player-link]").forEach((card) => {
  const playerLink = card.dataset.playerLink;
  const platform = playerLink.includes("tiktok.com") ? "TikTok" : playerLink.includes("twitch.tv") ? "Twitch" : "Link";
  const badge = document.createElement("span");
  badge.className = `player-platform-badge ${platform.toLowerCase()}`;
  badge.setAttribute("aria-hidden", "true");
  badge.innerHTML = platform === "TikTok"
    ? '<svg viewBox="0 0 24 24"><path d="M15.7 3c.4 2.4 1.8 4 4.3 4.4v3.4c-1.6 0-3.1-.5-4.3-1.4v5.6c0 3.5-2.4 6-5.8 6-3.1 0-5.6-2.2-5.6-5.3 0-3.3 2.7-5.5 6.2-5.2v3.5c-1.5-.3-2.5.4-2.5 1.6 0 1 .8 1.7 1.8 1.7 1.2 0 2-.8 2-2.5V3h3.9Z"/></svg>'
    : platform === "Twitch"
      ? '<svg viewBox="0 0 24 24"><path d="M5.2 3h15.1v10.4l-4.2 4.2h-3.3l-2.2 2.4H8.4v-2.4H4V6.2L5.2 3Zm2.2 2.2v10.1h3.5v2l1.9-2h3.1l2.2-2.2V5.2H7.4Zm4.5 2.5h1.8v5.1h-1.8V7.7Zm4.1 0h1.8v5.1H16V7.7Z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></svg>';
  card.appendChild(badge);

  function openPlayerLink() {
    const playerWindow = window.open(card.dataset.playerLink, "_blank", "noopener,noreferrer");
    if (playerWindow) {
      playerWindow.opener = null;
    }
  }

  card.addEventListener("click", openPlayerLink);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPlayerLink();
    }
  });
});

function setRevealState(element, revealed) {
  element.classList.toggle("is-locked", !revealed);
  element.classList.toggle("is-revealed", revealed);
}

document.querySelectorAll("[data-reveal-at]").forEach((element) => {
  const target = new Date(element.dataset.revealAt).getTime();
  setRevealState(element, Date.now() >= target);
});

document.querySelectorAll(".about-stats").forEach((stats) => {
  const counters = Array.from(stats.querySelectorAll("[data-count-up]"));
  let isAnimating = false;
  let lastRun = 0;

  function render(counter, value) {
    counter.textContent = String(Math.round(value));
  }

  function animateCounter(counter, index) {
    const target = Number(counter.dataset.countUp);
    const duration = target > 100 ? 2200 : 1200;
    const delay = index * 130;

    if (!Number.isFinite(target)) {
      render(counter, target);
      return;
    }

    render(counter, 0);
    counter.classList.add("is-counting");

    setTimeout(() => {
      const startedAt = performance.now();

      function tick(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        render(counter, target * eased);

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          render(counter, target);
          counter.classList.remove("is-counting");
        }
      }

      requestAnimationFrame(tick);
    }, delay);
  }

  function animateStats() {
    const now = Date.now();
    if (isAnimating || now - lastRun < 900) {
      return;
    }
    isAnimating = true;
    lastRun = now;

    counters.forEach((counter) => render(counter, 0));
    counters.forEach(animateCounter);

    setTimeout(() => {
      isAnimating = false;
    }, 2800);
  }

  function setDynamicCounters() {
    const playerCounter = counters.find((counter) => counter.dataset.countSource === "players");

    if (!playerCounter) {
      return Promise.resolve();
    }

    return fetch("joueurs.html")
      .then((response) => response.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const totalPlayers = doc.querySelectorAll(".player-card").length;

        if (totalPlayers > 0) {
          playerCounter.dataset.countUp = String(totalPlayers);
        }
      })
      .catch(() => {
        const localTotal = document.querySelectorAll(".player-card").length;
        playerCounter.dataset.countUp = String(localTotal || 0);
      });
  }

  if (!("IntersectionObserver" in window)) {
    setDynamicCounters().then(animateStats);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      setDynamicCounters().then(animateStats);
    }
  }, { threshold: 0.45 });

  observer.observe(stats);
});

document.querySelectorAll("[data-countdown]").forEach((countdown) => {
  const target = new Date(countdown.dataset.countdown).getTime();
  const fields = {
    days: countdown.querySelector("[data-days]"),
    hours: countdown.querySelector("[data-hours]"),
    minutes: countdown.querySelector("[data-minutes]"),
    seconds: countdown.querySelector("[data-seconds]")
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function tick() {
    const remaining = Math.max(0, target - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    fields.days.textContent = pad(days);
    fields.hours.textContent = pad(hours);
    fields.minutes.textContent = pad(minutes);
    fields.seconds.textContent = pad(seconds);

    if (countdown.dataset.revealTarget) {
      document.querySelectorAll(countdown.dataset.revealTarget).forEach((element) => {
        setRevealState(element, remaining === 0);
      });
    }
  }

  tick();
  setInterval(tick, 1000);
});
