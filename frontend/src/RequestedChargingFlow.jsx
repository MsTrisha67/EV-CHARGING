import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./requested-flow.css";
import "./booking-card.css";
import "./sidebar-nav.css";

const homes = [
  {
    id: "greenvolt",
    name: "GreenVolt Community Pod #4",
    owner: "R. Sharma",
    distance: 1.8,
    tariff: 14.5,
    power: 30,
    energy: "94% Solar",
    address: "Sector 43 Tech Corridor",
    coords: [28.4595, 77.0266],
  },
  {
    id: "express",
    name: "Peak Power Express",
    owner: "VoltGrid Station",
    distance: 2.4,
    tariff: 18,
    power: 60,
    energy: "Grid + Solar",
    address: "Golf Course Road",
    coords: [28.4676, 77.081],
  },
  {
    id: "aarav",
    name: "Aarav Residence",
    owner: "Aarav Mehta",
    distance: 3.4,
    tariff: 12.8,
    power: 22,
    energy: "100% Solar",
    address: "Saket Community Lane",
    coords: [28.5245, 77.2066],
  },
  {
    id: "neha",
    name: "Nehru Place Home",
    owner: "Neha Kapoor",
    distance: 4.1,
    tariff: 13.2,
    power: 11,
    energy: "Solar + Grid",
    address: "Nehru Place",
    coords: [28.5494, 77.2501],
  },
];

const markerIcon = (symbol, kind) =>
  divIcon({
    className: "requested-marker-icon",
    html: `<span class="requested-marker ${kind}">${symbol}</span>`,
  });
const blankSession = { seconds: 0, kwh: 0 };

export default function RequestedChargingFlow() {
  const [stage, setStage] = useState("dashboard");
  const [selected, setSelected] = useState(homes[0]);
  const [matchOpen, setMatchOpen] = useState(false);
  const [permission, setPermission] = useState("idle");
  const [pin, setPin] = useState("");
  const [session, setSession] = useState(blankSession);
  const [payment, setPayment] = useState("Google Pay");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  const chooseHome = (home) => {
    setSelected(home);
    setMatchOpen(false);
    setPermission("waiting");
    setStage("journey");
    window.setTimeout(() => {
      setPermission("permitted");
      window.setTimeout(() => setStage("handshake"), 700);
    }, 10000);
  };
  const generatePin = () => {
    setPin(String(Math.floor(1000 + Math.random() * 9000)));
    setStage("charging");
    setSession(blankSession);
  };
  const total = +(session.kwh * selected.tariff).toFixed(2);
  const finish = () => {
    const receipt = {
      id: `VP-${Date.now().toString().slice(-6)}`,
      host: selected.name,
      kwh: session.kwh,
      total,
      date: new Date().toLocaleDateString(),
    };
    setHistory((items) => [receipt, ...items]);
    setStage("payment");
  };

  useEffect(() => {
    if (stage !== "charging") return undefined;
    const timer = setInterval(
      () =>
        setSession((current) => ({
          seconds: current.seconds + 1,
          kwh: +(current.kwh + 0.12).toFixed(2),
        })),
      1000,
    );
    return () => clearInterval(timer);
  }, [stage]);

  return (
    <div className="requested-flow">
      {stage === "dashboard" && (
        <Dashboard
          selected={selected}
          onSelect={setSelected}
          onMatch={() => setMatchOpen(true)}
        />
      )}
      {stage === "journey" && (
        <JourneyScreen
          host={selected}
          permission={permission}
          onBack={() => setStage("dashboard")}
        />
      )}
      {stage === "handshake" && (
        <HandshakeScreen
          host={selected}
          pin={pin}
          onGenerate={generatePin}
          onBack={() => setStage("dashboard")}
        />
      )}
      {stage === "charging" && (
        <ChargingScreen host={selected} session={session} onFinish={finish} />
      )}
      {(stage === "payment" || stage === "paytm" || stage === "hdfc") && (
        <PaymentScreen
          host={selected}
          total={total}
          payment={payment}
          setPayment={setPayment}
          history={history}
          feedback={feedback}
          setFeedback={setFeedback}
          onPay={() => setStage("history")}
        />
      )}
      {stage === "history" && (
        <HistoryScreen history={history} onHome={() => setStage("dashboard")} />
      )}
      {matchOpen && (
        <MatchModal onClose={() => setMatchOpen(false)} onChoose={chooseHome} />
      )}
      <BottomNav
        stage={stage}
        onStage={(nextStage) => {
          if (nextStage === "paytm") setPayment("Paytm UPI");
          if (nextStage === "hdfc") setPayment("HDFC Fleet Visa");
          setStage(nextStage);
        }}
      />
    </div>
  );
}

