import Image from "next/image";
import { motion } from "framer-motion";
import { steps } from "../lib/business";
export function BusinessKidsHeader({
  onReset,
  onLibrary,
  libraryOpen,
  onSave,
  busy,
  saving,
  canSave,
  savedAt,
}) {
  return (
    <header className="studio-header">
      <Image
        src="/business-kids-logo.png"
        alt="Business Kids"
        width={1254}
        height={1254}
        priority
        className="corporate-logo"
      />
      <div className="header-right">
        <span className="studio-tag">YOUR STARTUP STUDIO</span>
        <button
          className="quiet-button"
          disabled={busy || saving}
          onClick={onLibrary}
          aria-pressed={libraryOpen}
        >
          My ideas
        </button>
        <div className="save-controls">
          <button
            className="secondary-button"
            disabled={busy || saving || !canSave || libraryOpen}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save idea"}
          </button>
          <span className="save-status" role="status">
            {saving
              ? "Saving your progress…"
              : savedAt
                ? "✓ Saved on this device"
                : "Your progress saves here"}
          </span>
        </div>
        <button
          className="quiet-button"
          disabled={busy || saving}
          onClick={onReset}
        >
          + New idea
        </button>
      </div>
    </header>
  );
}
export function WizardProgress({ step, onNavigate, busy }) {
  return (
    <nav aria-label="Business design progress" className="progress">
      <ol>
        {steps.map((label, i) => (
          <li key={label}>
            <button
              disabled={busy || i > step}
              aria-current={i === step ? "step" : undefined}
              onClick={() => onNavigate(i)}
              className={i === step ? "active" : i < step ? "complete" : ""}
            >
              <span>{i < step ? "✓" : i + 1}</span>
              <small>{label}</small>
            </button>
          </li>
        ))}
      </ol>
      <div className="progress-track">
        <div style={{ width: `${(Math.min(step, 9) / 9) * 100}%` }} />
      </div>
    </nav>
  );
}
export function CoachTip({ children }) {
  return (
    <aside className="coach-tip">
      <span className="tip-icon">✦</span>
      <div>
        <strong>Business Kids Tip</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}
export function Loading({ label }) {
  return (
    <div className="thinking" role="status">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        ✦
      </motion.span>
      <span>{label}</span>
      <span className="thinking-dots">•••</span>
    </div>
  );
}
export function ChoiceCard({
  title,
  description,
  selected,
  onClick,
  disabled,
  index = 0,
}) {
  return (
    <button
      type="button"
      className={`choice-card ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="choice-top">
        <span className="choice-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="choice-check">{selected ? "✓" : "↗"}</span>
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </button>
  );
}
export function ChoicePicker({
  field,
  business,
  choices = [],
  update,
  busy,
  label = "Your own idea",
  onRefresh,
}) {
  const value = business[field] || "";
  const isCustom = value && !choices.some((c) => c.title === value);
  return (
    <>
      <div className="choices-grid">
        {choices.map((c, i) => (
          <ChoiceCard
            key={c.title}
            {...c}
            index={i}
            selected={value === c.title}
            disabled={busy}
            onClick={() =>
              update({
                [field]: c.title,
                ...(field === "price" ? { priceReasoning: c.description } : {}),
              })
            }
          />
        ))}
      </div>
      <div className="custom-choice">
        <label htmlFor={`custom-${field}`}>+ {label}</label>
        <input
          id={`custom-${field}`}
          maxLength={500}
          disabled={busy}
          placeholder="I have an idea…"
          value={isCustom ? value : ""}
          onChange={(e) =>
            update({
              [field]: e.target.value,
              ...(field === "price"
                ? { priceReasoning: "My own starting price" }
                : {}),
            })
          }
        />
      </div>
      {onRefresh && (
        <button
          className="quiet-button refresh"
          disabled={busy}
          onClick={onRefresh}
        >
          ↻ {choices.length ? "Try new suggestions" : "Ask the AI coach"}
        </button>
      )}
    </>
  );
}
