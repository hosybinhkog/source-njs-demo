import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import Stats from "three/examples/jsm/libs/stats.module";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import * as dat from "lil-gui";

var stats = new Stats();
stats.showPanel(0);
Object.assign(stats.dom.style, {
  position: "fixed",
  height: "max-content",
  left: "0",
  right: "auto",
  top: "auto",
  bottom: "0",
});
document.body.appendChild(stats.dom);

const loader = new GLTFLoader();
const plyLoader = new PLYLoader();
const objLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();

const gui = new dat.GUI();
let objMaterial, objObject;
let glbObject, plyObject;
let transformControls = {};

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const params = {
  color: "#000000",
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(params.color);
gui
  .addColor(params, "color")
  .name("background color")
  .onChange(function (value) {
    scene.background.set(value);
  });

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 1, -4);
scene.add(camera);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
scene.add(directionalLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
document.body.appendChild(labelRenderer.domElement);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);
gui.add(gridHelper, "visible").name("Show Grid");
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
gui.add(axesHelper, "visible").name("Show Axes");

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const orbitcontrols = new OrbitControls(camera, labelRenderer.domElement);
orbitcontrols.enableDamping = true;

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  labelRenderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function render() {
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

const tick = () => {
  stats.begin();
  // Update controls
  orbitcontrols.update();

  onChangePLY();

  stats.end();

  // Render
  render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

const loadButton = document.getElementById("loadButton");
loadButton.addEventListener("click", function () {
  const fileInput = document.getElementById("fileInput");
  fileInput.click();
});

const labelFolder = gui.addFolder("Text");
const addCommentButton = document.getElementById("addComment");
addCommentButton.addEventListener("click", function () {
  const annotationDiv = document.createElement("div");
  annotationDiv.className = "label";
  annotationDiv.textContent = "Default Text";
  // annotationDiv.style.backgroundColor = 'transparent'

  const testLabel = new CSS2DObject(annotationDiv);
  testLabel.position.set(0, 1, 0);
  testLabel.center.set(0, 1);
  scene.add(testLabel);

  const tfControl = new TransformControls(camera, labelRenderer.domElement);
  tfControl.setSize(0.5);
  tfControl.addEventListener("change", render);
  tfControl.addEventListener("dragging-changed", function (event) {
    orbitcontrols.enabled = !event.value;
  });
  tfControl.attach(testLabel);
  scene.add(tfControl);

  labelFolder.add(annotationDiv, "textContent").name("Text field");
  labelFolder
    .add(tfControl, "visible")
    .name("Visible control")
    .onChange(function (e) {
      tfControl.enabled = tfControl.visible;
    });
  labelFolder
    .addColor(annotationDiv.style, "background")
    .name("Text background");
  labelFolder.addColor(annotationDiv.style, "color").name("Text Color");
});

const imageFolder = gui.addFolder("Image");
const addImageButton = document.getElementById("addImage");
addImageButton.addEventListener("click", function () {
  const imageInput = document.getElementById("imageInput");
  imageInput.click();
});

const imageInput = document.getElementById("imageInput");
imageInput.addEventListener("change", handleImageSelect, false);

function handleImageSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    const contents = event.target.result;
    const texture = textureLoader.load(contents);

    const mat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(mat);
    scene.add(sprite);

    const tfControl = new TransformControls(camera, labelRenderer.domElement);
    tfControl.setSize(0.5);
    tfControl.addEventListener("change", render);
    tfControl.addEventListener("dragging-changed", function (event) {
      orbitcontrols.enabled = !event.value;
    });
    tfControl.attach(sprite);
    scene.add(tfControl);

    imageFolder
      .add(tfControl, "visible")
      .name("Visible control")
      .onChange(function (e) {
        tfControl.enabled = tfControl.visible;
      });

    imageFolder.add(sprite.scale, "x").min(0.1).max(5);
    imageFolder.add(sprite.scale, "y").min(0.1).max(5);
  };

  reader.readAsDataURL(file);
}

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", handleFileSelect, false);

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  const fileExtension = getFileExtensionFromFileName(file.name);
  reader.onload = function (event) {
    const contents = event.target.result;
    if (fileExtension === "ply") {
      loadModelPLY(contents);
    }
    if (fileExtension === "obj") {
      loadModelObj(contents);
    }
    if (fileExtension === "jpg") {
      loadJPG(contents);
    }
    if (fileExtension === "glb" || fileExtension === "gltf") {
      loadModel(contents);
    }
  };

  reader.readAsDataURL(file);
}

