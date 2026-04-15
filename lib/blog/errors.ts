// Map of blog-related table names → migration file that creates them.
// Used by describeDbError() below to tell the admin exactly which
// migration file to apply when a query hits a missing table.
const MIGRATION_FOR_TABLE: Record<string, string> = {
  blog_posts: '022_blog_posts.sql',
  blog_categories: '023_blog_categories.sql',
}

/**
 * Convert a Supabase/PostgREST error into a Vietnamese message suitable
 * for surfacing in an admin ActionResult or a page-level error card.
 *
 * Specifically detects the "schema cache missing table" error that
 * fires when a migration hasn't been applied yet, and tells the admin
 * exactly which migration file to run instead of returning a raw
 * PostgREST code.
 */
export function describeDbError(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as { code?: string; message?: string }
    const msg = err.message ?? ''

    const missingTable =
      err.code === 'PGRST205' ||
      err.code === '42P01' ||
      msg.includes('Could not find the table')

    if (missingTable) {
      // Supabase error messages usually read
      //   "Could not find the table 'public.<name>' in the schema cache"
      const match = msg.match(/['"]public\.([a-z0-9_]+)['"]/)
      const table = match?.[1]
      const migration = table ? MIGRATION_FOR_TABLE[table] : undefined
      if (table && migration) {
        return `Database chưa sẵn sàng: bảng ${table} chưa tồn tại. Hãy apply migration ${migration} qua Supabase SQL Editor.`
      }
      if (table) {
        return `Database chưa sẵn sàng: bảng ${table} chưa tồn tại. Hãy apply migration mới nhất qua Supabase SQL Editor.`
      }
      return 'Database chưa sẵn sàng: một bảng chưa tồn tại. Hãy apply các migration mới nhất qua Supabase SQL Editor.'
    }

    if (err.message) return err.message
  }
  return 'Lỗi không xác định'
}

/**
 * True when the error is a "table missing from schema cache" error.
 * Useful for page-level catch blocks that want to show a dedicated
 * error card instead of falling through to generic handling.
 */
export function isMissingTableError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as { code?: string; message?: string }
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    (err.message?.includes('Could not find the table') ?? false)
  )
}
