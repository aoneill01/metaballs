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

export function getPositions(points) {
  const squareSize = 2 / (points.length - 1)
  const result = []
  for (let row = 0; row < points.length - 1; row++) {
    for (let col = 0; col < points[0].length - 1; col++) {
      result.push(...positionsForCell(row, col, squareSize, points))
    }
  }
  return result
}

function positionsForCell(row, col, squareSize, points) {
  const topLeft = { x: squareSize * col - 1, y: squareSize * row - 1 }
  const topRight = { x: squareSize * (col + 1) - 1, y: squareSize * row - 1 }
  const bottomRight = { x: squareSize * (col + 1) - 1, y: squareSize * (row + 1) - 1 }
  const bottomLeft = { x: squareSize * col - 1, y: squareSize * (row + 1) - 1 }

  const a = {
    x: squareSize * (col + interpolate(points[row][col], points[row][col + 1])) - 1,
    y: squareSize * row - 1,
  }
  const b = {
    x: squareSize * (col + 1) - 1,
    y: squareSize * (row + interpolate(points[row][col + 1], points[row + 1][col + 1])) - 1,
  }
  const c = {
    x: squareSize * (col + interpolate(points[row + 1][col], points[row + 1][col + 1])) - 1,
    y: squareSize * (row + 1) - 1,
  }
  const d = {
    x: squareSize * col - 1,
    y: squareSize * (row + interpolate(points[row][col], points[row + 1][col])) - 1,
  }
  let state = getState(points[row][col], points[row][col + 1], points[row + 1][col + 1], points[row + 1][col])

  switch (state) {
    case 1:
      return triangle(c, d, bottomLeft)
    case 2:
      return triangle(b, c, bottomRight)
    case 3:
      return [...triangle(b, d, bottomLeft), ...triangle(bottomLeft, bottomRight, b)]
    case 4:
      return triangle(a, b, topRight)
    case 5:
      return [...triangle(a, d, topLeft), ...triangle(b, c, bottomRight)]
    case 6:
      return [...triangle(a, c, bottomRight), ...triangle(bottomRight, topRight, a)]
    case 7:
      return [
        ...triangle(a, d, bottomLeft),
        ...triangle(bottomLeft, bottomRight, topRight),
        ...triangle(topRight, bottomLeft, a),
      ]
    case 8:
      return triangle(a, d, topLeft)
    case 9:
      return [...triangle(a, c, bottomLeft), ...triangle(bottomLeft, topLeft, a)]
    case 10:
      return [...triangle(a, b, topRight), ...triangle(c, d, bottomLeft)]
    case 11:
      return [
        ...triangle(a, b, bottomRight),
        ...triangle(bottomRight, bottomLeft, topLeft),
        ...triangle(topLeft, bottomRight, a),
      ]
    case 12:
      return [...triangle(b, d, topLeft), ...triangle(topLeft, topRight, b)]
    case 13:
      return [
        ...triangle(b, c, bottomLeft),
        ...triangle(bottomLeft, topLeft, topRight),
        ...triangle(topRight, bottomLeft, b),
      ]
    case 14:
      return [
        ...triangle(c, d, topLeft),
        ...triangle(topLeft, topRight, bottomRight),
        ...triangle(bottomRight, topLeft, c),
      ]
    case 15:
      return [...triangle(topLeft, topRight, bottomRight), ...triangle(bottomRight, bottomLeft, topLeft)]
  }
  return []
}

function getState(a, b, c, d) {
  return getBit(a) * 8 + getBit(b) * 4 + getBit(c) * 2 + getBit(d) * 1
}

function getBit(value) {
  return value > 1 ? 1 : 0
}

function triangle(a, b, c) {
  return [a.x, a.y, b.x, b.y, c.x, c.y]
}

function interpolate(first, second) {
  return (1 - first) / (second - first)
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
