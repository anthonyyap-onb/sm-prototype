import type { UIMessage } from 'ai';

export const CHAT_HISTORY_STORAGE_KEY = 'sm-markets-agent-chat-history';
export const CHAT_HISTORY_VERSION = 1 as const;
export const DEFAULT_HISTORY_LIMIT = 10;
export const MAX_HISTORY_LIMIT = 50;
export type ChatPageContext = 'shopping' | 'checkout';

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  createdAt: string;
  parts: UIMessage['parts'];
}

export interface StoredToolCall {
  id: string;
  tool: string;
  arguments: unknown;
  createdAt: string;
  pageContext: ChatPageContext;
}

export interface StoredChatSession {
  version: typeof CHAT_HISTORY_VERSION;
  messages: StoredChatMessage[];
  toolCalls: StoredToolCall[];
}

const emptySession = (): StoredChatSession => ({
  version: CHAT_HISTORY_VERSION,
  messages: [],
  toolCalls: [],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasDefined(value: Record<string, unknown>, key: string): boolean {
  return hasOwn(value, key) && value[key] !== undefined;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isToolApproval(value: unknown, approved?: boolean): boolean {
  if (!isRecord(value) || !isNonEmptyString(value.id) || (approved !== undefined && value.approved !== approved)) return false;
  return isOptionalString(value.reason) && (value.isAutomatic === undefined || typeof value.isAutomatic === 'boolean') && isOptionalString(value.signature);
}

function isToolPart(value: Record<string, unknown>, dynamic: boolean): boolean {
  if (!isNonEmptyString(value.toolCallId) || (dynamic && !isNonEmptyString(value.toolName)) || typeof value.state !== 'string') return false;
  if (hasDefined(value, 'input') && !isJsonValue(value.input)) return false;
  if (hasDefined(value, 'output') && !isJsonValue(value.output)) return false;

  switch (value.state) {
    case 'input-streaming':
      return !hasDefined(value, 'output') && !hasDefined(value, 'errorText') && !hasDefined(value, 'approval');
    case 'input-available':
      return hasOwn(value, 'input') && isJsonValue(value.input) && !hasDefined(value, 'output') && !hasDefined(value, 'errorText') && !hasDefined(value, 'approval');
    case 'approval-requested':
      return hasOwn(value, 'input') && isJsonValue(value.input) && isToolApproval(value.approval) && !hasOwn(value.approval as Record<string, unknown>, 'approved') && !hasDefined(value, 'output') && !hasDefined(value, 'errorText');
    case 'approval-responded':
      return hasOwn(value, 'input') && isJsonValue(value.input) && isToolApproval(value.approval) && typeof (value.approval as Record<string, unknown>).approved === 'boolean' && !hasDefined(value, 'output') && !hasDefined(value, 'errorText');
    case 'output-available':
      return hasOwn(value, 'input') && isJsonValue(value.input) && hasOwn(value, 'output') && isJsonValue(value.output) && !hasDefined(value, 'errorText') && (!hasDefined(value, 'approval') || isToolApproval(value.approval, true));
    case 'output-error':
      return typeof value.errorText === 'string' && !hasDefined(value, 'output') && (!hasDefined(value, 'approval') || isToolApproval(value.approval, true));
    case 'output-denied':
      return hasOwn(value, 'input') && isJsonValue(value.input) && isToolApproval(value.approval, false) && !hasDefined(value, 'output') && !hasDefined(value, 'errorText');
    default:
      return false;
  }
}

function isPart(value: unknown): boolean {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  switch (value.type) {
    case 'text':
    case 'reasoning':
      return typeof value.text === 'string' && (value.state === undefined || value.state === 'streaming' || value.state === 'done');
    case 'custom':
      return typeof value.kind === 'string' && /^[^.]+\.[^.]+$/.test(value.kind);
    case 'source-url':
      return isNonEmptyString(value.sourceId) && isNonEmptyString(value.url) && isOptionalString(value.title);
    case 'source-document':
      return isNonEmptyString(value.sourceId) && isNonEmptyString(value.mediaType) && isNonEmptyString(value.title) && isOptionalString(value.filename);
    case 'file':
    case 'reasoning-file':
      return isNonEmptyString(value.mediaType) && isNonEmptyString(value.url) && (value.type === 'reasoning-file' || isOptionalString(value.filename));
    case 'step-start':
      return true;
    case 'dynamic-tool':
      return isToolPart(value, true);
    default:
      if (value.type.startsWith('tool-') && value.type.length > 'tool-'.length) return isToolPart(value, false);
      if (value.type.startsWith('data-') && value.type.length > 'data-'.length) return hasOwn(value, 'data') && isJsonValue(value.data) && (value.id === undefined || isNonEmptyString(value.id));
      return false;
  }
}

function isParts(value: unknown): value is UIMessage['parts'] {
  return Array.isArray(value) && value.every(isPart);
}

function isJsonValue(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  if (Array.isArray(value)) {
    seen.add(value);
    const valid = value.every((item) => isJsonValue(item, seen));
    seen.delete(value);
    return valid;
  }
  if (!isPlainObject(value)) return false;
  seen.add(value);
  const valid = Object.values(value).every((item) => isJsonValue(item, seen));
  seen.delete(value);
  return valid;
}

function toStoredMessage(value: unknown): StoredChatMessage | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isIsoTime(value.createdAt) || !isParts(value.parts)) return null;
  if (value.role !== 'user' && value.role !== 'assistant') return null;
  return { id: value.id, role: value.role, createdAt: value.createdAt, parts: value.parts };
}

function toStoredToolCall(value: unknown): StoredToolCall | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.tool) || !isIsoTime(value.createdAt)) return null;
  if (value.pageContext !== 'shopping' && value.pageContext !== 'checkout') return null;
  if (!isJsonValue(value.arguments)) return null;
  return {
    id: value.id,
    tool: value.tool,
    arguments: value.arguments,
    createdAt: value.createdAt,
    pageContext: value.pageContext,
  };
}

