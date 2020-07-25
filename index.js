import { createShader, createProgram, initialCircles, getPositions } from './helpers.js'

const CELL_COUNT = 80
const SQUARE_SIZE = 2 / CELL_COUNT

class Metaballs extends HTMLElement {
  canvas
  gl
  program
  positionAttributeLocation
  positionBuffer
  circles = initialCircles
  points = Array.from({ length: CELL_COUNT + 1 }, () => new Array(CELL_COUNT + 1).fill(0))
  previous

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    this.canvas = document.createElement('canvas')
    this.canvas.width = 800
    this.canvas.height = 800
    shadow.appendChild(this.canvas)

    this.initWebgl()
  }

  initWebgl() {
    this.gl = this.canvas.getContext('webgl')

    const vertexShaderSource = `
  // an attribute will receive data from a buffer
  attribute vec4 a_position;

  // all shaders have a main function
  void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = a_position;
  }`

    const fragmentShaderSource = `
  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default
  precision mediump float;

  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    gl_FragColor = vec4(0.008, 0.502, 0.565, 1);
  }`

    const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource)

    this.program = createProgram(this.gl, vertexShader, fragmentShader)

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position')

    this.positionBuffer = this.gl.createBuffer()

    this.draw = this.draw.bind(this)
    window.requestAnimationFrame(this.draw)
  }

  draw(timestamp) {
    if (this.previous === undefined) this.previous = timestamp
    const elapsed = timestamp - this.previous
    if (elapsed) this.updatePoints(elapsed)
    this.previous = timestamp

    this.resize()

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

    this.gl.clearColor(0.02, 0.4, 0.553, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    this.gl.useProgram(this.program)

    this.gl.enableVertexAttribArray(this.positionAttributeLocation)

    const positions = getPositions(this.points)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)
    const size = 2
    const type = this.gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    this.gl.vertexAttribPointer(this.positionAttributeLocation, size, type, normalize, stride, offset)

    this.gl.drawArrays(this.gl.TRIANGLES, 0, positions.length / 2)

    window.requestAnimationFrame(this.draw)
  }

  updatePoints(elapsed) {
    this.circles.forEach((circle) => {
      const force = this.circles
        .filter((other) => other !== circle)
        .reduce(
          (acc, other) => {
            const adjusted = { ...other }
            let xDiff = circle.x - other.x
            if (xDiff > 1) adjusted.x += 2
            if (xDiff < -1) adjusted.x -= 2
            let yDiff = circle.y - other.y
            if (yDiff > 1) adjusted.y += 2
            if (yDiff < -1) adjusted.y -= 2
            const distance = Math.sqrt(Math.pow(circle.x - adjusted.x, 2) + Math.pow(circle.y - adjusted.y, 2))
            const strength = (-0.00001 * circle.r * adjusted.r) / (distance * distance)
            return {
              x: acc.x + (strength * (adjusted.x - circle.x)) / distance,
              y: acc.y + (strength * (adjusted.y - circle.y)) / distance,
            }
          },
          { x: 0, y: 0 }
        )
      circle.dx += force.x
      circle.dy += force.y
      if (circle.dx > 0.0005) circle.dx = 0.0005
      if (circle.dx < -0.0005) circle.dx = -0.0005
      if (circle.dy > 0.0005) circle.dy = 0.0005
      if (circle.dy < -0.0005) circle.dy = -0.0005

      circle.x += elapsed * circle.dx
      if (circle.x < -1) circle.x = 1
      if (circle.x > 1) circle.x = -1

      circle.y += elapsed * circle.dy
      if (circle.y < -1) circle.y = 1
      if (circle.y > 1) circle.y = -1
    })

    for (let row = 0; row < this.points.length; row++) {
      for (let col = 0; col < this.points[0].length; col++) {
        const value = this.circles.reduce((sum, { x, y, r }) => {
          let xDiff = col * SQUARE_SIZE - 1 - x
          if (xDiff > 1) xDiff -= 2
          if (xDiff < -1) xDiff += 2
          let yDiff = row * SQUARE_SIZE - 1 - y
          if (yDiff > 1) yDiff -= 2
          if (yDiff < -1) yDiff += 2
          return sum + (r * r) / (Math.pow(xDiff, 2) + Math.pow(yDiff, 2))
        }, 0)
        this.points[row][col] = value
      }
    }
  }

  resize() {
    var displayWidth = this.canvas.clientWidth
    var displayHeight = this.canvas.clientHeight

    if (this.canvas.width != displayWidth || this.canvas.height != displayHeight) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
    }
  }
}

customElements.define('meta-balls', Metaballs)
