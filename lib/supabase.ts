import { createClient } from "@supabase/supabase-js"

/**
 * Browser/anon Supabase client (safe to use client-side).
 * Uses the public anon key + RLS for tenant isolation.
 */
export function createBrowserClient() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
	)
}

/**
 * Server client using the anon key (RLS-enforced). For privileged jobs that
 * must bypass RLS, use the service-role data access in lib/db.ts instead
 * (server-only).
 */
export function createServerClient() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
		{ auth: { persistSession: false } },
	)
}