function Header({ title, subtitle, action }) {
  return (
    <header className="requested-header">
      <div>
        <small>GRIDMITRA · RESIDENTIAL GRID</small>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action || <span className="header-live">LIVE</span>}
    </header>
  );
}
function Dashboard({ selected, onSelect, onMatch }) {
  return (
    <main className="requested-screen">
      <Header
        title="Nearby Stations"
        subtitle="Multiple homes and community chargers around you"
        action={
          <button className="match-button" onClick={onMatch}>
            Match to Nearest
          </button>
        }
      />
      <div className="dashboard-map">
        <MapContainer
          center={selected.coords}
          zoom={11}
          className="requested-map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {homes.map((home) => (
            <Marker
              key={home.id}
              position={home.coords}
              icon={markerIcon(
                home.id === selected.id ? "⚡" : "⌂",
                home.id === selected.id
                  ? "requested-selected"
                  : "requested-home",
              )}
              eventHandlers={{ click: () => onSelect(home) }}
            >
              <Popup>
                <b>{home.name}</b>
                <br />
                {home.owner}
                <br />₹{home.tariff}/kWh · {home.power} kW
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="map-signals">
          <span>⌂ Homes</span>
          <span>⚡ Chargers</span>
          <span>☀ Solar</span>
        </div>
      </div>
      <section className="dashboard-sheet">
        <div className="sheet-grip" />
        <div className="section-row">
          <b>Nearby Stations</b>
          <button onClick={onMatch}>Match →</button>
        </div>
        <div className="selected-home">
          <small>SELECTED HOUSE · {selected.distance} KM</small>
          <h2>{selected.name}</h2>
          <p>
            {selected.owner} · {selected.address}
          </p>
          <div className="home-stats">
            <span>
              Tariff<strong>₹{selected.tariff}/kWh</strong>
            </span>
            <span>
              Power<strong>{selected.power} kW</strong>
            </span>
            <span>
              Energy<strong>{selected.energy}</strong>
            </span>
          </div>
        </div>
        <div className="home-list">
          {homes.map((home) => (
            <button
              key={home.id}
              className={home.id === selected.id ? "selected" : ""}
              onClick={() => onSelect(home)}
            >
              <span>⌂</span>
              <div>
                <b>{home.name}</b>
                <small>
                  {home.owner} · {home.distance} km
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
function MatchModal({ onClose, onChoose }) {
  const nearest = homes.slice(0, 2);
  return (
    <div className="requested-modal-bg">
      <section className="requested-modal">
        <button className="close-modal" onClick={onClose}>
          ×
        </button>
        <small>MATCH TO NEAREST</small>
        <h2>Choose a host house</h2>
        <p>
          Top two nearest stations are recommended. You can close this and
          choose any house from the full list.
        </p>
        {nearest.map((home, index) => (
          <button
            className="match-choice"
            key={home.id}
            onClick={() => onChoose(home)}
          >
            <strong>0{index + 1}</strong>
            <div>
              <b>{home.name}</b>
              <small>
                {home.owner} · {home.distance} km · ₹{home.tariff}/kWh
              </small>
            </div>
            <em>Choose →</em>
          </button>
        ))}
      </section>
    </div>
  );
}
function JourneyScreen({ host, permission, onBack }) {
  return (
    <main className="requested-screen requested-stage">
      <Header
        title="Journey to Host House"
        subtitle={`${host.name} · ${host.owner}`}
        action={
          <button className="back-button" onClick={onBack}>
            Back
          </button>
        }
      />
      <div className="journey-map">
        <MapContainer center={host.coords} zoom={12} className="requested-map">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={host.coords}
            icon={markerIcon("⌂", "requested-selected")}
          />
          <Polyline
            positions={[[28.6139, 77.209], [28.56, 77.16], host.coords]}
            pathOptions={{ color: "#10b981", weight: 5, dashArray: "10 8" }}
          />
        </MapContainer>
      </div>
      <section
        className={`journey-card ${permission === "permitted" ? "permitted" : ""}`}
      >
        <span>
          {permission === "permitted"
            ? "✓ HOUSE PERMITTED"
            : "⌂ WAITING FOR HOUSE PERMISSION"}
        </span>
        <h2>
          {permission === "permitted"
            ? "House has permitted access"
            : "Waiting for house permission..."}
        </h2>
        <p>
          {permission === "permitted"
            ? "Journey starting now. Proceed to the selected host."
            : "The owner has 10 seconds to approve your charging visit."}
        </p>
        {permission !== "permitted" && (
          <div className="permission-progress">
            <i />
          </div>
        )}
      </section>
    </main>
  );
}
function HandshakeScreen({ host, pin, onGenerate, onBack }) {
  const [bookingMode, setBookingMode] = useState("current");
  const [chargingType, setChargingType] = useState("Fast DC");
  const [timeSlot, setTimeSlot] = useState("Today · 7:30 PM");

  return (
    <main className="requested-screen requested-stage">
      <Header
        title="House Booking"
        subtitle={`${host.name} · ${host.owner}`}
        action={
          <button className="back-button" onClick={onBack}>
            Back
          </button>
        }
      />
      <section className="booking-card">
        <small>SECOND STAGE · HOUSE HANDSHAKE</small>
        <h2>Choose how you want to charge</h2>
        <p>Select Current to charge now, or Pre-Book a future house visit.</p>
        <div className="booking-tabs">
          <button
            className={bookingMode === "current" ? "active" : ""}
            onClick={() => setBookingMode("current")}
          >
            Current
          </button>
          <button
            className={bookingMode === "prebook" ? "active" : ""}
            onClick={() => setBookingMode("prebook")}
          >
            Pre-Book
          </button>
        </div>
        <label>
          Charging type
          <select
            value={chargingType}
            onChange={(event) => setChargingType(event.target.value)}
          >
            <option>Fast DC</option>
            <option>Type 2 AC</option>
            <option>15A Domestic</option>
          </select>
        </label>
        {bookingMode === "prebook" && (
          <label>
            Choose time slot
            <select
              value={timeSlot}
              onChange={(event) => setTimeSlot(event.target.value)}
            >
              <option>Today · 7:30 PM</option>
              <option>Today · 9:00 PM</option>
              <option>Tomorrow · 8:00 AM</option>
              <option>Tomorrow · 6:30 PM</option>
            </select>
          </label>
        )}
        <div className="booking-summary">
          <span>
            {bookingMode === "prebook" ? "Reserved slot" : "Charging now"}
            <b>{bookingMode === "prebook" ? timeSlot : "Start immediately"}</b>
          </span>
          <span>
            Connector<b>{chargingType}</b>
          </span>
        </div>
        <h3>Generate house OTP</h3>
        <p>
          No verification step. Generate a random four-digit number and give it
          to {host.owner}.
        </p>
        {pin ? (
          <div className="big-pin">{pin}</div>
        ) : (
          <div className="pin-placeholder">----</div>
        )}
        <button className="primary-requested" onClick={onGenerate}>
          {pin
            ? "Start Charging"
            : `Generate OTP for ${bookingMode === "prebook" ? "Pre-Book" : "Current Charge"}`}
        </button>
      </section>
    </main>
  );
}
function ChargingScreen({ host, session, onFinish }) {
  const time = new Date(session.seconds * 1000).toISOString().slice(14, 19);
  return (
    <main className="requested-screen requested-stage">
      <Header title="Live Charging" subtitle={`${host.name} · ${host.owner}`} />
      <section className="charging-hero">
        <small>THIRD STAGE · CHARGING</small>
        <strong>
          {session.kwh.toFixed(2)} <i>kWh</i>
        </strong>
        <p>Live incremental meter · {time}</p>
      </section>
      <div className="charging-metrics">
        <span>
          Live cost<strong>₹{(session.kwh * host.tariff).toFixed(2)}</strong>
        </span>
        <span>
          Tariff<strong>₹{host.tariff}/kWh</strong>
        </span>
        <span>
          Power<strong>{host.power} kW</strong>
        </span>
      </div>
      <section className="charging-card">
        <div className="section-row">
          <b>Charging progress</b>
          <strong>{session.kwh.toFixed(2)} kWh</strong>
        </div>
        <div className="charge-track">
          <i style={{ width: `${Math.min(100, session.kwh * 3)}%` }} />
        </div>
        <p>
          Charging is running automatically. Complete when your vehicle is
          ready.
        </p>
        <button className="primary-requested" onClick={onFinish}>
          Finish Charging & Continue to Payment
        </button>
      </section>
    </main>
  );
}
function PaymentScreen({
  host,
  total,
  payment,
  setPayment,
  history,
  feedback,
  setFeedback,
  onPay,
}) {
  const methods = ["Google Pay", "PhonePe UPI", "Paytm UPI", "HDFC Fleet Visa"];
  return (
    <main className="requested-screen requested-stage">
      <Header
        title="Payment & Receipt"
        subtitle={`${host.name} · ${host.owner}`}
      />
      <section className="payment-total">
        <small>FOURTH STAGE · TOTAL DUE</small>
        <strong>₹{total.toFixed(2)}</strong>
        <p>Residential subsidized tariff · Invoice generated after payment</p>
      </section>
      <section className="payment-card">
        <h2>Choose payment method</h2>
        {methods.map((method) => (
          <button
            className={`payment-method ${payment === method ? "active" : ""}`}
            key={method}
            onClick={() => setPayment(method)}
          >
            <span>◉</span>
            <b>{method}</b>
            <em>{payment === method ? "✓" : "Select"}</em>
          </button>
        ))}
        <button className="primary-requested" onClick={onPay}>
          Pay ₹{total.toFixed(2)} & Generate Invoice
        </button>
      </section>
      <section className="feedback-card">
        <h3>Feedback for the host</h3>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="How was the house charging experience?"
        />
        <button onClick={() => setFeedback("Feedback saved ✓")}>
          Save Feedback
        </button>
      </section>
      <section className="history-mini">
        <h3>Payment history</h3>
        <p>
          {history.length
            ? `${history.length} previous receipt${history.length > 1 ? "s" : ""}`
            : "No previous payments yet"}
        </p>
      </section>
    </main>
  );
}
function HistoryScreen({ history, onHome }) {
  return (
    <main className="requested-screen requested-stage">
      <Header
        title="Payment History"
        subtitle="Invoices and completed house sessions"
        action={
          <button className="back-button" onClick={onHome}>
            Nearby
          </button>
        }
      />
      <section className="history-list">
        {history.map((receipt) => (
          <article key={receipt.id}>
            <span>✓</span>
            <div>
              <b>{receipt.host}</b>
              <small>
                {receipt.date} · {receipt.kwh.toFixed(2)} kWh
              </small>
            </div>
            <strong>₹{receipt.total.toFixed(2)}</strong>
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(
                  new Blob(
                    [
                      `VoltPulse Invoice ${receipt.id}\n${receipt.host}\n${receipt.kwh} kWh\nINR ${receipt.total}`,
                    ],
                    { type: "text/plain" },
                  ),
                );
                link.download = `${receipt.id}.txt`;
                link.click();
              }}
            >
              Download
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
function BottomNav({ stage, onStage }) {
  const items = [
    ["dashboard", "⌂", "Stations"],
    ["journey", "↗", "Journey"],
    ["handshake", "⌁", "House PIN"],
    ["paytm", "◉", "Paytm UPI"],
    ["hdfc", "▣", "HDFC Fleet Visa"],
  ];
  return (
    <nav className="requested-nav" aria-label="Main navigation">
      {items.map(([key, icon, label]) => (
        <button
          key={key}
          className={stage === key ? "active" : ""}
          onClick={() => onStage(key)}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}
