import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
// import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm";
// import gsap from "gsap/gsap-core";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";

//  modules for bloom effect
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

//
// essential variables
//
let annotationSpriteMaterial;

//
// Toggle Sound Function
//
const playPauseButton = document.querySelector(".play-pause-button");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const audio = document.getElementById("background-music");

playPauseButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playIcon.style.display = "inline-block";
    pauseIcon.style.display = "none";
  } else {
    audio.pause();
    playIcon.style.display = "none";
    pauseIcon.style.display = "inline-block";
  }
});

audio.addEventListener("ended", () => {
  playIcon.style.display = "inline-block";
  pauseIcon.style.display = "none";
});
//
// // setting btn
//
// const settings = document.querySelector("");
// window.showSetting = function(){
//   settings.style.display = 'block';
// }

//
// canvas
//
const canvas = document.querySelector(".webgl");

//
// camera parameters
//
let fov = 60;
let aspectRatio = window.innerWidth / window.innerHeight;
let far = 1000;
let near = 0.1;

//
// scene
//
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x440146);
scene.fog = new THREE.FogExp2(0x440146, 0.02);

//
// fog
//
// scene.fog = new THREE.Fog(0x323236, 10, 15);

//
// camera
//
const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
camera.position.set(4, 2, 4);
scene.add(camera);

//
// reflectors/mirrors
//

let geometry;

geometry = new THREE.PlaneGeometry(100, 100);
let groundMirror = new Reflector(geometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0xb5b5b5,
});
groundMirror.position.y = -0.002;
groundMirror.rotateX(-Math.PI / 2);
scene.add(groundMirror);

//
// another plane transperent geometry to achieve  reflection effect
//

// const planeTextureLoader = new THREE.TextureLoader();

let planeGeometry = new THREE.PlaneGeometry(100, 100);
let planeMaterial = new THREE.MeshPhysicalMaterial();
let plane = new THREE.Mesh(planeGeometry, planeMaterial);
planeMaterial.color.set(0x440146);
planeMaterial.opacity = 0.9;
planeMaterial.transparent = true;
planeMaterial.metalness = 0.5;
planeMaterial.roughness = 0.3;
plane.receiveShadow = true;
plane.position.y = -0.001;
plane.rotateX(-Math.PI / 2);
scene.add(plane);

//
// car color customization
//
window.showColorBar = function (colorBarId) {
  const colorBar = document.getElementById(colorBarId);
  const isVisible = colorBar.style.display === "block";

  // Hide all color bars
  const allColorBars = document.querySelectorAll('[id$="bar"]');
  for (let i = 0; i < allColorBars.length; i++) {
    allColorBars[i].style.display = "none";
  }

  // Toggle the visibility of the clicked color bar
  colorBar.style.display = isVisible ? "none" : "block";
};

window.setColor = function (event) {
  const color = event.target.style.backgroundColor;
  const colorName = event.target.id;

  //
  // Update car or rim color based on the button clicked
  //
  if (
    colorName === "grayBody" ||
    colorName === "whiteBody" ||
    colorName === "redBody" ||
    colorName === "blueBody" ||
    colorName === "purpleBody"
  ) {
    // Update car color
    carModel.traverse(function (child) {
      if (
        child &&
        child.isMesh &&
        child.userData.name &&
        child.userData.name.includes("Carpaint") &&
        !child.userData.name.includes("Black") &&
        !child.userData.name.includes("Wiper")
      ) {
        child.material.color.set(color);
        scene.background = new THREE.Color(color);
        plane.material.color.set(color);
        scene.fog = new THREE.FogExp2(color, 0.04);
      }
    });
  } else {
    // Update rim color
    carModel.traverse(function (child) {
      if (
        child &&
        child.isMesh &&
        child.userData.name &&
        child.userData.name.includes("Rim")
      ) {
        child.material.color.set(color);
      }
    });
  }

  // Toggle selected class for UI feedback
  const allColorButtons = document.querySelectorAll(".color-button");
  for (let i = 0; i < allColorButtons.length; i++) {
    allColorButtons[i].classList.remove("selected");
  }
  event.target.classList.add("selected");
};

