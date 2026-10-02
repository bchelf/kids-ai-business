const KEY = "business-kids-project-v1";
export function createProjectId() {
  return crypto.randomUUID();
}
function summary(value) {
  const b = value.business || {};
  return {
    id: value.id,
    name: typeof b.name === "string" ? b.name.slice(0, 500) : "",
    originalIdea:
      typeof b.originalIdea === "string" ? b.originalIdea.slice(0, 500) : "",
    product: typeof b.product === "string" ? b.product.slice(0, 500) : "",
    step: value.step,
    view: value.view,
    savedAt: value.savedAt,
    createdAt: value.createdAt,
  };
}
function hasIdea(value) {
  return ["originalIdea", "name", "customer", "product"].some(
    (key) =>
      typeof value.business?.[key] === "string" && value.business[key].trim(),
  );
}
function database() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(KEY, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("projects"))
        db.createObjectStore("projects");
      db.createObjectStore("summaries");
      db.createObjectStore("metadata");
      // Move the previous single-project save into the library atomically.
      const projects = req.transaction.objectStore("projects");
      const old = projects.get("current");
      old.onsuccess = () => {
        if (old.result && hasIdea(old.result)) {
          const value = {
            ...old.result,
            id: createProjectId(),
            createdAt: old.result.savedAt || Date.now(),
            savedAt: old.result.savedAt || Date.now(),
          };
          projects.put(value, value.id);
          req.transaction
            .objectStore("summaries")
            .put(summary(value), value.id);
          req.transaction.objectStore("metadata").put(value.id, "active");
        }
        projects.delete("current");
      };
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(
        new Error(
          "Close other Business Kids tabs so this browser can update your idea library.",
        ),
      );
  });
}
let writeQueue = Promise.resolve();
function queueWrite(work) {
  const task = writeQueue.catch(() => {}).then(work);
  writeQueue = task;
  return task;
}
async function transaction(mode, work) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["projects", "summaries", "metadata"], mode);
    let result;
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Project storage was interrupted."));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Project storage failed."));
    };
    try {
      work(tx, (value) => {
        result = value;
      });
    } catch (error) {
      tx.abort();
      db.close();
      reject(error);
    }
  });
}
export async function loadProject(id) {
  await writeQueue.catch(() => {});
  return transaction("readonly", (tx, done) => {
    const projects = tx.objectStore("projects");
    const read = (key) => {
      if (!key) return;
      const req = projects.get(key);
      req.onsuccess = () => done(req.result);
    };
    if (id) read(id);
    else {
      const req = tx.objectStore("metadata").get("active");
      req.onsuccess = () => read(req.result);
    }
  });
}
export async function listProjects() {
  await writeQueue.catch(() => {});
  return transaction("readonly", (tx, done) => {
    const req = tx.objectStore("summaries").getAll();
    req.onsuccess = () =>
      done(req.result.sort((a, b) => b.savedAt - a.savedAt));
  });
}
export function saveProject(value) {
  if (!value?.id)
    return Promise.reject(new Error("This idea needs a project ID."));
  const savedAt = Date.now();
  return queueWrite(() =>
    transaction("readwrite", (tx, done) => {
      const projects = tx.objectStore("projects");
      const summaries = tx.objectStore("summaries");
      const metadata = tx.objectStore("metadata");
      if (!hasIdea(value)) {
        projects.delete(value.id);
        summaries.delete(value.id);
        metadata.delete("active");
        done(savedAt);
        return;
      }
      const old = projects.get(value.id);
      old.onsuccess = () => {
        const project = {
          ...value,
          savedAt,
          createdAt: old.result?.createdAt || savedAt,
        };
        projects.put(project, value.id);
        summaries.put(summary(project), value.id);
        metadata.put(value.id, "active");
        done(savedAt);
      };
    }),
  );
}
export function deleteProject(id) {
  return queueWrite(() =>
    transaction("readwrite", (tx) => {
      tx.objectStore("projects").delete(id);
      tx.objectStore("summaries").delete(id);
      const metadata = tx.objectStore("metadata");
      const req = metadata.get("active");
      req.onsuccess = () => {
        if (req.result === id) metadata.delete("active");
      };
    }),
  );
}
