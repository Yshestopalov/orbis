import * as THREE from 'three';

import ENGINE from '../config/engine.json';
import { clamp } from '../utils/math.js';

const CAMERA = ENGINE.camera;
const RENDERER = ENGINE.renderer;
const TIMING = ENGINE.timing;

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    
    this.updatables = [];
    this.last_time = 0;
    this.frame_id = null;

    this.scene = this._create_scene();
    this.camera = this._create_camera();
    this.renderer = this._create_renderer();

    this._on_frame = (now) => this._frame(now);

    this._resize();
    this._connect_resize();
  }

  add(object) {
    this.scene.add(object.group);
    
    if (object.update) {
      this.updatables.push(object);
    }
  }

  start() {
    if (this.frame_id !== null) return;

    this.last_time = performance.now();
    this.frame_id = requestAnimationFrame(this._on_frame);
  }

  stop() {
    if (this.frame_id === null) return;

    cancelAnimationFrame(this.frame_id);
    this.frame_id = null;
  }

  _frame(now) {
    this.frame_id = requestAnimationFrame(this._on_frame);

    const delta_time = this._step_time(now);

    this._update_all(delta_time);
    this._render();
  }

  _step_time(now) {
    const delta_time = (now - this.last_time) / 1000;

    this.last_time = now;

    return clamp(delta_time, 0, TIMING.max_delta_time);
  }

  _update_all(delta_time) {
    for (const item of this.updatables) {
      item.update(delta_time);
    }
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  _resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _connect_resize() {
    window.addEventListener('resize', () => this._resize());
  }

  _create_scene() {
    return new THREE.Scene();
  }

  _create_camera() {
    const camera = new THREE.PerspectiveCamera(
      CAMERA.field_of_view,
      1,
      CAMERA.near_plane,
      CAMERA.far_plane,
    );
    camera.position.set(...CAMERA.start_position);

    return camera;
  }

  _create_renderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: RENDERER.antialias,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.max_pixel_ratio));

    return renderer;
  }
}