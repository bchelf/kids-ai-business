import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  emptyBusiness,
  cleanText,
  sanitizeBusiness,
  sanitizeWebsite,
  steps,
} from "../lib/business";
import {
  createProjectId,
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
} from "../lib/persistence";
import IdeaLibrary from "../components/IdeaLibrary";
import {
  BusinessKidsHeader,
  WizardProgress,
  CoachTip,
  ChoicePicker,
  Loading,
} from "../components/StudioUI";
import BrandStep from "../components/steps/BrandStep";
import Blueprint from "../components/Blueprint";
import WebsitePreview from "../components/website/WebsitePreview";

const fields = [
  null,
  "customer",
  "product",
  "valueProposition",
  "name",
  "imagery",
  "price",
  "firstCustomer",
  "launch",
];
const copy = [
  [
    "What are you into?",
    "Great businesses often start with something you love, know about, or want to improve.",
  ],
  [
    "Who is this for?",
    "Picture the people who would be excited about your idea. Who do YOU want to make this for?",
  ],
  [
    "What could you sell?",
    "Start with one product or service you can actually make. Small is a great place to begin.",
  ],
  [
    "Why would someone want this?",
    "What makes your idea useful, special, or just really fun?",
  ],
  [
    "What should we call it?",
    "A name makes your idea feel real. Choose a favorite or invent your own.",
  ],
  [
    "Let's design your brand.",
    "You're the designer. AI brings your style, symbols, and colors to life.",
  ],
  [
    "What should it cost?",
    "Your starting price should cover what it costs to make, and feel worth it to your customer.",
  ],
  [
    "Who could be your first customer?",
    "Think of one person you already know. You don't need a hundred customers to start.",
  ],
  [
    "Your next small steps.",
    "An idea becomes a business one small action at a time. Here's your plan for this week.",
  ],
];
const tips = [
  "You bring the imagination. AI helps you explore. Every big decision is yours.",
  "Try to picture one specific person who would really want this.",
  "Your first product doesn't have to be perfect. Starting small lets you learn.",
  "Think about what makes someone say: I want that!",
  "Say the name out loud. Does it sound like you?",
  "",
  "These prices are starting ideas, not promises. Count supplies and time with a grown-up.",
  "Start with someone you know and trust. Ask for feedback before trying to sell.",
  "You can change these steps. Pick something small you can do with a grown-up this week.",
];
const dependency = {
  customer: ["originalIdea"],
  product: ["originalIdea", "customer"],
  valueProposition: ["originalIdea", "customer", "product"],
  name: ["originalIdea", "customer", "product", "valueProposition"],
  imagery: ["originalIdea", "customer", "product", "valueProposition", "name"],
  price: ["originalIdea", "customer", "product", "valueProposition"],
  firstCustomer: [
    "originalIdea",
    "customer",
    "product",
    "valueProposition",
    "price",
  ],
  marketingIdea: [
    "originalIdea",
    "customer",
    "product",
    "valueProposition",
    "price",
    "firstCustomer",
  ],
  launch: [
    "originalIdea",
    "customer",
    "product",
    "valueProposition",
    "name",
    "brand",
    "price",
    "firstCustomer",
    "marketingIdea",
  ],
};
function signature(field, b) {
  return JSON.stringify((dependency[field] || []).map((key) => b[key]));
}
const examples = [
  "I love dogs",
  "I make bracelets",
  "I love LEGO",
  "I like baking",
  "I love video games",
  "I like drawing",
];

