import * as THREE from 'three';
import { createNoise4D } from 'simplex-noise';

import STAR from '../config/star.json';

export class Star {
  constructor({
    radius = STAR.radius,
    position = new THREE.Vector3(),
  } = {}) {
    this.radius = radius;
    this.position = position;

    this.palette = this._create_palette();
    this.noise = createNoise4D();
    this.time = 0;
    this.face_color = new THREE.Color();

    this.group = this._create_group();
    this.surface = this._create_surface();
    this.light = this._create_light();

    this.group.add(this.surface);
    this.group.add(this.light);

    this.face_directions = this._find_face_directions(this.surface.geometry);
    this._paint_icosahedron();
  }

  update(delta_seconds) {
    this.time += delta_seconds;

    this._paint_icosahedron();
    this.group.rotation.y += STAR.spin_speed * delta_seconds;
  }

  _average_palette() {
    const total = new THREE.Color(0, 0, 0);

    for (const color of this.palette) {
      total.add(color);
    }

    return total.multiplyScalar(1 / this.palette.length);
  }

  _point_heat(x, y, z) {
    const scale = STAR.noise_scale;
    const time = this.time * STAR.boil_speed;

    const low_frequency = this.noise(
      x * scale,
      y * scale,
      z * scale,
      time,
    );

    const high_frequency = this.noise(
      x * scale * 5 + 30,
      y * scale * 5 + 15,
      z * scale * 5 + 5,
      time * 2,
    );

    const mixed_noise = low_frequency * (1 - STAR.noise_variation) + high_frequency * STAR.noise_variation;

    return THREE.MathUtils.clamp(0.5 + 0.5 * mixed_noise * STAR.contrast, 0, 1);
  }

  _point_color(heat, out) {
    const last = this.palette.length - 1;
    const position = heat * last;
    const lower = Math.min(Math.floor(position), last - 1);

    return out
      .copy(this.palette[lower])
      .lerp(this.palette[lower + 1], position - lower);
  }

  _find_face_directions(geometry) {
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

  _paint_icosahedron(geometry) {
    const colors = this.surface.geometry.attributes.color;
    const directions = this.face_directions;
    const face_color = this.face_color;

    for (let first = 0; first < directions.length; first += 3) {
      const heat = this._point_heat(
        directions[first],
        directions[first + 1],
        directions[first + 2],
      );

      this._point_color(heat, face_color);

      for (let i = 0; i < 3; i++) {
        colors.setXYZ(first + i, face_color.r, face_color.g, face_color.b);
      }
    }

    colors.needsUpdate = true;
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
    const vertex_count = geometry.attributes.position.count;

    const colors = new THREE.BufferAttribute(new Float32Array(vertex_count * 3), 3);
    colors.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', colors);

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