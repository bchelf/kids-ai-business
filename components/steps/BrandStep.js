import Image from "next/image";
import { palettes, styles } from "../../lib/business";
import { ChoiceCard, ChoicePicker, CoachTip } from "../StudioUI";
export default function BrandStep({
  business,
  update,
  choices,
  busy,
  generate,
  refresh,
}) {
  const brand = business.brand;
  function setBrand(patch) {
    update({
      brand: { ...brand, ...patch },
      logoImage: "",
      logoAccepted: false,
      logoSkipped: false,
    });
  }
  return (
    <>
      <div className="section-label">01 / THE PERSONALITY</div>
      <h2 className="subheading">What should your business feel like?</h2>
      <div className="style-grid">
        {styles.map((style, i) => (
          <ChoiceCard
            key={style}
            title={style}
            index={i}
            selected={brand.style === style}
            disabled={busy}
            onClick={() => setBrand({ style })}
          />
        ))}
      </div>
      <div className="section-label">02 / THE SYMBOL</div>
      <h2 className="subheading">What should be in your logo?</h2>
      <ChoicePicker
        field="imagery"
        business={{ imagery: brand.imagery }}
        choices={choices}
        busy={busy}
        update={(p) => setBrand(p)}
        label="My own logo imagery"
        onRefresh={refresh}
      />
      <div className="section-label">03 / THE COLORS</div>
      <h2 className="subheading">Pick your palette.</h2>
      <div className="palette-grid">
        {palettes.map((p) => (
          <button
            key={p.name}
            className={`palette ${JSON.stringify(p.colors) === JSON.stringify(brand.colors) ? "selected" : ""}`}
            aria-pressed={
              JSON.stringify(p.colors) === JSON.stringify(brand.colors)
            }
            disabled={busy}
            onClick={() => setBrand({ colors: p.colors, description: p.name })}
          >
            <span className="swatches">
              {p.colors.map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </span>
            <strong>{p.name}</strong>
          </button>
        ))}
      </div>
      <button
        className="quiet-button refresh"
        disabled={busy}
        onClick={() => {
          const p = palettes[Math.floor(Math.random() * palettes.length)];
          setBrand({ colors: p.colors, description: p.name });
        }}
      >
        ✦ Surprise me
      </button>
      <div className="brand-summary">
        <div>
          <span className="eyebrow">YOUR DESIGN BRIEF</span>
          <h3>{business.name}</h3>
          <p>
            {brand.style || "Choose a style"} ·{" "}
            {brand.description || "Choose colors"}
          </p>
          <p>{brand.imagery || "Choose your logo imagery"}</p>
        </div>
        <button
          className="primary-button"
          disabled={
            busy ||
            !brand.style ||
            !brand.imagery.trim() ||
            brand.colors.length !== 3
          }
          onClick={generate}
        >
          {business.logoImage ? "Try another" : "Create My Logo 🎨"}
        </button>
      </div>
      {!business.logoImage &&
        brand.style &&
        brand.imagery.trim() &&
        brand.colors.length === 3 && (
          <button
            className="quiet-button refresh"
            disabled={busy}
            onClick={() => update({ logoSkipped: true })}
          >
            {business.logoSkipped
              ? "✓ I'll add my logo later"
              : "I'll add my logo later"}
          </button>
        )}
      {business.logoImage && (
        <div className="logo-reveal">
          <Image
            unoptimized
            src={business.logoImage}
            alt={`${business.name} business logo`}
            width={1024}
            height={1024}
          />
          <div>
            <span className="eyebrow">DESIGNED BY YOU + AI</span>
            <h2>Meet your new look.</h2>
            <p>A little idea. A real identity.</p>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => update({ logoAccepted: true })}
            >
              {business.logoAccepted ? "✓ Logo approved" : "I love it"}
            </button>
            <button className="quiet-button" disabled={busy} onClick={generate}>
              Try another
            </button>
          </div>
        </div>
      )}
      <CoachTip>
        A simple logo is easier to spot on a sticker, shirt, or website. Your
        design choices steer the AI.
      </CoachTip>
    </>
  );
}
