const UTC_TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

const localTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const fullLocalTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

export function parseConversationUtcTimestamp(timestamp: string) {
  const trimmed = timestamp.trim();
  const timeMatch = UTC_TIME_PATTERN.exec(trimmed);

  if (timeMatch) {
    const [, hour = '0', minute = '0', second = '0'] = timeMatch;

    return new Date(Date.UTC(2024, 0, 1, Number(hour), Number(minute), Number(second)));
  }

  const parsed = Date.parse(trimmed);

  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function formatConversationTimestamp(timestamp?: string) {
  if (!timestamp) return null;

  const date = parseConversationUtcTimestamp(timestamp);

  return date ? localTimeFormatter.format(date) : timestamp;
}

export function formatConversationTimestampTitle(timestamp?: string) {
  if (!timestamp) return null;

  const date = parseConversationUtcTimestamp(timestamp);

  return date ? fullLocalTimeFormatter.format(date) : timestamp;
}
