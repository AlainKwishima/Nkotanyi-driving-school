export type ApiErrorBody = {
  status?: number;
  message?: string;
  error?: string;
  data?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload?: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export type StandardResponse<T> = {
  status: number;
  message?: string;
  data?: T;
  error?: string;
};