//
// renderer
//
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);

//
// envmap
//

const pmremGenerator = new THREE.PMREMGenerator(renderer);
var envMap;
const hdriLoader = new RGBELoader();
hdriLoader.load("parking.hdr", function (texture) {
  envMap = pmremGenerator.fromEquirectangular(texture).texture;
  texture.dispose();
  scene.environment = envMap;
  // scene.background = envMap;
});

//
// envmap
//

// const pmremGenerator = new THREE.PMREMGenerator(renderer);
// var envMap;

// const loadAssetsPromise = Promise.all([
//   new Promise((resolve, reject) => {
//     const loader = new GLTFLoader();
//     loader.load("ac_-_mclaren_p1_free.glb", resolve, undefined, reject);
//   }),
//   new Promise((resolve, reject) => {
//     const hdriLoader = new RGBELoader();
//     hdriLoader.load("parking.hdr", resolve, undefined, reject);
//   }),
// ]);

// loadAssetsPromise
//   .then(([gltf, texture]) => {
//     carModel = gltf.scene;
//     carModel.position.y = 0.01;
//     carModel.traverse(function (child) {
//       if (child && child.isMesh) {
//         child.castShadow = true;
//       }
//     });
//     envMap = pmremGenerator.fromEquirectangular(texture).texture;
//     carModel.environment = envMap;
//     scene.add(carModel);
//     updateCarMaterials();
//     animate();
//     scene.environment = envMap;
//   })
//   .catch((error) => {
//     console.error("Error loading assets:", error);
//   });

//
// orbitcontrols
//
const controls = new OrbitControls(camera, canvas);
controls.autoRotate = true;
controls.autoRotateSpeed = 1;
controls.enablePan = true;
controls.enableZoom = true;
controls.minDistance = 3;
controls.maxDistance = 12;
controls.enableDamping = true;
controls.minPolarAngle = Math.PI * 0.3;
controls.maxPolarAngle = Math.PI * 0.46;
controls.dampingFactor = 0.085;
controls.rotateSpeed = 0.5;
controls.update();

//
// grid helper
//
// const gridHelper = new THREE.GridHelper(10,20);
// scene.add(gridHelper);

//
//  annotations
//
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

const circleTexture = new THREE.TextureLoader().load(
  "assets/circle-png-176.png"
);

// Ensure that circleTexture and scene are defined and initialized properly in your code.

// Ensure that circleTexture and scene are defined and initialized properly in your code.

// Array to store annotation markers
const annotationMarkers = [];

// Function to create an annotation
function annotation(name, x, y, z) {
  const annotationSpriteMaterial = new THREE.SpriteMaterial({
    map: circleTexture,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: false,
  });
  const annotationSprite = new THREE.Sprite(annotationSpriteMaterial);
  annotationSprite.scale.set(0.035, 0.035, 0.035);
  annotationSprite.position.set(x, y, z);
  annotationSprite.visible = false;

  annotationSprite.renderOrder = 1;
  annotationSprite.name = name;
  scene.add(annotationSprite);
  annotationMarkers.push(annotationSprite);
}

// Create annotations
annotation("rim", 1.1, 0.1, -1.6);
annotation("tyres", 1.2, 0.8, 1.6);
annotation("mirror", 1.2, 1, 0.6);
annotation("Flights", -0.9, 0.7, 2.09);
annotation("wipers", -0.3, 1, 1.6);
annotation("Blights", -0.9, 0.7, -2.3);

