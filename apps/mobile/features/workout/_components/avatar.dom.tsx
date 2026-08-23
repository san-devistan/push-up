"use dom"

import definition from "@/features/workout/_components/pumpr.avatar.json"
import { createAvatar } from "@bible-strong/avatar-react"
import type { DOMProps } from "expo/dom"

const PumprAvatar = createAvatar(definition)

const DOCUMENT_STYLES = `
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: transparent;
  }

  body {
    display: grid;
    place-items: center;
  }

  .bs-avatar {
    display: inline-grid;
    max-width: 100%;
    max-height: 100%;
    width: min(100vw, 100vh) !important;
    height: min(100vw, 100vh) !important;
    aspect-ratio: 1;
    place-items: center;
  }

  .bs-avatar__svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .bs-avatar, .bs-avatar * {
      transition-duration: 0.01ms !important;
    }
  }
`

export default function WorkoutAvatar({
  animation,
  expression,
}: {
  animation?: keyof typeof definition.animations
  dom?: DOMProps
  expression?: keyof typeof definition.expressions
}) {
  return (
    <>
      <style>{DOCUMENT_STYLES}</style>
      <PumprAvatar
        animation={animation}
        ariaLabel="pumpr avatar"
        expression={expression}
        size="100%"
      />
    </>
  )
}
