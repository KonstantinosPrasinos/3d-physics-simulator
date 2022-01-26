import {simulation, transformControls, orbitControls, camera, copyobjects, renderer, updateVectors, printToLog, generateJSON, setCamera, rewindobjects, toggleStats, changeTimeStep, toggleResultantForceVector, toggleComponentForcesVectors, toggleResultantVelocityVector, toggleComponentVelocityVectors, switchControls, setDisabledPhysical, setDisabledVisual, updateStaticValues, updateVarValues, setSizesForShape, toggleValues, updateValuesWhileRunning, flyControls, world, actionList, resumeSimulation, pauseSimulation} from './main.js';

import {notificationList} from './notifications.js';

let mode = "setup", selectedCursor = "none", rightUIisCollapsed = true, storedTheme = 'dark', timeStepStr = '1/60', showNotifications = true, doTutorial = true, canClickCanvas = true, invalidClicksCanvas = 0;

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
let fovSlider = document.getElementById("fov-slider");
let fovText = document.getElementById("fov-text");
let libraryUi = document.getElementById("library-ui");
let eventHandlerUi = document.getElementById("event-handler-ui");

//Local Storage Stuff

function initStyling(){
    if (!localStorage.backgroundColor){
        localStorage.setItem("backgroundColor", "#ffffff");
    } else {
        let color = localStorage.getItem("backgroundColor")
        document.getElementById("background-color-picker").value = color;
        setBackgroundColor(color);
    }

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

    if (!localStorage.cameraType){
        localStorage.setItem("cameraType", "OrthographicCamera")
    } else {
        let cameraType = localStorage.getItem("cameraType");
        handleCameraButton(cameraType);
        if (cameraType == "OrthographicCamera"){
            document.getElementById("orthographic-button").checked = true;
            document.getElementById("perspective-button").checked = false;
        } else {
            document.getElementById("orthographic-button").checked = false;
            document.getElementById("perspective-button").checked = true;
        }
    }

    if (!localStorage.cameraFov){
        localStorage.setItem("cameraFov", 45);
    } else {
        let fov = parseInt(localStorage.getItem("cameraFov"))
        camera.fov = fov;
        fovText.placeholder = fov;
        fovSlider.value = fov;
    }

    if (!localStorage.timeStep){
        localStorage.setItem("timeStep", timeStepStr);
        document.getElementById("time-step-editable").placeholder = timeStepStr;
    } else {
        timeStepStr = localStorage.getItem("timeStep");
        document.getElementById("time-step-editable").placeholder = timeStepStr;
        changeTimeStep(eval(timeStepStr))
    }

    if (!localStorage.gridX){
        localStorage.setItem("gridX", false);
    } else {
        //Do grid x stuff
    }

    if (!localStorage.gridY){
        localStorage.setItem("gridY", false);
    } else {
        //Do grid y stuff
    }

    if (!localStorage.gridX){
        localStorage.setItem("gridZ", false);
    } else {
        //Do grid z stuff
    }

    if (!localStorage.fpsBool){
        localStorage.setItem("fpsBool", false);
    } else {
        let fps = localStorage.getItem("fpsBool");
        if (fps === 'true'){
            toggleStats(fps);
        }
        document.getElementById("fps-toggle").checked = (fps === 'true');
    }

    if (!localStorage.gravityX){
        localStorage.setItem("gravityX", 0);
    } else {
        world.gravity.x = parseFloat(localStorage.getItem("gravityX"));
        document.getElementById("gravity-x-editable").placeholder = world.gravity.x;
    }

    if (!localStorage.gravityY){
        localStorage.setItem("gravityY", 0);
    } else {
        world.gravity.y = parseFloat(localStorage.getItem("gravityY"));
        document.getElementById("gravity-y-editable").placeholder = world.gravity.y;
    }

    if (!localStorage.gravityZ){
        localStorage.setItem("gravityZ", 0);
    } else {
        world.gravity.z = parseFloat(localStorage.getItem("gravityZ"));
        document.getElementById("gravity-z-editable").placeholder = world.gravity.z;
    }

    if (!localStorage.showNotifications){
        localStorage.setItem("showNotifications", showNotifications);
    } else {
        showNotifications = localStorage.getItem("showNotifications");
    }

    if (!localStorage.doTutorial) {
        localStorage.setItem("doTutorial", true);
        handleTutorialToggle(doTutorial == 'true');
    } else {
        doTutorial = (localStorage.getItem("doTutorial") == 'true');
        document.getElementById("tutorial-toggle").checked = doTutorial;
        if (doTutorial) {
            handleTutorialToggle(doTutorial);
        }
    }

    if (!localStorage.printTimestep){
        localStorage.setItem("printTimestep", 0);
    } else {
        let perTimeStep = localStorage.getItem("printTimestep");
        simulation.logPerSteps = perTimeStep;
        document.getElementById("print-timestep").placeholder = perTimeStep;
    }

    fetch("../data/contentLibrary.json")
        .then(response => {
            return response.json();
        })
        .then(data => {
            data.forEach(element => {
                createHTMLElement(element);
            });
        });
}

const library = document.getElementById('library-contents-container');

