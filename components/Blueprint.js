import Image from "next/image";
export default function Blueprint({
  business: b,
  edit,
  build,
  busy,
  hasWebsite,
}) {
  const items = [
    ["Made for", b.customer, 1],
    ["What you sell", b.product, 2],
    ["Why people want it", b.valueProposition, 3],
    ["Starting price", b.price, 6],
    ["Your first customer", b.firstCustomer, 7],
    ["Spread the word", b.marketingIdea, 7],
  ];
  return (
    <section className="blueprint">
      <div className="celebration">
        <span className="eyebrow">LOOK WHAT YOU CREATED</span>
        <h1>You built a business! 🎉</h1>
        <p>Your choices. Your brand. Your next big adventure.</p>
      </div>
      <div className="blueprint-hero">
        {b.logoImage && (
          <Image
            unoptimized
            src={b.logoImage}
            alt={`${b.name} logo`}
            width={1024}
            height={1024}
          />
        )}
        <div>
          <span className="eyebrow">BUSINESS BLUEPRINT</span>
          <h2>{b.name}</h2>
          <p>
            {b.product} for {b.customer.toLowerCase()}.
          </p>
          <button
            className="quiet-button"
            disabled={busy}
            onClick={() => edit(5)}
          >
            Edit your brand ↗
          </button>
        </div>
      </div>
      <div className="blueprint-grid">
        {items.map(([label, value, step]) => (
          <article key={label}>
            <div className="blueprint-label">
              <span className="eyebrow">{label}</span>
              <button
                aria-label={`Edit ${label}`}
                disabled={busy}
                onClick={() => edit(step)}
              >
                Edit ↗
              </button>
            </div>
            <h3>{value}</h3>
          </article>
        ))}
      </div>
      <div className="launch-card">
        <div className="blueprint-label">
          <span className="eyebrow">YOUR PLAN / THIS WEEK</span>
          <button disabled={busy} onClick={() => edit(8)}>
            Edit ↗
          </button>
        </div>
        <ol>
          {b.launchPlan.map((item, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </div>
      <div className="website-invite">
        <div>
          <span className="eyebrow">GIVE YOUR IDEA A HOME</span>
          <h2>Ready for your own website?</h2>
          <p>Turn your blueprint into a page you can make your own.</p>
        </div>
        <button className="primary-button" disabled={busy} onClick={build}>
          {hasWebsite ? "View My Website →" : "Build My Website →"}
        </button>
      </div>
    </section>
  );
}
