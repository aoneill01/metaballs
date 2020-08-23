/* tslint:disable */
/* eslint-disable */
/**
*/
export class MetaballState {
  free(): void;
/**
* @returns {MetaballState}
*/
  static new(): MetaballState;
/**
* @param {any} js_circles
* @returns {Float32Array}
*/
  update_weights(js_circles: any): Float32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_metaballstate_free: (a: number) => void;
  readonly metaballstate_new: () => number;
  readonly metaballstate_update_weights: (a: number, b: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
        