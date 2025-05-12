import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cubesDataRef = useRef([]);
  const animationFrameIdRef = useRef(null);

  const [hoveredCube, setHoveredCube] = useState(null); // Index or null
  const [clickedCube, setClickedCube] = useState(null); // Index or null

  // Refs for dragging interaction
  const draggedObjectInfoRef = useRef(null); // { cube, dragPlane, offset }
  const isDraggingRef = useRef(false);
  const clickCandidateInfoRef = useRef(null); // { cubeData, index, downEvent } for differentiating click/drag

  const cubeConfigs = [
      { texture: '/linkedin_logo.png', url: 'https://www.linkedin.com/' }, // Example actual URLs
      { texture: '/github_logo.png', url: 'https://github.com/' },
      { texture: '/javascript_logo.png', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
      { texture: '/github_logo.png', url: 'https://github.com/' }, // Repeated for example
      { texture: '/pg_logo.png', url: 'https://www.postgresql.org/' },
      { texture: '/python_logo.png', url: 'https://www.python.org/' },
      { texture: '/react_logo.png', url: 'https://react.dev/' },
  ];


  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.id = 'c';
    Object.assign(canvas.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1,
      width: '100vw',
      height: '100vh',
      display: 'block',
    });
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-1, 2, 4);
    scene.add(light);

    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    function makeInstance(geometry, texture, x, url) {
      const material = new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: 0.7 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = x;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      scene.add(cube);
      material.userData = { originalColor: material.color.clone() };
      return { cube, velocity, url, originalMaterialOpacity: material.opacity }; // Store opacity
    }

    cubesDataRef.current = cubeConfigs.map((config, index) => {
      const texture = textureLoader.load(config.texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      const x = (index - cubeConfigs.length / 2) * 1.5;
      return makeInstance(geometry, texture, x, config.url);
    });

    function resizeRendererToDisplaySize(currentRenderer) {
      if (!currentRenderer) return;
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
      time *= 0.001;

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      resizeRendererToDisplaySize(rendererRef.current);

      cubesDataRef.current.forEach((data, index) => {
        const { cube, velocity } = data;

        // Don't apply automatic movement if this cube is being dragged
        if (!(draggedObjectInfoRef.current && draggedObjectInfoRef.current.cube === cube)) {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            if (clickedCube !== index) { // Still stop if "clicked" (after URL open)
              cube.position.add(velocity);
              const boundary = 3; // Adjust boundary as needed
              if (cube.position.x > boundary || cube.position.x < -boundary) velocity.x *= -1;
              if (cube.position.y > boundary || cube.position.y < -boundary) velocity.y *= -1;
              if (cube.position.z > boundary || cube.position.z < -boundary) velocity.z *= -1;
            }
        }


        if (hoveredCube === index && !(draggedObjectInfoRef.current && draggedObjectInfoRef.current.cube === cube)) {
          cube.material.color.set(0xffa500);
          cube.scale.set(1.2, 1.2, 1.2);
          cube.material.opacity = 1.0;
        } else if (clickedCube === index) {
          cube.material.color.set(0xff0000);
          cube.scale.set(1.5, 1.5, 1.5);
          cube.material.opacity = 1.0;
        } else if (draggedObjectInfoRef.current && draggedObjectInfoRef.current.cube === cube) {
          cube.material.color.set(0x00ff00); // Green while dragging
          cube.scale.set(1.3, 1.3, 1.3);
          cube.material.opacity = 0.9;
        }
         else {
          if (cube.material.userData.originalColor) {
            cube.material.color.copy(cube.material.userData.originalColor);
          }
          cube.scale.set(1, 1, 1);
          cube.material.opacity = data.originalMaterialOpacity;
        }
      });
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    animationFrameIdRef.current = requestAnimationFrame(render);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(); // For NDC
    const currentMousePosition = new THREE.Vector2(); // For pixel diff calculation

    function getIntersectedCube(event) {
        if (!cameraRef.current || !cubesDataRef.current.length) return null;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(cubesDataRef.current.map(d => d.cube));
        if (intersects.length > 0) {
            const intersectedCubeIndex = cubesDataRef.current.findIndex(d => d.cube === intersects[0].object);
            return {
                cube: intersects[0].object,
                index: intersectedCubeIndex,
                data: cubesDataRef.current[intersectedCubeIndex],
                intersectionPoint: intersects[0].point, // Point of intersection on the cube
            };
        }
        return null;
    }

    function handleMouseDown(event) {
      currentMousePosition.set(event.clientX, event.clientY);
      const intersected = getIntersectedCube(event);

      if (intersected) {
        isDraggingRef.current = true; // Assume drag might start
        // Prevent browser's default drag behavior (e.g., image dragging)
        event.preventDefault();


        // Prepare for dragging
        const dragPlane = new THREE.Plane();
        const planeNormal = new THREE.Vector3();
        cameraRef.current.getWorldDirection(planeNormal); // Normal is camera's view direction
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, intersected.intersectionPoint);

        const offset = new THREE.Vector3().subVectors(intersected.cube.position, intersected.intersectionPoint);

        draggedObjectInfoRef.current = {
          cube: intersected.cube,
          dragPlane: dragPlane,
          offset: offset
        };

        // Store for potential click
        clickCandidateInfoRef.current = {
            data: intersected.data,
            index: intersected.index,
            downEventClientX: event.clientX,
            downEventClientY: event.clientY,
        };

        // Temporarily make other objects more transparent to focus on dragged one
        cubesDataRef.current.forEach(data => {
            if (data.cube !== intersected.cube) {
                data.cube.material.opacity = 0.3;
            }
        });
      }
    }

    function handleMouseMove(event) {
      if (isDraggingRef.current && draggedObjectInfoRef.current) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cameraRef.current);

        const { cube, dragPlane, offset } = draggedObjectInfoRef.current;
        const newPosition = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, newPosition); // Find where ray hits the drag plane

        if (newPosition) {
            cube.position.copy(newPosition.add(offset));
        }

        // If mouse moved significantly, it's a drag, not a click
        if (clickCandidateInfoRef.current) {
            const distThreshold = 5; // pixels
            const dx = Math.abs(event.clientX - clickCandidateInfoRef.current.downEventClientX);
            const dy = Math.abs(event.clientY - clickCandidateInfoRef.current.downEventClientY);
            if (dx > distThreshold || dy > distThreshold) {
                clickCandidateInfoRef.current = null; // Invalidate click
            }
        }
      } else { // Not dragging, just update hover
        const intersected = getIntersectedCube(event);
        setHoveredCube(intersected ? intersected.index : null);
      }
    }

    function handleMouseUp(event) {
      if (isDraggingRef.current) {
        // Restore opacity for all cubes
        cubesDataRef.current.forEach(data => {
            data.cube.material.opacity = data.originalMaterialOpacity;
        });
      }

      isDraggingRef.current = false;
      draggedObjectInfoRef.current = null;


      if (clickCandidateInfoRef.current) { // If it's still a valid click candidate
        const { data, index } = clickCandidateInfoRef.current;
        setClickedCube(index);
        if (data.url) {
          window.open(data.url, '_blank');
        }
        setTimeout(() => setClickedCube(null), 1000);
      }
      clickCandidateInfoRef.current = null;
    }


    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    const currentRenderer = rendererRef.current; // Capture for resize listener
    const resizeCallback = () => resizeRendererToDisplaySize(currentRenderer);
    window.addEventListener('resize', resizeCallback);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', resizeCallback);

      geometry.dispose();
      cubesDataRef.current.forEach(({ cube, originalMaterialOpacity }) => { // Restore opacity in data if needed
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
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [cubeConfigs]); // Rerun effect if cubeConfigs changes (though unlikely for this component)

  return null;
};

export default ThreeBackground;