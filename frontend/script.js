
const API = "http://127.0.0.1:5000";

let currentUserRole = null;
let buses = [];
let selectedBus = null;
let controllerBuses = [];
let journeyStarted = false;
let reports = [];

// Verify user session and role
async function checkUserRole() {
  try {
    const response = await fetch(`${API}/api/auth/me`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      sessionStorage.removeItem("smartbusRole");
      sessionStorage.removeItem("smartbusEmail");

      window.location.replace("login.html");
      return;
    }

    const data = await response.json();

    currentUserRole = data.user.role;

    if (
      currentUserRole !== "passenger" &&
      currentUserRole !== "controller"
    ) {
      window.location.replace("login.html");
      return;
    }

    sessionStorage.setItem("smartbusRole", currentUserRole);
    sessionStorage.setItem("smartbusEmail", data.user.email);

    const roleSelect = document.getElementById("roleSelect");

    roleSelect.value = currentUserRole;
    roleSelect.disabled = true;

    switchRole();
      if (currentUserRole === "controller") {
         renderReports();
         loadControllerBuses();
}
  } catch (error) {
    console.error("Session verification failed:", error);
    window.location.replace("login.html");
  }
}


// Display correct dashboard
function switchRole() {
  if (!currentUserRole) return;

  const roleSelect = document.getElementById("roleSelect");

  roleSelect.value = currentUserRole;
  roleSelect.disabled = true;

  document.getElementById("passengerDashboard")
    .classList.toggle("hidden", currentUserRole !== "passenger");

  document.getElementById("controllerDashboard")
    .classList.toggle("hidden", currentUserRole !== "controller");

  if (currentUserRole === "controller") {
    renderReports();
  }
}


