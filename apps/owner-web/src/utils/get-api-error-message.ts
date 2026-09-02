import axios from "axios";

import type { ApiErrorResponse } from "@/src/types/api";

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? error.message;
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}
