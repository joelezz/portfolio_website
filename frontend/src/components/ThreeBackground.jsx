import React, { useEffect, useRef } from 'react'; // Removed useState
import * as THREE from 'three';

const ThreeBackground = () => {
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cubesDataRef = useRef([]); // Still need to store cube data (mesh, velocity)
  const animationFrameIdRef = useRef(null);

  // Simplified cubeConfigs - URLs are no longer used for interaction
  const cubeConfigs = [
    { texture: '/linkedin_logo.png' },
    { texture: '/github_logo.png' },
    { texture: '/javascript_logo.png' },
    { texture: '/github_logo.png' }, // Repeated for example
    { texture: '/pg_logo.png' },
    { texture: '/python_logo.png' },
    { texture: '/react_logo.png' },
  ];

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.id = 'c'; // It's good practice to ensure this ID is unique if multiple instances were ever used.
    Object.assign(canvas.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1, // Keep it in the background
      width: '100vw',
      height: '100vh',
      display: 'block',
    });
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // For transparent background
      premultipliedAlpha: false, // Often set with alpha:true for better blending
      antialias: true,
    });
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Added ambient light for softer overall lighting
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5); // Adjusted intensity
    directionalLight.position.set(-1, 2, 4);
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    function makeInstance(geometry, texture, x) {
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        opacity: 0.7, // Default desired opacity
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = x;
      // Random initial y and z positions and rotations for more variety
      cube.position.y = (Math.random() - 0.5) * 5;
      cube.position.z = (Math.random() - 0.5) * 5;
      cube.rotation.x = Math.random() * Math.PI * 2;
      cube.rotation.y = Math.random() * Math.PI * 2;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.015, // Slightly reduced speed
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.015
      );
      scene.add(cube);
      return { cube, velocity }; // Only return what's needed for animation
    }

    cubesDataRef.current = cubeConfigs.map((config, index) => {
      const texture = textureLoader.load(config.texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      const x = (index - (cubeConfigs.length -1) / 2) * 1.8; // Adjusted spacing
      return makeInstance(geometry, texture, x);
    });

    function resizeRendererToDisplaySize(currentRenderer) {
      if (!currentRenderer) return false;
      const canvasEl = currentRenderer.domElement;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const needResize = canvasEl.width !== width || canvasEl.height !== height;
      if (needResize) {
        currentRenderer.setSize(width, height, false);
        const cam = cameraRef.current;
        if (cam) {
          cam.aspect = width / height;
          cam.updateProjectionMatrix();
        }
      }
      return needResize;
    }

    function render(time) {
      animationFrameIdRef.current = requestAnimationFrame(render);
      time *= 0.001; // convert time to seconds

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      resizeRendererToDisplaySize(rendererRef.current);

      cubesDataRef.current.forEach((data) => {
        const { cube, velocity } = data;

        // Always apply free-floating animation
        cube.rotation.x += 0.005; // Slower rotation
        cube.rotation.y += 0.005;
        cube.rotation.z += 0.003;


        cube.position.add(velocity);
        const boundary = 4; // Adjust boundary as needed
        
        // Bounce off boundaries
        if (cube.position.x > boundary || cube.position.x < -boundary) {
            velocity.x *= -1;
            cube.position.x = Math.max(-boundary, Math.min(boundary, cube.position.x)); // Clamp to prevent sticking
        }
        if (cube.position.y > boundary || cube.position.y < -boundary) {
            velocity.y *= -1;
            cube.position.y = Math.max(-boundary, Math.min(boundary, cube.position.y));
        }
        if (cube.position.z > boundary || cube.position.z < -boundary) {
            velocity.z *= -1;
            cube.position.z = Math.max(-boundary, Math.min(boundary, cube.position.z));
        }

        // No need to change color, scale, or opacity for hover/click/drag
        // They will retain their initial appearance set in makeInstance
      });
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    animationFrameIdRef.current = requestAnimationFrame(render);

    // --- Remove all mouse event listeners and related variables/functions ---
    // No raycaster, mouse, handleMouseDown, handleMouseMove, handleMouseUp, getIntersectedCube

    const currentRenderer = rendererRef.current; // Capture for resize listener
    const resizeCallback = () => resizeRendererToDisplaySize(currentRenderer);
    window.addEventListener('resize', resizeCallback);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('resize', resizeCallback);

      geometry.dispose();
      cubesDataRef.current.forEach(({ cube }) => {
        if (cube.material) {
          if (cube.material.map) cube.material.map.dispose();
          cube.material.dispose();
        }
        sceneRef.current?.remove(cube);
      });
      cubesDataRef.current = [];
      rendererRef.current?.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      // Clear refs
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [cubeConfigs]); // Re-run effect if cubeConfigs changes (though usually static)

  return null; // This component doesn't render any direct JSX to the React DOM tree
};

export default ThreeBackground;