class Notification {
    constructor(type, msg) {
        this.type = type;
        this.msg = msg;
    }
}

export let notificationList = {
    inputEmpty: new Notification("Warning", "this field can't be empty."),
    inputNan: new Notification("Warning", "this field must be a number."),
    itemLoading: new Notification("Note", "the items loaded will not have the same UUID. The fields needed to load an object are: position and dimensions."),
    invalidFile: new Notification("Error", "the file you have selected is not a valid."),
    loadFileInfo: new Notification("Tutorial", "Only the contents of the fist timestamp are loaded from the file. Note: the items loaded will not have the same uuid as the ones in the file."),
    emptyFile: new Notification("Error", "the file you have inserted doesn't contain any valid objects."),
    incompleteLoad: new Notification("Warning", "not all the objects in your file were loaded successfully."),
    invalidFileType: new Notification("Error", "the file you have selected is not of type json."),
    noFile: new Notification("Error", "you didn't select any file."),
    timeStepInput: new Notification("Warning", "only numbers and numerical operators are allowed."),
    noNotifs: new Notification("Warning", "showing notifications is disabled, so the tutorial can't be started"),
    tutStart: new Notification("Tutorial", "This is the beginning of the tutorial. Hover over the different buttons and inputs to see the accompanied tutorial notification. If you want a notification to stay, you need to hover it."),
    tutLeft: new Notification("Tutorial", "On this bar you can select to add to the simulation one of the shapes featured with the corresponding buttons. On the bottom you can see the button to toggle the visibility of the settings menu."),
    tutBox: new Notification("Tutorial", "By clicking this button you are adding a box (cube) to the simulation. (Note: it is following your cursor)."),
    tutSphere: new Notification("Tutorial", "By clicking this button you are adding a sphere to the simulation. (Note: it is following your cursor)."),
    tutCylinder: new Notification("Tutorial", "By clicking this button you are adding a cylinder to the simulation. (Note: it is following your cursor)."),
    tutTop: new Notification("Tutorial", "On the top bar you can see in order: the object selection buttons, play-reset, the current mode and the current time. On the right you can see the button to toggle the visibility of the right bar"),
    tutTranslate: new Notification("Tutorial", "By selecting this you can click on an object on the canvas to bring up the position translate arrows."),
    tutScale: new Notification("Tutorial", "By selecting this you can click on an object on the canvas to bring up the scale arrows."),
    tutRotate: new Notification("Tutorial", "By selecting this you can click on an object on the canvas to bring up the rotation circles."),
    tutPlay: new Notification("Tutorial", "With this you can start the simulation. If the simulation is running this will change into a pause button."),
    tutReset: new Notification("Tutorial", "With this you can reset the simulation to the previously saved Setup state."),
    tutRight: new Notification("Tutorial", "This opens the object ui. In this you can see and edit all the information regarding an object, as well as a list of all the objects. You need to select an object to see the tutorial for the object attributes."),
    tutColor: new Notification("Tutorial", "This changes the color of the selected object."),
    tutWireframe: new Notification("Tutorial", "This changes the object from being filled in with color to having only a frame."),
    tutInfo: new Notification("Tutorial", "All these change certain attributes of the selected object (Mass has more info)."),
    tutCollidable: new Notification("Tutorial", "This changes the ability of the object selected to be collidable."),
    tutMass: new Notification("Tutorial", "This changes the mass of the object selected. If the mass of the object is 0, the object isn't affected by gravity, or collisions (objects can still collide into it though)."),
    tutVectors: new Notification("Tutorial", "These the vectors for either velocity of the object or the forces applied to it. There are three options: Off, Single - only shows the resultant vector, All - shows vectors on all three dimensions."),
    tutItems: new Notification("Tutorial", "Here you can see all the objects in the scene. When there is an object you can click either on it's name or the pencil button to rename it. By clicking the lock button, you make the object unable to be selected. By clicking the trash button, you delete the object."),
    tutSettings: new Notification("Tutorial", "These are the simulations global settings."),
    tutBackground: new Notification("Tutorial", "This changes the color of the canvas."),
    tutTheme: new Notification("Tutorial", "These change the colors of the User Interface. By selecting custom you can choose your own two colors!"),
    tutCameras: new Notification("Tutorial", "These change the type of the camera. Orthographic means there is no distortion on the sides, while perspective is more like a normal camera."),
    tutFov: new Notification("Tutorial", "This changes the field of view of the camera, if it is of type perspective."),
    tutTime: new Notification("Tutorial", "This changes the length of a unit of time. This means, it changes how much a time instant lasts."),
    tutGrid: new Notification("Tutorial", "These toggle a cartesian grid on each of the three dimensions."),
    tutFps: new Notification("Tutorial", "This toggles the rendering of the framerate the simulation is running in."),
    tutNotifs: new Notification("Tutorial", "This toggles the rendering of notifications."),
    tutCeption: new Notification("Tutorial", "This toggles the tutorial"),
    tutUpload: new Notification("Tutorial", "Using this button you can upload a json file you may have previously downloaded, to load a timestamp of all objects on the scene."),
    tutLog: new Notification("Tutorial", "Here you can print the data of all objects in the scene either manually, using the print button, or every number of timesteps, using the respective input. You can also clear the log with the clear button."),
    tutDownloads: new Notification("Tutorial", "Using these buttons you can download the log either in a txt format or in a json format. You can either download the entire log, or only the current timestamp."),
    copyEmail: new Notification("Copied to Clipboard", "konstantinos.prasinos@gmail.com")
}