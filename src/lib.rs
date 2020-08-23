use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use js_sys::{Float32Array};

extern crate wee_alloc;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Serialize, Deserialize)]
pub struct Circle {
    pub x: f64,
    pub y: f64,
    pub r: f64,
}

#[wasm_bindgen]
pub struct MetaballState {
    points: [[f32; 101]; 101],
    weights: [f32; 101 * 101 * 6],
}

#[wasm_bindgen]
impl MetaballState {
    pub fn new() -> MetaballState {
        MetaballState {
            points: [[0.0; 101]; 101],
            weights: [0.0; 101 * 101 * 6],
        }
    }

    pub fn update_weights(&mut self, js_circles: &JsValue) -> Float32Array {
        let square_size = 2.0 / 100.0;
        let circles: Vec<Circle> = js_circles.into_serde().unwrap();

        for row in 0..101 {
            for col in 0..101 {
                let value = circles.iter().fold(0.0, |sum, circle| {
                    let mut x_diff = col as f64 * square_size - 1.0 - circle.x;
                    if x_diff > 1.0 { x_diff -= 2.0; }
                    if x_diff < -1.0 { x_diff += 2.0; }
                    let mut y_diff = row as f64 * square_size - 1.0 - circle.y;
                    if y_diff > 1.0 { y_diff -= 2.0; }
                    if y_diff < -1.0 { y_diff += 2.0; }
                    sum + circle.r.powi(2) / (x_diff.powi(2) + y_diff.powi(2)) 
                });
                self.points[row][col] = if value > 100.0 { 100.0 } else { value as f32 };
            }
        }

        let mut i = 0;
        for row in 0..100 {
            for col in 0..100 {
              self.weights[i] = self.points[row][col];
              i += 1;
              self.weights[i] = self.points[row + 1][col];
              i += 1;
              self.weights[i] = self.points[row + 1][col + 1];
              i += 1;
              self.weights[i] = self.points[row][col];
              i += 1;
              self.weights[i] = self.points[row][col + 1];
              i += 1;
              self.weights[i] = self.points[row + 1][col + 1];
              i += 1;
            }
        }

        unsafe {
            Float32Array::view(&self.weights)
        }
    }
}
