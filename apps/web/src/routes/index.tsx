import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: LandingPage })

const FEATURES = [
  {
    body: "On-device pose tracking counts every rep. No video leaves your phone.",
    title: "Counted by the camera",
  },
  {
    body: "Pick the apps that distract you. They stay locked until today's goal is done.",
    title: "No reps, no apps",
  },
  {
    body: "Levels, streaks and a shareable card for every session.",
    title: "Progress you can see",
  },
] as const

function LandingPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-between gap-16 px-6 py-16">
      <header className="flex flex-col gap-6">
        <p className="text-sm font-bold tracking-[0.2em]">pumpr.</p>
        <h1 className="text-5xl font-bold tracking-tight text-balance">
          Push-ups, counted. Distractions, locked.
        </h1>
        <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
          pumpr. turns your daily push-ups into the key that unlocks your
          phone. Set a goal, drop to the floor, and let the camera do the
          counting.
        </p>
      </header>

      <section className="grid gap-8 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div className="flex flex-col gap-2" key={feature.title}>
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="flex flex-wrap gap-4 border-t pt-6 text-sm text-muted-foreground">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Use</Link>
        <Link to="/support">Support</Link>
        <span>hello@brise.care</span>
      </footer>
    </main>
  )
}
