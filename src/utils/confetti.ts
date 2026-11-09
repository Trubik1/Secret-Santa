/**
 * Zero-dependency celebratory confetti burst for Telegram Mini Apps
 */
export function fireConfetti() {
  if (typeof document === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '999999'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    document.body.removeChild(canvas)
    return
  }

  const dpr = window.devicePixelRatio || 1
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)

  const colors = ['#c4457b', '#f43f5e', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
  const particleCount = 75
  const particles: Array<{
    x: number
    y: number
    size: number
    color: string
    vx: number
    vy: number
    rotation: number
    vRot: number
    opacity: number
  }> = []

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 80,
      y: height * 0.45 + (Math.random() - 0.5) * 50,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 15,
      opacity: 1,
    })
  }

  let animationFrame: number
  const gravity = 0.45
  const friction = 0.98

  const render = () => {
    ctx.clearRect(0, 0, width, height)

    let aliveCount = 0
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += gravity
      p.vx *= friction
      p.vy *= friction
      p.rotation += p.vRot
      p.opacity -= 0.012

      if (p.opacity > 0 && p.y < height + 50) {
        aliveCount++
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7)
        ctx.restore()
      }
    }

    if (aliveCount > 0) {
      animationFrame = requestAnimationFrame(render)
    } else {
      cancelAnimationFrame(animationFrame)
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    }
  }

  render()
}
