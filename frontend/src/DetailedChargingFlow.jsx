import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./detailed-flow.css";

const hosts = [
  {
    id: "greenvolt",
    name: "GreenVolt Community Pod #4",
    owner: "R. Sharma",
    address: "Sector 43 Tech Corridor, Cyber Gateway",
    tariff: 14.5,
    power: 30,
    rating: 4.8,
    reviews: 142,
    distance: 1.8,
    energy: "94% Solar",
    coords: [28.4595, 77.0266],
  },
  {
    id: "express",
    name: "Peak Power Express",
    owner: "VoltGrid Station",
    address: "Golf Course Road, Gurugram",
    tariff: 18,
    power: 60,
    rating: 4.7,
    reviews: 98,
    distance: 2.4,
    energy: "Grid + Solar",
    coords: [28.4676, 77.081],
  },
  {
    id: "aarav",
    name: "Aarav Residence",
    owner: "Aarav Mehta",
    address: "Saket Community Lane",
    tariff: 12.8,
    power: 22,
    rating: 4.6,
    reviews: 64,
    distance: 3.4,
    energy: "100% Solar",
    coords: [28.5245, 77.2066],
  },
];

const route = [[28.6139, 77.209], [28.56, 77.16], hosts[0].coords];
const icon = (symbol, kind) =>
  divIcon({
    className: "detail-map-icon",
    html: `<span class="detail-pin ${kind}">${symbol}</span>`,
  });

function Recenter({ host }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(host.coords, 12, { duration: 0.35 });
  }, [host, map]);
  return null;
}

export default function DetailedChargingFlow() {
  const [screen, setScreen] = useState("discovery");
  const [host, setHost] = useState(hosts[0]);
  const [showMatches, setShowMatches] = useState(false);
  const [transit, setTransit] = useState(false);
  const [mode, setMode] = useState("already");
  const [connector, setConnector] = useState("CCS2");
  const [otpState, setOtpState] = useState("idle");
  const [session, setSession] = useState({ seconds: 0, kwh: 0, active: false });
  const [invoice, setInvoice] = useState(null);

  const selectHost = (nextHost) => {
    setHost(nextHost);
    setShowMatches(false);
    setTransit(true);
    setTimeout(() => {
      setTransit(false);
      setScreen("handshake");
    }, 15000);
  };
  const generateOtp = () => {
    setOtpState("loading");
    setTimeout(() => {
      setOtpState("accepted");
      setScreen("session");
      setSession({ seconds: 0, kwh: 0, active: true });
    }, 15000);
  };
  const finishSession = () => {
    setSession((current) => ({ ...current, active: false }));
    setInvoice({
      kwh: session.kwh,
      total: +(session.kwh * host.tariff).toFixed(2),
    });
    setScreen("settlement");
  };

  useEffect(() => {
    if (screen !== "session" || !session.active) return undefined;
    const timer = setInterval(
      () =>
        setSession((current) => ({
          ...current,
          seconds: current.seconds + 1,
          kwh: +(current.kwh + 0.12).toFixed(2),
        })),
      1000,
    );
    return () => clearInterval(timer);
  }, [screen, session.active]);

  useEffect(() => {
    const sheet = document.querySelector(".detail-sheet");
    if (sheet) sheet.classList.toggle("route-collapsed", transit);
  }, [transit, screen]);

  return (
    <div className="detail-flow">
      {screen === "discovery" && (
        <DiscoveryScreen
          host={host}
          onHost={selectHost}
          onMatch={() => setShowMatches(true)}
          transit={transit}
        />
      )}
      {screen === "handshake" && (
        <HandshakeScreen
          host={host}
          mode={mode}
          setMode={setMode}
          connector={connector}
          setConnector={setConnector}
          otpState={otpState}
          onOtp={generateOtp}
          onBack={() => setScreen("discovery")}
        />
      )}
      {screen === "session" && (
        <SessionScreen host={host} session={session} onFinish={finishSession} />
      )}
      {screen === "settlement" && (
        <SettlementScreen
          host={host}
          invoice={invoice}
          onReset={() => setScreen("discovery")}
        />
      )}
      {showMatches && (
        <MatchModal
          hosts={hosts.slice(0, 2)}
          onClose={() => setShowMatches(false)}
          onSelect={selectHost}
        />
      )}
    </div>
  );
}

