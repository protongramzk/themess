# Themess - Dynamic Color Theme Generation

A powerful JavaScript library for extracting color palettes from images and generating Material Design 3 compliant theme systems.

## Installation

Download the library from the repository:

- **UMD Build:** `themess.umd.js` - For direct browser usage
- **ESM Build:** `themess.esm.js` - For module bundlers (Webpack, Rollup, Vite)

### Using UMD (Browser)
```html
<script src="path/to/themess.umd.js"></script>
<script>
  const { SaveSS, ViewideEngine, ShadesGenerator } = window.ThemeSS;
</script>
```

### Using ESM (Bundler)
```javascript
import { SaveSS, ViewideEngine, ShadesGenerator } from './themess.esm.js';
```

---

## Quick Start

### 1. Extract Colors from Image
```javascript
const palette = await ViewideEngine.get("image.jpg");
console.log(palette.primary.rgb); // [r, g, b]
```

### 2. Generate Shade Tones
```javascript
const shades = ShadesGenerator.generate(palette);
```

### 3. Apply to DOM
```javascript
ShadesGenerator.applyToDOM(shades);
// CSS variables are now available: --primary-40, --primary-90, etc.
```

### 4. Save Theme (Optional)
```javascript
const saveSS = new SaveSS("my_themes");
saveSS.register({
  name: "dark",
  ":root": ShadesGenerator.exportAsCSS(shades)
});
saveSS.use("dark");
```

---

## Class Reference

### SaveSS - Theme Storage Manager

Manage and persist themes using localStorage.

#### Constructor
```javascript
const saveSS = new SaveSS(storageKey = "savess_store");
```

#### register(config)
Register a new theme.
```javascript
saveSS.register({
  name: "dark",
  ":root": {
    "primary-color": "oklch(0.45 0.2 30)",
    "bg-color": "#000000"
  }
});
```

#### use(name)
Apply a theme.
```javascript
saveSS.use("dark");
```

---

### ViewideEngine - Color Extraction Engine

Extract color palettes from images using K-Means clustering and Median-Cut algorithm.

#### get(imageUrl, options = {})
Extract comprehensive color palette from image.
```javascript
const palette = await ViewideEngine.get("wallpaper.jpg");

// Returns:
// {
//   primary: {oklch: {L, C, h}, rgb: [r,g,b], ...},
//   secondary: {...},
//   accent: {...},
//   neutral: {...},
//   vibrant: {...},
//   all: [...]
// }
```

#### rgbToOklch(r, g, b)
Convert RGB to OKLch color space.
```javascript
const oklch = ViewideEngine.rgbToOklch(255, 100, 50);
// {L: 0.45, C: 0.2, h: 30}
```

#### oklchToRgb(L, C, h)
Convert OKLch to RGB.
```javascript
const rgb = ViewideEngine.oklchToRgb(0.45, 0.2, 30);
// [255, 100, 50]
```

#### exportAsCSS(palette)
Export palette as CSS variables.
```javascript
const css = ViewideEngine.exportAsCSS(palette);
// {"--primary": "oklch(0.450 0.200 30.0deg)", ...}
```

---

### ShadesGenerator - Material Design 3 Shade Generation

Generate 13 tones (0-100) for each color following Material Design 3.

#### generate(palette, options = {})
Generate shade tones from ViewideEngine palette.
```javascript
const shades = ShadesGenerator.generate(palette);

// Returns:
// {
//   primary: {0: "oklch(...)", 10: "oklch(...)", ..., 100: "oklch(...)"},
//   secondary: {...},
//   accent: {...},
//   neutral: {...},
//   neutralVariant: {...}
// }
```

#### getTone(shades, tone)
Get specific color from all palettes at the same tone.
```javascript
const colors = ShadesGenerator.getTone(shades, 40);
// {primary: "oklch(...)", secondary: "oklch(...)", ...}
```

#### createSemanticTokens(shades)
Create semantic token map for Material Design 3.
```javascript
const tokens = ShadesGenerator.createSemanticTokens(shades);
// {primary: "oklch(...)", onPrimary: "oklch(...)", primaryContainer: "oklch(...)", ...}
```

