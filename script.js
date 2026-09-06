const body = document.body;
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobilePanel = document.querySelector(".mobile-panel");

if (siteHeader) {
  let lastScrollY = window.scrollY;
  let isHeaderTicking = false;

  function updateHeaderVisibility() {
    const currentScrollY = Math.max(window.scrollY, 0);
    const delta = currentScrollY - lastScrollY;
    const isLocked = body.classList.contains("panel-open") || body.classList.contains("modal-open");

    if (isLocked || currentScrollY < 12) {
      siteHeader.classList.remove("is-hidden");
    } else if (currentScrollY > 120 && delta > 8) {
      siteHeader.classList.add("is-hidden");
    } else if (delta < -8) {
      siteHeader.classList.remove("is-hidden");
    }

    lastScrollY = currentScrollY;
    isHeaderTicking = false;
  }

  window.addEventListener("scroll", () => {
    if (!isHeaderTicking) {
      window.requestAnimationFrame(updateHeaderVisibility);
      isHeaderTicking = true;
    }
  }, { passive: true });

  updateHeaderVisibility();
}

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
  const storageKey = "spektr-player-announcement";
  const lastVideoKey = `${storageKey}:last-video`;
  const videoOptions = (modal.dataset.videoSrcList || "")
    .split("|")
    .map((src) => src.trim())
    .filter(Boolean);
  const tweetOptions = (modal.dataset.tweetUrlList || "")
    .split("|")
    .map((url) => url.trim())
    .filter(Boolean);
  const fallbackVideoOptions = videoOptions.length
    ? videoOptions
    : [modal.dataset.videoSrc].filter(Boolean);
  const lastVideoSrc = sessionStorage.getItem(lastVideoKey);
  const videoChoices = fallbackVideoOptions.map((src, index) => ({ src, index }));
  const freshVideoChoices = videoChoices.length > 1
    ? videoChoices.filter((choice) => choice.src !== lastVideoSrc)
    : videoChoices;
  const videoPool = freshVideoChoices.length ? freshVideoChoices : videoChoices;
  const selectedVideo = videoPool.length
    ? videoPool[Math.floor(Math.random() * videoPool.length)]
    : null;
  const videoSrc = selectedVideo?.src || "";
  const tweetUrl = tweetOptions[selectedVideo?.index] || modal.dataset.tweetUrl;
  const video = modal.querySelector("[data-announcement-video]");
  const soundButton = modal.querySelector("[data-announcement-sound]");
  const closeButtons = modal.querySelectorAll("[data-announcement-close]");
  const xButtons = modal.querySelectorAll(".announcement-x-button");
  const params = new URLSearchParams(window.location.search);
  const forcePreview = params.has("previewAnnouncement");

  if ((!videoSrc && !tweetUrl) || (!forcePreview && sessionStorage.getItem(storageKey) === "seen")) {
    return;
  }

  if (video && videoSrc) {
    video.src = videoSrc;
    video.dataset.selectedVideoSrc = videoSrc;
    sessionStorage.setItem(lastVideoKey, videoSrc);
  }

  xButtons.forEach((button) => {
    button.href = tweetUrl;
  });

  function closeAnnouncement() {
    sessionStorage.setItem(storageKey, "seen");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    modal.hidden = true;
    body.classList.remove("modal-open");
  }

  function playAnnouncementVideo() {
    if (!video) {
      return;
    }

    video.volume = 0.08;
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      video.volume = 0.08;
      soundButton?.removeAttribute("hidden");
      video.play().catch(() => {
        video.controls = true;
      });
    });
  }

  if (video) {
    video.volume = 0.08;
    video.addEventListener("ended", closeAnnouncement);
    video.addEventListener("volumechange", () => {
      soundButton?.toggleAttribute("hidden", !video.muted);
    });
  }

  if (soundButton && video) {
    soundButton.addEventListener("click", () => {
      video.volume = 0.08;
      video.muted = false;
      soundButton.setAttribute("hidden", "");
      video.play().catch(() => {
        soundButton.removeAttribute("hidden");
      });
    });
  }

  function openAnnouncement() {
    modal.hidden = false;
    body.classList.add("modal-open");
    playAnnouncementVideo();
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

document.querySelectorAll(".players-intro, .player-card .player-content").forEach((element) => {
  element.setAttribute("data-text-reveal", "");
});

const textRevealElements = document.querySelectorAll("[data-text-reveal]");

if ("IntersectionObserver" in window) {
  const textRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        textRevealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.16
  });

  textRevealElements.forEach((element) => textRevealObserver.observe(element));
} else {
  textRevealElements.forEach((element) => element.classList.add("is-visible"));
}

document.querySelectorAll(".about-stats").forEach((stats) => {
  const counters = Array.from(stats.querySelectorAll("[data-count-up]"));
  let isAnimating = false;
  let hasAnimated = false;

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
    if (isAnimating || hasAnimated) {
      return;
    }
    isAnimating = true;
    hasAnimated = true;

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

    const rosterPages = ["warzone.html", "battlefield-6.html"];

    return Promise.all(rosterPages.map((page) => fetch(page).then((response) => response.text())))
      .then((pages) => {
        const totalPlayers = pages.reduce((total, html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          return total + doc.querySelectorAll(".player-card").length;
        }, 0);

        playerCounter.dataset.countUp = String(totalPlayers);
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
      observer.unobserve(stats);
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
