# TerraFork: bounded competitive research

Researched 2026-11-01 using primary project, university, and developer pages. This is a product-positioning scan, not a trademark clearance or exhaustive novelty search.

## Main finding

The strongest defensible pitch is **a pocket-sized counterfactual water laboratory: fork one watershed, change one thing, run the identical storm, and see exactly where the water went**. Browser terrain simulation, land-cover interventions, storm testing, before/after numbers, and even baseline hydrographs already exist. Do not describe the proposed app as the first of those things.

## Five closest projects

| Project and primary source | Existing overlap | Credible TerraFork opportunity (inference from these public descriptions) |
|---|---|---|
| [Downstream — developer project page](https://simreaney.github.io/downstream/) | Closest direct comparator. Free browser 3D procedural catchment game; riparian trees, ponds, leaky dams; live SCIMAP risk recomputation in a Web Worker; storms; hydrograph against the same storm without interventions; reproducible seed/action share links. Desktop/controller-first; phone needs a controller to walk. | Make the *two synchronized worlds themselves* the main interface, with direct touch intervention, no resource gathering or walking, a shared time cursor, and visible mass accounting. “Baseline comparison” alone is insufficient differentiation because Downstream already has it. |
| [UC Davis AR Sandbox — original developer page](https://web.cs.ucdavis.edu/~okreylos/ResDev/SARndbox/MainPage.html) | Real sand, Kinect, projector, real-time topographic contours and simulated water; watershed education through terrain manipulation. [UC Davis TERC](https://tahoe.ucdavis.edu/sandbox) describes building landforms and making virtual rain. | Deliver the immediate physical intuition in an ordinary phone browser, with no exhibit hardware. Add repeatable same-storm comparisons and measured outcomes. Avoid implying that interactive terrain/rain education is new. |
| [Tangible Landscape — NC State laboratory](https://geospatial.ncsu.edu/geoforall/tangible-landscape.html) | Physical 3D model/scanner/projector coupled to GRASS GIS; real-time environmental scenario testing. A [2024 university case study](https://cnr.ncsu.edu/geospatial/news/2024/11/11/tackling-agricultural-runoff-with-tangible-landscape/) adds riparian buffers, swales, berms and retention ponds, then computes a storm and projects feedback. | Browser distribution and a short, solo experiment loop are practical accessibility differences. Do not claim land interventions with instant runoff feedback as a new concept. |
| [SewerTycoon — University of Michigan Digital Water Lab](https://www.digitalwaterlab.org/sewertycoon) | Paint green infrastructure on a map, run physics-based EPA SWMM simulations, compare flooding, overflow and cost. Uses calibrated research models. Its FAQ currently states account creation and roughly 45 minutes per scenario. | Offer immediate local, synthetic-world learning with no account, while clearly stating lower scientific scope. Do not imply equivalent accuracy or a replacement for calibrated infrastructure planning. |
| [Hydrology Lab — Faruk Gürbüz](https://farukgurbuz.com/lab) | Browser teaching lessons on watersheds and dam routing, one-variable changes, numerical cause/effect, editable reference design, explicit equations. Synthetic 15×12 terrain and idealized level-pool routing; explicitly not for design. | A richer manipulable 3D diorama, paired live worlds and a single concise experiment outcome can make concepts easier to grasp. Numerical before/after explanations alone are already established. |

## Practical critique

- **Scope:** Four interventions plus terrain editing, voice, 3D, mobile and a simulation audit can dilute the demo. A complete rain → fork → one intervention → replay → measured difference loop matters more than many tools. Start with forest/impervious cover and a single retention berm or leaky barrier.
- **Fair comparison:** Both branches must have identical terrain, initial water/soil state, storm schedule, timestep and camera. Fork/reset/replay must be deterministic. A user must be able to prove the changed intervention caused the difference.
- **Trust:** Report rain input, surface storage, infiltration, outlet discharge and numerical residual. Use “simulated units” or explicitly stated cell/metre assumptions. Label the solver as an educational approximation. Do not call a downhill-routing toy “Navier–Stokes” or a flood forecast.
- **Counterintuitive outcome:** A dam that only shifts or delays the water is more credible than every tool improving a universal score. Show peak outlet flow and retained water separately, and inspect upstream inundation if implemented.
- **Voice:** Voice is a convenience, not the core novelty. Keep explicit buttons fully functional. If the promise is that everything runs locally, verify speech recognition actually does so on the target browser; a browser speech API is not proof of local processing. “No paid API key” and “offline” are distinct claims.
- **Product usefulness:** Choose a clear audience: a teacher or curious student testing land-use cause/effect in under a minute. Avoid positioning synthetic islands as a city planning service.

## Best 40-second demo hook

“Same island. Same storm. One decision.” Run a storm over the untouched island for five seconds. Tap **Fork experiment**; the view becomes synchronized baseline/intervention dioramas. Tap **Pave the hillside** on one side and replay the exact storm. The intervention branch visibly sends water faster to the outlet. Undo, then plant the same area and replay. End on the paired outlet hydrographs and a small water ledger: input = stored + infiltrated + discharged + residual. Show real measured deltas from the solver, never preset success percentages.

Best title line: **Change the land. Replay the rain.**

## Name collision check

**TerraFork has an obvious existing sustainability-sector brand collision.** [TerraFork's own site](https://terrafork.eco/) sells wooden/bamboo cutlery and compostable packaging and identifies TerraFork as a business brand. The exact-name search also finds a [Terra-Fork GitHub repository](https://github.com/uiuytb/Terra-Fork), a fork of a voxel world-generation platform. The packaging business is unrelated functionally but overlaps environmental language and may dominate search. Recommend choosing another name before public launch; no legal conclusion is implied.

Limited alternatives scan: “Rainfork” has an [npm profile/package hit](https://www.npmjs.com/~goblinpee), and “StormFork” appears in existing game and sailing uses. Neither is a proven clear name. A descriptive working title such as **Watershed: Same Storm, Two Futures** communicates the concept without relying on an unverified uniqueness claim.

## Claims safe to use if implementation proves them

- A browser-based, educational watershed sandbox with paired counterfactual worlds.
- The same seeded storm runs across both branches; the displayed measurements come from the simulation.
- Direct touch controls and optional voice shortcuts; no account or paid API key required.
- A simplified local water model, with explicit assumptions and conservation accounting.

Avoid: first-ever, scientifically validated, predicts your flood risk, accurate climate model, AI-powered hydrology, fully offline voice, or universally superior intervention outcomes.
