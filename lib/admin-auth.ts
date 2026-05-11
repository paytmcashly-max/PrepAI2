export function getAdminEmails() {
  const emailValues = [
    process.env.ADMIN_EMAILS || '',
    process.env.PYQ_ADMIN_EMAILS || '',
  ]

  return [
    ...new Set(
      emailValues
        .flatMap((value) => value.split(','))
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    ),
  ]
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false
  return getAdminEmails().includes(email.trim().toLowerCase())
}