// Load buses from backend
async function loadBuses(search = "") {
  if (currentUserRole !== "passenger") return;

  try {
    const response = await fetch(
      `${API}/api/buses/?search=${encodeURIComponent(search)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load buses");
    }

    buses = data.buses.map(bus => ({
      id: bus.id,
      number: bus.bus_number,
      seats: bus.available_seats,
      capacity: bus.total_seats,
      location: bus.current_location || "Not updated",
      journeyStarted: bus.journey_started,
      route: bus.routes.length
        ? bus.routes.flatMap(r => [
            r.start_point,
            r.end_point
          ]).filter((v, i, a) => a.indexOf(v) === i)
        : []
    }));

    document.getElementById("resultText").textContent =
      `${buses.length} bus(es) found`;

    renderBuses(buses);

  } catch (error) {
    document.getElementById("busList").innerHTML =
      `<div class="panel">Unable to load buses: ${escapeHTML(error.message)}</div>`;
  }
}


async function loadControllerBuses() {
  const dropdown = document.getElementById("controllerBus");

  try {
    dropdown.innerHTML = '<option value="">Loading buses...</option>';

    const response = await fetch(`${API}/api/buses/`, {
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load buses");
    }
    controllerBuses = data.buses;
    dropdown.innerHTML = '<option value="">Select Bus Number</option>';

    data.buses.forEach(bus => {
      const option = document.createElement("option");
      option.value = bus.bus_number;
      option.textContent = bus.bus_number;
      dropdown.appendChild(option);
    });

    if (data.buses.length === 0) {
      dropdown.innerHTML = '<option value="">No buses added yet</option>';
    }

  } catch (error) {
    dropdown.innerHTML = '<option value="">Unable to load buses</option>';
    console.error(error);
  }
}

// Render bus cards
function renderBuses(list) {
  const busList = document.getElementById("busList");

  busList.innerHTML = "";

  if (!list.length) {
    busList.innerHTML =
      '<div class="panel">No buses found.</div>';
    return;
  }

  list.forEach(bus => {
    const card = document.createElement("div");

    card.className = "bus-card" +
      (selectedBus?.id === bus.id ? " selected" : "");

    card.innerHTML = `
      <div class="bus-card-top">
        <div>
          <div class="bus-number">
            🚌 ${escapeHTML(bus.number)}
          </div>
          <p class="muted">
            ${escapeHTML(bus.route.join(" → ") || bus.location)}
          </p>
        </div>

        <span class="bus-tag">
          ${bus.seats > 0 ? "Available" : "Full"}
        </span>
      </div>
      <p class="muted">
  Journey Status:
  <strong>
    ${bus.journeyStarted ? "Journey Started" : "Not Started"}
  </strong>
</p>

      <div class="bus-info">
        <div>
          <span class="small-label">Available Seats</span>
          <strong>${bus.seats}/${bus.capacity}</strong>
        </div>

        <div>
          <span class="small-label">Current Location</span>
          <strong>${escapeHTML(bus.location)}</strong>
        </div>
      </div>
    `;

    card.onclick = () => showBusDetails(bus.id);

    busList.appendChild(card);
  });
}


// Search buses
function searchBuses() {
  if (currentUserRole !== "passenger") return;

  const stop =
    document.getElementById("stopInput").value.trim();

  selectedBus = null;

  loadBuses(stop);
}


// Show selected bus details
function showBusDetails(id) {
  if (currentUserRole !== "passenger") return;

  selectedBus = buses.find(bus => bus.id === id);

  const bus = selectedBus;

  if (!bus) return;

  document.getElementById("busDetails").innerHTML = `
    <h2>🚌 Bus Details</h2>

    <h3>${escapeHTML(bus.number)}</h3>

    <p class="muted">
      ${escapeHTML(bus.route.join(" → ") || "Route not added")}
    </p>

    <div class="details-grid">

      <div class="detail-box">
        <span class="small-label">Total Seats</span>
        <strong>${bus.capacity}</strong>
      </div>

      <div class="detail-box">
        <span class="small-label">Available Seats</span>
        <strong>${bus.seats}</strong>
      </div>

      <div class="detail-box">
        <span class="small-label">Location</span>
        <strong>${escapeHTML(bus.location)}</strong>
        <div class="detail-box">
  <span class="small-label">Journey Status</span>
  <strong>
    ${bus.journeyStarted ? "Journey Started" : "Not Started"}
  </strong>
</div>
      </div>

    </div>

    <h3>Book Your Seats</h3>

    <div class="search-row">
      <input
        id="bookingSeats"
        type="number"
        min="1"
        value="1"
        placeholder="Number of seats"
      >

      <button onclick="bookSeats(${bus.id})">
        Book Seats
      </button>
    </div>

    <p id="bookingStatus" class="success-message"></p>
  `;

  renderBuses(buses);
}


// Book seats
async function bookSeats(busId) {
  if (currentUserRole !== "passenger") return;

  const seats =
    Number(document.getElementById("bookingSeats").value);

  const status =
    document.getElementById("bookingStatus");

  if (!Number.isInteger(seats) || seats <= 0) {
    status.textContent =
      "Please enter a valid number of seats.";
    return;
  }

  try {
    const response = await fetch(`${API}/api/bookings/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bus_id: busId,
        seats: seats
      })
    });

    const data = await response.json();

    status.textContent = data.message;

    if (response.ok) {
      await loadBuses(
        document.getElementById("stopInput").value.trim()
      );

      const updatedBus =
        buses.find(b => b.id === busId);

      if (updatedBus) {
        showBusDetails(busId);
      }

      document.getElementById("bookingStatus").textContent =
        data.message;
    }

  } catch (error) {
    status.textContent =
      "Booking failed. Backend check karo.";
  }
}