// Add event listener for the hotspots button
const hotspotsButton = document.getElementById("hotspotsButton");
console.log(hotspotsButton); // Check if the element is found
if (hotspotsButton) {
  console.log("hotspotsButton found");
  hotspotsButton.addEventListener("click", function () {
    const areAnnotationsVisible = annotationMarkers.some(
      (annotationSprite) => annotationSprite.visible
    );
    annotationMarkers.forEach((annotationSprite) => {
      annotationSprite.visible = !areAnnotationsVisible;
    });
  });
} else {
  console.error('Element with ID "hotspotsButton" not found.');
}

// // Create a canvas element to draw the ID
// function createIDCanvas(id) {
//   const canvas = document.createElement('canvas');
//   canvas.width = 64;
//   canvas.height = 64;
//   const context = canvas.getContext('2d');

//   // Draw the ID text
//   context.font = '20px Arial';
//   context.fillStyle = 'white';
//   context.textAlign = 'center';
//   context.textBaseline = 'middle';
//   context.fillText(id, canvas.width / 2, canvas.height / 2);

//   return canvas;
// }

// function annotation(name, x, y, z, id) {
//   const annotationSpriteMaterial = new THREE.SpriteMaterial({
//     map: new THREE.CanvasTexture(createIDCanvas(id)), // Use canvas texture
//     depthTest: false,
//     depthWrite: false,
//     sizeAttenuation: false,
//   });
//   const annotationSprite = new THREE.Sprite(annotationSpriteMaterial);
//   annotationSprite.scale.set(0.035, 0.035, 0.035);
//   annotationSprite.position.set(x, y, z);
//   annotationSprite.renderOrder = 1;
//   annotationSprite.name = name;
//   scene.add(annotationSprite);
//   annotationMarkers.push(annotationSprite);
// }

// // Example usage:
// annotation("rim", 1, 0.4, 1.5, "A1");
// annotation("tyres", -1.2, 0.2, 1.6, "B2");
// annotation("mirror", 1.2, -2, 0.6, "C3");
// annotation("Flights", -0.9, 0.72, 2.09, "D4");
// annotation("wipers", -0.3, 0, 1.6, "E5");
// annotation("Blights", -0.9, 0.7, -2.3, "F6");

const raycaster = new THREE.Raycaster();

const p = document.createElement("p");
p.className = "hotspot";
const pContainer = document.createElement("div");
pContainer.appendChild(p);
const cPointLabel = new CSS2DObject(pContainer);
scene.add(cPointLabel);

renderer.domElement.addEventListener("click", onClick, false);
function onClick(event) {
  raycaster.setFromCamera(
    {
      x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
      y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
    },
    camera
  );

  const intersects = raycaster.intersectObjects(annotationMarkers, true);
  if (intersects.length > 0) {
    // if (intersects[0].object.userData && intersects[0].object.userData.id) {
    //     gotoAnnotation(annotations[intersects[0].object.userData.id])
    // }
    switch (intersects[0].object.name) {
      case "rim":
        p.className = "hotspot show";
        cPointLabel.position.set(1, 0.1, -1.6);
        p.textContent =
          " RIM :  Alloy wheel rims are comprised of several different metals, but the primary metal used is aluminum, which makes them lighter than steel rims.";

        gsap.to(camera.position, {
          x: 1,
          y: 0.1,
          z: -1.6,
          duration: 0.8,
        });
        break;

      case "tyres":
        p.className = "hotspot show";
        cPointLabel.position.set(1.2, 0.8, 1.6);
        p.textContent =
          " Tyres : Alloy wheel rims are comprised of several different metals, but the primary metal used is aluminum, which makes them lighter than steel rims.";

        gsap.to(camera.position, {
          x: 1.2,
          y: 0.8,
          z: 1.6,
          duration: 0.8,
        });

        break;

      case "mirror":
        p.className = "hotspot show";
        cPointLabel.position.set(1.2, 1, 0.6);
        p.textContent =
          " mirrors : Alloy wheel rims are comprised of several different metals, but the primary metal used is aluminum, which makes them lighter than steel rims.";

        gsap.to(camera.position, {
          x: 1.2,
          y: 1,
          z: 1.2,
          duration: 0.8,
        });

        break;
      case "Flights":
        p.className = "hotspot show";
        cPointLabel.position.set(-0.9, 0.7, 2.09);
        p.textContent =
          " The light bar is dimmable and has a surround made of a single piece of aluminum.";
        gsap.to(camera.position, {
          x: -0.9,
          y: 0.7,
          z: 2.09,
          duration: 0.8,
        });
        break;
      case "wipers":
        p.className = "hotspot show";
        cPointLabel.position.set(-0.3, 1, 1.6);
        p.textContent =
          " wipers are made from a variety of materials, including leather, carbon, platinum, and solid aluminum. The seats are known for their hand-stitched, finely quilted leather.";
        gsap.to(camera.position, {
          x: -0.3,
          y: 1,
          z: 1.6,
          duration: 0.8,
        });
        break;
      case "Blights":
        p.className = "hotspot show";
        cPointLabel.position.set(-0.9, 0.7, -2.3);
        p.textContent =
          " seats are made from a variety of materials, including leather, carbon, platinum, and solid aluminum. The seats are known for their hand-stitched, finely quilted leather.";
        gsap.to(camera.position, {
          x: -0.8,
          y: 0.8,
          z: -4,
          duration: 0.8,
        });
        break;
      default:
        break;
    }
  } else {
    p.className = "hotspot hide";
  }
}

