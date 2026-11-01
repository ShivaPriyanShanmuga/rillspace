# Rillspace

**Same island. Same storm. One decision.**

A browser-based 3D counterfactual playground for curious students and teachers. Say or tap a change, replay an identical storm across two landscapes, and inspect the computed difference. Built for Arbiter Hacks V1, General Track.

## Run

Node 22.12+.

```sh
npm ci
npm run dev
npm run check
npm run build
```

Open the printed local URL on the development computer. For iPhone Safari, use the deployed HTTPS link; a computer's localhost address is not a phone preview.

## What works

- Procedurally generated 3D landscape with orbit/pinch controls, trees, a village, clouds, rain and computed surface water.
- Synchronized original and intervention views. Same seed, timestep, initial conditions and rainfall. Only land cover/barrier differs.
- Forest, pavement, meadow and a terrain barrier; three storm intensities.
- Deterministic time scrubbing, replay, session undo, decision trail, local saved experiments and reproducible parameter links.
- Live outflow hydrographs, input/storage/infiltration/outflow accounting and experiment-data/PNG export.
- Optional browser speech recognition with explicit commands and full button/text alternatives.
- Responsive stacked comparison on phones, keyboard controls, reduced-motion styling and readable results outside the canvas.

Try: `plant a forest`, `pave the hillside`, `build a dam`, `remove the dam`, `restore the meadow`, `double the rain`, `half the rain`, `make it rain`, `compare worlds`, `pause`, `replay`, `undo`, `reset`.

## Model and claim boundaries

This is a simplified, normalized educational model, **not a flood forecast or a planning tool**. It uses conservative finite-volume neighbor transfers based on surface head, bounded infiltration/soil capacity, and open boundary drainage. It does not solve the full shallow-water equations or include calibrated geography, groundwater, sewer networks, or water momentum.

The numbers come from the solver, not preset intervention scores. Forest and pavement are assigned documented model parameters; their results are not empirical estimates for a real site. Barriers can move water upstream, and should not be assumed beneficial.

The command engine is a local explicit grammar, **not a cloud AI model**. Browser speech recognition may use the browser provider's service. The simulation itself runs on the device. No paid API key, camera, bank information or billing setup is needed.

## Validation and provenance

See [model details](docs/MODEL.md), [validation](docs/VALIDATION.md), [research](docs/RESEARCH.md), and the [demo plan](docs/DEMO.md). Automated checks cover conservation, deterministic replay, shared forcing, intervention effects, bounded inputs and negative/unsupported commands. Real iPhone speech/WebGL performance remains a separate device check.

Built with AI coding assistance beginning November 1, 2026. Geometry is procedural; no generated camera footage is represented as observation. Interactive watershed education has substantial prior art, including Downstream and AR Sandbox; paired visual experiments and accessible direct interaction are this implementation's focus. No first-ever or winning-odds claim is made.

The public hackathon requirements call for public code, a 2–3 minute YouTube/Vimeo working demo, and a description. The project is not submitted merely because a build is deployed.