function restoreProject(project) {
  const b = sanitizeBusiness(project?.business);
  const raw = project?.business || {};
  if (
    typeof raw.logoImage === "string" &&
    /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raw.logoImage)
  )
    b.logoImage = raw.logoImage;
  b.logoAccepted = Boolean(b.logoImage && raw.logoAccepted);
  b.logoSkipped = raw.logoSkipped === true;
  try {
    if (raw.website) b.website = sanitizeWebsite(raw.website);
  } catch {}
  const restoredChoices = {};
  for (const field of Object.keys(dependency)) {
    const entry = project?.choices?.[field];
    if (
      entry?.signature !== signature(field, b) ||
      !Array.isArray(entry.choices)
    )
      continue;
    restoredChoices[field] = {
      signature: entry.signature,
      tip: cleanText(entry.tip, 200),
      choices: entry.choices
        .slice(0, 5)
        .map((choice) => ({
          title: cleanText(choice?.title, 80),
          description: cleanText(choice?.description, 200),
        }))
        .filter((choice) => choice.title && choice.description),
    };
  }
  return {
    business: b,
    choices: restoredChoices,
    step: Number.isInteger(project?.step)
      ? Math.max(0, Math.min(8, project.step))
      : 0,
    view:
      project?.view === "website" && b.website
        ? "website"
        : project?.view === "blueprint"
          ? "blueprint"
          : "wizard",
  };
}

