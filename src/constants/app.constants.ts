
export const DEFAULT_MAX_RETRIES = 3;

export const DEFAULT_BACKOFF_BASE_DELAY = 1000;

export const DEFAULT_BACKOFF_MAX_DELAY = 10000;

export const DEFAULT_TIMEOUT = 30000;

export const getDefaultWorkdir = (): string => process.cwd();
