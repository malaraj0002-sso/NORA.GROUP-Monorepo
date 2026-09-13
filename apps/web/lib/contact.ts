import { CONTACT_DEFAULTS } from '@/lib/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Build a WhatsApp deep link. Number must be digits only (no +). */
export function getWhatsAppLink(
  e164Digits: string = CONTACT_DEFAULTS.whatsappE164,
  message?: string,
): string {
  const digits = String(e164Digits ?? '').replace(/[^0-9]/g, '').slice(0, 16);
  const safeDigits = digits || CONTACT_DEFAULTS.whatsappE164;
  const text = encodeURIComponent(
    (message || 'שלום Nora Group, אשמח לשמוע פרטים על פרויקט.').slice(0, 500),
  );
  return `https://wa.me/${safeDigits}?text=${text}`;
}

export function getTelLink(phoneTel: string = CONTACT_DEFAULTS.phoneTel): string {
  const cleaned = String(phoneTel ?? '').replace(/[^\d+]/g, '').slice(0, 20);
  return `tel:${cleaned || CONTACT_DEFAULTS.phoneTel}`;
}

export function getMailtoLink(email: string = CONTACT_DEFAULTS.email): string {
  const candidate = String(email ?? '').trim().slice(0, 120);
  const safe = EMAIL_RE.test(candidate) ? candidate : CONTACT_DEFAULTS.email;
  return `mailto:${safe}`;
}
