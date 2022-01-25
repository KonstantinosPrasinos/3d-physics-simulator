import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/TransformControls.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

import {FlyControls} from './controls.js';

let canvas = document.getElementById("viewportCanvas");
let topTime = document.getElementById("time");

let flyControls, savedobjects = [], scene, renderer, camera, orthographicCamera, perspectiveCamera, world, timeStep = 1 / 60, orbitControls, transformControls, previousLogedTime, frustumSize = 40, statsOn = false, stats, currentlyCheckedBox;
let aspect = parseInt(window.getComputedStyle(canvas).width) / parseInt(window.getComputedStyle(canvas).height);

function changeTimeStep(temp) {
    timeStep = temp;
}

function setCamera(cameraType) {
    
    if (camera.type != cameraType) {
        let transformControlsWereAttached = !(!transformControls.object);
        // if (transformControlsWereAttached){
        //     transformControls.detach()
        // }
        switch (cameraType) {
            case "PerspectiveCamera":
                flyControls.canLockOn = true;
                camera = perspectiveCamera;
                orbitControls.enabled = false;
                transformControls.camera = camera;
                transformControls.enabled = false;
                
                camera.updateMatrixWorld();
                camera.updateProjectionMatrix();
                break;
            case "OrthographicCamera":
                flyControls.canLockOn = false;
                camera = orthographicCamera;
                orbitControls.object = camera;
                orbitControls.reset();
                orbitControls.enabled = true;
                camera.updateMatrixWorld();
                camera.updateProjectionMatrix();
                break;
            default:
                break;
        }
        // if (transformControlsWereAttached){
        //     transformControls.attach(simulation.objects[simulation.itemSelected].mesh)
        // }
        
    }
}

function switchControls(controlsType) {
    if (controlsType == 'transform') {
        if (simulation.itemSelected > -1) {
            flyControls.canLockOn = false;
            if (camera.type != "PerspectiveCamera"){
                orbitControls.enabled = false;
            }
            transformControls.enabled = true;
            transformControls.attach(simulation.objects[simulation.itemSelected].mesh);
        }
    } else {
        flyControls.canLockOn = true;
        transformControls.detach();
        transformControls.enabled = false;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = true;
        }
    }
}

function setDisabledPhysical(bool) {
    document.getElementById("width-input").disabled = bool;
    document.getElementById("height-input").disabled = bool;
    document.getElementById("depth-input").disabled = bool;
    document.getElementById("position.x-input").disabled = bool;
    document.getElementById("position.y-input").disabled = bool;
    document.getElementById("position.z-input").disabled = bool;
    document.getElementById("rotation.x-input").disabled = bool;
    document.getElementById("rotation.y-input").disabled = bool;
    document.getElementById("rotation.z-input").disabled = bool;
    document.getElementById("velocity.x-input").disabled = bool;
    document.getElementById("velocity.y-input").disabled = bool;
    document.getElementById("velocity.z-input").disabled = bool;
    document.getElementById("angularVelocity.x-input").disabled = bool;
    document.getElementById("angularVelocity.y-input").disabled = bool;
    document.getElementById("angularVelocity.z-input").disabled = bool;
    document.getElementById("force.x-input").disabled = bool;
    document.getElementById("force.y-input").disabled = bool;
    document.getElementById("force.z-input").disabled = bool;
    document.getElementById("mass-input").disabled = bool;
    document.getElementById("collisionResponse-toggle").disabled = bool;
}

function setDisabledVisual(bool) {
    document.getElementById("item-color-picker").disabled = bool;
    document.getElementById("wireframe-toggle").disabled = bool;
    document.getElementById("force-vectors-all").disabled = bool;
    document.getElementById("force-vectors-single").disabled = bool;
    document.getElementById("velocity-vectors-all").disabled = bool;
    document.getElementById("velocity-vectors-single").disabled = bool;
}