export default function KidsBusiness() {
  const [business, setBusiness] = useState(emptyBusiness);
  const [step, setStep] = useState(0);
  const [view, setView] = useState("wizard");
  const [choices, setChoices] = useState({});
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [showResume, setShowResume] = useState(false);
  const saveVersion = useRef(0);
  const [projectId, setProjectId] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const projectTransition = useRef(false);
  const lock = useRef(false);
  const heading = useRef(null);
  const errorPanel = useRef(null);
  const reduced = useReducedMotion();
  const applyProject = useCallback((project, resume = false) => {
    const restored = restoreProject(project);
    setProjectId(project?.id || createProjectId());
    setBusiness(restored.business);
    setChoices(restored.choices);
    setStep(restored.step);
    setView(restored.view);
    setSavedAt(typeof project?.savedAt === "number" ? project.savedAt : null);
    setShowResume(resume && Boolean(restored.business.originalIdea));
    setError("");
    setSaving(false);
  }, []);
  useEffect(() => {
    let active = true;
    loadProject()
      .then((project) => {
        if (active) applyProject(project, true);
      })
      .catch(() => {
        if (active) {
          applyProject(null);
          setStorageWarning(
            "This browser can't save your projects. Keep this tab open to keep your choices.",
          );
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [applyProject]);
  useEffect(() => {
    const version = ++saveVersion.current;
    if (!ready || !projectId || libraryOpen) return;
    const timer = setTimeout(async () => {
      if (version !== saveVersion.current) return;
      setSaving(true);
      try {
        const timestamp = await saveProject({
          id: projectId,
          business,
          step,
          view,
          choices,
        });
        if (version === saveVersion.current) {
          setSavedAt(business.originalIdea ? timestamp : null);
          setStorageWarning("");
        }
      } catch {
        if (version === saveVersion.current) {
          setSavedAt(null);
          setStorageWarning(
            "We couldn't save on this device. Keep this tab open and try Save idea again.",
          );
        }
      } finally {
        if (version === saveVersion.current) setSaving(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [business, step, view, choices, ready, projectId, libraryOpen]);
  async function persistCurrent() {
    if (!ready || !projectId) return false;
    const version = ++saveVersion.current;
    setSaving(true);
    try {
      const timestamp = await saveProject({
        id: projectId,
        business,
        step,
        view,
        choices,
      });
      if (version === saveVersion.current) {
        setSavedAt(business.originalIdea ? timestamp : null);
        setStorageWarning("");
      }
      return true;
    } catch {
      if (version === saveVersion.current) {
        setSavedAt(null);
        setStorageWarning(
          "We couldn't save on this device. Keep this tab open and try Save idea again.",
        );
      }
      return false;
    } finally {
      if (version === saveVersion.current) setSaving(false);
    }
  }
  async function saveIdea() {
    if (
      !ready ||
      saving ||
      !business.originalIdea.trim() ||
      projectTransition.current
    )
      return;
    await persistCurrent();
  }
  async function refreshLibrary() {
    setLibraryBusy(true);
    setLibraryError("");
    try {
      setProjects(await listProjects());
    } catch {
      setLibraryError(
        "We couldn't open your saved ideas. Try again, or close other Business Kids tabs.",
      );
    } finally {
      setLibraryBusy(false);
    }
  }
  async function openLibrary() {
    if (lock.current || projectTransition.current || !ready) return;
    projectTransition.current = true;
    setLibraryBusy(true);
    try {
      if (!(await persistCurrent())) return;
      setShowResume(false);
      setLibraryOpen(true);
      await refreshLibrary();
    } finally {
      projectTransition.current = false;
      setLibraryBusy(false);
    }
  }
  async function startNewIdea() {
    if (lock.current || projectTransition.current || !ready) return;
    projectTransition.current = true;
    setLibraryBusy(true);
    try {
      if (!(await persistCurrent())) return;
      applyProject(null);
      setLibraryOpen(false);
      setShowResume(false);
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    } finally {
      projectTransition.current = false;
      setLibraryBusy(false);
    }
  }
  async function openIdea(id) {
    if (projectTransition.current) return;
    projectTransition.current = true;
    setLibraryBusy(true);
    setLibraryError("");
    try {
      if (!(await persistCurrent())) return;
      const project = await loadProject(id);
      if (!project) throw new Error("Missing saved idea");
      // Commit the active project before switching, so refresh resumes this one.
      await saveProject(project);
      ++saveVersion.current;
      applyProject(project);
      setLibraryOpen(false);
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    } catch {
      setLibraryError(
        "We couldn't open that idea. Your current project is safe. Try again.",
      );
    } finally {
      projectTransition.current = false;
      setLibraryBusy(false);
    }
  }
  async function removeIdea(id) {
    if (projectTransition.current) return false;
    projectTransition.current = true;
    setLibraryBusy(true);
    setLibraryError("");
    try {
      ++saveVersion.current;
      await deleteProject(id);
      if (id === projectId) applyProject(null);
      setProjects(await listProjects());
      return true;
    } catch {
      setLibraryError("We couldn't delete that idea. Please try again.");
      return false;
    } finally {
      projectTransition.current = false;
      setLibraryBusy(false);
    }
  }
  function update(patch) {
    setBusiness((prev) => {
      const changed = Object.keys(patch).some(
        (k) => JSON.stringify(prev[k]) !== JSON.stringify(patch[k]),
      );
      if (!changed) return prev;
      const next = { ...prev, ...patch };
      const decision = Object.keys(patch).some(
        (k) =>
          ![
            "website",
            "logoImage",
            "logoAccepted",
            "logoSkipped",
            "launchPlan",
          ].includes(k),
      );
      if (decision) {
        next.website = null;
        next.launchPlan = [];
        if (
          [
            "originalIdea",
            "customer",
            "product",
            "valueProposition",
            "name",
            "brand",
          ].some((k) => k in patch)
        ) {
          next.logoImage = "";
          next.logoAccepted = false;
          next.logoSkipped = false;
        }
      }
      return next;
    });
  }
  async function request(url, body, label, apply) {
    if (lock.current) return false;
    lock.current = true;
    setLoading(label);
    setError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The coach sent an unexpected reply. Please try again.",
        );
      }
      if (!response.ok)
        throw new Error(
          data.error || "The coach couldn't finish. Please try again.",
        );
      apply(data);
      return true;
    } catch (err) {
      setError(
        err.name === "AbortError"
          ? "That took too long. Your choices are safe. Please try again."
          : err.message || "We couldn't connect. Please try again.",
      );
      setTimeout(() => {
        errorPanel.current?.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "center",
        });
        errorPanel.current?.focus({ preventScroll: true });
      }, 50);
      return false;
    } finally {
      clearTimeout(timer);
      lock.current = false;
      setLoading("");
    }
  }
  function payload(b) {
    return sanitizeBusiness(b);
  }
  async function coach(field, b = business, force = false) {
    const sig = signature(field, b);
    if (
      !force &&
      choices[field]?.signature === sig &&
      (field !== "launch" || b.launchPlan.length)
    )
      return true;
    const label =
      field === "name"
        ? "Dreaming up names…"
        : field === "launch"
          ? "Planning your first small steps…"
          : field === "imagery"
            ? "Exploring your logo ideas…"
            : `Thinking about ${field === "valueProposition" ? "what makes this special" : field === "marketingIdea" ? "ways to spread the word" : field === "firstCustomer" ? "your first customer" : field === "price" ? "starting prices" : `your ${field}s`}…`;
    return request(
      "/api/coach",
      { step: field, business: payload(b) },
      label,
      (data) => {
        if (!Array.isArray(data.choices) || !Array.isArray(data.launchPlan))
          throw new Error(
            "The coach's ideas were incomplete. Try again or write your own.",
          );
        setChoices((prev) => ({
          ...prev,
          [field]: { choices: data.choices, tip: data.tip, signature: sig },
        }));
        if (field === "launch")
          setBusiness((prev) => ({ ...prev, launchPlan: data.launchPlan }));
      },
    );
  }
  function focusStep() {
    setTimeout(() => heading.current?.focus(), 50);
  }
  async function navigate(i) {
    if (lock.current) return;
    setStep(i);
    setView("wizard");
    setError("");
    focusStep();
    if (i > 0) await coach(fields[i]);
  }
  function valid() {
    if (step === 0) return Boolean(business.originalIdea.trim());
    if (step === 5)
      return Boolean(
        (business.logoImage && business.logoAccepted) || business.logoSkipped,
      );
    if (step === 7)
      return Boolean(
        business.firstCustomer.trim() && business.marketingIdea.trim(),
      );
    if (step === 8) return business.launchPlan.some((action) => action.trim());
    return Boolean(business[fields[step]]?.trim());
  }
  async function next() {
    if (!valid() || lock.current) return;
    if (step === 8) {
      setBusiness((prev) => ({
        ...prev,
        launchPlan: prev.launchPlan
          .map((action) => action.trim())
          .filter(Boolean),
      }));
      setView("blueprint");
      setError("");
      return;
    }
    await navigate(step + 1);
  }
  async function logo() {
    await request(
      "/api/generate-logo",
      { business: payload(business) },
      "Designing your logo… This can take a minute.",
      (data) => {
        if (
          typeof data.image !== "string" ||
          !data.image.startsWith("data:image/png;base64,")
        )
          throw new Error("Your logo wasn't ready. Please try again.");
        setBusiness((prev) => ({
          ...prev,
          logoImage: data.image,
          logoAccepted: false,
          logoSkipped: false,
          website: null,
        }));
      },
    );
  }
  async function website(instruction = "", regenerate = false) {
    if (business.website && !regenerate) {
      setView("website");
      return;
    }
    await request(
      "/api/generate-website",
      {
        business: payload(business),
        website: regenerate && instruction ? business.website : null,
        instruction,
      },
      instruction ? "Updating your website…" : "Building your website…",
      (data) => {
        const spec = sanitizeWebsite(data.website);
        setBusiness((prev) => ({ ...prev, website: spec }));
        setView("website");
      },
    );
  }
  const current = choices[fields[step]];
  const currentChoices =
    current?.signature === signature(fields[step], business)
      ? current.choices
      : [];
  const busy = Boolean(loading) || !ready || libraryBusy;
  return (
    <>
      <Head>
        <title>Business Kids — Your startup studio</title>
        <meta
          name="description"
          content="Turn what you love into a business. Make your own decisions with an AI coach, design your logo, and build a website."
        />
      </Head>
      <main className="studio min-h-screen bg-gradient-to-br from-indigo-50 via-[#faf9ff] to-amber-50 text-slate-900">
        <div className="studio-container">
          <BusinessKidsHeader
            onReset={startNewIdea}
            onLibrary={openLibrary}
            libraryOpen={libraryOpen}
            busy={busy}
            onSave={saveIdea}
            saving={saving}
            canSave={Boolean(business.originalIdea.trim())}
            savedAt={savedAt}
          />
          {!libraryOpen && showResume && (
            <section className="resume-card" aria-label="Saved idea">
              <div>
                <span className="eyebrow">YOUR SAVED IDEA</span>
                <h2>Welcome back, founder.</h2>
                <p>{business.name || business.originalIdea}</p>
                <small>
                  Pick up at{" "}
                  {view === "website"
                    ? "your website"
                    : view === "blueprint"
                      ? "your blueprint"
                      : steps[step].toLowerCase()}
                  . Saved in this browser on this device.
                </small>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setShowResume(false);
                  focusStep();
                }}
              >
                Pick up where I left off →
              </button>
            </section>
          )}
          {!libraryOpen && view === "wizard" && (
            <WizardProgress step={step} onNavigate={navigate} busy={busy} />
          )}
          <div className="workspace">
            {libraryOpen ? (
              <IdeaLibrary
                projects={projects}
                currentId={projectId}
                busy={libraryBusy}
                error={libraryError}
                open={openIdea}
                create={startNewIdea}
                remove={removeIdea}
                close={() => setLibraryOpen(false)}
                retry={refreshLibrary}
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={view === "wizard" ? step : view}
                  initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === "wizard" ? (
                    <section className="wizard-card">
                      <div className="step-heading">
                        <span className="eyebrow">
                          {step === 0
                            ? "BIG IDEAS START HERE"
                            : `YOUR BUSINESS / ${steps[step].toUpperCase()}`}
                        </span>
                        <h1 ref={heading} tabIndex={-1}>
                          {copy[step][0]}
                        </h1>
                        <p>{copy[step][1]}</p>
                      </div>
                      {step === 0 ? (
                        <>
                          <label className="input-label" htmlFor="big-idea">
                            Tell us what you love doing.
                          </label>
                          <textarea
                            id="big-idea"
                            rows={4}
                            maxLength={500}
                            disabled={busy}
                            value={business.originalIdea}
                            onChange={(e) =>
                              update({ originalIdea: e.target.value })
                            }
                            placeholder="I love dogs and drawing…"
                          />
                          <div className="examples">
                            {examples.map((example) => (
                              <button
                                disabled={busy}
                                key={example}
                                onClick={() =>
                                  update({ originalIdea: example })
                                }
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                          <div className="idea-promise">
                            <span>✦ Explore possibilities</span>
                            <span>↗ Make your own choices</span>
                            <span>◎ Create something real</span>
                          </div>
                        </>
                      ) : step === 5 ? (
                        <BrandStep
                          business={business}
                          update={update}
                          choices={currentChoices}
                          busy={busy}
                          generate={logo}
                          refresh={() => coach("imagery", business, true)}
                        />
                      ) : step === 8 ? (
                        <>
                          <div className="launch-card">
                            <span className="eyebrow">THIS WEEK</span>
                            {business.launchPlan.length ? (
                              <ol>
                                {business.launchPlan.map((item, i) => (
                                  <li key={i}>
                                    <span>{i + 1}</span>
                                    <input
                                      aria-label={`Launch action ${i + 1}`}
                                      value={item}
                                      disabled={busy}
                                      maxLength={240}
                                      onChange={(e) => {
                                        const plan = [...business.launchPlan];
                                        plan[i] = e.target.value;
                                        update({ launchPlan: plan });
                                      }}
                                    />
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p>
                                Your plan will appear here. Ask the coach, or
                                write your own next steps below.
                              </p>
                            )}
                          </div>
                          <button
                            className="quiet-button refresh"
                            disabled={busy}
                            onClick={() => coach("launch", business, true)}
                          >
                            ↻{" "}
                            {business.launchPlan.length
                              ? "Rethink my plan"
                              : "Create my launch plan"}
                          </button>
                          <label className="input-label" htmlFor="own-plan">
                            Or write your own plan (one action per line).
                          </label>
                          <textarea
                            id="own-plan"
                            rows={4}
                            disabled={busy}
                            maxLength={1440}
                            value={business.launchPlan.join("\n")}
                            onChange={(e) =>
                              update({
                                launchPlan: e.target.value
                                  .split("\n")
                                  .slice(0, 6),
                              })
                            }
                          />
                        </>
                      ) : (
                        <>
                          <ChoicePicker
                            field={fields[step]}
                            business={business}
                            choices={currentChoices}
                            update={update}
                            busy={busy}
                            onRefresh={() =>
                              coach(fields[step], business, true)
                            }
                            label={
                              step === 4
                                ? "My own business name"
                                : "My own idea"
                            }
                          />
                          {step === 4 && business.name && (
                            <div className="name-spotlight">
                              <span className="eyebrow">INTRODUCING</span>
                              <h2>{business.name}</h2>
                            </div>
                          )}
                          {step === 7 && business.firstCustomer.trim() && (
                            <section className="marketing-section">
                              <h2 className="subheading">
                                How could you tell them about it?
                              </h2>
                              <ChoicePicker
                                field="marketingIdea"
                                business={business}
                                choices={
                                  choices.marketingIdea?.signature ===
                                  signature("marketingIdea", business)
                                    ? choices.marketingIdea.choices
                                    : []
                                }
                                update={update}
                                busy={busy}
                                onRefresh={() =>
                                  coach("marketingIdea", business, true)
                                }
                                label="My own way to spread the word"
                              />
                            </section>
                          )}
                        </>
                      )}
                      {step !== 5 && (
                        <CoachTip>
                          {current?.signature ===
                            signature(fields[step], business) && current.tip
                            ? current.tip
                            : tips[step]}
                        </CoachTip>
                      )}
                      {step === 6 && (
                        <p className="parent-note">
                          Ask a parent or guardian to help before spending
                          money, taking payments, creating accounts, selling to
                          people you don&apos;t know, or handling taxes.
                        </p>
                      )}
                      <div className="wizard-navigation">
                        <button
                          className="secondary-button"
                          disabled={busy || step === 0}
                          onClick={() => navigate(step - 1)}
                        >
                          ← Back
                        </button>
                        <span className="saved-hint">
                          You decide. AI helps.
                        </span>
                        <button
                          className="primary-button"
                          disabled={busy || !valid()}
                          onClick={next}
                        >
                          {step === 0
                            ? "Let's build something →"
                            : step === 8
                              ? "See My Blueprint →"
                              : "Continue →"}
                        </button>
                      </div>
                    </section>
                  ) : view === "blueprint" ? (
                    <Blueprint
                      business={business}
                      edit={navigate}
                      build={() => website()}
                      busy={busy}
                      hasWebsite={Boolean(business.website)}
                    />
                  ) : business.website ? (
                    <WebsitePreview
                      business={business}
                      update={update}
                      busy={busy}
                      revise={(instruction) => website(instruction, true)}
                      back={() => setView("blueprint")}
                    />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            )}
            {loading && <Loading label={loading} />}
            <div aria-live="polite">
              {error && (
                <div
                  className="error-message"
                  role="alert"
                  ref={errorPanel}
                  tabIndex={-1}
                >
                  <strong>The coach hit a little bump.</strong>
                  <p>{error}</p>
                  <button className="quiet-button" onClick={() => setError("")}>
                    Dismiss
                  </button>
                </div>
              )}
              {storageWarning && (
                <p className="storage-warning">{storageWarning}</p>
              )}
            </div>
          </div>
          <footer className="studio-footer">
            <strong>Big ideas start small.</strong>
            <p>Built by you. Encouraged by Business Kids.</p>
            <small>
              Explore with a parent or guardian. Ask for their help before
              spending, selling, creating accounts, or publishing a website.
            </small>
          </footer>
        </div>
      </main>
    </>
  );
}