function createHTMLElement(element) {
    let node = document.createElement('div');
    node.classList.add('library-item');

    let title = document.createElement('div');
    title.innerText = element.title;
    title.classList.add('content-title')

    let img = document.createElement('img');
    img.classList.add('content-image')
    img.src = `assets/content-library/${element.thumbnail}`;

    let loadButton = document.createElement('button');
    loadButton.classList.add('load-content-button');
    loadButton.classList.add('simple-button');
    loadButton.innerText = 'Load';
    loadButton.onclick = function () {
        fetch(`../data/${element.data}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            loadfromJson(data);
        });
        
        createNotification(notificationList.itemLoading, true);
    }
    node.appendChild(img);
    node.appendChild(title);
    node.appendChild(loadButton);
    
    library.appendChild(node);
}


//General Functions
document.getElementById("print-timestep").addEventListener("blur", (event) => {
    if (event.target.value.length > 0 && !isNaN(event.target.value)){
        let value = parseInt(document.getElementById("print-timestep").value);
        simulation.logPerSteps = value;
        localStorage.setItem("printTimestep", value);
    } else {
        event.target.focus();
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
    if (simulation.objects.length){
        downloadJson(JSON.stringify(generateJSON()));
    }
}

function downloadSetupLogJson(){
    
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

document.getElementById("print-log").onclick = printToLog.bind(this, 'Print button pressed');
document.getElementById("clear-log").onclick = clearLog;
document.getElementById("download-long-json").onclick = downloadLongLogJson;
document.getElementById("download-current-json").onclick = downloadCurrentLogJson;
document.getElementById("download-current-txt").onclick = downloadCurrentLogTxt;
document.getElementById("download-long-txt").onclick = downloadLongLogTxt;

function synchronizePositions() {
    simulation.objects[simulation.itemSelected].body.position.x = simulation.objects[simulation.itemSelected].mesh.position.x;
    simulation.objects[simulation.itemSelected].body.position.y = simulation.objects[simulation.itemSelected].mesh.position.y;
    simulation.objects[simulation.itemSelected].body.position.z = simulation.objects[simulation.itemSelected].mesh.position.z;
    updateVectors(simulation.objects[simulation.itemSelected]);
}

function synchronizeRotation() {
    simulation.objects[simulation.itemSelected].body.quaternion.x = simulation.objects[simulation.itemSelected].mesh.quaternion.x;
    simulation.objects[simulation.itemSelected].body.quaternion.y = simulation.objects[simulation.itemSelected].mesh.quaternion.y;
    simulation.objects[simulation.itemSelected].body.quaternion.z = simulation.objects[simulation.itemSelected].mesh.quaternion.z;
}

function synchronizeSize(axis){
    let widthSegments, heightSegments;
    switch (simulation.objects[simulation.itemSelected].mesh.geometry.type) {
        case "BoxGeometry":
            //Changes the size of the box
            simulation.objects[simulation.itemSelected].body.shapes[0].halfExtents.set(simulation.objects[simulation.itemSelected].mesh.geometry.parameters.width * simulation.objects[simulation.itemSelected].mesh.scale.x / 2, simulation.objects[simulation.itemSelected].mesh.geometry.parameters.height * simulation.objects[simulation.itemSelected].mesh.scale.y / 2, simulation.objects[simulation.itemSelected].mesh.geometry.parameters.depth * simulation.objects[simulation.itemSelected].mesh.scale.z / 2);
            break;
        case "SphereGeometry":
            //Synchronizes the scales of the three dimensions so that they match and become the "radius"
            if (simulation.objects[simulation.itemSelected].mesh.scale.x == simulation.objects[simulation.itemSelected].mesh.scale.y){
                simulation.objects[simulation.itemSelected].mesh.scale.x = simulation.objects[simulation.itemSelected].mesh.scale.y = simulation.objects[simulation.itemSelected].mesh.scale.z;
            } else if (simulation.objects[simulation.itemSelected].mesh.scale.x == simulation.objects[simulation.itemSelected].mesh.scale.z){
                simulation.objects[simulation.itemSelected].mesh.scale.x = simulation.objects[simulation.itemSelected].mesh.scale.z = simulation.objects[simulation.itemSelected].mesh.scale.y;
            } else if (simulation.objects[simulation.itemSelected].mesh.scale.y == simulation.objects[simulation.itemSelected].mesh.scale.z){
                simulation.objects[simulation.itemSelected].mesh.scale.y = simulation.objects[simulation.itemSelected].mesh.scale.z = simulation.objects[simulation.itemSelected].mesh.scale.x;
            } else {
                simulation.objects[simulation.itemSelected].mesh.scale.y = simulation.objects[simulation.itemSelected].mesh.scale.z = simulation.objects[simulation.itemSelected].mesh.scale.x;
            }
            //Changes the radius of the sphere
            simulation.objects[simulation.itemSelected].body.shapes[0].radius = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radius * simulation.objects[simulation.itemSelected].mesh.scale.x;

            //Updating of width and height segments when size changes so that if the sphere becomes bigger, it looks like a sphere
            simulation.objects[simulation.itemSelected].mesh.geometry.parameters.widthSegments = Math.ceil(simulation.objects[simulation.itemSelected].body.shapes[0].radius / 10) * 16;
            simulation.objects[simulation.itemSelected].mesh.geometry.parameters.heightSegments = Math.ceil(simulation.objects[simulation.itemSelected].body.shapes[0].radius / 10) * 8;
            break;
        case "CylinderGeometry":
            switch (axis) {
                case 'X':
                    simulation.objects[simulation.itemSelected].mesh.scale.z = simulation.objects[simulation.itemSelected].mesh.scale.x;
                    simulation.objects[simulation.itemSelected].body.shapes[0].radiusTop = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radiusTop * simulation.objects[simulation.itemSelected].mesh.scale.x;
                    simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radialSegments = Math.ceil(simulation.objects[simulation.itemSelected].body.shapes[0].radiusTop / 10) * 16;
                    break;
                case 'Z':
                    simulation.objects[simulation.itemSelected].mesh.scale.x = simulation.objects[simulation.itemSelected].mesh.scale.z;
                    simulation.objects[simulation.itemSelected].body.shapes[0].radiusTop = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radiusTop * simulation.objects[simulation.itemSelected].mesh.scale.z;
                    simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radialSegments = Math.ceil(simulation.objects[simulation.itemSelected].body.shapes[0].radiusTop / 10) * 16;
                    break;
                case 'Y':
                    simulation.objects[simulation.itemSelected].body.shapes[0].height = simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radiusTop * simulation.objects[simulation.itemSelected].mesh.scale.y;
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
    //Updates the size of the object
    simulation.objects[simulation.itemSelected].body.shapes[0].updateBoundingSphereRadius();
    simulation.objects[simulation.itemSelected].body.updateBoundingRadius();
    simulation.objects[simulation.itemSelected].body.updateMassProperties();
}

function setTheme(theme) {
    let customGridContainer = document.getElementById("custom-grid-container");
    if (theme != storedTheme) {
        if (theme != "custom" && window.getComputedStyle(customGridContainer).opacity == 1){
            function toggleVisibilityHidden(){
                customGridContainer.style.visibility = "hidden";
            }
            gsap.to(customGridContainer, { duration: 0.2, opacity: 0, onComplete: toggleVisibilityHidden});
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
                    customGridContainer.style.visibility = "inherit";
                    gsap.to(customGridContainer, {duration: 0.2, opacity: 1});
                }
            default:
                break;
        }

    }
}

function toggleSettings() {
    function toggleVisibility() { settingsOverlay.style.visibility = 'hidden'; }
    let socialContainer = document.getElementById("socials-container");
    if (window.getComputedStyle(settingsOverlay).visibility == 'hidden') {
        let timeline = gsap.timeline();
        settingsOverlay.style.visibility = 'visible';
        timeline.to(settingsOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', duration: 0.15 })
            .to(settingsBox, { opacity: 1, duration: 0.15 }, '-=0.15')
            .to(socialContainer, { opacity: 1, duration: 0.15 }, '-=0.30');
    } else {
        let timeline = gsap.timeline();
        timeline.to(settingsOverlay, { backgroundColor: 'rgba(0, 0, 0, 0)', duration: 0.15, onComplete: toggleVisibility })
            .to(settingsBox, { opacity: 0, duration: 0.15 }, '-=0.15')
            .to(socialContainer, { opacity: 0, duration: 0.15 }, '-=0.15');
    }
}

//Click Events

function handleCameraButton(type){
    let fovGrid = document.getElementById("fov-grid-container");
    if (type == "PerspectiveCamera"){
        setCamera("PerspectiveCamera");
        fovGrid.style.visibility = "inherit";
        if (window.getComputedStyle(fovGrid).opacity == 0){
            gsap.to(fovGrid, { duration: 0.2, opacity: 1});
        }
        localStorage.setItem("cameraType", type);
    } else if (type == "OrthographicCamera"){
        setCamera("OrthographicCamera");
        if (window.getComputedStyle(fovGrid).opacity == 1){
            function toggleVisibilityHidden(){
                fovGrid.style.visibility = "hidden";
            }
            gsap.to(fovGrid, { duration: 0.2, opacity: 0, onComplete: toggleVisibilityHidden});
        }
        localStorage.setItem("cameraType", type);
    }
}

document.getElementById("perspective-button").onclick = handleCameraButton.bind(this, "PerspectiveCamera");
document.getElementById("orthographic-button").onclick = handleCameraButton.bind(this, "OrthographicCamera");

function selectCursorMove(){
    if (transformControls.mode != 'translate' || !transformControls.enabled) {
        document.getElementById("top-select").style.backgroundColor = "orange";
        document.getElementById("top-resize").style.backgroundColor = "var(--secondary-color)";
        document.getElementById("top-rotate").style.backgroundColor = "var(--secondary-color)";
        transformControls.setMode('translate');
        transformControls.enabled = true;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = false;
        }
    } else {
        transformControls.detach();
        document.getElementById("top-select").style.backgroundColor = "var(--secondary-color)";
        transformControls.enabled = false;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = true;
        }
    }
}

document.getElementById("top-select").onclick = selectCursorMove;

function selectCursorScale(){
    if (transformControls.mode != 'scale' || !transformControls.enabled) {
        document.getElementById("top-resize").style.backgroundColor = "orange";
        document.getElementById("top-rotate").style.backgroundColor = "var(--secondary-color)";
        document.getElementById("top-select").style.backgroundColor = "var(--secondary-color)";
        transformControls.setMode('scale');
        transformControls.enabled = true;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = false;
        }
    } else {
        transformControls.detach();
        document.getElementById("top-resize").style.backgroundColor = "var(--secondary-color)";
        transformControls.enabled = false;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = true;
        }
    }
}

document.getElementById("top-resize").onclick = selectCursorScale;

function selectCursorRotate(){
    if (transformControls.mode != 'rotate' || !transformControls.enabled) {
        document.getElementById("top-rotate").style.backgroundColor = "orange";
        document.getElementById("top-resize").style.backgroundColor = "var(--secondary-color)";
        document.getElementById("top-select").style.backgroundColor = "var(--secondary-color)";
        transformControls.setMode('rotate');
        transformControls.enabled = true;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = false;
        }
    } else {
        transformControls.detach();
        document.getElementById("top-rotate").style.backgroundColor = "var(--secondary-color)";
        transformControls.enabled = false;
        if (camera.type != "PerspectiveCamera"){
            orbitControls.enabled = true;
        }
    }
}

document.getElementById("top-rotate").onclick = selectCursorRotate;

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
        if (showNotifications && doTutorial){
            createNotification(notificationList.tutRight, false);
        }
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

let libraryContainer = document.getElementById('library-container');

function handleLibrary() {
    function toggleVisibility() { libraryUi.style.visibility = 'hidden'; }
    function toggleLibrary() {
        if (window.getComputedStyle(libraryUi).visibility == 'hidden') {
            let timeline = gsap.timeline();
            libraryUi.style.visibility = 'visible';
            timeline.to(libraryUi, { duration: 0.2, width: '20em' })
                .to(libraryContainer, { duration: 0.2, opacity: 1 });
        } else {
            let timeline = gsap.timeline();
            timeline.to(libraryContainer, { duration: 0.2, opacity: 0 })
                .to(libraryUi, { duration: 0.2, width: '0px', onComplete: toggleVisibility });
        }
    }
    if (window.getComputedStyle(eventHandlerUi).visibility == 'visible'){
        handleEventsUi();
        setTimeout(toggleLibrary, 400);
    } else {
        toggleLibrary();
    }
}

document.getElementById('library-button').onclick = document.getElementById('close-library').onclick = handleLibrary;

let eventHandlerContainer = document.getElementById('event-handler-container');

function handleEventsUi(){
    function toggleVisibility() { eventHandlerUi.style.visibility = 'hidden'; }
    function toggleEventsUi() {
        if (window.getComputedStyle(eventHandlerUi).visibility == 'hidden') {
            let timeline = gsap.timeline();
            eventHandlerUi.style.visibility = 'visible';
            timeline.to(eventHandlerUi, { duration: 0.2, width: '20em' })
                .to(eventHandlerContainer, { duration: 0.2, opacity: 1 });
        } else {
            let timeline = gsap.timeline();
            timeline.to(eventHandlerContainer, { duration: 0.2, opacity: 0 })
                .to(eventHandlerUi, { duration: 0.2, width: '0px', onComplete: toggleVisibility });
        }
    }
    if (window.getComputedStyle(libraryUi).visibility == 'visible'){
        handleLibrary();
        setTimeout(toggleEventsUi, 400);
    } else {
        toggleEventsUi();
    }
    
}

document.getElementById('actions-button').onclick = document.getElementById('close-events-handler').onclick = handleEventsUi;

function handleSettingsOpen(){
    if (showNotifications && doTutorial && window.getComputedStyle(document.getElementById("settings-box")).visibility == "hidden"){
        createNotification(notificationList.tutSettings, false);
    }
    toggleSettings();
}

document.getElementById("settings-button").onclick = handleSettingsOpen;
document.getElementById("close-settings").onclick = toggleSettings;

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
        simulation.isRunning = true;
        document.getElementById("top-replay").classList.remove('disabled-button');
        if (transformControls.enabled){
            switch (transformControls.mode) {
                case 'translate':
                    selectCursorMove();
                    break;
                case 'scale':
                    selectCursorScale();
                    break;
                case 'rotate':
                    selectCursorRotate();
                    break;
                default:
                    break;
            }
        }
        copyobjects();
        mode = "simulation";
        topMode.innerHTML = "<b>Mode:</b> Simulation";
        simulation.objects.forEach(element => {
            element.body.position.copy(element.mesh.position);
            element.body.quaternion.copy(element.mesh.quaternion);
        });
        setDisabledPhysical(true);
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
        simulation.isRunning = false;
        rewindobjects();
        topMode.innerHTML = "<b>Mode:</b> Setup";
        if (simulation.itemSelected > -1){
            setDisabledPhysical(false);
            updateValuesWhileRunning(true);
            switchControls('transform');
        }
        document.getElementById("top-replay").classList.add('disabled-button');
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
    if (isNaN(document.activeElement.value) && !event.target.classList.contains('item-list-editable')) {
        createNotification(notificationList.inputNan, true);
    } else if (document.activeElement.value.length == 0) {
        createNotification(notificationList.inputEmpty, true);
    } else {
        document.activeElement.blur();
    }
}

function handleEnter(event){
    if (event.key === 'Enter'){
        blurFocusedElement(event);
    }
}

document.addEventListener("keydown", handleEnter);

fovSlider.oninput = function (){
    if (camera.type == "PerspectiveCamera"){
        camera.fov = parseInt(fovSlider.value);
        localStorage.setItem("cameraFov", parseInt(fovSlider.value));
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
            localStorage.cameraFov = parseInt(fovText.value);
        }
        fovText.value = "";
        fovSlider.value = camera.fov;
    }
});

function handleTransformControlsMouse(mouseUp){
    if (mouseUp){
        canClickCanvas = true;
    } else {
        canClickCanvas = false;
    }
}

let doubleClick = null;

function handleCanvasClick(event, bool){
    if (mode == "setup"  && !simulation.placingObject){
        let intersectedObjects;
        if (bool){
            intersectedObjects = simulation.checkForObject(event);
        } else {intersectedObjects = []};
        if (transformControls.enabled  && !transformControls.dragging && intersectedObjects.length > 0 && intersectedObjects[0].object.userData.selectable && canClickCanvas) {
            transformControls.attach(intersectedObjects[0].object);
            for (const index in simulation.objects) {
                if (simulation.objects[index].mesh.uuid == intersectedObjects[0].object.uuid) {
                    simulation.itemSelected = parseInt(index);
                    transformControls.attach(simulation.objects[index].mesh);
                    canClickCanvas = true;
                    invalidClicksCanvas = 0;
                    document.getElementById(intersectedObjects[0].object.uuid).childNodes[0].checked = true;
                    setDisabledVisual(false);
                    setDisabledPhysical(false);
                    toggleValues(true);
                    break;
                }
            }
        } else {
            invalidClicksCanvas++;
            if (simulation.itemSelected > -1){
                document.getElementById(simulation.objects[simulation.itemSelected].mesh.uuid).childNodes[0].checked = false;
            }
            if (transformControls.object && !transformControls.dragging) {
                document.activeElement.blur();
                transformControls.detach();
                simulation.itemSelected = -1;
                canClickCanvas = true;
                setDisabledVisual(true);
                setDisabledPhysical(true);
                toggleValues(false);
            }
            if (invalidClicksCanvas > 1){
                if (transformControls.enabled){
                    switch (transformControls.mode) {
                        case 'translate':
                            selectCursorMove();
                            break;
                        case 'scale':
                            selectCursorScale();
                            break;
                        case 'rotate':
                            selectCursorRotate();
                            break;
                        default:
                            break;
                    }
                }
                invalidClicksCanvas = 0;
                clearTimeout(doubleClick);
                doubleClick = null;
                if (camera.type == "PerspectiveCamera"){
                    flyControls.canLockOn = true;
                }
            } else {
                doubleClick = setTimeout(() => {invalidClicksCanvas = 0}, 500);
            }
        }
    }
}

canvas.addEventListener("mousedown", (event) => {
    handleCanvasClick(event, true);
});
canvas.addEventListener("click", (event) => {
    if (event.pointerId === -1){
        handleCanvasClick(event, false);
    }
});


window.addEventListener('resize', () => {
    camera.aspect = parseInt(window.getComputedStyle(topUI).width) / parseInt(window.getComputedStyle(rightUI).height);
    camera.updateProjectionMatrix();

    renderer.setSize(parseInt(window.getComputedStyle(topUI).width), parseInt(window.getComputedStyle(rightUI).height));

});

//Size Setting

const width = document.getElementById("width-input");
const height = document.getElementById("height-input");
const depth = document.getElementById("depth-input");

width.addEventListener("blur", () => {
    if (simulation.itemSelected > -1){
        if (width.value.length == 0 || isNaN(width.value)) {
            width.focus();
            createNotification(notificationList.inputEmpty, true);
        } else {
            switch (simulation.objects[simulation.itemSelected].mesh.geometry.type) {
                case "BoxGeometry":
                    simulation.objects[simulation.itemSelected].mesh.scale.x = parseFloat(width.value) / simulation.objects[simulation.itemSelected].mesh.geometry.parameters.width;
                    synchronizeSize();
                    break;
                case "SphereGeometry":
                    simulation.objects[simulation.itemSelected].mesh.scale.x = simulation.objects[simulation.itemSelected].mesh.scale.y = simulation.objects[simulation.itemSelected].mesh.scale.z = parseFloat(width.value) / simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radius;
                    synchronizeSize();
                    break;
                case "CylinderGeometry":
                    simulation.objects[simulation.itemSelected].mesh.scale.x = simulation.objects[simulation.itemSelected].mesh.scale.z = parseFloat(width.value) / simulation.objects[simulation.itemSelected].mesh.geometry.parameters.radiusTop;
                    synchronizeSize("X");
                    break;
                default:
                    break;
            }
        }
    }
});

height.addEventListener("blur", () => {
    if ((height.value.length == 0 || isNaN(height.value)) && simulation.itemSelected > -1) {
        height.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.scale.y = parseFloat(height.value) / simulation.objects[simulation.itemSelected].mesh.geometry.parameters.height;
        synchronizeSize();
    }
});

depth.addEventListener("blur", () => {
    if ((depth.value.length == 0 || isNaN(depth.value)) && simulation.itemSelected > -1) {
        depth.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.scale.z = parseFloat(depth.value) / simulation.objects[simulation.itemSelected].mesh.geometry.parameters.depth;
        synchronizeSize();
    }
});


//Position Setting

const xPos = document.getElementById("position.x-input");
const yPos = document.getElementById("position.y-input");
const zPos = document.getElementById("position.z-input");

xPos.addEventListener("blur", () => {
    if ((xPos.value.length == 0 || isNaN(xPos.value)) && simulation.itemSelected > -1) {
        xPos.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.position.x = parseFloat(xPos.value);
        synchronizePositions();
    }
});

yPos.addEventListener("blur", () => {
    if ((yPos.value.length == 0 || isNaN(yPos.value)) && simulation.itemSelected > -1) {
        yPos.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.position.y = parseFloat(yPos.value);
        synchronizePositions();
    }
});

zPos.addEventListener("blur", () => {
    if ((zPos.value.length == 0 || isNaN(zPos.value)) && simulation.itemSelected > -1) {
        zPos.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.position.z = parseFloat(zPos.value);
        synchronizePositions();
    }
});

// //Velocity Setting

const xVel = document.getElementById("velocity.x-input");
const yVel = document.getElementById("velocity.y-input");
const zVel = document.getElementById("velocity.z-input");

xVel.addEventListener("blur", () => {
    if ((xVel.value.length == 0 || isNaN(xVel.value)) && simulation.itemSelected > -1) {
        xVel.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.velocity.x = parseFloat(xVel.value);
    }
});

yVel.addEventListener("blur", () => {
    if ((yVel.value.length == 0 || isNaN(yVel.value)) && simulation.itemSelected > -1) {
        yVel.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.velocity.y = parseFloat(yVel.value);
    }
});

zVel.addEventListener("blur", () => {
    if ((zVel.value.length == 0 || isNaN(zVel.value)) && simulation.itemSelected > -1) {
        zVel.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.velocity.z = parseFloat(zVel.value);
    }
});

// //Rotation Setting

const xRot = document.getElementById("rotation.x-input");
const yRot = document.getElementById("rotation.y-input");
const zRot = document.getElementById("rotation.z-input");

xRot.addEventListener("blur", () => {
    if ((xRot.value.length == 0 || isNaN(xRot.value)) && simulation.itemSelected > -1) {
        xRot.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.rotation.x = parseFloat(xRot.value);
        synchronizeRotation();
    }
});

yRot.addEventListener("blur", () => {
    if ((yRot.value.length == 0 || isNaN(yRot.value)) && simulation.itemSelected > -1) {
        yRot.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.rotation.y = parseFloat(yRot.value);
        synchronizeRotation();
    }
});

zRot.addEventListener("blur", () => {
    if ((zRot.value.length == 0 || isNaN(zRot.value)) && simulation.itemSelected > -1) {
        zRot.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.rotation.z = parseFloat(zRot.value);
        synchronizeRotation();
    }
});

// //Angular Velocity Setting

const xAng = document.getElementById("angularVelocity.x-input");
const yAng = document.getElementById("angularVelocity.y-input");
const zAng = document.getElementById("angularVelocity.y-input");

xAng.addEventListener("blur", () => {
    if ((xAng.value.length == 0 || isNaN(xAng.value)) && simulation.itemSelected > -1) {
        xAng.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.angularVelocity.x = parseFloat(xAng.value);
    }
});

yAng.addEventListener("blur", () => {
    if ((yAng.value.length == 0 || isNaN(yAng.value)) && simulation.itemSelected > -1) {
        yAng.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.angularVelocity.y = parseFloat(yAng.value);
    }
});

zAng.addEventListener("blur", () => {
    if ((zAng.value.length == 0 || isNaN(zAng.value)) && simulation.itemSelected > -1) {
        zAng.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.angularVelocity.z = parseFloat(zAng.value);
    }
});

//Force

const xFor = document.getElementById("force.x-input");
const yFor = document.getElementById("force.y-input");
const zFor = document.getElementById("force.z-input");

xFor.addEventListener("blur", () => {
    if ((xFor.value.length == 0 || isNaN(xFor.value)) && simulation.itemSelected > -1) {
        xFor.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.force.x = parseFloat(xFor.value);
    }
});

yFor.addEventListener("blur", () => {
    if ((yFor.value.length == 0 || isNaN(yFor.value)) && simulation.itemSelected > -1) {
        yFor.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.force.y = parseFloat(yFor.value);
    }
});

zFor.addEventListener("blur", () => {
    if ((zFor.value.length == 0 || isNaN(zFor.value)) && simulation.itemSelected > -1) {
        zFor.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.force.z = parseFloat(zFor.value);
    }
});

//Mass
const massInput = document.getElementById("mass-input");
massInput.addEventListener("blur", () => {
    if ((massInput.value.length == 0 || isNaN(massInput.value)) && simulation.itemSelected > -1) {
        massInput.focus();
        createNotification(notificationList.inputEmpty, true);
    } else if (simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].body.mass = parseFloat(massInput.value);
        simulation.objects[simulation.itemSelected].body.updateMassProperties();
    }
});

document.getElementById("collisionResponse-toggle").addEventListener("click", (event) => {
    if (simulation.itemSelected > -1){
        if (event.target.checked){
            simulation.objects[simulation.itemSelected].body.collisionResponse = true;
        } else {
            simulation.objects[simulation.itemSelected].body.collisionResponse = false;
        }
    }
});

document.getElementById("fps-toggle").addEventListener("click", (event) => {
    toggleStats(event.target.checked);
    localStorage.setItem("fpsBool", event.target.checked);
});

colorPicker.addEventListener("change", (event) => {
    if (simulation.itemSelected > -1) {
        simulation.objects[simulation.itemSelected].mesh.material.color.set(`${event.target.value}`);
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

function setBackgroundColor(color){
    renderer.setClearColor(color);
}

document.getElementById("background-color-picker").addEventListener("change", (event) => {
    localStorage.backgroundColor = event.target.value;
    setBackgroundColor(event.target.value);
})

//Temp
document.getElementById("add-cube-button").onclick = simulation.createBox.bind(simulation, 'none', 0, 0, 2, 2, 2);
document.getElementById("add-sphere-button").onclick = simulation.createSphere.bind(simulation, 'none', 0, 0, 1);
document.getElementById("add-cylinder-button").onclick = simulation.createCylinder.bind(simulation, 'none', 0, 0, 1, 5);

function handleWireFrameToggle(){
    if (document.getElementById("wireframe-toggle").checked && simulation.itemSelected > -1){
        simulation.objects[simulation.itemSelected].mesh.material.wireframe = true;
    } else {
        if (simulation.itemSelected > -1){
            simulation.objects[simulation.itemSelected].mesh.material.wireframe = false;
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
    if (simulation.itemSelected > -1){
        switch (event.target.getMode()) {
            case "translate":
                synchronizePositions();
                break;
            case "rotate":
                synchronizeRotation();
                break;
            case "scale":
                synchronizeSize(event.target.axis);
                break;
            default:
                break;
        }
    }
});

transformControls.addEventListener("mouseUp", () => {handleTransformControlsMouse(true)});
transformControls.addEventListener("mouseDown", () => {handleTransformControlsMouse(false)});

document.getElementById("time-step-editable").addEventListener("keypress", (event) => {
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '/', '*', '%', '+', '-'].indexOf(event.key) === -1) {
        event.preventDefault();
        createNotification(notificationList.timeStepInput, true);
    }
})

document.getElementById("time-step-editable").addEventListener("blur", (event) => {
    if (event.target.value.length != 0){
        timeStepStr = event.target.value;
        changeTimeStep(eval(timeStepStr));
    }
})

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

let tempTimeout, tempGSAP = gsap.timeline();
function createNotification(notification, bool){
    if (showNotifications) {
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

document.getElementById("notification-toggle").addEventListener("click", (event) => {
    showNotifications = event.target.checked;
    localStorage.setItem("showNotifications", showNotifications);
    if (showNotifications == false){
        document.getElementById("tutorial-toggle").checked = false;
        localStorage.setItem("doTutorial", false);
        doTutorial = false;
        if (doTutorial){
            showNotifications = true;
            createNotification(notificationList.noNotifs, true);
            showNotifications = false;
        }
    }
});

initStyling();

function loadfromJson(json) {
    simulation.removeAllObjects();
    let data = json[0];
    let nValid = 0;
    if (json.hasOwnProperty('camera')){
        setCamera(json.camera.type);
        camera.position.x = json.camera.position.x;
        camera.position.y = json.camera.position.y;
        camera.position.z = json.camera.position.z;
        camera.rotation.x = json.camera.rotation.x;
        camera.rotation.y = json.camera.rotation.y;
        camera.rotation.z = json.camera.rotation.z;
        camera.zoom = json.camera.zoom;
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
    }
    if (json.hasOwnProperty('world')){
        world.gravity.x = json.world.gravity.x;
        document.getElementById("gravity-x-editable").placeholder = world.gravity.x;
        world.gravity.y = json.world.gravity.y;
        document.getElementById("gravity-y-editable").placeholder = world.gravity.y;
        world.gravity.z = json.world.gravity.z;
        document.getElementById("gravity-z-editable").placeholder = world.gravity.z;
    }
    for (let i in data){
        if (data[i].hasOwnProperty('position') && data[i].hasOwnProperty('dimensions') && data[i].hasOwnProperty('geometryType')){
            if (!isNaN(data[i].position.x) && !isNaN(data[i].position.y) && !isNaN(data[i].position.z) && ((!isNaN(data[i].dimensions.x) && !isNaN(data[i].dimensions.y) && !isNaN(data[i].dimensions.z)) || !isNaN(data[i].dimensions.radius))){
                switch (data[i].geometryType) {
                    case "SphereGeometry":
                        simulation.createSphere(data[i].position.x, data[i].position.y, data[i].position.z, data[i].dimensions.radius);
                        break;
                    case "BoxGeometry":
                        simulation.createBox(data[i].position.x, data[i].position.y, data[i].position.z, data[i].dimensions.x, data[i].dimensions.y, data[i].dimensions.z);
                        break;
                    case "CylinderGeometry":
                        simulation.createCylinder(data[i].position.x, data[i].position.y, data[i].position.z, dimensions.radius, dimensions.height);
                        break;
                }
                
                simulation.itemSelected = simulation.objects.length - 1;
                simulation.objects[simulation.itemSelected].mesh.material.wireframe = data[i].isWireframe;
                simulation.objects[simulation.itemSelected].mesh.material.color.set(`#${data[i].color}`)
                synchronizePositions();
                synchronizeRotation();
                synchronizeSize();
                if (data[i].hasOwnProperty('rotation')){
                    if (isNaN(data[i].position.x) && isNaN(data[i].position.y) && isNaN(data[i].position.z)){
                        simulation.objects[simulation.itemSelected].mesh.rotation.set(data[i].position.x, data[i].position.y, data[i].position.z);
                    }
                }
                if (data[i].hasOwnProperty('name')){
                    simulation.objects[simulation.itemSelected].mesh.name = data[i].name;
                }
                if (data[i].hasOwnProperty('angularVelocity')){
                    if (!isNaN(data[i].angularVelocity.x)){
                        simulation.objects[simulation.itemSelected].body.angularVelocity.x = data[i].angularVelocity.x;
                    }
                    if (!isNaN(data[i].angularVelocity.y)){
                        simulation.objects[simulation.itemSelected].body.angularVelocity.y = data[i].angularVelocity.y;
                    }
                    if (!isNaN(data[i].angularVelocity.z)){
                        simulation.objects[simulation.itemSelected].body.angularVelocity.z = data[i].angularVelocity.z;
                    }
                }
                if (data[i].hasOwnProperty('force')){
                    if (!isNaN(data[i].force.x)){
                        simulation.objects[simulation.itemSelected].body.force.x = data[i].force.x;
                    }
                    if (!isNaN(data[i].force.y)){
                        simulation.objects[simulation.itemSelected].body.force.y = data[i].force.y;
                    }
                    if (!isNaN(data[i].force.z)){
                        simulation.objects[simulation.itemSelected].body.force.z = data[i].force.z;
                    }
                }
                if (data[i].hasOwnProperty('mass')){
                    if (!isNaN(data[i].mass)){
                        simulation.objects[simulation.itemSelected].body.mass = data[i].mass;
                    }
                }
                simulation.objects[simulation.itemSelected].body.updateMassProperties();
                if (data[i].hasOwnProperty('velocity')){
                    if (!isNaN(data[i].velocity.x)){
                        simulation.objects[simulation.itemSelected].body.velocity.x = data[i].velocity.x;
                    }
                    if (!isNaN(data[i].velocity.y)){
                        simulation.objects[simulation.itemSelected].body.velocity.y = data[i].velocity.y;
                    }
                    if (!isNaN(data[i].velocity.z)){
                        simulation.objects[simulation.itemSelected].body.velocity.z = data[i].velocity.z;
                    }
                }
                simulation.itemSelected = -1;
                nValid++;
            }
        }
    }
    if (!Object.keys(data).length || nValid == 0){
        createNotification(notificationList.emptyFile, true);
    } else if (nValid != Object.keys(data).length){
        createNotification(notificationList.incompleteLoad, true);
    }
}