function sortByTimeThenId<T extends { id: string; createdAt: string }>(records: T[]): T[] {
  return records.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id.localeCompare(right.id));
}

export function normalizeHistoryLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_HISTORY_LIMIT;
  const normalized = Math.floor(value);
  if (normalized <= 0) return DEFAULT_HISTORY_LIMIT;
  return Math.min(normalized, MAX_HISTORY_LIMIT);
}

function formatArgumentScalar(value: null | boolean | number | string): string {
  if (typeof value !== 'string') return String(value);
  if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(value) && value !== 'true' && value !== 'false' && value !== 'null') return value;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatArgumentValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatArgumentValue).join(',');
  return formatArgumentScalar(value as null | boolean | number | string);
}

function flattenToolArguments(value: unknown, prefix = ''): string[] {
  if (isRecord(value)) {
    return Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .flatMap(([key, nested]) => flattenToolArguments(nested, prefix ? `${prefix}.${key}` : key));
  }
  if (Array.isArray(value) && value.some((item) => isRecord(item) || Array.isArray(item))) {
    return value.flatMap((item, index) => flattenToolArguments(item, `${prefix}.${index}`));
  }
  if (!prefix) return [];
  return [`${prefix}=${formatArgumentValue(value)}`];
}

function formatMessage(message: StoredChatMessage): string {
  const text = message.parts
    .flatMap((part) => {
      const candidate = part as unknown;
      return isRecord(candidate) && candidate.type === 'text' && typeof candidate.text === 'string'
        ? [candidate.text.replace(/\s+/g, ' ').trim()]
        : [];
    })
    .filter(Boolean)
    .join(' ');
  return `${message.createdAt} ${message.role === 'user' ? 'U' : 'A'}: ${text || '[non-text message]'}`;
}

function formatToolCall(toolCall: StoredToolCall): string {
  const argumentsText = flattenToolArguments(toolCall.arguments).join(' ');
  return `${toolCall.createdAt} T:${toolCall.tool}${argumentsText ? ` ${argumentsText}` : ''}`;
}

function capHistoryLine(line: string): string {
  const oneLine = line.replace(/\s+/g, ' ').trim();
  return oneLine.length <= 500 ? oneLine : `${oneLine.slice(0, 499)}…`;
}

