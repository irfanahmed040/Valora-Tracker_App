// The single account allowed to access the admin console.
export const ADMIN_EMAIL = 'admin@gmail.com'

export function isAdminEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
