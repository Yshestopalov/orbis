import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

import STAR from '../config/star.json';

export class Star {
  constructor({
    radius = STAR.radius,
    position = new THREE.Vector3(),
  } = {}) {
    this.radius = radius;
    this.position = position;
    this.palette = this._create_palette();

    this.group = this._create_group();
    this.surface = this._create_surface();
    this.light = this._create_light();

    this.group.add(this.surface);
    this.group.add(this.light);
  }

  _average_palette() {
    const total = new THREE.Color(0, 0, 0);

    for (const color of this.palette) {
      total.add(color);
    }

    return total.multiplyScalar(1 / this.palette.length);
  }

  _point_heat(noise, direction) {
    const scale = STAR.noise_scale;

    const low_frequency = noise(
      direction.x * scale,
      direction.y * scale,
      direction.z * scale,
    );

    const high_frequency = noise(
      direction.x * scale * 5 + 30,
      direction.y * scale * 5 + 15,
      direction.z * scale * 5 + 5,
    );

    const mixed_noise = low_frequency * (1 - STAR.noise_variation) + high_frequency * STAR.noise_variation;

    return THREE.MathUtils.clamp(0.5 + 0.5 * mixed_noise * STAR.contrast, 0, 1);
  }

  _point_color(heat) {
    const last = this.palette.length - 1;
    const position = heat * last;
    const lower = Math.min(Math.floor(position), last - 1);

    return this.palette[lower]
      .clone()
      .lerp(this.palette[lower + 1], position - lower);
  }

  _paint_icosahedron(geometry) {
    const noise = createNoise3D();

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    const center = new THREE.Vector3();
    const corner = new THREE.Vector3();

    for (let first = 0; first < positions.count; first += 3) {
      center.set(0, 0, 0);

      for (let i = 0; i < 3; i++) {
        center.add(corner.fromBufferAttribute(positions, first + i));
      }
      center.normalize();

      const color = this._point_color(this._point_heat(noise, center));

      for (let i = 0; i < 3; i++) {
        color.toArray(colors, (first + i) * 3);
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  _create_palette() {
    return STAR.palette.map((hex) => new THREE.Color(hex));
  }

  _create_group() {
    const group = new THREE.Group();
    group.position.copy(this.position);

    return group;
  }

  _create_surface() {
    return new THREE.Mesh(
      this._create_geometry(),
      this._create_material(),
    );
  }

  _create_geometry() {
    const geometry = new THREE.IcosahedronGeometry(this.radius, STAR.detail);
    this._paint_icosahedron(geometry);

    return geometry;
  }

  _create_material() {
    return new THREE.MeshBasicMaterial(
      { 
        vertexColors: true 
      }
    );
  }

  _create_light() {
    return new THREE.PointLight(
      this._average_palette(),
      STAR.light_intensity,
      STAR.light_distance,
      STAR.light_decay,
    );
  }

  dispose() {
    this.surface.geometry.dispose()
    this.surface.material.dispose()
    this.light.dispose()
  }
}