#### exportAsCSS(shades, prefix = '')
Export shades as CSS custom properties.
```javascript
const css = ShadesGenerator.exportAsCSS(shades, "md-");
// {"--md-primary-0": "oklch(...)", "--md-primary-10": "oklch(...)", ...}
```

#### applyToDOM(shades, target, prefix = '')
Apply shades directly to DOM element.
```javascript
ShadesGenerator.applyToDOM(shades);
// CSS variables are set on document.documentElement
```

#### createGradient(palette, fromTone = 0, toTone = 100)
Create CSS gradient from tone range.
```javascript
const gradient = ShadesGenerator.createGradient(shades.primary, 30, 90);
// "linear-gradient(90deg, oklch(...), oklch(...))"
```

#### validate(shades)
Validate quality of generated shades.
```javascript
const result = ShadesGenerator.validate(shades);
// {isValid: true, issues: []}
```

---

## Complete Example

```javascript
// Extract colors from image
const palette = await ViewideEngine.get("wallpaper.jpg");

// Generate Material Design 3 shades
const shades = ShadesGenerator.generate(palette);

// Validate
const validation = ShadesGenerator.validate(shades);
if (!validation.isValid) {
  console.warn("Issues:", validation.issues);
}

// Apply to DOM
ShadesGenerator.applyToDOM(shades);

// Get CSS for export
const css = ShadesGenerator.exportAsCSS(shades, "color-");

// Create semantic tokens
const tokens = ShadesGenerator.createSemanticTokens(shades);
console.log(tokens.primary);    // Primary color tone 40
console.log(tokens.onPrimary);  // Text color for primary

// Save theme
const saveSS = new SaveSS("my_app_themes");
saveSS.register({
  name: "wallpaper_theme",
  ":root": css
});
saveSS.use("wallpaper_theme");
```

---

## Tone Levels

Material Design 3 uses 13 tone levels (0-100):

| Tone | Usage |
|------|-------|
| 0 | Darkest color |
| 10-30 | Dark backgrounds/containers |
| 40 | Primary/Secondary color |
| 50-60 | Mid tones |
| 90-95 | Light backgrounds/containers |
| 100 | White/Maximum brightness |

---

## Color Spaces

### OKLch (Used internally)
- **L (Lightness):** 0-1 (0 = black, 1 = white)
- **C (Chroma):** 0-0.4 (saturation/vividness)
- **h (Hue):** 0-360° (color angle)

### RGB (Input/Output)
- **Range:** 0-255 per channel
- **Format:** `[r, g, b]`

---

## Features

✅ **Smart Color Extraction**
- K-Means clustering for color grouping
- Adaptive sampling based on image complexity
- Perceptual filtering (exclude noise)
- Quality scoring for harmonious results

✅ **Material Design 3 Compliant**
- 13 tone levels per color
- Semantic token generation
- Contrast-aware color selection

✅ **Easy Integration**
- Apply directly to DOM
- Export as CSS variables
- localStorage persistence
- Chainable API

✅ **Performance Optimized**
- Extracts colors in <500ms
- Minimal bundle size
- No dependencies

---

## Usage Tips

### For Dynamic Theming
```javascript
// Change theme on button click
document.getElementById("change-theme").addEventListener("click", async () => {
  const palette = await ViewideEngine.get(imageUrl);
  const shades = ShadesGenerator.generate(palette);
  ShadesGenerator.applyToDOM(shades);
});
```

### For Persistent Themes
```javascript
const saveSS = new SaveSS("app_themes");

// Save multiple themes
["dark", "light", "custom"].forEach(name => {
  saveSS.register({name, ":root": themes[name]});
});

// Load saved theme on app start
const savedTheme = localStorage.getItem("app_themes");
if (savedTheme) {
  const stored = JSON.parse(savedTheme);
  saveSS.use(stored.active);
}
```

### For Specific Tones
```javascript
const shades = ShadesGenerator.generate(palette);

// Get colors for specific use cases
const darkBackground = shades.primary[20];
const lightText = shades.primary[98];
const accentColor = shades.accent[40];
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 87+
- Safari 15+
- Requires CORS enabled for image URLs

---

## License

MIT
