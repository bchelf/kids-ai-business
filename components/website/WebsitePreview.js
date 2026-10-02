import { useState } from "react";
import { PlayfulTemplate, ModernTemplate, BoldTemplate } from "./Templates";
import { CoachTip } from "../StudioUI";
const templates = {
  playful: PlayfulTemplate,
  modern: ModernTemplate,
  bold: BoldTemplate,
};
export default function WebsitePreview({
  business,
  update,
  busy,
  revise,
  back,
}) {
  const [instruction, setInstruction] = useState("");
  const [mobile, setMobile] = useState(false);
  const spec = business.website;
  const Template = templates[spec.theme.style] || ModernTemplate;
  function change(patch) {
    update({ website: { ...spec, ...patch } });
  }
  function theme(patch) {
    change({ theme: { ...spec.theme, ...patch } });
  }
  const domain =
    (business.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 35) || "mybusiness") + ".com";
  return (
    <section>
      <div className="celebration">
        <span className="eyebrow">FROM IDEA TO INTERNET</span>
        <h1>Your website is ready! 🚀</h1>
        <p>A real-looking home for your business. Make it yours.</p>
      </div>
      <div className="preview-toolbar">
        <button className="quiet-button" disabled={busy} onClick={back}>
          ← My blueprint
        </button>
        <div className="device-switch">
          <button aria-pressed={!mobile} onClick={() => setMobile(false)}>
            Desktop
          </button>
          <button aria-pressed={mobile} onClick={() => setMobile(true)}>
            Mobile
          </button>
        </div>
      </div>
      <div className={`browser-frame ${mobile ? "mobile-preview" : ""}`}>
        <div className="browser-chrome">
          <span className="browser-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="browser-address">{domain}</span>
          <span className="preview-badge">PREVIEW</span>
        </div>
        <Template business={business} spec={spec} />
      </div>
      <p className="preview-note">
        This is a private preview. The example domain is not registered and this
        website is not published.
      </p>
      <div className="website-editor">
        <span className="eyebrow">YOU&apos;RE THE CREATIVE DIRECTOR</span>
        <h2>Make a few tweaks.</h2>
        <div className="edit-shortcuts">
          {[
            "Make it more colorful",
            "Make it simpler",
            "Make the logo bigger",
            "Change the headline",
          ].map((text) => (
            <button
              className="secondary-button"
              key={text}
              disabled={busy}
              onClick={() =>
                text === "Make the logo bigger"
                  ? theme({ logoSize: "large" })
                  : revise(text)
              }
            >
              {text}
            </button>
          ))}
        </div>
        <div className="editor-grid">
          <label>
            Template
            <select
              aria-label="Template"
              disabled={busy}
              value={spec.theme.style}
              onChange={(e) => theme({ style: e.target.value })}
            >
              {Object.keys(templates).map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Headline
            <input
              maxLength={120}
              disabled={busy}
              value={spec.headline}
              onChange={(e) => change({ headline: e.target.value })}
            />
          </label>
        </div>
        <div className="color-editors">
          {[
            ["primaryColor", "Main color"],
            ["secondaryColor", "Background"],
            ["accentColor", "Accent"],
          ].map(([key, label]) => (
            <label key={key}>
              <input
                type="color"
                aria-label={label}
                disabled={busy}
                value={spec.theme[key]}
                onChange={(e) => theme({ [key]: e.target.value })}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="custom-instruction" htmlFor="website-instruction">
          What would you like to change?
        </label>
        <textarea
          id="website-instruction"
          maxLength={500}
          rows={2}
          value={instruction}
          disabled={busy}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Give it a friendlier headline and a sunny feel…"
        />
        <div className="editor-actions">
          <button
            className="primary-button"
            disabled={busy || !instruction.trim()}
            onClick={() => revise(instruction)}
          >
            Apply my idea →
          </button>
          <button
            className="quiet-button"
            disabled={busy}
            onClick={() => revise("")}
          >
            ↻ Regenerate website
          </button>
        </div>
        <CoachTip>
          Try different looks. This preview doesn&apos;t take payments or
          publish anything.
        </CoachTip>
      </div>
    </section>
  );
}
