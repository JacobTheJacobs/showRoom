import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { gsap } from "gsap";

/**
 * Loaders
 */
let sceneReady = false;
const loadingBarElement = document.querySelector(".loading-bar");
console.log(loadingBarElement);
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () => {
    // Wait a little
    window.setTimeout(() => {
      // Animate overlay
      gsap.to(overlayMaterial.uniforms.uAlpha, {
        duration: 5,
        value: 0,
        delay: 1,
      });
      // Update loadingBarElement
      loadingBarElement.classList.add("ended");
      loadingBarElement.style.transform = "";
    }, 500);

    window.setTimeout(() => {
      sceneReady = true;
    }, 2000);
  },
  // Progress
  (itemUrl, itemsLoaded, itemsTotal) => {
    // Calculate the progress and update the loadingBarElement
    const progressRatio = itemsLoaded / itemsTotal;
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;
  }
);
let gltfLoader = new GLTFLoader(loadingManager);
/**
 * Base
 */
let checkIfGltfHaveAnimation = 0;
let isRightDoorOpened = true;
let isLeftDoorOpened = true;
let isBottomDoorOpened = true;
let obj = null;
const animations = [];
const colors = [
  {
    color: "F4FF03",
  },
  {
    color: "0013FC",
  },
  {
    color: "FC000F",
  },
  {
    color: "00FC08",
  },
  {
    color: "FFFFFF",
  },
];
const TRAY = document.getElementById("js-tray-slide");
// Debug
const gui = new dat.GUI();
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");
// Clock
const clock = new THREE.Clock();
// Scene
const scene = new THREE.Scene();

//const textureLoader = new THREE.TextureLoader(loadingManager);

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: `
      void main()
      {
          gl_Position = vec4(position, 1.0);
      }
  `,
  fragmentShader: `
      uniform float uAlpha;

      void main()
      {
          gl_FragColor = vec4(1.0, 1.0, 1.0, uAlpha);
      }
  `,
});

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * Update all materials
 */
const updateAllMaterials = (e) => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      child.material.color.set(e);
      console.log(e);
    }
  });
};

/**
 * Environment map
 */
var cubeMap = new THREE.CubeTexture([]);
cubeMap.format = THREE.RGBFormat;
var loader = new THREE.ImageLoader();
loader.load("photo_studio_broadway_hall.jpg", function (image) {
  var getSide = function (x, y) {
    var size = 1360;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext("2d");
    context.drawImage(image, -x * size, -y * size);
    return canvas;
  };
  cubeMap.images[0] = getSide(2, 1); // px
  cubeMap.images[1] = getSide(0, 1); // nx
  cubeMap.images[2] = getSide(1, 0); // py
  cubeMap.images[3] = getSide(1, 2); // ny
  cubeMap.images[4] = getSide(1, 1); // pz
  cubeMap.images[5] = getSide(3, 1); // nz
  cubeMap.needsUpdate = true;
});

scene.background = cubeMap;
scene.environment = cubeMap;

debugObject.envMapIntensity = 5;

const raycaster = new THREE.Raycaster();
let points = [
  {
    position: new THREE.Vector3(0.5, 1.4, 0.2),
    element: document.querySelector(".point-0"),
  },
  {
    position: new THREE.Vector3(0.5, 1.5, -0.2),
    element: document.querySelector(".point-1"),
  },
  {
    position: new THREE.Vector3(0.6, 0.5, 0),
    element: document.querySelector(".point-2"),
  },
]; //create points
let action = null;

let mixer = null;

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightZ");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

gui
  .add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  })
  .onFinishChange(() => {
    renderer.toneMapping = Number(renderer.toneMapping);
    updateAllMaterials();
  });
gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);
/**
 * Models
 */

