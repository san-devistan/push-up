import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

type LegalPageProps = {
  children: ReactNode
  title: string
  updated: string
}

export function LegalPage({ children, title, updated }: LegalPageProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <Link className="text-sm font-bold tracking-[0.2em]" to="/">
          pumpr.
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Last updated {updated}
        </p>
      </header>
      <article className="flex flex-col gap-6 text-base leading-relaxed [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        {children}
      </article>
      <footer className="flex flex-wrap gap-4 border-t pt-6 text-sm text-muted-foreground">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Use</Link>
        <Link to="/support">Support</Link>
      </footer>
    </main>
  )
}