document.getElementById("json-input").onclick = function () {
    createNotification(notificationList.itemLoading, true);
}

document.getElementById("json-input").onchange = async function () {
    const fileList = this.files;
    if (fileList.length){
        if (fileList[0].name.slice(fileList[0].name.length - 5, fileList[0].name.length) === '.json'){
            let fileJson = await fileToJSON(fileList[0]);
            loadfromJson(fileJson);
        } else {
            createNotification(notificationList.invalidFileType, true);
        }
    } else {
        createNotification(notificationList.noFile, true);
    }
}


async function fileToJSON(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = event => resolve(JSON.parse(event.target.result))
        fileReader.onerror = error => reject(error)
        fileReader.readAsText(file)
    })
}

function handleTutorialToggle(bool){
    localStorage.setItem("doTutorial", bool);
    doTutorial = bool;
    if (bool && showNotifications){
        createNotification(notificationList.tutStart, true);
        document.getElementById("left-ui").onmouseenter = createNotification.bind(this, notificationList.tutLeft, false);
        document.getElementById("add-cube-button").onmouseenter = createNotification.bind(this, notificationList.tutBox, false);
        document.getElementById("add-sphere-button").onmouseenter = createNotification.bind(this, notificationList.tutSphere, false);
        document.getElementById("add-cylinder-button").onmouseenter = createNotification.bind(this, notificationList.tutCylinder, false);
        document.getElementById("top-ui").onmouseenter = createNotification.bind(this, notificationList.tutTop, false);
        document.getElementById("top-select").onmouseenter = createNotification.bind(this, notificationList.tutTranslate, false);
        document.getElementById("top-resize").onmouseenter = createNotification.bind(this, notificationList.tutScale, false);
        document.getElementById("top-rotate").onmouseenter = createNotification.bind(this, notificationList.tutRotate, false);
        document.getElementById("top-play").onmouseenter = createNotification.bind(this, notificationList.tutPlay, false);
        document.getElementById("top-replay").onmouseenter = createNotification.bind(this, notificationList.tutReset, false);
        document.getElementById("right-ui").onmouseenter = createNotification.bind(this,  notificationList.tutRight, false);
        document.getElementById("item-color-picker").onmouseenter = createNotification.bind(this, notificationList.tutColor, false);
        document.getElementById("wireframe-toggle").onmouseenter = createNotification.bind(this, notificationList.tutWireframe, false);
        document.getElementById("info-container").onmouseenter = createNotification.bind(this, notificationList.tutInfo, false);
        document.getElementById("collisionResponse-toggle").onmouseenter = createNotification(notificationList.tutCollidable, false);
        document.getElementById("mass-input").onmouseenter = createNotification(notificationList.tutMass, false);
        document.getElementById("velocity-vectors-container").onmouseenter = createNotification(notificationList.tutVectors, false);
        document.getElementById("force-vectors-container").onmouseenter = createNotification(notificationList.tutVectors, false);
        document.getElementById("velocity-vectors-container").onmouseenter = createNotification(notificationList.tutVectors, false);
        document.getElementById("right-ui-items-list").onmouseenter = createNotification(notificationList.tutItems, false);
        document.getElementById("top-replay").onmouseenter = createNotification.bind(this, notificationList.tutReset, false);
        document.getElementById("background-color-picker").onmouseenter = createNotification.bind(this, notificationList.tutBackground, false);
        document.getElementById("theme-container").onmouseenter = createNotification.bind(this, notificationList.tutTheme, false);
        document.getElementById("theme-container").onmouseenter = createNotification.bind(this, notificationList.tutTheme, false);
        document.getElementById("camera-grid-container").onmouseenter = createNotification.bind(this, notificationList.tutCameras, false);
        document.getElementById("fov-grid-container").onmouseenter = createNotification.bind(this, notificationList.tutFov, false);
        document.getElementById("time-step-container").onmouseenter = createNotification.bind(this, notificationList.tutTime, false);
        document.getElementById("grid-container").onmouseenter = createNotification.bind(this, notificationList.tutGrid, false);
        document.getElementById("fps-container").onmouseenter = createNotification.bind(this, notificationList.tutFps, false);
        document.getElementById("notifications-container").onmouseenter = createNotification.bind(this, notificationList.tutNotifs, false);
        document.getElementById("tutorial-container").onmouseenter = createNotification.bind(this, notificationList.tutCeption, false);
        document.getElementById("upload-container").onmouseenter = createNotification.bind(this, notificationList.tutUpload, false);
        document.getElementById("log").onmouseenter = createNotification.bind(this, notificationList.tutLog, false);
        document.getElementById("downloads-container").onmouseenter = createNotification.bind(this, notificationList.tutDownloads, false);
    } else if (!showNotifications && bool){
        showNotifications = true;
        createNotification(notificationList.noNotifs, true);
        showNotifications = false;
        document.getElementById("tutorial-toggle").checked = false;
        // localStorage.setItem("doTutorial", bool);
        doTutorial = bool;
    }
}

