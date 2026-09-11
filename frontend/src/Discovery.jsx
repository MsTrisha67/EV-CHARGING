import "./discovery.css";

function Discovery({ onRouteCharge }) {
  return (
    <section className="discovery-screen">
      <header className="discovery-header">
        <div className="discovery-brand">
          <span className="bolt-badge">ϟ</span>
          <strong>GridMitra Clean EV</strong>
        </div>
        <div className="battery-chip">
          <i /> <b>82%</b>
          <span>•</span>
          <span>280km</span>
        </div>
        <button className="notification-button" aria-label="Notifications">
          ♧<i />
        </button>
      </header>

      <div className="discovery-canvas">
        <svg
          className="discovery-map-art"
          viewBox="0 0 390 680"
          preserveAspectRatio="xMidYMid slice"
          aria-label="Charging network map"
        >
          <path
            d="M-20 60 C40 40, 110 90, 140 140 C160 175, 120 220, 70 230 C20 240, -10 190, -20 150 Z"
            fill="#ECFDF5"
          />
          <path
            d="M260 210 C310 190, 390 230, 410 300 C420 350, 370 410, 300 400 C240 390, 230 320, 240 270 Z"
            fill="#ECFDF5"
          />
          <path
            d="M-10 460 C60 440, 120 480, 130 550 C140 610, 80 670, 10 660 C-40 650, -50 560, -10 460 Z"
            fill="#F0FDF4"
          />
          <path
            d="M220 -20 C240 50, 270 100, 350 120 L400 120 L400 -20 Z"
            fill="#F1F5F9"
          />
          <path
            d="M-10 180 Q160 190 400 130"
            stroke="#E2E8F0"
            strokeLinecap="round"
            strokeWidth="6"
            fill="none"
          />
          <path
            d="M40 -20 L70 340 L110 700"
            stroke="#E2E8F0"
            strokeLinecap="round"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M190 -20 L180 320 L240 700"
            stroke="#E2E8F0"
            strokeLinecap="round"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M-20 370 C120 350 250 420 410 360"
            stroke="#E2E8F0"
            strokeLinecap="round"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M120 200 L320 180"
            stroke="#CBD5E1"
            strokeDasharray="6 6"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M-20 280 C100 290 200 260 410 240"
            stroke="#CBD5E1"
            strokeLinecap="round"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M-20 280 C100 290 200 260 410 240"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M290 0 C270 180 320 380 300 700"
            stroke="#CBD5E1"
            strokeLinecap="round"
            strokeWidth="9"
            fill="none"
          />
          <path
            d="M290 0 C270 180 320 380 300 700"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M195 440 C195 380, 220 320, 210 280"
            stroke="#006c49"
            strokeLinecap="round"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M195 440 C195 380, 220 320, 210 280"
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="195" cy="440" r="14" fill="#10B981" fillOpacity=".25" />
          <circle
            cx="195"
            cy="440"
            r="7"
            fill="#fff"
            stroke="#006C49"
            strokeWidth="3"
          />
        </svg>

        <div className="discovery-pin pin-primary">
          <div>
            <i /> <b>120kW Fast</b>
            <span>4 Avail</span>
          </div>
          <strong>ϟ</strong>
          <small />
        </div>
        <div className="discovery-pin pin-secondary">
          <div>
            <i /> <b>22kW Solar</b>
            <span>2 Avail</span>
          </div>
          <strong>☼</strong>
        </div>
        <div className="discovery-pin pin-tertiary">
          <div>
            <i /> <b>60kW · 6 Avail</b>
          </div>
          <strong>♧</strong>
        </div>

        <div className="discovery-tools">
          <div className="discovery-search">
            <span>⌕</span>
            <input placeholder="Search charging hubs, metro corridors, or hosts..." />
            <button>☷</button>
          </div>
          <div className="discovery-chips">
            <button className="chip-fast">ϟ Fast DC (&gt;50kW)</button>
            <button className="chip-solar">☼ Solar Powered</button>
            <button>ϟ Instant Book</button>
            <button>Tata Power EZ Compatible</button>
            <button>◷ Open 24/7</button>
          </div>
        </div>

        <div className="discovery-utilities">
          <button>⌘</button>
          <button>⌖</button>
        </div>

        <div className="discovery-sheet">
          <div className="sheet-top">
            <div>
              <span className="hub-category">
                <i /> Ultra-Fast DC Hub
              </span>
              <span className="sheet-distance">• 1.2 km away</span>
            </div>
            <span className="rating">
              ☆ 4.9 <small>(142)</small>
            </span>
          </div>
          <h2>CyberCity GreenHub CCS2 &amp; Type-2</h2>
          <p className="sheet-location">
            ⌖ Sector 43 Tech Corridor, Cyber Gateway
          </p>
          <div className="sheet-metrics">
            <div>
              <small>CLEAN ENERGY</small>
              <b>♧ 94% Solar</b>
            </div>
            <div>
              <small>BASE TARIFF</small>
              <b>
                ₹14.50 <em>/kWh</em>
              </b>
            </div>
            <div>
              <small>AVAILABILITY</small>
              <b>● 4 / 6 Free</b>
            </div>
          </div>
          <div className="sheet-actions">
            <button className="bookmark" aria-label="Bookmark">
              ♡
            </button>
            <button className="route-charge" onClick={onRouteCharge}>
              ⌁ <span>Route &amp; Charge</span> <b>→</b>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Discovery;
