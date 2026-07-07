const SESSION_KEY = "cfs_session_id";

/** Returns a stable session UUID for this browser, creating one on first call. */
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
