import {
  createShader,
  createProgram,
  initialCircles,
  createPoints,
  update,
  generateTriangles,
  generateWeights,
} from './helpers.js'

const CELL_COUNT = 100

class Metaballs extends HTMLElement {
  constructor() {
    super()

    this.circles = initialCircles
    this.points = createPoints(CELL_COUNT)

    const shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = `
      canvas {
        width: 100vmax;
      }
    `

    this.canvas = document.createElement('canvas')
    this.canvas.width = 800
    this.canvas.height = 800

    shadow.appendChild(style)
    shadow.appendChild(this.canvas)

    this.initWebgl()
  }

  initWebgl() {
    this.gl = this.canvas.getContext('webgl')

    const vertexShaderSource = `
  attribute vec4 a_position;
  attribute float a_weight;

  varying mediump float v_weight;

  void main() {
    gl_Position = a_position;
    v_weight = a_weight;
  }`

    const fragmentShaderSource = `
  precision mediump float;

  varying mediump float v_weight;

  void main() {
    if (v_weight < 1.0) {
      float factor = v_weight - .5;
      if (factor < 0.0) factor = 0.0;
      factor = 2.0 * factor;
      gl_FragColor = vec4(0.969, 0.145, 0.522, 1.0) * factor + vec4(0.447, 0.035, 0.718, 1) * (1.0 - factor);
    } else {
      gl_FragColor = vec4(0.298, 0.788, 0.941, 1.0);
    }
  }`

    const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource)

    this.program = createProgram(this.gl, vertexShader, fragmentShader)

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position')
    this.positions = generateTriangles(CELL_COUNT)
    this.positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW)

    this.weightAttributeLocation = this.gl.getAttribLocation(this.program, 'a_weight')
    this.weightBuffer = this.gl.createBuffer()

    this.draw = this.draw.bind(this)
    window.requestAnimationFrame(this.draw)
  }

  draw(timestamp) {
    if (this.previous === undefined) this.previous = timestamp
    let elapsed = timestamp - this.previous
    if (!elapsed || elapsed > 50) elapsed = 50
    update(elapsed, this.points, this.circles)
    this.previous = timestamp

    this.resize()

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

    this.gl.clearColor(0.02, 0.4, 0.553, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    this.gl.useProgram(this.program)

    const weights = generateWeights(this.points)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.weightBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(weights), this.gl.STATIC_DRAW)

    {
      const numComponents = 2
      const type = this.gl.FLOAT
      const normalize = false
      const stride = 0
      const offset = 0
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
      this.gl.vertexAttribPointer(this.positionAttributeLocation, numComponents, type, normalize, stride, offset)
      this.gl.enableVertexAttribArray(this.positionAttributeLocation)
    }

    {
      const numComponents = 1
      const type = this.gl.FLOAT
      const normalize = false
      const stride = 0
      const offset = 0
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.weightBuffer)
      this.gl.vertexAttribPointer(this.weightAttributeLocation, numComponents, type, normalize, stride, offset)
      this.gl.enableVertexAttribArray(this.weightAttributeLocation)
    }

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.positions.length / 2)

    window.requestAnimationFrame(this.draw)
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
