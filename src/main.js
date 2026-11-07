import { Engine } from './core/engine.js';
import { Star } from './world/star.js';

const canvas = document.getElementById('view');
const engine = new Engine(canvas);

const star = new Star();
engine.add(star);

engine.camera.lookAt(star.position);

engine.start();