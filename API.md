# API Documentation

## SaveSS - Theme Storage Manager

A class for storing, managing, and applying themes using localStorage.

### Constructor
```javascript
new SaveSS(storageKey = "savess_store")
```
Initialize theme manager with customizable storage key.

### Methods

#### register(config)
Register a new theme.
- **Parameters:**
  - `config.name` (string) - Theme name
  - `config...targets` - CSS variable tokens for the theme
- **Returns:** `SaveSS` (chainable)
- **Example:**
  ```javascript
  saveSS.register({
    name: "dark",
    ":root": {
      "primary-color": "#ffffff",
      "bg-color": "#000000"
    }
  });
  ```

#### use(name, options = {})
Apply theme to document.
- **Parameters:**
  - `name` (string) - Theme name to activate
  - `options` (object) - Additional options (optional)
- **Returns:** `SaveSS` (chainable)
- **Example:**
  ```javascript
  saveSS.use("dark");
  ```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `storageKey` | string | Key for localStorage |
| `store` | object | Theme data: `{themes, active, scheme}` |
| `root` | HTMLElement | Reference to `document.documentElement` |

---

## MonetEngine - Color Extraction Engine

Extracts color palettes from images using K-Means clustering and Median-Cut algorithm.

### Static Methods

#### get(imageUrl, options = {})
Extract comprehensive color palette from image.
- **Parameters:**
  - `imageUrl` (string) - Image URL (must have CORS enabled)
  - `options` (object) - Optional configuration
- **Returns:** Promise<Object> - Color palette
  ```javascript
  {
    primary: {oklch: {L, C, h}, rgb: [r,g,b], ...},
    secondary: {...},
    accent: {...},
    neutral: {...},
    vibrant: {...},
    all: [...]  // Top 8 colors
  }
  ```
- **Example:**
  ```javascript
  const palette = await MonetEngine.get("image.jpg");
  console.log(palette.primary.rgb); // [r, g, b]
  ```

#### rgbToOklch(r, g, b)
Convert RGB to OKLch color space.
- **Parameters:**
  - `r, g, b` (0-255) - RGB values
- **Returns:** Object `{L, C, h}`
- **Example:**
  ```javascript
  const oklch = MonetEngine.rgbToOklch(255, 100, 50);
  // {L: 0.45, C: 0.2, h: 30}
  ```

#### oklchToRgb(L, C, h)
Convert OKLch to RGB.
- **Parameters:**
  - `L` (0-1) - Lightness
  - `C` (0-0.4) - Chroma/Saturation
  - `h` (0-360) - Hue in degrees
- **Returns:** [r, g, b] array

#### exportAsCSS(palette)
Export palette as CSS variables.
- **Returns:** Object with format `{"--primary": "oklch(...)", ...}`
- **Example:**
  ```javascript
  const css = MonetEngine.exportAsCSS(palette);
  // {"--primary": "oklch(0.450 0.200 30.0deg)"}
  ```

### Static Configuration

```javascript
MonetEngine.CONFIG = {
  minSampleSize: 16,        // Minimum canvas size
  maxSampleSize: 128,       // Maximum canvas size
  kMeansIterations: 8,      // K-Means iterations
  kMeansK: 16,              // Number of clusters
  entropyThreshold: 0.15,   // Image complexity threshold
  minSaturation: 0.05,      // Minimum saturation
  minLightness: 0.15,       // Minimum lightness
  maxLightness: 0.95,       // Maximum lightness
  qualityThreshold: 0.6     // Minimum quality score
}
```

### Color Space

MonetEngine uses **OKLch** color space:
- **L** (Lightness): 0 (dark) → 1 (bright)
- **C** (Chroma): 0 (grayscale) → 0.4 (high saturation)
- **h** (Hue): 0-360° (angle on color wheel)

---

## ShadesGenerator - Material Design 3 Shade Generation

Generates 13 tones (0-100) for each color following Material Design 3 guidelines.

### Static Methods

#### generate(palette, options = {})
Generate shade tones from MonetEngine palette.
- **Parameters:**
  - `palette` (object) - Output from `MonetEngine.get()`
  - `options` (object) - Optional configuration
- **Returns:** Object with structure:
  ```javascript
  {
    primary: {0: "oklch(...)", 10: "oklch(...)", ..., 100: "oklch(...)"},
    secondary: {...},
    accent: {...},
    neutral: {...},
    neutralVariant: {...}
  }
  ```
- **Example:**
  ```javascript
  const shades = ShadesGenerator.generate(palette);
  const darkColor = shades.primary[40];
  const lightColor = shades.primary[90];
  ```

#### getTone(shades, tone)
Get specific color from all palettes at the same tone.
- **Parameters:**
  - `shades` (object) - Output from `generate()`
  - `tone` (number) - Tone 0-100
- **Returns:** Object with color for each palette
  ```javascript
  {
    primary: "oklch(...)",
    secondary: "oklch(...)",
    accent: "oklch(...)",
    neutral: "oklch(...)",
    neutralVariant: "oklch(...)"
  }
  ```

#### getComplementaryTone(tone)
Get complementary tone for contrast (example: tone 40 → tone 90).
- **Parameters:**
  - `tone` (number) - Input tone
