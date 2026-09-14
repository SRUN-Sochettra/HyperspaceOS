// ============================================================
//  Background.js — Three.js 3D starfield + nebula
//  Replaces the old Canvas 2D blobs with a proper 3D scene.
//  Renders behind everything at z-index 1.
// ============================================================

import * as THREE from "three";
import Store from "../core/Store.js";

const Background = (() => {
  let scene, camera, renderer;
  let starField, nebulaParticles;
  let animationId;
  let mouseX = 0,
    mouseY = 0;

  const STAR_COUNT = 3000;
  const NEBULA_COUNT = 500;

  function init() {
    const canvas = document.getElementById("canvas-bg");
    if (!canvas) return;

    // ---- SCENE ----
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.0003);

    // ---- CAMERA ----
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      5000,
    );
    camera.position.z = 1000;

    // ---- RENDERER ----
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030308);

    // ---- STARS ----
    createStarField();

    // ---- NEBULA ----
    createNebula();

    // ---- EVENTS ----
    window.addEventListener("resize", onResize);
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    // ---- THEME REACTIVITY ----
    Store.subscribe("settings.accentColor", (color) => {
      updateNebulaColor(color);
    });

    // ---- RENDER LOOP ----
    render();

    console.log("[Background] Three.js initialized");
  }

  function createStarField() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;

      // Distribute stars in a large sphere
      positions[i3] = (Math.random() - 0.5) * 4000;
      positions[i3 + 1] = (Math.random() - 0.5) * 4000;
      positions[i3 + 2] = (Math.random() - 0.5) * 4000;

      sizes[i] = Math.random() * 3 + 0.5;

      // Slight color variation (blue-white)
      const brightness = 0.7 + Math.random() * 0.3;
      colors[i3] = brightness * (0.8 + Math.random() * 0.2); // R
      colors[i3 + 1] = brightness * (0.8 + Math.random() * 0.2); // G
      colors[i3 + 2] = brightness; // B
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mvPosition.xyz);

          // Twinkle effect
          float twinkle = sin(uTime * 0.5 + position.x * 0.01 + position.y * 0.01) * 0.5 + 0.5;
          vAlpha = 0.4 + twinkle * 0.6;

          gl_PointSize = size * uPixelRatio * (300.0 / dist);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular point with soft edge
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = vAlpha * (1.0 - smoothstep(0.2, 0.5, dist));
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
  }

  function createNebula() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(NEBULA_COUNT * 3);
    const colors = new Float32Array(NEBULA_COUNT * 3);
    const sizes = new Float32Array(NEBULA_COUNT);

    // Default nebula color (cyan/purple)
    const nebulaColors = [
      { r: 0, g: 0.6, b: 1 }, // cyan
      { r: 0.7, g: 0, b: 1 }, // purple
      { r: 0.1, g: 0.3, b: 0.8 }, // deep blue
    ];

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const i3 = i * 3;
      const colorChoice =
        nebulaColors[Math.floor(Math.random() * nebulaColors.length)];

      // Cluster nebula particles in a few regions
      const clusterX = (Math.floor(Math.random() * 3) - 1) * 600;
      const clusterY = (Math.floor(Math.random() * 3) - 1) * 400;

      positions[i3] = clusterX + (Math.random() - 0.5) * 800;
      positions[i3 + 1] = clusterY + (Math.random() - 0.5) * 600;
      positions[i3 + 2] = (Math.random() - 0.5) * 1000;

      colors[i3] = colorChoice.r;
      colors[i3 + 1] = colorChoice.g;
      colors[i3 + 2] = colorChoice.b;

      sizes[i] = 100 + Math.random() * 300;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;

          // Slow drift animation
          vec3 pos = position;
          pos.x += sin(uTime * 0.05 + position.y * 0.002) * 30.0;
          pos.y += cos(uTime * 0.04 + position.x * 0.002) * 20.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (200.0 / length(mvPosition.xyz));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Very soft, transparent blob
          float alpha = 0.015 * (1.0 - smoothstep(0.0, 0.5, dist));
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    nebulaParticles = new THREE.Points(geometry, material);
    scene.add(nebulaParticles);
  }

  function updateNebulaColor(hexColor) {
    if (!nebulaParticles) return;
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    const colors = nebulaParticles.geometry.attributes.color.array;
    for (let i = 0; i < NEBULA_COUNT; i++) {
      const i3 = i * 3;
      // Blend toward new accent color
      if (Math.random() > 0.5) {
        colors[i3] = r * (0.7 + Math.random() * 0.3);
        colors[i3 + 1] = g * (0.7 + Math.random() * 0.3);
        colors[i3 + 2] = b * (0.7 + Math.random() * 0.3);
      }
    }
    nebulaParticles.geometry.attributes.color.needsUpdate = true;
  }

  // ---- RENDER LOOP ----
  function render() {
    const time = performance.now() * 0.001;

    // Update uniforms
    if (starField) starField.material.uniforms.uTime.value = time;
    if (nebulaParticles) nebulaParticles.material.uniforms.uTime.value = time;

    // Slow rotation
    if (starField) {
      starField.rotation.y = time * 0.01;
      starField.rotation.x = time * 0.005;
    }

    // Mouse parallax — subtle camera movement
    camera.position.x += (mouseX * 30 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 30 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(render);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("mousemove", onMouseMove);

    if (renderer) renderer.dispose();
    if (starField) {
      starField.geometry.dispose();
      starField.material.dispose();
    }
    if (nebulaParticles) {
      nebulaParticles.geometry.dispose();
      nebulaParticles.material.dispose();
    }

    scene = null;
    camera = null;
    renderer = null;
  }

  return { init, destroy };
})();

export default Background;