document.getElementById("tutorial-toggle").addEventListener("click", (event) => {
    handleTutorialToggle(event.target.checked);
});

localStorage.setItem("doTutorial", false);

function handleSingleVelocityToggle(){
    if (simulation.itemSelected > -1){
        toggleResultantVelocityVector(simulation.objects[simulation.itemSelected]);
    }
}

document.getElementById("velocity-vectors-single").onclick = handleSingleVelocityToggle;

function handleAllVelocityToggle(){
    if (simulation.itemSelected > -1){
        toggleComponentVelocityVectors(simulation.objects[simulation.itemSelected]);
    }
}

document.getElementById("velocity-vectors-all").onclick = handleAllVelocityToggle;

function handleSingleForceToggle(){
    if (simulation.itemSelected > -1){
        toggleResultantForceVector(simulation.objects[simulation.itemSelected]);
    }
}

document.getElementById("force-vectors-single").onclick = handleSingleForceToggle;

function handleAllForceToggle(){
    if (simulation.itemSelected > -1){
        toggleComponentForcesVectors(simulation.objects[simulation.itemSelected]);
    }
}

document.getElementById("force-vectors-all").onclick = handleAllForceToggle;

document.getElementById('email-button').addEventListener('click', () => {
    navigator.clipboard.writeText('konstantinos.prasinos@gmail.com');
    if (showNotifications){
        createNotification(notificationList.copyEmail, false);
    }
})

