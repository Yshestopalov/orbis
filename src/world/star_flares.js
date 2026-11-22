import * as THREE from 'three';

import STAR from '../config/star.json';
import { seeded_random } from '../utils/random.js';

const FLARES = STAR.flares;

const BURIED_RADIUS = 0.97;
const HIDDEN_RADIUS = 0.9;

function roll(range, random) {
  return THREE.MathUtils.lerp(range[0], range[1], random());
}

export class StarFlares {
  constructor({ radius, color, seed }) {
    this.radius = radius;
    this.seed = seed;

    this.material = this._create_material(color);
    this.flares = this._create_flares();
    this.group = this._create_group();
  }

  update(delta_time) {
    for (const flare of this.flares) {
      flare.age += delta_time;

      if (flare.age >= flare.lifetime) this._respawn(flare);

      flare.mesh.visible = flare.age >= 0;

      if (flare.mesh.visible) this._grow(flare);
    }
  }

  dispose() {
    for (const flare of this.flares) {
      flare.mesh.geometry.dispose();
    }

    this.material.dispose();
  }

  _grow(flare) {
    const envelope = Math.sin(Math.PI * flare.age / flare.lifetime);

    flare.mesh.scale.setScalar(
      flare.hidden_scale + (1 - flare.hidden_scale) * envelope,
    );
  }

  _respawn(flare) {
    const height = roll(FLARES.height, flare.random);

    flare.mesh.geometry.dispose();
    flare.mesh.geometry = this._create_arc_geometry(height, flare.random);

    flare.hidden_scale = HIDDEN_RADIUS / (BURIED_RADIUS + height);
    flare.lifetime = roll(FLARES.lifetime_seconds, flare.random);
    flare.age = -roll(FLARES.delay_seconds, flare.random);
  }

  _create_material(color) {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: FLARES.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  _create_flares() {
    return Array.from({ length: FLARES.count }, (_, index) => this._create_flare(index));
  }

  _create_flare(index) {
    const flare = {
      random: seeded_random(this.seed + 100 + index),
      mesh: new THREE.Mesh(new THREE.BufferGeometry(), this.material),
      hidden_scale: 1,
      lifetime: 1,
      age: 0,
    };

    this._respawn(flare);

    return flare;
  }

  _create_group() {
    const group = new THREE.Group();

    for (const flare of this.flares) {
      group.add(flare.mesh);
    }

    return group;
  }

  _create_arc_geometry(height, random) {
    const start = this._random_direction(random);

    const along = this._random_direction(random);
    along.addScaledVector(start, -along.dot(start)).normalize();

    const span = THREE.MathUtils.degToRad(roll(FLARES.span_degrees, random));
    const points = [];

    for (let i = 0; i <= FLARES.arc_points; i++) {
      const t = i / FLARES.arc_points;
      const angle = span * t;

      const arc_radius = this.radius * (BURIED_RADIUS + height * Math.sin(Math.PI * t));

      points.push(
        start.clone()
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(along, Math.sin(angle))
          .multiplyScalar(arc_radius),
      );
    }

    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      FLARES.tube_segments,
      this.radius * FLARES.tube_radius,
      FLARES.tube_sides,
      false,
    );
  }

  _random_direction(random) {
    const z = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - z * z);

    return new THREE.Vector3(ring * Math.cos(angle), ring * Math.sin(angle), z);
  }
}