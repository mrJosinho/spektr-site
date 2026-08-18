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
  }

  tick();
  setInterval(tick, 1000);
});