function updateStaticValues(bool) {
    if (bool) {
        if (simulation.itemSelected > -1) {
            document.getElementById("item-color-picker").value = `#${simulation.objects[simulation.itemSelected].mesh.material.color.getHexString()}`;
            switch (simulation.objects[simulation.itemSelected].mesh.geometry.type) {
                case "SphereGeometry":
                    document.getElementById("width-input").value = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radius * simulation.objects[simulation.itemSelected].mesh.scale.x;
                    break;
                case "BoxGeometry":
                    document.getElementById("width-input").value = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.width * simulation.objects[simulation.itemSelected].mesh.scale.x;
                    document.getElementById("height-input").value = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.height * simulation.objects[simulation.itemSelected].mesh.scale.y;
                    document.getElementById("depth-input").value = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.depth * simulation.objects[simulation.itemSelected].mesh.scale.z;
                    break;
                case "CylinderGeometry":
                    document.getElementById("width-input").value = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radiusTop * simulation.objects[simulation.itemSelected].mesh.scale.x;
                    document.getElementById("height-input").value = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.height * simulation.objects[simulation.itemSelected].mesh.scale.y;
                    break;
            }
            document.getElementById("wireframe-toggle").checked = simulation.objects[simulation.itemSelected].mesh.material.wireframe;
            document.getElementById("collisionResponse-toggle").checked = simulation.objects[simulation.itemSelected].body.collisionResponse;
            document.getElementById("object-name").innerText = simulation.objects[simulation.itemSelected].mesh.name;
            document.getElementById("mass-input").value = simulation.objects[simulation.itemSelected].body.mass;
            if (simulation.objects[simulation.itemSelected].mesh.userData.hasVectors) {
                for (let i in simulation.objects[simulation.itemSelected].mesh.children) {
                    switch (simulation.objects[simulation.itemSelected].mesh.children[i].name) {
                        case "resultantForceVector":
                            document.getElementById("force-vectors-single").checked = true;
                            break;
                        case "forceVectorX":
                        case "forceVectorY":
                        case "forceVectorX":
                            document.getElementById("force-vectors-all").checked = true;
                            break;
                        case "resultantVelocityVector":
                            document.getElementById("velocity-vectors-single").checked = true;
                            break;
                        case "velocityVectorX":
                        case "velocityVectorY":
                        case "velocityVectorX":
                            document.getElementById("velocity-vectors-all").checked = true;
                            break;
                        default:
                            break;
                    }
                }
            }
        }

    } else {
        document.getElementById("item-color-picker").value = "#000000";
        document.getElementById("width-input").value = '';
        document.getElementById("height-input").value = '';
        document.getElementById("depth-input").value = '';
        document.getElementById("mass-input").value = '';
        document.getElementById("force-vectors-single").checked = false;
        document.getElementById("force-vectors-all").checked = false;
        document.getElementById("velocity-vectors-single").checked = false;
        document.getElementById("velocity-vectors-all").checked = false;
        document.getElementById("wireframe-toggle").checked = false;
        document.getElementById("collisionResponse-toggle").checked = false;
        document.getElementById("object-name").innerText = "No item is selected";
    }

}

function roundToTwo(numb){
    return Math.round((numb + Number.EPSILON) * 100) / 100;
}

