import { useEffect, useRef, useState } from "react";
import { divIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import "./reference-theme.css";
import "./dashboard-reference.css";
import Discovery from "./Discovery";
import RequestedChargingFlow from "./RequestedChargingFlow";

const API = "http://localhost:8000";
const fallbackHosts = [
  {
    id: "HM-01",
    name: "Aarav Residence",
    area: "Saket",
    distance: 1.8,
    capacity: 11,
    available: true,
    lat: 28.5245,
    lng: 77.2066,
    state: "Delhi",
  },
  {
    id: "HM-02",
    name: "Nehru Place Home",
    area: "Nehru Place",
    distance: 3.4,
    capacity: 7,
    available: true,
    lat: 28.5494,
    lng: 77.2501,
    state: "Delhi",
  },
  {
    id: "HM-03",
    name: "Rohini Solar House",
    area: "Rohini",
    distance: 7.2,
    capacity: 9,
    available: false,
    lat: 28.7041,
    lng: 77.1025,
    state: "Delhi",
  },
  {
    id: "HM-04",
    name: "Gurugram Edge Node",
    area: "DLF Phase 2",
    distance: 5.6,
    capacity: 22,
    available: true,
    lat: 28.4941,
    lng: 77.0878,
    state: "Delhi",
  },
  {
    id: "HM-05",
    name: "Noida Sector 18 Home",
    area: "Noida",
    distance: 9.8,
    capacity: 15,
    available: true,
    lat: 28.5706,
    lng: 77.3219,
    state: "Delhi",
  },
  {
    id: "HM-06",
    name: "Dwarka Community Node",
    area: "Dwarka",
    distance: 11.4,
    capacity: 12,
    available: true,
    lat: 28.5921,
    lng: 77.046,
    state: "Delhi",
  },
  {
    id: "HM-07",
    name: "Ghaziabad Solar Home",
    area: "Indirapuram",
    distance: 14.2,
    capacity: 10,
    available: true,
    lat: 28.6415,
    lng: 77.3715,
    state: "Delhi",
  },
  {
    id: "HM-08",
    name: "Faridabad Green Node",
    area: "Faridabad",
    distance: 16.7,
    capacity: 18,
    available: true,
    lat: 28.4089,
    lng: 77.3178,
    state: "Delhi",
  },
];
const emptyMetrics = {
  delivered: 0,
  voltage: 0,
  tariff: 0,
  total: 0,
  savings: 0,
  hostPayout: 0,
};

function App() {
  void Dashboard;
  const [page, setPage] = useState("mobile");
  const [hosts, setHosts] = useState(fallbackHosts);
  const [matches, setMatches] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [preparation, setPreparation] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [running, setRunning] = useState(false);
  const consoleRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/hosts`)
      .then((response) => response.json())
      .then(setHosts)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (consoleRef.current)
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [events]);

  if (page === "mobile") return <RequestedChargingFlow />;

  const selectedHost = hosts.find((host) => host.id === selectedId);

  async function runMatchmaker() {
    setPage("journey");
    setPreparation(null);
    setSelectedId(null);
    setPhase("matching");
    setMetrics(emptyMetrics);
    setEvents([]);
    try {
      const response = await fetch(`${API}/api/matches`);
      const options = await response.json();
      setMatches(options);
      setPhase("matches");
      addEvent({
        agent: "MATCHMAKER",
        title: "Top two hosts found",
        message: "Choose one destination before policy evaluation begins.",
        status: "complete",
      });
    } catch {
      setPhase("idle");
      addEvent({
        agent: "SYSTEM",
        title: "Backend unavailable",
        message: "Start FastAPI on port 8000 to run Matchmaker.",
        status: "error",
      });
    }
  }

  function addEvent(event) {
    setEvents((current) => [...current, event]);
  }
  function chooseHost(hostId) {
    setSelectedId(hostId);
    setPhase("chosen");
    addEvent({
      agent: "MATCHMAKER",
      title: "Host selected manually",
      message: "User selected a destination. Ready to check policy.",
      status: "complete",
    });
  }

  async function checkPolicy() {
    setPhase("policy");
    const response = await fetch(`${API}/api/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host_id: selectedId }),
    });
    const result = await response.json();
    setPreparation(result);
    addEvent({
      agent: "SUBSIDY",
      title: "Policy summary ready",
      message: `${result.subsidized_units.toFixed(1)} kWh is eligible for the ${selectedHost.state} household subsidy.`,
      status: "complete",
    });
  }
  function lockTariff() {
    setPhase("tariff");
    addEvent({
      agent: "PRICING",
      title: "Tariff locked for approval",
      message: `Effective rate is Rs ${preparation.tariff.toFixed(2)} per kWh.`,
      status: "complete",
    });
  }
  function approveAgents() {
    setPhase("approved");
    addEvent({
      agent: "SYSTEM",
      title: "First three agents approved",
      message: "Ready to start the routed journey.",
      status: "complete",
    });
  }

  async function readStream(endpoint, onPayload) {
    const response = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host_id: selectedId }),
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop();
      chunks
        .filter((chunk) => chunk.startsWith("data: "))
        .forEach((chunk) => onPayload(JSON.parse(chunk.replace("data: ", ""))));
    }
  }

  async function startJourney() {
    setRunning(true);
    setPhase("journey");
    try {
      await readStream("/api/route", (payload) => {
        addEvent(payload);
        if (payload.status === "reached") setPhase("reached");
      });
    } catch {
      addEvent({
        agent: "SYSTEM",
        title: "Route interrupted",
        message: "The local navigation stream could not be reached.",
        status: "error",
      });
    } finally {
      setRunning(false);
    }
  }
  async function startCharging() {
    setRunning(true);
    setPhase("charging");
    try {
      await readStream("/api/charging", (payload) => {
        addEvent(payload);
        if (payload.data?.delivered !== undefined)
          setMetrics((current) => ({
            ...current,
            delivered: payload.data.delivered,
            voltage: payload.data.voltage,
          }));
        if (payload.status === "charging_done") setPhase("charging_done");
      });
    } catch {
      addEvent({
        agent: "SYSTEM",
        title: "Charging interrupted",
        message: "The local meter stream could not be reached.",
        status: "error",
      });
    } finally {
      setRunning(false);
    }
  }
  async function runSettlement() {
    setPhase("settling");
    setRunning(true);
    const response = await fetch(`${API}/api/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host_id: selectedId }),
    });
    const result = await response.json();
    setMetrics((current) => ({
      ...current,
      total: result.driver_total,
      savings: result.savings,
      hostPayout: result.host_payout,
    }));
    addEvent({
      agent: "SETTLEMENT",
      title: "Split payment prepared",
      message: `Rs ${result.driver_total.toFixed(2)} split between host and platform.`,
      status: "settled",
    });
    setPhase("settled");
    setRunning(false);
    setPage("settlement");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-mark" onClick={() => setPage("dashboard")}>
          ⚡
        </button>
        <div>
          <p className="eyebrow">CLEAN ENERGY NETWORK</p>
          <h1>
            GridMitra Clean EV <span>/ Delhi-NCR</span>
          </h1>
        </div>
        <div className="system-state">
          <i /> <b>82%</b> · 280 km
        </div>
      </header>
      <nav className="main-nav">
        <button
          className={page === "dashboard" ? "active" : ""}
          onClick={() => setPage("dashboard")}
        >
          <span>⌂</span>Explore
        </button>
        <button
          className={page === "journey" ? "active" : ""}
          onClick={() => setPage("journey")}
        >
          <span>↝</span>Match
        </button>
        <button
          className={page === "nodes" ? "active" : ""}
          onClick={() => setPage("nodes")}
        >
          <span>ϟ</span>Session
        </button>
        <button
          className={page === "settlement" ? "active" : ""}
          onClick={() => setPage("settlement")}
        >
          <span>▣</span>Wallet
        </button>
      </nav>
      {page === "dashboard" && <Discovery onRouteCharge={runMatchmaker} />}
      {page === "nodes" && (
        <Nodes
          hosts={hosts}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          running={running}
        />
      )}
      {page === "journey" && (
        <Journey
          phase={phase}
          matches={matches}
          selectedHost={selectedHost}
          preparation={preparation}
          events={events}
          metrics={metrics}
          running={running}
          consoleRef={consoleRef}
          runMatchmaker={runMatchmaker}
          chooseHost={chooseHost}
          checkPolicy={checkPolicy}
          lockTariff={lockTariff}
          approveAgents={approveAgents}
          startJourney={startJourney}
          startCharging={startCharging}
          runSettlement={runSettlement}
        />
      )}
      {page === "settlement" && (
        <Settlement metrics={metrics} settled={phase === "settled"} />
      )}
      <footer>
        <span>SESSION / GM-2026-0911</span>
        <span>STAGED LOCAL JOURNEY / NO API KEY</span>
        <span>DELHI-NCR PILOT / v0.1</span>
      </footer>
    </main>
  );
}

function Dashboard({ runMatchmaker, hosts }) {
  return (
    <section className="page-section explore-screen">
      <div className="explore-search">
        ⌕ <span>Search charging hubs, metro corridors, or areas</span>
        <b>☷</b>
      </div>
      <div className="filter-row">
        <button className="filter-active">ϟ Fast DC (&gt;50kW)</button>
        <button>☼ Solar Powered</button>
        <button>⚡ Instant Bay</button>
      </div>
      <div className="explore-map">
        <MapCanvas
          hosts={hosts}
          selectedId={null}
          setSelectedId={() => {}}
          running={false}
        />
      </div>
      <div className="hub-sheet">
        <div className="hub-top">
          <span className="hub-pill">● Ultra-Fast DC Hub</span>
          <span>· 1.2 km away</span>
          <b>☆ 4.9 (142)</b>
        </div>
        <h2>CyberCity GreenHub CCS2 &amp; Type-2</h2>
        <p>⌖ Sector 43 Tech Corridor, Cyber Gateway</p>
        <div className="hub-stats">
          <span>
            <small>CLEAN ENERGY</small>
            <strong>♧ 94% Solar</strong>
          </span>
          <span>
            <small>BASE TARIFF</small>
            <strong>Rs 14.50/kWh</strong>
          </span>
          <span>
            <small>AVAILABILITY</small>
            <strong>● 4 / 6 Free</strong>
          </span>
        </div>
        <button className="primary-action" onClick={runMatchmaker}>
          Route &amp; Charge <b>{"->"}</b>
        </button>
      </div>
    </section>
  );
}
function Journey({
  phase,
  matches,
  selectedHost,
  events,
  metrics,
  running,
  consoleRef,
  runMatchmaker,
  chooseHost,
  checkPolicy,
  lockTariff,
  approveAgents,
  startJourney,
  startCharging,
  runSettlement,
}) {
  const [selectedAgent, setSelectedAgent] = useState("MATCHMAKER");
  const action =
    phase === "idle" ? (
      <button className="primary-action" onClick={runMatchmaker}>
        RUN AGENT MATCHMAKER <b>{"->"}</b>
      </button>
    ) : phase === "matching" ? (
      <p className="stage-wait">MATCHMAKER IS RANKING AVAILABLE HOSTS...</p>
    ) : phase === "matches" ? (
      <div className="match-options">
        {matches.map((host, index) => (
          <button
            className="match-card"
            key={host.id}
            onClick={() => chooseHost(host.id)}
          >
            <span>OPTION 0{index + 1}</span>
            <strong>{host.name}</strong>
            <p>
              {host.area} / {host.distance} km / {host.capacity} kW
            </p>
            <b>CHOOSE {"->"}</b>
          </button>
        ))}
      </div>
    ) : phase === "chosen" ? (
      <button className="primary-action" onClick={checkPolicy}>
        CHECK SUBSIDY POLICY <b>{"->"}</b>
      </button>
    ) : phase === "policy" ? (
      <button className="primary-action" onClick={lockTariff}>
        LOCK TARIFF <b>{"->"}</b>
      </button>
    ) : phase === "tariff" ? (
      <button className="primary-action" onClick={approveAgents}>
        OK - APPROVE ALL 3 AGENTS <b>{"->"}</b>
      </button>
    ) : phase === "approved" ? (
      <button className="primary-action" onClick={startJourney}>
        START JOURNEY <b>{"->"}</b>
      </button>
    ) : phase === "journey" ? (
      <p className="stage-wait">
        MOVING TO {selectedHost?.area.toUpperCase()}...
      </p>
    ) : phase === "reached" ? (
      <button className="primary-action" onClick={startCharging}>
        RUN AGENT 4 - START CHARGING <b>{"->"}</b>
      </button>
    ) : phase === "charging" ? (
      <p className="stage-success">AGENT 4 ACTIVE / CHARGING IN PROGRESS</p>
    ) : phase === "charging_done" ? (
      <button className="primary-action" onClick={runSettlement}>
        RUN AGENT 5 - SPLIT PAYMENT <b>{"->"}</b>
      </button>
    ) : phase === "settling" ? (
      <p className="stage-wait">AGENT 5 IS CALCULATING THE SPLIT...</p>
    ) : (
      <p className="stage-success">PAYMENT SPLIT READY</p>
    );
  const visibleEvents = events.filter(
    (event) => event.agent === selectedAgent || event.agent === "SYSTEM",
  );
  const agentInfo = {
    MATCHMAKER: [
      "Host discovery",
      "Finds the two best available household nodes for manual selection.",
    ],
    SUBSIDY: [
      "Policy check",
      "Reads the selected state policy and calculates free-unit headroom.",
    ],
    PRICING: [
      "Tariff lock",
      "Converts the approved subsidy result into a final per-kWh rate.",
    ],
    "GRID / IOT": [
      "Live charging",
      "Runs only after arrival and streams the meter until charging stops.",
    ],
    SETTLEMENT: [
      "Split payment",
      "Runs only after charging is stopped and prepares the payout split.",
    ],
  }[selectedAgent];
  return (
    <section className="page-section journey-screen">
      <div className="page-intro">
        <div>
          <p className="eyebrow">JOURNEY CONTROL / USER-DRIVEN AGENTS</p>
          <h2>
            {phase === "settled" ? "Journey complete." : "Control the journey."}
          </h2>
          <p className="intro-copy">
            The map stays focused on the route. Select an agent below to inspect
            what it is doing and trigger the next approved action.
          </p>
        </div>
        <span className={`session-badge ${running ? "running" : ""}`}>
          <i /> {phaseLabel(phase)}
        </span>
      </div>
      <div className="journey-map">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">LIVE ROUTE / DELHI-NCR</p>
            <h3>{selectedHost ? selectedHost.name : "Awaiting destination"}</h3>
          </div>
          <span className="event-count">
            {phase === "journey"
              ? "MOVING"
              : phase === "reached"
                ? "REACHED"
                : phase === "charging"
                  ? "CHARGING"
                  : "ROUTE READY"}
          </span>
        </div>
        {selectedHost ? (
          <MapCanvas
            hosts={[selectedHost]}
            selectedId={selectedHost.id}
            setSelectedId={() => {}}
            running={running}
            activeRoute
          />
        ) : (
          <div className="route-empty">
            Run Matchmaker to begin route planning.
          </div>
        )}
      </div>
      <div className="journey-process">
        <div className="process-header">
          <div>
            <p className="eyebrow">AGENT PROCESS / LIVE CONTROL</p>
            <h3>{agentInfo[0]}</h3>
            <p>{agentInfo[1]}</p>
          </div>
          <div className="journey-metrics">
            <Metric
              label="DELIVERED"
              value={`${metrics.delivered.toFixed(1)} kWh`}
            />
            <Metric label="VOLTAGE" value={`${metrics.voltage || "--"} V`} />
          </div>
        </div>
        <div className="agent-tabs">
          {["MATCHMAKER", "SUBSIDY", "PRICING", "GRID / IOT", "SETTLEMENT"].map(
            (agent) => (
              <button
                key={agent}
                className={`${selectedAgent === agent ? "selected" : ""} ${events.some((event) => event.agent === agent) ? "done" : ""}`}
                onClick={() => setSelectedAgent(agent)}
              >
                <span>
                  {agent === "GRID / IOT"
                    ? "04"
                    : String(
                        [
                          "MATCHMAKER",
                          "SUBSIDY",
                          "PRICING",
                          "GRID / IOT",
                          "SETTLEMENT",
                        ].indexOf(agent) + 1,
                      ).padStart(2, "0")}
                </span>
                {agent}
              </button>
            ),
          )}
        </div>
        <div className="process-body">
          <div className="stage-action">{action}</div>
          <div className="agent-log" ref={consoleRef}>
            {visibleEvents.length ? (
              visibleEvents
                .slice(-5)
                .map((item, index) => (
                  <Event item={item} key={`${item.agent}-${index}`} />
                ))
            ) : (
              <p className="log-empty">Select an agent to see its activity.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
function phaseLabel(phase) {
  return (
    {
      idle: "READY",
      matching: "MATCHMAKER RUNNING",
      matches: "CHOOSE HOST",
      chosen: "HOST SELECTED",
      policy: "POLICY REVIEW",
      tariff: "TARIFF REVIEW",
      approved: "READY TO NAVIGATE",
      journey: "MOVING",
      reached: "REACHED",
      charging: "AGENT 4 / CHARGING",
      charging_done: "CHARGING STOPPED",
      settling: "AGENT 5 / SPLIT",
      settled: "SETTLED",
    }[phase] || "READY"
  );
}
function Metric({ label, value, accent }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={accent ? "lime" : ""}>{value}</strong>
    </div>
  );
}
function Event({ item }) {
  return (
    <article className={`event event-${item.status}`}>
      <div className="event-top">
        <span className="agent-badge">{item.agent}</span>
        <span className="event-time">
          {item.status === "charging" ? "LIVE" : "NOW"}
        </span>
      </div>
      <strong>{item.title}</strong>
      <p>{item.message}</p>
    </article>
  );
}

function Nodes({ hosts, selectedId, setSelectedId, running }) {
  const nearbyHosts = hosts.filter((host) => host.distance <= 8);
  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <p className="eyebrow">NETWORK / HOUSEHOLD SUPPLY</p>
          <h2>Charging nodes</h2>
          <p className="intro-copy">
            Bright nodes are within 8 km of the driver. Faded points show the
            wider NCR network.
          </p>
        </div>
        <span className="live-pill">
          <i /> {nearbyHosts.filter((host) => host.available).length} NEARBY
          AVAILABLE
        </span>
      </div>
      <div className="nodes-layout">
        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DELHI-NCR / LOCAL MATCH</p>
              <h3>Regional charging network</h3>
            </div>
            <span className="event-count">{hosts.length} REGIONAL NODES</span>
          </div>
          <MapCanvas
            hosts={hosts}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            running={running}
          />
        </div>
        <div className="node-list">
          <div className="list-note">NEAREST TO USER / 8 KM RADIUS</div>
          {nearbyHosts.map((host) => (
            <button
              className={`node-card ${selectedId === host.id ? "selected" : ""}`}
              key={host.id}
              onClick={() => !running && setSelectedId(host.id)}
            >
              <span className="node-id">{host.id}</span>
              <strong>{host.name}</strong>
              <span>
                {host.area} / {host.distance} km
              </span>
              <b className={host.available ? "lime" : "offline-text"}>
                {host.available ? "AVAILABLE" : "OFFLINE"}
              </b>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
function routePoints(host) {
  const driver = [28.6139, 77.209];
  const routes = {
    "HM-01": [
      driver,
      [28.601, 77.213],
      [28.578, 77.213],
      [28.556, 77.215],
      [host.lat, host.lng],
    ],
    "HM-02": [
      driver,
      [28.608, 77.226],
      [28.58, 77.24],
      [28.56, 77.248],
      [host.lat, host.lng],
    ],
    "HM-04": [
      driver,
      [28.605, 77.17],
      [28.57, 77.13],
      [28.53, 77.1],
      [host.lat, host.lng],
    ],
  };
  return routes[host.id] || [driver, [28.59, 77.2], [host.lat, host.lng]];
}
function MapCanvas({
  hosts,
  selectedId,
  setSelectedId,
  running,
  activeRoute = false,
}) {
  const selectedHost = hosts.find((host) => host.id === selectedId);
  const driverPosition = [28.6139, 77.209];
  const driverIcon = divIcon({
    className: "driver-icon-wrap",
    html: '<span class="driver-icon"><b>CAR</b></span>',
  });
  return (
    <MapContainer
      className={`real-map ${activeRoute ? "journey-map-canvas" : ""}`}
      center={[28.57, 77.2]}
      zoom={10.6}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedHost && (
        <Polyline
          positions={routePoints(selectedHost)}
          pathOptions={{
            color: "#b9f23c",
            weight: 5,
            opacity: 0.9,
            dashArray: "11 8",
          }}
        />
      )}
      <Marker position={driverPosition} icon={driverIcon}>
        <Popup>
          <strong>Your location</strong>
          <br />
          Delhi-NCR driver origin
        </Popup>
      </Marker>
      {hosts.map((host) => (
        <Marker
          key={host.id}
          position={[host.lat, host.lng]}
          icon={divIcon({
            className: "node-icon-wrap",
            html: `<span class="node-icon ${host.id === selectedId ? "selected" : ""} ${host.distance <= 8 ? "nearby" : "regional"} ${host.available ? "" : "offline"}"><b>${host.id}</b><i>${host.distance} km</i></span>`,
          })}
          eventHandlers={{ click: () => !running && setSelectedId(host.id) }}
        >
          <Popup>
            <strong>{host.name}</strong>
            <br />
            {host.area} / {host.distance} km
            <br />
            {host.capacity} kW capacity
            <br />
            <small>
              {host.available ? "Available for dispatch" : "Currently offline"}
            </small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
function Settlement({ metrics, settled }) {
  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <p className="eyebrow">FINANCE / SESSION RECEIPT</p>
          <h2>Split payment</h2>
          <p className="intro-copy">
            Agent 5 runs only after the user starts it once charging has
            stopped.
          </p>
        </div>
        <span className={`session-badge ${settled ? "running" : ""}`}>
          <i /> {settled ? "READY TO CONFIRM" : "AWAITING JOURNEY"}
        </span>
      </div>
      {settled ? (
        <div className="receipt">
          <div className="receipt-total">
            <span>DRIVER TOTAL</span>
            <strong>Rs {metrics.total.toFixed(2)}</strong>
            <p>For {metrics.delivered.toFixed(1)} kWh delivered</p>
          </div>
          <div className="receipt-grid">
            <Metric
              label="HOST PAYOUT"
              value={`Rs ${metrics.hostPayout.toFixed(2)}`}
            />
            <Metric
              label="SUBSIDY SAVED"
              value={`Rs ${metrics.savings.toFixed(2)}`}
              accent
            />
            <Metric
              label="PLATFORM FEE"
              value={`Rs ${(metrics.total * 0.08).toFixed(2)}`}
            />
          </div>
          <button className="primary-action">
            CONFIRM MOCK UPI TRANSFER <b>{"->"}</b>
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <span>05</span>
          <h3>Split payment waits for Agent 5</h3>
          <p>Complete the route and run Agent 4 charging first.</p>
        </div>
      )}
    </section>
  );
}

export default App;
