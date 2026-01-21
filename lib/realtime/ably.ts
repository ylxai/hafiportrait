import Ably from 'ably'

let ablyRest: Ably.Rest | null = null

export function getAblyRest(): Ably.Rest {
  if (ablyRest) return ablyRest

  const key = process.env.ABLY_API_KEY
  if (!key) {
    throw new Error('ABLY_API_KEY is not configured')
  }

  ablyRest = new Ably.Rest({ key })
  return ablyRest
}

export async function publishToEventChannel(eventSlug: string, name: string, data: unknown) {
  const ably = getAblyRest()
  const channelName = `event:${eventSlug}`
  const channel = ably.channels.get(channelName)
  await channel.publish(name, data)
}
