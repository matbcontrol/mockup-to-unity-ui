---
name: mockup-to-unity-ui
description: Build a Unity uGUI screen from a mockup image (PNG/JPG of a game screen) and check it against the mockup. Use when asked to lay out, rebuild or "make this screen in Unity" from a design picture.
---

# Mockup to Unity UI

You turn a picture of a game screen into a real uGUI hierarchy (a prefab) and keep fixing it until it matches.

## Tools

MCP server `unity-ui-agent` (see README for setup). If MCP is not connected, the same tools exist as `node mcp/cli.mjs <build|screenshot|hierarchy|compare> ...`.

- `unity_build_ui(spec)`: builds the screen and saves `Assets/UiAgent/Output/<name>.prefab`.
- `unity_screenshot(path?)`: renders at the exact canvas size.
- `compare_to_mockup(mockup, render)`: pixel similarity, worst regions, diff image.
- `unity_hierarchy()`: what was built, with anchors.

## Spec

```json
{
  "name": "level_complete",
  "canvas": { "width": 540, "height": 960, "background": "#2b2d42" },
  "elements": [
    { "id": "Window", "type": "panel", "rect": [40, 180, 460, 560], "color": "#edf2f4", "radius": 28 },
    { "id": "Title", "type": "text", "rect": [70, 160, 400, 60], "text": "LEVEL COMPLETE", "fontSize": 34, "color": "#ffffff", "bold": true },
    { "id": "Next", "type": "button", "rect": [100, 560, 340, 80], "color": "#06d6a0", "radius": 16, "text": "NEXT", "fontSize": 38, "bold": true }
  ]
}
```

- `rect` is `[x, y, width, height]` in canvas pixels from the top-left corner. Canvas size = mockup size.
- Types: `panel` (box, optional `radius`, `outline`, `outlineWidth`), `button` (box + label: `text`, `fontSize`, `textColor`), `text` (`color`, `fontSize`, `align`, `bold`), `circle`, `progress` (`color` = track, `fill`, `value` 0..1, optional label).
- Order matters: background panels first, then what sits on them, text last.
- Give every element a meaningful `id` (PlayButton, CoinCount): they become GameObject names a developer will see.

## Workflow

1. Look at the mockup. Note its pixel size. List every element top to bottom: what it is, roughly where, what color, what text.
2. Measure instead of guessing when it matters. You may read the PNG with a small script (for example sample colors or scan rows for edges with `pngjs`) to get exact colors and edges.
3. Write the spec and call `unity_build_ui`. Fix any error it returns.
4. `unity_screenshot`, then `compare_to_mockup`. Open both images and the diff. The worst regions tell you where to look.
5. Fix what is off: missing elements, wrong size or position, wrong color, wrong text. Rebuild. Stop after 3 rounds or when the result matches; do not chase shadows and gradients, the spec has no such fields.
6. Report: prefab path, final similarity, and anything you could not reproduce.

## Pitfalls

- Text inside a colored bar is the bar's `text` (button/progress), not a separate element, unless it is clearly separate.
- Stars, coins, avatars and gems are `circle` placeholders with the right color.
- A dimmed full-screen layer is a `panel` with the full canvas rect.
- Keep `fontSize` close to the cap height you see times ~1.4.