function Header({ title, subtitle, back, onBack, action }) {
  return (
    <header className="detail-header">
      {back && <button onClick={onBack}>←</button>}
      <div>
        <small>GRIDMITRA CLEAN EV</small>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action || <span className="detail-live">LIVE</span>}
    </header>
  );
}
function DiscoveryScreen({ host, onHost, onMatch, transit }) {
  return (
    <main className="detail-screen discovery-screen">
      <Header
        title="Nearby Stations"
        subtitle="Residential P2P charging around you"
        action={
          <button className="detail-cta" onClick={onMatch}>
            Match to Nearest
          </button>
        }
      />
      <div className="detail-map-wrap">
        <MapContainer center={host.coords} zoom={11} className="detail-map">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hosts.map((item) => (
            <Marker
              key={item.id}
              position={item.coords}
              icon={icon(
                "⚡",
                item.id === host.id ? "detail-selected" : "detail-charger",
              )}
              eventHandlers={{ click: () => onHost(item) }}
            >
              <Popup>
                <b>{item.name}</b>
                <br />
                {item.owner}
                <br />₹{item.tariff}/kWh · {item.power} kW
              </Popup>
            </Marker>
          ))}
          <Marker
            position={[28.5245, 77.2066]}
            icon={icon("⌂", "detail-home")}
          />
          <Recenter host={host} />
          {transit && (
            <Polyline
              positions={route}
              pathOptions={{ color: "#10b981", weight: 5, dashArray: "10 8" }}
            />
          )}
        </MapContainer>
        {transit && (
          <div className="route-state">
            Routing to {host.name}...<b>Transit simulation in progress</b>
          </div>
        )}
      </div>
      <section className="detail-sheet">
        <div className="detail-handle" />
        <div className="detail-section-title">
          <span>Selected host station</span>
          <b>{hosts.length} nearby</b>
        </div>
        <div className="host-feature">
          <div>
            <small>RESIDENTIAL P2P HOST · {host.distance} KM</small>
            <h2>{host.name}</h2>
            <p>{host.address}</p>
          </div>
          <strong>
            ₹{host.tariff.toFixed(2)}
            <small>/kWh</small>
          </strong>
        </div>
        <div className="detail-stats">
          <span>
            Power<strong>{host.power} kW</strong>
          </span>
          <span>
            Rating<strong>★ {host.rating}</strong>
          </span>
          <span>
            Energy<strong>{host.energy}</strong>
          </span>
        </div>
        <div className="detail-host-list">
          {hosts.map((item) => (
            <button
              key={item.id}
              className={item.id === host.id ? "selected" : ""}
              onClick={() => onHost(item)}
            >
              <span>⚡</span>
              <div>
                <b>{item.name}</b>
                <small>
                  {item.owner} · {item.distance} km · ₹{item.tariff}/kWh
                </small>
              </div>
              <em>→</em>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
function MatchModal({ hosts: options, onClose, onSelect }) {
  return (
    <div className="detail-modal-backdrop">
      <div className="detail-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <small>SMART MATCHMAKER</small>
        <h2>Top 2 nearest host stations</h2>
        <p>
          Choose a residential host or close this window to browse the full map.
        </p>
        {options.map((item, index) => (
          <button
            className="match-option"
            key={item.id}
            onClick={() => onSelect(item)}
          >
            <span>0{index + 1}</span>
            <div>
              <b>{item.name}</b>
              <small>
                {item.owner} · {item.distance} km · {item.power} kW
              </small>
            </div>
            <strong>₹{item.tariff}/kWh</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
function HandshakeScreen({
  host,
  mode,
  setMode,
  connector,
  setConnector,
  otpState,
  onOtp,
  onBack,
}) {
  return (
    <main className="detail-screen detail-scroll">
      <Header
        title="Host Handshake & Booking"
        subtitle={host.owner}
        back
        onBack={onBack}
      />
      <section className="host-hero">
        <small>SELECTED RESIDENTIAL HOST</small>
        <h2>{host.name}</h2>
        <p>{host.owner} · Verified Green Host</p>
        <div className="detail-stats">
          <span>
            Live tariff<strong>₹{host.tariff}/kWh</strong>
          </span>
          <span>
            Available output<strong>{host.power} kW</strong>
          </span>
          <span>
            Rating<strong>★ {host.rating}</strong>
          </span>
        </div>
      </section>
      <div className="mode-tabs">
        <button
          className={mode === "already" ? "active" : ""}
          onClick={() => setMode("already")}
        >
          Already There
        </button>
        <button
          className={mode === "prebook" ? "active" : ""}
          onClick={() => setMode("prebook")}
        >
          Pre-Book
        </button>
      </div>
      <section className="detail-card">
        {mode === "prebook" ? (
          <>
            <h3>Choose a future slot</h3>
            <div className="slot-grid">
              <button>Today · 7:30 PM</button>
              <button>Tomorrow · 9:00 AM</button>
            </div>
          </>
        ) : (
          <>
            <h3>Connect now</h3>
            <p>
              You are at the host. Select a compatible connector to begin the
              secure handshake.
            </p>
          </>
        )}
        <label>
          Connector type
          <select
            value={connector}
            onChange={(event) => setConnector(event.target.value)}
          >
            <option>CCS2</option>
            <option>Type 2</option>
            <option>15A Domestic</option>
          </select>
        </label>
        <button
          className="detail-primary"
          onClick={onOtp}
          disabled={otpState === "loading"}
        >
          {otpState === "loading"
            ? "Waiting for host approval..."
            : otpState === "accepted"
              ? "OTP Accepted!"
              : "Generate OTP"}
        </button>
        {otpState === "loading" && (
          <div className="loading-line">
            <i /> Simulating secure host approval...
          </div>
        )}
        {otpState === "accepted" && (
          <div className="success-line">
            ✓ OTP Accepted! Secure PIN verified.
          </div>
        )}
      </section>
    </main>
  );
}
function SessionScreen({ host, session, onFinish }) {
  const time = new Date(session.seconds * 1000).toISOString().slice(14, 19);
  const cost = +(session.kwh * host.tariff).toFixed(2);
  return (
    <main className="detail-screen detail-scroll">
      <Header
        title="Live Charging Session"
        subtitle={`${host.name} · ${host.owner}`}
      />
      <section className="session-status">
        <span>● CHARGING LIVE</span>
        <b>{time}</b>
      </section>
      <section className="telemetry-hero">
        <small>ENERGY CONSUMED</small>
        <strong>
          {session.kwh.toFixed(2)} <i>kWh</i>
        </strong>
        <p>Incremental meter · live residential tariff</p>
      </section>
      <div className="detail-stats session-stats">
        <span>
          Live cost<strong>₹{cost.toFixed(2)}</strong>
        </span>
        <span>
          Unit tariff<strong>₹{host.tariff}/kWh</strong>
        </span>
        <span>
          Power draw<strong>{host.power} kW</strong>
        </span>
      </div>
      <section className="detail-card">
        <h3>Session telemetry</h3>
        <div className="meter-line">
          <span>Meter progress</span>
          <b>{session.kwh.toFixed(2)} kWh</b>
        </div>
        <div className="meter-track">
          <i style={{ width: `${Math.min(100, session.kwh * 3)}%` }} />
        </div>
        <p>
          Charging is running automatically. Complete the session when your
          vehicle reaches the required level.
        </p>
        <button className="detail-primary" onClick={onFinish}>
          Complete Session & Generate Invoice
        </button>
      </section>
    </main>
  );
}
function SettlementScreen({ host, invoice, onReset }) {
  return (
    <main className="detail-screen detail-scroll">
      <Header
        title="Settlement & Invoice"
        subtitle="Automated residential charging receipt"
      />
      <section className="invoice-card">
        <small>FINAL SESSION RECEIPT</small>
        <h2>₹{invoice.total.toFixed(2)}</h2>
        <p>
          {invoice.kwh.toFixed(2)} kWh × ₹{host.tariff}/kWh subsidized
          residential tariff
        </p>
        <div className="invoice-row">
          <span>Host station</span>
          <b>{host.name}</b>
        </div>
        <div className="invoice-row">
          <span>Host owner</span>
          <b>{host.owner}</b>
        </div>
        <div className="invoice-row">
          <span>Energy consumed</span>
          <b>{invoice.kwh.toFixed(2)} kWh</b>
        </div>
        <div className="invoice-row">
          <span>Settlement status</span>
          <b className="settled">✓ Ready to settle</b>
        </div>
        <button className="detail-primary" onClick={onReset}>
          Back to Nearby Stations
        </button>
      </section>
    </main>
  );
}
