import * as THREE from 'three'

export class VRControls {
  scale = 1

  private object : THREE.Object3D

  // the Rift SDK returns the position in meters
  // this scale factor allows the user to define how meters
  // are converted to scene units.

  // If true will use "standing space" coordinate system where y=0 is the
  // floor and x=0, z=0 is the center of the room.
  private standing = false
  private standingMatrix = new THREE.Matrix4()

  // Distance from the users eyes to the floor in meters. Used when
  // standing=true but the VRDisplay doesn't provide stageParameters.
  private userHeight = 1.6

  private vrInput : VRDisplay

  constructor(object : THREE.Object3D, onError : ErrorEventHandler) {
    this.object = object

    if(navigator.getVRDisplays) {
      navigator.getVRDisplays().then(devices => {
        for(const d of devices) {
          if('VRDisplay' in window && d instanceof VRDisplay) {
            this.vrInput = d
            break
          }
        }

        if(this.vrInput == undefined) {
          if(onError) {
            onError('VR input not available')
          }
        }
      })
    }
  }

  update() : void {

    if(this.vrInput) {

      const pose = this.vrInput.getPose()

      if(pose.orientation != undefined) {
        this.object.quaternion.fromArray([].slice.call(pose.orientation))
      }

      if(pose.position != undefined) {
        this.object.position.fromArray([].slice.call(pose.position))
      }
      else {
        this.object.position.set(0, 0, 0)
      }

      if(this.standing) {

        if(this.vrInput.stageParameters) {
          this.object.updateMatrix()

          this.standingMatrix.fromArray([].slice.call(this.vrInput.stageParameters.sittingToStandingTransform))
          this.object.applyMatrix(this.standingMatrix)

        }
        else {
          this.object.position.setY(this.object.position.y + this.userHeight)
        }
      }

      this.object.position.multiplyScalar(this.scale)
    }
  }

  resetPose() : void {
    if(this.vrInput) {
      this.vrInput.resetPose()
    }
  }

  dispose() : void {
    this.vrInput = undefined
  }
}
