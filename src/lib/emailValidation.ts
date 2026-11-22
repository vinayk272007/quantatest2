// Screens Gmail addresses used for email + password sign-up/sign-in.
// Gmail itself only allows 6–30 letters, digits and single dots, so anything outside that is fake.
// On top of that we reject patterns typical of throwaway / fraud accounts.
// Keep the core checks in sync with validPasswordEmail() in firestore.rules.

const BLOCKED_SUBSTRINGS = [
  'tempmail', 'tmpmail', 'throwaway', 'disposable', 'burner', 'fakemail', 'fakeemail',
  'spam', 'trashmail', 'junkmail', 'mailinator', '10minute', 'guerrilla', 'yopmail',
  'noreply', 'donotreply', 'asdf', 'qwerty', 'zxcvb', 'abcdef', '1234567',
];

const BLOCKED_PREFIX = /^(test|temp|tmp|fake|dummy|demo|sample|xyz)/;

export type GmailCheck = { ok: true; email: string } | { ok: false; reason: string };

export function checkGmail(raw: string): GmailCheck {
  const email = raw.trim().toLowerCase();
  const fake = { ok: false as const, reason: 'This email looks temporary or invalid. Please use your real Gmail address.' };

  if (!email.endsWith('@gmail.com')) {
    return { ok: false, reason: 'Please use your Gmail address (ending in @gmail.com).' };
  }
  const local = email.slice(0, -'@gmail.com'.length);

  if (local.includes('+')) {
    return { ok: false, reason: 'Gmail aliases with "+" are not allowed. Use your main Gmail address.' };
  }
  // Gmail format: letters/digits/dots, no leading/trailing/double dots, 6–30 chars ignoring dots.
  if (!/^[a-z0-9](\.?[a-z0-9])*$/.test(local)) return fake;
  const compact = local.replace(/\./g, '');
  if (compact.length < 6 || compact.length > 30) return fake;

  const letters = compact.replace(/[^a-z]/g, '');
  if (letters.length < 2) return fake; // mostly/all digits
  if (/\d{9,}/.test(compact)) return fake; // long phone-number / random digit runs
  if (/(.)\1{3,}/.test(compact)) return fake; // aaaa, 1111
  if (letters.length >= 8 && !/[aeiouy]/.test(letters)) return fake; // keyboard mash like "xkjqzvbn"
  if (BLOCKED_PREFIX.test(compact)) return fake;
  if (BLOCKED_SUBSTRINGS.some((word) => compact.includes(word))) return fake;

  return { ok: true, email };
}
