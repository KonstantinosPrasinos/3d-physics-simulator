import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import {PointerLockControls} from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/PointerLockControls.js';

class FlyControls {
    constructor(camera, domElement, scene, transformControls) {
        this.pointerLock = new PointerLockControls(camera, domElement);
        this.camera = camera;
        this.domElement = domElement;
        this.movingSpeed = 1;
        this.mouseSensitivity = 1;

        this.movingForward = false;
        this.movingBack = false;
        this.movingLeft = false;
        this.movingRight = false;
        this.movingUp = false;
        this.movingDown = false;

        this.canLockOn = false;
        this.isSelecting = false;

        let inTimeOut = false;

        let scope = this;
        let cameraDirection = new THREE.Vector3();

        let transformWasEnabled = false;

        function handleKeyDown(event){
            if (scope.pointerLock.isLocked){
                switch (event.key) {
                    case 'w':
                        scope.movingForward = true;
                        break;
                    case 's':
                        scope.movingBack = true;
                        break;
                    case 'a':
                        scope.movingLeft = true;
                        break;
                    case 'd':
                        scope.movingRight = true;
                        break;
                    case ' ':
                        scope.movingUp = true;
                        break;
                    case 'c':
                        scope.movingDown = true;
                        break;
                    default:
                        break;
                }
            }
        }

        function handleKeyUp(event){
            if (scope.pointerLock.isLocked){
                switch (event.key) {
                    case 'w':
                        scope.movingForward = false;
                        break;
                    case 's':
                        scope.movingBack = false;
                        break;
                    case 'a':
                        scope.movingLeft = false;
                        break;
                    case 'd':
                        scope.movingRight = false;
                        break;
                    case ' ':
                        scope.movingUp = false;
                        break;
                    case 'c':
                        scope.movingDown = false;
                        break;
                    default:
                        break;
                }
            }
        }

        function handleWheel(event){
            if (scope.pointerLock.isLocked){
                if (event.deltaY < 0){
                    scope.movingSpeed += 0.1;
                } else if (event.deltaY > 0 && scope.movingSpeed > 0.2){
                    scope.movingSpeed -= 0.1;
                }
            }
        }

        function test(){
            
        }

        this.init = function(){
            scope.domElement.addEventListener('click', function (event) {
                if (scope.canLockOn && !transformControls.enabled){
                    if (navigator.userAgent.match(/chrome|chromium|crios/i)){
                        if (!inTimeOut){
                            scope.pointerLock.lock();
                        }
                    } else {
                        scope.pointerLock.lock();
                    }
                }
            }, false);
            scene.add(scope.pointerLock.getObject());
            scope.domElement.ownerDocument.addEventListener('keydown', handleKeyDown);
            scope.domElement.ownerDocument.addEventListener('keyup', handleKeyUp);
            scope.domElement.ownerDocument.addEventListener('wheel', handleWheel);
            scope.pointerLock.addEventListener('unlock', () => {
                //This if statement is used to tackle an issue with chrome not allowing a pointer lock within 1.25s of exiting another
                if (navigator.userAgent.match(/chrome|chromium|crios/i)){
                    inTimeOut = true;
                    setTimeout(() => {inTimeOut = false}, 1250);
                }
                scope.movingForward = false;
                scope.movingBack = false;
                scope.movingLeft = false;
                scope.movingRight = false;
                scope.movingUp = false;
                scope.movingDown = false;
            });
        }

        this.move = function(){
            scope.camera.getWorldDirection(cameraDirection);
            let rotatedVector = new THREE.Vector3(cameraDirection.z, cameraDirection.x, cameraDirection.y);
            let doubleRotated = new THREE.Vector3(cameraDirection.x, cameraDirection.z, cameraDirection.y);
            if (scope.movingForward){
                this.pointerLock.moveForward(scope.movingSpeed);
            }

            if (scope.movingBack){
                this.pointerLock.moveForward(-scope.movingSpeed);
            }

            if (scope.movingLeft){
                this.pointerLock.moveRight(-scope.movingSpeed);
            }

            if (scope.movingRight){
                this.pointerLock.moveRight(scope.movingSpeed);
            }

            if (scope.movingUp){
                scope.camera.position.sub(doubleRotated.multiplyScalar(scope.movingSpeed));
            }

            if (scope.movingDown){
                scope.camera.position.add(doubleRotated.multiplyScalar(scope.movingSpeed));
            }
        }

        this.setMouseSensitivity = function(sensitivity) {
            scope.mouseSensitivity = sensitivity;
        }

        this.setMovingSpeed = function(movingSpeed){
            scope.movingSpeed = movingSpeed;
        }

        this.setCamera = function(camera){
            scope.camera = camera;
        }

        this.init();
    }
}
export {FlyControls}