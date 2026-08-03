import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, X, Bell, BellOff, Sun, Moon, Clock3, AlarmClock, Trash2 } from "lucide-react";
import "./WorldClockDashboard.css";

// ---- Timezone catalog -------------------------------------------------
const TIMEZONES = [
  { id: "local", label: "Local Time", tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { id: "nyc", label: "New York", tz: "America/New_York" },
  { id: "lon", label: "London", tz: "Europe/London" },
  { id: "par", label: "Paris", tz: "Europe/Paris" },
  { id: "dub", label: "Dubai", tz: "Asia/Dubai" },
  { id: "del", label: "New Delhi", tz: "Asia/Kolkata" },
  { id: "sha", label: "Shanghai", tz: "Asia/Shanghai" },
  { id: "tok", label: "Tokyo", tz: "Asia/Tokyo" },
  { id: "syd", label: "Sydney", tz: "Australia/Sydney" },
  { id: "lax", label: "Los Angeles", tz: "America/Los_Angeles" },
  { id: "sao", label: "Sao Paulo", tz: "America/Sao_Paulo" },
  { id: "mos", label: "Moscow", tz: "Europe/Moscow" },
];

// ---- Time helpers -------------------------------------------------------
function getParts(date, tz) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = {};
  fmt.formatToParts(date).forEach((p) => (parts[p.type] = p.value));
  return {
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday,
    month: parts.month,
    day: parts.day,
    year: parts.year,
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDigital(parts, is24h) {
  let h = parts.hour;
  let suffix = "";
  if (!is24h) {
    suffix = h >= 12 ? " PM" : " AM";
    h = h % 12;
    if (h === 0) h = 12;
  }
  return `${pad(h)}:${pad(parts.minute)}:${pad(parts.second)}${suffix}`;
}

// ---- Analog clock face ---------------------------------------------------
function AnalogClock({ parts, accent }) {
  const secAngle = parts.second * 6;
  const minAngle = parts.minute * 6 + parts.second * 0.1;
  const hourAngle = (parts.hour % 12) * 30 + parts.minute * 0.5;

  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const angle = i * 30;
    const isMajor = i % 3 === 0;
    return (
      <line
        key={i}
        x1="50"
        y1={isMajor ? "8" : "10"}
        x2="50"
        y2="14"
        stroke="#94a3b8"
        strokeWidth={isMajor ? 2 : 1}
        opacity={isMajor ? 0.9 : 0.4}
        transform={`rotate(${angle} 50 50)`}
      />
    );
  });

  return (
    <svg viewBox="0 0 100 100" className="wcd-analog">
      <circle cx="50" cy="50" r="47" fill="none" stroke="#94a3b8" strokeWidth="1.5" opacity="0.25" />
      <g>{ticks}</g>
      {/* hour hand */}
      <line
        x1="50" y1="50" x2="50" y2="28"
        stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`}
      />
      {/* minute hand */}
      <line
        x1="50" y1="50" x2="50" y2="18"
        stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${minAngle} 50 50)`}
      />
      {/* second hand */}
      <line
        x1="50" y1="56" x2="50" y2="14"
        stroke={accent} strokeWidth="1" strokeLinecap="round"
        transform={`rotate(${secAngle} 50 50)`}
      />
      <circle cx="50" cy="50" r="2.5" fill={accent} />
    </svg>
  );
}

// ---- Clock card -----------------------------------------------------------
function ClockCard({ entry, now, is24h, accent, onRemove, removable }) {
  const parts = getParts(now, entry.tz);
  return (
    <div className="wcd-card">
      {removable && (
        <button
          onClick={() => onRemove(entry.id)}
          className="wcd-card-remove"
          aria-label={`Remove ${entry.label}`}
        >
          <X size={16} />
        </button>
      )}
      <div className="wcd-card-header">
        <span className="wcd-card-label">{entry.label}</span>
        <span className="wcd-card-date">
          {parts.weekday}, {parts.month} {parts.day}
        </span>
      </div>
      <AnalogClock parts={parts} accent={accent} />
      <div className="wcd-digital">{formatDigital(parts, is24h)}</div>
    </div>
  );
}

