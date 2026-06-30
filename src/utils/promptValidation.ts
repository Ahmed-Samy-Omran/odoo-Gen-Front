const TRIVIAL_MESSAGE =
  /^(ok|okay|yes|no|thanks|thank you|yep|yeah|sure|done|hi|hello|hey|ايوه|اه|ايه|ايك|تمام|ماشي|شكرا|شكراً|نعم|لا|حاضر|طيب|مرحبا|هاي)$/i;

const MIN_REQUIREMENTS_LENGTH = 20;

export function isTrivialMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 4) return true;
  return TRIVIAL_MESSAGE.test(trimmed);
}

export function hasEnoughRequirements(messages: string[]): boolean {
  const combined = messages.join('\n').trim();
  if (combined.length < MIN_REQUIREMENTS_LENGTH) return false;
  return messages.some((message) => !isTrivialMessage(message));
}

export function deriveModuleName(description: string): string {
  const meaningfulLine =
    description
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length >= 8 && !isTrivialMessage(line)) ||
    description.trim();

  const slug = meaningfulLine
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join('_');

  return slug || 'odoo_module';
}
