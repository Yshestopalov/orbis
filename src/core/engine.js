import * as THREE from 'three';

import ENGINE from '../config/engine.json';

const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

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

    cancelAnimationFrame(this.frame_id)
    this.frame_id = null;
  }

  _create_scene() {
    return new THREE.Scene();
  }

  _create_camera() {
    const camera = new THREE.PerspectiveCamera(
      ENGINE.field_of_view,
      1,
      ENGINE.near_plane,
      ENGINE.far_plane,
    );
    camera.position.set(...ENGINE.start_position);

    return camera;
  }

  _create_renderer() {
    const renderer = new THREE.WebGLRenderer(
      { 
        canvas: this.canvas,
        antialias: true,
      }
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, ENGINE.max_pixel_ratio));

    return renderer;
  }

  _frame(now) {
    requestAnimationFrame(this._on_frame);

    const delta_seconds = this._step_time(now);

    this._update_all(delta_seconds);
    this._render();
  }

  _step_time(now) {
    const delta_seconds = (now - this.last_time) / 1000;

    this.last_time = now;

    return clamp(delta_seconds, 0, ENGINE.max_delta_seconds);
  }

  _update_all(delta_seconds) {
    for (const item of this.updatables) {
      item.update(delta_seconds);
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
}