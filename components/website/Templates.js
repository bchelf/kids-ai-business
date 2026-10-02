import Image from "next/image";
import { contrast } from "../../lib/business";
function LandingPage({ business: b, spec: s, variant }) {
  const t = s.theme;
  return (
    <div
      className={`landing-page template-${variant}`}
      style={{
        "--site-primary": t.primaryColor,
        "--site-secondary": t.secondaryColor,
        "--site-accent": t.accentColor,
        "--site-ink": contrast(t.secondaryColor),
        "--button-ink": contrast(t.primaryColor),
        "--accent-ink": contrast(t.accentColor),
      }}
    >
      <header className="site-header">
        <strong>{b.name}</strong>
        <a href="#preview-product">Our product ↗</a>
      </header>
      <section className="site-hero">
        <div className="site-copy">
          <span className="site-kicker">SMALL BUSINESS. BIG HEART.</span>
          <h1>{s.headline}</h1>
          <p>{s.subheadline}</p>
          <a className="site-cta" href="#preview-product">
            {s.cta} <span>→</span>
          </a>
        </div>
        <div className={`site-art ${t.logoSize === "large" ? "large" : ""}`}>
          {b.logoImage ? (
            <Image
              unoptimized
              src={b.logoImage}
              alt={`${b.name} logo`}
              width={1024}
              height={1024}
            />
          ) : (
            <span className="business-initial" aria-label="Business initial">
              {b.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      </section>
      <section id="preview-product" className="site-product">
        <span className="site-kicker">MADE FOR YOU</span>
        <div>
          <h2>{s.productName}</h2>
          <strong className="site-price">{s.price}</strong>
        </div>
        <p>{s.productDescription}</p>
        <small>
          Interested? Ask a parent or guardian to help you connect with the
          maker.
        </small>
      </section>
      <section className="site-about">
        <h2>A little about us.</h2>
        <p>{s.about}</p>
      </section>
      <div className="site-sections">
        {s.sections.map((section, i) => (
          <section key={i}>
            <span>0{i + 1}</span>
            <h3>{section.title}</h3>
            <p>{section.text}</p>
          </section>
        ))}
      </div>
      <footer className="site-footer">
        <strong>{b.name}</strong>
        <span>Created with imagination.</span>
      </footer>
    </div>
  );
}
export function PlayfulTemplate(props) {
  return <LandingPage {...props} variant="playful" />;
}
export function ModernTemplate(props) {
  return <LandingPage {...props} variant="modern" />;
}
export function BoldTemplate(props) {
  return <LandingPage {...props} variant="bold" />;
}
