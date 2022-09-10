---
"@react-three/rapier": patch
---

The physics world stepping would needlessly catch up all the time missed while the host application was suspended in a background tab. This has been fixed.
