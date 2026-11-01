# Validation record

## Automated

Nine tests pass: no unforced water, conservation/nonnegativity across covers, shared initial conditions and rainfall, deterministic replay, model-derived absorption differences, dam effects, horizon/timestep bounds, bounded parameter links, and supported/negative/unsupported language commands.

`npm run build` bundles the actual app with pinned Three.js and Vite dependencies. Tests establish the implementation contract, not scientific validity.

## Browser observations

- Forest intervention started the real model and enabled paired comparison.
- Keyboard End on the timeline recomputed both branches to 90 seconds.
- The displayed forest result at seed 731 and 1× rain showed 30% absorbed (original 11%) and 21% outflow (original 26%), with a computed relative outflow difference of about 17%.
- The model ledger displayed identical rain input (2,829.958 rounded units) and accounted for surface storage, soil absorption and boundary outflow in each branch.
- Reload restored the candidate configuration, comparison mode and time; title restoration was corrected after observing a stale initial heading.
- Saved the forest experiment and reopened its 90-second state through the phone-sized interface.
- Applied typed pavement and pause commands. Verified Undo restored the previous pavement decision after planting a forest.
- Inspected desktop and 390×844 layouts, including vertically stacked 3D views and visible command input. Document width did not exceed the viewport.
- No console errors remained in the inspected build after replacing the removed Three.js shadow-map mode and caching static shadow rendering.

## Hosting

Deployment succeeded at https://rillspace-lab.wirylapel.chatgpt.site from implementation commit 77b7636f60352f86c867ff63c3c1ea20e6b127c0. GitHub Actions passed the tests and production build: https://github.com/ShivaPriyanShanmuga/rillspace/actions/runs/41343946565 .

The user's approved email has a private viewer grant. The fresh ChatGPT consent page did not complete in automated Chrome; hosted user sign-in on the actual phone remains unverified. Local browser screenshots show the exact application code in the deployed build, not a completed hosted sign-in or an actual iPhone recording.

## Remaining checks

- Actual iPhone Safari WebGL, speech permissions and performance. Desktop viewport testing is not proof of actual device behavior.
- Fresh hosted access under the approved user account.
- Final demo recording and submission receipt.

