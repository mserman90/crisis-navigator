// Server-side auth helper that returns an authenticated Supabase client or
// throws a plain Error (NOT a Response). Throwing a Response from middleware
// causes TanStack Start to surface "[object Response]" runtime errors that
// escape client try/catch and trigger blank-screen error overlays.
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export class AuthRequiredError extends Error {
  code = "AUTH_REQUIRED" as const;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export async function getAuthedSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Server misconfigured: Supabase env missing");
  }

  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthRequiredError();
  }
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new AuthRequiredError();

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new AuthRequiredError();

  return { supabase, userId: data.claims.sub as string };
}
