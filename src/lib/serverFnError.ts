// Helper to extract a user-facing message from errors thrown by server functions.
// TanStack Start middleware (e.g. requireSupabaseAuth) throws raw Response
// objects. Without this helper they stringify to "[object Response]" and can
// crash error boundaries. We turn 401s into a "sign in required" message.

export async function getServerFnErrorMessage(
  err: unknown,
  fallback: string,
  signInRequired: string,
): Promise<string> {
  if (err instanceof Response) {
    if (err.status === 401) return signInRequired;
    try {
      const text = await err.clone().text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
