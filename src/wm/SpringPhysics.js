// ============================================================
//  SpringPhysics.js — Spring-based animation system
//  Adds smooth, physically-based motion to window operations:
//  - Snap-back when dragged past bounds
//  - Smooth minimize/restore transitions
//  - Bouncy window spawn
//
//  Uses damped spring formula:
//    x(t) = A * e^(-damping * t) * cos(frequency * t)
// ============================================================

export default class SpringPhysics {

    constructor() {
        this.animations = new Map()
        this.running = false
    }

    // ---- ANIMATE A PROPERTY ----
    // element:  HTMLElement
    // prop:     CSS property or custom handler
    // from:     start value
    // to:       target value
    // config:   { stiffness, damping, mass }
    animate(id, element, props, config = {}) {
        const {
            stiffness = 170,
            damping = 26,
            mass = 1,
            onUpdate = null,
            onComplete = null,
        } = config

        // Cancel existing animation on same id
        this.animations.delete(id)

        const springs = {}
        for (const [prop, { from, to }] of Object.entries(props)) {
            springs[prop] = {
                current: from,
                target: to,
                velocity: 0,
            }
        }

        this.animations.set(id, {
            element,
            springs,
            stiffness,
            damping,
            mass,
            onUpdate,
            onComplete,
        })

        if (!this.running) {
            this.running = true
            this.tick()
        }

        return id
    }

    // ---- PHYSICS TICK ----
    tick() {
        const dt = 1 / 60 // Fixed timestep
        let anyActive = false

        for (const [id, anim] of this.animations) {
            let allSettled = true

            for (const [prop, spring] of Object.entries(anim.springs)) {
                // Spring force
                const displacement = spring.current - spring.target
                const springForce = -anim.stiffness * displacement
                const dampingForce = -anim.damping * spring.velocity

                const acceleration = (springForce + dampingForce) / anim.mass
                spring.velocity += acceleration * dt
                spring.current += spring.velocity * dt

                // Check if settled
                if (Math.abs(displacement) > 0.01 || Math.abs(spring.velocity) > 0.01) {
                    allSettled = false
                } else {
                    spring.current = spring.target
                    spring.velocity = 0
                }
            }

            // Apply values
            if (anim.onUpdate) {
                const values = {}
                for (const [prop, spring] of Object.entries(anim.springs)) {
                    values[prop] = spring.current
                }
                anim.onUpdate(anim.element, values)
            } else {
                // Default: apply as CSS transform
                this.applyDefaults(anim)
            }

            if (allSettled) {
                if (anim.onComplete) anim.onComplete()
                this.animations.delete(id)
            } else {
                anyActive = true
            }
        }

        if (anyActive || this.animations.size > 0) {
            requestAnimationFrame(() => this.tick())
        } else {
            this.running = false
        }
    }

    applyDefaults(anim) {
        const el = anim.element
        if (!el) return

        for (const [prop, spring] of Object.entries(anim.springs)) {
            switch (prop) {
                case 'x':
                    el.style.left = `${spring.current}px`
                    break
                case 'y':
                    el.style.top = `${spring.current}px`
                    break
                case 'width':
                    el.style.width = `${spring.current}px`
                    break
                case 'height':
                    el.style.height = `${spring.current}px`
                    break
                case 'scale':
                    el.style.transform = `scale(${spring.current})`
                    break
                case 'opacity':
                    el.style.opacity = spring.current
                    break
            }
        }
    }

    // ---- CANCEL ----
    cancel(id) {
        this.animations.delete(id)
    }

    cancelAll() {
        this.animations.clear()
        this.running = false
    }

    // ---- PRESETS ----

    // Bouncy window spawn
    static SPAWN = { stiffness: 200, damping: 20, mass: 0.8 }

    // Smooth window maximize/restore
    static RESIZE = { stiffness: 250, damping: 28, mass: 1 }

    // Snappy snap-back
    static SNAP = { stiffness: 300, damping: 30, mass: 0.6 }

    // Gentle float
    static GENTLE = { stiffness: 120, damping: 22, mass: 1.2 }
}