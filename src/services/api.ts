export type InviteConfig = {
  eventTitle?: string
  eventDate?: string
  venueName?: string
  address?: string
  bannerImage?: string
  bannerHeight?: number
  bannerObjectFit?: 'cover' | 'contain'
  schedule?: { time: string; title: string; desc?: string }[]
  youtubeUrl?: string
  musicVolume?: number
}

export async function apiGetInviteConfig(): Promise<InviteConfig> {
  const res = await fetch('/api/invite-config')
  if (!res.ok) throw new Error('Failed to load invite config')
  return res.json()
}

export async function apiSaveInviteConfig(data: InviteConfig): Promise<void> {
  const res = await fetch('/api/invite-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save invite config')
}

export type RSVPRecord = Record<string, any>

export async function apiGetRSVPs(): Promise<RSVPRecord> {
  const res = await fetch('/api/rsvps')
  if (!res.ok) throw new Error('Failed to load RSVPs')
  return res.json()
}

export async function apiGetRSVP(userId: string): Promise<any | null> {
  const res = await fetch(`/api/rsvps/${encodeURIComponent(userId)}`)
  if (!res.ok) return null
  return res.json()
}

export async function apiPostRSVP(userId: string, data: any): Promise<void> {
  const res = await fetch('/api/rsvps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, data }),
  })
  if (!res.ok) throw new Error('Failed to save RSVP')
}


