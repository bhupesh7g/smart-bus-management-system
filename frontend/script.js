// Sample bus data - later backend se connect hoga
const buses = [
  {
    id: 1,
    number: "UP-15-AB-1234",
    route: ["Meerut", "Begum Bridge", "Saket", "Modipuram"],
    departure: "08:30 AM",
    eta: "15 min",
    seats: 18,
    capacity: 50
  },
  {
    id: 2,
    number: "UP-15-CD-5678",
    route: ["Meerut", "Saket", "Modipuram"],
    departure: "09:00 AM",
    eta: "25 min",
    seats: 12,
    capacity: 45
  },
  {
    id: 3,
    number: "UP-15-EF-9012",
    route: ["Meerut", "Begum Bridge", "Modipuram"],
    departure: "09:30 AM",
    eta: "35 min",
    seats: 25,
    capacity: 50
  }
];

let selectedBus = null;
let journeyStarted = false;
let reports = [];

function switchRole() {
  const role = document.getElementById("roleSelect").value;

  document.getElementById("passengerDashboard")
    .classList.toggle("hidden", role !== "passenger");

  document.getElementById("controllerDashboard")
    .classList.toggle("hidden", role !== "controller");

  if (role === "controller") {
    renderReports();
  }
}

function renderBuses(list) {
  const busList = document.getElementById("busList");
  busList.innerHTML = "";

  if (list.length === 0) {
    busList.innerHTML =
      '<div class="panel">No buses found for this stop.</div>';
    return;
  }

  list.forEach(bus => {
    const card = document.createElement("div");
    card.className = "bus-card" +
      (selectedBus?.id === bus.id ? " selected" : "");

    card.innerHTML = `
      <div class="bus-card-top">
        <div>
          <div class="bus-number">🚌 ${bus.number}</div>
          <p class="muted">${bus.route.join(" → ")}</p>
        </div>
        <span class="bus-tag">Available</span>
      </div>
      <div class="bus-info">
        <div>
          <span class="small-label">Departure</span>
          <strong>${bus.departure}</strong>
        </div>
        <div>
          <span class="small-label">Available Seats</span>
          <strong>${bus.seats}/${bus.capacity}</strong>
        </div>
        <div>
          <span class="small-label">Estimated Arrival</span>
          <strong>${bus.eta}</strong>
        </div>
      </div>
    `;

    card.onclick = () => showBusDetails(bus.id);
    busList.appendChild(card);
  });
}

function searchBuses() {
  const stop = document.getElementById("stopInput")
    .value.trim().toLowerCase();

  const filtered = stop
    ? buses.filter(bus =>
        bus.route.some(s => s.toLowerCase().includes(stop))
      )
    : buses;

  selectedBus = null;
  document.getElementById("resultText").textContent =
    `${filtered.length} bus(es) found`;

  document.getElementById("busDetails").innerHTML = `
    <div class="empty-state">
      <div>🔎</div>
      <h3>Select a bus</h3>
      <p class="muted">Choose a bus to see its details.</p>
    </div>
  `;

  renderBuses(filtered);
}

function showBusDetails(id) {
  selectedBus = buses.find(bus => bus.id === id);

  const bus = selectedBus;

  document.getElementById("busDetails").innerHTML = `
    <h2>🚌 Bus Details</h2>
    <h3>${bus.number}</h3>
    <p class="muted">${bus.route.join(" → ")}</p>

    <div class="details-grid">
      <div class="detail-box">
        <span class="small-label">Departure Time</span>
        <strong>${bus.departure}</strong>
      </div>
      <div class="detail-box">
        <span class="small-label">Estimated Arrival</span>
        <strong>${bus.eta}</strong>
      </div>
      <div class="detail-box">
        <span class="small-label">Available Seats</span>
        <strong>${bus.seats}</strong>
      </div>
    </div>

    <h3>Live Bus Tracking</h3>
    <div class="map-demo">
      <div class="map-pin">🚌</div>
      <div class="demo-label">
        Demo location · Real GPS not connected
      </div>
    </div>

    <p class="muted" style="margin-top:12px">
      Location: ${bus.route[0]} (sample data)
    </p>
  `;

  renderBuses(buses);
}

function submitReport() {
  const type = document.getElementById("reportType").value;
  const message = document.getElementById("reportMessage")
    .value.trim();

  if (!message) {
    alert("Please enter your update first.");
    return;
  }

  reports.unshift({
    type,
    message,
    time: new Date().toLocaleTimeString()
  });

  document.getElementById("reportMessage").value = "";
  document.getElementById("reportStatus").textContent =
    "Report submitted successfully (demo).";

  renderReports();
}

function renderReports() {
  const container = document.getElementById("controllerReports");

  if (reports.length === 0) {
    container.innerHTML =
      '<p class="empty-text">No passenger reports yet.</p>';
    return;
  }

  container.innerHTML = reports.map(report => `
    <div class="report-item">
      <strong>${escapeHTML(report.type)}</strong>
      <p>${escapeHTML(report.message)}</p>
      <p>Submitted at: ${report.time}</p>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function toggleJourney() {
  journeyStarted = !journeyStarted;

  document.getElementById("journeyButton").textContent =
    journeyStarted ? "End Journey" : "Start Journey";

  document.getElementById("controllerStatus").textContent =
    journeyStarted
      ? "Journey started (demo)."
      : "Journey ended (demo).";
}

function updateBusInfo() {
  const seats = Number(document.getElementById("seatCount").value);
  const stop = document.getElementById("currentStop").value.trim();
  const busNumber = document.getElementById("controllerBus").value.trim();

  if (!busNumber || !stop || !Number.isInteger(seats) ||
      seats < 0 || seats > 50) {
    alert("Please enter valid bus details and seats (0-50).");
    return;
  }

  document.getElementById("controllerStatus").textContent =
    `Bus ${busNumber} updated. Stop: ${stop}, Seats: ${seats} (demo).`;
}

// Initial display
renderBuses(buses);
// Check selected login role
const savedRole = sessionStorage.getItem("smartbusRole");

if (savedRole) {
  document.getElementById("roleSelect").value = savedRole;
  switchRole();
}

function logout() {
  sessionStorage.removeItem("smartbusRole");
  sessionStorage.removeItem("smartbusEmail");
  window.location.href = "login.html";
}