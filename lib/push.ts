import webpush from 'web-push'

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: { title: string; body: string; icon?: string }
): Promise<void> {
  initWebPush()
  await webpush.sendNotification(
    subscription as webpush.PushSubscription,
    JSON.stringify(payload)
  )
}
