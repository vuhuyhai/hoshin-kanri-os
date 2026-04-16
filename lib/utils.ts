import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Json } from '@/lib/supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Cast a typed object to Supabase's Json type for JSONB column inserts/updates. */
export function toJson<T>(value: T): Json {
  return value as unknown as Json
}

/** Cast a Supabase Json column value back to a known TypeScript type. */
export function fromJson<T>(value: Json | null | undefined): T {
  return value as unknown as T
}
