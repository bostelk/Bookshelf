<template>
  <div class="flex justify-center w-full">
    <h1 class="text-2xl font-bold">Shelf</h1>
  </div>
  <div class="flex items-center justify-center h-full">
    <div ref="shelf" id="shelf" style="min-width: 300px; min-height: 300px"></div>
  </div>
</template>
<script setup lang="ts">
import * as THREE from 'three'
import { useTemplateRef, onMounted } from 'vue'

onMounted(() => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    premultipliedAlpha: false,
  })
  let shelf = useTemplateRef('shelf') // null???
  shelf = document.getElementById('shelf')
  shelf.appendChild(renderer.domElement)
  var rect = shelf.getBoundingClientRect()
  renderer.setSize(rect.width, rect.height)

  const geometry = new THREE.BoxGeometry(1, 15, 0.1)

  var images = [
    '/assets/img/spine/IMG_9608-rotated-3_crop_1.jpg',
    '/assets/img/spine/IMG_9608-rotated-3_crop_2.jpg',
    '/assets/img/spine/IMG_9608-rotated-3_crop_3.jpg',
    '/assets/img/spine/IMG_9608-rotated-3_crop_4.jpg',
    '/assets/img/spine/IMG_9608-rotated-3_crop_5.jpg',
    '/assets/img/spine/IMG_9608-rotated-3_crop_6.jpg',
  ]

  var cubes = []
  for (var i = 0; i < images.length; i++) {
    const loader = new THREE.TextureLoader()
    const texture = loader.load(images[i])
    texture.colorSpace = THREE.SRGBColorSpace

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
    })

    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(i, 0, 0)
    scene.add(cube)

    cubes.push(cube)
  }

  camera.position.x = images.length / 2
  camera.position.z = 15

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    var rect = shelf.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  window.addEventListener('pointermove', onPointerMove)

  function animate() {
    if (false) {
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera)

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children)

    for (let i = 0; i < cubes.length; i++) {
      cubes[i].material.color.set(0xffffff)
      cubes[i].rotation.set(0, 0, 0)

      let p = cubes[i].position
      cubes[i].position.set(p.x, p.y, 0)
    }

    for (let i = 0; i < intersects.length; i++) {
      intersects[i].object.material.color.set(0.8, 0.8, 0.8)
      intersects[i].object.rotation.set(Math.PI / 10, 0, 0)
      let p = intersects[i].object.position
      intersects[i].object.position.set(p.x, p.y, 2)
      //intersects[ i ].object.rotation.set(new THREE.Vector3( Math.PI / 4,0,0));
      break
    }
  }

    renderer.render(scene, camera)
  }
  renderer.setAnimationLoop(animate)
})
</script>
