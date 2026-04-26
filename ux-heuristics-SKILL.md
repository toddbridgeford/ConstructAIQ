# UX Heuristics — Usability Audit Skill

**Source:** wondelai/skills — `github.com/wondelai/skills/tree/main/ux-heuristics`
**Install:** `npx skills add https://github.com/wondelai/skills --skill ux-heuristics`
**Trigger:** “audit this for usability”, “heuristic review”, “UX issues”, “usability problems”, “why is this confusing”

-----

## Purpose

Apply Nielsen’s 10 Usability Heuristics and Steve Krug’s “Don’t Make Me Think” principles to any UI, workflow, or page. Return a severity-scored report of every violation found, with specific fix recommendations.

-----

## Activation

This skill activates when you:

- Ask for a usability audit or review
- Describe a user complaint or confusion
- Share code, a screenshot, or a URL for UX evaluation
- Ask “why are users dropping off?” or “why is this hard to use?”

-----

## Nielsen’s 10 Heuristics

### H1 — Visibility of System Status

The system should always keep users informed about what is going on, through appropriate feedback within a reasonable time.

**What to check:**

- Does the user know if an action is processing? (loading states)
- Does the user know if an action succeeded or failed? (success/error feedback)
- Does the user know where they are in a multi-step flow? (progress indicators)
- Are async data loads communicated? (skeleton screens, spinners)
- Is stale data labeled as such? (freshness timestamps, staleness warnings)

**Severity 4 (Critical) violations:**

- Form submits with no feedback — user doesn’t know if it worked
- Data loading with no indicator — blank space that might be empty
- Process running with no progress signal

**Severity 2 (Minor) violations:**

- Freshness timestamp present but ambiguous (“Updated recently” vs “Updated 3 hours ago”)
- Loading spinner but no estimate or cancellation option for long operations

-----

### H2 — Match Between System and the Real World

The system should speak the user’s language, with words, phrases, and concepts familiar to the user.

**What to check:**

- Are labels using domain-appropriate terminology for the target user?
- Do icons represent what they actually do?
- Does the UI metaphor match real-world mental models?
- Are error messages in plain English, not error codes?

**Severity 4 violations:**

- Technical jargon in user-facing labels (“TTLCONS”, “CES2000000001” shown to non-developers)
- Error codes shown to end users (“Error 503” with no explanation)

**Severity 2 violations:**

- Abbreviations without expansion on hover/tooltip
- Industry terminology used without definition for new users

-----

### H3 — User Control and Freedom

Users often choose system functions by mistake. They need a clearly marked “emergency exit” to leave the unwanted state.

**What to check:**

- Can users undo actions?
- Can users dismiss modals, toasts, and overlays?
- Is there a back/cancel path in every flow?
- Can users recover from errors without losing their input?

**Severity 4 violations:**

- Destructive action (delete, send) with no confirmation and no undo
- Modal with no dismiss mechanism (no X, no ESC, no outside-click)

**Severity 2 violations:**

- Form that loses data on browser back navigation
- No “cancel” button in a multi-step wizard

-----

### H4 — Consistency and Standards

Users should not have to wonder whether different words, situations, or actions mean the same thing.

**What to check:**

- Do the same actions use the same labels everywhere?
- Is the primary CTA button the same color/style throughout?
- Do similar components behave the same way?
- Are platform conventions followed? (links are blue/underlined, buttons look clickable)

**Severity 3 violations:**

- “Save” in one section, “Submit” in another for equivalent actions
- One card uses hover shadow, another uses hover border — inconsistent affordance
- Navigation items in different order across pages

-----

### H5 — Error Prevention

Better than good error messages is a careful design that prevents the problem from occurring.

**What to check:**

- Are destructive actions gated with confirmation?
- Does form validation happen before submission, not after?
- Are ambiguous inputs clarified by format hints? (“MM/DD/YYYY”)
- Are irreversible actions clearly marked?

**Severity 4 violations:**

- File upload that overwrites existing files without warning
- “Delete account” accessible from main settings without any barrier

**Severity 2 violations:**

- Date input that doesn’t indicate expected format
- Password field that doesn’t show requirements until submission fails

-----

### H6 — Recognition Over Recall

Minimize the user’s memory load. Objects, actions, and options should be visible. The user should not have to remember information from one part of the interface to another.

**What to check:**

- Are options visible, not hidden in menus?
- Is context retained across steps in a workflow?
- Are recently used items surfaced?
- Do tooltips and labels appear on hover for icon-only controls?

**Severity 3 violations:**

- Icon-only toolbar with no labels and no tooltips
- Wizard that doesn’t show previous step answers on the current step
- Dashboard that shows data but doesn’t label units or source

-----

### H7 — Flexibility and Efficiency of Use

Allow users to tailor frequent actions. Accelerators — unseen by the novice user — may speed up the interaction for the expert.

**What to check:**

- Do power users have shortcuts or bulk actions?
- Are frequently used actions accessible without deep navigation?
- Can users set preferences for their workflow?

