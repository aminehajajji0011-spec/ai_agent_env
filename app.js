const form = document.getElementById("prayer-form");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const timesEl = document.getElementById("times");
const locationEl = document.getElementById("location");
const dateEl = document.getElementById("date");
const timezoneEl = document.getElementById("timezone");
const methodLabelEl = document.getElementById("method-label");

const METHOD_LABELS = {
  2: "ISNA",
  3: "MWL",
  5: "Egyptian",
  12: "Karachi",
  15: "Moonsighting Committee",
};

const PRAYER_KEYS = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

const toTitle = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const updateStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#c0392b" : "";
};

const renderTimes = (timings) => {
  timesEl.innerHTML = "";
  PRAYER_KEYS.forEach((key) => {
    const item = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = toTitle(key);
    const value = document.createElement("span");
    value.textContent = timings[key] ?? "—";
    item.appendChild(label);
    item.appendChild(value);
    timesEl.appendChild(item);
  });
};

const fetchPrayerTimes = async ({ city, country, method }) => {
  const url = new URL("https://api.aladhan.com/v1/timingsByCity");
  url.searchParams.set("city", city);
  url.searchParams.set("country", country);
  url.searchParams.set("method", method);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Impossible de récupérer les horaires.");
  }
  const payload = await response.json();
  if (payload.code !== 200 || !payload.data) {
    throw new Error(payload.data ?? "Réponse inattendue de l'API.");
  }
  return payload.data;
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const city = formData.get("city").trim();
  const country = formData.get("country").trim();
  const method = formData.get("method");

  updateStatus("Mise à jour en cours…");
  resultsEl.hidden = true;

  try {
    const data = await fetchPrayerTimes({ city, country, method });
    const { timings, date, meta } = data;

    locationEl.textContent = `${city}, ${country}`;
    dateEl.textContent = `${date.readable} • ${date.hijri.date}`;
    timezoneEl.textContent = meta.timezone;
    methodLabelEl.textContent = `Méthode: ${METHOD_LABELS[method] ?? method}`;
    renderTimes(timings);

    resultsEl.hidden = false;
    updateStatus("Horaires à jour.");
  } catch (error) {
    updateStatus(error.message || "Une erreur est survenue.", true);
  }
};

form.addEventListener("submit", handleSubmit);

handleSubmit(new Event("submit"));
