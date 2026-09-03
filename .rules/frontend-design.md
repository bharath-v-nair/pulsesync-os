---
description: "Anthropic/Antigravity frontend-design skill: Anti-AI-slop and bespoke design principles"
globs: "**/*.{html,css,js,jsx,ts,tsx}"
---

# Frontend Design Rules (Anti-AI-Slop Invariants)

1. **Avoid Generic AI Defaults:**
   - Strictly avoid generic neon purple/blue gradient backgrounds and copy-paste cards with hairline white borders.
   - Design with a distinctive point of view tailored specifically to the subject: physical athletic training & cognitive interview preparation.
   - Use an intentional palette: Obsidian base (`#070a10`), deep card elevation (`#0f172a`), emerald for completion milestones, warm amber for heavy barbell tonnage, and electric cyan/indigo for deep focus.

2. **The Signature Element:**
   - Every screen must feature ONE memorable signature interaction that embodies the product.
   - For PulseSync: The tactile, spring-damped **Quick-Stepper Row** with physical haptic motor tick and instant tabular numeric feedback.

3. **Typography & Tabular Numerals:**
   - All counters and metrics MUST use `font-variant-numeric: tabular-nums` to eliminate layout jitter during increments.
   - Use high-contrast hierarchy: uppercase micro-labels with wide letter spacing (`tracking-[0.18em] text-[10px] font-bold text-slate-400`), bold numeric readouts.

4. **Spring Physics & Tactile Micro-Interactions:**
   - Buttons must utilize physical spring easing: `transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)`.
   - On tap/click: physical depression `active:translate-y-0.5 active:scale-[0.96]`.
   - Every interactive target must satisfy Fitts's Law with a minimum bounding box of 48 × 48 px.