function loadModelPLY(dataUrl) {
  // Loaders
  plyLoader.load(
    dataUrl,
    function (geometry) {
      var material = new THREE.PointsMaterial({ size: 0.005 });
      material.vertexColors = true;
      const mesh = new THREE.Points(geometry, material);
      //mesh.rotation.x = -Math.PI * 0.5;
      plyObject = mesh;
      plyObject.layers.enable(1);
      scene.add(mesh);

      //Transform Control PLY
      const tfControl = new TransformControls(camera, labelRenderer.domElement);
      tfControl.addEventListener("change", render);
      tfControl.addEventListener("dragging-changed", function (event) {
        orbitcontrols.enabled = !event.value;
      });
      tfControl.attach(mesh);
      scene.add(tfControl);

      const tfFunc = {
        translate: function () {
          tfControl.setMode("translate");
        },
        rotate: function () {
          tfControl.setMode("rotate");
        },
        rotateX90: function () {
          mesh.rotation.x += -Math.PI * 0.5;
        },
        rotateY90: function () {
          mesh.rotation.y += -Math.PI * 0.5;
        },
        rotateZ90: function () {
          mesh.rotation.z += -Math.PI * 0.5;
        },
      };

      transformControls[mesh.name] = tfControl;

      //PLY Gui
      const pointCloudFolder = gui.addFolder("Point Cloud");
      pointCloudFolder.add(plyObject, "visible").name("show pointcloud");
      pointCloudFolder.add(material, "size").min(0.001).max(0.1).step(0.0001);
      pointCloudFolder.add(tfControl, "visible").onChange(function (e) {
        tfControl.enabled = e;
      });
      // pointCloudFolder.add(tfControl, 'enabled')
      pointCloudFolder.add(tfFunc, "translate").name("Move Mode");
      pointCloudFolder.add(tfFunc, "rotate").name("Rotate Mode");
      pointCloudFolder.add(tfFunc, "rotateX90").name("Rotate X 90");
      pointCloudFolder.add(tfFunc, "rotateY90").name("Rotate Y 90");
      pointCloudFolder.add(tfFunc, "rotateZ90").name("Rotate Z 90");
    },
    undefined,
    function (error) {
      console.error("Error loading model:", error);
    }
  );
}

function loadModel(dataUrl) {
  loader.load(
    dataUrl,
    function (gltf) {
      glbObject = gltf.scene;
      glbObject.layers.set(1);
      scene.add(gltf.scene);

      //Transform Control PLY
      const tfControl = new TransformControls(camera, labelRenderer.domElement);
      tfControl.addEventListener("change", render);
      tfControl.addEventListener("dragging-changed", function (event) {
        orbitcontrols.enabled = !event.value;
      });
      tfControl.attach(glbObject);
      scene.add(tfControl);

      const tfFunc = {
        translate: function () {
          tfControl.setMode("translate");
        },
        rotate: function () {
          tfControl.setMode("rotate");
        },
        scale: function () {
          tfControl.setMode("scale");
        },
        rotateX90: function () {
          glbObject.rotation.x += -Math.PI * 0.5;
        },
        rotateY90: function () {
          glbObject.rotation.y += -Math.PI * 0.5;
        },
        rotateZ90: function () {
          glbObject.rotation.z += -Math.PI * 0.5;
        },
      };

      transformControls[glbObject.name] = tfControl;

      //PLY Gui
      const positionFolder = gui.addFolder("Position");
      positionFolder.add(tfControl, "visible");
      positionFolder.add(tfControl, "enabled");
      positionFolder.add(tfFunc, "translate").name("Move Mode");
      positionFolder.add(tfFunc, "rotate").name("Rotate Mode");
      positionFolder.add(tfFunc, "scale").name("Scale Mode");
      positionFolder.add(tfFunc, "rotateX90").name("Rotate X 90");
      positionFolder.add(tfFunc, "rotateY90").name("Rotate Y 90");
      positionFolder.add(tfFunc, "rotateZ90").name("Rotate Z 90");
    },
    undefined,
    function (error) {
      console.error("Error loading model:", error);
    }
  );
}

function loadModelObj(dataUrl) {
  objLoader.load(
    dataUrl,
    function (obj) {
      obj.rotation.x = -Math.PI * 0.5;
      if (objMaterial != null) {
        obj.material = objMaterial;
      }
      objObject = obj;
      objObject.layers.enable(1);
      scene.add(obj);

      const objFolder = gui.addFolder("OBJ");
      objFolder.add(obj, "visible");

      const tfFunc = {
        rotateX90: function () {
          objObject.rotation.x += -Math.PI * 0.5;
        },
        rotateY90: function () {
          objObject.rotation.y += -Math.PI * 0.5;
        },
        rotateZ90: function () {
          objObject.rotation.z += -Math.PI * 0.5;
        },
      };

      objFolder.add(tfFunc, "rotateX90").name("Rotate X 90");
      objFolder.add(tfFunc, "rotateY90").name("Rotate Y 90");
      objFolder.add(tfFunc, "rotateZ90").name("Rotate Z 90");
    },
    undefined,
    function (error) {
      console.error("Error loading model:", error);
    }
  );
}

function loadJPG(dataUrl) {
  const texture = textureLoader.load(dataUrl);
  if (objObject != null) {
    const mat = new THREE.MeshBasicMaterial({ map: texture, side: 2 });
    objObject.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = mat;
      }
    });
  }
}

function onChangePLY() {
  if (objObject == null || plyObject == null) {
    return;
  }
  objObject.position.set(
    plyObject.position.x,
    plyObject.position.y,
    plyObject.position.z
  );
}
function getFileExtensionFromFileName(str) {
  const fileExtensionRegex = /(?:\.([^.]+))?$/;
  const match = fileExtensionRegex.exec(str);
  return match && match[1] ? match[1].toLowerCase() : null;
}

function parseScene() {
  const json = scene.toJSON();
  console.log(json);
}

document.querySelector("#export").addEventListener("click", parseScene);
