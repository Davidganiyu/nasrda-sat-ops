/**
 * Tactical Optics & Sensor Simulation Manager
 * Cycles Cesium post-processing shaders between NORMAL, NVG (Night Vision Green Phosphor),
 * and FLIR (Forward-Looking Infrared / Thermal false-color).
 */

import * as Cesium from 'cesium';

export class OpticsManager {
  /**
   * @param {Cesium.Viewer} viewer 
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.mode = 'NORMAL'; // 'NORMAL' | 'NVG' | 'FLIR'
    this.nvgStage = null;
    this.flirStage = null;
    this.initPostProcessStages();
  }

  initPostProcessStages() {
    const scene = this.viewer.scene;
    if (!scene.postProcessStages) return;

    // 1. NVG Fragment Shader (Green phosphor night vision with gain and vignette)
    const nvgShader = `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      void main(void) {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        
        // Luminance calculation
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        // Enhance darkness and contrast
        lum = pow(lum, 0.75) * 1.6;

        // Radial vignette
        vec2 uv = v_textureCoordinates - vec2(0.5);
        float dist = length(uv);
        float vignette = smoothstep(0.75, 0.35, dist);

        // Green phosphor color grading
        vec3 nvgColor = vec3(0.08, 1.0, 0.28) * lum * vignette;

        // Subtle scanline / phosphor line modulation
        float scanline = sin(v_textureCoordinates.y * 700.0) * 0.04;
        nvgColor += vec3(scanline);

        fragColor = vec4(clamp(nvgColor, 0.0, 1.0), 1.0);
      }
    `;

    // 2. FLIR Fragment Shader (Thermal false-color heat signature ironbow / white-hot)
    const flirShader = `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      // Ironbow thermal gradient approximation
      vec3 ironbow(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c0 = vec3(0.02, 0.02, 0.15); // Cold deep blue
        vec3 c1 = vec3(0.25, 0.05, 0.45); // Purple
        vec3 c2 = vec3(0.85, 0.15, 0.10); // Red/Orange
        vec3 c3 = vec3(0.98, 0.85, 0.15); // Yellow
        vec3 c4 = vec3(1.00, 1.00, 1.00); // White hot

        if (t < 0.25) return mix(c0, c1, t / 0.25);
        if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
        if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
        return mix(c3, c4, (t - 0.75) / 0.25);
      }

      void main(void) {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        // High contrast thermal curve
        float heat = pow(lum, 1.25);

        // Map to Ironbow false color
        vec3 thermal = ironbow(heat);

        // Vignette
        vec2 uv = v_textureCoordinates - vec2(0.5);
        float dist = length(uv);
        float vig = smoothstep(0.8, 0.4, dist);

        fragColor = vec4(thermal * vig, 1.0);
      }
    `;

    try {
      this.nvgStage = new Cesium.PostProcessStage({
        fragmentShader: nvgShader,
        name: 'NVG_PostProcess'
      });
      this.nvgStage.enabled = false;
      scene.postProcessStages.add(this.nvgStage);

      this.flirStage = new Cesium.PostProcessStage({
        fragmentShader: flirShader,
        name: 'FLIR_PostProcess'
      });
      this.flirStage.enabled = false;
      scene.postProcessStages.add(this.flirStage);
    } catch (e) {
      console.warn('[OpticsManager] Post-processing stage init warning:', e);
    }
  }

  /**
   * Set specific optics mode
   * @param {'NORMAL'|'NVG'|'FLIR'} mode 
   */
  setMode(mode) {
    this.mode = mode;

    if (this.nvgStage) this.nvgStage.enabled = (mode === 'NVG');
    if (this.flirStage) this.flirStage.enabled = (mode === 'FLIR');

    // Update body class for HUD color sync if needed
    document.body.classList.remove('optics-nvg', 'optics-flir');
    if (mode === 'NVG') document.body.classList.add('optics-nvg');
    if (mode === 'FLIR') document.body.classList.add('optics-flir');

    return this.mode;
  }

  /**
   * Cycle to next optics mode
   * NORMAL -> NVG -> FLIR -> NORMAL
   */
  cycle() {
    if (this.mode === 'NORMAL') {
      return this.setMode('NVG');
    } else if (this.mode === 'NVG') {
      return this.setMode('FLIR');
    } else {
      return this.setMode('NORMAL');
    }
  }
}
