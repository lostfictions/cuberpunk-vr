import * as THREE from 'three'
import { CSS3DRenderer } from './CSS3DRenderer'

export class CSS3DVREffect {
  scale = 1

  private vrDisplay : VRDisplay
  private renderer : CSS3DRenderer
  private onError : ErrorEventHandler
  private isPresenting = false

  private eyeTranslationL : THREE.Vector3
  private eyeTranslationR : THREE.Vector3

  private domElement : HTMLDivElement
  private requestFullscreen : string
  private exitFullscreen : string
  private fullscreenElement : string

  constructor(renderer : CSS3DRenderer, onError : ErrorEventHandler) {
    this.renderer = renderer
    this.onError = onError

    this.eyeTranslationL = new THREE.Vector3()
    this.eyeTranslationR = new THREE.Vector3()

    this.domElement = renderer.domElement

    if(navigator.getVRDisplays) {
      navigator.getVRDisplays().then(this.gotVRDevices)
    }

    // Handle fullscreen
    if(this.domElement.requestFullscreen) {
      this.requestFullscreen = 'requestFullscreen'
      this.fullscreenElement = 'fullscreenElement'
      this.exitFullscreen = 'exitFullscreen'
      document.addEventListener('fullscreenchange', this.onFullscreenChange, false)
    }
    else if(this.domElement.webkitRequestFullscreen) {
      this.requestFullscreen = 'webkitRequestFullscreen'
      this.fullscreenElement = 'webkitFullscreenElement'
      this.exitFullscreen = 'webkitExitFullscreen'
      document.addEventListener('webkitfullscreenchange', this.onFullscreenChange, false)
    }
    else {
      throw new Error(`Cannot request fullscreen on renderer DOM element '${this.domElement}'!`)
    }
    window.addEventListener('vrdisplaypresentchange', this.onFullscreenChange, false)

    this.cameraL = new THREE.PerspectiveCamera()
    this.cameraL.layers.enable(1)
    this.cameraR = new THREE.PerspectiveCamera()
    this.cameraR.layers.enable(2)
  }

  setSize(width : number, height : number) : void {

    if(this.isPresenting) {
      const eyeParamsL = this.vrDisplay.getEyeParameters('left')
      this.renderer.setSize(eyeParamsL.renderWidth * 2, eyeParamsL.renderHeight)
    }
    else {
      this.renderer.setSize(width, height)
    }

  };

  private gotVRDevices(devices : VRDisplay[]) : void {
    for(const d of devices) {
      if('VRDisplay' in window && d instanceof VRDisplay) {
        this.vrDisplay = d
        break
      }
    }

    if(this.vrDisplay == undefined) {
      if(this.onError) {
        this.onError('HMD not available')
      }
    }
  }



  private onFullscreenChange() : void {

    const wasPresenting = this.isPresenting
    this.isPresenting = this.vrDisplay != undefined && this.vrDisplay.isPresenting

    if(wasPresenting === this.isPresenting) {
      return
    }

    if(this.isPresenting) {
      const eyeParamsL = this.vrDisplay.getEyeParameters('left')
      const eyeWidth = eyeParamsL.renderWidth
      const eyeHeight = eyeParamsL.renderHeight

      this.renderer.setSize(eyeWidth * 2, eyeHeight)
    }
    else {
      const rendererSize = this.renderer.getSize()
      this.renderer.setSize(rendererSize.width, rendererSize.height)
    }
  }

  setFullScreen(fullscreen : boolean) : Promise<void> {

    return new Promise<void>((resolve, reject) => {

      if(this.vrDisplay == undefined) {
        reject(new Error( 'No VR hardware found.'))
        return
      }

      if(this.isPresenting === fullscreen) {
        resolve()
        return
      }

      if(fullscreen) {
        const canvas : any = this.domElement // HACK
        resolve(this.vrDisplay.requestPresent([ { source: canvas } ] ))
      }
      else {
        resolve(this.vrDisplay.exitPresent())
      }
    })
  }

  requestPresent() : Promise<void> {
    return this.setFullScreen(true)
  }

  exitPresent() : Promise<void> {
    return this.setFullScreen(false)
  }

  private cameraL : THREE.PerspectiveCamera
  private cameraR : THREE.PerspectiveCamera

