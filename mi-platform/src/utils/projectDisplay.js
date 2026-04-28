export function formatProjectDisplayName(rawName) {
  const s = String(rawName ?? '').trim()
  const dash = s.indexOf('-')
  if (dash === -1) return s
  return s.slice(dash + 1).trimStart()
}