document.getElementById('gravity-x-editable').addEventListener('blur', (event) => {
    if (!isNaN(event.target.value) && !simulation.isRunning){
        world.gravity.x = parseFloat(event.target.value);
        localStorage.setItem("gravityX", parseFloat(event.target.value));
    } else {
        if (isNaN(event.target.value)){
            createNotification(notificationList.inputNan, true);
        } else {
            createNotification(notificationList.simulationRunning, true)
        }
        event.target.focus();
        event.target.value = '';
    }
});

document.getElementById('gravity-y-editable').addEventListener('blur', (event) => {
    if (!isNaN(event.target.value) && !simulation.isRunning){
        world.gravity.y = parseFloat(event.target.value);
        localStorage.setItem("gravityY", parseFloat(event.target.value));
    } else {
        if (isNaN(event.target.value)){
            createNotification(notificationList.inputNan, true);
        } else {
            createNotification(notificationList.simulationRunning)
        }
        event.target.focus();
        event.target.value = '';
    }
});

document.getElementById('gravity-z-editable').addEventListener('blur', (event) => {
    if (!isNaN(event.target.value) && !simulation.isRunning){
        world.gravity.z = parseFloat(event.target.value);
        localStorage.setItem("gravityZ", parseFloat(event.target.value));
    } else {
        if (isNaN(event.target.value)){
            createNotification(notificationList.inputNan, true);
        } else {
            createNotification(notificationList.simulationRunning, true)
        }
        event.target.focus();
        event.target.value = '';
    }
});