- **Returns:** number - Complementary tone

#### createSemanticTokens(shades)
Create semantic token map for Material Design 3.
- **Returns:** Object with tokens like `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, etc.
- **Example:**
  ```javascript
  const tokens = ShadesGenerator.createSemanticTokens(shades);
  // {primary: "oklch(...)", onPrimary: "oklch(...)", ...}
  ```

#### validate(shades)
Validate quality of generated shades.
- **Returns:** `{isValid: boolean, issues: string[]}`

#### exportAsCSS(shades, prefix = '')
Export shades as CSS custom properties.
- **Parameters:**
  - `prefix` (string) - Optional prefix (example: "color-")
- **Returns:** Object with CSS variables
  - **Example:** `{"--color-primary-40": "oklch(...)", ...}`

#### applyToDOM(shades, target = document.documentElement, prefix = '')
Apply shades directly to DOM element.
- **Example:**
  ```javascript
  ShadesGenerator.applyToDOM(shades);
  // CSS variables are now ready to use
  ```

#### createGradient(palette, fromTone = 0, toTone = 100)
Create CSS gradient from tone range.
- **Parameters:**
  - `palette` (object) - Single palette (example: `shades.primary`)
  - `fromTone` (number) - Start tone
  - `toTone` (number) - End tone
- **Returns:** string - CSS gradient value
- **Example:**
  ```javascript
  const grad = ShadesGenerator.createGradient(shades.primary, 30, 90);
  // "linear-gradient(90deg, oklch(...), oklch(...))"
  ```

### Tone Levels

Material Design 3 uses 13 tone levels:

```javascript
[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 100]
```

| Tone | Usage |
|------|-------|
| 0 | Darkest color |
| 10-30 | Dark backgrounds/containers |
| 40 | Primary/Secondary color |
| 50-60 | Mid tones |
| 90-95 | Light backgrounds/containers |
| 100 | White/Maximum brightness |

---

## Complete Usage Example

```javascript
// 1. Extract colors from image
const palette = await MonetEngine.get("wallpaper.jpg");

// 2. Generate shade tones
const shades = ShadesGenerator.generate(palette);

// 3. Validate results
const validation = ShadesGenerator.validate(shades);
if (validation.isValid) {
  console.log("Shades are valid!");
}

// 4. Apply to DOM
ShadesGenerator.applyToDOM(shades);

// 5. Use in CSS
// :root { --primary-40: oklch(...); --primary-90: oklch(...); }

// 6. Or export as CSS
const css = ShadesGenerator.exportAsCSS(shades, "md-");
// {"--md-primary-40": "oklch(...)", ...}

// 7. Create semantic tokens
const tokens = ShadesGenerator.createSemanticTokens(shades);
// {primary: "oklch(...)", onPrimary: "oklch(...)", ...}

// 8. Save theme
const saveSS = new SaveSS("my_themes");
saveSS.register({
  name: "extracted",
  ":root": Object.entries(css).reduce((acc, [k, v]) => {
    acc[k.replace("--", "")] = v;
    return acc;
  }, {})
});
saveSS.use("extracted");
```

---

## Workflow: Image to Theme

```javascript
// Simple 3-step workflow
async function createThemeFromImage(imageUrl, themeName) {
  // Step 1: Extract palette
  const palette = await MonetEngine.get(imageUrl);
  
  // Step 2: Generate shades
  const shades = ShadesGenerator.generate(palette);
  
  // Step 3: Apply and save
  ShadesGenerator.applyToDOM(shades);
  
  const saveSS = new SaveSS();
  saveSS.register({
    name: themeName,
    ":root": ShadesGenerator.exportAsCSS(shades)
  });
  saveSS.use(themeName);
}

// Usage
createThemeFromImage("image.jpg", "my_theme");
```

---

## Color Space Reference

### OKLch (Oklch Lightness Chroma Hue)
- **Advantage:** Perceptually uniform, natural hue progression
- **L (Lightness):** 0-1 (0 = black, 1 = white)
- **C (Chroma):** 0-0.4 (saturation/vividness)
- **h (Hue):** 0-360° (color angle)

### RGB (Red Green Blue)
- **Range:** 0-255 per channel
- **Format:** `[r, g, b]`
- **Example:** `[255, 100, 50]`

### Conversion Support
- RGB ↔ OKLch (built-in MonetEngine)
- OKLch → CSS `oklch(L C h)` (direct)

---

## Key Features

### MonetEngine
- ✅ K-Means clustering for proper color grouping
- ✅ Adaptive sampling based on image complexity
- ✅ Perceptual filtering (lightness & saturation)
- ✅ Multi-level extraction (primary, secondary, accent, neutral, vibrant)
- ✅ Quality scoring for harmonious results
- ✅ Cross-algorithm validation (K-Means + Median-Cut hybrid)
- ✅ Performance optimized (<500ms for most images)

### ShadesGenerator
- ✅ Material Design 3 compliant (13 tone levels)
- ✅ Semantic token mapping
- ✅ CSS export ready
- ✅ Quality validation
- ✅ Gradient creation support

### SaveSS
- ✅ localStorage persistence
- ✅ Multiple theme support
- ✅ Safe token sanitization
- ✅ Chainable API
