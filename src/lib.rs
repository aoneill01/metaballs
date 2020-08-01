use wasm_bindgen::prelude::*;

extern crate wee_alloc;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn interpolate(first: f64, second: f64) -> f64 {
    (1.0 - first) / (second - first)
}

#[derive(Clone)]
struct Circle {
    x: f64,
    y: f64,
    r: f64,
    dx: f64,
    dy: f64,
}

#[wasm_bindgen]
pub struct MetaballState {
    circles: Vec<Circle>,
}

impl MetaballState {
    pub fn new() -> MetaballState {
        MetaballState {
            circles: vec![
                Circle {
                    x: 0.5,
                    y: 0.2,
                    r: 0.29,
                    dx: 0.00002,
                    dy: 0.00006,
                },
                Circle {
                    x: -0.2,
                    y: 0.1,
                    r: 0.35,
                    dx: -0.00005,
                    dy: 0.00008,
                },
                Circle {
                    x: -0.2,
                    y: -0.4,
                    r: 0.25,
                    dx: -0.00002,
                    dy: -0.0001,
                },
                Circle {
                    x: 0.0,
                    y: 0.0,
                    r: 0.22,
                    dx: -0.0002,
                    dy: 0.0001,
                },
            ],
        }
    }

    pub fn update_points(mut self, elapsed: f64) {
        for i in 0..self.circles.len() {
            let current = &self.circles[i];
            let mut force: (f64, f64) = (0.0, 0.0);

            for j in 0..self.circles.len() {
                if i == j {
                    continue;
                }
                let other = &self.circles[j];
                let mut adjusted = other.clone();

                let x_diff = current.x - other.x;
                if x_diff > 1.0 {
                    adjusted.x += 2.0;
                }
                if x_diff < -1.0 {
                    adjusted.x -= 2.0;
                }
                let y_diff = current.y - other.y;
                if y_diff > 1.0 {
                    adjusted.y += 2.0;
                }
                if y_diff < -1.0 {
                    adjusted.y -= 2.0;
                }

                let distance = ((current.x - adjusted.x).powi(2) + (current.y - adjusted.y).powi(2)).sqrt();
                let strength = (-0.00001 * current.r * current.r) / (distance * distance);
                force = (force.0 + (strength * (adjusted.x - current.x)) / distance, force.0 + (strength * (adjusted.y - current.y)) / distance);
            }

            let mut current = &mut self.circles[i];

            current.dx += force.0;
            current.dy += force.1;

            if current.dx > 0.0005 {
                current.dx = 0.0005;
            }
            if current.dx < -0.0005 {
                current.dx = -0.0005;
            }
            if current.dy > 0.0005 {
                current.dy = 0.0005;
            }
            if current.dy < -0.0005 {
                current.dy = -0.0005;
            }
        
            current.x += elapsed * current.dx;
            if current.x < -1.0 {
                current.x = 1.0;
            }
            if current.x > 1.0 {
                current.x = -1.0;
            }
        
            current.y += elapsed * current.dy;
            if current.y < -1.0 {
                current.y = 1.0;
            }
            if current.y > 1.0 {
                current.y = -1.0;
            }
        }
    
//         for (let row = 0; row < this.points.length; row++) {
//           for (let col = 0; col < this.points[0].length; col++) {
//             const value = this.circles.reduce((sum, { x, y, r }) => {
//               let xDiff = col * SQUARE_SIZE - 1 - x
//               if (xDiff > 1) xDiff -= 2
//               if (xDiff < -1) xDiff += 2
//               let yDiff = row * SQUARE_SIZE - 1 - y
//               if (yDiff > 1) yDiff -= 2
//               if (yDiff < -1) yDiff += 2
//               return sum + (r * r) / (Math.pow(xDiff, 2) + Math.pow(yDiff, 2))
//             }, 0)
//             this.points[row][col] = value
//           }
//         }
    }
}
