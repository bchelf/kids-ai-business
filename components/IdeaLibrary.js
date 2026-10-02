import { useState } from "react";
import { steps } from "../lib/business";

export default function IdeaLibrary({
  projects,
  currentId,
  busy,
  error,
  open,
  create,
  remove,
  close,
  retry,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  return (
    <section className="idea-library" aria-labelledby="library-heading">
      <div className="library-heading">
        <div>
          <span className="eyebrow">ROOM FOR ALL YOUR BIG IDEAS</span>
          <h1 id="library-heading">My ideas</h1>
          <p>
            Every business is its own adventure. Pick one and keep building.
          </p>
        </div>
        <button className="primary-button" disabled={busy} onClick={create}>
          + New idea
        </button>
      </div>
      <p className="library-note">
        Saved in this browser on this device. Starting a new idea keeps your
        other projects.
      </p>
      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button className="quiet-button" disabled={busy} onClick={retry}>
            Try loading again
          </button>
        </div>
      )}
      {busy && (
        <p className="library-note" role="status">
          Opening your idea library…
        </p>
      )}
      {!busy && !error && !projects.length && (
        <div className="library-empty">
          <span>✦</span>
          <h2>Your next big idea belongs here.</h2>
          <p>
            Start a business, and it will appear in your library as you build.
          </p>
          <button className="primary-button" onClick={create}>
            Start my first idea →
          </button>
        </div>
      )}
      <div className="library-grid">
        {projects.map((project, index) => {
          const title =
            project.name ||
            project.originalIdea ||
            project.product ||
            "My business idea";
          const location =
            project.view === "website"
              ? "Website ready"
              : project.view === "blueprint"
                ? "Blueprint ready"
                : `Continue at ${steps[Math.max(0, Math.min(8, project.step || 0))]}`;
          return (
            <article
              className={`library-project ${project.id === currentId ? "current-project" : ""}`}
              key={project.id}
            >
              <div className="project-top">
                <span className={`project-initial initial-${index % 4}`}>
                  {title.slice(0, 1).toUpperCase()}
                </span>
                <span className="project-stage">
                  {project.id === currentId ? "CURRENT IDEA" : "SAVED IDEA"}
                </span>
              </div>
              <h2>{title}</h2>
              {project.name && <p>{project.originalIdea}</p>}
              <span className="project-location">{location}</span>
              <small>
                Saved{" "}
                {new Date(project.savedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </small>
              {confirmDelete === project.id ? (
                <div className="project-delete-confirm">
                  <p>
                    Delete this idea and its logo and website? This can&apos;t
                    be undone.
                  </p>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(null)}
                  >
                    Keep it
                  </button>
                  <button
                    className="delete-button"
                    disabled={busy}
                    onClick={async () => {
                      if (await remove(project.id)) setConfirmDelete(null);
                    }}
                  >
                    Delete idea
                  </button>
                </div>
              ) : (
                <div className="project-actions">
                  <button
                    className="primary-button"
                    disabled={busy}
                    onClick={() => open(project.id)}
                  >
                    Keep building →
                  </button>
                  <button
                    className="quiet-button"
                    aria-label={`Delete ${title}`}
                    disabled={busy}
                    onClick={() => setConfirmDelete(project.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <button
        className="quiet-button library-back"
        disabled={busy}
        onClick={close}
      >
        ← Back to my current idea
      </button>
    </section>
  );
}
