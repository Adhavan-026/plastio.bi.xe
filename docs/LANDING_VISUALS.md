# Landing page visuals — Whisk/Flow shot list

The landing page (`src/app/page.tsx`) has a parallax hero and section
backgrounds that currently render as gradient/blob placeholder art. Drop
real generated images/video at the exact paths below and they appear
automatically — no code changes needed.

Generate these yourself in [Google Whisk](https://labs.google/fx/tools/whisk)
(images) and [Google Flow](https://labs.google/fx/tools/flow) (video), then
save the output to `public/landing/` using these exact filenames.

All prompts deliberately avoid photorealistic people, logos, or text-in-image
(AI image generation reliably mangles text — all real text on the site stays
as HTML/CSS on top of these backgrounds, never baked into the image itself).

| # | Tool | Save as | Prompt |
|---|------|---------|--------|
| 1 | Whisk | `public/landing/hero-bg.jpg` | Premium abstract 3D illustration for a fintech/business software hero banner. Deep indigo-blue gradient (#0d1b33 to #1e3a76 to #4a7cba background), softly glowing abstract geometric shapes suggesting invoices, bar charts, and upward growth arrows, modern glassmorphism style, soft light rays from top, subtle warm golden accent glow (#f0e3a8). No text, no logos, no people. Cinematic, highly detailed, wide 16:9, elegant and dark mood. |
| 2 | Flow | `public/landing/hero-loop.mp4` | Slow seamless-looping animation of soft abstract light particles and gentle geometric shapes drifting upward against a deep indigo-to-blue gradient background, evoking growth and financial clarity. Smooth subtle camera drift, no fast motion, no text, no people, cinematic lighting, 10-15 second loop, 16:9. Optional — the hero already works well as a still image; this is the upgrade if you want a video background too. |
| 3 | Whisk | `public/landing/modules-bg.jpg` | Same abstract style as image 1, much lower detail density and lighter/more muted colors so it can sit behind readable text at low opacity. Soft blue-toned abstract shapes only, no focal subject, wide 16:9. |
| 4 | Whisk | `public/landing/cta-bg.jpg` | Same abstract style as image 1 but warmer and more dramatic — deep indigo-to-violet gradient with bright glowing highlight shapes, suggesting a strong closing/call-to-action moment. No text, no logos, no people. Wide 16:9. |

## How the swap-in works

Each of `src/components/landing/parallax-hero.tsx` and `parallax-section-bg.tsx`
references these paths directly. If the file doesn't exist, the `<img>`/`<video>`
tag fails to load (a harmless 404 in the browser console) and the component
falls back to the gradient/blob layers underneath — the page never looks
broken either way, before or after you add real art.
