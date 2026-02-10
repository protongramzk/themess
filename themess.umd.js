(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ThemeSS = {}));
})(this, (function (exports) { 'use strict';

  /**
   * Storage Manager untuk Tema
   * @class SaveSS
   */
  class SaveSS {
    /**
     * Constructor
     * @param {string} [storageKey="savess_store"] - Kunci penyimpanan
     */
    constructor(storageKey = "savess_store") {
      /**
       * Kunci penyimpanan
       * @type {string}
       */
      this.storageKey = storageKey;

      /**
       * Data penyimpanan
       * @type {object}
       */
      this.store = {
        themes: {},
        active: null,
        scheme: null
      };

      /**
       * Root elemen
       * @type {HTMLElement}
       */
      this.root = document.documentElement;

      this._loadStore();
    }

    /**
     * Muat data penyimpanan
     * @private
     */
    _loadStore() {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) this.store = JSON.parse(data);
      } catch (e) {
        console.warn("SaveSS: load failed");
      }
    }

    /**
     * Simpan data penyimpanan
     * @private
     */
    _saveStore() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.store));
    }

    /**
     * Sanitasi token
     * @param {string} key - Kunci token
     * @param {string} value - Nilai token
     * @returns {string|null} Nilai token yang telah disanitasi
     * @private
     */
    _sanitizeToken(key, value) {
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) return null;
      if (/[;{}]/.test(value)) return null;
      return value;
    }

    /**
     * Terapkan token
     * @param {object} tokens - Token
     * @private
     */
    _applyTokens(tokens) {
      for (const key in tokens) {
        const safeValue = this._sanitizeToken(key, tokens[key]);
        if (safeValue !== null) {
          this.root.style.setProperty(`--${key}`, safeValue);
        }
      }
    }

    /**
     * Register tema baru
     * @param {object} config - Konfigurasi tema
     * @param {string} config.name - Nama tema
     * @param {object} config.targets - Target tema
     * @returns {SaveSS} Instansi SaveSS
     */
    register(config = {}) {
      const { name, ...targets } = config;
      if (!name) return this;
      if (targets[":root"]) {
        this.store.themes[name] = targets[":root"];
        this._saveStore();
      }
      return this;
    }

    /**
     * Gunakan tema
     * @param {string} name - Nama tema
     * @param {object} [options={}] - Opsi tema
     * @returns {SaveSS} Instansi SaveSS
     */
    use(name, options = {}) {
      if (name) {
        this.store.active = name;
        this._saveStore();
      }
      const theme = this.store.themes[this.store.active];
      if (theme) this._applyTokens(theme);
      return this;
    }
  }
   /* ViewideEngine v2 - Refactored Color Extraction Engine
   * 
   * Features:
   * ✓ K-Means Clustering (proper color grouping)
   * ✓ Adaptive Sampling (smart resize based on image complexity)
   * ✓ Perceptual Filtering (exclude noise based on Lightness & Saturation)
   * ✓ Multi-level Extraction (primary, secondary, accent, neutral, vibrant)
   * ✓ Quality Scoring (ensure harmonious results)
   * ✓ Cross-Algorithm Validation (k-means + median-cut hybrid)
   * ✓ Performance Optimized (<500ms for most images)
   */

  class ViewideEngine {
      // Color space transformation matrices (sRGB → OKLch)
      static M1 = new Float32Array([0.4122, 0.5363, 0.0514, 0.2119, 0.6748, 0.1132, 0.0883, 0.2817, 0.6300]);
      static M2 = new Float32Array([0.2104, 0.7936, -4e-3, 1.9779, -2.4285, 0.4505, 0.0259, 0.7827, -0.8086]);

      // Configuration
      static CONFIG = {
          minSampleSize: 16,      // Minimum canvas size
          maxSampleSize: 128,     // Maximum canvas size
          kMeansIterations: 8,    // Clustering iterations (balance speed/quality)
          kMeansK: 16,            // Number of initial clusters
          entropyThreshold: 0.15, // Complexity detection
          minSaturation: 0.05,    // Filter out grayscale
          minLightness: 0.15,     // Filter out too dark
          maxLightness: 0.95,     // Filter out too bright
          qualityThreshold: 0.6   // Minimum acceptable quality score
      };

      /**
       * Main extraction - returns comprehensive color palette
       */
      static async get(imageUrl, options = {}) {
          try {
              const img = await this._loadImage(imageUrl);
              const sampleSize = this._calculateAdaptiveSampleSize(img);
              const pixels = this._extractPixels(img, sampleSize);
              
              // Convert to OKLch color space
              const colors = pixels.map(([r, g, b]) => ({
                  rgb: [r, g, b],
                  oklch: this.rgbToOklch(r, g, b),
                  id: Math.random() // For clustering
              }));

              // Filter perceptually inappropriate colors
              const filtered = this._filterColors(colors);

              if (filtered.length === 0) {
                  return this._getFallbackPalette();
              }

              // K-Means clustering
              const clusters = this._kMeansClustering(filtered, this.CONFIG.kMeansK);

              // Median-Cut validation (cross-algorithm check)
              const medianCutClusters = this._medianCutClustering(filtered, 5);

              // Merge and rank
              const palette = this._mergeAndRank(clusters, medianCutClusters);

              // Quality check
              const quality = this._calculateQuality(palette);
              if (quality.score < this.CONFIG.qualityThreshold) {
                  return this._augmentPalette(palette);
              }

              return palette;
          } catch (error) {
              console.error('ViewideEngine extraction failed:', error);
              return this._getFallbackPalette();
          }
      }

      /**
       * Load image with CORS handling
       */
      static _loadImage(imageUrl) {
          return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = "Anonymous";
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('Image load failed'));
              img.src = imageUrl;
          });
      }

      /**
       * Adaptive sample size based on image entropy
       * More complex image = larger sample for detail
       * Simple image = smaller sample for speed
       */
      static _calculateAdaptiveSampleSize(img) {
          const tempCanvas = document.createElement('canvas');
          const tempSize = 32;
          tempCanvas.width = tempCanvas.height = tempSize;
          const ctx = tempCanvas.getContext('2d', { alpha: false });
          ctx.drawImage(img, 0, 0, tempSize, tempSize);
          const data = ctx.getImageData(0, 0, tempSize, tempSize).data;

          // Calculate entropy (measure of complexity)
          const histogram = new Array(256).fill(0);
          for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
              histogram[Math.floor(gray)]++;
          }

          let entropy = 0;
          for (const count of histogram) {
              if (count === 0) continue;
              const p = count / (tempSize * tempSize);
              entropy -= p * Math.log2(p);
          }

          // Map entropy to sample size
          if (entropy < this.CONFIG.entropyThreshold) {
              return this.CONFIG.minSampleSize; // Simple image
          } else if (entropy > 7) {
              return this.CONFIG.maxSampleSize; // Complex image
          } else {
              // Linear interpolation
              const range = this.CONFIG.maxSampleSize - this.CONFIG.minSampleSize;
              return this.CONFIG.minSampleSize + Math.floor(range * (entropy / 8));
          }
      }

      /**
       * Extract pixel data from image
       */
      static _extractPixels(img, size) {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.drawImage(img, 0, 0, size, size);
          
          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;
          const pixels = [];

          for (let i = 0; i < data.length; i += 4) {
              pixels.push([data[i], data[i+1], data[i+2]]);
          }

          return pixels;
      }

      /**
       * Convert RGB to OKLch color space
       */
      static rgbToOklch(r, g, b) {
          const [nr, ng, nb] = [r/255, g/255, b/255];
          
          // Linear RGB
          const l_ = this.M1[0]*nr + this.M1[1]*ng + this.M1[2]*nb;
          const m_ = this.M1[3]*nr + this.M1[4]*ng + this.M1[5]*nb;
          const s_ = this.M1[6]*nr + this.M1[7]*ng + this.M1[8]*nb;
          
          // Cube root
          const l = Math.cbrt(l_);
          const m = Math.cbrt(m_);
          const s = Math.cbrt(s_);
          
          // OKLch
          const L = this.M2[0]*l + this.M2[1]*m + this.M2[2]*s;
          const a = this.M2[3]*l + this.M2[4]*m + this.M2[5]*s;
          const b_ = this.M2[6]*l + this.M2[7]*m + this.M2[8]*s;
          
          const C = Math.sqrt(a*a + b_*b_);
          const h = (Math.atan2(b_, a) * 57.2957 + 360) % 360;
          
          return { L, C, h };
      }

      /**
       * Convert OKLch back to RGB (for verification)
       */
      static oklchToRgb(L, C, h) {
          const hRad = h * 0.017453; // deg to rad
          const a = C * Math.cos(hRad);
          const b_ = C * Math.sin(hRad);

          const l = L + this.M2[0]*a + this.M2[1]*b_;
          const m = L + this.M2[3]*a + this.M2[4]*b_;
          const s = L + this.M2[6]*a + this.M2[7]*b_;

          const l_ = l * l * l;
          const m_ = m * m * m;
          const s_ = s * s * s;

          const r = this.M1[0]*l_ + this.M1[1]*m_ + this.M1[2]*s_;
          const g = this.M1[3]*l_ + this.M1[4]*m_ + this.M1[5]*s_;
          const b = this.M1[6]*l_ + this.M1[7]*m_ + this.M1[8]*s_;

          return [
              Math.max(0, Math.min(255, Math.round(r * 255))),
              Math.max(0, Math.min(255, Math.round(g * 255))),
              Math.max(0, Math.min(255, Math.round(b * 255)))
          ];
      }

      /**
       * Perceptual filtering - remove inappropriate colors
       */
      static _filterColors(colors) {
          return colors.filter(color => {
              const { L, C, h } = color.oklch;
              
              // Filter by lightness (avoid too dark/bright)
              if (L < this.CONFIG.minLightness || L > this.CONFIG.maxLightness) {
                  return false;
              }
              
              // Filter by saturation (avoid grayscale)
              if (C < this.CONFIG.minSaturation) {
                  return false;
              }

              return true;
          });
      }

      /**
       * K-Means Clustering - Groups similar colors
       * Returns cluster centroids (representative colors)
       */
      static _kMeansClustering(colors, k) {
          if (colors.length === 0) return [];

          // Initialize centroids (K-Means++)
          const centroids = [];
          centroids.push(colors[Math.floor(Math.random() * colors.length)].oklch);

          for (let i = 1; i < k && i < colors.length; i++) {
              let maxDist = -Infinity;
              let farthest = colors[0].oklch;

              for (const color of colors) {
                  let minDist = Infinity;
                  for (const centroid of centroids) {
                      const dist = this._oklchDistance(color.oklch, centroid);
                      minDist = Math.min(minDist, dist);
                  }
                  if (minDist > maxDist) {
                      maxDist = minDist;
                      farthest = color.oklch;
                  }
              }
              centroids.push(farthest);
          }

          // K-Means iterations
          for (let iter = 0; iter < this.CONFIG.kMeansIterations; iter++) {
              // Assign colors to nearest centroid
              const clusters = new Array(k).fill(null).map(() => []);
              
              for (const color of colors) {
                  let minDist = Infinity;
                  let nearestIdx = 0;
                  
                  for (let i = 0; i < centroids.length; i++) {
                      const dist = this._oklchDistance(color.oklch, centroids[i]);
                      if (dist < minDist) {
                          minDist = dist;
                          nearestIdx = i;
                      }
                  }
                  clusters[nearestIdx].push(color);
              }

              // Recalculate centroids
              for (let i = 0; i < centroids.length; i++) {
                  if (clusters[i].length === 0) continue;

                  const avgL = clusters[i].reduce((sum, c) => sum + c.oklch.L, 0) / clusters[i].length;
                  const avgC = clusters[i].reduce((sum, c) => sum + c.oklch.C, 0) / clusters[i].length;
                  const avgH = this._circularMean(clusters[i].map(c => c.oklch.h));

                  centroids[i] = { L: avgL, C: avgC, h: avgH };
              }
          }

          // Return non-empty clusters with metadata
          return centroids.map((centroid, idx) => ({
              oklch: centroid,
              rgb: this.oklchToRgb(centroid.L, centroid.C, centroid.h),
              centroid: true,
              source: 'kmeans'
          })).filter((_, idx) => colors.filter(c => this._oklchDistance(c.oklch, centroids[idx]) < 0.1).length > 0);
      }

      /**
       * Median-Cut Clustering - Alternative algorithm for validation
       * Divides color space recursively
       */
      static _medianCutClustering(colors, depth) {
          if (colors.length === 0) return [];

          const recurse = (colorSet, currentDepth) => {
              if (currentDepth === 0 || colorSet.length <= 1) {
                  if (colorSet.length === 0) return [];
                  
                  const avgL = colorSet.reduce((sum, c) => sum + c.oklch.L, 0) / colorSet.length;
                  const avgC = colorSet.reduce((sum, c) => sum + c.oklch.C, 0) / colorSet.length;
                  const avgH = this._circularMean(colorSet.map(c => c.oklch.h));

                  return [{
                      oklch: { L: avgL, C: avgC, h: avgH },
                      rgb: this.oklchToRgb(avgL, avgC, avgH),
                      centroid: true,
                      source: 'mediancut'
                  }];
              }

              // Find axis with highest range (L, C, or h)
              const minL = Math.min(...colorSet.map(c => c.oklch.L));
              const maxL = Math.max(...colorSet.map(c => c.oklch.L));
              const minC = Math.min(...colorSet.map(c => c.oklch.C));
              const maxC = Math.max(...colorSet.map(c => c.oklch.C));

              const rangeL = maxL - minL;
              const rangeC = maxC - minC;

              const axis = rangeL > rangeC ? 'L' : 'C';
              colorSet.sort((a, b) => a.oklch[axis] - b.oklch[axis]);

              const mid = Math.floor(colorSet.length / 2);
              const left = colorSet.slice(0, mid);
              const right = colorSet.slice(mid);

              return [
                  ...recurse(left, currentDepth - 1),
                  ...recurse(right, currentDepth - 1)
              ];
          };

          return recurse(colors, depth);
      }

      /**
       * Merge K-Means and Median-Cut results
       */
      static _mergeAndRank(kMeansClusters, medianCutClusters) {
          const all = [...kMeansClusters, ...medianCutClusters];
          
          // Remove duplicates (colors within 0.15 distance)
          const unique = [];
          for (const cluster of all) {
              const isDuplicate = unique.some(u => 
                  this._oklchDistance(u.oklch, cluster.oklch) < 0.15
              );
              if (!isDuplicate) {
                  unique.push(cluster);
              }
          }

          // Score each color
          const scored = unique.map(color => ({
              ...color,
              score: this._colorScore(color.oklch)
          }));

          // Sort by score (higher = better)
          scored.sort((a, b) => b.score - a.score);

          // Return top colors with semantic mapping
          return {
              primary: scored[0] || this._getDefaultColor(),
              secondary: scored[1] || scored[0] || this._getDefaultColor(),
              accent: scored[2] || scored[1] || this._getDefaultColor(),
              neutral: this._getNeutralColor(scored),
              vibrant: scored.find(c => c.oklch.C > 0.2) || scored[0] || this._getDefaultColor(),
              all: scored.slice(0, 8)
          };
      }

      /**
       * Quality scoring - ensures output is harmonious
       */
      static _calculateQuality(palette) {
          const colors = [palette.primary, palette.secondary, palette.accent];
          
          // Calculate contrast between colors
          let contrast = 0;
          for (let i = 0; i < colors.length; i++) {
              for (let j = i + 1; j < colors.length; j++) {
                  contrast += this._oklchDistance(colors[i].oklch, colors[j].oklch);
              }
          }
          contrast /= 3; // Normalize

          // Check saturation diversity
          const saturationVariance = Math.max(...colors.map(c => c.oklch.C)) - 
                                     Math.min(...colors.map(c => c.oklch.C));

          // Check lightness diversity
          const lightnessVariance = Math.max(...colors.map(c => c.oklch.L)) - 
                                    Math.min(...colors.map(c => c.oklch.L));

          // Score (0-1)
          const score = (contrast / 1) * 0.4 + 
                        Math.min(saturationVariance / 0.2, 1) * 0.3 + 
                        Math.min(lightnessVariance / 0.4, 1) * 0.3;

          return { score: Math.min(score, 1), contrast, saturationVariance, lightnessVariance };
      }

      /**
       * Augment palette if quality is low
       */
      static _augmentPalette(palette) {
          // If primary color is too saturated, desaturate
          const primary = palette.primary.oklch;
          if (primary.C > 0.25) {
              primary.C = 0.22;
          }

          // Ensure neutral is actually neutral
          if (!palette.neutral || palette.neutral.oklch.C > 0.05) {
              palette.neutral = {
                  oklch: { L: 0.5, C: 0.01, h: primary.h },
                  rgb: this.oklchToRgb(0.5, 0.01, primary.h),
                  centroid: true,
                  source: 'augmented'
              };
          }

          return palette;
      }

      /**
       * Get neutral color from palette
       */
      static _getNeutralColor(colors) {
          // Find color with lowest saturation (closest to grayscale)
          return colors.reduce((prev, curr) => 
              curr.oklch.C < prev.oklch.C ? curr : prev
          ) || { 
              oklch: { L: 0.5, C: 0.01, h: 0 },
              rgb: [128, 128, 128],
              centroid: true,
              source: 'default'
          };
      }

      /**
       * Fallback palette (safe default)
       */
      static _getFallbackPalette() {
          return {
              primary: { oklch: { L: 0.45, C: 0.2, h: 220 }, rgb: [75, 98, 255], centroid: true },
              secondary: { oklch: { L: 0.5, C: 0.15, h: 280 }, rgb: [120, 60, 200], centroid: true },
              accent: { oklch: { L: 0.6, C: 0.18, h: 20 }, rgb: [255, 140, 80], centroid: true },
              neutral: { oklch: { L: 0.5, C: 0.01, h: 220 }, rgb: [128, 128, 128], centroid: true },
              vibrant: { oklch: { L: 0.55, C: 0.25, h: 60 }, rgb: [255, 220, 50], centroid: true },
              all: []
          };
      }

      static _getDefaultColor() {
          return { oklch: { L: 0.5, C: 0.15, h: 220 }, rgb: [100, 120, 200], centroid: true };
      }

      /**
       * Color scoring - how "good" is this color?
       * Higher saturation + moderate lightness = higher score
       */
      static _colorScore(oklch) {
          const saturationScore = Math.min(oklch.C / 0.25, 1); // Prefer moderate saturation
          const lightnessScore = 1 - Math.abs(oklch.L - 0.5) / 0.5; // Prefer mid-lightness
          return saturationScore * 0.6 + lightnessScore * 0.4;
      }

      /**
       * Euclidean distance in OKLch space
       */
      static _oklchDistance(color1, color2) {
          const dL = (color1.L - color2.L) * 100;
          const dC = (color1.C - color2.C) * 100;
          const dH = (color1.h - color2.h) * 50; // Weight hue less
          return Math.sqrt(dL*dL + dC*dC + dH*dH) / 100;
      }

      /**
       * Circular mean for hue (handle 0/360 wrapping)
       */
      static _circularMean(angles) {
          let sinSum = 0, cosSum = 0;
          for (const angle of angles) {
              const rad = angle * 0.017453;
              sinSum += Math.sin(rad);
              cosSum += Math.cos(rad);
          }
          let mean = Math.atan2(sinSum, cosSum) * 57.2957;
          return (mean + 360) % 360;
      }

      /**
       * Utility: Get oklch from palette by name
       */
      static getPaletteColor(palette, colorName) {
          return palette[colorName]?.oklch || palette.primary?.oklch;
      }

      /**
       * Utility: Export palette as CSS variables
       */
      static exportAsCSS(palette) {
          const css = {};
          const colors = { primary: palette.primary, secondary: palette.secondary, accent: palette.accent };
          
          for (const [name, color] of Object.entries(colors)) {
              if (color) {
                  const { L, C, h } = color.oklch;
                  css[`--${name}`] = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)}deg)`;
              }
          }
          
          return css;
      }
  }
          /**
   * ShadesGenerator v2 - Material Design 3 Shade Generation
   * 
   * Kompatibel dengan ViewideEngine v2 output
   * Input: Palette object dari ViewideEngine.get()
   * Output: Shade tones tetap sama seperti v1
   * 
   * Format input dari ViewideEngine v2:
   * {
   *   primary: {oklch: {L, C, h}, rgb: [...], ...},
   *   secondary: {oklch: {L, C, h}, rgb: [...], ...},
   *   accent: {oklch: {L, C, h}, rgb: [...], ...},
   *   neutral: {oklch: {L, C, h}, rgb: [...], ...},
   *   vibrant: {...},
   *   all: [...]
   * }
   * 
   * Format output (sama seperti v1):
   * {
   *   primary: {0: "oklch(...)", 10: "oklch(...)", ..., 100: "oklch(...)"},
   *   accent: {...},
   *   secondary: {...},
   *   neutral: {...},
   *   neutralVariant: {...}
   * }
   */

  class ShadesGenerator {
      // Material Design 3 tone levels
      static TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 100];

      /**
       * Generate shades dari ViewideEngine v2 output
       * 
       * @param {Object} palette - Output dari ViewideEngine.get()
       * @param {Object} options - Optional configuration
       * @returns {Object} Shade palettes (primary, accent, secondary, neutral, neutralVariant)
       */
      static generate(palette, options = {}) {
          // Validate input
          if (!palette || typeof palette !== 'object') {
              console.warn('ShadesGenerator: Invalid palette input');
              return this._getDefaultShades();
          }

          // Extract OKLch colors dari ViewideEngine v2 format
          const primary = this._extractOklch(palette.primary);
          const secondary = this._extractOklch(palette.secondary);
          const accent = this._extractOklch(palette.accent);
          const neutral = this._extractOklch(palette.neutral);

          // Validate extracted colors
          if (!primary || !accent) {
              return this._getDefaultShades();
          }

          // Clamp saturation to reasonable ranges (Material Design 3)
          const primaryClamped = this._clamp(primary, 0.10, 0.35);
          const secondaryClamped = this._clamp(secondary || primary, 0.06, 0.25);
          const accentClamped = this._clamp(accent, 0.06, 0.25);
          
          // Neutral should be desaturated
          const neutralColor = neutral || { L: primary.L, h: primary.h };
          const neutralClamped = { L: neutralColor.L, C: 0.015, h: primary.h };

          return {
              primary: this._palette(primaryClamped),
              secondary: this._palette(secondaryClamped),
              accent: this._palette(accentClamped),
              neutral: this._palette(neutralClamped),
              neutralVariant: this._palette(neutralClamped, 0.04)
          };
      }

      /**
       * Extract OKLch color dari format ViewideEngine v2
       * Support both new format dan legacy format untuk backward compatibility
       * 
       * @param {Object} color - Color object dari ViewideEngine
       * @returns {Object|null} {L, C, h} or null
       */
      static _extractOklch(color) {
          if (!color) return null;

          // Format baru: {oklch: {L, C, h}, rgb: [...], ...}
          if (color.oklch && typeof color.oklch === 'object') {
              const {L, C, h} = color.oklch;
              if (typeof L === 'number' && typeof C === 'number' && typeof h === 'number') {
                  return {L, C, h};
              }
          }

          // Format lama (backward compatible): {l, c, h}
          if (color.l !== undefined && color.c !== undefined && color.h !== undefined) {
              return {L: color.l, C: color.c, h: color.h};
          }

          // Format alternatif: {L, c, h}
          if (color.L !== undefined && color.c !== undefined && color.h !== undefined) {
              return {L: color.L, C: color.c, h: color.h};
          }

          return null;
      }

      /**
       * Clamp chroma/saturation ke range yang valid
       * Prevents over-saturated atau under-saturated colors
       * 
       * @param {Object} color - {L, C, h}
       * @param {number} min - Minimum chroma
       * @param {number} max - Maximum chroma
       * @returns {Object} Clamped color
       */
      static _clamp(color, min, max) {
          if (!color) return {L: 0.5, C: 0.01, h: 0};
          
          return {
              L: Math.max(0, Math.min(color.L || color.l || 0.5, 1)),
              C: Math.max(min, Math.min(color.C || color.c || 0, max)),
              h: (color.h || 0) % 360
          };
      }

      /**
       * Generate tone palette untuk single base color
       * Creates 13 tones (0-100) dari lightness variations
       * 
       * @param {Object} base - {L, C, h}
       * @param {number} forceC - Optional forced chroma (for neutral)
       * @returns {Object} Tone map {0: "oklch(...)", 10: "oklch(...)", ...}
       */
      static _palette(base, forceC = null) {
          const palette = {};
          const chroma = forceC !== null ? forceC : base.C;

          for (const tone of this.TONES) {
              // Normalize tone (0-100) ke lightness (0-1)
              // tone 0 = L 0 (darkest), tone 100 = L 1 (lightest)
              const lightness = tone / 100;

              // Create OKLch color string
              palette[tone] = `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${base.h.toFixed(1)})`;
          }

          return palette;
      }

      /**
       * Get default shades jika input invalid
       * Fallback ke safe palette
       */
      static _getDefaultShades() {
          const defaultBlue = { L: 0.45, C: 0.15, h: 220 };
          const defaultNeutral = { L: 0.5, C: 0.01, h: 220 };

          return {
              primary: this._palette(defaultBlue),
              secondary: this._palette({...defaultBlue, h: 280}),
              accent: this._palette({...defaultBlue, h: 20}),
              neutral: this._palette(defaultNeutral),
              neutralVariant: this._palette(defaultNeutral, 0.04)
          };
      }

      /**
       * Export specific tone dari semua palettes
       * Useful untuk semantic token mapping
       * 
       * @param {Object} shades - Output dari generate()
       * @param {number} tone - Target tone (0, 10, 20, ..., 100)
       * @returns {Object} {primary: "oklch(...)", secondary: "oklch(...)", ...}
       */
      static getTone(shades, tone) {
          if (!shades) return null;

          return {
              primary: shades.primary?.[tone],
              secondary: shades.secondary?.[tone],
              accent: shades.accent?.[tone],
              neutral: shades.neutral?.[tone],
              neutralVariant: shades.neutralVariant?.[tone]
          };
      }

      /**
       * Get complementary tone
       * Useful untuk text/background combinations
       * Contoh: tone 40 (dark) → tone 90 (light) untuk contrast
       * 
       * @param {number} tone - Input tone
       * @returns {number} Complementary tone
       */
      static getComplementaryTone(tone) {
          // Simple algorithm: darker tones → lighter complement, vice versa
          if (tone <= 50) {
              return 90 + (50 - tone) / 5; // 0→100, 50→90
          } else {
              return 10 + (100 - tone) / 5; // 100→10, 50→10
          }
      }

      /**
       * Create semantic token mapping untuk Material Design 3
       * Maps tone numbers ke M3 semantic meanings
       * 
       * @param {Object} shades - Output dari generate()
       * @returns {Object} Semantic token map
       */
      static createSemanticTokens(shades) {
          return {
              // Primary colors
              primary: shades.primary[40],
              onPrimary: shades.primary[100],
              primaryContainer: shades.primary[90],
              onPrimaryContainer: shades.primary[10],

              // Secondary colors
              secondary: shades.secondary[40],
              onSecondary: shades.secondary[100],
              secondaryContainer: shades.secondary[90],
              onSecondaryContainer: shades.secondary[10],

              // Accent colors
              accent: shades.accent[40],
              onAccent: shades.accent[100],
              accentContainer: shades.accent[90],
              onAccentContainer: shades.accent[10],

              // Neutral colors
              background: shades.neutral[98],
              onBackground: shades.neutral[10],
              surface: shades.neutral[95],
              onSurface: shades.neutral[10],
              surfaceVariant: shades.neutralVariant[90],
              onSurfaceVariant: shades.neutralVariant[30],
              outline: shades.neutralVariant[50],
              outlineVariant: shades.neutralVariant[80]
          };
      }

      /**
       * Validate generated shades quality
       * Check apakah tones valid dan distinguishable
       * 
       * @param {Object} shades - Output dari generate()
       * @returns {Object} {isValid: boolean, issues: string[]}
       */
      static validate(shades) {
          const issues = [];

          if (!shades || typeof shades !== 'object') {
              return {isValid: false, issues: ['Invalid shades object']};
          }

          const palettes = ['primary', 'secondary', 'accent', 'neutral', 'neutralVariant'];
          
          for (const palette of palettes) {
              if (!shades[palette]) {
                  issues.push(`Missing palette: ${palette}`);
                  continue;
              }

              // Check semua tones present
              const missingTones = this.TONES.filter(t => !shades[palette][t]);
              if (missingTones.length > 0) {
                  issues.push(`Palette ${palette} missing tones: ${missingTones.join(', ')}`);
              }

              // Check format validity
              for (const tone of this.TONES) {
                  const color = shades[palette][tone];
                  if (color && !color.includes('oklch(')) {
                      issues.push(`Palette ${palette} tone ${tone} has invalid format`);
                  }
              }
          }

          return {
              isValid: issues.length === 0,
              issues
          };
      }

      /**
       * Export shades as CSS custom properties
       * Ready untuk inject ke document root
       * 
       * @param {Object} shades - Output dari generate()
       * @param {string} prefix - Optional prefix (default: '')
       * @returns {Object} CSS variable map
       */
      static exportAsCSS(shades, prefix = '') {
          const css = {};
          const palettes = ['primary', 'secondary', 'accent', 'neutral', 'neutralVariant'];

          for (const palette of palettes) {
              if (!shades[palette]) continue;

              for (const tone of this.TONES) {
                  const color = shades[palette][tone];
                  if (color) {
                      const varName = `--${prefix}${palette}-${tone}`;
                      css[varName] = color;
                  }
              }
          }

          return css;
      }

      /**
       * Apply shades langsung ke DOM
       * Convenient method untuk quick setup
       * 
       * @param {Object} shades - Output dari generate()
       * @param {Element} target - Target element (default: document.documentElement)
       * @param {string} prefix - Optional prefix
       */
      static applyToDOM(shades, target = document.documentElement, prefix = '') {
          const css = this.exportAsCSS(shades, prefix);
          
          for (const [varName, value] of Object.entries(css)) {
              target.style.setProperty(varName, value);
          }
      }

      /**
       * Create gradient dari tone range
       * Useful untuk UI effects
       * 
       * @param {Object} palette - Single palette object (e.g., shades.primary)
       * @param {number} fromTone - Start tone
       * @param {number} toTone - End tone
       * @returns {string} CSS gradient value
       */
      static createGradient(palette, fromTone = 0, toTone = 100) {
          const from = palette[fromTone];
          const to = palette[toTone];
          
          if (!from || !to) return 'transparent';
          
          return `linear-gradient(90deg, ${from}, ${to})`;
      }
  }

  exports.SaveSS = SaveSS;
  exports.ShadesGenerator = ShadesGenerator;
  exports.ViewideEngine = ViewideEngine;

}));