export function formatRecentHistory(session: StoredChatSession, limit?: unknown): string {
  const timeline = sortByTimeThenId([
    ...session.messages.map((message) => ({ kind: 'message' as const, ...message })),
    ...session.toolCalls.map((toolCall) => ({ kind: 'tool' as const, ...toolCall })),
  ]).slice(-normalizeHistoryLimit(limit));

  if (timeline.length === 0) return 'No chat or tool history is available for this session.';
  return timeline
    .map((entry) => capHistoryLine(entry.kind === 'message' ? formatMessage(entry) : formatToolCall(entry)))
    .join('\n');
}

function normalizeSession(input: unknown): StoredChatSession {
  if (!isRecord(input) || input.version !== CHAT_HISTORY_VERSION || !Array.isArray(input.messages) || !Array.isArray(input.toolCalls)) {
    return emptySession();
  }

  const messages = new Map<string, StoredChatMessage>();
  for (const value of input.messages) {
    const message = toStoredMessage(value);
    if (message && !messages.has(message.id)) messages.set(message.id, message);
  }
  const toolCalls = new Map<string, StoredToolCall>();
  for (const value of input.toolCalls) {
    const toolCall = toStoredToolCall(value);
    if (toolCall && !toolCalls.has(toolCall.id)) toolCalls.set(toolCall.id, toolCall);
  }

  return {
    version: CHAT_HISTORY_VERSION,
    messages: sortByTimeThenId([...messages.values()]),
    toolCalls: sortByTimeThenId([...toolCalls.values()]),
  };
}

export function parseStoredChatSession(value: string | null): StoredChatSession {
  if (value === null) return emptySession();
  try {
    return normalizeSession(JSON.parse(value));
  } catch {
    return emptySession();
  }
}

function defaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readChatSession(storage = defaultStorage()): StoredChatSession {
  if (!storage) return emptySession();
  try {
    return parseStoredChatSession(storage.getItem(CHAT_HISTORY_STORAGE_KEY));
  } catch {
    return emptySession();
  }
}

export function writeChatSession(session: StoredChatSession, storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(normalizeSession(session)));
    return true;
  } catch {
    return false;
  }
}

export function getInitialChatMessages(session: StoredChatSession, welcomeText: string): UIMessage[] {
  const normalized = normalizeSession(session);
  if (normalized.messages.length === 0) {
    return [{
      id: 'welcome-message',
      role: 'assistant',
      parts: [{ type: 'text', text: welcomeText }],
    }];
  }

  return normalized.messages.map(({ id, role, parts }) => ({ id, role, parts }));
}

export function selectChatSessionForRetrieval(
  currentSession: StoredChatSession | null,
  readPersistedSession: () => StoredChatSession,
): StoredChatSession {
  return currentSession ?? readPersistedSession();
}

export function mergePersistedMessages(
  session: StoredChatSession,
  messages: UIMessage[],
  now: () => Date = () => new Date(),
): StoredChatSession {
  const normalized = normalizeSession(session);
  const merged = new Map(normalized.messages.map((message) => [message.id, message]));
  const incomingIds = new Set<string>();

  for (const message of messages) {
    if (incomingIds.has(message.id) || (message.role !== 'user' && message.role !== 'assistant') || !isNonEmptyString(message.id) || !isParts(message.parts)) continue;
    incomingIds.add(message.id);
    const existing = merged.get(message.id);
    merged.set(message.id, {
      id: message.id,
      role: message.role,
      createdAt: existing?.createdAt ?? now().toISOString(),
      parts: message.parts,
    });
  }

  return {
    ...normalized,
    messages: sortByTimeThenId([...merged.values()]),
  };
}

export function appendToolCall(session: StoredChatSession, record: StoredToolCall): StoredChatSession {
  const normalized = normalizeSession(session);
  const toolCall = toStoredToolCall(record);
  if (!toolCall || normalized.toolCalls.some(({ id }) => id === toolCall.id)) return normalized;
  return {
    ...normalized,
    toolCalls: sortByTimeThenId([...normalized.toolCalls, toolCall]),
  };
}