  render(scene : THREE.Scene, camera : THREE.PerspectiveCamera) : void {
    if(this.vrDisplay && this.isPresenting) {
      const sceneIsAutoUpdate = scene.autoUpdate

      if(sceneIsAutoUpdate) {
        scene.updateMatrixWorld(false)
        scene.autoUpdate = false
      }

      const eyeParamsL = this.vrDisplay.getEyeParameters('left')
      const eyeParamsR = this.vrDisplay.getEyeParameters('right')

      this.eyeTranslationL.fromArray([].slice.call(eyeParamsL.offset))
      this.eyeTranslationR.fromArray([].slice.call(eyeParamsR.offset))

      if(camera.parent == undefined) {
        camera.updateMatrixWorld(false)
      }

      const zNear = camera.near || 0.01
      const zFar = camera.far || 10000.0

      this.cameraL.projectionMatrix = fovToProjection(eyeParamsL.fieldOfView, true, zNear, zFar)
      this.cameraR.projectionMatrix = fovToProjection(eyeParamsR.fieldOfView, true, zNear, zFar)

      camera.matrixWorld.decompose(this.cameraL.position, this.cameraL.quaternion, this.cameraL.scale)
      camera.matrixWorld.decompose(this.cameraR.position, this.cameraR.quaternion, this.cameraR.scale)

      this.cameraL.translateOnAxis(this.eyeTranslationL, this.scale)
      this.cameraR.translateOnAxis(this.eyeTranslationR, this.scale)

      // When rendering we don't care what the recommended size is, only what the actual size
      // of the backbuffer is.
      // const size = this.renderer.getSize()
      // const renderRectL = { x: 0, y: 0, width: size.width / 2, height: size.height }
      // const renderRectR = { x: size.width / 2, y: 0, width: size.width / 2, height: size.height }

      // render left eye
      // this.renderer.setViewport(renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height)
      // this.renderer.setScissor(renderRectL.x, renderRectL.y, renderRectL.width, renderRectL.height)
      this.renderer.render(scene, this.cameraL)

      // render right eye
      // this.renderer.setViewport(renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height)
      // this.renderer.setScissor(renderRectR.x, renderRectR.y, renderRectR.width, renderRectR.height)
      this.renderer.render(scene, this.cameraR)

      // this.renderer.setScissorTest(false)

      if(sceneIsAutoUpdate) {
        scene.autoUpdate = true
      }

      this.vrDisplay.submitFrame()

      return
    }

    // Regular render mode if not HMD
    this.renderer.render(scene, camera)
  }
}

type fovPort = {
  upTan : number
  downTan : number
  leftTan : number
  rightTan : number
}

function fovToProjection(fov : VRFieldOfView, rightHanded : boolean, zNear : number, zFar : number) : THREE.Matrix4 {
  const DEG2RAD = Math.PI / 180.0

  const fovPort = {
    upTan: Math.tan( fov.upDegrees * DEG2RAD ),
    downTan: Math.tan( fov.downDegrees * DEG2RAD ),
    leftTan: Math.tan( fov.leftDegrees * DEG2RAD ),
    rightTan: Math.tan( fov.rightDegrees * DEG2RAD )
  }

  return fovPortToProjection(fovPort, rightHanded, zNear, zFar)
}

function fovPortToProjection(fov : fovPort, rightHanded : boolean, zNear : number, zFar : number) : THREE.Matrix4 {
  const handednessScale = rightHanded ? -1.0 : 1.0

  // start with an identity matrix
  const mobj = new THREE.Matrix4()
  const m = mobj.elements

  // and with scale/offset info for normalized device coords
  const scaleAndOffset = fovToNDCScaleOffset(fov)

  // X result, map clip edges to [-w,+w]
  m[0 * 4 + 0] = scaleAndOffset.scale[0]
  m[0 * 4 + 1] = 0.0
  m[0 * 4 + 2] = scaleAndOffset.offset[0] * handednessScale
  m[0 * 4 + 3] = 0.0

  // Y result, map clip edges to [-w,+w]
  // Y offset is negated because this proj matrix transforms from world coords with Y=up,
  // but the NDC scaling has Y=down (thanks D3D?)
  m[1 * 4 + 0] = 0.0
  m[1 * 4 + 1] = scaleAndOffset.scale[1]
  m[1 * 4 + 2] = - scaleAndOffset.offset[1] * handednessScale
  m[1 * 4 + 3] = 0.0

  // Z result (up to the app)
  m[2 * 4 + 0] = 0.0
  m[2 * 4 + 1] = 0.0
  m[2 * 4 + 2] = zFar / (zNear - zFar) * - handednessScale
  m[2 * 4 + 3] = (zFar * zNear) / (zNear - zFar)

  // W result (= Z in)
  m[3 * 4 + 0] = 0.0
  m[3 * 4 + 1] = 0.0
  m[3 * 4 + 2] = handednessScale
  m[3 * 4 + 3] = 0.0

  mobj.transpose()

  return mobj
}

function fovToNDCScaleOffset(fov : fovPort) : { scale : number[], offset : number[] } {
  const pXScale = 2.0 / ( fov.leftTan + fov.rightTan )
  const pXOffset = ( fov.leftTan - fov.rightTan ) * pXScale * 0.5

  const pYScale = 2.0 / ( fov.upTan + fov.downTan )
  const pYOffset = ( fov.upTan - fov.downTan ) * pYScale * 0.5

  return { scale: [ pXScale, pYScale ], offset: [ pXOffset, pYOffset ] }
}
