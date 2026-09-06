/**
 * CesiumJS Globe & Scene Manager
 * Sets up 3D Earth environment with high-res imagery, atmosphere glow, lighting,
 * smooth progressive exponential zoom, and tactical camera controls.
 */

import * as Cesium from 'cesium';

export class GlobeManager {
  /**
   * @param {string} containerId 
   * @param {Object} options
   * @param {Function} options.onSelectHotspot
   * @param {Function} options.onSelectFacility
   * @param {Function} options.onSelectSatellite
   */
  constructor(containerId = 'cesiumContainer', options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.onSelectHotspot = options.onSelectHotspot || null;
    this.onSelectFacility = options.onSelectFacility || null;
    this.onSelectSatellite = options.onSelectSatellite || null;

    this.viewer = null;
    this.trackedEntity = null;
    this.cameraMode = 'free'; // 'free' | 'track' | 'chase' | 'topdown' | 'ground'
    this.activeSatellite = null;
    this.isCurrentSatGeo = false;
    this.chaseZoomScale = 1.0;
    this.handler = null;
    this.activeAlertReticleEntity = null;
    this.activeAlertPulseEntity = null;
    this.activeAlertCoordinates = null;

    this.initViewer();
    this.initPickingHandler();
  }

  initViewer() {
    // Configure Cesium Viewer with mobile WebGL stability options
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
      shadows: false,
      terrainShadows: Cesium.ShadowMode.DISABLED,
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

    // Mobile WebGL Stability & Performance Tuning
    scene.highDynamicRange = false;
    if (scene.postProcessStages && scene.postProcessStages.fxaa) {
      scene.postProcessStages.fxaa.enabled = false;
    }
    globe.maximumScreenSpaceError = 2.5; // Fast tile loading and avoid memory bottlenecks
    scene.fog.enabled = true;

    // Tactical Visual Tweaks & Black Base Color for mobile WebGL stability
    globe.enableLighting = true;
    globe.showGroundAtmosphere = true;
    globe.atmosphereLightIntensity = 1.8;
    globe.nightFadeInDistance = 10000000.0;
    globe.nightFadeOutDistance = 5000000.0;
    globe.baseColor = Cesium.Color.BLACK;

    // Add High-Resolution Satellite Imagery with robust fallback
    try {
      const esriImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'Esri, Maxar, Earthstar Geographics'
      });
      this.viewer.imageryLayers.addImageryProvider(esriImagery);
    } catch (e) {
      console.warn('[GlobeManager] Esri imagery fallback active:', e);
      try {
        const osm = new Cesium.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maximumLevel: 19
        });
        this.viewer.imageryLayers.addImageryProvider(osm);
      } catch (e2) {}
    }

    // Atmosphere styling
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.brightnessShift = 0.1;
      scene.skyAtmosphere.saturationShift = 0.2;
    }

    // Progressive Zoom & Controller Inertia Configuration
    const controller = scene.screenSpaceCameraController;
    controller.zoomFactor = 3.0;
    controller.inertiaZoom = 0.85;
    controller.inertiaSpin = 0.85;
    controller.inertiaTranslate = 0.85;
    controller.minimumZoomDistance = 2000.0; // 2 km
    controller.maximumZoomDistance = 120000000.0; // 120,000 km
    controller.enableCollisionDetection = true;
    controller.enableZoom = true;

    // Enforce strict minimum camera height & distance to prevent negative zoom or ground clipping
    scene.preRender.addEventListener(() => {
      const camera = this.viewer.camera;
      const cartographic = camera.positionCartographic;
      if (cartographic) {
        let minAltitude = 2000.0; // 2km default minimum
        if (this.cameraMode === 'track' || this.cameraMode === 'chase') {
          minAltitude = this.isCurrentSatGeo ? 5000000.0 : 500000.0; // 5,000 km for GEO, 500 km for LEO
        } else if (this.cameraMode === 'topdown') {
          minAltitude = this.isCurrentSatGeo ? 30000000.0 : 1000000.0;
        }
        if (cartographic.height < minAltitude) {
          cartographic.height = minAltitude;
          camera.position = Cesium.Cartographic.toCartesian(cartographic, Cesium.Ellipsoid.WGS84);
        }
      }
    });

    // High performance rendering: Cap resolution scale to 1.0 to eliminate mobile GPU crashes
    this.viewer.targetFrameRate = 60;
    this.viewer.resolutionScale = Math.min(window.devicePixelRatio || 1.0, 1.0);

    // Set initial camera view centered on Nigeria & Atlantic Africa
    this.resetCameraToNigeria();

    // Mouse wheel zoom scaling for chase camera
    const canvas = this.viewer.scene.canvas;
    canvas.addEventListener('wheel', (e) => {
      if (this.cameraMode === 'chase') {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.12 : 0.88;
        this.chaseZoomScale = Math.min(Math.max(this.chaseZoomScale * factor, 0.4), 4.0);
      }
    }, { passive: false });

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

  initPickingHandler() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((movement) => {
      const picked = this.viewer.scene.pick(movement.position);
      if (!Cesium.defined(picked) || !picked.id) return;

      // 1. Thermal Hotspot picked
      if (picked.id.firmsData && this.onSelectHotspot) {
        this.onSelectHotspot(picked.id.firmsData);
        return;
      }

      // 2. Facility Landmark or Ground Station picked
      if (picked.id.facilityData && this.onSelectFacility) {
        this.onSelectFacility(picked.id.facilityData);
        return;
      }

      // 3. Satellite Entity picked
      if (this.activeSatellite && (picked.id === this.activeSatellite || picked.id.id === this.activeSatellite.id) && this.onSelectSatellite) {
        this.onSelectSatellite();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  resetCameraToNigeria() {
    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;
    this.clearActiveAlert();
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

  setCameraMode(mode, satelliteEntity, groundStationPosition, satConfig = null) {
    this.cameraMode = mode;
    this.activeSatellite = satelliteEntity;
    this.isCurrentSatGeo = (satConfig && satConfig.type === 'GEO') ||
                          (satelliteEntity && satelliteEntity.name && satelliteEntity.name.includes('NigComSat'));

    const controller = this.viewer.scene.screenSpaceCameraController;
    if (this.isCurrentSatGeo) {
      controller.minimumZoomDistance = 5000000.0; // Strict 5,000 km clamp for GEO
    } else {
      controller.minimumZoomDistance = (mode === 'track' || mode === 'chase') ? 500000.0 : 2000.0; // Strict 500 km clamp for LEO
    }

    if (mode === 'free') {
      this.viewer.trackedEntity = undefined;
    } else if (mode === 'track' && satelliteEntity) {
      this.viewer.trackedEntity = satelliteEntity;
      const range = this.isCurrentSatGeo ? 12000000.0 : 2500000.0;
      this.viewer.zoomTo(satelliteEntity, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-35),
        range
      ));
    } else if (mode === 'chase') {
      this.viewer.trackedEntity = undefined; // Driven directly by updateCameraForActiveMode along velocity vector
      this.chaseZoomScale = 1.0;
    } else if (mode === 'topdown') {
      this.viewer.trackedEntity = undefined; // Driven directly by updateCameraForActiveMode pointing straight down
    } else if (mode === 'ground') {
      this.viewer.trackedEntity = undefined;
      // Ground Station / NASRDA HQ (Abuja) dead-center at 40,000m altitude (40km), pitch: -45°
      const abujaCenter = Cesium.Cartesian3.fromDegrees(7.3986, 8.9925, 490.0);
      const abujaSphere = new Cesium.BoundingSphere(abujaCenter, 10.0);
      this.viewer.camera.flyToBoundingSphere(abujaSphere, {
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(0.0),
          Cesium.Math.toRadians(-45.0),
          40000.0
        ),
        duration: 2.0,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
      });
    }
  }

  /**
   * Continuous camera orientation update for CHASE and NADIR modes
   * Called every frame in the render loop to guarantee zero stutter or oscillation.
   * @param {Object} telemetry Latest orbital telemetry
   */
  updateCameraForActiveMode(telemetry) {
    if (!telemetry) return;

    if (this.cameraMode === 'chase') {
      const isGeo = this.isCurrentSatGeo;
      const baseDistance = isGeo ? 15000000.0 : 2500000.0; // 15,000 km for GEO, 2,500 km for LEO
      const distance = baseDistance * this.chaseZoomScale;

      const satPos = new Cesium.Cartesian3(
        telemetry.position.ecf.x * 1000,
        telemetry.position.ecf.y * 1000,
        telemetry.position.ecf.z * 1000
      );

      // Velocity in ECF frame
      const vel = new Cesium.Cartesian3(
        telemetry.velocity.vx * 1000,
        telemetry.velocity.vy * 1000,
        telemetry.velocity.vz * 1000
      );

      let vDir = Cesium.Cartesian3.normalize(vel, new Cesium.Cartesian3());
      if (Cesium.Cartesian3.magnitude(vDir) < 0.1) {
        vDir = new Cesium.Cartesian3(0, 1, 0);
      }

      // Radial vector outwards from Earth center
      const rDir = Cesium.Cartesian3.normalize(satPos, new Cesium.Cartesian3());

      // Right vector perpendicular to flight plane
      const rightDir = Cesium.Cartesian3.cross(vDir, rDir, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(rightDir, rightDir);

      // In-plane local zenith up vector
      const upDir = Cesium.Cartesian3.cross(rightDir, vDir, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(upDir, upDir);

      // Trailing behind craft along flight velocity vector with -20° pitch
      const pitchRad = Cesium.Math.toRadians(20.0);
      const backDist = distance * Math.cos(pitchRad);
      const upDist = distance * Math.sin(pitchRad);

      const cameraPos = new Cesium.Cartesian3();
      Cesium.Cartesian3.multiplyByScalar(vDir, -backDist, cameraPos);
      const elevated = new Cesium.Cartesian3();
      Cesium.Cartesian3.multiplyByScalar(upDir, upDist, elevated);
      Cesium.Cartesian3.add(cameraPos, elevated, cameraPos);
      Cesium.Cartesian3.add(cameraPos, satPos, cameraPos);

      // Camera points directly at satellite bus
      const lookDir = new Cesium.Cartesian3();
      Cesium.Cartesian3.subtract(satPos, cameraPos, lookDir);
      Cesium.Cartesian3.normalize(lookDir, lookDir);

      this.viewer.camera.setView({
        destination: cameraPos,
        orientation: {
          direction: lookDir,
          up: upDir
        }
      });
    } else if (this.cameraMode === 'topdown') {
      // NADIR VIEW:
      // Snap camera directly to satellite's current geodetic latitude/longitude pointing straight down at ground (pitch -90°)
      const isGeo = this.isCurrentSatGeo;
      const altitude = isGeo ? 35786000.0 : 1200000.0; // 35,786 km for GEO, 1,200 km for LEO

      const destination = Cesium.Cartesian3.fromDegrees(
        telemetry.position.lon,
        telemetry.position.lat,
        altitude
      );

      this.viewer.camera.setView({
        destination: destination,
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-89.9), // pointing straight down
          roll: 0.0
        }
      });
    }
  }

  /**
   * Smooth fly-to navigation for predefined landmarks with guaranteed dead-center alignment
   */
  flyToLandmark(landmark) {
    if (!landmark) return;
    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;

    const center = Cesium.Cartesian3.fromDegrees(
      landmark.longitude,
      landmark.latitude,
      landmark.elevation || 0
    );
    const sphere = new Cesium.BoundingSphere(center, 10.0);
    const heading = Cesium.Math.toRadians(landmark.heading || 0.0);
    const pitch = Cesium.Math.toRadians(landmark.pitch || -45.0);
    const range = landmark.altitude || 60000.0;

    this.viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(heading, pitch, range),
      duration: landmark.duration || 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }

  /**
   * Smooth fly-to navigation for NASRDA strategic facilities at 40,000m (pitch -45°)
   */
  flyToFacility(facility) {
    if (!facility) return;
    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;

    const center = Cesium.Cartesian3.fromDegrees(facility.lon, facility.lat, facility.alt || 0);
    const sphere = new Cesium.BoundingSphere(center, 10.0);

    this.viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0.0),
        Cesium.Math.toRadians(-45.0),
        40000.0 // 40,000m altitude
      ),
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }

  /**
   * Smooth fly-to navigation for arbitrary geographic coordinates at state/regional altitude
   */
  flyToCoordinates(lon, lat, altitude = 40000.0, pitchDeg = -45.0) {
    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;

    const center = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const sphere = new Cesium.BoundingSphere(center, 10.0);

    this.viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0.0),
        Cesium.Math.toRadians(pitchDeg),
        altitude
      ),
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }

  /**
   * Pan camera horizontally to center on (lon, lat) while STRICTLY PRESERVING current camera altitude, pitch, and heading.
   * Never zooms in or out.
   */
  panToCoordinates(lon, lat, duration = 1.2) {
    const camera = this.viewer.camera;
    const cartographic = camera.positionCartographic;
    if (!cartographic) return;

    this.cameraMode = 'free';
    this.viewer.trackedEntity = undefined;

    const currentAltitude = cartographic.height;
    const currentHeading = camera.heading;
    const currentPitch = camera.pitch;
    const currentRoll = camera.roll;

    const targetCartesian = Cesium.Cartesian3.fromDegrees(lon, lat, currentAltitude);

    camera.flyTo({
      destination: targetCartesian,
      orientation: {
        heading: currentHeading,
        pitch: currentPitch,
        roll: currentRoll
      },
      duration: duration,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
  }

  /**
   * Display an animated tactical pulsing reticle on the globe at incident coordinates
   */
  pulseTargetReticle(lon, lat, durationMs = 5000) {
    const pos = Cesium.Cartesian3.fromDegrees(lon, lat, 100);
    const startTime = Date.now();

    const reticleEntity = this.viewer.entities.add({
      position: pos,
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const elapsed = (Date.now() - startTime) % 1500;
          return 5000 + (elapsed / 1500) * 35000;
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const elapsed = (Date.now() - startTime) % 1500;
          return 5000 + (elapsed / 1500) * 35000;
        }, false),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const elapsed = (Date.now() - startTime) % 1500;
            const alpha = Math.max(0.1, 0.85 * (1.0 - elapsed / 1500));
            return Cesium.Color.fromCssColorString('#f59e0b').withAlpha(alpha);
          }, false)
        ),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
        outlineWidth: 2,
        height: 50
      },
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#ef4444'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    setTimeout(() => {
      if (this.viewer.entities.contains(reticleEntity)) {
        this.viewer.entities.remove(reticleEntity);
      }
    }, durationMs);
  }

  /**
   * Set and display a persistent tactical reticle and marker for an AI mission intelligence alert.
   * Remains active until cleared via clearActiveAlert() or resetAllViews().
   * @param {Object} alert Alert object with coordinates and title
   */
  setActiveAlert(alert) {
    if (!alert) return;
    this.clearActiveAlert();

    const lat = alert.coordinates?.lat !== undefined ? alert.coordinates.lat : alert.lat;
    const lon = alert.coordinates?.lon !== undefined ? alert.coordinates.lon : alert.lon;
    if (lat === undefined || lon === undefined) return;

    this.activeAlertCoordinates = { lon, lat, title: alert.title || 'ACTIVE INCIDENT' };

    const crosshairSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6,4"/>
      <circle cx="32" cy="32" r="14" fill="none" stroke="#f59e0b" stroke-width="2"/>
      <circle cx="32" cy="32" r="4" fill="#ef4444"/>
      <line x1="32" y1="2" x2="32" y2="16" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="32" y1="48" x2="32" y2="62" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="2" y1="32" x2="16" y2="32" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="48" y1="32" x2="62" y2="32" stroke="#ef4444" stroke-width="2.5"/>
    </svg>`;
    const crosshairUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(crosshairSvg)}`;

    // 1. Persistent Tactical Beacon & 15 km Ground Primitive
    this.activeAlertReticleEntity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 30),
      billboard: {
        image: crosshairUri,
        scale: new Cesium.CallbackProperty(() => 0.95 + 0.12 * Math.sin(Date.now() / 220), false),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER
      },
      ellipse: {
        semiMajorAxis: 15000.0, // 15 km radius
        semiMinorAxis: 15000.0,
        material: Cesium.Color.RED.withAlpha(0.35),
        outline: true,
        outlineColor: Cesium.Color.RED,
        outlineWidth: 2,
        height: 25
      },
      label: {
        text: `[INCIDENT: ${alert.title ? alert.title.toUpperCase() : 'SURVEILLANCE NODE'}]`,
        font: 'bold 11px monospace',
        fillColor: Cesium.Color.fromCssColorString('#fef08a'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.9)'),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
        pixelOffset: new Cesium.Cartesian2(0, -38),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    // 2. Animated Outer Radar Sweep Wave Ground Primitive (Pulsing 15 km to 30 km)
    const startTime = Date.now();
    this.activeAlertPulseEntity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 10),
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const elapsed = (Date.now() - startTime) % 2000;
          return 15000 + (elapsed / 2000) * 15000;
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const elapsed = (Date.now() - startTime) % 2000;
          return 15000 + (elapsed / 2000) * 15000;
        }, false),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const elapsed = (Date.now() - startTime) % 2000;
            const alpha = Math.max(0.04, 0.45 * (1.0 - elapsed / 2000));
            return Cesium.Color.RED.withAlpha(alpha);
          }, false)
        ),
        outline: true,
        outlineColor: Cesium.Color.RED.withAlpha(0.6),
        outlineWidth: 1.5,
        height: 10
      }
    });

    // 3. Smooth Camera Glide to Incident at 45,000m
    this.flyToCoordinates(lon, lat, 45000.0, -45.0);
  }

  /**
   * Remove persistent incident reticle from globe
   */
  clearActiveAlert() {
    if (this.activeAlertReticleEntity && this.viewer.entities.contains(this.activeAlertReticleEntity)) {
      this.viewer.entities.remove(this.activeAlertReticleEntity);
    }
    if (this.activeAlertPulseEntity && this.viewer.entities.contains(this.activeAlertPulseEntity)) {
      this.viewer.entities.remove(this.activeAlertPulseEntity);
    }
    this.activeAlertReticleEntity = null;
    this.activeAlertPulseEntity = null;
    this.activeAlertCoordinates = null;
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

  destroy() {
    if (this.handler && !this.handler.isDestroyed()) {
      this.handler.destroy();
      this.handler = null;
    }
  }
}
