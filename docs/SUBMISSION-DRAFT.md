# Rillspace — submission draft, not submitted

**Track: General.**

## Elevator pitch

Same island. Same storm. One decision. Speak a change and watch two possible futures unfold in a living 3D world.

## Inspiration and purpose

Land-use changes are hard to reason about from a static before/after picture. Rillspace gives curious students and teachers a small world they can question: what changes when a hillside becomes a forest, pavement, or a barrier?

## What it does

Run a storm, change the landscape, and compare synchronized original/intervention worlds. Both receive identical rainfall from the same starting state. Orbit the views, scrub time, undo decisions, save a possibility, or export the measurements. Voice is an optional convenience; text and one-tap controls provide the complete experiment loop.

## Implementation

Procedural Three.js dioramas use instanced trees/buildings, a water-depth mesh, rainfall particles and cached shadows. A fixed-step finite-volume model conserves transfers between cells and explicitly accounts for soil absorption, surface storage and boundary outflow. The decision trail and parameter links recreate bounded configurations; time scrubbing replays deterministically rather than showing a prerecorded animation.

## Challenges and learning

A counterfactual is only meaningful when the shared conditions are controlled. Rillspace rebuilds both worlds from identical initial conditions after a change, and preserves the same rainfall and timestep. The numerical ledger and reproducibility tests make that contract inspectable. Static shadow caching and bounded rendering resolution reduce the cost of showing two worlds on a phone-sized screen.

## What is distinctive

The two synchronized worlds are the primary interface, with direct voice/text/touch interaction and visible water accounting. Watershed simulation, land interventions and baseline hydrographs have substantial prior art; research notes credit Downstream, AR Sandbox, Tangible Landscape and others. No first-ever claim is made.

## Validation and limits

Nine automated tests and a production build pass. Desktop browser checks cover interventions, timeline replay, conservation display, saved experiments, undo and responsive layout. Actual iPhone speech/WebGL performance and fresh private sign-in still need verification. The final working-demo video is not yet recorded.

The model uses normalized illustrative parameters. It omits calibrated geography, momentum, groundwater and drainage infrastructure. It is an educational playground, not a flood forecast or planning service. Commands use a local grammar, not a cloud AI model; speech recognition may use the browser provider's service.

## Provenance and next steps

Built with AI coding assistance beginning November 1, 2026. All landscape geometry is procedural. Next steps are phone validation, classroom usability testing, clearer intervention-region highlighting, and comparisons against established hydrological models before making scientific claims.

- Source: https://github.com/ShivaPriyanShanmuga/rillspace
- Private preview: https://rillspace-lab.wirylapel.chatgpt.site
- Video: pending 2–3 minute working demonstration on YouTube/Vimeo
- Eligibility, judge access, track routing and final terms: unresolved before submission
