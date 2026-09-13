export const COOKIE_NOTICE_KEY = 'nora-cookie-notice-v1';
export const COOKIE_NOTICE_EVENT = 'nora-cookie-notice';
export const COOKIE_NOTICE_ACCEPTED = 'accepted';

export function readCookieNoticeAccepted(): boolean {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === COOKIE_NOTICE_ACCEPTED;
  } catch {
    return false;
  }
}

export function writeCookieNoticeAccepted(): void {
  try {
    localStorage.setItem(COOKIE_NOTICE_KEY, COOKIE_NOTICE_ACCEPTED);
  } catch {
    /* private mode / blocked storage */
  }
  window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT));
}
