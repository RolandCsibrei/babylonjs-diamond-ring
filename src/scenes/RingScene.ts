// Diamond Shader Demo, Roland Csibrei, 2021

import {
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Scene,
  SceneLoader,
  Color4,
  DirectionalLight,
  NodeMaterial,
  InputBlock,
  MeshBuilder,
  Plane,
  StandardMaterial,
  MirrorTexture,
  ShadowGenerator,
  CubeTexture,
  TransformNode,
  DefaultRenderingPipeline,
  Color3
} from '@babylonjs/core'
import '@babylonjs/loaders'
import * as GUI from '@babylonjs/gui'

import { moveCameraTo } from 'src/utils/camera'
import { BaseScene } from './BaseScene'

const BASE_URL = 'models/'
const CAMERA_Y = 1.5
const RING_Y = 2

export class RingScene extends BaseScene {
  private _shadowGenerator?: ShadowGenerator

  private _bigDiamondColor = new Color3(224 / 255, 14 / 255, 109 / 255)
  private _smallDiamondColor = new Color3(224 / 255, 14 / 255, 109 / 255)

  private _smallDiamondMaterial?: NodeMaterial
  private _bigDiamondMaterial?: NodeMaterial

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
  }

  createCamera() {
    const camera = new ArcRotateCamera('camera1', 0, 0, 15, new Vector3(0, CAMERA_Y, 0), this._scene)
    camera.attachControl(this._canvas, true)
    camera.inertia = 0.8
    camera.speed = 0.05
    camera.minZ = 0.05
    camera.maxZ = 50
    camera.lowerBetaLimit = 0
    camera.upperBetaLimit = 1.45
    camera.lowerRadiusLimit = 1.5
    camera.upperRadiusLimit = 21
    camera.angularSensibilityX = 2000
    camera.angularSensibilityY = 2000
    camera.panningSensibility = 3000
    camera.pinchDeltaPercentage = 0.2
    camera.wheelDeltaPercentage = 0.2
    camera.speed = 0.05

    this._camera = camera

    this.setCamera0()
  }

  createLight(scene: Scene) {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
    light.intensity = 4

    scene.createDefaultEnvironment({ skyboxSize: 150 })
    const hdrTexture = CubeTexture.CreateFromPrefilteredData('env/decor-shop.env', scene)
    scene.environmentTexture = hdrTexture

    const dirLightParent = new TransformNode('dirLightParent', scene)

    const dirLight = new DirectionalLight('directionalLight', new Vector3(1, -1, -1), scene)
    dirLight.intensity = 2
    dirLight.position = new Vector3(-16, 16, 16)
    dirLight.parent = dirLightParent

    const shadowGenerator = new ShadowGenerator(2048, dirLight)
    shadowGenerator.usePoissonSampling = true
    shadowGenerator.useKernelBlur = true
    shadowGenerator.blurKernel = 64
    shadowGenerator.usePercentageCloserFiltering = true
    shadowGenerator.useContactHardeningShadow = true
    shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH
    shadowGenerator.contactHardeningLightSizeUVRatio = 0.3
    this._shadowGenerator = shadowGenerator

    dirLight.shadowMinZ = 0
    dirLight.shadowMinZ = 10

    scene.clearColor = new Color4(0, 0, 0, 1)

    this._scene.onBeforeRenderObservable.add(() => {
      dirLight.setDirectionToTarget(Vector3.ZeroReadOnly)
    })
  }

  public async initScene() {
    this._scene.clearColor = new Color4(0, 0, 0, 1)
    this.createCamera()
    this.createLight(this._scene)

    const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')
    this._createColorPickers(gui)
    //

    this._enableBloom(this._scene)
    await this._createDiamondDemo(this._scene)
  }

  public setCamera0() {
    const alpha = 0.16
    const beta = 1
    const radius = 6.39
    const target = new Vector3(0, CAMERA_Y - 0.1, 0)
    this._animateCamera(alpha, beta, radius, target)
  }

  public setCamera1() {
    const alpha = -1.69
    const beta = 0.38
    const radius = 2.5
    const target = new Vector3(0, CAMERA_Y, 0.12)
    this._animateCamera(alpha, beta, radius, target)
  }

  public setCamera2() {
    const alpha = 0
    const beta = 0.08
    const radius = 3
    const target = new Vector3(0, CAMERA_Y, 0.12)
    this._animateCamera(alpha, beta, radius, target)
  }

  public setCamera3() {
    const alpha = -0.49
    const beta = 0.89
    const radius = 15
    const target = new Vector3(0, CAMERA_Y, 0)
    this._animateCamera(alpha, beta, radius, target)
  }

  private _animateCamera(alpha: number, beta: number, radius: number, target?: Vector3) {
    const arcCamera = <ArcRotateCamera>this._camera
    moveCameraTo(arcCamera, null, target, alpha, beta, radius)
  }

  private _updateDiamondColorInMaterial(material: NodeMaterial, color: Color3) {
    const baseColorBlock = <InputBlock>material.getBlockByName('baseColor')
    baseColorBlock.value = color
  }

  private _createColorPickers(gui: GUI.AdvancedDynamicTexture) {
    const panel = new GUI.StackPanel()
    panel.isVertical = true
    panel.width = '200px'
    panel.isVertical = true
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    gui.addControl(panel)

    const callbackBigDiamond = (color: Color3) => {
      if (!this._bigDiamondMaterial) {
        return
      }
      this._bigDiamondColor = color
      this._updateDiamondColorInMaterial(this._bigDiamondMaterial, color)
    }

    const callbackSmallDiamond = (color: Color3) => {
      if (!this._smallDiamondMaterial) {
        return
      }
      this._smallDiamondColor = color
      this._updateDiamondColorInMaterial(this._smallDiamondMaterial, color)
    }

    this._createColorPicker('Big Diamond', this._smallDiamondColor, panel, gui, callbackBigDiamond)
    this._createColorPicker('Small Diamonds', this._bigDiamondColor, panel, gui, callbackSmallDiamond)
  }

  private _createColorPicker(name: string, defaultColor: Color3, panel: GUI.StackPanel, gui: GUI.AdvancedDynamicTexture, callback: (color: Color3) => void) {
    const textBlock = new GUI.TextBlock()
    textBlock.text = name
    textBlock.height = '30px'
    textBlock.color = 'white'
    textBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER

    panel.addControl(textBlock)

    const picker = new GUI.ColorPicker()
    picker.value = defaultColor
    picker.height = '190px'
    picker.width = '190px'
    picker.paddingLeftInPixels = 15
    picker.paddingBottomInPixels = 30
    picker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    picker.onValueChangedObservable.add(color => {
      callback(color)
    })

    panel.addControl(picker)
  }

  private _enableBloom(scene: Scene) {
    const pipeline = new DefaultRenderingPipeline('pipeline', true, scene, scene.cameras)
    pipeline.bloomEnabled = true
    pipeline.bloomThreshold = 0.2
    pipeline.bloomWeight = 0.65
    pipeline.bloomKernel = 47
    pipeline.bloomScale = 0.5
    pipeline.imageProcessingEnabled = false
    pipeline.fxaaEnabled = true
    pipeline.samples = 4
  }

  private async _createDiamondDemo(scene: Scene) {
    const ringParent = new TransformNode('ringParent', scene)
    ringParent.rotation.y = 0.65

    this._scene.onBeforeRenderObservable.add(() => {
      ringParent.rotation.y += 0.001
    })

    const diamondRingInfo = await this._loadRing()
    const smallDiamonds = diamondRingInfo.smallDiamonds
    const bigDiamond = diamondRingInfo.bigDiamond
    const ring = diamondRingInfo.ring
    const ringPrefab = diamondRingInfo.ringPrefab
    ringPrefab.parent = ringParent
    ringPrefab.position.y = 0.2

    if (ringPrefab && smallDiamonds && bigDiamond && ring) {
      // const snippetId = 'J3ZDKQ'
      const snippetId = 'KIUSWC#63'

      //

      const matBigDiamond = await NodeMaterial.ParseFromSnippetAsync(snippetId, scene)
      matBigDiamond.backFaceCulling = false
      matBigDiamond.separateCullingPass = true

      const matSmallDiamond = matBigDiamond.clone('matSmallDiamond')

      this._smallDiamondMaterial = matSmallDiamond
      this._bigDiamondMaterial = matBigDiamond

      smallDiamonds.material = matSmallDiamond
      bigDiamond.material = matBigDiamond

      this._updateDiamondColorInMaterial(matSmallDiamond, this._smallDiamondColor)
      this._updateDiamondColorInMaterial(matBigDiamond, this._bigDiamondColor)

      //

      const ground = MeshBuilder.CreateGround('ground', { width: 300, height: 300 }, scene)

      ground.computeWorldMatrix(true)
      const groundWorldMatrix = ground.getWorldMatrix()

      const groundVertexData = ground.getVerticesData('normal')
      const mirrorMaterial = new StandardMaterial('mirror', scene)
      const reflectionTexture = new MirrorTexture('mirror', 2048, scene, true)
      const reflectionTextureRenderList = reflectionTexture.renderList ?? []
      if (groundVertexData) {
        const groundNormal = Vector3.TransformNormal(new Vector3(groundVertexData[0], groundVertexData[1], groundVertexData[2]), groundWorldMatrix)

        const reflector = Plane.FromPositionAndNormal(ground.position, groundNormal.scale(-1))
        mirrorMaterial.reflectionTexture = reflectionTexture
        reflectionTexture.adaptiveBlurKernel = 16
        reflectionTexture.mirrorPlane = reflector

        reflectionTextureRenderList.push(smallDiamonds)
        reflectionTextureRenderList.push(bigDiamond)
        reflectionTextureRenderList.push(ring)

        const shadowMap = this._shadowGenerator?.getShadowMap()
        if (shadowMap) {
          shadowMap.renderList?.push(ring)
          shadowMap.renderList?.push(smallDiamonds)
          shadowMap.renderList?.push(bigDiamond)
        }

        mirrorMaterial.reflectionTexture.level = 1
        mirrorMaterial.disableLighting = true
        mirrorMaterial.alpha = 0.12
        ground.material = mirrorMaterial

        ground.receiveShadows = true
      }
    }
  }

  private async _loadRing() {
    const loaded = await SceneLoader.ImportMeshAsync('', BASE_URL, 'the_crowned_ring-roli.glb', this._scene)
    const ringPrefab = loaded.meshes[0]
    const smallDiamonds = loaded.meshes.find(m => m.name === 'Small Diamonds')
    const bigDiamond = loaded.meshes.find(m => m.name === 'Big Diamond')
    const ring = loaded.meshes.find(m => m.name === 'Ring')

    if (ringPrefab) {
      ringPrefab.name = 'ring'
      ringPrefab.scaling = new Vector3(100, 100, 100)
      ringPrefab.rotation = new Vector3(0, 0, 0)
      ringPrefab.position = new Vector3(0, RING_Y, 0)
    }

    return {
      ringPrefab,
      ring,
      smallDiamonds,
      bigDiamond
    }
  }
}
