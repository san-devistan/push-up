"use dom"

import definition from "@/features/workout/_components/pumpr.avatar.json"
import { createAvatar } from "@bible-strong/avatar-react"
import type { DOMProps } from "expo/dom"

const PumprAvatar = createAvatar(definition)
const EXPRESSIONS = [
  "neutral",
  "upward-side-glance",
  "downward-gaze",
  "skeptical-right",
  "small-attentive",
  "wide-downward-gaze",
  "surprised-left",
  "sleepy-squint",
  "angry-right",
  "curious-left",
  "asymmetric-down-right",
  "attentive-left",
  "joyful-wide",
  "eyes-closed",
  "joyful-down-right",
  "skeptical-left",
  "far-right-glance",
  "angry-left",
  "playful-right",
  "asymmetric-up-left",
  "gentle-downward-gaze",
  "wide-down-left",
  "surprised-wide-left",
  "drowsy-closed",
  "suspicious-right",
  "shy-downward",
  "angry-brows",
  "uneasy-left",
] as const satisfies ReadonlyArray<keyof typeof definition.expressions>

const DOCUMENT_STYLES = `
  :root {
    color-scheme: light dark;
    --border: #e4e4e7;
    --muted: #71717a;
    --surface: #f4f4f5;
    --text: #09090b;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: transparent;
    color: var(--text);
    font-family: ui-sans-serif, system-ui, sans-serif;
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  h2 {
    margin: 0;
    font-size: 24px;
    line-height: 1;
  }

  header span {
    color: var(--muted);
    font-size: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .card {
    display: grid;
    height: 170px;
    min-width: 0;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: var(--surface);
    place-items: center;
  }

  .avatar {
    display: grid;
    width: 112px;
    height: 112px;
    place-items: center;
  }

  .bs-avatar {
    display: inline-grid;
    width: 100% !important;
    height: 100% !important;
    place-items: center;
  }

  .bs-avatar__svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .caption {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    width: 100%;
    gap: 4px;
    font: 11px/14px ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .number {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .name {
    overflow-wrap: anywhere;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --border: rgba(255, 255, 255, 0.1);
      --muted: #a1a1aa;
      --surface: #18181b;
      --text: #fafafa;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bs-avatar, .bs-avatar * {
      transition-duration: 0.01ms !important;
    }
  }
`

export default function ExpressionGallery(_: { dom?: DOMProps }) {
  return (
    <>
      <style>{DOCUMENT_STYLES}</style>
      <section aria-label="Avatar expressions">
        <header>
          <h2>28 expressions</h2>
          <span>number · name</span>
        </header>
        <div className="grid">
          {EXPRESSIONS.map((expression, index) => (
            <article className="card" key={expression}>
              <div className="avatar">
                <PumprAvatar
                  ariaLabel={`Expression ${index + 1}: ${expression}`}
                  expression={expression}
                  size="100%"
                />
              </div>
              <div className="caption">
                <span className="number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="name">{expression}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
