import { AxiosError } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const message =
      error.response?.data?.message || error.message || 'An error occurred';
    const code = error.response?.data?.code || error.code;

    // Handle specific error codes
    switch (statusCode) {
      case 400:
        return new ApiError('Invalid request', statusCode, code);
      case 401:
        return new ApiError('Unauthorized', statusCode, code);
      case 403:
        return new ApiError('Forbidden', statusCode, code);
      case 404:
        return new ApiError('Resource not found', statusCode, code);
      case 429:
        return new ApiError('Too many requests', statusCode, code);
      case 500:
        return new ApiError('Server error', statusCode, code);
      default:
        return new ApiError(message, statusCode, code);
    }
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unknown error occurred');
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !error.response && !!error.request;
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  return false;
};