const loadModel = () => {};
gltfLoader.load("/models/SamsungRFG_Anim.glb", (gltf) => {
  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, 0, 0);
  gltf.scene.rotation.y = Math.PI * 0.5;
  scene.add(gltf.scene);
  obj = gltf.scene;

  updateAllMaterials();
  let offset = 1.25;
  /**
   * Controls
   */
  const box = new THREE.Box3();
  box.setFromObject(gltf.scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance =
    maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);
  const direction = controls.target
    .clone()
    .sub(camera.position)
    .normalize()
    .multiplyScalar(distance);
  controls.minDistance = distance - distance / 2.1;
  controls.target.copy(center);
  controls.maxPolarAngle = Math.PI / 2;
  camera.near = distance / 100;
  camera.far = distance * 100000;
  camera.position.copy(controls.target).sub(direction);
  controls.update();
  camera.updateProjectionMatrix();

  //Animations
  checkIfGltfHaveAnimation = gltf.animations.length;

  if (checkIfGltfHaveAnimation) {
    const animation0 = {
      blendMode: gltf.animations[0].blendMode,
      duration: gltf.animations[0].duration,
      name: gltf.animations[0].tracks[0].name,
      tracks: [gltf.animations[0].tracks[0]],
      uuid: gltf.animations.uuid,
    };

    const animation1 = {
      blendMode: gltf.animations[0].blendMode,
      duration: gltf.animations[0].duration,
      name: gltf.animations[0].tracks[1].name,
      tracks: [gltf.animations[0].tracks[1]],
      uuid: gltf.animations.uuid,
    };

    const animation2 = {
      blendMode: gltf.animations[0].blendMode,
      duration: gltf.animations[0].duration,
      name: gltf.animations[0].tracks[2].name,
      tracks: [gltf.animations[0].tracks[2]],
      uuid: gltf.animations.uuid,
    };
    animations.push(animation0);
    animations.push(animation1);
    animations.push(animation2);

    action = null;

    mixer = new THREE.AnimationMixer(gltf.scene);

    gltf.animations.forEach((clip) => {
      action = mixer.clipAction(clip);
      action.reset();
      action.paused = false;
      if (action.time === 0) {
        action.time = action.getClip().duration;
      }
      action.timeScale = -1;
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
      action.play();
    });

    console.log(points);
  }
});
gui
  .add(gltfLoader, "load", {
    filePathModel1: "/models/SamsungRFG_Anim.glb",
    filePathModel2: "/models/Ring-Smaple-jewelry.glb",
    filePathModel3: "/models/dim-ragingBull-shoe.glb",
  })
  .onFinishChange((e) => {
    console.log(obj.children);

    scene.remove(obj);
    obj.children.forEach((child) => {
      console.log(
        child.children.forEach((c) => {
          c.geometry.dispose();
          c.material.dispose();
        })
      );
    });

    gltfLoader = new GLTFLoader();
    gltfLoader.load(e, (gltf) => {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.rotation.y = Math.PI * 0.5;
      scene.add(gltf.scene);
      obj = gltf.scene;

      updateAllMaterials();
      let offset = 1.25;
      /**
       * Controls
       */
      const box = new THREE.Box3();
      box.setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const fitHeightDistance =
        maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
      const fitWidthDistance = fitHeightDistance / camera.aspect;
      const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);
      const direction = controls.target
        .clone()
        .sub(camera.position)
        .normalize()
        .multiplyScalar(distance);
      controls.minDistance = distance - distance / 2.1;
      controls.target.copy(center);
      controls.maxPolarAngle = Math.PI / 2;
      camera.near = distance / 100;
      camera.far = distance * 100000;
      camera.position.copy(controls.target).sub(direction);
      controls.update();
      camera.updateProjectionMatrix();

      //Animations
      checkIfGltfHaveAnimation = gltf.animations.length;

      if (checkIfGltfHaveAnimation) {
        const animation0 = {
          blendMode: gltf.animations[0].blendMode,
          duration: gltf.animations[0].duration,
          name: gltf.animations[0].tracks[0].name,
          tracks: [gltf.animations[0].tracks[0]],
          uuid: gltf.animations.uuid,
        };

        const animation1 = {
          blendMode: gltf.animations[0].blendMode,
          duration: gltf.animations[0].duration,
          name: gltf.animations[0].tracks[1].name,
          tracks: [gltf.animations[0].tracks[1]],
          uuid: gltf.animations.uuid,
        };

        const animation2 = {
          blendMode: gltf.animations[0].blendMode,
          duration: gltf.animations[0].duration,
          name: gltf.animations[0].tracks[2].name,
          tracks: [gltf.animations[0].tracks[2]],
          uuid: gltf.animations.uuid,
        };
        animations.push(animation0);
        animations.push(animation1);
        animations.push(animation2);
        obj = gltf.scene;
        action = null;

        mixer = new THREE.AnimationMixer(gltf.scene);

        gltf.animations.forEach((clip) => {
          action = mixer.clipAction(clip);
          action.reset();
          action.paused = false;
          if (action.time === 0) {
            action.time = action.getClip().duration;
          }
          action.timeScale = -1;
          action.loop = THREE.LoopOnce;
          action.clampWhenFinished = true;
          action.play();
        });
      }
    });
  });