**Severity 2 violations:**

- No keyboard shortcuts for a developer-focused tool
- Power user must navigate 4 levels deep to reach a frequently used feature
- No “recently viewed” or “favorites” for a large dataset

-----

### H8 — Aesthetic and Minimalist Design

Dialogues should not contain irrelevant or rarely needed information. Every extra unit of information competes with relevant information.

**What to check:**

- Does every element on the screen have a clear purpose?
- Are there decorative elements that add noise without value?
- Is secondary information hidden until requested?
- Are empty states replacing data with useful content?

**Severity 3 violations:**

- 22-item sidebar navigation where 6 items cover 90% of usage
- Dashboard shows 8 KPI cards of equal visual weight with no prioritization
- “Powered by [technology]” badges in prominent locations

**Severity 2 violations:**

- Marketing copy on a dashboard (users already converted)
- Version numbers or build IDs visible in the main UI

-----

### H9 — Help Users Recognize, Diagnose, and Recover from Errors

Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.

**What to check:**

- Do error messages explain what went wrong in plain language?
- Do error messages tell the user what to do next?
- Are errors displayed near the point of failure (inline vs. toast)?
- Is the error state visually distinct from the empty state?

**Severity 4 violations:**

- “Something went wrong” with no specifics and no recovery path
- Error shown as a toast that disappears before the user reads it

**Severity 2 violations:**

- Form error shown at the top of the page, not next to the offending field
- Error message in red with no icon (fails color-blind accessibility)

-----

### H10 — Help and Documentation

Even though it is better if the system can be used without documentation, it may be necessary to provide help.

**What to check:**

- Is help contextual? (near the relevant UI element, not only in a docs page)
- Is documentation findable from within the UI?
- Are empty states instructive? (tell the user what this space is for and how to fill it)

**Severity 2 violations:**

- Empty state says “No data” with no explanation of how to get data
- Complex feature with no tooltip, help text, or documentation link
- “Learn more” links that go to generic documentation, not the specific feature

-----

## Krug’s “Don’t Make Me Think” Principles

These cut across the Nielsen heuristics and specifically target cognitive load.

### K1 — The Bill in the Wallet Test

The user should understand what the page is and how to use it within seconds, without reading.

**Violation:** A user landing on a dashboard page cannot identify the primary purpose or action within 5 seconds of looking at it.

### K2 — Street Signs, Not Road Maps

Navigation should feel like street signs (immediate, local) not road maps (requiring full context to understand).

**Violation:** Navigation item labels require domain knowledge to understand (“CSHI”, “BSI”, “PAR” without expansion).

### K3 — Eliminate Happy Talk

Remove any text that introduces content without adding information. “Welcome to the dashboard! Here you can find all your construction data.”

**Violation:** Placeholder marketing copy in a product UI that users see repeatedly.

### K4 — The Trunk Test

At any point in the site, the user should be able to identify: What site is this? What page am I on? What are the major sections? What are my options at this level? Where have I been?

**Violation:** Page doesn’t have a visible current-section indicator in navigation.

-----

## Severity Scale

|Level|Label   |Description                                                 |Must Fix?          |
|-----|--------|------------------------------------------------------------|-------------------|
|4    |Critical|Prevents task completion. Users will fail or leave.         |Yes — before ship  |
|3    |Major   |Significantly impairs task completion. Frequent frustration.|Yes — high priority|
|2    |Minor   |Causes confusion but task is still completable.             |Yes — backlog      |
|1    |Cosmetic|Minor polish issue. No functional impact.                   |Optional           |
|0    |Positive|Works well. Call this out explicitly.                       |N/A                |

-----

## Output Format

```
UX HEURISTICS AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page / Component: [Name]
Audit Date: [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL (Severity 4) — Fix before shipping
  [H#/K#] [Heuristic name]
  Location: [Specific element/page/section]
  Issue: [What's wrong]
  Fix: [Specific change]

MAJOR (Severity 3) — High priority
  [Same format]

MINOR (Severity 2) — Backlog
  [Same format]

WHAT'S WORKING (Severity 0)
  [Specific elements that handle UX well — be explicit]

SUMMARY
  Critical: N  Major: N  Minor: N
  Top 3 fixes by user impact:
  1. ...
  2. ...
  3. ...
```

-----

## Workflow Rules

1. **Audit before prescribing.** List all violations before suggesting solutions. The list informs priority.
1. **Be location-specific.** “The dashboard has a hierarchy problem” is not useful. “The dashboard sidebar (src/app/components/Sidebar.tsx) has 22 items at equal visual weight, violating H8” is useful.
1. **Distinguish empty state from error state from loading state.** These are three different UX problems that are often conflated.
1. **Flag false empty states.** “No data” when data hasn’t loaded yet vs. data genuinely not existing — these require different UI treatment.
1. **Apply Krug’s test ruthlessly.** Ask: does this UI require the user to think? If yes, flag it.