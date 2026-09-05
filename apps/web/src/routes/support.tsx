import { LegalPage } from "@/components/legal-page"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [{ title: "Support — pumpr." }],
  }),
})

function SupportPage() {
  return (
    <LegalPage title="Support" updated="September 6, 2026">
      <p>
        Write to <a href="mailto:hello@brise.care">hello@brise.care</a> with
        your device model and iOS version. We answer within two business days.
      </p>

      <h2>Reps are not counted</h2>
      <ul>
        <li>Place the phone on the floor, screen facing you, about one meter away.</li>
        <li>Make sure your whole upper body is in frame and the room is lit.</li>
        <li>Lower until your chest is close to the floor: the counter looks for full range of motion.</li>
      </ul>

      <h2>App blocker does not lock apps</h2>
      <ul>
        <li>iOS Settings → Screen Time must be enabled on the device.</li>
        <li>Grant the Screen Time permission when pumpr. asks, then pick apps or categories in Settings → App blocker.</li>
        <li>The lock applies from the start of each day until your goal is reached.</li>
      </ul>

      <h2>Subscription</h2>
      <ul>
        <li>Restore a purchase from the paywall with “Restore purchases”, signed in with the same Apple ID.</li>
        <li>Cancel or change plan in iOS Settings → Apple ID → Subscriptions.</li>
      </ul>

      <h2>Delete my data</h2>
      <p>Settings → Sync → Delete data removes your account and workouts from our servers.</p>
    </LegalPage>
  )
}
