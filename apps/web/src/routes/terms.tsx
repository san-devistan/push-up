import { LegalPage } from "@/components/legal-page"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [{ title: "Terms of Use — pumpr." }],
  }),
})

function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="September 6, 2026">
      <p>
        These terms apply to the pumpr. iOS app. By installing or using it you
        agree to them. If you do not agree, do not use the app.
      </p>

      <h2>The service</h2>
      <p>
        pumpr. counts push-ups with your iPhone camera, tracks your progress,
        and can keep apps you choose locked until your daily goal is done. It
        is a training aid, not a medical device or a substitute for
        professional advice. Consult a doctor before starting any exercise
        program, and stop if you feel pain.
      </p>

      <h2>Subscriptions</h2>
      <ul>
        <li>
          pumpr. Pro is sold as an auto-renewing subscription (monthly or
          yearly) through the Apple App Store. Prices are shown in the app
          before purchase.
        </li>
        <li>
          Payment is charged to your Apple ID at confirmation. The subscription
          renews automatically unless cancelled at least 24 hours before the end
          of the current period, and your account is charged for renewal within
          24 hours before the period ends.
        </li>
        <li>
          Manage or cancel in iOS Settings → Apple ID → Subscriptions.
          Deleting the app does not cancel a subscription.
        </li>
        <li>
          Refunds are handled by Apple under App Store rules.
        </li>
      </ul>

      <h2>Your account</h2>
      <p>
        An anonymous account is created when you start. You are responsible for
        the device and Apple or Google account you link to it. You can delete
        your account and data at any time from Settings → Sync.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not reverse engineer the app, interfere with its services, or use it
        in a way that breaks the law. The app blocker acts only on the apps you
        select yourself and can be turned off in Settings at any time.
      </p>

      <h2>Warranty and liability</h2>
      <p>
        The app is provided as is. Repetition counting depends on lighting,
        camera placement and your form, and may be inaccurate. To the extent
        permitted by law, we are not liable for injuries, missed workouts, or
        indirect damages arising from use of the app.
      </p>

      <h2>Apple</h2>
      <p>
        Apple&apos;s standard End User License Agreement for App Store apps
        applies in addition to these terms where they do not conflict:
        apple.com/legal/internet-services/itunes/dev/stdeula.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Material changes are announced in the app;
        continued use after the change means acceptance.
      </p>

      <h2>Contact</h2>
      <p>hello@brise.care</p>
    </LegalPage>
  )
}
