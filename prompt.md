# Prompt: Change Login Animation to Airplane Theme

## Context
The login page is in `frontend/src/pages/LoginPage.jsx`.
It has 3 stages:
- **Stage 1 (idle)** — landing screen with a glowing Login button
- **Stage 2 (animating)** — a character walks in holding a key and unlocks a cage (~2.5s CSS animation)
- **Stage 3 (open)** — cage opens, login form slides in

The animation uses two SVG components defined at the top of the file:
- `Character` — SVG person holding a key
- `Cage` — SVG cage with bars and a lock

---

## What to Replace

### Replace `Character` with `Airplane`
Create a new SVG component called `Airplane`.
The airplane should:
- Face right (pointing toward the gate)
- Have wings, a body, a tail, and windows
- Be colored white or light blue to match the dark gradient background
- Size: approximately `width="80" height="40"` viewBox

### Replace `Cage` with `AirportGate`
Create a new SVG component called `AirportGate`.
The gate should:
- Look like an airport boarding gate door — a rectangular arch/door shape
- Have a gate number label (e.g. "GATE 01")
- Have a status indicator that changes from red "CLOSED" to green "BOARDING" when `open={true}`
- The door/barrier should slide up or fade out when `open={true}` (same transition style as the current cage bars)
- Size: approximately `width="80" height="90"`

---

## What to Change in Stage 2 (animating)

Replace this in the animating stage JSX:
```jsx
<div className="walk-in" style={{ marginBottom: "4px" }}>
  <Character style={{ animation: "walkIn ..." }} />
</div>
<Cage open={false} />
```

With:
```jsx
<div className="walk-in">
  <Airplane />
</div>
<AirportGate open={false} />
```

Update the `walkIn` CSS keyframe — the airplane should fly in from the left
with a slight vertical wave using `translateY` for a flying effect:
```css
@keyframes walkIn {
  0%   { transform: translateX(-140px) translateY(0px); opacity: 0; }
  30%  { opacity: 1; }
  60%  { transform: translateX(-40px) translateY(-8px); }
  100% { transform: translateX(0px) translateY(0px); opacity: 1; }
}
```

---

## What to Change in Stage 3 (open)

Replace:
```jsx
<Character style={{ animation: "bounce 0.7s ease infinite" }} />
<Cage open={true} />
```

With:
```jsx
<Airplane style={{ animation: "hover 1s ease-in-out infinite" }} />
<AirportGate open={true} />
```

Add a `hover` keyframe inside the `<style>` tag for the airplane idle animation:
```css
@keyframes hover {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50%       { transform: translateY(-6px) rotate(3deg); }
}
```

---

## Text to Update

| Location | Old text | New text |
|---|---|---|
| Stage 2 loading text | `"Unlocking system..."` | `"Preparing for boarding..."` |
| Stage 1 subtitle (optional) | `"Promotion & Marketing Subsystem"` | keep or update as needed |

---

## What NOT to Change
- The 3-stage logic (`idle` → `animating` → `open`)
- The `setTimeout(() => setStage("open"), 2600)` timing
- The login form, forgot password flow, register flow
- All existing CSS animation class names (`walk-in`, `form-in`, `btn-glow`)
- The `renderCard()` function and all its views inside it
- `useUser()`, `useToast()`, `api` imports
- `StrengthBar` and `EyeIcon` helper components

---

## Summary of Files to Edit

| File | What changes |
|---|---|
| `frontend/src/pages/LoginPage.jsx` | Replace `Character` SVG → `Airplane` SVG, replace `Cage` SVG → `AirportGate` SVG, update stage 2 text, update stage 3 JSX, add `hover` keyframe, update `walkIn` keyframe |

> Only the two SVG components and their usage in stage 2 and stage 3 JSX need to change.
> Everything else stays exactly the same.
