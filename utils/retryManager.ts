interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  delays?: number[]; // Custom delays for each retry attempt (e.g., [5000, 15000])
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retries a promise-returning function with custom or exponential backoff
 * If delays array is provided, uses those exact delays for each retry
 * Otherwise falls back to exponential backoff based on baseDelay
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 2000, delays, onRetry } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If this is a retry (attempt > 0), notify and wait
      if (attempt > 0) {
        if (onRetry) {
          onRetry(attempt, lastError);
        }

        // Use custom delays if provided, otherwise exponential backoff
        const delay = delays
          ? delays[attempt - 1] || delays[delays.length - 1] // Use last delay if array is shorter
          : baseDelay * Math.pow(2, attempt - 1);

        console.log(
          `[RetryManager] Retry attempt ${attempt}/${maxRetries} waiting ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`[RetryManager] Attempt ${attempt + 1} failed:`, error);

      // If we've exhausted retries, throw the last error
      if (attempt === maxRetries) {
        console.error("[RetryManager] All retries exhausted");
        throw error;
      }
    }
  }

  // Should not be reached due to throw above, but typescript needs it
  throw lastError;
}
