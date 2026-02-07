# Mobile optimization

This doc summarizes what was done for mobile and ideas for further improvements.

## What we did (implemented)

1. **Tap targets**  
   Buttons and links that matter on mobile now use a minimum ~44px touch target (via `.tap-target` and mobile media queries) so they’re easy to tap with a finger.

2. **Safe areas**  
   The feedback button (and any element with `.fixed-bottom-safe` / `.fixed-right-safe`) is positioned away from the device notch and home indicator on supported browsers.

3. **Wizard**
   - Tighter horizontal padding on small screens.
   - Progress bar uses full width on mobile.
   - Option buttons and Back/Continue have larger tap targets and padding on mobile.
   - Ranking step: up/down buttons get a full-width row on very small screens so they’re easier to hit (drag still works but ↑↓ are more reliable on touch).

4. **Results page**
   - Layout already stacks to one column below 900px; padding reduced further at 600px.
   - Card tiles: on screens ≤600px, the card content stacks (logo above text) and Apply / “Add to compare” stack and use larger tap targets.
   - Refinement options and multi-select labels use tap-target sizing on mobile.

5. **Home page**
   - Smaller heading on mobile.
   - Less padding on small screens.
   - Voice and primary buttons (and “Answer questions instead”) have minimum 44px height on mobile.

6. **Card detail modal**
   - On mobile, the modal can scroll and the close button has a larger tap target.

7. **Comparison page**
   - Reduced horizontal padding on small screens. Table already scrolls horizontally (`overflow-x: auto`).

## Ideas for later

- **Wizard ranking on touch**  
  Drag-and-drop is awkward on many phones. Consider making ↑↓ the primary control on narrow viewports (e.g. hide “drag to reorder” hint and show “Use ↑↓ to reorder” on mobile).

- **Results left panel**  
  On mobile, “Your answers” + “Refine your results” can be long. Options: make “Refine” collapsible, or show a short summary with “Edit in wizard” so users see cards sooner.

- **Comparison on very small screens**  
  Table scroll is OK but not ideal. A card-based “compare one attribute at a time” or stacked cards could be a future mobile-specific layout.

- **Font size**  
  Inputs use 16px to reduce iOS zoom-on-focus; you could add a mobile-only root font size (e.g. 1rem) if you want to tune overall scale.

- **“Have it / Not interested”**  
  On results cards, the checkbox label could be shortened on mobile (e.g. “Have it”) to save space and avoid wrapping.

All changes are in CSS (media queries and classes) plus adding those classes in components; no new dependencies. To revert, remove the mobile blocks from `app/globals.css` and the added class names from the components.
