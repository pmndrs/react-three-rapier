---
"@react-three/rapier": minor
---

Update @dimforge/rapier3d-compat to 0.14.0 (@wiledal)
  - See https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md
  - Changed World prop `erp` to `contactNaturalFrequency`
    - This is undocumented in the Rapier.js documentation, but was introduced Rapier 0.20.0 https://github.com/dimforge/rapier/pull/651
    - The change mentions `contactDampingRatio` but this is not exposed in the Rapier.js API as of yet
