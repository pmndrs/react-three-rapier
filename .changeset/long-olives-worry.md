---
"@react-three/rapier": major
---

Remove WorldApi, replace with singleton instance proxy (@wiledal)

BREAKING CHANGE: The WorldApi has been removed. Instead, you can now import the singleton instance of the world from @react-three/rapier. This is a breaking change, but it should be easy to migrate to.

Before:
```tsx
import { useRapier } from '@react-three/rapier'

const Component = () => {
  const { world } = useRapier()

  useEffect(() => {
    // Access to the WorldApi (limited)
    world.bodies.forEach(() => {
      // Do something
    })

    // Access the raw Rapier World instance
    const rawWorldInstance = world.raw()
    rawWorldInstance.raw().setGravity(new Vector3(0, -9.81, 0))
  }, [])
}
```

Now:
```tsx
import { useRapier } from '@react-three/rapier'

const Component = () => {
  const { world } = useRapier()

  useEffect(() => {
    // Access the Rapier World instance directly
    world.bodies.forEach(() => {
      // Do something
    })
    world.setGravity(new Vector3(0, -9.81, 0))
  }, [])
}
```

Note: it is best to avoid accessing properties and methods on the world outside of `useEffect`, or `useLayoutEffect` in order for the world to be properly synchronized with the React component lifecycle.
```tsx
// bad
const Component = () => {
  const {world} = useRapier()

  world.setGravity(...)

  return null
} 

// good
const Component = () => {
  const {world} = useRapier()

  useEffect(() => {
    world.setGravity(...)
  }, [])

  return null
} 
```