class Event {
    static eventsCreated = 0;
    constructor() {
        this.selection1;
        this.selection2;
        this.selection3;
        this.selection4;
        this.id = Event.eventsCreated;
        this.event1 = [];
        this.event2 = [];
        this.event3 = [];
        this.event4 = [];
        this.deleteButtonEvent;
        Event.eventsCreated++;
    }
}

function deleteEventListeners(event, startN){
    for (let i = startN; i < 4; i++) {
        for (let j in event[`event${i}`]){
            document.removeEventListener('click', event[`event${i}`][j])
        }
        event[`event${i}`].length = 0;
        event[`selection${i}`] = null;
    }
}

function deleteLaterSelections(parent, n, id){
    //Remember to remove their eventListeners as well.
    for (let i = 0; i < parent.children.length; i++) { 
        if (parent.children[i].nodeName == 'DIV'){
            for (let j = n+1; j < 6; j++) {
                if (parent.children[i].id == `event-field-${id}-${j}`){
                    parent.removeChild(parent.children[i]);
                    i--;
                }
            }
        }
    }

    const event = actionList.find(element => element.id == id);
    deleteEventListeners(event, n+1);
}

function createSelections(type, selections, event, parent, fieldN, textLeft, textRight) {
    let field = document.createElement('div');
    let selection, container, node1, node2, parameters, inputText;
    field.classList.add(`event-field`);
    field.setAttribute('id', `event-field-${event.id}-${fieldN}`);
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
                    inputText.setAttribute('id', `input-${event.id}-${fieldN}`);
                    inputText.classList.add('event-input-text');
                    inputText.innerHTML = 'target';
                    selection.appendChild(inputText);
                    node1 = document.createElement('div');
                    node1.classList.add('dropdown-option');

                    if (fieldN == 1){
                        node1.setAttribute('id', `target-${event.id}-${fieldN}-time`);
                        container.appendChild(node1);
                        node1.textContent = 'time';
                        let selectionTargetTime = function (e) {
                            if (e.target && e.target.id == `target-${event.id}-${fieldN}-time`) {
                                document.getElementById(`input-${event.id}-${fieldN}`).innerHTML = 'time';
                                event[`selection${fieldN}`] = 'time';
                                deleteLaterSelections(parent, fieldN, event.id);
                                createSelections('text', 'seconds', event, parent, fieldN+1, ' is ', ' s');
                            }
                        }
                        event[`event${fieldN}`].push(selectionTargetTime);
                        document.addEventListener('click', selectionTargetTime);
                    } else {
                        node1.setAttribute('id', `target-${event.id}-${fieldN}-anything`);
                        container.appendChild(node1);
                        node1.textContent = 'anything';
                        let selectionTargetAnything = function(e) {
                            if (e.target && e.target.id == `target-${event.id}-${fieldN}-anything`){
                                document.getElementById(`input-${event.id}-${fieldN}`).innerHTML = 'anything';
                                event[`selection${fieldN}`] = 'anything';
                                deleteLaterSelections(parent, fieldN, event.id);
                                createSelections('dropdown', 'eventType', event, parent, fieldN+1, ' then ', '');
                            }
                        }

                        event[`event${fieldN}`].push(selectionTargetAnything);

                        document.addEventListener('click', selectionTargetAnything);
                    }
        
                    simulation.objects.forEach(object => {
                        if (fieldN == 1 || event.selection1 != object.mesh.uuid){
                            node2 = document.createElement('div');
                            node2.innerText = object.mesh.name;
                            node2.classList.add('dropdown-option');
                            node2.setAttribute('id', `target-${event.id}-${fieldN}-${object.mesh.uuid}`);

                            let selectionTargetObject = function(e) {
                                if (e.target && e.target.id == `target-${event.id}-${fieldN}-${object.mesh.uuid}`){
                                    document.getElementById(`input-${event.id}-${fieldN}`).innerHTML = object.mesh.name;
                                    event[`selection${fieldN}`] = object.mesh.uuid;
                                    deleteLaterSelections(parent, fieldN, event.id);
                                    if (fieldN == 1){
                                        createSelections('dropdown', 'parameters', event, parent, fieldN+1, '', '');
                                    } else {
                                        createSelections('dropdown', 'eventType', event, parent, fieldN+1, ' then ', '');
                                    }
                                }
                            }

                            event[`event${fieldN}`].push(selectionTargetObject);
            
                            document.addEventListener('click', selectionTargetObject);
            
                            container.appendChild(node2);
                        }
                    });
                    break;
                case 'parameters':
                    parameters = ['collides', 'position x', 'position y', 'position z', 'rotation x', 'rotation y', 'rotation z', 'velocity x', 'velocity y', 'velocity z', 'angularVelocity x', 'angularVelocity y', 'angularVelocity z'];
                    
                    inputText.setAttribute('id', `input-${event.id}-${fieldN}`);
                    inputText.classList.add('event-input-text');
                    inputText.innerHTML = 'parameter';
                    selection.appendChild(inputText);
                    
                    parameters.forEach(parameter => {
                        node1 = document.createElement('div');
                        node1.innerText = parameter;
                        node1.classList.add('dropdown-option');
                        node1.setAttribute('id', `target-${event.id}-${fieldN}-${parameter.replace(' ', '.')}`);

                        let selectionParameters = function (e) {
                            if (e.target && e.target.id == `target-${event.id}-${fieldN}-${parameter.replace(' ', '.')}`){
                                if (parameter == 'collides'){
                                    document.getElementById(`input-${event.id}-${fieldN}`).innerHTML = parameter;
                                    deleteLaterSelections(parent, fieldN, event.id);
                                    createSelections('dropdown', 'target', event, parent, fieldN+1, ' with ', '');
                                } else {
                                    document.getElementById(`input-${event.id}-${fieldN}`).innerHTML = `'s ${parameter}`;
                                    deleteLaterSelections(parent, fieldN, event.id);
                                    createSelections('text', 'm/s', event, parent, fieldN+1, '=', '');
                                }
                                event[`selection${fieldN}`] = parameter.replace(' ', '.');
                            }
                        }

                        event[`event${fieldN}`].push(selectionParameters);

                        document.addEventListener('click', selectionParameters);
                        container.appendChild(node1);
                    })

                    break;
                case 'eventType':
                    parameters = ['print', 'pause', 'both'];

                    inputText.setAttribute('id', `input-${event.id}-${fieldN}`);
                    inputText.classList.add('event-input-text');
                    inputText.innerHTML = 'action';
                    selection.appendChild(inputText);
                    
                    parameters.forEach(parameter => {
                        node1 = document.createElement('div');
                        node1.classList.add('dropdown-option');
                        node1.innerText = parameter;
                        node1.setAttribute('id', `target-${event.id}-${fieldN}-${parameter}`);

                        let selectionEventType = function(e) {
                            if (e.target && e.target.id == `target-${event.id}-${fieldN}-${parameter}`){
                                document.getElementById(`input-${event.id}-${fieldN}`).innerHTML = parameter;
                                event[`selection${fieldN}`] = parameter;
                            }
                        }

                        event[`event${fieldN}`].push(selectionEventType);

                        document.addEventListener('click', selectionEventType);
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
            selection.setAttribute('id', `input-${event.id}-${fieldN}`)

            let selectionText = function (e) {
                if (e.target && e.target.id == `input-${event.id}-${fieldN}`){
                    document.getElementById(`input-${event.id}-${fieldN}`).addEventListener('blur', function (e) {
                        if (parseInt(e.target.value).length == 0) {
                            event[`selection${fieldN}`] = 0;
                            createNotification(notificationList.inputEmpty, false);
                        } 
                        // else if (!isNaN(event.target.value)){
                        //    event.target.value = '';
                        //    event[`selection${fieldN}`] = 0;
                        //    createNotification(notificationList.inputNan, false);
                        // } 
                        else {
                            event[`selection${fieldN}`] = parseInt(e.target.value);
                            deleteLaterSelections(parent, fieldN, event.id);
                            createSelections('dropdown', 'eventType', event, parent, fieldN+1, ' then ', '');
                        }
                    })
                }
            }
            
            event[`event${fieldN}`].push(selectionText);

            document.addEventListener('click', selectionText);
            field.appendChild(selection);
            break;
    }
    field.innerHTML += textRight;
    parent.appendChild(field);
}

function addDeleteEventButton(parent, event){
    let button = document.createElement('input');
    button.type = 'button';
    button.classList.add('icon-buttons');
    button.classList.add('small-icon-buttons');
    button.classList.add('item-list-field-delete-button');
    button.classList.add('event-delete-button');
    button.setAttribute('id', `delete-button-${event.id}`);
    parent.appendChild(button);

    let deleteEvent = function(e) {
        if (e.target && e.target.id == `delete-button-${event.id}`){
            deleteEventListeners(event, 1);
            document.getElementById('events-container').removeChild(parent);
            document.removeEventListener('click', event.deleteButtonEvent);
            actionList.splice(actionList.indexOf(event), 1);
        }
    }

    event.deleteButtonEvent = deleteEvent;

    document.addEventListener('click', deleteEvent);
}

function createEventField(){
    let event = new Event();
    actionList.push(event);

    let node = document.createElement('div');
    node.classList.add('event-node');
    node.setAttribute('id', `event-node-${event.id}`);
    addDeleteEventButton(node, event);
    node.innerHTML += 'When';

    createSelections('dropdown', 'target', event, node, 1, '', '');
    document.getElementById('events-container').appendChild(node);
}

document.getElementById('add-event').onclick = createEventField;