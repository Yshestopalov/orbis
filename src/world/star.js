import * as THREE from 'three';
import STAR from '../config/star.json';

export class Star {
  constructor({
    radius = STAR.radius,
    position = new THREE.Vector3(),
    color = STAR.color,
  } = {}) {
    this.radius = radius;
    this.position = position;

    this.group = this._create_group();
    this.surface = this._create_surface(color);
    this.light = this._create_light();

    this.group.add(this.surface);
    this.group.add(this.light);
  }

  _create_group() {
    const group = new THREE.Group();
    group.position.copy(this.position);

    return group;
  }

  _create_surface(color) {
    return new THREE.Mesh(
      this._create_geometry(),
      this._create_material(color),
    );
  }

  _create_geometry() {
    return new THREE.SphereGeometry(
      this.radius,
      STAR.width_segments,
      STAR.height_segments,
    );
  }

  _create_material(color) {
    return new THREE.MeshBasicMaterial(
      { 
        color: color 
      }
    );
  }

  _create_light() {
    return new THREE.PointLight(
      STAR.light_color,
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