import * as THREE from 'three';
import { createNoise4D } from 'simplex-noise';

import STAR from '../config/star.json';
import { clamp } from '../utils/math.js';

const SURFACE = STAR.surface;
const CORONA = STAR.corona;
const MOTION = STAR.motion;
const LIGHT = STAR.light;

export class Star {
  constructor({
    radius = STAR.radius,
    position = new THREE.Vector3(),
  } = {}) {
    this.radius = radius;
    this.position = position;
    this.time = 0;

    this.palette = this._create_palette();
    this.noise = createNoise4D();
    this.face_color = new THREE.Color();

    this.surface = this._create_surface();
    this.corona = this._create_corona();
    this.light = this._create_light();
    this.group = this._create_group();

    this.face_directions = this._face_directions(this.surface.geometry);
    this._paint_surface();
  }

  update(delta_time) {
    this.time += delta_time;

    this._paint_surface();
    this.group.rotation.y += MOTION.spin_speed * delta_time;
  }

  dispose() {
    this.surface.geometry.dispose();
    this.surface.material.dispose();
    this.light.dispose();

    for (const shell of this.corona.children) {
      shell.geometry.dispose();
      shell.material.dispose();
    }
  }

  _paint_surface() {
    const colors = this.surface.geometry.attributes.color;
    const directions = this.face_directions;
    const face_color = this.face_color;

    for (let first = 0; first < directions.length; first += 3) {
      const heat = this._heat_at(
        directions[first],
        directions[first + 1],
        directions[first + 2],
      );

      this._color_at(heat, face_color);

      for (let i = 0; i < 3; i++) {
        colors.setXYZ(first + i, face_color.r, face_color.g, face_color.b);
      }
    }

    colors.needsUpdate = true;
  }

  _heat_at(x, y, z) {
    const scale = SURFACE.noise_scale;
    const time = this.time * SURFACE.boil_speed;

    const low_frequency = this.noise(
      x * scale, 
      y * scale, 
      z * scale, 
      time
    );

    const high_frequency = this.noise(
      x * scale * 5 + 30,
      y * scale * 5 + 15,
      z * scale * 5 + 5,
      time * 2,
    );

    const mixed_noise = low_frequency * (1 - SURFACE.noise_variation) + high_frequency * SURFACE.noise_variation;

    return clamp(0.5 + 0.5 * mixed_noise * SURFACE.contrast, 0, 1);
  }

  _color_at(heat, out) {
    const last = this.palette.length - 1;
    const position = heat * last;
    const lower = Math.min(Math.floor(position), last - 1);

    return out
      .copy(this.palette[lower])
      .lerp(this.palette[lower + 1], position - lower);
  }

  _average_color() {
    const total = new THREE.Color(0, 0, 0);

    for (const color of this.palette) {
      total.add(color);
    }

    return total.multiplyScalar(1 / this.palette.length);
  }

  _face_directions(geometry) {
    const positions = geometry.attributes.position;
    const directions = new Float32Array(positions.count);

    const center = new THREE.Vector3();
    const corner = new THREE.Vector3();

    for (let first = 0; first < positions.count; first += 3) {
      center.set(0, 0, 0);

      for (let i = 0; i < 3; i++) {
        center.add(corner.fromBufferAttribute(positions, first + i));
      }

      center.normalize().toArray(directions, first);
    }

    return directions;
  }

  _create_palette() {
    return SURFACE.palette.map((hex) => new THREE.Color(hex));
  }

  _create_surface() {
    return new THREE.Mesh(
      this._create_geometry(),
      this._create_material(),
    );
  }

  _create_geometry() {
    const geometry = new THREE.IcosahedronGeometry(this.radius, SURFACE.detail);
    const vertex_count = geometry.attributes.position.count;

    const colors = new THREE.BufferAttribute(new Float32Array(vertex_count * 3), 3);
    colors.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', colors);

    return geometry;
  }

  _create_material() {
    return new THREE.MeshBasicMaterial({ 
      vertexColors: true 
    });
  }

  _create_corona() {
    const color = this._color_at(CORONA.heat, new THREE.Color());
    const corona = new THREE.Group();

    for (const shell of CORONA.shells) {
      corona.add(this._create_shell(color, shell));
    }

    return corona;
  }

  _create_shell(color, shell) {
    const geometry = new THREE.IcosahedronGeometry(this.radius * shell.scale, CORONA.detail);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: shell.opacity,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
  }

  _create_light() {
    return new THREE.PointLight(
      this._average_color(),
      LIGHT.intensity,
      LIGHT.distance,
      LIGHT.decay,
    );
  }

  _create_group() {
    const group = new THREE.Group();
    group.position.copy(this.position);

    group.add(this.surface);
    group.add(this.corona);
    group.add(this.light);

    return group;
  }
}