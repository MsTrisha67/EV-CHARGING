import { useEffect, useState } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './mobile-charging.css'

const stations = [
  { id: 'greenvolt', name: 'GreenVolt Community Pod #4', address: 'Sector 43 Tech Corridor, Cyber Gateway', distance: '1.8 km', eta: 6, power: 30, tariff: 14.5, free: 4, total: 6, host: 'R. Sharma', energy: '94% Solar', coordinates: [28.4595, 77.0266] },
  { id: 'express', name: 'Peak Power Express', address: 'Golf Course Road, Gurugram', distance: '2.4 km', eta: 8, power: 60, tariff: 18, free: 2, total: 8, host: 'VoltGrid Station', energy: 'Grid + Solar', coordinates: [28.4676, 77.0810] },
  { id: 'home', name: 'Aarav Residence', address: 'Saket Community Lane', distance: '3.4 km', eta: 11, power: 22, tariff: 12.8, free: 1, total: 2, host: 'Aarav Mehta', energy: '100% Solar', coordinates: [28.5245, 77.2066] },
]

const sampleHomes = [
  { id: 'home-aarav', name: 'Aarav Residence', host: 'Aarav Mehta', coordinates: [28.5245, 77.2066], power: '22 kW', energy: '100% Solar' },
  { id: 'home-sharma', name: 'R. Sharma Home Pod', host: 'R. Sharma', coordinates: [28.4702, 77.0431], power: '30 kW', energy: '94% Solar' },
  { id: 'home-neha', name: 'Nehru Place Sample Home', host: 'Neha Kapoor', coordinates: [28.5494, 77.2501], power: '11 kW', energy: 'Solar + Grid' },
]

const initialSession = { elapsed: 0, delivered: 0, voltage: 394, amps: 74.5, soc: 42, paused: false, connected: true }

export default function MobileChargingApp() {
  const [tab, setTab] = useState('explore')
  const [station, setStation] = useState(stations[0])
  const [session, setSession] = useState(initialSession)
  const [hostAccepted, setHostAccepted] = useState(true)
  const [paid, setPaid] = useState(false)
  const [modal, setModal] = useState(null)
  const [rated, setRated] = useState(false)

  useEffect(() => {
    if (tab !== 'session' || !session.connected || session.paused) return undefined
    const timer = setInterval(() => setSession((current) => ({
      ...current,
      elapsed: current.elapsed + 1,
      delivered: +(current.delivered + 0.0083).toFixed(2),
      soc: Math.min(80, +(current.soc + 0.02).toFixed(1)),
      voltage: 394 + Math.floor(Math.random() * 3),
      amps: +(74.5 + Math.random() * 1.5).toFixed(1),
    })), 1000)
    return () => clearInterval(timer)
  }, [tab, session.connected, session.paused])

  useEffect(() => {
    if (tab !== 'explore') return undefined
    const handle = document.querySelector('.sheet-handle')
    const sheet = document.querySelector('.bottom-sheet')
    if (!handle || !sheet) return undefined
    sheet.classList.add('sheet-half')
    let startY = 0
    let dragging = false
    let dragged = false
    const snap = (direction) => {
      const modes = ['sheet-peek', 'sheet-half', 'sheet-expanded']
      const current = modes.findIndex((mode) => sheet.classList.contains(mode))
      const next = Math.max(0, Math.min(modes.length - 1, current + direction))
      sheet.classList.remove(...modes)
      sheet.classList.add(modes[next])
    }
    const onPointerDown = (event) => { startY = event.clientY; dragging = true; dragged = false; handle.setPointerCapture?.(event.pointerId) }
    const onPointerUp = (event) => {
      if (!dragging) return
      const delta = event.clientY - startY
      dragging = false
      if (Math.abs(delta) > 30) { dragged = true; snap(delta < 0 ? 1 : -1) }
      startY = 0
    }
    const onClick = () => { if (dragged) { dragged = false; return }; if (!dragging) snap(1) }
    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
    handle.addEventListener('click', onClick)
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
      handle.removeEventListener('click', onClick)
    }
  }, [tab])

  const total = +(session.delivered * station.tariff + 29.38).toFixed(2)
  const formatTime = (value) => new Date(value * 1000).toISOString().slice(11, 19)
  const chooseStation = (next) => { setStation(next); setTab('match') }
  const startSession = () => { setSession(initialSession); setTab('session') }
  const finishSession = () => { setSession((current) => ({ ...current, connected: false })); setTab('wallet') }

  return (
    <div className="mobile-app">
      {tab === 'explore' && <ExploreView station={station} onSelect={chooseStation} />}
      {tab === 'match' && <MatchView station={station} accepted={hostAccepted} setAccepted={setHostAccepted} onBack={() => setTab('explore')} onProceed={startSession} />}
      {tab === 'session' && <SessionView session={session} time={formatTime(session.elapsed)} onPause={() => setSession((current) => ({ ...current, paused: !current.paused }))} onDisconnect={finishSession} onStop={() => setModal('estop')} />}
      {tab === 'wallet' && <WalletView station={station} total={total} paid={paid} onPay={() => { setPaid(true); setModal(null) }} onInvoice={() => setModal('invoice')} onRate={() => setModal('rate')} rated={rated} />}
      <BottomNavBar activeTab={tab} onSelectTab={setTab} isCharging={session.connected} />
      {modal === 'estop' && <EStopModal onClose={() => setModal(null)} onConfirm={() => { setModal(null); finishSession() }} />}
      {modal === 'invoice' && <InvoiceModal station={station} total={total} delivered={session.delivered} onClose={() => setModal(null)} />}
      {modal === 'rate' && <RateHostModal onClose={() => setModal(null)} onSubmit={() => { setRated(true); setModal(null) }} host={station.host} />}
    </div>
  )
}

