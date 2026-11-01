# Model contract

The 42×42 grid covers an illustrative square island. Elevation and decorations use a shared seed. Each fixed step is 0.125 model seconds. The horizon is 90 seconds; rainfall is a sine-shaped 60-second storm followed by 30 seconds of drainage.

## Water accounting

1. Add identical rainfall depth to every cell in both branches.
2. Transfer available surface water into soil, at a cover-specific rate reduced as the finite soil capacity fills.
3. Compute potential flows between horizontal and vertical neighbors using surface elevation (terrain plus water).
4. Limit aggregate outgoing transfer to 95% of each cell's available water. Apply each exact transfer as a subtraction from its source and an addition to its destination.
5. Drain a fraction of boundary-cell water and account for it as outflow.

At every step, rain added ≈ surface storage + soil absorption + boundary outflow. The difference is the floating-point numerical residual; it is not silently assigned to a category. Negative water is not an intervention mechanism.

| Cover | Infiltration rate | Soil capacity | Surface-flow factor |
|---|---:|---:|---:|
| Meadow | 0.004 | 0.25 | 1.00 |
| Forest | 0.019 | 1.20 | 0.68 |
| Paved | 0.0001 | 0.008 | 1.20 |

These are normalized demonstration parameters, not measured material constants. The changed cover applies to the marked upstream hillside region. The dam raises cells across a valley band by 1.55 units; it is a simplified solid terrain barrier, not an engineered dam simulation.

## Fair counterfactual

The baseline always uses meadow and no dam. It receives the candidate's same seed and storm intensity. Changing storm intensity changes the forcing in **both** branches, preserving a fair land-intervention comparison. Every landscape decision rebuilds both branches from dry initial conditions and replays from time zero. Dragging the timeline recomputes the same model to the requested time.

Images use the actual current water-depth field. Charts use computed boundary flow samples. Percentages use computed cumulative rain as the denominator. “Less water left the island” is a relative difference in modeled cumulative outflow at the displayed time, not a claim about reduced real flood damage.

## Limitations

No measured geography or weather, momentum, groundwater, drainage infrastructure, calibrated infiltration, uncertainty estimation or empirical validation. Units are intentionally called model units. The scene is an explanatory diorama. It should support curiosity and discussion, not safety decisions or flood-risk estimates.
