import { LegalPage } from "@/components/legal-page"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Privacy Policy — pumpr." }],
  }),
})

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 6, 2026">
      <p>
        pumpr. is a push-up training app for iPhone. This policy explains what
        the app collects, why, and what stays on your device. It is written to
        be read, not skimmed.
      </p>

      <h2>What stays on your device</h2>
      <ul>
        <li>
          <strong>Camera.</strong> Repetitions are counted by on-device pose
          tracking. No video or image from the camera is stored, uploaded or
          shared. The camera runs only during a workout session.
        </li>
        <li>
          <strong>Motion sensors.</strong> Device orientation is read locally to
          help you position the phone. It is never transmitted.
        </li>
        <li>
          <strong>Screen Time (Family Controls).</strong> If you enable the app
          blocker, the apps and categories you choose are stored on your device
          in a private app group so the daily schedule can lock and unlock them.
          Apple provides these selections as opaque tokens: pumpr. cannot see
          which apps you picked, and nothing about your Screen Time leaves the
          phone.
        </li>
        <li>
          <strong>Reminders.</strong> Training reminders are local notifications
          scheduled on the device.
        </li>
        <li>
          <strong>Photos.</strong> When you choose to save or share a
          performance image, the image is written to your photo library or
          handed to the app you picked. Nothing is read from your library.
        </li>
      </ul>

      <h2>What we store</h2>
      <p>
        When you start using the app, an anonymous account is created so your
        workouts can be backed up. You can later link it to Sign in with Apple
        or Google. We store:
      </p>
      <ul>
        <li>
          Workout sessions: date, duration, repetition count, goal reached, and
          the score derived from them.
        </li>
        <li>
          Account identifiers: a random user id, and if you sign in, the email
          address and name provided by Apple or Google.
        </li>
        <li>
          Preferences that need to follow your account across devices, such as
          your daily goal and training times.
        </li>
      </ul>
      <p>
        This data is stored with Convex on servers located in the European Union
        and is used only to run the app and restore your history on a new
        device. We do not sell it, and we do not use it for advertising.
      </p>

      <h2>Subscriptions</h2>
      <p>
        Purchases are handled by Apple. To unlock your subscription across
        devices we use RevenueCat, which receives the App Store receipt and your
        pumpr. user id. Apple does not share your payment details with us.
        RevenueCat&apos;s policy is available at revenuecat.com/privacy.
      </p>

      <h2>Analytics and tracking</h2>
      <p>
        The app contains no advertising SDK and does not track you across other
        companies&apos; apps or websites.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <strong>Delete everything.</strong> Settings → Sync → Delete data
          removes your account and all workouts from our servers immediately.
        </li>
        <li>
          <strong>Sign out.</strong> Keeps the account and clears the device.
        </li>
        <li>
          <strong>Permissions.</strong> Camera, Screen Time, photos and
          notifications can be revoked at any time in iOS Settings; the related
          feature simply stops working.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        pumpr. is not directed at children under 13 and does not knowingly
        collect data from them.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests about your data: hello@brise.care. We answer
        within 30 days.
      </p>
    </LegalPage>
  )
}
