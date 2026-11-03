---
name: anti-slop
description: Enforces clean UI/UX engineering principles, prevents generic AI visual slop, and forces the agent to strictly follow DESIGN.md tokens for React, Next.js, and Tailwind CSS components.
---

# Visual & UI Design Engineering Protocol (Anti-Slop)

## Core Mandates
1. **Always Read `DESIGN.md` First**: Before generating, refactoring, or styling any UI component, you MUST inspect and strictly follow the design tokens, color scales, typography rules, and component constraints defined in `DESIGN.md` at project root.
2. **Zero Visual Slop**:
   - DO NOT use generic purple/indigo ambient glows (`from-purple-500 to-indigo-500`), blurred decorative blobs, or cliché gradient text headings unless explicitly defined in `DESIGN.md`.
   - DO NOT spam `uppercase tracking-widest` labels, arbitrary `border-slate-800` borders, or decorative floating icons inside gradient boxes.
   - Avoid generic AI SaaS layout clichés, unnecessary drop shadows, and bloated hardcoded Tailwind classes.
3. **Token & Utility First**: Use configured Tailwind CSS color scales and CSS variables instead of hardcoded hex values (e.g., `bg-background` or `bg-neutral-900` over `bg-[#0f172a]`).
4. **Layout & Micro-Interactions**:
   - Prioritize spatial hierarchy, clear whitespace rhythm, high-contrast typography, and explicit interactive states (`hover:`, `active:scale-[0.98]`, `focus-visible:ring-2`).
   - Structural flex/grid layout MUST come before adding visual embellishments.