function Header({ title, subtitle, back, onBack, action }) { return <header className="mobile-header">{back ? <button className="icon-button" onClick={onBack}>‹</button> : <span className="brand-icon">⚡</span>}<div><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>{action || <span className="header-dot" />}</header> }
function RecenterMap({ station }) { const map = useMap(); useEffect(() => { map.flyTo(station.coordinates, 13, { duration: 0.45 }) }, [map, station]); return null }
function mapIcon(symbol, type, selected = false) { return divIcon({ className: 'map-marker-icon', html: `<span class="map-marker ${type}${selected ? ' selected' : ''}">${symbol}</span>` }) }
function RealMap({ station, onSelect }) { return <div className="real-map-shell"><MapContainer center={station.coordinates} zoom={12} zoomControl={false} scrollWheelZoom className="real-map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><RecenterMap station={station} />{stations.map((item) => <Marker key={item.id} position={item.coordinates} icon={mapIcon(item.energy.includes('Solar') ? '⚡☀' : '⚡', 'charger', item.id === station.id)} eventHandlers={{ click: () => onSelect(item) }}><Popup><strong>⚡ {item.name}</strong><br />{item.address}<br />{item.power} kW · {item.energy}<br />₹{item.tariff.toFixed(2)}/kWh</Popup></Marker>)}{sampleHomes.map((home) => <Marker key={home.id} position={home.coordinates} icon={mapIcon(home.energy.includes('Solar') ? '⌂☀' : '⌂', 'home')}><Popup><strong>⌂ {home.name}</strong><br />Host: {home.host}<br />{home.power} · {home.energy}</Popup></Marker>)}</MapContainer><div className="map-signal"><span>⚡ Fast DC</span><span>☀ Solar Powered</span><span>● Available Now</span></div><div className="map-legend"><i className="charger-dot" /> Charger <i className="home-dot" /> Sample Home</div></div> }
function ExploreView({ station, onSelect }) { const [query, setQuery] = useState(''); const filtered = stations.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.address.toLowerCase().includes(query.toLowerCase())); return <main className="mobile-screen explore-screen"><RealMap station={station} onSelect={onSelect} /><div className="map-surface"><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><div className="map-pulse" /><div className="map-pin pin-a">₹14.50</div><div className="map-pin pin-b">₹18.00</div><div className="map-pin pin-c">⚡</div></div><div className="explore-overlay"><Header title="GridMitra Clean EV" subtitle="Peer & Community Solar Grid" action={<span className="soc-chip">● 42% · 280km</span>} /><div className="search-box">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Where to charge?" /><span>☷</span></div><div className="filter-row"><button className="filter active">⚡ Fast DC</button><button className="filter blue">☀ Solar Powered</button><button className="filter">Available Now</button></div></div><section className="bottom-sheet"><div className="sheet-handle" /><div className="sheet-heading"><span>Nearby charging hubs</span><b>{filtered.length} Hubs nearby</b></div><div className="station-summary"><small>SELECTED HUB · {station.distance} · {station.eta} MIN DRIVE</small><h2>{station.name}</h2><p>⌖ {station.address}</p><div className="metric-row"><span>Clean power<strong>☀ {station.energy}</strong></span><span>Tariff<strong>₹{station.tariff.toFixed(2)}/kWh</strong></span><span>Availability<strong>● {station.free}/{station.total} Free</strong></span></div></div><div className="station-list">{filtered.map((item) => <button className={`station-item ${item.id === station.id ? 'selected' : ''}`} key={item.id} onClick={() => onSelect(item)}><span className="station-symbol">⚡</span><span><strong>{item.name}</strong><small>{item.distance} · {item.power} kW · {item.free}/{item.total} available</small></span><b>₹{item.tariff.toFixed(2)}</b></button>)}</div><button className="primary-button" onClick={() => onSelect(station)}>Directions & Charge · ₹{station.tariff.toFixed(2)}/kWh →</button></section></main> }

function MatchView({ station, accepted, setAccepted, onBack, onProceed }) { return <main className="mobile-screen scroll-screen"><Header title="Smart Host Matchmaker" back onBack={onBack} action={<button className="icon-button">☷</button>} /><div className="selected-vehicle">🚙 Tata Nexon EV Max <b>40.5 kWh</b></div><div className="info-banner"><span>✦</span><p><b>AI Optimal Dispatch</b><br />3 charging strategies matched for your current battery (42% remaining).</p></div><section className="mobile-card recommended"><label>Optimized for Lowest Tariff & Subsidy Headroom</label><h2>{station.name}</h2><p>Host: <b>{station.host}</b> (Verified Green Host)</p><div className="metric-row"><span>Charger spec<strong>⚡ {station.power}kW DC</strong></span><span>Target time<strong>34 mins to 80%</strong></span><span>Session cost<strong>₹320</strong></span></div><div className="subsidy">☀ Save 28% via Green Subsidy <b>Applied</b></div><div className="authorization"><h3>🛡 Homeowner Authorization</h3><p>Private residential charger · {station.host} has 2 minutes to accept vehicle access.</p><div className="choice-row"><button className={accepted ? 'chosen' : ''} onClick={() => setAccepted(true)}>✓ Host Accepted</button><button className={!accepted ? 'declined' : ''} onClick={() => setAccepted(false)}>× Host Declined</button></div><div className={accepted ? 'approval' : 'warning'}>{accepted ? <>Host Response Received · {station.host} approved Tata Nexon EV Max. Bay interlock PIN #7419 generated.</> : <>{station.host} is currently unavailable. Peak Power Express is available with zero wait time.</>}</div></div><button className="primary-button" disabled={!accepted} onClick={onProceed}>Proceed to Bay & Plug In →</button><button className="text-button" onClick={() => setAccepted(true)}>↻ Re-request Approval / Change Pod</button></section><section className="mobile-card express"><label>⚡ Fastest Charge · Zero Wait Time</label><h3>Peak Power Express</h3><p>2.4 km away · ★ 4.8 (98)</p><div className="metric-row"><span>Tariff rate<strong>₹18.00/kWh</strong></span><span>Estimated speed<strong>18 mins to 80%</strong></span></div><button className="secondary-button" onClick={onProceed}>Select Express (18 min) ⚡</button></section></main> }

function SessionView({ session, time, onPause, onDisconnect, onStop }) { return <main className="mobile-screen scroll-screen"><Header title="Active Bay #02" subtitle="GreenVolt Community Pod #4" action={<button className="stop-button" onClick={onStop}>⛔ E-STOP</button>} /><section className="mobile-card auth-card"><h3>✓ Socket Authenticated & Cable Locked</h3><p>Gun #01 · Hardware handshake completed via ISO 15118</p><div className="pin-row"><span>Bay PIN</span><b>7</b><b>4</b><b>1</b><b>9</b><strong>🔒 Interlocked</strong></div></section><section className="mobile-card meter-card"><div className="meter-heading"><b>● {session.paused ? 'Charging Paused' : 'Charging in Progress'}</b><strong>◷ {time}</strong></div><small>VOLUME DELIVERED · ⚡ DC HIGH-POWER</small><div className="meter-value">{session.delivered.toFixed(2)} <small>kWh</small></div><div className="telemetry-row"><span>Grid Voltage: <b>{session.voltage} V</b></span><span>Current: <b>{session.paused ? '0.0' : session.amps} A</b></span></div><div className="metric-row"><span>Current draw<strong>{session.paused ? '0.0' : '29.8'} kW</strong><i className="progress"><em style={{ width: session.paused ? '0%' : '75%' }} /></i></span><span>Live tariff cost<strong>₹{(session.delivered * 14.5).toFixed(2)}</strong><small>₹14.50/kWh</small></span></div><div className="soc-panel"><b>🔋 State of Charge <strong>{session.soc}%</strong></b><div className="soc-bar"><i style={{ width: `${session.soc}%` }} /></div><small>Start: 42% · Now: {session.soc}% · Target: 80% Limit</small></div><div className="impact">☘ <b>{(session.delivered * 0.46).toFixed(1)} kg CO₂ Offset</b><span>100% Wind</span></div><button className="outline-button" onClick={onPause}>{session.paused ? '▶ Resume Session' : 'Ⅱ Pause Session'}</button><button className="disconnect-button" onClick={onDisconnect}>🔓 Disconnect Hardware Safely</button></section><div className="safety-note">✓ Thermal safety & ground loop monitored <b>Normal (31°C)</b></div></main> }

function WalletView({ station, total, paid, onPay, onInvoice, onRate, rated }) { return <main className="mobile-screen scroll-screen"><Header title={paid ? 'Payment Confirmed' : 'Charging Complete'} subtitle="Invoice #VP-2026-0911" /><div className="status-pill">● {paid ? 'Escrow Settlement Confirmed · Direct Payout Dispatched' : 'Session Finished Successfully'}</div><section className="mobile-card receipt-card"><div className="receipt-top"><div><small>GRAND TOTAL DUE</small><strong>₹ {total.toFixed(2)}</strong><p>Inclusive of all taxes & green cess</p></div><b>✓ {station.energy}<small>{station.name}</small></b></div><div className="metric-row"><span>Duration<strong>34 mins</strong></span><span>Delivered energy<strong>22.10 kWh</strong></span><span>Peak speed<strong>{station.power} kW</strong></span></div><h3>⇄ Estimated Fee Distribution & Split-Escrow</h3><div className="split-line"><span>Platform Service Cut (8%)<small>GridMitra Clean Energy Operations</small></span><b>₹ {(total * .08).toFixed(2)}</b></div><div className="split-line host"><span>Net Payout to Host (92%)<small>Credited to {station.host}</small></span><b>₹ {(total * .92).toFixed(2)}</b></div></section><section className="mobile-card payment-card"><h2>Payment Method <small>🔒 256-bit Encrypted</small></h2>{['Google Pay', 'PhonePe UPI', 'Paytm UPI', 'HDFC Fleet Visa'].map((method, index) => <button className={`payment-option ${index === 0 ? 'selected' : ''}`} key={method}><span>◉</span><strong>{method}<small>{index === 0 ? 'Fast UPI 1-Tap Authorization' : '•••• 4129 · Saved payment method'}</small></strong><b>{index === 0 ? '✓' : 'UPI'}</b></button>)}<button className={`primary-button ${paid ? 'paid' : ''}`} onClick={onPay}>{paid ? '✓ Paid · Receipt Generated' : `🔒 Pay ₹${total.toFixed(2)} via Google Pay`}</button><div className="action-row"><button onClick={onInvoice}>⇩ Download Tax Invoice</button><button onClick={onRate}>★ {rated ? 'Rated ★ 5.0' : 'Rate Host & Socket'}</button></div></section><div className="safety-note">🤝 <b>100% Direct Payout Protocol</b><small>Host receives funds within 60 seconds of checkout completion.</small></div></main> }

function BottomNavBar({ activeTab, onSelectTab, isCharging }) { return <nav className="bottom-nav">{[['explore', '⌖', 'Explore'], ['match', '⇄', 'Match'], ['session', 'ϟ', 'Session'], ['wallet', '▣', 'Wallet']].map(([key, icon, label]) => <button className={activeTab === key ? 'active' : ''} key={key} onClick={() => onSelectTab(key)}>{key === 'session' && isCharging && activeTab !== key && <i />}<span>{icon}</span>{label}</button>)}</nav> }
function Modal({ children, onClose }) { return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={(event) => event.stopPropagation()}>{children}</div></div> }
function EStopModal({ onClose, onConfirm }) { return <Modal onClose={onClose}><div className="modal-icon danger">⛔</div><h2>Initiate Emergency E-STOP?</h2><p>Instantly cuts DC contactor interlock to Active Bay #02.</p><div className="warning-box"><b>Safety Interlock Protocol:</b><br />Current draw throttles to 0 A in &lt;15ms.<br />Mechanical socket lock releases automatically.</div><div className="modal-actions"><button onClick={onClose}>Cancel</button><button className="danger-button" onClick={onConfirm}>Confirm E-STOP</button></div></Modal> }
function InvoiceModal({ station, total, delivered, onClose }) { return <Modal onClose={onClose}><div className="modal-title"><h2>▤ GST Tax Invoice</h2><button onClick={onClose}>×</button></div><div className="invoice-summary"><p>Charging Pod <b>{station.name}</b></p><p>EV Host ID <b>{station.host}</b></p><p>Energy Delivered <b>{delivered.toFixed(2)} kWh</b></p><p>Source Protocol <b>ISO 15118 · 100% Solar</b></p></div><div className="invoice-total"><span>Total Payable Amount</span><b>₹ {total.toFixed(2)}</b></div><button className="primary-button" onClick={() => { const file = new Blob([`GRIDMITRA TAX INVOICE\nTotal: INR ${total}\nHost: ${station.host}`], { type: 'text/plain' }); const link = document.createElement('a'); link.href = URL.createObjectURL(file); link.download = 'GridMitra-Invoice.txt'; link.click(); URL.revokeObjectURL(link.href) }}>⇩ Download Invoice</button></Modal> }
function RateHostModal({ host, onClose, onSubmit }) { const [rating, setRating] = useState(5); return <Modal onClose={onClose}><div className="modal-title"><div><h2>Rate Host & Socket</h2><p>Host: <b>{host}</b></p></div><button onClick={onClose}>×</button></div><div className="stars">{[1, 2, 3, 4, 5].map((item) => <button key={item} onClick={() => setRating(item)} className={item <= rating ? 'selected' : ''}>★</button>)}</div><p className="rating-copy">{rating === 5 ? 'Excellent 5-Star Charging Experience!' : `${rating} out of 5 stars`}</p><div className="tag-row"><button className="tag selected">Clean Bay</button><button className="tag selected">100% Green Solar</button><button className="tag">Helpful Host</button><button className="tag">Accurate Metering</button></div><textarea placeholder="Share feedback on charging ease..." /><div className="modal-actions"><button onClick={onClose}>Skip</button><button className="primary-button" onClick={() => onSubmit(rating)}>Submit Review</button></div></Modal> }