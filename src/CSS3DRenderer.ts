import * as THREE from 'three'

declare global {
  interface CSSStyleDeclaration {
    WebkitTransform : string
    MozTransform : string
    oTransform : string

    WebkitTransformStyle : string
    MozTransformStyle : string
    oTransformStyle : string

    WebkitPerspective : string
    MozPerspective : string
    oPerspective : string
  }
}

declare module 'three' {
  interface PerspectiveCamera extends Camera {
    getEffectiveFOV() : number
  }
}

const epsilon = (value : number) : number => Math.abs(value) < Number.EPSILON ? 0 : value

export class CSSObject3D extends THREE.Object3D {
  element : HTMLElement
  constructor(element : HTMLElement) {
    super()
    this.element = element
    this.element.style.position = 'absolute'

    this.addEventListener('removed', () => {
      if(this.element.parentNode != undefined) {
        this.element.parentNode.removeChild(this.element)
      }
    })
  }
}

export class CSSSprite3D extends CSSObject3D {
  constructor(element : HTMLElement) {
    super(element)
  }
}

export class CSS3DRenderer {
  domElement : HTMLDivElement
  
  private matrix : THREE.Matrix4
  private cache : any
  private cameraElement : HTMLDivElement

  private width : number
  private height : number
  private widthHalf : number
  private heightHalf : number

  constructor() {
    console.log('THREE.CSS3DRenderer', THREE.REVISION)

    this.matrix = new THREE.Matrix4()

    const domElement = document.createElement('div')
    domElement.style.overflow = 'hidden'

    domElement.style.WebkitTransformStyle = 'preserve-3d'
    domElement.style.MozTransformStyle = 'preserve-3d'
    domElement.style.oTransformStyle = 'preserve-3d'
    domElement.style.transformStyle = 'preserve-3d'
    this.domElement = domElement

    const cameraElement = document.createElement( 'div' )
    cameraElement.style.WebkitTransformStyle = 'preserve-3d'
    cameraElement.style.MozTransformStyle = 'preserve-3d'
    cameraElement.style.oTransformStyle = 'preserve-3d'
    cameraElement.style.transformStyle = 'preserve-3d'
    domElement.appendChild(cameraElement)
    this.cameraElement = cameraElement
  }

  getSize = () => ({
    width: this.width,
    height: this.height
  })

  setSize(width : number, height : number) : void {
    this.width = width
    this.height = height

    this.widthHalf = this.width / 2
    this.heightHalf = this.height / 2

    this.domElement.style.width = width + 'px'
    this.domElement.style.height = height + 'px'

    this.cameraElement.style.width = width + 'px'
    this.cameraElement.style.height = height + 'px'
  }

  static getCameraCSSMatrix(matrix : THREE.Matrix4) : string {
    const elements = matrix.elements
    return 'matrix3d(' +
      epsilon( elements[0]) + ',' +
      epsilon(-elements[1]) + ',' +
      epsilon( elements[2]) + ',' +
      epsilon( elements[3]) + ',' +
      epsilon( elements[4]) + ',' +
      epsilon(-elements[5]) + ',' +
      epsilon( elements[6]) + ',' +
      epsilon( elements[7]) + ',' +
      epsilon( elements[8]) + ',' +
      epsilon(-elements[9]) + ',' +
      epsilon( elements[10]) + ',' +
      epsilon( elements[11]) + ',' +
      epsilon( elements[12]) + ',' +
      epsilon(-elements[13]) + ',' +
      epsilon( elements[14]) + ',' +
      epsilon( elements[15]) +
    ')'
  }

  static getObjectCSSMatrix(matrix : THREE.Matrix4) : string {
    const elements = matrix.elements

    return 'translate3d(-50%,-50%,0) matrix3d(' +
      epsilon( elements[0]) + ',' +
      epsilon( elements[1]) + ',' +
      epsilon( elements[2]) + ',' +
      epsilon( elements[3]) + ',' +
      epsilon(-elements[4]) + ',' +
      epsilon(-elements[5]) + ',' +
      epsilon(-elements[6]) + ',' +
      epsilon(-elements[7]) + ',' +
      epsilon( elements[8]) + ',' +
      epsilon( elements[9]) + ',' +
      epsilon( elements[10]) + ',' +
      epsilon( elements[11]) + ',' +
      epsilon( elements[12]) + ',' +
      epsilon( elements[13]) + ',' +
      epsilon( elements[14]) + ',' +
      epsilon( elements[15]) +
    ')'
  }

  renderObject(object : THREE.Object3D, camera : THREE.Camera) : void {
    if(object instanceof CSSObject3D) {

      let style : string

      if(object instanceof CSSSprite3D ) {
        // http://swiftcoder.wordpress.com/2008/11/25/constructing-a-billboard-matrix/

        const matrix = this.matrix

        matrix.copy(camera.matrixWorldInverse)
        matrix.transpose()
        matrix.copyPosition(object.matrixWorld)
        matrix.scale(object.scale)

        matrix.elements[3] = 0
        matrix.elements[7] = 0
        matrix.elements[11] = 0
        matrix.elements[15] = 1

        style = CSS3DRenderer.getObjectCSSMatrix(matrix)
      }
      else {
        style = CSS3DRenderer.getObjectCSSMatrix(object.matrixWorld)
      }

      const element = object.element
      const cachedStyle = this.cache.objects[object.id]

      if(cachedStyle === undefined || cachedStyle !== style) {
        element.style.WebkitTransform = style
        element.style.MozTransform = style
        element.style.oTransform = style
        element.style.transform = style

        this.cache.objects[object.id] = style
      }

      if(element.parentNode !== this.cameraElement) {
        this.cameraElement.appendChild(element)
      }
    }

    for(let c of object.children) {
      this.renderObject(c, camera)
    }
  }

  render(scene : THREE.Object3D, camera : THREE.PerspectiveCamera) : void {

    const fov = 0.5 / Math.tan(THREE.Math.degToRad(camera.getEffectiveFOV() * 0.5)) * this.height

    if(this.cache.camera.fov !== fov) {

      this.domElement.style.WebkitPerspective = fov + 'px'
      this.domElement.style.MozPerspective = fov + 'px'
      this.domElement.style.oPerspective = fov + 'px'
      this.domElement.style.perspective = fov + 'px'

      this.cache.camera.fov = fov
    }

    scene.updateMatrixWorld(false)

    if(camera.parent == undefined) {
      camera.updateMatrixWorld(false)
    }

    camera.matrixWorldInverse.getInverse(camera.matrixWorld)

    const style = 'translate3d(0,0,' + fov + 'px)' + CSS3DRenderer.getCameraCSSMatrix(camera.matrixWorldInverse) +
      ' translate3d(' + this.widthHalf + 'px,' + this.heightHalf + 'px, 0)'

    if(this.cache.camera.style !== style) {

      this.cameraElement.style.WebkitTransform = style
      this.cameraElement.style.MozTransform = style
      this.cameraElement.style.oTransform = style
      this.cameraElement.style.transform = style

      this.cache.camera.style = style
    }

    this.renderObject(scene, camera)
  }
}
