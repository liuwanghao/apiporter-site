const MODEL_ROWS = [
  ['openai.svg', 'GPT'],
  ['anthropic.svg', 'CLAUDE'],
  ['googlegemini.svg', 'GEMINI'],
  ['deepseek.svg', 'DEEPSEEK'],
  ['qwen.svg', 'QWEN'],
  ['x.svg', 'GROK'],
  ['meta.svg', 'LLAMA'],
  ['mistralai.svg', 'MISTRAL'],
  ['moonshotai.svg', 'KIMI'],
  ['perplexity.svg', 'SONAR'],
  ['nvidia.svg', 'NEMOTRON'],
  ['amazonwebservices.svg', 'NOVA'],
]

const SOURCES = ['WEB', 'APP', 'SDK', 'SERVER', 'AGENT', 'WORKFLOW']
const SOURCE_BASE_OFFSETS = [-125, -75, -25, 25, 75, 125]

export class CloudbridgeRouteEffect {
  constructor(root, options = {}) {
    if (!(root instanceof HTMLElement)) {
      throw new TypeError('CloudbridgeRouteEffect needs a DOM element.')
    }
    this.root = root
    this.options = {
      theme: 'auto',
      assetBase: './assets',
      showMeta: true,
      showFooter: true,
      ...options,
    }
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    this.width = 0
    this.height = 0
    this.dpr = 1
    this.lanes = []
    this.particles = []
    this.seed = 42871
    this.gatewayAt = 0.4
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.systemTheme = matchMedia('(prefers-color-scheme: dark)')
    this.pageVisible = document.visibilityState !== 'hidden'
    this.isIntersecting = true
    this.renderFrame = null
    this.resizeFrame = null
    this.layoutBounds = null
    this.frameTime = null
    this.frameGate = 0
    this.frameCenter = 0
    this.buildMarkup()
    this.setTheme(this.options.theme)
    this.bind()
    this.resize()
    this.render()
  }

  buildMarkup() {
    this.root.classList.add('cb-route-effect')
    this.root.innerHTML = `
      <canvas class="cb-route-canvas" aria-hidden="true"></canvas>
      <div class="cb-route-meta" aria-hidden="true"><i></i>CLIENT REQUEST / MULTI-MODEL ROUTING</div>
      <div class="cb-route-inputs" aria-hidden="true">
        <b>CLIENT REQUEST</b>
        ${SOURCES.map((source) => `<span data-source="${source}">${source}</span>`).join('')}
      </div>
      <div class="cb-route-models" aria-hidden="true">
        ${MODEL_ROWS.map(([icon, name], index) => `<span style="--y:${6 + index * 7.8}%"><img src="${this.asset(icon)}" alt=""><b>${name}</b></span>`).join('')}
      </div>
      <div class="cb-route-relay" aria-hidden="true">
        <span class="cb-route-brand"><img src="${this.asset('cloudbridge-mark.png')}" alt=""></span>
        <span class="cb-route-endpoint">
          <small>UNIFIED ENDPOINT</small>
          <span class="cb-route-request"><b>POST</b><span>/v1/chat/completions</span></span>
        </span>
      </div>
      <div class="cb-route-copy" aria-hidden="true">
        <span class="cb-route-group"><b>INPUT MODALITIES</b><i>TEXT</i><i>VISION</i><i>VOICE</i><i>EMBEDDING</i></span>
        <span class="cb-route-group"><b>CAPABILITIES</b><i>REASONING</i><i>SEARCH</i><i>TOOL CALLING</i></span>
      </div>
    `
    this.canvas = this.root.querySelector('.cb-route-canvas')
    this.stage = this.root
    this.ctx = this.canvas.getContext('2d')
    this.relay = this.root.querySelector('.cb-route-relay')
    this.inputs = [...this.root.querySelectorAll('.cb-route-inputs span')]
    this.root.querySelector('.cb-route-meta').hidden = !this.options.showMeta
    this.root.querySelector('.cb-route-copy').hidden = !this.options.showFooter
  }

  asset(name) {
    return `${this.options.assetBase.replace(/\/$/, '')}/${name === 'cloudbridge-mark.png' ? name : `models/${name}`}`
  }

