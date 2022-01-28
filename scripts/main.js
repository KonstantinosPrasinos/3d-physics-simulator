import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/TransformControls.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';

import {FlyControls} from './controls.js';
import {notificationList} from './notifications.js';

let canvas = document.getElementById("viewportCanvas");
let topTime = document.getElementById("time");
let togglePauseButton = document.getElementById("top-play");

let flyControls, savedObjects = [], scene, renderer, camera, orthographicCamera, perspectiveCamera, world, timeStep = 1 / 60, orbitControls, transformControls, previousLogedTime, frustumSize = 40, statsOn = false, stats, currentlyCheckedBox;
let aspect = parseInt(window.getComputedStyle(canvas).width) / parseInt(window.getComputedStyle(canvas).height);
let actionList = [];
const uuidMap = new Map();

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

function pauseSimulation(){
    if (!simulation.isPaused){
        togglePauseButton.classList.remove('top-pause');
        togglePauseButton.classList.add('top-play');
    }
    simulation.isPaused = true;
}

function resumeSimulation(){
    if (simulation.isPaused){
        togglePauseButton.classList.remove('top-play');
        togglePauseButton.classList.add('top-pause');
        
    }
    simulation.objects.forEach(element => setPreviousMetrics(element));
    simulation.isPaused = false;
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

function roundToDecimal(numb, decimal){
    return Math.round((numb + Number.EPSILON) * (10 ** decimal)) / (10 ** decimal);
}


function updateVarValues(bool) {
    if (bool) {
        if (simulation.itemSelected > -1) {
            document.getElementById("position.x-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].mesh.position.x, 2);
            document.getElementById("position.y-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].mesh.position.y, 2);
            document.getElementById("position.z-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].mesh.position.z, 2);
            document.getElementById("rotation.x-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].mesh.rotation.x, 2);
            document.getElementById("rotation.y-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].mesh.rotation.y, 2);
            document.getElementById("rotation.z-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].mesh.rotation.z, 2);
            document.getElementById("velocity.x-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.velocity.x, 2);
            document.getElementById("velocity.y-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.velocity.y, 2);
            document.getElementById("velocity.z-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.velocity.z, 2);
            document.getElementById("angularVelocity.x-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.angularVelocity.x, 2);
            document.getElementById("angularVelocity.y-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.angularVelocity.y, 2);
            document.getElementById("angularVelocity.z-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.angularVelocity.z, 2);
            document.getElementById("force.x-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.force.x, 2);
            document.getElementById("force.y-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.force.y, 2);
            document.getElementById("force.z-input").value = roundToDecimal(simulation.objects[simulation.itemSelected].body.force.z, 2);
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

function handleActionPrint(actionType, param1, param2, param3){
    if (actionType == 'time'){
        printToLog('Time of action reached')
    } else if (actionType == 'collision'){
        printToLog(`Collision between ${param1} and ${param2}`);
    } else {
        printToLog(`${actionType}'s ${param1} ${param2} reached ${roundToDecimal(param3, 3)}`);
    }
}

function handleActionOutput(selection, actionType, param1, param2, param3){
    switch (selection) {
        case 'print':
            handleActionPrint(actionType, param1, param2, param3);
            break;
        case 'pause':
            pauseSimulation();
            break;
        case 'both':
            handleActionOutput(actionType, param1, param2, param3);
            pauseSimulation();
            break;
        default:
            break;
    }
}

function handleActions() {
    let object, targetName, target, firstHalf, secondHalf;
    for (let action of actionList) {
        if (action.selection1 && action.selection2 && action.selection3){
            if (action.selection1 == 'time'){
                if (!isNaN(action.selection2) && (parseFloat(action.selection2) > world.time / 2 - timeStep && parseFloat(action.selection2) < world.time / 2 + timeStep)){
                    handleActionOutput(action.selection3);
                }
            } else if (action.selection4){
                switch (action.selection2) {
                    case 'collides':
                        object = simulation.objects.find(object => object.mesh.uuid == action.selection1);
                        if (object.mesh.userData.collidedWith) {
                            object.mesh.userData.collidedWith.forEach(targetID => {
                                target = simulation.objects.find(object2 => object2.body.id == targetID);
                                targetName = target.mesh.name;
                                if (action.selection3 == 'anything') {
                                    handleActionOutput(action.selection4, object.mesh.name, targetName);
                                } else if (target.mesh.uuid == action.selection3) {
                                    handleActionOutput(action.selection4, object.mesh.name, targetName);
                                }
                            })
                            object.mesh.userData.collidedWith.length = 0;
                        }
                        break;
                    case 'position.x':
                    case 'position.y':
                    case 'position.z':
                    case 'rotation.x':
                    case 'rotation.y':
                    case 'rotation.z':
                        object = simulation.objects.find(object => object.mesh.uuid == action.selection1);
                        firstHalf = action.selection2.slice(0, action.selection2.indexOf('.'));
                        secondHalf = action.selection2.slice(action.selection2.indexOf('.') + 1, action.selection2.length);
                        if (action.selection3 <= object.mesh[firstHalf][secondHalf] && action.selection3 > object.mesh.userData.previousMetrics[firstHalf][secondHalf]){
                           handleActionOutput(action.selection4, object.mesh.name, firstHalf, secondHalf, object.mesh[firstHalf][secondHalf]);
                        }
                        break;
                    default:
                        object = simulation.objects.find(object => object.mesh.uuid == action.selection1);
                        firstHalf = action.selection2.slice(0, action.selection2.indexOf('.'));
                        secondHalf = action.selection2.slice(action.selection2.indexOf('.') + 1, action.selection2.length);
                        if (action.selection3 <= object.body[firstHalf][secondHalf] && action.selection3 > object.mesh.userData.previousMetrics[firstHalf][secondHalf]){
                            handleActionOutput(action.selection4, object.mesh.name, action.selection2.replace('.', ' '), object.body[action.selection2]);
                        } 
                        break;
                }
            }
        }
    }
}

function attemptPrintPerStep() {
    if (simulation.logPerSteps != 0 && ((world.time / world.dt) % simulation.logPerSteps < world.dt || Math.abs(simulation.logPerSteps - (world.time / world.dt) % simulation.logPerSteps) < world.dt) && previousLogedTime != world.time) {
        printToLog('Print step reached');
        previousLogedTime = world.time;
    }
}

function setPreviousMetrics(object){
    object.mesh.userData.previousMetrics.position.x = object.mesh.position.x;
    object.mesh.userData.previousMetrics.position.y = object.mesh.position.y;
    object.mesh.userData.previousMetrics.position.z = object.mesh.position.z;
    object.mesh.userData.previousMetrics.rotation.x = object.mesh.rotation.x;
    object.mesh.userData.previousMetrics.rotation.y = object.mesh.rotation.y;
    object.mesh.userData.previousMetrics.rotation.z = object.mesh.rotation.z;
    object.mesh.userData.previousMetrics.velocity.x = object.body.velocity.x;
    object.mesh.userData.previousMetrics.velocity.y = object.body.velocity.y;
    object.mesh.userData.previousMetrics.velocity.z = object.body.velocity.z;
    object.mesh.userData.previousMetrics.angularVelocity.x = object.body.angularVelocity.x;
    object.mesh.userData.previousMetrics.angularVelocity.y = object.body.angularVelocity.y;
    object.mesh.userData.previousMetrics.angularVelocity.z = object.body.angularVelocity.z;
    object.mesh.userData.previousMetrics.force.x = object.body.force.x;
    object.mesh.userData.previousMetrics.force.y = object.body.force.y;
    object.mesh.userData.previousMetrics.force.z = object.body.force.z;
}

function updatePhysics() {
    simulation.objects.forEach(element => setPreviousMetrics(element));
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
        handleActions();
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

class Action {
    static eventsAction = 0;
    constructor() {
        this.selection1;
        this.selection2;
        this.selection3;
        this.selection4;
        this.id = Action.eventsCreated;
        this.event1 = [];
        this.event2 = [];
        this.event3 = [];
        this.event4 = [];
        this.deleteButtonAction;
        Action.actionsCreated++;
    }
}

function deleteEventListeners(action, startN, deleteSelectionsBool){
    for (let i = startN; i < 4; i++) {
        for (let j in action[`action${i}`]){
            document.removeEventListener('click', action[`action${i}`][j])
        }
        action[`event${i}`].length = 0;
        if (deleteSelectionsBool){
            action[`selection${i}`] = null;
        }
    }
}

function deleteLaterSelections(parent, n, id){
    //Remember to remove their actionListeners as well.
    for (let i = 0; i < parent.children.length; i++) { 
        if (parent.children[i].nodeName == 'DIV'){
            for (let j = n+1; j < 6; j++) {
                if (parent.children[i].id == `action-field-${id}-${j}`){
                    parent.removeChild(parent.children[i]);
                    i--;
                }
            }
        }
    }

    const action = actionList.find(element => element.id == id);
    deleteEventListeners(action, n+1, true);
}

function createSelections(type, selections, action, parent, fieldN, textLeft, textRight) {
    let field = document.createElement('div');
    let selection, container, node1, node2, parameters, inputText;
    field.classList.add(`action-field`);
    field.setAttribute('id', `action-field-${action.id}-${fieldN}`);
    field.innerHTML += textLeft;

    switch (type){
        case 'dropdown':
            selection = document.createElement('div');
            selection.classList.add('dropdown-selector');
            container = document.createElement('div');
            container.classList.add('dropdown-container');
            inputText = document.createElement('span');
            
            switch (selections) {
                case 'target':
                    container.classList.add('target-dropdown');
                    inputText.setAttribute('id', `input-${action.id}-${fieldN}`);
                    inputText.classList.add('action-input-text');
                    inputText.innerHTML = 'target';
                    selection.appendChild(inputText);
                    node1 = document.createElement('div');
                    node1.classList.add('dropdown-option');

                    if (fieldN == 1){
                        node1.setAttribute('id', `target-${action.id}-${fieldN}-time`);
                        container.appendChild(node1);
                        node1.textContent = 'time';
                        let selectionTargetTime = function (e) {
                            if (e.target && e.target.id == `target-${action.id}-${fieldN}-time`) {
                                document.getElementById(`input-${action.id}-${fieldN}`).innerHTML = 'time';
                                action[`selection${fieldN}`] = 'time';
                                deleteLaterSelections(parent, fieldN, action.id);
                                createSelections('text', 'seconds', action, parent, fieldN+1, ' is ', ' s');
                            }
                        }
                        action[`event${fieldN}`].push(selectionTargetTime);
                        document.addEventListener('click', selectionTargetTime);
                    } else {
                        node1.setAttribute('id', `target-${action.id}-${fieldN}-anything`);
                        container.appendChild(node1);
                        node1.textContent = 'anything';
                        let selectionTargetAnything = function(e) {
                            if (e.target && e.target.id == `target-${action.id}-${fieldN}-anything`){
                                document.getElementById(`input-${action.id}-${fieldN}`).innerHTML = 'anything';
                                action[`selection${fieldN}`] = 'anything';
                                deleteLaterSelections(parent, fieldN, action.id);
                                createSelections('dropdown', 'actionType', action, parent, fieldN+1, ' then ', '');
                            }
                        }

                        action[`event${fieldN}`].push(selectionTargetAnything);

                        document.addEventListener('click', selectionTargetAnything);
                    }

                    addObjectsToDropdown(`${action.id}-${fieldN}`, container)
                    break;
                case 'parameters':
                    parameters = ['collides', 'position x', 'position y', 'position z', 'rotation x', 'rotation y', 'rotation z', 'velocity x', 'velocity y', 'velocity z', 'angularVelocity x', 'angularVelocity y', 'angularVelocity z'];
                    
                    inputText.setAttribute('id', `input-${action.id}-${fieldN}`);
                    inputText.classList.add('action-input-text');
                    inputText.innerHTML = 'parameter';
                    selection.appendChild(inputText);
                    
                    parameters.forEach(parameter => {
                        node1 = document.createElement('div');
                        node1.innerText = parameter;
                        node1.classList.add('dropdown-option');
                        node1.setAttribute('id', `target-${action.id}-${fieldN}-${parameter.replace(' ', '.')}`);

                        let selectionParameters = function (e) {
                            if (e.target && e.target.id == `target-${action.id}-${fieldN}-${parameter.replace(' ', '.')}`){
                                if (parameter == 'collides'){
                                    document.getElementById(`input-${action.id}-${fieldN}`).innerHTML = parameter;
                                    deleteLaterSelections(parent, fieldN, action.id);
                                    createSelections('dropdown', 'target', action, parent, fieldN+1, ' with ', '');
                                } else {
                                    document.getElementById(`input-${action.id}-${fieldN}`).innerHTML = `'s ${parameter}`;
                                    deleteLaterSelections(parent, fieldN, action.id);
                                    createSelections('text', 'm/s', action, parent, fieldN+1, '=', '');
                                }
                                action[`selection${fieldN}`] = parameter.replace(' ', '.');
                            }
                        }
                        action[`event${fieldN}`].push(selectionParameters);

                        document.addEventListener('click', selectionParameters);
                        container.appendChild(node1);
                    })

                    break;
                case 'actionType':
                    parameters = ['print', 'pause', 'both'];

                    inputText.setAttribute('id', `input-${action.id}-${fieldN}`);
                    inputText.classList.add('action-input-text');
                    inputText.innerHTML = 'action';
                    selection.appendChild(inputText);
                    
                    parameters.forEach(parameter => {
                        node1 = document.createElement('div');
                        node1.classList.add('dropdown-option');
                        node1.innerText = parameter;
                        node1.setAttribute('id', `target-${action.id}-${fieldN}-${parameter}`);

                        let selectionActionType = function(e) {
                            if (e.target && e.target.id == `target-${action.id}-${fieldN}-${parameter}`){
                                document.getElementById(`input-${action.id}-${fieldN}`).innerHTML = parameter;
                                action[`selection${fieldN}`] = parameter;
                            }
                        }

                        action[`event${fieldN}`].push(selectionActionType);

                        document.addEventListener('click', selectionActionType);
                        container.appendChild(node1);
                    });
                    break;
            }
            selection.appendChild(container);
            field.appendChild(selection);
            break;
        case 'text':
            selection = document.createElement('input');
            selection.type = 'text';
            selection.placeholder = 0;
            selection.classList.add('text-editable');
            selection.setAttribute('id', `input-${action.id}-${fieldN}`)

            let selectionText = function (e) {
                if (e.target && e.target.id == `input-${action.id}-${fieldN}`){
                    document.getElementById(`input-${action.id}-${fieldN}`).addEventListener('blur', function (e) {
                        if (parseInt(e.target.value).length == 0) {
                            action[`selection${fieldN}`] = 0;
                        } else {
                            action[`selection${fieldN}`] = parseInt(e.target.value);
                            deleteLaterSelections(parent, fieldN, action.id);
                            createSelections('dropdown', 'actionType', action, parent, fieldN+1, ' then ', '');
                        }
                    })
                }
            }
            
            action[`event${fieldN}`].push(selectionText);

            document.addEventListener('click', selectionText);
            field.appendChild(selection);
            break;
    }
    field.innerHTML += textRight;
    parent.appendChild(field);
}

function addObjectsToDropdown(serial, parent){
    let node2;
    const action = actionList.find(element => element.id == serial.slice(0, serial.indexOf('-')));
    let fieldN = parseInt(serial.slice(serial.indexOf('-')+1, serial.length));
    simulation.objects.forEach(object => {
        if (fieldN == 1 || action.selection1 != object.mesh.uuid){
            node2 = document.createElement('div');
            node2.innerText = object.mesh.name;
            node2.classList.add('dropdown-option');
            node2.classList.add('dropdown-option-target-object');
            node2.setAttribute('id', `target-${serial}-${object.mesh.uuid}`);

            let selectionTargetObject = function(e) {
                if (e.target && e.target.id == `target-${serial}-${object.mesh.uuid}`){
                    document.getElementById(`input-${serial}`).innerHTML = object.mesh.name;
                    action[`selection${fieldN}`] = object.mesh.uuid;
                    deleteLaterSelections(parent, fieldN, action.id);
                    if (fieldN == 1){
                        createSelections('dropdown', 'parameters', action, document.getElementById(`action-node-${action.id}`), fieldN+1, '', '');
                    } else {
                        createSelections('dropdown', 'actionType', action, document.getElementById(`action-node-${action.id}`), fieldN+1, ' then ', '');
                    }
                }
            }

            action[`event${fieldN}`].push(selectionTargetObject);

            document.addEventListener('click', selectionTargetObject);

            parent.appendChild(node2);
        }
    });
}

function reAssignUuids(){
    for (let action of actionList){
        for (let i in action){
            if (uuidMap.has(action[i])){
                action[i] = uuidMap.get(action[i]);
            }
        }
    }
}

function updateObjectsInActions(source, uuid){
    if (actionList.length){
        let containers = document.getElementsByClassName('target-dropdown');
        for (let i in containers) {
            if (containers[i].tagName) {
                let serial = containers[i].childNodes[0].id;
                while (containers[i].childNodes.length > 1) {
                    containers[i].removeChild(containers[i].lastChild);
                }
                let temp = serial.slice(serial.indexOf('-') + 1, serial.lastIndexOf('-'));
                deleteEventListeners(actionList.find(element => element.id == temp.slice(0, temp.indexOf('-'))), 1, false);
                addObjectsToDropdown(serial.slice(serial.indexOf('-') + 1, serial.lastIndexOf('-')), containers[i]);

            }
        } 
    }
}



function rewindObjects() {
    simulation.removeAllObjects();
    simulation.objects = savedObjects;
    savedObjects = [];
    simulation.addAllObjects();
    refreshListOfObjects();
    updateObjectsInActions();
    reAssignUuids();
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

function printToLog(reason) {
    let log = document.getElementById('log');
    if (!simulation.savedLog) {
        simulation.savedLog = generateJSON();
    } else {
        let line = generateJSON();
        for (const index in line) {
            simulation.savedLog[index] = line[index];
        }
    }
    log.innerHTML += `Reason of print: ${reason}. At time ${parseFloat(world.time).toFixed(3)}:`;
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
    updateObjectsInActions();
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
    let uuid = simulation.objects[index].mesh.uuid;
    if (actionList.length && uuid) {
        for (let i in actionList) {
            for (let j in actionList[i]) {
                if (actionList[i][j] == uuid) {
                    deleteEventListeners(actionList[i], 1, true);
                    document.getElementById('events-container').removeChild(document.getElementById(`event-node-${actionList[i].id}`));
                    actionList.splice(i, 1);
                    createNotification(notificationList.actionObjectDeleted, false);
                    break;
                }
            }
        }
    }
    scene.remove(simulation.objects[index].mesh);
    world.remove(simulation.objects[index].body);
    simulation.objects.splice(index, 1);
    refreshListOfObjects();
}

let tempTimeout, tempGSAP = gsap.timeline();
let notifications = [];

function closeNotification(){
    let notificationPopup = document.getElementById("notification-popup");
    clearTimeout(tempTimeout);
    function hideNotification(){
        notificationPopup.style.visibility = "hidden";
        notifications.shift();
        if (notifications.length > 0) {
            let temp = showNotifications;
            showNotifications = true;
            createNotification(notifications[0], false);
            showNotifications = temp;
        }
    }
    tempGSAP.to(notificationPopup, {duration: 0.2, opacity: 0, onComplete: hideNotification});
}

function createNotification(notification, bool){
    if (localStorage.getItem("showNotifications")) {
        if (notifications.length < 1 || notification.type.concat(": ", notification.msg) != document.getElementById("notification-popup-text").innerHTML) {
            if (bool || notifications.length == 0) {
                notifications.push(notification);
            }
            let notificationPopup = document.getElementById("notification-popup");
            if (window.getComputedStyle(notificationPopup).visibility == "hidden") {
                switch (notifications[0].type) {
                    case "Error":
                        notificationPopup.style.borderColor = "#ff0000";
                        break;
                    case "Warning":
                        notificationPopup.style.borderColor = "#fd7014";
                        break;
                    case "Tutorial":
                        notificationPopup.style.borderColor = "#3498db";
                        if (!doTutorial){
                            return;
                        }
                        break;
                    default:
                        notificationPopup.style.borderColor = "var(--secondary-color)"
                        break;
                }
                document.getElementById("notification-popup-text").innerHTML = notifications[0].type.concat(": ", notifications[0].msg);
                notificationPopup.style.visibility = "visible";
                tempGSAP.to(notificationPopup, { duration: 0.2, opacity: 1 });
                tempTimeout = setTimeout(closeNotification, 3000);
            }
        }
    }
}

function handleMouseEnter(){
    clearTimeout(tempTimeout);
}

function handleMouseLeave(){
    tempTimeout = setTimeout(closeNotification, 3000);
}

document.getElementById("close-notification-popup").onclick = closeNotification;
document.getElementById("notification-popup").onmouseenter = handleMouseEnter;
document.getElementById("notification-popup").onmouseleave = handleMouseLeave;

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

        //Mapping the old to the new uuid
        uuidMap.set(simulation.objects[i].mesh.uuid, copyMesh.uuid)

        //Assigning all of the above to an object ... object and adding it to the copied objects array
        let box = {
            body: copyBody,
            mesh: copyMesh
        }
        savedObjects.push(box);
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

class PreviousMetrics {
    constructor(x, y, z) {
        this.position = {x: x, y: y, z: z};
        this.velocity = {x: 0, y: 0, z: 0};
        this.rotation = {x: 0, y: 0, z: 0};
        this.angularVelocity = {x: 0, y: 0, z: 0};
        this.force = {x: 0, y: 0, z: 0};
    }
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
            let material = new THREE.MeshBasicMaterial({ color: 0xff0000});
            let tempMesh = new THREE.Mesh(geometry, material);
            tempMesh.userData.createsGravity = true;
            tempMesh.userData.selectable = true;
            tempMesh.userData.hasVectors = false;
            tempMesh.userData.collidedWith = [];
            tempMesh.userData.previousMetrics = new PreviousMetrics(x == 'none' ? 0 : x, y, z);
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
                tempMesh.userData.collidedWith.push(e.body.id);
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
            let material = new THREE.MeshBasicMaterial({ color: 0x00ff00});
            let tempMesh = new THREE.Mesh(geometry, material);
            tempMesh.userData.createsGravity = true;
            tempMesh.userData.selectable = true;
            tempMesh.userData.hasVectors = false;
            tempMesh.userData.collidedWith = [];
            tempMesh.userData.previousMetrics = new PreviousMetrics(x == 'none' ? 0 : x, y, z);
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
            tempBody.addEventListener('collide', function(e) {
                tempMesh.userData.collidedWith.push(e.body.id);
            });
        }
    },
    createCylinder(x, y, z, radius, height) {
        if (!this.placingObject){
            let shape = new CANNON.Cylinder(radius, radius, height, Math.ceil(radius / 10) * 8);
            let tempBody = new CANNON.Body({
                mass: 4
            });

            //Align three js to cannon js rotation
            let quat = new CANNON.Quaternion();
            quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            let translation = new CANNON.Vec3(0, 0, 0);
            shape.transformAllPoints(translation, quat);

            tempBody.addShape(shape);
            tempBody.linearDamping = 0;
            tempBody.angularDamping = 0;
            world.addBody(tempBody);

            let geometry = new THREE.CylinderGeometry(radius, radius, height, Math.ceil(radius / 10) * 16);
            let material = new THREE.MeshBasicMaterial({ color: 0x0000ff});
            let tempMesh = new THREE.Mesh(geometry, material);
            tempMesh.userData.createsGravity = true;
            tempMesh.userData.selectable = true;
            tempMesh.userData.hasVectors = false;
            tempMesh.userData.previousScale = { x: 1, z: 1 };
            tempMesh.userData.collidedWith = [];
            tempMesh.userData.previousMetrics = new PreviousMetrics(x == 'none' ? 0 : x, y, z);
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
            tempBody.addEventListener('collide', function(e) {
                tempMesh.userData.collidedWith.push(e.body.id);
            });
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
            object.userData.previousMetrics.position.x = object.position.x;
            object.userData.previousMetrics.position.y = object.position.y;
            object.userData.previousMetrics.position.z = object.position.z;
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

export { deleteEventListeners, Action, closeNotification, createNotification, createSelections, simulation, camera, transformControls, orbitControls, copyobjects, renderer, updateVectors, changeTimeStep, printToLog, generateJSON, setCamera, rewindObjects, toggleStats, toggleResultantForceVector, toggleComponentForcesVectors, toggleResultantVelocityVector, toggleComponentVelocityVectors, switchControls, setDisabledPhysical, setDisabledVisual, updateStaticValues, updateVarValues, setSizesForShape, toggleValues, updateValuesWhileRunning, flyControls, world, actionList, pauseSimulation, resumeSimulation, addObjectsToDropdown};