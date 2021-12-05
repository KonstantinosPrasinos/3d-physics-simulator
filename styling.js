import {simulation, transformControls, orbitControls, camera, copyBoxes, renderer, updateVectors, world, printToLog, generateJSON, setCamera, rewindBoxes} from '/main.js'

let itemSelected = -1, tutorialCompleted = false, mode = "setup", selectedCursor = "none", ratio = null, rightUIisCollapsed = true, storedTheme = 'dark', printPerSteps = 0;

let topUI = document.getElementById("top-ui");
let rightUI = document.getElementById("right-ui");
let collapseRightUIButton = document.getElementById("collapse-right-ui-button");
let rightFeatures = document.getElementById("right-ui-features");
let objectNameField = document.getElementById("object-name");
let rightItems = document.getElementById("right-ui-items-list");
let settingsOverlay = document.getElementById("settings-overlay");
let settingsBox = document.getElementById("settings-box");
let widthInput = document.getElementById("right-ui-width");
let heightInput = document.getElementById("right-ui-height");
let depthInput = document.getElementById("right-ui-depth");
let xInput = document.getElementById("right-ui-x");
let yInput = document.getElementById("right-ui-y");
let zInput = document.getElementById("right-ui-z");
let rotationXInput = document.getElementById("right-rotation-x");
let rotationYInput = document.getElementById("right-rotation-y");
let rotationZInput = document.getElementById("right-rotation-z");
let colorPicker = document.getElementById("item-color-picker");
let togglePauseButton = document.getElementById("top-play");
let topMode = document.getElementById("top-mode");
let canvas = document.getElementById("viewportCanvas");

//Local Storage Stuff

if (!localStorage.theme) {
    localStorage.setItem("theme", "dark");
} else {
    let theme = localStorage.getItem("theme");
    switch (theme) {
        case "dark":
            document.getElementById("dark-theme-button").checked = true;
            break;
        case "light":
            document.getElementById("light-theme-button").checked = true;
            break;
        case "midnight":
            document.getElementById("midnight-theme-button").checked = true;
            break;
        case "custom":
            document.getElementById("custom-theme-button").checked = true;
        default:
            break;
    }
    setTheme(theme);
}

if (!localStorage.tutorialCompleted) {
    //Start tutorial
    localStorage.setItem("tutorialCompleted", "true");
}

//General Functions
document.getElementById("print-timestep").addEventListener("blur", () => {
    if (document.getElementById("print-timestep").value){
        simulation.logPerSteps = parseInt(document.getElementById("print-timestep").value);
    } else {
        simulation.logPerSteps = 0;
    }
})

function downloadJson(object){
    let log = "data:text/json;charset=utf-8," + encodeURIComponent(object);
    let htmlElement = document.getElementById("download-log");
    htmlElement.setAttribute("href", log);
    htmlElement.setAttribute("download", "scene.json");
    htmlElement.click();
}

function downloadCurrentLogJson(){
    if (simulation.boxes.length){
        downloadJson(JSON.stringify(generateJSON()));
    }
}


function downloadTxt(text){
    let log = "data:text;charset=utf-8," + encodeURI(text);
    let htmlElement = document.getElementById("download-log");
    htmlElement.setAttribute("href", log);
    htmlElement.setAttribute("download", "scene.txt");
    htmlElement.click();
}
function downloadCurrentLogTxt(){
    let index = document.getElementById("log").innerText.lastIndexOf("At time");
    let result = document.getElementById("log").innerText.substr(index);
    downloadTxt(result);
}
function downloadLongLogJson(){
    if (simulation.savedLog){
        downloadJson(JSON.stringify(simulation.savedLog));
    }
}

function downloadLongLogTxt(){
    downloadTxt(document.getElementById("log").innerText);
}

function clearLog(){
    if (simulation.savedLog){
        simulation.savedLog = null;
        document.getElementById("log").innerHTML = "";
    }
}

function createLog(){
    document.getElementById("log").innerHTML = "";
    printToLog();
}
document.getElementById("print-log").onclick = printToLog;
document.getElementById("clear-log").onclick = clearLog;
document.getElementById("download-long-json").onclick = downloadLongLogJson;
document.getElementById("download-current-json").onclick = downloadCurrentLogJson;
document.getElementById("download-current-txt").onclick = downloadCurrentLogTxt;
document.getElementById("download-long-txt").onclick = downloadLongLogTxt;