//
// Ambient Light
//
const ambientLight = new THREE.AmbientLight(0xfffffff, 5);
scene.add(ambientLight);

//
// Direction light
//
const directionalLight = new THREE.DirectionalLight(0xfffffff, 15);

directionalLight.castShadow = true;

scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xfffffff, 0);

directionalLight.castShadow = true;

// const spotLight = new THREE.SpotLight("white", 10);
// spotLight.castShadow = true;
// spotLight.position.y = 4;

// spotLight.penumbra = 1;
// spotLight.angle = 1.04;
// spotLight.distance = 10;
// spotLight.decay = 3;

// scene.add(spotLight.target);
// scene.add(spotLight);

//
// // Loading Manager
//
const progressContainer = document.querySelector("div.spinner-box");

let loadingManager = new THREE.LoadingManager();
let startTime = Date.now();
loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  // console.log('Start time : ', startTime);
  // console.log('Started loading files.');
  setTimeout(() => {
    // progressText.innerText = 'Loading Assets...';
  }, 100);
};

loadingManager.onLoad = function () {
  setTimeout(() => {
    progressContainer.style.display = "none";
    audio.play();
  }, 1800);
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  // console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
  // let progressPercentage = Math.round(itemsLoaded / itemsTotal * 100);
  // progressBar.value = progressPercentage / 100 - 0.02;
  // console.log(progressPercentage, progressBar.value);
};

loadingManager.onError = function (url) {
  console.log("There was an error loading " + url);
};
//
// DEBUG UI
//
let objDebug = {
  carColor: 0x440146,
  rimColor: "silver",
};
// const gui = new GUI();
// console.log(gui);

// gui.addColor(objDebug, "carColor").onChange(() => {
//   updateCarMaterials();
// });

// gui.addColor(objDebug, "rimColor").onChange(() => {
//   updateCarMaterials();
// });