function updateVarValues(bool) {
    if (bool) {
        if (simulation.itemSelected > -1) {
            document.getElementById("position.x-input").value = roundToTwo(simulation.objects[simulation.itemSelected].mesh.position.x);
            document.getElementById("position.y-input").value = roundToTwo(simulation.objects[simulation.itemSelected].mesh.position.y);
            document.getElementById("position.z-input").value = roundToTwo(simulation.objects[simulation.itemSelected].mesh.position.z);
            document.getElementById("rotation.x-input").value = roundToTwo(simulation.objects[simulation.itemSelected].mesh.rotation.x);
            document.getElementById("rotation.y-input").value = roundToTwo(simulation.objects[simulation.itemSelected].mesh.rotation.y);
            document.getElementById("rotation.z-input").value = roundToTwo(simulation.objects[simulation.itemSelected].mesh.rotation.z);
            document.getElementById("velocity.x-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.velocity.x);
            document.getElementById("velocity.y-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.velocity.y);
            document.getElementById("velocity.z-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.velocity.z);
            document.getElementById("angularVelocity.x-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.angularVelocity.x);
            document.getElementById("angularVelocity.y-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.angularVelocity.y);
            document.getElementById("angularVelocity.z-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.angularVelocity.z);
            document.getElementById("force.x-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.force.x);
            document.getElementById("force.y-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.force.y);
            document.getElementById("force.z-input").value = roundToTwo(simulation.objects[simulation.itemSelected].body.force.z);
        }
    } else {
        document.getElementById("position.x-input").value = "";
        document.getElementById("position.y-input").value = "";
        document.getElementById("position.z-input").value = "";
        document.getElementById("rotation.x-input").value = "";
        document.getElementById("rotation.y-input").value = "";
        document.getElementById("rotation.z-input").value = "";
        document.getElementById("velocity.x-input").value = "";
        document.getElementById("velocity.y-input").value = "";
        document.getElementById("velocity.z-input").value = "";
        document.getElementById("angularVelocity.x-input").value = "";
        document.getElementById("angularVelocity.y-input").value = "";
        document.getElementById("angularVelocity.z-input").value = "";
        document.getElementById("force.x-input").value = "";
        document.getElementById("force.y-input").value = "";
        document.getElementById("force.z-input").value = "";
    }
}

function setSizesForShape() {
    if (simulation.itemSelected > -1) {
        switch (simulation.objects[simulation.itemSelected].mesh.geometry.type) {
            case "SphereGeometry":
                document.getElementById("width-text").innerText = "R:";
                document.getElementById("height-container").style.visibility = "hidden";
                document.getElementById("depth-container").style.visibility = "hidden";
                break;
            case "CylinderGeometry":
                document.getElementById("width-text").innerText = "R:";
                document.getElementById("height-container").style.visibility = "inherit";
                document.getElementById("depth-container").style.visibility = "hidden";
                break;
            default:
                document.getElementById("width-text").innerText = "W:";
                document.getElementById("height-container").style.visibility = "inherit";
                document.getElementById("depth-container").style.visibility = "inherit";
                break;
        }
    }
}

function toggleValues(bool) {
    updateStaticValues(bool);
    updateVarValues(bool);
    setSizesForShape();
}

function updateValuesWhileRunning(bool) {
    updateVarValues(bool);
}

//Init Functions

function initControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    transformControls = new TransformControls(camera, renderer.domElement);
    flyControls = new FlyControls(perspectiveCamera, renderer.domElement, scene, transformControls);
    transformControls.enabled = false;
    orbitControls.enabled = true;
    scene.add(transformControls);
}


function initThree() {
    scene = new THREE.Scene();

    orthographicCamera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 10000);
    perspectiveCamera = new THREE.PerspectiveCamera(45, parseInt(window.getComputedStyle(canvas).width) / parseInt(window.getComputedStyle(canvas).height), 1, 2000);
    orthographicCamera.position.z = 50;
    perspectiveCamera.position.z = 50;
    scene.add(orthographicCamera);
    scene.add(perspectiveCamera);
    camera = orthographicCamera;

    renderer = new THREE.WebGLRenderer({ canvas: viewportCanvas, antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setSize(parseInt(window.getComputedStyle(canvas).width), parseInt(window.getComputedStyle(canvas).height));
    stats = Stats();
}

function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, 0, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    // world.dt = timeStep;
    world.defaultContactMaterial.contactEquationStiffness = 1e7;
    world.defaultContactMaterial.contactEquationRelaxation = 8;
    world.defaultContactMaterial.friction = 0;
    world.defaultContactMaterial.restitution = 0;
}

//Timed Functions

function attemptPrintPerStep() {
    if (simulation.logPerSteps != 0 && ((world.time / world.dt) % simulation.logPerSteps < world.dt || Math.abs(simulation.logPerSteps - (world.time / world.dt) % simulation.logPerSteps) < world.dt) && previousLogedTime != world.time) {
        printToLog();
        previousLogedTime = world.time;
    }
}

function updatePhysics() {
    world.step(timeStep * 2, timeStep * 2, 1);
    attemptPrintPerStep();
    simulation.objects.forEach(element => {
        element.mesh.position.copy(element.body.position);
        element.mesh.quaternion.copy(element.body.quaternion);
    });
    updateVarValues(true);
}

function render() {
    topTime.innerText = (parseFloat(world.time) / 2).toFixed(3);
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    if (!simulation.isPaused) {
        updatePhysics();
    }
    render();

    if (statsOn) {
        stats.update();
    }

    if (flyControls.pointerLock.isLocked){
        flyControls.move();
    }

    for (let i in simulation.objects) {
        if (simulation.objects[i].mesh.userData.hasVectors) {
            updateVectors(simulation.objects[i]);
        }
    }
}

//General Functions

function toggleStats(bool) {
    if (bool) {
        document.body.appendChild(stats.dom);
    } else {
        document.body.removeChild(stats.dom);
    }
    statsOn = bool;
}


function rewindobjects() {
    simulation.removeAllObjects();
    simulation.objects = savedobjects;
    savedobjects = [];
    simulation.addAllObjects();
    refreshListOfObjects();
}

function generateJSON() {
    let logObj = {};
    let timeLine = {}
    simulation.objects.forEach((item) => {
        timeLine[item.mesh.uuid] = { name: item.mesh.name, mass: item.body.mass, position: { x: item.body.position.x, y: item.body.position.y, z: item.body.position.z }, velocity: { x: item.body.velocity.x, y: item.body.velocity.y, z: item.body.velocity.z }, rotation: { x: item.mesh.rotation.x, y: item.mesh.rotation.y, z: item.mesh.rotation.z }, angularVelocity: { x: item.body.angularVelocity.x, y: item.body.angularVelocity.y, z: item.body.angularVelocity.z }, force: { x: item.body.force.x, y: item.body.force.y, z: item.body.force.z }, isWireframe: item.mesh.material.wireframe, color: item.mesh.material.color.getHexString()};
        switch (item.mesh.geometry.type) {
            case "SphereGeometry":
                timeLine[item.mesh.uuid].dimensions = { radius: item.mesh.geometry.parameters.radius * item.mesh.scale.x };
                timeLine[item.mesh.uuid].geometryType = "SphereGeometry";
                break;
            case "BoxGeometry":
                timeLine[item.mesh.uuid].dimensions = { x: item.mesh.geometry.parameters.width * item.mesh.scale.x, y: item.mesh.geometry.parameters.height * item.mesh.scale.y, z: item.mesh.geometry.parameters.depth * item.mesh.scale.z };
                timeLine[item.mesh.uuid].geometryType = "BoxGeometry";
                break;
            case "CylinderGeometry":
                timeLine[item.mesh.uuid].dimensions = { radius: item.mesh.geometry.parameters.radiusTop * item.mesh.scale.x, height: item.mesh.geometry.parameters.height * item.mesh.scale.y };
                timeLine[item.mesh.uuid].geometryType = "CylinderGeometry";
                break;
        }
    });
    logObj[parseInt(world.time)] = timeLine;
    logObj['camera'] = {type: camera.type, position: {x: camera.position.x, y: camera.position.y, z: camera.position.z}, rotation: {x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z}, zoom: camera.zoom};
    logObj['world'] = {gravity: {x: world.gravity.x, y: world.gravity.y, z: world.gravity.z}}
    return logObj;
}

function printToLog() {
    let log = document.getElementById("log");
    if (!simulation.savedLog) {
        simulation.savedLog = generateJSON();
    } else {
        let line = generateJSON();
        for (const index in line) {
            simulation.savedLog[index] = line[index];
        }
    }
    log.innerHTML += `At time ${parseFloat(world.time).toFixed(3)}:`;
    if (simulation.objects.length) {
        log.innerHTML += "<br>";
        log.innerHTML += "Name - Mass - Position - Velocity - Rotation - Angular Velocity - Force";
        log.innerHTML += "<br>";
        simulation.objects.forEach((item) => {
            log.innerHTML += `${item.mesh.name} | ${item.body.mass} | ${item.body.position.x}, ${item.body.position.y}, ${item.body.position.z} | ${item.body.velocity.x}, ${item.body.velocity.y}, ${item.body.velocity.z} | `;
            log.innerHTML += `${item.mesh.rotation.x}, ${item.mesh.rotation.y}, ${item.mesh.rotation.z} | ${item.body.angularVelocity.x}, ${item.body.angularVelocity.y}, ${item.body.angularVelocity.z} | ${item.body.force.x}, ${item.body.force.y}, ${item.body.force.z}`;
            log.innerHTML += "<br>";
        });
        log.innerHTML += "<br>";
    } else {
        log.innerHTML += "<br>";
        log.innerHTML += "No items in scene";
        log.innerHTML += "<br>";
        log.innerHTML += "<br>";
    }
}

function addItemToList(index) {
    let node = document.createElement("DIV");
    let selectButtonNode = document.createElement('input');
    let textNode = document.createElement("input");
    let editButtonNode = document.createElement('input');
    let deleteButtonNode = document.createElement('input');
    let lockButtonNode = document.createElement('input');

    node.classList.add("item-list-field");
    node.setAttribute("id", simulation.objects[index].mesh.uuid)

    selectButtonNode.type = 'checkbox';
    selectButtonNode.classList.add("simple-checkmark");
    selectButtonNode.classList.add("small-inline-checkmark");
    selectButtonNode.addEventListener('click', (event) => {
        if (event.target.checked) {
            if (currentlyCheckedBox) {
                currentlyCheckedBox.checked = false;
            }
            simulation.itemSelected = index;
            document.getElementById("object-name").innerText = simulation.objects[simulation.itemSelected].mesh.name;
            switch (simulation.objects[simulation.itemSelected].mesh.geometry.type) {
                case "SphereGeometry":
                    document.getElementById("width-text").innerText = "R:";
                    document.getElementById("height-container").style.visibility = "hidden";
                    document.getElementById("depth-container").style.visibility = "hidden";
                    break;
                case "CylinderGeometry":
                    document.getElementById("width-text").innerText = "R:";
                    document.getElementById("height-container").style.visibility = "inherit";
                    document.getElementById("depth-container").style.visibility = "hidden";
                    break;
                default:
                    document.getElementById("width-text").innerText = "W:";
                    document.getElementById("height-container").style.visibility = "inherit";
                    document.getElementById("depth-container").style.visibility = "inherit";
                    break;
            }
            toggleValues(true);
            setDisabledVisual(false);
            if (!simulation.isRunning){
                switchControls('transform');
                setDisabledPhysical(false);
            }
            currentlyCheckedBox = event.target;
        } else {
            switchControls('orbit')
            toggleValues(false);
            setDisabledPhysical(true);
            setDisabledVisual(true);
            simulation.itemSelected = -1;
            currentlyCheckedBox = null;
        }
    })

    textNode.type = 'text';
    textNode.value = simulation.objects[index].mesh.name;
    textNode.setAttribute('required', "");
    textNode.classList.add("item-list-editable");

    editButtonNode.type = 'button';
    editButtonNode.classList.add("icon-buttons");
    editButtonNode.classList.add("item-list-field-edit-button");
    editButtonNode.classList.add("small-icon-buttons");
    editButtonNode.addEventListener('click', () => {
        textNode.focus();
    });

    deleteButtonNode.type = 'button';
    deleteButtonNode.classList.add("item-list-field-delete-button");
    deleteButtonNode.classList.add("icon-buttons");
    deleteButtonNode.classList.add("small-icon-buttons");
    deleteButtonNode.addEventListener('click', () => {
        deleteObjectFromList(index);
    });


    lockButtonNode.type = 'button';
    lockButtonNode.classList.add("item-list-lock-button");
    lockButtonNode.classList.add("icon-buttons");
    lockButtonNode.classList.add("small-icon-buttons");
    lockButtonNode.addEventListener('click', () => {
        simulation.objects[index].mesh.userData.selectable = !simulation.objects[index].mesh.userData.selectable;
        if (!simulation.objects[index].mesh.userData.selectable) {
            lockButtonNode.style.backgroundColor = 'orange';
            if (index == simulation.itemSelected) {
                canvas.click();
            }
        } else {
            lockButtonNode.style.backgroundColor = 'var(--secondary-color)';
        }
    })

    textNode.addEventListener("blur", () => {
        if (textNode.value.length == 0) {
            textNode.focus();
        } else {
            simulation.objects[index].mesh.name = textNode.value;
            document.getElementById("object-name").innerText = simulation.objects[index].mesh.name;
        }
    });
    textNode.addEventListener("keydown", (event) => {
        if (event.key === 'Enter' && document.activeElement.value.length != 0) {
            document.activeElement.blur();
        }
    });
    node.appendChild(selectButtonNode);
    node.appendChild(textNode);
    node.appendChild(deleteButtonNode);
    node.appendChild(editButtonNode);
    node.appendChild(lockButtonNode);
    document.getElementById("right-ui-item-container").appendChild(node);
}

function deleteObjectFromList(index) {
    if (transformControls.object && transformControls.object.uuid == simulation.objects[index].mesh.uuid) {
        switchControls('orbit')
    }
    scene.remove(simulation.objects[index].mesh);
    world.remove(simulation.objects[index].body);
    simulation.objects.splice(index, 1);
    refreshListOfObjects();
}

function refreshListOfObjects() {
    while (document.getElementById("right-ui-item-container").firstChild) {
        document.getElementById("right-ui-item-container").removeChild(document.getElementById("right-ui-item-container").firstChild);
    }
    for (let index in simulation.objects) {
        addItemToList(index);
    }
}

function updateVectors(object) {
    let F, V, direction, length, origin = object.mesh.position;
    for (const index in object.mesh.children) {
        switch (object.mesh.children[index].name) {
            case "resultantForceVector":
                F = Math.sqrt(object.body.force.x ** 2 + object.body.force.y ** 2 + object.body.force.z ** 2);
                if (F != 0) {
                    object.mesh.children[index].visible = true;
                    direction = (new THREE.Vector3(object.body.force.x, object.body.force.y, object.body.force.z)).normalize();
                    length = F;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "forceVectorX":
                if (object.body.force.x != 0) {
                    object.mesh.children[index].visible = true;
                    direction = new THREE.Vector3(object.body.force.x, 0, 0);
                    length = object.body.force.x;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "forceVectorY":
                if (object.body.force.y != 0) {
                    object.mesh.children[index].visible = true;
                    direction = new THREE.Vector3(0, object.body.force.y, 0);
                    length = object.body.force.y;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "forceVectorZ":
                if (object.body.force.z != 0) {
                    object.mesh.children[index].visible = true;
                    direction = new THREE.Vector3(0, 0, object.body.force.z);
                    length = object.body.force.z;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "resultantVelocityVector":
                V = Math.sqrt(object.body.velocity.x ** 2 + object.body.velocity.y ** 2 + object.body.velocity.z ** 2);
                if (V != 0) {
                    object.mesh.children[index].visible = true;
                    direction = (new THREE.Vector3(object.body.velocity.x, object.body.velocity.y, object.body.velocity.z)).normalize();

                    length = V;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "velocityVectorX":
                if (object.body.velocity.x != 0) {
                    object.mesh.children[index].visible = true;
                    direction = new THREE.Vector3(object.body.velocity.x, 0, 0);
                    length = object.body.velocity.x;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "velocityVectorY":
                if (object.body.velocity.y != 0) {
                    object.mesh.children[index].visible = true;
                    direction = new THREE.Vector3(0, object.body.velocity.y, 0);
                    length = object.body.velocity.y;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            case "velocityVectorZ":
                if (object.body.velocity.z != 0) {
                    object.mesh.children[index].visible = true;
                    direction = new THREE.Vector3(0, 0, object.body.velocity.z);
                    length = object.body.velocity.z;
                    object.mesh.children[index].setDirection(direction);
                    object.mesh.children[index].setLength(length);
                } else {
                    object.mesh.children[index].visible = false;
                }
                break;
            default:
                break;
        }
    }
}

function toggleResultantForceVector(object) {
    for (const index in object.mesh.children) {
        if (object.mesh.children[index].name == "resultantForceVector") {
            object.mesh.remove(object.mesh.children[index]);
            object.mesh.userData.hasVectors = false;
            return true;
        }
    }
    object.mesh.userData.hasVectors = true;
    const V = Math.sqrt(object.body.force.x ** 2 + object.body.force.y ** 2 + object.body.force.z ** 2);
    const origin = object.mesh.position;
    const direction = ((new THREE.Vector3(object.body.force.x, object.body.force.y, object.body.force.z)).add(origin)).normalize();
    let length;
    const hex = 0xff0000;
    let visible = true;
    if (V != 0) {
        length = V;
    } else {
        length = 10;
        visible = false;
    }
    const arrowHelper = new THREE.ArrowHelper(direction, origin, length, hex);
    arrowHelper.visible = visible;
    arrowHelper.name = "resultantForceVector";
    arrowHelper.line.material.depthTest = false;
    arrowHelper.line.renderOrder = Infinity;
    arrowHelper.cone.material.depthTest = false;
    arrowHelper.cone.renderOrder = Infinity;
    object.mesh.add(arrowHelper);
}

function toggleComponentForcesVectors(object) {
    let vectorsFound = false;
    for (let index = 0; index < object.mesh.children.length; index++) {
        switch (object.mesh.children[index].name) {
            case "forceVectorX":
            case "forceVectorY":
            case "forceVectorZ":
                vectorsFound = true;
                object.mesh.userData.hasVectors = false;
                object.mesh.remove(object.mesh.children[index]);
                break;
            default:
                break;
        }
    }
    if (!vectorsFound) {
        let visible, length, direction, color;
        const origin = object.mesh.position;

        object.mesh.userData.hasVectors = true;

        visible = true;
        direction = ((new THREE.Vector3(object.body.force.x, 0, 0)).add(origin)).normalize();
        if (object.body.force.x != 0) {
            length = object.body.force.x;
        } else {
            length = 10;
            visible = false;
        }
        color = 0xff4500;
        const arrowHelperX = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelperX.visible = visible;
        arrowHelperX.name = "forceVectorX";
        arrowHelperX.line.material.depthTest = false;
        arrowHelperX.line.renderOrder = Infinity;
        arrowHelperX.cone.material.depthTest = false;
        arrowHelperX.cone.renderOrder = Infinity;
        object.mesh.add(arrowHelperX);

        visible = true;
        direction = ((new THREE.Vector3(0, object.body.force.y, 0)).add(origin)).normalize();
        if (object.body.force.x != 0) {
            length = object.body.force.x;
        } else {
            length = 10;
            visible = false;
        }
        color = 0xffff00;
        const arrowHelperY = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelperY.visible = visible;
        arrowHelperY.name = "forceVectorY";
        arrowHelperY.line.material.depthTest = false;
        arrowHelperY.line.renderOrder = Infinity;
        arrowHelperY.cone.material.depthTest = false;
        arrowHelperY.cone.renderOrder = Infinity;
        object.mesh.add(arrowHelperY);

        visible = true;
        direction = ((new THREE.Vector3(0, 0, object.body.force.z)).add(origin)).normalize();
        if (object.body.force.x != 0) {
            length = object.body.force.x;
        } else {
            length = 10;
            visible = false;
        }
        color = 0x00ff00;
        const arrowHelperZ = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelperZ.visible = visible;
        arrowHelperZ.name = "forceVectorZ";
        arrowHelperZ.line.material.depthTest = false;
        arrowHelperZ.line.renderOrder = Infinity;
        arrowHelperZ.cone.material.depthTest = false;
        arrowHelperZ.cone.renderOrder = Infinity;
        object.mesh.add(arrowHelperZ);
    }
}

function toggleResultantVelocityVector(object) {
    for (const index in object.mesh.children) {
        if (object.mesh.children[index].name == "resultantVelocityVector") {
            object.mesh.remove(object.mesh.children[index]);
            object.mesh.userData.hasVectors = false;
            return true;
        }
    }
    object.mesh.userData.hasVectors = true;
    const V = Math.sqrt(object.body.velocity.x ** 2 + object.body.velocity.y ** 2 + object.body.velocity.z ** 2);
    const origin = object.mesh.position;
    const direction = ((new THREE.Vector3(object.body.velocity.x, object.body.velocity.y, object.body.velocity.z)).add(origin)).normalize();
    let length;
    const hex = 0x0000ff;
    let visible = true;
    if (V != 0) {
        length = V;
    } else {
        length = 10;
        visible = false;
    }
    const arrowHelper = new THREE.ArrowHelper(direction, origin, length, hex);
    arrowHelper.visible = visible;
    arrowHelper.name = "resultantVelocityVector";
    arrowHelper.line.material.depthTest = false;
    arrowHelper.line.renderOrder = 10;
    arrowHelper.cone.material.depthTest = false;
    arrowHelper.cone.renderOrder = 10;
    object.mesh.add(arrowHelper);
}

function toggleComponentVelocityVectors(object) {
    let vectorsFound = false;
    for (let index = 0; index < object.mesh.children.length; index++) {
        switch (object.mesh.children[index].name) {
            case "velocityVectorX":
            case "velocityVectorY":
            case "velocityVectorZ":
                vectorsFound = true;
                object.mesh.userData.hasVectors = false;
                object.mesh.remove(object.mesh.children[index]);
                index--;
                break;
            default:
                break;
        }
    }
    if (!vectorsFound) {
        let visible, length, direction, color;
        const origin = object.mesh.position;

        object.mesh.userData.hasVectors = true;

        visible = true;
        if (object.body.velocity.x != 0) {
            direction = ((new THREE.Vector3(object.body.velocity.x, 0, 0)).add(origin)).normalize();
            length = object.body.velocity.x;
        } else {
            length = 10;
            visible = false;
            direction = new THREE.Vector3(0.1, 0, 0);
        }
        color = 0x4b0082;
        const arrowHelperX = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelperX.visible = visible;
        arrowHelperX.name = "velocityVectorX";
        arrowHelperX.line.material.depthTest = false;
        arrowHelperX.line.renderOrder = Infinity;
        arrowHelperX.cone.material.depthTest = false;
        arrowHelperX.cone.renderOrder = Infinity;
        object.mesh.add(arrowHelperX);

        visible = true;
        if (object.body.velocity.y != 0) {
            direction = ((new THREE.Vector3(0, object.body.velocity.y, 0)).add(origin)).normalize();
            length = object.body.velocity.y;
        } else {
            length = 10;
            visible = false;
            direction = new THREE.Vector3(0, 0.1, 0);
        }
        color = 0x8f00ff;
        const arrowHelperY = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelperY.visible = visible;
        arrowHelperY.name = "velocityVectorY";
        arrowHelperY.line.material.depthTest = false;
        arrowHelperY.line.renderOrder = Infinity;
        arrowHelperY.cone.material.depthTest = false;
        arrowHelperY.cone.renderOrder = Infinity;
        object.mesh.add(arrowHelperY);

        visible = true;
        if (object.body.velocity.z != 0) {
            direction = ((new THREE.Vector3(0, 0, object.body.velocity.z)).add(origin)).normalize();
            length = object.body.velocity.z;
        } else {
            length = 10;
            visible = false;
            direction = new THREE.Vector3(0, 0, 0.1);
        }
        color = 0xffc0cb;
        const arrowHelperZ = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelperZ.visible = visible;
        arrowHelperZ.name = "velocityVectorZ";
        arrowHelperZ.line.material.depthTest = false;
        arrowHelperZ.line.renderOrder = Infinity;
        arrowHelperZ.cone.material.depthTest = false;
        arrowHelperZ.cone.renderOrder = Infinity;
        object.mesh.add(arrowHelperZ);
    }
}

function isObject(item) {
    return (typeof item === "object" && !Array.isArray(item) && item !== null);
}

async function copyobjects() {
    for (let i = 0; i < simulation.objects.length; i++) {
        let copyBody = {}, copyMesh, copyName;
        //Deep copy of the cannonjs body
        for (const key in simulation.objects[i].body) {
            if (simulation.objects[i].body) {
                if (isObject(simulation.objects[i].body[key])) {
                    if (key === "world") {
                        copyBody[key] = world;
                    } else if (key === "invInertiaWorld") {
                        copyBody[key] = simulation.objects[i].body[key];
                    } else if (key === "invInertiaWorldSolve") {
                        copyBody[key] = simulation.objects[i].body[key];
                    } else if (key ==="_listeners") {
                        copyBody[key] = simulation.objects[i].body[key];
                    } else {
                        copyBody[key] = simulation.objects[i].body[key].clone();
                    }
                } else {
                    copyBody[key] = simulation.objects[i].body[key];
                }
            }
        }
        //Deep copy of the threejs mesh
        copyMesh = simulation.objects[i].mesh.clone();

        //Assigning all of the above to an object ... object and adding it to the copied objects array
        let box = {
            body: copyBody,
            mesh: copyMesh
        }
        savedobjects.push(box);
    }

}

function generateName(type) {
    let count = -1;
    for (let index in simulation.objects) {
        if (simulation.objects[index].mesh.name.length >= type.length + 2 && simulation.objects[index].mesh.name.substring(0, type.length + 1) == type + '-') {
            let nString = simulation.objects[index].mesh.name.substring(type.length + 1);
            if (!isNaN(nString)) {
                if (count + 1 < parseInt(nString)) {
                    count++;
                    return type + '-' + count;
                } else {
                    count = parseInt(nString);
                }
            }
        }
    }
    count++;
    return type + '-' + count;
}

//Simulation Object

let simulation = {
    objects: [],
    isPaused: true,
    logPerSteps: 0,
    savedLog: null,
    itemSelected: -1,
    isRunning: false,
    placingObject: false,
    objectPlaceDist: 50,
    createBox(x, y, z, width, height, depth) {
        if (!this.placingObject) {
            let shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
            let tempBody = new CANNON.Body({
                mass: 4
            });
            tempBody.addShape(shape);
            tempBody.linearDamping = 0;
            tempBody.angularDamping = 0;
            world.addBody(tempBody);

            let geometry = new THREE.BoxGeometry(width, height, depth);
            let material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            let tempMesh = new THREE.Mesh(geometry, material);
            tempMesh.userData.createsGravity = true;
            tempMesh.userData.selectable = true;
            tempMesh.userData.hasVectors = false;
            scene.add(tempMesh);

            tempMesh.name = generateName('Box');
            let box = {
                body: tempBody,
                mesh: tempMesh
            }
            this.objects.push(box);
            addItemToList(this.objects.length - 1);
            this.objects.sort((a, b) => (a.mesh.name > b.mesh.name) ? 1 : -1);

            if (isNaN(x)) {
                tempBody.position.set(0, 0, 0);
                tempMesh.position.set(0, 0, 0);
                this.placeObject(box.mesh);
            } else {
                tempBody.position.set(x, y, z);
                tempMesh.position.set(x, y, z);
            }
            tempBody.addEventListener('collide', function(e) {
                let time = world.time / 2;
                //Time of collision
                console.log(time, time - timeStep * 2);
            });
        }
    },
    createSphere(x, y, z, radius) {
        if (!this.placingObject) {
            let shape = new CANNON.Sphere(radius);
            let tempBody = new CANNON.Body({
                mass: 4
            });
            tempBody.addShape(shape);
            tempBody.linearDamping = 0;
            tempBody.angularDamping = 0;
            world.addBody(tempBody);

            let geometry = new THREE.SphereGeometry(radius, Math.ceil(radius / 10) * 16, Math.ceil(radius / 10) * 8);
            let material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            let tempMesh = new THREE.Mesh(geometry, material);
            tempMesh.userData.createsGravity = true;
            tempMesh.userData.selectable = true;
            tempMesh.userData.hasVectors = false;
            scene.add(tempMesh);

            tempMesh.name = generateName('Sphere');
            let sphere = {
                body: tempBody,
                mesh: tempMesh
            }
            this.objects.push(sphere);
            addItemToList(this.objects.length - 1);
            this.objects.sort((a, b) => (a.mesh.name > b.mesh.name) ? 1 : -1);

            if (isNaN(x)) {
                tempBody.position.set(0, 0, 0);
                tempMesh.position.set(0, 0, 0);
                this.placeObject(sphere.mesh);
            } else {
                tempBody.position.set(x, y, z);
                tempMesh.position.set(x, y, z);
            }
        }
    },
    createCylinder(x, y, z, radius, height) {
        if (!this.placingObject){
            let shape = new CANNON.Cylinder(radius, radius, height, Math.ceil(radius / 10) * 8);
            let tempBody = new CANNON.Body({
                mass: 4
            });

            //Align three js to cannon js rotation
            var quat = new CANNON.Quaternion();
            quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            var translation = new CANNON.Vec3(0, 0, 0);
            shape.transformAllPoints(translation, quat);

            tempBody.addShape(shape);
            tempBody.linearDamping = 0;
            tempBody.angularDamping = 0;
            world.addBody(tempBody);

            let geometry = new THREE.CylinderGeometry(radius, radius, height, Math.ceil(radius / 10) * 16);
            let material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            let tempMesh = new THREE.Mesh(geometry, material);
            tempMesh.userData.createsGravity = true;
            tempMesh.userData.selectable = true;
            tempMesh.userData.hasVectors = false;
            tempMesh.userData.previousScale = { x: 1, z: 1 };
            scene.add(tempMesh);

            tempMesh.name = generateName('Cylinder');
            let cylinder = {
                body: tempBody,
                mesh: tempMesh
            }
            this.objects.push(cylinder);
            addItemToList(this.objects.length - 1);
            this.objects.sort((a, b) => (a.mesh.name > b.mesh.name) ? 1 : -1);

            if (isNaN(x)) {
                tempBody.position.set(0, 0, 0);
                tempMesh.position.set(0, 0, 0);
                this.placeObject(cylinder.mesh);
            } else {
                tempBody.position.set(x, y, z);
                tempMesh.position.set(x, y, z);
            }
        }
    },
    placeObject(object){
        this.placingObject = true;
        let orbitControlsWereEnabled;
        let wasAbleToLock = flyControls.canLockOn;
        flyControls.canLockOn = false;
        function findPosition(event){
            let mouseVector = new THREE.Vector2();
            let rayCaster = new THREE.Raycaster();

            mouseVector.x = (event.offsetX / parseInt(window.getComputedStyle(canvas).width)) * 2 - 1;
            mouseVector.y = -(event.offsetY / parseInt(window.getComputedStyle(canvas).height)) * 2 + 1;

            rayCaster.setFromCamera(mouseVector, camera);
            let tempVector = new THREE.Vector3();
            rayCaster.ray.at(simulation.objectPlaceDist, tempVector);
            object.position.set(tempVector.x, tempVector.y, tempVector.z);
        }

        function handleWheel(event){
            if (event.wheelDeltaY < 0){
                if (simulation.objectPlaceDist > 5){
                    simulation.objectPlaceDist -= 5;
                    findPosition(event);
                }
            } else {
                simulation.objectPlaceDist += 5;
                findPosition(event);
            }
        }

        function handleShiftDown(event){
            if (event.code == 'ShiftLeft') {
                if (orbitControls.enabled){
                    orbitControls.enabled = false;
                    orbitControlsWereEnabled = true;
                }
                canvas.addEventListener("wheel", handleWheel )
            }
        }

        function stopShift(){
            if (orbitControlsWereEnabled){
                orbitControls.enabled = true;
            }
            canvas.removeEventListener("wheel", handleWheel);
            document.removeEventListener("keydown", handleShiftDown);
            document.removeEventListener("keyup", stopShift);
        }

        document.addEventListener("keydown", handleShiftDown);
        document.addEventListener("keyup", stopShift);
        canvas.addEventListener("mousemove", findPosition);

        function removeEventListeners(){
            canvas.removeEventListener("mousemove", findPosition);
            canvas.removeEventListener("click", removeEventListeners);
            simulation.placingObject = false;
            if (wasAbleToLock){
                flyControls.canLockOn = true;
            }
        }
        canvas.addEventListener("click", removeEventListeners)
    },
    checkForObject(event) {
        let mouseVector = new THREE.Vector2();
        let rayCaster = new THREE.Raycaster();

        mouseVector.x = (event.offsetX / parseInt(window.getComputedStyle(canvas).width)) * 2 - 1;
        mouseVector.y = -(event.offsetY / parseInt(window.getComputedStyle(canvas).height)) * 2 + 1;

        rayCaster.setFromCamera(mouseVector, camera);

        return rayCaster.intersectObjects(scene.children);
    },
    removeAllObjects() {
        world.time = 0;
        //Remove all Meshes from scene
        for (let i = 0; i < scene.children.length; i++) {
            if (scene.children[i].type === "Mesh") {
                scene.remove(scene.children[i]);
                i--;
            }
        }
        //Remove all Bodies from world
        while (world.bodies.length > 0) {
            world.removeBody(world.bodies[0]);
        }
    },
    addAllObjects() {
        //Adds all Bodies to the world and Meshes to the scene
        for (let i = 0; i < this.objects.length; i++) {
            scene.add(this.objects[i].mesh);
            world.addBody(this.objects[i].body);
        }
    },

}

//Function Call and Export

initThree();
initCannon();
initControls();

animate();

export { simulation, camera, transformControls, orbitControls, copyobjects, renderer, updateVectors, changeTimeStep, printToLog, generateJSON, setCamera, rewindobjects, toggleStats, toggleResultantForceVector, toggleComponentForcesVectors, toggleResultantVelocityVector, toggleComponentVelocityVectors, switchControls, setDisabledPhysical, setDisabledVisual, updateStaticValues, updateVarValues, setSizesForShape, toggleValues, updateValuesWhileRunning, flyControls, world};