  setTheme(theme) {
    this.options.theme = theme
    let next = theme
    if (theme === 'auto') {
      next = this.systemTheme.matches ? 'dark' : 'light'
    }
    this.root.dataset.theme = next === 'dark' ? 'dark' : 'light'
    if (this.reduceMotion) this.render(performance.now())
  }

  random() {
    this.seed |= 0
    this.seed = (this.seed + 0x6d2b79f5) | 0
    let value = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  bezier(a, b, c, d, t) {
    const mt = 1 - t
    return (
      mt * mt * mt * a +
      3 * mt * mt * t * b +
      3 * mt * t * t * c +
      t * t * t * d
    )
  }

  baseGatePosition() {
    return this.width < 600 ? 0.46 : 0.43
  }
  gatePosition() {
    return (
      this.baseGatePosition() +
      this.pointer.x * (this.width < 600 ? 0.035 : 0.055)
    )
  }
  centerLine(time) {
    return (
      this.height * 0.5 +
      this.pointer.y * this.height * (this.width < 600 ? 0.038 : 0.046) +
      Math.sin(time * 0.00028) * this.height * 0.004
    )
  }

  point(lane, t, time) {
    const gate =
      time === this.frameTime ? this.frameGate : this.gatePosition()
    const center =
      time === this.frameTime ? this.frameCenter : this.centerLine(time)
    if (t <= this.gatewayAt) {
      const n = t / this.gatewayAt
      const startX = this.width < 600 ? 72 : 108
      const drift =
        Math.sin(time * 0.00022 + lane.phase) *
        this.height *
        0.004 *
        (1 - Math.max(0, n))
      return {
        x: this.bezier(
          startX,
          startX + this.width * 0.1,
          this.width * 0.3,
          this.width * gate,
          n
        ),
        y: this.bezier(
          this.height * 0.5 + lane.inputOffset + drift,
          this.height * 0.5 + lane.inputOffset * 0.7,
          center + lane.offset * 0.12,
          center,
          n
        ),
      }
    }
    const n = (t - this.gatewayAt) / (1 - this.gatewayAt)
    const endX = lane.endX ?? this.width * 0.9
    const bendX = Math.max(this.width * (gate + 0.12), endX - this.width * 0.13)
    return {
      x: this.bezier(this.width * gate, this.width * 0.59, bendX, endX, n),
      y: this.bezier(
        center,
        center + lane.offset,
        lane.end - lane.sway,
        lane.end,
        n
      ),
    }
  }

  build() {
    const sourceScale = Math.min(1, this.height / 610)
    this.sourceOffsets = SOURCE_BASE_OFFSETS.map((value) => value * sourceScale)
    this.inputs.forEach((node, index) => {
      node.style.setProperty('--iy', `${this.sourceOffsets[index]}px`)
    })
    const stageBounds = this.stage.getBoundingClientRect()
    const modelEndXs = [
      ...this.root.querySelectorAll('.cb-route-models span'),
    ].map((node) => {
      const bounds = node.getBoundingClientRect()
      return Math.min(
        this.width - 8,
        Math.max(this.width * 0.68, bounds.left - stageBounds.left + 2)
      )
    })
    this.lanes = Array.from({ length: 72 }, (_, index) => {
      const model = index % MODEL_ROWS.length
      const strand = Math.floor(index / MODEL_ROWS.length) - 2.5
      const source =
        Math.floor(index / MODEL_ROWS.length) % this.sourceOffsets.length
      return {
        end: this.height * (0.06 + model * 0.078),
        endX: modelEndXs[model] ?? this.width * 0.9,
        sway:
          (this.random() - 0.5) * this.height * 0.045 +
          strand * this.height * 0.006,
        offset: strand * this.height * 0.012,
        inputOffset:
          this.sourceOffsets[source] +
          (this.random() - 0.5) * this.height * 0.008,
        phase: this.random() * Math.PI * 2,
        orange: index % 13 === 0 || index % 17 === 0,
      }
    })
    this.particles = Array.from(
      { length: this.width < 600 ? 72 : 120 },
      (_, index) => {
        const laneIndex = index % this.lanes.length
        return {
          lane: laneIndex,
          t: this.random(),
          speed: 0.000022 + this.random() * 0.000028,
          tail: 0.014 + this.random() * 0.032,
          width: 0.6 + this.random() * 1.5,
          alpha: 0.28 + this.random() * 0.62,
          orange: this.lanes[laneIndex].orange || this.random() > 0.88,
          arrow: index % 19 === 0,
        }
      }
    )
  }

  resize() {
    const bounds = this.stage.getBoundingClientRect()
    this.layoutBounds = bounds
    this.width = Math.max(1, bounds.width)
    this.height = Math.max(1, bounds.height)
    this.dpr = Math.min(devicePixelRatio || 1, this.width < 600 ? 1.25 : 1.5)
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.build()
  }

  drawPath(lane, time, alpha, lineWidth, color) {
    const ctx = this.ctx
    ctx.beginPath()
    for (let step = 0; step <= 34; step++) {
      const p = this.point(
        lane,
        this.gatewayAt + ((1 - this.gatewayAt) * step) / 34,
        time
      )
      if (step === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.strokeStyle = color.replace('ALPHA', alpha)
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  render(time = 0) {
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.035
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.035
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.save()
    const isDark = this.root.dataset.theme === 'dark'
    const neutral = isDark ? '242,239,231' : '38,36,32'
    this.frameTime = time
    this.frameGate = this.gatePosition()
    this.frameCenter = this.centerLine(time)
    ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    this.lanes.forEach((lane, index) => {
      const orange = lane.orange
      let pathAlpha = isDark ? 0.07 : 0.1
      if (orange) pathAlpha = 0.16
      this.drawPath(
        lane,
        time,
        pathAlpha,
        orange ? 1.05 : 0.65,
        orange ? 'rgba(255,90,31,ALPHA)' : `rgba(${neutral},ALPHA)`
      )
      if (index % 10 === 0) {
        this.drawPath(
          lane,
          time,
          isDark ? 0.026 : 0.018,
          6,
          orange ? 'rgba(255,90,31,ALPHA)' : `rgba(${neutral},ALPHA)`
        )
      }
    })
    const gateX = this.width * this.frameGate
    const outputY = this.frameCenter
    this.stage.style.setProperty(
      '--flow-offset-x',
      `${gateX - this.width * this.baseGatePosition()}px`
    )
    this.stage.style.setProperty(
      '--flow-offset-y',
      `${outputY - this.height * 0.5}px`
    )
    const inputFade = ctx.createLinearGradient(0, 0, gateX, 0)
    inputFade.addColorStop(0, `rgba(${neutral},0)`)
    inputFade.addColorStop(0.25, `rgba(${neutral},${isDark ? 0.2 : 0.16})`)
    inputFade.addColorStop(1, `rgba(${neutral},${isDark ? 0.54 : 0.4})`)
    this.sourceOffsets.forEach((offset, index) => {
      const guide = {
        phase: index * 2.1,
        inputOffset: offset,
        offset: 0,
        end: outputY,
        sway: 0,
      }
      ctx.beginPath()
      for (let step = 0; step <= 24; step++) {
        const p = this.point(guide, (this.gatewayAt * step) / 24, time)
        if (step === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.strokeStyle = inputFade
      ctx.lineWidth = index === 1 ? 1 : 0.75
      ctx.stroke()
    })
    this.particles.forEach((particle) => {
      if (!this.reduceMotion) {
        particle.t += particle.speed * 16.67
        if (particle.t > 1) particle.t = -0.08 - this.random() * 0.12
      }
      if (particle.t < 0) return
      const lane = this.lanes[particle.lane]
      const head = Math.min(1, Math.max(-0.08, particle.t))
      const tail = Math.max(-0.08, head - particle.tail)
      const start = this.point(lane, tail, time)
      const end = this.point(lane, head, time)
      const rgb = particle.orange ? '255,90,31' : neutral
      const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
      gradient.addColorStop(0, `rgba(${rgb},0)`)
      gradient.addColorStop(0.65, `rgba(${rgb},${particle.alpha * 0.45})`)
      gradient.addColorStop(1, `rgba(${rgb},${particle.alpha})`)
      ctx.beginPath()
      for (let step = 0; step <= 9; step++) {
        const p = this.point(lane, tail + ((head - tail) * step) / 9, time)
        if (step === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.strokeStyle = gradient
      ctx.lineWidth = particle.width
      const shadowColor = particle.orange ? 'rgba(255,80,20,.7)' : 'transparent'
      const shadowBlur = particle.orange ? 9 : 0
      ctx.shadowColor = shadowColor
      ctx.shadowBlur = shadowBlur
      ctx.stroke()
      if (particle.arrow && head > this.gatewayAt + 0.08 && head < 0.985) {
        const before = this.point(
          lane,
          Math.max(this.gatewayAt, head - 0.008),
          time
        )
        const angle = Math.atan2(end.y - before.y, end.x - before.x)
        const size = this.width < 600 ? 3 : 3.6
        ctx.save()
        ctx.translate(end.x, end.y)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(-size, -size * 0.65)
        ctx.lineTo(0, 0)
        ctx.lineTo(-size, size * 0.65)
        ctx.strokeStyle = `rgba(${rgb},${Math.min(1, particle.alpha + 0.12)})`
        ctx.lineWidth = Math.max(1, particle.width * 0.72)
        ctx.shadowBlur = particle.orange ? 7 : 0
        ctx.stroke()
        ctx.restore()
      }
    })
    ctx.shadowBlur = 0
    const slit = ctx.createLinearGradient(
      0,
      outputY - this.height * 0.16,
      0,
      outputY + this.height * 0.16
    )
    slit.addColorStop(0, 'rgba(255,90,31,0)')
    slit.addColorStop(0.45, 'rgba(255,90,31,.1)')
    slit.addColorStop(
      0.5,
      isDark ? 'rgba(255,220,190,.72)' : 'rgba(255,90,31,.58)'
    )
    slit.addColorStop(0.55, 'rgba(255,90,31,.1)')
    slit.addColorStop(1, 'rgba(255,90,31,0)')
    ctx.fillStyle = slit
    ctx.fillRect(
      gateX - 0.7,
      outputY - this.height * 0.17,
      1.4,
      this.height * 0.34
    )
    ctx.restore()
    this.scheduleRender()
  }

  scheduleRender() {
    if (
      this.reduceMotion ||
      !this.pageVisible ||
      !this.isIntersecting ||
      this.renderFrame !== null
    ) {
      return
    }
    this.renderFrame = requestAnimationFrame((nextTime) => {
      this.renderFrame = null
      this.render(nextTime)
    })
  }

  updateAnimationState() {
    const shouldAnimate =
      !this.reduceMotion && this.pageVisible && this.isIntersecting
    if (!shouldAnimate && this.renderFrame !== null) {
      cancelAnimationFrame(this.renderFrame)
      this.renderFrame = null
      return
    }
    if (shouldAnimate) this.scheduleRender()
  }

  bind() {
    this.onPointerMove = (event) => {
      const bounds = this.layoutBounds || this.stage.getBoundingClientRect()
      this.pointer.targetX =
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      this.pointer.targetY =
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    }
    this.onPointerLeave = () => {
      this.pointer.targetX = 0
      this.pointer.targetY = 0
    }
    this.stage.addEventListener('pointermove', this.onPointerMove)
    this.stage.addEventListener('pointerleave', this.onPointerLeave)
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeFrame !== null) return
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = null
        this.resize()
      })
    })
    this.resizeObserver.observe(this.stage)
    this.onVisibilityChange = () => {
      this.pageVisible = document.visibilityState !== 'hidden'
      this.updateAnimationState()
    }
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    if (typeof IntersectionObserver !== 'undefined') {
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        this.isIntersecting = entry?.isIntersecting ?? true
        this.updateAnimationState()
      })
      this.visibilityObserver.observe(this.stage)
    }
    this.onSystemTheme = () => {
      if (this.options.theme === 'auto') this.setTheme('auto')
    }
    this.systemTheme.addEventListener('change', this.onSystemTheme)
  }

  destroy() {
    if (this.renderFrame !== null) cancelAnimationFrame(this.renderFrame)
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame)
    this.renderFrame = null
    this.resizeFrame = null
    this.stage.removeEventListener('pointermove', this.onPointerMove)
    this.stage.removeEventListener('pointerleave', this.onPointerLeave)
    this.resizeObserver.disconnect()
    this.visibilityObserver?.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.systemTheme.removeEventListener('change', this.onSystemTheme)
    this.root.innerHTML = ''
  }
}