//
// loader
//
const loader = new GLTFLoader(loadingManager);
let carModel;
loader.load(
  "ac_-_mclaren_p1_free.glb",
  function (gltf) {
    carModel = gltf.scene;

    carModel.environment = envMap;
    // console.log(carModel.child.material);
    // carModel.position.y = -0.6;
    carModel.traverse(function (child) {
      if (child && child.isMesh) {
        child.castShadow = true;
      }
    });

    updateCarMaterials();
    scene.add(carModel);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Create bloom pass
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
// Adjust threshold, strength, radius, and exposure as needed
bloomPass.threshold = 0;
bloomPass.strength = 0.18;
bloomPass.radius = 0.1;
bloomPass.exposure = 1.2;

// Set up composer
const renderScene = new RenderPass(scene, camera);
const bloomComposer = new EffectComposer(renderer);

const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
effectFXAA.renderToScreen = true;
bloomComposer.addPass(effectFXAA);
bloomComposer.addPass(renderScene);

if (carModel) {
  carModel.layers.enable(BLOOM_SCENE);
}

//
//  upate function
//
let updateCarMaterials = () => {
  // if (!carModel) return; // Ensure carModel is defined
  // const directionalLight = new THREE.DirectionalLight(0xfffffff, 1);
  // scene.add(directionalLight);

  carModel.traverse(function (child) {
    if (child && child.isMesh) {
      child.castShadow = true;

      // Apply custom material properties based on userData.name
      if (
        child.userData.name &&
        child.userData.name.includes("Carpaint") &&
        !child.userData.name.includes("Black") &&
        !child.userData.name.includes("Wiper")
      ) {
        child.material.color.set(objDebug.carColor);
        child.material.metalness = 0.83;
        child.material.roughness = 0.3;
      }
      if (child.userData.name && child.userData.name.includes("Rim")) {
        child.material.color.set(objDebug.rimColor);
        child.material.metalness = 0.9;
        child.material.roughness = 0;
      }
      if (child.userData.name && child.userData.name.includes("Caliper")) {
        child.material.color.set("purple");
        child.material.metalness = 0.83;
        child.material.roughness = 0.3;
      }
    }
  });
};

//  car light on and off //

const lights_On = document.getElementsByClassName("lights_on");
const lights_Off = document.getElementsByClassName("lights_off");

Array.from(lights_On).forEach((light) => {
  light.addEventListener("click", function () {
    Array.from(lights_Off).forEach(
      (offLight) => (offLight.style.display = "block")
    );
    Array.from(lights_On).forEach(
      (onLight) => (onLight.style.display = "none")
    );

    bloomComposer.removePass(bloomPass);
    bloomComposer.addPass(bloomPass);

    carModel.traverse((child) => {
      if (child.isMesh) {
        if (child.userData.name.includes("Taillights")) {
          child.material.metalness = 1;
          child.material.roughness = 0;
          child.material.emissive = new THREE.Color(0xff0000);
          child.material.emissiveIntensity = 10;
        }
        if (child.userData.name.includes("Headlights")) {
          child.material.metalness = 1;
          child.material.roughness = 0;
          child.material.emissive = new THREE.Color(0xffffff);
          child.material.emissiveIntensity = 10;
        }
      }
    });
    scene.add(directionalLight2);
    scene.remove(directionalLight);
    console.log("Checkbox is selected");
  });
});

Array.from(lights_Off).forEach((light) => {
  light.addEventListener("click", function () {
    Array.from(lights_Off).forEach(
      (offLight) => (offLight.style.display = "none")
    );
    Array.from(lights_On).forEach(
      (onLight) => (onLight.style.display = "block")
    );
    bloomComposer.removePass(bloomPass);

    scene.remove(directionalLight2);
    scene.add(directionalLight);
    carModel.traverse((child) => {
      if (child.isMesh) {
        if (child.userData.name.includes("Taillights")) {
          child.material.metalness = 1;
          child.material.roughness = 0;
          child.material.emissive = new THREE.Color(0xff0000);
          child.material.emissiveIntensity = 0;
        }
        if (child.userData.name.includes("Headlights")) {
          child.material.metalness = 1;
          child.material.roughness = 0;
          child.material.emissive = new THREE.Color(0xffffff);
          child.material.emissiveIntensity = 0;
        }
      }
    });
    console.log("Checkbox is deselected");
  });
});

// window resize
//

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
}

//
// animation funtion
//
function animate() {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  bloomComposer.render();

  requestAnimationFrame(animate);
}
animate();
