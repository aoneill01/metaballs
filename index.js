import init, { MetaballState } from './pkg/metaballs.js'
import {
  createShader,
  createProgram,
  initialCircles,
  createPoints,
  update,
  generateTriangles,
  parseColor,
} from './helpers.js'

const CELL_COUNT = 100

class Metaballs extends HTMLElement {
  constructor() {
    super()

    this.circles = initialCircles
    this.cursor = { x: 0, y: 0 }
    // this.circles.unshift({ ...this.cursor, r: 0.2 })
    this.points = createPoints(CELL_COUNT)
    this.weights = []
    this.background = [0.447, 0.035, 0.718, 1]
    this.glow = [0.969, 0.145, 0.522, 1.0]
    this.blob = [0.298, 0.788, 0.941, 1.0]
    this.speed = 1.0
    this.mouse = false

    const shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = `
      canvas {
        left: 0;
        position: fixed;
        top: 0;
        width: 100vmax;
      }
    `

    this.canvas = document.createElement('canvas')
    this.canvas.width = 800
    this.canvas.height = 800
    this.canvas.addEventListener('mousemove', this.mouseMove.bind(this))

    shadow.appendChild(style)
    shadow.appendChild(this.canvas)

    this.initWebgl()
    this.metaballState = MetaballState.new()

    this.draw = this.draw.bind(this)
    window.requestAnimationFrame(this.draw)
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

  uniform vec4 u_background;
  uniform vec4 u_glow;
  uniform vec4 u_blob;

  void main() {
    float blur_delta = 0.01;
    if (v_weight < 1.0) {
      float factor = v_weight - .5;
      if (factor < 0.0) factor = 0.0;
      factor = 2.0 * factor;
      gl_FragColor = u_glow * factor + u_background * (1.0 - factor);
    } else if (v_weight < 1.0 + blur_delta) {
      float factor = (v_weight - 1.0) / blur_delta;
      gl_FragColor = u_blob * factor + u_glow * (1.0 - factor);
    } else {
      gl_FragColor = u_blob;
    }
  }`

    const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource)

    this.program = createProgram(this.gl, vertexShader, fragmentShader)

    this.backgroundUnfiormLocation = this.gl.getUniformLocation(this.program, 'u_background')
    this.glowUnfiormLocation = this.gl.getUniformLocation(this.program, 'u_glow')
    this.blobUnfiormLocation = this.gl.getUniformLocation(this.program, 'u_blob')

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position')
    this.positions = generateTriangles(CELL_COUNT)
    this.positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW)

    this.weightAttributeLocation = this.gl.getAttribLocation(this.program, 'a_weight')
    this.weightBuffer = this.gl.createBuffer()
  }

  draw(timestamp) {
    if (this.previous === undefined) this.previous = timestamp
    let elapsed = timestamp - this.previous
    if (!elapsed || elapsed > 50) elapsed = 50
    update(elapsed * this.speed, this.points, this.circles)
    if (this.mouse) {
      this.circles[0].x = this.cursor.x
      this.circles[0].y = this.cursor.y
    }
    this.previous = timestamp

    this.resize()

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

    this.gl.useProgram(this.program)

    this.gl.uniform4fv(this.backgroundUnfiormLocation, this.background)
    this.gl.uniform4fv(this.glowUnfiormLocation, this.glow)
    this.gl.uniform4fv(this.blobUnfiormLocation, this.blob)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.weightBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.metaballState.update_weights(this.circles), this.gl.STATIC_DRAW)

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

  mouseMove(event) {
    const rect = this.canvas.getBoundingClientRect()

    this.cursor = {
      y: -1 + 2 * ((event.clientX - rect.left) / this.canvas.clientWidth),
      x: -1 + -2 * ((event.clientY - rect.top) / this.canvas.clientHeight),
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

  static get observedAttributes() {
    return ['background', 'glow', 'blob', 'speed', 'mouse']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'speed':
        this.speed = newValue
        break
      case 'mouse':
        this.mouse = !!newValue
        break
      default:
        this[name] = parseColor(newValue)
    }
  }
}

init().then((wasm) => {
  customElements.define('meta-balls', Metaballs)
})
