export function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader
  }

  console.error(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program
  }

  console.error(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

export function createPoints(cellCount) {
  return Array.from({ length: cellCount + 1 }, () => new Array(cellCount + 1).fill(0))
}

export function generateTriangles(cellCount) {
  const squareSize = 2 / cellCount
  const result = []

  for (let i = 0; i < cellCount; i++) {
    for (let j = 0; j < cellCount; j++) {
      result.push(
        -1.0 + i * squareSize,
        -1.0 + j * squareSize,
        -1.0 + (i + 1) * squareSize,
        -1.0 + j * squareSize,
        -1.0 + (i + 1) * squareSize,
        -1.0 + (j + 1) * squareSize,
        -1.0 + i * squareSize,
        -1.0 + j * squareSize,
        -1.0 + i * squareSize,
        -1.0 + (j + 1) * squareSize,
        -1.0 + (i + 1) * squareSize,
        -1.0 + (j + 1) * squareSize
      )
    }
  }

  return result
}

export function update(elapsed, points, circles) {
  const squareSize = 2 / (points.length - 1)

  circles.forEach((circle) => {
    const force = circles
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
          const strength = (-0.000001 * circle.r * adjusted.r) / (distance * distance)
          return {
            x: acc.x + (strength * (adjusted.x - circle.x)) / distance,
            y: acc.y + (strength * (adjusted.y - circle.y)) / distance,
          }
        },
        { x: 0, y: 0 }
      )
    circle.dx += force.x * elapsed
    circle.dy += force.y * elapsed
    if (circle.dx > 0.0005) circle.dx = 0.0005
    if (circle.dx < -0.0005) circle.dx = -0.0005
    if (circle.dy > 0.0005) circle.dy = 0.0005
    if (circle.dy < -0.0005) circle.dy = -0.0005

    circle.x += circle.dx * elapsed
    if (circle.x < -1) circle.x = 1
    if (circle.x > 1) circle.x = -1

    circle.y += circle.dy * elapsed
    if (circle.y < -1) circle.y = 1
    if (circle.y > 1) circle.y = -1
  })
}

export function parseColor(rgb) {
  return [
    parseInt(rgb.substring(1, 3), 16) / 255,
    parseInt(rgb.substring(3, 5), 16) / 255,
    parseInt(rgb.substring(5, 7), 16) / 255,
    1.0,
  ]
}

export const initialCircles = [
  {
    x: 0.5,
    y: 0.2,
    r: 0.29,
    dx: 0.00002,
    dy: 0.00006,
  },
  {
    x: -0.2,
    y: 0.1,
    r: 0.35,
    dx: -0.00005,
    dy: 0.00008,
  },
  {
    x: -0.2,
    y: -0.4,
    r: 0.25,
    dx: -0.00002,
    dy: -0.0001,
  },
  {
    x: 0,
    y: 0,
    r: 0.22,
    dx: -0.0002,
    dy: 0.0001,
  },
]