let previousTime = 0;
/**
 * Animate
 */
const tick = () => {
  if (checkIfGltfHaveAnimation) {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    mixer?.update(deltaTime);
  }

  if (sceneReady) {
    // Go through each poi
    console.log(sceneReady);
    for (const point of points) {
      // Get 2D screen position
      const screenPosition = point.position.clone();
      screenPosition.project(camera);

      // Set the raycaster
      raycaster.setFromCamera(screenPosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // No intersect found
      if (intersects.length === 0) {
        // Show
        point.element.classList.add("visible");
      }

      // Intersect found
      else {
        // Get the distance of the intersection and the distance of the point
        const intersectionDistance = intersects[0].distance;
        const pointDistance = point.position.distanceTo(camera.position);

        // Intersection is close than the point
        if (intersectionDistance < pointDistance) {
          // Hide
          point.element.classList.remove("visible");
        }
        // Intersection is further than the point
        else {
          // Show
          point.element.classList.add("visible");
        }
      }

      const translateX = screenPosition.x * sizes.width * 0.5;
      const translateY = -screenPosition.y * sizes.height * 0.5;
      point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    }
  }
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

// Function - Build Colors
const buildColors = (colors) => {
  for (let [i, color] of colors.entries()) {
    let swatch = document.createElement("div");
    swatch.classList.add("tray__swatch");

    swatch.style.background = "#" + color.color;

    swatch.setAttribute("data-key", i);
    TRAY.append(swatch);
  }

  // Swatches
  const swatches = document.querySelectorAll(".tray__swatch");

  for (const swatch of swatches) {
    swatch.addEventListener("click", () => {
      selectSwatch(swatch);
    });
  }
};

const selectSwatch = (e) => {
  console.log(e.getAttribute("data-key"));
  let color = colors[parseInt(e.getAttribute("data-key"))];
  let new_mtl;
  console.log(color);
  new_mtl = new THREE.Color("#" + color.color);

  updateAllMaterials(new_mtl);
};

const playClipByIndex = (index) => {
  //let action = null;
  mixer = new THREE.AnimationMixer(obj);
  action = mixer.clipAction(animations[index]);
  action.reset();
  action.timeScale = 1;
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  action.play();
  if (index === 0) {
    isBottomDoorOpened = false;
  }
  if (index === 1) {
    isRightDoorOpened = false;
  }
  if (index === 2) {
    isLeftDoorOpened = false;
  }
};

const playClipReverseByIndex = (index) => {
  //let action = null;
  mixer = new THREE.AnimationMixer(obj);
  action = mixer.clipAction(animations[index]);
  action.reset();
  action.paused = false;
  if (action.time === 0) {
    action.time = action.getClip().duration;
  }
  action.timeScale = -1;
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  action.play();
  console.log(index, index);
  if (index === 0) {
    isBottomDoorOpened = true;
  }
  if (index === 1) {
    isRightDoorOpened = true;
  }
  if (index === 2) {
    isLeftDoorOpened = true;
  }
};

const handleClick = (side) => {
  console.log(side, side);
  let s = side;
  if (s === "right") {
    if (isRightDoorOpened) {
      playClipByIndex(1);
    } else {
      playClipReverseByIndex(1);
    }
    side = null;
  }

  if (s === "left") {
    if (isLeftDoorOpened) {
      playClipByIndex(2);
    } else {
      playClipReverseByIndex(2);
    }
    side = null;
  }
  if (s === "bottom") {
    if (isBottomDoorOpened) {
      playClipByIndex(0);
    } else {
      playClipReverseByIndex(0);
    }
    side = null;
  }
};
const btn1 = document.querySelector(".point-0");
const btn2 = document.querySelector(".point-1");
const btn3 = document.querySelector(".point-2");

btn1.addEventListener("click", () => {
  handleClick("left");
});
btn2.addEventListener("click", () => {
  handleClick("right");
});
btn3.addEventListener("click", () => {
  handleClick("bottom");
});

buildColors(colors);
tick();
