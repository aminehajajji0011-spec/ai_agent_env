const form = document.getElementById("prayer-form");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const timesEl = document.getElementById("times");
const locationEl = document.getElementById("location");
const dateEl = document.getElementById("date");
const timezoneEl = document.getElementById("timezone");
const methodLabelEl = document.getElementById("method-label");
const updatedAtEl = document.getElementById("updated-at");
const geoButton = document.getElementById("geo-button");

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

const fetchPrayerTimesByCity = async ({ city, country, method }) => {
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

const fetchPrayerTimesByCoords = async ({ latitude, longitude, method }) => {
  const url = new URL("https://api.aladhan.com/v1/timings");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
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

const renderResponse = ({ data, locationLabel, method }) => {
  const { timings, date, meta } = data;

  locationEl.textContent = locationLabel;
  dateEl.textContent = `${date.readable} • ${date.hijri.date}`;
  timezoneEl.textContent = meta.timezone;
  methodLabelEl.textContent = `Méthode: ${METHOD_LABELS[method] ?? method}`;
  updatedAtEl.textContent = `Actualisé: ${new Date().toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
  renderTimes(timings);

  resultsEl.hidden = false;
  updateStatus("Horaires à jour.");
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
    const data = await fetchPrayerTimesByCity({ city, country, method });
    renderResponse({
      data,
      locationLabel: `${city}, ${country}`,
      method,
    });
  } catch (error) {
    updateStatus(error.message || "Une erreur est survenue.", true);
  }
};

const handleGeolocation = () => {
  if (!navigator.geolocation) {
    updateStatus("La géolocalisation n'est pas disponible.", true);
    return;
  }

  const method = new FormData(form).get("method");
  updateStatus("Localisation en cours…");
  resultsEl.hidden = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const data = await fetchPrayerTimesByCoords({
          latitude,
          longitude,
          method,
        });
        renderResponse({
          data,
          locationLabel: `Position actuelle (${latitude.toFixed(
            2,
          )}, ${longitude.toFixed(2)})`,
          method,
        });
      } catch (error) {
        updateStatus(error.message || "Une erreur est survenue.", true);
      }
    },
    () => {
      updateStatus("Impossible d'obtenir votre position.", true);
    },
    { timeout: 10000 },
  );
};

form.addEventListener("submit", handleSubmit);
geoButton.addEventListener("click", handleGeolocation);

handleSubmit(new Event("submit"));
