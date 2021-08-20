<template>
  <q-page>
    <q-page-sticky position="top-left" :offset="[16, 16]">
      <div class="row items-center bjs-link">
        <q-img
          src="bjs-logo.png"
          spinner-color="white"
          style="height: 64px; width: 64px"
          :class="`col ${isLoading ? '' : 'animated'} flip bjs-logo bjs-link`"
          @click="gotoBabylonSite"
        />
        <div class="text-h6 text-white bjs-link" @click="gotoBabylonSite">Powered by BabylonJS</div>
      </div>
    </q-page-sticky>
    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <q-page-sticky v-if="isLoading" position="bottom-left" :offset="[16, 16]">
        <div class="text-h6 text-white q-pa-md">
          Loading, please wait...
        </div>
      </q-page-sticky>
    </transition>
    <transition enter-active-class="animated slideInUp" leave-active-class="animated slideOutDown">
      <q-page-sticky v-if="!isLoading" position="bottom-left" :offset="[16, 16]">
        <q-btn fab flat icon="fullscreen" color="white" @click="toggleFullScreen" class="on-right" />
        <q-btn fab flat label="Default Camera " style="color:rgb(187,70,75)" @click="setCamera0" class="on-right" />
        <q-btn fab flat label="Camera 1" color="grey-5" @click="setCamera1" class="on-right" />
        <q-btn fab flat label="Camera 2" color="grey-5" @click="setCamera2" class="on-right" />
        <q-btn fab flat label="Camera 3" color="grey-5" @click="setCamera3" class="on-right" />
        <q-btn fab flat icon="pest_control" color="black" @click="showDebug" class="on-right" />
      </q-page-sticky>
    </transition>
    <q-page-sticky position="bottom-right" :offset="[16, 16]">
      <div class="text-caption text-grey-7">
        Created by Roland Csibrei, 2021. Dedicated to my family.
        <br />
        3D model from https://free3d.com/3d-model/the-crowned-ring-407380.html
      </div>
    </q-page-sticky>
    <canvas ref="bjsCanvas" width="1920" height="1080" />
  </q-page>
</template>

<script lang="ts">
import { Engine } from '@babylonjs/core'
import { defineComponent, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { RingScene } from 'src/scenes/RingScene'

export default defineComponent({
  name: 'PageIndex',
  setup(_, { root }) {
    const $q = root.$q
    const bjsCanvas = ref<HTMLCanvasElement | null>(null)
    const isLoading = ref(true)
    let engine: Engine

    let scene: RingScene

    onMounted(async () => {
      if (bjsCanvas?.value) {
        scene = new RingScene(bjsCanvas.value)
        engine = scene.getEngine()
        await scene.initScene()
        scene.startScene()
        isLoading.value = false

        window.addEventListener('resize', onWindowResize)
      }
    })

    onUnmounted(() => {
      cleanup()
    })

    const cleanup = () => {
      window.removeEventListener('resize', onWindowResize)
    }

    const gotoBabylonSite = () => {
      window.open('https://www.babylonjs.com', '_blank')
    }
    const setCamera0 = () => {
      scene.setCamera0()
    }
    const setCamera1 = () => {
      scene.setCamera1()
    }
    const setCamera2 = () => {
      scene.setCamera2()
    }
    const setCamera3 = () => {
      scene.setCamera3()
    }

    const toggleFullScreen = async () => {
      if ($q.fullscreen.isCapable) {
        await $q.fullscreen.toggle()
      }
    }

    const onWindowResize = () => {
      engine.resize()
    }

    const showDebug = async () => {
      await scene?.showDebug()
    }

    return {
      gotoBabylonSite,
      bjsCanvas,
      toggleFullScreen,
      setCamera0,
      setCamera1,
      setCamera2,
      setCamera3,
      isLoading,
      showDebug
    }
  }
})
</script>

<style lang="sass" scoped>
.canvas
  width: 100%
  height: 100%
.bjs-link
  cursor: pointer
.bjs-logo
  --animate-duration: 1.2s
  animation-delay: 3s
</style>
