window.focus(); 
let camera, scene, renderer; 
let world; 
let lastTime; 
let stack; 
let overhangs; 
const boxHeight = 1; 
const originalBoxSize = 3; 
let autopilot;
let gameEnded;
let robotPrecision;
const scoreElement = document.getElementById("score");
const instructionElement = document.getElementById("instruction");
const resultElement = document.getElementById("result");
var muz = new Audio();
var szmak = new Audio();
muz.src = "https://cdn.jsdelivr.net/gh/Alexprud09/Piramida@799ef0e29c5e6950cb18ad547f15d7cc7ba2919f/pir.mp3";
szmak.src = "https://cdn.jsdelivr.net/gh/Alexprud09/Piramida@799ef0e29c5e6950cb18ad547f15d7cc7ba2919f/sss.mp3";


function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; 
  const layer = generateBox(x, y, z, width, depth, false); 
  layer.direction = direction; 
  stack.push(layer); 
}

function generateBox(x, y, z, width, depth, falls) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth); 
  const color = new THREE.Color(`hsl(${30 + stack.length * 4},100%,50%)`); 
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)); 
  let mass = falls ? 5 : 0; 
  mass = width / originalBoxSize;
  mass = depth / originalBoxSize;
  const body = new CANNON.Body({ mass, shape }); 
  body.position.set(x, y, z); 
  world.addBody(body);
  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth,
  };
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); 
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction; 
  const newWidth = direction == "x" ? overlap : topLayer.width;
  const newDepth = direction == "z" ? overlap : topLayer.depth;

  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;

  topLayer.cannonjs.position[direction] -= delta/2

  const shape = new CANNON.Box(
    new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
  );
  topLayer.cannonjs.shape = [];
  topLayer.cannonjs.addShape(shape);
}

function init() {
  autopilot = true; 
  muz.play();
  gameEnded = false; 
  lastTime = 0;
  stack = []; 
  overhangs = []; 
  robotPrecision = Math.random() * 1 - 0.5; 
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;

  camera = new THREE.OrthographicCamera(
    width / -2,
    width / 2,
    height / 2,
    height / -2,
    1,
    100
  );
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  world = new CANNON.World();
  world.gravity.set(0, -10, 0); 
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  scene = new THREE.Scene();
  addLayer(0, 0, originalBoxSize, originalBoxSize); 
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x"); 
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directLight = new THREE.DirectionalLight(0xffffff, 0.6); 
  directLight.position.set(5, 10, 0);
  scene.add(directLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.render(scene, camera);
  renderer.setAnimationLoop(animation);
}

init();

function startGame() {
  autopilot = false; 
  gameEnded = false;
  muz.pause();
  lastTime = 0; 
  stack = [];
  overhangs = []; 
  if (instructionElement) instructionElement.style.display = "none";
  if (resultElement) resultElement.style.display = "none";
  if (scoreElement) scoreElement.innerText = 0;

  if (world) {
    while (world.bodies.length > 0) {
      world.remove(world.bodies[0]);
    }
  }

  if (scene) {
    while (scene.children.find((c) => c.type == "Mesh")) {
      const mesh = scene.children.find((c) => c.type == "Mesh");
      scene.remove(mesh);
    }
  }

  addLayer(0, 0, originalBoxSize, originalBoxSize);
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x"); 

  if (camera) {
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
  }
}

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|IOS|Kindle|Silk|Opera Mini/i.test(navigator.userAgent
  )
)
{
  window.addEventListener("touchstart", eventHandler);
  window.addEventListener("touchmove", startGame)
} else {
  window.addEventListener("mousedown", eventHandler);
}
// window.addEventListener("mousedown", eventHandler)
// window.addEventListener("touchstart", eventHandler);
  window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    eventHandler();
    return;
  }
  if (
    event.key == "R" ||
    event.key == "r" ||
    event.key == "К" ||
    event.key == "к"
  ) {
    event.preventDefault();
    startGame();
    return;
  }
});

function eventHandler() {
  if (autopilot)
    startGame(); 
  else fix_Block_on_Piramid();
}

function fix_Block_on_Piramid() {
  if (gameEnded) return;

  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];

  const direction = topLayer.direction;

  const size = direction == "x" ? topLayer.width : topLayer.depth;
  const delta =
    topLayer.threejs.position[direction] -
    previousLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;


  if (overlap > 0) {
    cutBox(topLayer, overlap, size, delta);
    szmak.play();

    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX =
      direction == "x"
        ? topLayer.threejs.position.x + overhangShift
        : topLayer.threejs.position.x;
    const overhangZ =
      direction == "z"
        ?
          topLayer.threejs.position.z + overhangShift
        : topLayer.threejs.position.z;
    const overhangWidth = direction == "x" ? overhangSize : topLayer.width;
    const overhangDepth = direction == "z" ? overhangSize : topLayer.depth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
    const newWidth = topLayer.width;
    const newDepth = topLayer.depth;
    const nextDirection = direction == "x" ? "z" : "x";

    if (scoreElement) scoreElement.innerText = stack.length - 1;
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
    } else {
          missed_The_Spot();
  }
}

function missed_The_Spot() {
  const topLayer = stack[stack.length - 1];
  addOverhang(
    topLayer.threejs.position.x,
    topLayer.threejs.position.z,
    topLayer.width,
    topLayer.depth
  );
  world.remove(topLayer.cannonjs);
  scene.remove(topLayer.threejs);
  gameEnded = true;
  muz.play();
  if (resultElement && !autopilot) resultElement.style.display = "flex";
}

function animation(time) {
  if (lastTime) {
    const timePassed = time - lastTime;
    const speed = 0.008;
    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];
    const boxShouldMove =
      !gameEnded &&
      (!autopilot ||
        (autopilot &&
          topLayer.threejs.position[topLayer.direction] <
            previousLayer.threejs.position[topLayer.direction] +
              robotPrecision));
    if (boxShouldMove) {
      topLayer.threejs.position[topLayer.direction] += speed * timePassed;
      topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;

      if (topLayer.threejs.position[topLayer.direction] > 10) {
        missed_The_Spot();
      }
    } else {
      if (autopilot) {
        fix_Block_on_Piramid();
        robotPrecision = Math.random() * 1 - 0.5;
      }
    }

    if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
      camera.position.y += speed * timePassed;
    }
    updatePhysics(timePassed);
    renderer.render(scene, camera);
  }
  lastTime = time;
}
function updatePhysics(timePassed) {
  world.step(timePassed / 1000);
  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}
window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  const width = 30;
  const height = width / aspect;
  camera.top = height;
  camera.bottom = -height;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});