// Submit passenger report (currently demo only)
function submitReport() {
  if (currentUserRole !== "passenger") return;

  const type =
    document.getElementById("reportType").value;

  const message =
    document.getElementById("reportMessage").value.trim();

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


// Display reports (currently demo only)
function renderReports() {
  const container =
    document.getElementById("controllerReports");

  if (!container) return;

  if (!reports.length) {
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


// Escape HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}


// Controller journey (demo only)

// Controller journey
async function toggleJourney() {
  if (currentUserRole !== "controller") return;

  const busNumber = document.getElementById("controllerBus").value;
  const status = document.getElementById("controllerStatus");
  const button = document.getElementById("journeyButton");

  if (!busNumber) {
    status.textContent = "Please select a bus first.";
    return;
  }

  const bus = controllerBuses.find(
    b => b.bus_number === busNumber
  );

  if (!bus) {
    status.textContent = "Bus not found.";
    return;
  }

  const started = !bus.journey_started;

  try {
    button.disabled = true;
    status.textContent = "Updating journey status...";

    const response = await fetch(
      `${API}/api/buses/${encodeURIComponent(busNumber)}/journey`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ started })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Journey update failed");
    }

    bus.journey_started = data.journey_started;
    button.textContent = started ? "End Journey" : "Start Journey";
    status.textContent = data.message;

  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}
// Controller bus information (demo only)

async function updateBusInfo() {
  if (currentUserRole !== "controller") return;

  const seats = Number(document.getElementById("seatCount").value);
  const stop = document.getElementById("currentStop").value.trim();
  const busNumber = document.getElementById("controllerBus").value.trim();
  const status = document.getElementById("controllerStatus");

  if (!busNumber || !stop || !Number.isInteger(seats) || seats < 0) {
    status.textContent = "Please enter valid bus details.";
    return;
  }

  try {
    status.textContent = "Updating bus information...";

    const response = await fetch(
      `${API}/api/buses/${encodeURIComponent(busNumber)}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
        available_seats: seats,
        current_location: stop,
        departure_time: document.getElementById("departureTime").value
})
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Bus update failed");
    }

    status.textContent = data.message;

  } catch (error) {
    status.textContent = error.message;
  }
}

// Logo
async function logout() {
  try {
    await fetch(`${API}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    sessionStorage.removeItem("smartbusRole");
    sessionStorage.removeItem("smartbusEmail");

    window.location.replace("login.html");
  }
}

// Fill controller form when a bus is selected
function fillControllerBusInfo() {
  const busNumber = document.getElementById("controllerBus").value;

  const bus = controllerBuses.find(
    b => b.bus_number === busNumber
  );

  const status = document.getElementById("controllerStatus");

  if (!bus) {
    document.getElementById("seatCount").value = "";
    document.getElementById("currentStop").value = "";
    status.textContent = "";
    return;
  }

  const seatInput = document.getElementById("seatCount");

    seatInput.value = bus.available_seats;
    seatInput.max = bus.total_seats;
 

  document.getElementById("currentStop").value =
    bus.current_location || "";

    document.getElementById("departureTime").value =
    bus.departure_time || "";
    
    document.getElementById("journeyButton").textContent =
    bus.journey_started ? "End Journey" : "Start Journey";
    status.textContent =
    "Bus details loaded. You can update the information.";
}


// Start dashboard
checkUserRole();
async function addBusStop() {
    if (currentUserRole !== "controller") return;

    const busNumber = document.getElementById("controllerBus").value;
    const stopName = document.getElementById("stopName").value.trim();
    const stopOrder = Number(document.getElementById("stopOrder").value);
    const arrivalOffset = Number(document.getElementById("arrivalOffset").value);
    const status = document.getElementById("stopStatus");

    if (
        !busNumber ||
        !stopName ||
        !document.getElementById("stopOrder").value ||
        !document.getElementById("arrivalOffset").value ||
        !Number.isInteger(stopOrder) ||
        !Number.isInteger(arrivalOffset) ||
        stopOrder < 1 ||
        arrivalOffset < 0
    ) {
        status.textContent = "Please enter valid stop details.";
        return;
    }

    try {
        status.textContent = "Adding stop...";

        const response = await fetch(
            `${API}/api/buses/${encodeURIComponent(busNumber)}/stops`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stop_name: stopName,
                    stop_order: stopOrder,
                    arrival_offset_minutes: arrivalOffset
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to add stop");
        }

        status.textContent = data.message;

        document.getElementById("stopName").value = "";
        document.getElementById("stopOrder").value = "";
        document.getElementById("arrivalOffset").value = "";

    } catch (error) {
        status.textContent = error.message;
    }
}