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

export function generateWeights(points, weights) {
  let i = 0
  for (let row = 0; row < points.length - 1; row++) {
    for (let col = 0; col < points[row].length - 1; col++) {
      weights[i++] = points[row][col]
      weights[i++] = points[row + 1][col]
      weights[i++] = points[row + 1][col + 1]
      weights[i++] = points[row][col]
      weights[i++] = points[row][col + 1]
      weights[i++] = points[row + 1][col + 1]
    }
  }
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

  for (let row = 0; row < points.length; row++) {
    for (let col = 0; col < points[0].length; col++) {
      const value = circles.reduce((sum, { x, y, r }) => {
        let xDiff = col * squareSize - 1 - x
        if (xDiff > 1) xDiff -= 2
        if (xDiff < -1) xDiff += 2
        let yDiff = row * squareSize - 1 - y
        if (yDiff > 1) yDiff -= 2
        if (yDiff < -1) yDiff += 2
        return sum + (r * r) / (Math.pow(xDiff, 2) + Math.pow(yDiff, 2))
      }, 0)
      points[row][col] = value > 100 ? 100 : value
    }
  }
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
