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

## Remaining checks

- Save/open and undo through the interface.
- Phone-sized layout and overflow.
- Actual iPhone Safari WebGL, speech permissions and performance. Desktop viewport testing is not proof of actual device behavior.
- Hosted access under the approved user account.
- Final demo recording and submission receipt.
