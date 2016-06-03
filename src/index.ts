import * as WebVR from './WebVR'
import * as THREE from 'three'

if(!WebVR.isLatestAvailable()) {
  document.body.appendChild(WebVR.getMessage())
}

let camera : THREE.PerspectiveCamera
let raycaster : THREE.Raycaster
let effect : THREE.VREffect
let controls : THREE.VRControls
let room : THREE.Mesh

let isMouseDown = false

let INTERSECTED : THREE.Object3D & { material?: any; currentHex?: number }

let renderer : THREE.WebGLRenderer
let scene : THREE.Scene

let renderer2 : THREE.CSS3DRenderer
let scene2 : THREE.Scene

init()
animate()

function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 )
  scene.add( camera )
  const crosshair = new THREE.Mesh(
    new THREE.RingGeometry( 0.02, 0.04, 32 ),
    new THREE.MeshBasicMaterial( {
      color: 0xffffff,
      opacity: 0.5,
      transparent: true
    } )
  )
  crosshair.position.z = - 2
  camera.add( crosshair )
  room = new THREE.Mesh(
    new THREE.BoxGeometry( 6, 6, 6, 10, 10, 10 ),
    new THREE.MeshBasicMaterial( { color: 0x202020, wireframe: true } )
  )
  scene.add( room )
  scene.add( new THREE.HemisphereLight( 0x404020, 0x202040, 0.5 ) )
  var light = new THREE.DirectionalLight( 0xffffff )
  light.position.set( 1, 1, 1 ).normalize()
  scene.add( light )
  var geometry = new THREE.BoxGeometry( 0.15, 0.15, 0.15 )
  for ( var i = 0; i < 200; i ++ ) {
    const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) )
    object.position.x = Math.random() * 4 - 2
    object.position.y = Math.random() * 4 - 2
    object.position.z = Math.random() * 4 - 2
    object.rotation.x = Math.random() * 2 * Math.PI
    object.rotation.y = Math.random() * 2 * Math.PI
    object.rotation.z = Math.random() * 2 * Math.PI
    object.scale.x = Math.random() + 0.5
    object.scale.y = Math.random() + 0.5
    object.scale.z = Math.random() + 0.5
    object.userData.velocity = new THREE.Vector3()
    object.userData.velocity.x = Math.random() * 0.01 - 0.005
    object.userData.velocity.y = Math.random() * 0.01 - 0.005
    object.userData.velocity.z = Math.random() * 0.01 - 0.005
    room.add( object )
  }
  raycaster = new THREE.Raycaster()
  renderer = new THREE.WebGLRenderer( { antialias: true } )
  renderer2 = new THREE.CSS3DRenderer()
  renderer.setClearColor( 0x101010 )
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  renderer.sortObjects = false
  const container = document.createElement('div')
  document.body.appendChild(container)
  container.appendChild( renderer.domElement )
  controls = new THREE.VRControls( camera )
  // effect = new THREE.VREffect( renderer )
  effect = new THREE.VREffect( renderer2 )

  //CSS3D Scene
  scene2 = new THREE.Scene()

  //HTML
  const element = document.createElement('div')
  element.innerHTML = 'Plain text inside a div.'
  element.className = 'three-div'

  //CSS Object
  const div = new THREE.CSS3DObject(element)
  div.position.x = 0
  div.position.y = 0
  div.position.z = -185
  div.rotation.y = 0
  // div.rotation.y = Math.PI
  scene2.add(div)

  //CSS3D Renderer
  renderer2.setSize(window.innerWidth, window.innerHeight)
  renderer2.domElement.style.position = 'absolute'
  renderer2.domElement.style.top = '0'
  document.body.appendChild(renderer2.domElement)



  if ( WebVR.isAvailable() === true ) {
    document.body.appendChild( WebVR.getButton( effect ) )
  }
  renderer.domElement.addEventListener( 'mousedown', onMouseDown, false )
  renderer.domElement.addEventListener( 'mouseup', onMouseUp, false )
  renderer.domElement.addEventListener( 'touchstart', onMouseDown, false )
  renderer.domElement.addEventListener( 'touchend', onMouseUp, false )

  window.addEventListener( 'resize', onWindowResize, false )
}
function onMouseDown() {
  isMouseDown = true
}
function onMouseUp() {
  isMouseDown = false
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  effect.setSize( window.innerWidth, window.innerHeight )
}

function animate() {
  requestAnimationFrame( animate )
  render()
}

function render() {
  if ( isMouseDown === true ) {
    var cube = room.children[ 0 ]
    room.remove( cube )
    cube.position.set( 0, 0, - 0.75 )
    cube.position.applyQuaternion( camera.quaternion )
    cube.userData.velocity.x = ( Math.random() - 0.5 ) * 0.02
    cube.userData.velocity.y = ( Math.random() - 0.5 ) * 0.02
    cube.userData.velocity.z = ( Math.random() * 0.01 - 0.05 )
    cube.userData.velocity.applyQuaternion( camera.quaternion )
    room.add( cube )
  }
  // find intersections
  raycaster.setFromCamera( { x: 0, y: 0 }, camera )
  var intersects = raycaster.intersectObjects( room.children )
  if ( intersects.length > 0 ) {
    if ( INTERSECTED != intersects[ 0 ].object ) {
      if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex )
      INTERSECTED = intersects[ 0 ].object
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex()
      INTERSECTED.material.emissive.setHex( 0xff0000 )
    }
  } else {
    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex )
    INTERSECTED = undefined
  }
  // Keep cubes inside room
  for ( var i = 0; i < room.children.length; i ++ ) {
    var cube = room.children[ i ]
    cube.userData.velocity.multiplyScalar( 0.999 )
    cube.position.add( cube.userData.velocity )
    if ( cube.position.x < - 3 || cube.position.x > 3 ) {
      cube.position.x = THREE.Math.clamp( cube.position.x, - 3, 3 )
      cube.userData.velocity.x = - cube.userData.velocity.x
    }
    if ( cube.position.y < - 3 || cube.position.y > 3 ) {
      cube.position.y = THREE.Math.clamp( cube.position.y, - 3, 3 )
      cube.userData.velocity.y = - cube.userData.velocity.y
    }
    if ( cube.position.z < - 3 || cube.position.z > 3 ) {
      cube.position.z = THREE.Math.clamp( cube.position.z, - 3, 3 )
      cube.userData.velocity.z = - cube.userData.velocity.z
    }
    cube.rotation.x += cube.userData.velocity.x * 2
    cube.rotation.y += cube.userData.velocity.y * 2
    cube.rotation.z += cube.userData.velocity.z * 2
  }
  controls.update()
  effect.render( scene2, camera )
  // effect.render( scene, camera )
  // renderer2.render(scene2, camera);
  // renderer.render(scene, camera);
}
