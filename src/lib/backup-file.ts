"use client";

// Saves the shop's backup JSON to the user's device on logout.
//
// On Chrome/Edge the File System Access API lets the user pick a save
// location ONCE; the file handle is kept in IndexedDB and every later
// logout silently overwrites that same file with fresh data. Browsers
// without the API (Firefox/Safari) get a normal download with a fixed
// filename instead.

export type BackupSaveResult = "saved" | "downloaded" | "cancelled" | "failed";

const IDB_NAME = "plastio-backup";
const IDB_STORE = "file-handles";

// Minimal typings — showSaveFilePicker/requestPermission aren't in lib.dom.
type PermissionState2 = "granted" | "denied" | "prompt";
interface SavableFileHandle {
  requestPermission(options: { mode: "readwrite" }): Promise<PermissionState2>;
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }>;
}
declare global {
  interface Window {
    showSaveFilePicker?(options: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }): Promise<SavableFileHandle>;
  }
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "shop"
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredHandle(key: string): Promise<SavableFileHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const request = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(key);
      request.onsuccess = () => resolve((request.result as SavableFileHandle) ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function storeHandle(key: string, handle: SavableFileHandle): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(handle, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Non-fatal: the user will just be asked to pick the file again next time.
  }
}

export async function saveBackupToDevice(shopName: string): Promise<BackupSaveResult> {
  const slug = slugify(shopName);
  const fileName = `plastio-backup-${slug}.json`;

  // Resolve the file handle FIRST — pickers and permission prompts need the
  // click's user activation, which fetch() below would burn time against.
  let handle: SavableFileHandle | null = null;
  if (typeof window.showSaveFilePicker === "function") {
    handle = await getStoredHandle(slug);
    if (handle) {
      try {
        if ((await handle.requestPermission({ mode: "readwrite" })) !== "granted") {
          handle = null;
        }
      } catch {
        handle = null;
      }
    }
    if (!handle) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: "Click One backup", accept: { "application/json": [".json"] } }],
        });
        await storeHandle(slug, handle);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return "cancelled";
        }
        handle = null; // API blocked (e.g. iframe) — fall back to a download.
      }
    }
  }

  let blob: Blob;
  try {
    const response = await fetch("/api/backup", { cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.includes("json")) {
      return "failed";
    }
    blob = await response.blob();
  } catch {
    return "failed";
  }

  if (handle) {
    try {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    } catch {
      return "failed";
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
