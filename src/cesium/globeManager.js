/**
 * CesiumJS Globe & Scene Manager
 * Sets up 3D Earth environment with high-res imagery, atmosphere glow, lighting,
 * smooth progressive exponential zoom, and tactical camera controls.
 */

import * as Cesium from 'cesium';

export class GlobeManager {
  constructor(containerId = 'cesiumContainer') {
    this.containerId = containerId;
    this.viewer = null;
    this.trackedEntity = null;
    this.cameraMode = 'free'; // 'free' | 'track' | 'chase' | 'topdown' | 'ground'
    this.initViewer();
  }

  initViewer() {
    // Configure Cesium Viewer
    this.viewer = new Cesium.Viewer(this.containerId, {
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      baseLayerPicker: false,
      skyBox: new Cesium.SkyBox({
        sources: {
          positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.100/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
          negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.100/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
          positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.100/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
          negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.100/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
          positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.100/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
          negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.100/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
        }
      }),
      globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
      contextOptions: {
        webgl: {
          alpha: false,
          antialias: true,
          preserveDrawingBuffer: true
        }
      }
    });

    const scene = this.viewer.scene;
    const globe = scene.globe;

    // Tactical Visual Tweaks
    globe.enableLighting = true;
    globe.showGroundAtmosphere = true;
    globe.atmosphereLightIntensity = 1.8;
    globe.nightFadeInDistance = 10000000.0;
    globe.nightFadeOutDistance = 5000000.0;
    globe.baseColor = Cesium.Color.fromCssColorString('#050b18');

    // Add High-Resolution Satellite Imagery (Esri World Imagery)
    try {
      const esriImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'Esri, Maxar, Earthstar Geographics'
      });
      this.viewer.imageryLayers.addImageryProvider(esriImagery);
    } catch (e) {
      console.warn('[GlobeManager] Esri imagery fallback active:', e);
    }

    // Atmosphere styling
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.brightnessShift = 0.1;
      scene.skyAtmosphere.saturationShift = 0.2;
    }

    // Smooth Progressive Zoom & Controller Inertia Configuration
    const controller = scene.screenSpaceCameraController;
    controller.zoomFactor = 3.0; // User specified zoomFactor = 3.0
    controller.inertiaZoom = 0.85; // Enable smooth momentum inertia
    controller.inertiaSpin = 0.85;
    controller.inertiaTranslate = 0.85;
    controller.minimumZoomDistance = 1500.0; // 1.5 km
    controller.maximumZoomDistance = 120000000.0; // 120,000 km
    controller.enableCollisionDetection = true;

    // High performance rendering
    this.viewer.targetFrameRate = 60;
    this.viewer.resolutionScale = window.devicePixelRatio || 1.0;

    // Set initial camera view centered on Nigeria & Atlantic Africa
    this.resetCameraToNigeria();

    // Setup immediate resize & orientation change handler
    const onResize = () => {
      if (this.viewer && !this.viewer.isDestroyed()) {
        this.viewer.resize();
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(onResize, 120);
    });
  }

  resetCameraToNigeria() {
    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(7.3900, 8.9900, 12000000.0),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-80.0),
        roll: 0.0
      },
      duration: 1.8
    });
  }

  setCameraMode(mode, satelliteEntity, groundStationPosition) {
    this.cameraMode = mode;

    if (mode === 'free') {
      this.viewer.trackedEntity = undefined;
    } else if (mode === 'track' && satelliteEntity) {
      this.viewer.trackedEntity = satelliteEntity;
    } else if (mode === 'chase' && satelliteEntity) {
      this.viewer.trackedEntity = satelliteEntity;
      this.viewer.zoomTo(satelliteEntity, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-25),
        2500000
      ));
    } else if (mode === 'topdown' && satelliteEntity) {
      this.viewer.trackedEntity = satelliteEntity;
      this.viewer.zoomTo(satelliteEntity, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-89.9),
        4500000
      ));
    } else if (mode === 'ground') {
      this.viewer.trackedEntity = undefined;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(7.3986, 8.9925, 30000.0), // 30km altitude descent over Obasanjo Space Centre
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-55.0), // downward tactical pitch looking at Earth
          roll: 0.0
        },
        duration: 2.0
      });
    }
  }

  /**
   * Smooth fly-to navigation for predefined landmarks
   */
  flyToLandmark(landmark) {
    if (!landmark) return;
    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        landmark.longitude,
        landmark.latitude,
        landmark.altitude
      ),
      orientation: {
        heading: Cesium.Math.toRadians(landmark.heading || 0.0),
        pitch: Cesium.Math.toRadians(landmark.pitch || -80.0),
        roll: Cesium.Math.toRadians(landmark.roll || 0.0)
      },
      duration: landmark.duration || 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }

  /**
   * Get current camera height above ellipsoid in meters
   */
  getCameraAltitude() {
    const camera = this.viewer.camera;
    const cartographic = camera.positionCartographic;
    return cartographic ? cartographic.height : 12000000;
  }

  /**
   * Smoothly interpolate camera altitude from zoom slider
   */
  setCameraAltitude(targetAltitudeMeters, duration = 0.5) {
    const camera = this.viewer.camera;
    const cartographic = camera.positionCartographic;
    if (!cartographic) return;

    const targetCartesian = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      targetAltitudeMeters
    );

    camera.flyTo({
      destination: targetCartesian,
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll
      },
      duration: duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_OUT
    });
  }

  flyToSatellite(satelliteEntity) {
    if (!satelliteEntity) return;
    this.viewer.flyTo(satelliteEntity, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-30),
        3000000
      ),
      duration: 1.5
    });
  }
}