// ---- Alarm panel ------------------------------------------------------
function AlarmPanel({ alarms, onAdd, onRemove, onToggle, tzOptions, accent }) {
  const [time, setTime] = useState("07:00");
  const [label, setLabel] = useState("");
  const [tzId, setTzId] = useState(tzOptions[0]?.id ?? "local");

  function handleAdd() {
    if (!time) return;
    onAdd({
      id: `${Date.now()}`,
      time,
      label: label.trim() || "Alarm",
      tzId,
      enabled: true,
    });
    setLabel("");
  }

  return (
    <div className="wcd-panel">
      <div className="wcd-panel-header">
        <AlarmClock size={16} color="#cbd5e1" />
        <h2>Alarms</h2>
      </div>

      <div className="wcd-alarm-form">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="wcd-input"
        />
        <input
          type="text"
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="wcd-input wcd-input-label"
        />
        <select
          value={tzId}
          onChange={(e) => setTzId(e.target.value)}
          className="wcd-input"
        >
          {tzOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button onClick={handleAdd} className="wcd-add-btn">
          <Plus size={14} /> Add
        </button>
      </div>

      {alarms.length === 0 ? (
        <p className="wcd-empty">No alarms set.</p>
      ) : (
        <ul className="wcd-alarm-list">
          {alarms.map((a) => (
            <li key={a.id} className="wcd-alarm-item">
              <div className="wcd-alarm-left">
                <button onClick={() => onToggle(a.id)} className="wcd-alarm-toggle">
                  {a.enabled ? <Bell size={16} color={accent} /> : <BellOff size={16} color="#475569" />}
                </button>
                <div>
                  <div className="wcd-alarm-time">{a.time}</div>
                  <div className="wcd-alarm-meta">
                    {a.label} · {tzOptions.find((t) => t.id === a.tzId)?.label ?? a.tzId}
                  </div>
                </div>
              </div>
              <button onClick={() => onRemove(a.id)} className="wcd-alarm-delete">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Beep sound (Web Audio, no external assets) ---------------------------
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch (e) {
    // ignore if audio unsupported
  }
}

// ---- Main dashboard ---------------------------------------------------
export default function WorldClockDashboard() {
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState(["local", "nyc", "tok"]);
  const [is24h, setIs24h] = useState(false);
  const [dark, setDark] = useState(true);
  const [alarms, setAlarms] = useState([]);
  const [ringing, setRinging] = useState(null);
  const lastCheckedMinute = useRef(null);

  const accent = "#38bdf8"; // sky-400

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const selectedEntries = useMemo(
    () => selected.map((id) => TIMEZONES.find((t) => t.id === id)).filter(Boolean),
    [selected]
  );

  // Check alarms once per second, but only trigger on second === 0 change
  useEffect(() => {
    const key = `${now.getMinutes()}:${now.getSeconds()}`;
    if (now.getSeconds() !== 0) return;
    if (lastCheckedMinute.current === key) return;
    lastCheckedMinute.current = key;

    alarms.forEach((a) => {
      if (!a.enabled) return;
      const entry = TIMEZONES.find((t) => t.id === a.tzId) ?? TIMEZONES[0];
      const p = getParts(now, entry.tz);
      const current = `${pad(p.hour)}:${pad(p.minute)}`;
      if (current === a.time) {
        setRinging(a);
        playBeep();
      }
    });
  }, [now, alarms]);

  function addTimezone(id) {
    if (!id || selected.includes(id)) return;
    setSelected((s) => [...s, id]);
  }
  function removeTimezone(id) {
    setSelected((s) => s.filter((x) => x !== id));
  }
  function addAlarm(a) {
    setAlarms((prev) => [...prev, a]);
  }
  function removeAlarm(id) {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }
  function toggleAlarm(id) {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }

  const availableToAdd = TIMEZONES.filter((t) => !selected.includes(t.id));

  return (
    <div className="wcd-root">
      <div className="wcd-container">
        {/* Header */}
        <div className="wcd-header">
          <div className="wcd-title">
            <Clock3 size={20} color={accent} />
            <h1>World Clock Dashboard</h1>
          </div>
          <div className="wcd-controls">
            <button onClick={() => setIs24h((v) => !v)} className="wcd-btn">
              {is24h ? "24h" : "12h"}
            </button>
            <button
              onClick={() => setDark((v) => !v)}
              className="wcd-icon-btn"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <select
              onChange={(e) => { addTimezone(e.target.value); e.target.value = ""; }}
              defaultValue=""
              className="wcd-select"
            >
              <option value="" disabled>+ Add timezone</option>
              {availableToAdd.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ringing banner */}
        {ringing && (
          <div className="wcd-banner">
            <span className="wcd-banner-text">
              <Bell size={14} />
              {ringing.label} — {ringing.time}
            </span>
            <button onClick={() => setRinging(null)} className="wcd-banner-dismiss">
              Dismiss
            </button>
          </div>
        )}

        {/* Clock grid */}
        <div className="wcd-grid">
          {selectedEntries.map((entry) => (
            <ClockCard
              key={entry.id}
              entry={entry}
              now={now}
              is24h={is24h}
              accent={accent}
              onRemove={removeTimezone}
              removable={selectedEntries.length > 1}
            />
          ))}
        </div>

        {/* Alarms */}
        <AlarmPanel
          alarms={alarms}
          onAdd={addAlarm}
          onRemove={removeAlarm}
          onToggle={toggleAlarm}
          tzOptions={TIMEZONES}
          accent={accent}
        />
      </div>
    </div>
  );
}