function synchronizePositions() {
    simulation.boxes[itemSelected].body.position.x = simulation.boxes[itemSelected].mesh.position.x;
    simulation.boxes[itemSelected].body.position.y = simulation.boxes[itemSelected].mesh.position.y;
    simulation.boxes[itemSelected].body.position.z = simulation.boxes[itemSelected].mesh.position.z;
    updateVectors(simulation.boxes[itemSelected]);
}

function synchronizeRotation() {
    simulation.boxes[itemSelected].body.quaternion.x = simulation.boxes[itemSelected].mesh.quaternion.x;
    simulation.boxes[itemSelected].body.quaternion.y = simulation.boxes[itemSelected].mesh.quaternion.y;
    simulation.boxes[itemSelected].body.quaternion.z = simulation.boxes[itemSelected].mesh.quaternion.z;
}

function synchronizeSize(){
    switch (simulation.boxes[itemSelected].mesh.geometry.type) {
        case "BoxGeometry":
            let lowerBound = new CANNON.Vec3(simulation.boxes[itemSelected].mesh.geometry.parameters.width * simulation.boxes[itemSelected].mesh.scale.x / -2, simulation.boxes[itemSelected].mesh.geometry.parameters.height * simulation.boxes[itemSelected].mesh.scale.y / -2, simulation.boxes[itemSelected].mesh.geometry.parameters.depth * simulation.boxes[itemSelected].mesh.scale.z / -2);
            let upperBound = new CANNON.Vec3(simulation.boxes[itemSelected].mesh.geometry.parameters.width * simulation.boxes[itemSelected].mesh.scale.x / 2, simulation.boxes[itemSelected].mesh.geometry.parameters.height * simulation.boxes[itemSelected].mesh.scale.y / 2, simulation.boxes[itemSelected].mesh.geometry.parameters.depth * simulation.boxes[itemSelected].mesh.scale.z / 2);
            simulation.boxes[itemSelected].body.aabb.lowerBound = lowerBound;
            simulation.boxes[itemSelected].body.aabb.upperBound = upperBound;
            break;
        default:
            break;
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
    simulation.isPaused = false;
}

function setTheme(theme) {
    let customGridContainer = document.getElementById("custom-grid-container");
    if (theme != storedTheme) {
        if (theme != "custom" && window.getComputedStyle(customGridContainer).opacity == 1){
            gsap.to(customGridContainer, { duration: 0.2, opacity: 0});
        }
        switch (theme) {
            case 'light':
                gsap.to("html", { duration: 0.2, "--primary-color": '#EEEEEE' });
                gsap.to("html", { duration: 0.2, "--secondary-color": '#222831' });
                localStorage.setItem("theme", "light");
                storedTheme = theme;
                document.getElementById("light-theme-button").checked = true;
                break;
            case 'dark':
                gsap.to("html", { duration: 0.2, "--primary-color":  '#222831'});
                gsap.to("html", { duration: 0.2, "--secondary-color": '#EEEEEE' });
                localStorage.setItem("theme", "dark");
                storedTheme = theme;
                document.getElementById("dark-theme-button").checked = true;
                break;
            case 'midnight':
                gsap.to("html", { duration: 0.2, "--primary-color": '#000000' });
                gsap.to("html", { duration: 0.2, "--secondary-color": '#EEEEEE' });
                localStorage.setItem("theme", "midnight");
                storedTheme = theme;
                document.getElementById("midnight-theme-button").checked = true;
                break;
            case 'custom':
                let primaryColor, secondaryColor;
                if (!localStorage.customTheme){
                    primaryColor = document.getElementById("custom-primary-color-picker").value;
                    secondaryColor = document.getElementById("custom-secondary-color-picker").value;
                    localStorage.setItem("customThemePrimary", primaryColor);
                    localStorage.setItem("customThemeSecondary", secondaryColor);
                } else {
                    primaryColor = localStorage.customThemePrimary;
                    secondaryColor = localStorage.customThemeSecondary;
                }
                localStorage.setItem("theme", "custom");
                storedTheme = theme;
                gsap.to("html", { duration: 0.2, "--primary-color": primaryColor});
                gsap.to("html", { duration: 0.2, "--secondary-color": secondaryColor});
                document.getElementById("custom-primary-color-picker").value = localStorage.customThemePrimary;
                document.getElementById("custom-secondary-color-picker").value = localStorage.customThemeSecondary;
                document.getElementById("custom-theme-button").click;
                if (window.getComputedStyle(document.getElementById("custom-grid-container")).opacity == 0){
                    gsap.to(customGridContainer, {duration: 0.2, opacity: 1});
                }
            default:
                break;
        }

    }
}

function toggleSettings() {
    function toggleVisibility() { settingsOverlay.style.visibility = 'hidden'; }
    if (window.getComputedStyle(settingsOverlay).visibility == 'hidden') {
        let timeline = gsap.timeline();
        settingsOverlay.style.visibility = 'visible';
        timeline.to(settingsOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', duration: 0.15 })
            .to(settingsBox, { opacity: 1, duration: 0.15 }, '-=0.16');
    } else {
        let timeline = gsap.timeline();
        timeline.to(settingsOverlay, { backgroundColor: 'rgba(0, 0, 0, 0)', duration: 0.15, onComplete: toggleVisibility })
            .to(settingsBox, { opacity: 0, duration: 0.15 }, '-=0.15');;
    }
}

//Click Events

function handleCameraButton(type){
    let fovGrid = document.getElementById("fov-grid-container");
    if (type == "PerspectiveCamera"){
        setCamera("PerspectiveCamera");
        if (window.getComputedStyle(fovGrid).opacity == 0){
            gsap.to(fovGrid, { duration: 0.2, opacity: 1});
        }
    } else if (type == "OrthographicCamera"){
        setCamera("OrthographicCamera");
        if (window.getComputedStyle(fovGrid).opacity == 1){
            gsap.to(fovGrid, { duration: 0.2, opacity: 0});
        }
    }
}

document.getElementById("perspective-button").onclick = handleCameraButton.bind(this, "PerspectiveCamera");
document.getElementById("orthographic-button").onclick = handleCameraButton.bind(this, "OrthographicCamera");

document.getElementById("top-select").onclick = function selectCursorMove(){
    if (selectedCursor != "translate"){
        document.getElementById("top-select").style.backgroundColor = "orange";
        document.getElementById("top-resize").style.backgroundColor = "var(--secondary-color)";
        document.getElementById("top-rotate").style.backgroundColor = "var(--secondary-color)";
        transformControls.setMode('translate');
        transformControls.enabled = true;
        orbitControls.enabled = false;
        selectedCursor = "translate";
    } else {
        transformControls.detach();
        document.getElementById("object-name").innerText = "No item is Selected";
        document.getElementById("top-select").style.backgroundColor = "var(--secondary-color)";
        transformControls.enabled = false;
        orbitControls.enabled = true;
        selectedCursor = "none";
    }
}

document.getElementById("top-resize").onclick = function selectCursorScale(){
    if (selectedCursor != "scale"){
        document.getElementById("top-resize").style.backgroundColor = "orange";
        document.getElementById("top-rotate").style.backgroundColor = "var(--secondary-color)";
        document.getElementById("top-select").style.backgroundColor = "var(--secondary-color)";
        transformControls.setMode('scale');
        transformControls.enabled = true;
        orbitControls.enabled = false;
        selectedCursor = "scale";
    } else {
        transformControls.detach();
        document.getElementById("object-name").innerText = "No item is Selected";
        document.getElementById("top-resize").style.backgroundColor = "var(--secondary-color)";
        transformControls.enabled = false;
        orbitControls.enabled = true;
        selectedCursor = "none";
    }
}

document.getElementById("top-rotate").onclick = function selectCursorRotate(){
    if (selectedCursor != "rotate"){
        document.getElementById("top-rotate").style.backgroundColor = "orange";
        document.getElementById("top-resize").style.backgroundColor = "var(--secondary-color)";
        document.getElementById("top-select").style.backgroundColor = "var(--secondary-color)";
        transformControls.setMode('rotate');
        transformControls.enabled = true;
        orbitControls.enabled = false;
        selectedCursor = "rotate";
    } else {
        transformControls.detach();
        document.getElementById("object-name").innerText = "No item is Selected";
        document.getElementById("top-rotate").style.backgroundColor = "var(--secondary-color)";
        transformControls.enabled = false;
        orbitControls.enabled = true;
        selectedCursor = "none";
    }
}

document.getElementById("collapse-right-ui-button").onclick = function toggleRightUI() {
    if (rightUIisCollapsed) {
        let timeline = gsap.timeline();
        rightUI.style.visibility = 'visible';
        gsap.to(collapseRightUIButton, { duration: 0.2, right: '144px' });
        gsap.to(collapseRightUIButton, { duration: 0.2, rotation: 0 });
        timeline.to(rightUI, { duration: 0.2, width: '180px' })
            .to(rightFeatures, { duration: 0.2, opacity: 1 })
            .to(rightItems, { duration: 0.2, opacity: 1 }, '-=0.2')
            .to(objectNameField, {duration: 0.2, opacity: 1}, '-=0.2');
        rightUIisCollapsed = !rightUIisCollapsed;

    } else {
        let timeline = gsap.timeline();
        timeline.to(rightFeatures, { duration: 0.2, opacity: 0 })
            .to(rightItems, { duration: 0.2, opacity: 0 }, '-=0.2')
            .to(rightUI, { duration: 0.2, width: '0px' })
            .to(collapseRightUIButton, { duration: 0.2, right: '8px' }, '-=0.2')
            .to(collapseRightUIButton, { duration: 0.2, rotation: 180, onComplete: function () { rightUI.style.visibility = 'hidden'; } }, '-=0.2');
        rightUIisCollapsed = !rightUIisCollapsed;
    }
}

document.getElementById("settings-button").onclick = document.getElementById("close-settings").onclick = toggleSettings;

function toggleCustomTheme(){
    let customGridContainer = document.getElementById("custom-grid-container");
    gsap.to(customGridContainer, {duration: 0.2, opacity: 1});
    setTheme('custom');
}

document.getElementById("light-theme-button").onclick = setTheme.bind(this, 'light');
document.getElementById("dark-theme-button").onclick = setTheme.bind(this, 'dark');
document.getElementById("midnight-theme-button").onclick = setTheme.bind(this, 'midnight');
document.getElementById("custom-theme-button").onclick = toggleCustomTheme;

document.getElementById("top-play").onclick = function togglePause(){
    if (mode == "setup"){
        copyBoxes();
        mode = "simulation";
        topMode.innerHTML = "<b>Mode:</b> Simulation";
        if (simulation.shapesForChanges.length > 0){
            simulation.removeAllArrows();
        }
        simulation.boxes.forEach(element => {
            element.body.position.copy(element.mesh.position);
            element.body.quaternion.copy(element.mesh.quaternion);
        });
        // synchronizePositions();
    }
    if (simulation.isPaused){
        resumeSimulation();
    } else {
        pauseSimulation();
    }
}

document.getElementById("top-replay").onclick = async function toggleMode(){
    if (mode == "simulation"){
        clearLog();
        pauseSimulation();
        mode = "setup";
        rewindBoxes();
        topMode.innerHTML = "<b>Mode:</b> Setup";
    }
}

document.getElementById("settings-overlay").addEventListener('click', (event) => {
    if (event.target !== event.currentTarget) {
        event.stopPropagation();
    } else {
        toggleSettings();
    }
});

//Other Event Listeners

function blurFocusedElement(event){
    if (event.key === 'Enter' && ((!isNaN(document.activeElement.value) && document.activeElement.value.length != 0) || itemSelected == -1)){
        document.activeElement.blur();
    }
}

document.getElementById("right-ui-features").addEventListener("keydown", blurFocusedElement);

let fovSlider = document.getElementById("fov-slider");
let fovText = document.getElementById("fov-text");


fovSlider.oninput = function (){
    if (camera.type == "PerspectiveCamera"){
        camera.fov = parseInt(fovSlider.value);
        fovText.placeholder = camera.fov;
        camera.updateProjectionMatrix();
    }
}

fovText.addEventListener("blur", () => {
    if ((fovText.value.length == 0 || isNaN(fovText.value)) && camera.type == "PerspectiveCamera") {
        fovText.value = "";
    } else if (camera.type == "PerspectiveCamera"){
        if (fovText.value > 110){
            fovText.placeholder = 110;
            camera.fov = 110;
        } else if (fovText.value < 20){
            fovText.placeholder = 20
            camera.fov = 20;
        } else {
            fovText.placeholder = fovText.value;
            camera.fov = parseInt(fovText.value);
        }
        fovText.value = "";
        fovSlider.value = camera.fov;
    }
});

const width = document.getElementById("right-width");
const height = document.getElementById("right-height");
const depth = document.getElementById("right-depth");

function setRightParameters(){
    if (itemSelected > -1){
        transformControls.detach();
        transformControls.attach(simulation.boxes[itemSelected].mesh)
        const selected = simulation.boxes[itemSelected];
        document.getElementById("wireframe-toggle").checked = selected.mesh.material.wireframe ? true : false;
        document.getElementById("object-name").innerText = selected.mesh.name;

        width.disabled = false;
        height.disabled = false;
        depth.disabled = false;
        xPos.disabled = false;
        yPos.disabled = false;
        zPos.disabled = false;
        xVel.disabled = false;
        yVel.disabled = false;
        zVel.disabled = false;
        xRot.disabled = false;
        yRot.disabled = false;
        zRot.disabled = false;
        xAng.disabled = false;
        yAng.disabled = false;
        zAng.disabled = false;
        xFor.disabled = false;
        yFor.disabled = false;
        zFor.disabled = false;

        document.getElementById("wireframe-toggle").disabled = false;
        document.getElementsByName("velocity-radio").forEach(element => {element.disabled = false});
        document.getElementsByName("force-radio").forEach(element => {element.disabled = false});
        document.getElementById("collidable-toggle").disabled = false;
        document.getElementById("item-color-picker").disabled = false;

        width.value = selected.mesh.geometry.parameters.width * selected.mesh.scale.x;
        height.value = selected.mesh.geometry.parameters.height * selected.mesh.scale.y;
        depth.value = selected.mesh.geometry.parameters.depth * selected.mesh.scale.z;
        xPos.value = selected.mesh.position.x;
        yPos.value = selected.mesh.position.y;
        zPos.value = selected.mesh.position.z;
        xVel.value = selected.body.velocity.x;
        yVel.value = selected.body.velocity.y;
        zVel.value = selected.body.velocity.z;
        xRot.value = selected.mesh.rotation.x;
        yRot.value = selected.mesh.rotation.y;
        zRot.value = selected.mesh.rotation.z;
        xAng.value = selected.body.angularVelocity.x;
        yAng.value = selected.body.angularVelocity.y;
        zAng.value = selected.body.angularVelocity.z;
        xFor.value = selected.body.force.x;
        yFor.value = selected.body.force.y;
        zFor.value = selected.body.force.z;
    } else {
        document.getElementById("object-name").innerText = "No item is Selected";
        width.disabled = true;
        height.disabled = true;
        depth.disabled = true;
        xPos.disabled = true;
        yPos.disabled = true;
        zPos.disabled = true;
        xVel.disabled = true;
        yVel.disabled = true;
        zVel.disabled = true;
        xRot.disabled = true;
        yRot.disabled = true;
        zRot.disabled = true;
        xAng.disabled = true;
        yAng.disabled = true;
        zAng.disabled = true;
        xFor.disabled = true;
        yFor.disabled = true;
        zFor.disabled = true;

        document.getElementById("wireframe-toggle").disabled = true;
        document.getElementsByName("velocity-radio").forEach(element => {element.disabled = true});
        document.getElementsByName("force-radio").forEach(element => {element.disabled = true});
        document.getElementById("collidable-toggle").disabled = true;
        document.getElementById("item-color-picker").disabled = true;
        
        width.value = "";
        height.value = "";
        depth.value = "";
        xPos.value = "";
        yPos.value = "";
        zPos.value = "";
        xVel.value = "";
        yVel.value = "";
        zVel.value = "";
        xRot.value = "";
        yRot.value = "";
        zRot.value = "";
        xAng.value = "";
        yAng.value = "";
        zAng.value = "";
        xFor.value = "";
        yFor.value = "";
        zFor.value = "";
    }
}

canvas.addEventListener("mousedown", (event) => {
    let intersectedObjects = simulation.checkForObject(event);
    if (intersectedObjects.length > 0){
        transformControls.attach(intersectedObjects[0].object);
        for (const index in simulation.boxes){
            if (simulation.boxes[index].mesh.uuid == intersectedObjects[0].object.uuid){
                itemSelected = index;
                transformControls.attach(simulation.boxes[index].mesh);
                setRightParameters();
                break;
            }
        }
    } else {
        if (transformControls.object && !transformControls.dragging){
            transformControls.detach();
            itemSelected = -1;
            setRightParameters();
        }
    }
});


window.addEventListener('resize', () => {
    camera.aspect = parseInt(window.getComputedStyle(topUI).width) / parseInt(window.getComputedStyle(rightUI).height);
    camera.updateProjectionMatrix();

    renderer.setSize(parseInt(window.getComputedStyle(topUI).width), parseInt(window.getComputedStyle(rightUI).height));

});

//Size Setting

width.addEventListener("blur", () => {
    if ((width.value.length == 0 || isNaN(width.value)) && itemSelected > -1) {
        width.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.scale.x = parseFloat(width.value) / simulation.boxes[itemSelected].mesh.geometry.parameters.width;
        synchronizeSize();
    }
});

height.addEventListener("blur", () => {
    if ((height.value.length == 0 || isNaN(height.value)) && itemSelected > -1) {
        height.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.scale.y = parseFloat(height.value) / simulation.boxes[itemSelected].mesh.geometry.parameters.height;
        synchronizeSize();
    }
});

depth.addEventListener("blur", () => {
    if ((depth.value.length == 0 || isNaN(depth.value)) && itemSelected > -1) {
        depth.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.scale.z = parseFloat(depth.value) / simulation.boxes[itemSelected].mesh.geometry.parameters.depth;
        synchronizeSize();
    }
});


//Position Setting

const xPos = document.getElementById("right-position-x");
const yPos = document.getElementById("right-position-y");
const zPos = document.getElementById("right-position-z");

xPos.addEventListener("blur", () => {
    if ((xPos.value.length == 0 || isNaN(xPos.value)) && itemSelected > -1) {
        xPos.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.position.x = parseFloat(xPos.value);
        synchronizePositions();
    }
});

yPos.addEventListener("blur", () => {
    if ((yPos.value.length == 0 || isNaN(yPos.value)) && itemSelected > -1) {
        yPos.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.position.y = parseFloat(yPos.value);
        synchronizePositions();
    }
});

zPos.addEventListener("blur", () => {
    if ((zPos.value.length == 0 || isNaN(zPos.value)) && itemSelected > -1) {
        zPos.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.position.z = parseFloat(zPos.value);
        synchronizePositions();
    }
});

//Velocity Setting

const xVel = document.getElementById("right-velocity-x");
const yVel = document.getElementById("right-velocity-y");
const zVel = document.getElementById("right-velocity-z");

xVel.addEventListener("blur", () => {
    if ((xVel.value.length == 0 || isNaN(xVel.value)) && itemSelected > -1) {
        xVel.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.velocity.x = parseFloat(xVel.value);
    }
});

yVel.addEventListener("blur", () => {
    if ((yVel.value.length == 0 || isNaN(yVel.value)) && itemSelected > -1) {
        yVel.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.velocity.y = parseFloat(yVel.value);
    }
});

zVel.addEventListener("blur", () => {
    if ((zVel.value.length == 0 || isNaN(zVel.value)) && itemSelected > -1) {
        zVel.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.velocity.z = parseFloat(zVel.value);
    }
});

//Rotation Setting

const xRot = document.getElementById("right-rotation-x");
const yRot = document.getElementById("right-rotation-y");
const zRot = document.getElementById("right-rotation-z");

xRot.addEventListener("blur", () => {
    if ((xRot.value.length == 0 || isNaN(xRot.value)) && itemSelected > -1) {
        xRot.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.rotation.x = parseFloat(xRot.value);
        synchronizeRotation();
    }
});

yRot.addEventListener("blur", () => {
    if ((yRot.value.length == 0 || isNaN(yRot.value)) && itemSelected > -1) {
        yRot.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.rotation.y = parseFloat(yRot.value);
        synchronizeRotation();
    }
});

zRot.addEventListener("blur", () => {
    if ((zRot.value.length == 0 || isNaN(zRot.value)) && itemSelected > -1) {
        zRot.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].mesh.rotation.z = parseFloat(zRot.value);
        synchronizeRotation();
    }
});

//Angular Velocity Setting

const xAng = document.getElementById("right-angular-x");
const yAng = document.getElementById("right-angular-y");
const zAng = document.getElementById("right-angular-z");

xAng.addEventListener("blur", () => {
    if ((xAng.value.length == 0 || isNaN(xAng.value)) && itemSelected > -1) {
        xAng.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.angularVelocity.x = parseFloat(xAng.value);
    }
});

yAng.addEventListener("blur", () => {
    if ((yAng.value.length == 0 || isNaN(yAng.value)) && itemSelected > -1) {
        yAng.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.angularVelocity.y = parseFloat(yAng.value);
    }
});

zAng.addEventListener("blur", () => {
    if ((zAng.value.length == 0 || isNaN(zAng.value)) && itemSelected > -1) {
        zAng.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.angularVelocity.z = parseFloat(zAng.value);
    }
});

const xFor = document.getElementById("right-force-x");
const yFor = document.getElementById("right-force-y");
const zFor = document.getElementById("right-force-z");

xFor.addEventListener("blur", () => {
    if ((xFor.value.length == 0 || isNaN(xFor.value)) && itemSelected > -1) {
        xFor.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.force.x = parseFloat(xFor.value);
    }
});

yFor.addEventListener("blur", () => {
    if ((yFor.value.length == 0 || isNaN(yFor.value)) && itemSelected > -1) {
        yFor.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.force.y = parseFloat(yFor.value);
    }
});

zFor.addEventListener("blur", () => {
    if ((zFor.value.length == 0 || isNaN(zFor.value)) && itemSelected > -1) {
        zFor.focus();
    } else if (itemSelected > -1){
        simulation.boxes[itemSelected].body.force.z = parseFloat(zFor.value);
    }
});

colorPicker.addEventListener("change", (event) => {
    if (itemSelected > -1) {
        simulation.boxes[itemSelected].mesh.material.color.set(`${event.target.value}`);
    }
});

document.getElementById("custom-primary-color-picker").addEventListener("change", (event) => {
    if (storedTheme == 'custom'){
        gsap.to("html", { duration: 0.2, "--primary-color": event.target.value });
        localStorage.setItem("customThemePrimary", event.target.value);
    }
})

document.getElementById("custom-secondary-color-picker").addEventListener("change", (event) => {
    if (storedTheme == 'custom'){
        gsap.to("html", { duration: 0.2, "--secondary-color": event.target.value });
        localStorage.setItem("customThemeSecondary", event.target.value);
    }
})

document.getElementById("background-color-picker").addEventListener("change", (event) => {
    renderer.setClearColor(event.target.value);
})

//Temp
document.getElementById("add-cube-button").onclick = simulation.createBox.bind(simulation, 0, 0, 0, 2, 2, 2);
document.getElementById("add-sphere-button").onclick = simulation.createBox.bind(simulation, 5, 0, 0, 2, 2, 2);

function handleWireFrameToggle(){
    if (document.getElementById("wireframe-toggle").checked && itemSelected > -1){
        simulation.boxes[itemSelected].mesh.material.wireframe = true;
    } else {
        if (itemSelected > -1){
            simulation.boxes[itemSelected].mesh.material.wireframe = false;
        }
    }
}

function handleStatsToggle(){
    if (document.getElementById("stats-toggle").checked){
        const stats = Stats();
        document.body.appendChild(stats.dom);
    }
}

document.getElementById("wireframe-toggle").onclick = handleWireFrameToggle;

transformControls.addEventListener("change", (event) => {
    if (itemSelected > -1){
        switch (event.target.getMode()) {
            case "translate":
                synchronizePositions();
                break;
            case "rotate":
                synchronizeRotation();
                break;
            case "scale":
                synchronizeSize();
                break;
            default:
                break;
        }
    }
});

transformControls.addEventListener("mouseUp", setRightParameters);