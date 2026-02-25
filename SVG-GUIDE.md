# Complete XML/SVG Code Guide for Timetable Generator Diagrams

## Files Created:
1. **usecase-diagram.svg** - Use case diagram with actors and optimization algorithms
2. **activity-diagram.svg** - Activity flow diagram showing the complete workflow

---

## SVG/XML Structure Overview

### Standard SVG Declaration
```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink" 
     viewBox="0 0 1000 1400" 
     width="1000px" 
     height="1400px">
```

### Key SVG Elements Used:

#### 1. **Rectangles** (for use cases and activities)
```xml
<rect fill="#7ED321" 
      height="36" 
      rx="4" 
      ry="4" 
      stroke="#5CA314" 
      stroke-width="2" 
      width="100" 
      x="390" 
      y="-668"/>
```
- `fill` - Background color (HEX code)
- `stroke` - Border color
- `stroke-width` - Border thickness
- `rx`, `ry` - Corner radius (rounded corners)
- `x`, `y` - Position coordinates
- `width`, `height` - Dimensions

#### 2. **Circles/Ellipses** (for actors and decision points)
```xml
<ellipse cx="50" 
         cy="-650" 
         fill="#4A90E2" 
         rx="45" 
         ry="18" 
         stroke="#2E5C8A" 
         stroke-width="2"/>
```
- `cx`, `cy` - Center coordinates
- `rx`, `ry` - Horizontal and vertical radius

#### 3. **Polygons** (for decision diamonds)
```xml
<polygon fill="#FFD700" 
         points="500,-1050 550,-1080 500,-1110 450,-1080" 
         stroke="#CDC20F" 
         stroke-width="2"/>
```
- `points` - Space-separated x,y coordinates forming the shape

#### 4. **Text Labels**
```xml
<text fill="#ffffff" 
      font-family="Times,serif" 
      font-size="14.00" 
      text-anchor="middle" 
      x="500" 
      y="-646.3">
    Add Modules
</text>
```

#### 5. **Connections/Paths** (arrows)
```xml
<path fill="none" 
      stroke="#000000" 
      stroke-width="2" 
      d="M500,-1320C500,-1310 500,-1300 500,-1290"/>
<polygon fill="#000000" 
         points="503.5,-1290 500,-1280 496.5,-1290 503.5,-1290" 
         stroke="#000000" 
         stroke-width="2"/>
```
- `d` - Path definition (M=move, C=cubic curve, L=line)
- `<polygon>` creates arrowhead

---

## Color Code Reference

### Actors (Use Case Diagram)
- **Blue**: `#4A90E2` - Main coordinators and admin

### Use Cases
- **Green**: `#7ED321` - Core functionalities
- **Stroke**: `#5CA314` - Green border

### Optimization Algorithms
- **Genetic**: `#F39C12` (Orange)
- **ACO**: `#3498DB` (Blue)
- **PSO**: `#9B59B6` (Purple)

### System Services
- **Purple**: `#BD10E0` - Validation, optimization, conflict resolution

### Activity Flow
- **Green**: `#2ECC71` - Start
- **Red**: `#E74C3C` - End/Error
- **Teal**: `#1ABC9C` - Database operations
- **Orange**: `#E67E22` - Comparison
- **Dark Red**: `#C0392B` - Selection
- **Yellow**: `#FFD700` - Decision points

---

## How to Use These SVG Files

### 1. **View in Browser**
```bash
# Windows
start usecase-diagram.svg

# Or double-click the file
```

### 2. **Edit in Design Tools**
- **Adobe Illustrator** - File > Open
- **Figma** - Drag and drop the SVG file
- **Inkscape** (Free) - Open directly
- **Online Editor** - https://editor.method.ac/

### 3. **Convert to Other Formats**
```bash
# PNG (using ImageMagick)
convert usecase-diagram.svg usecase-diagram.png

# PDF
convert activity-diagram.svg activity-diagram.pdf

# JPG
convert usecase-diagram.svg -quality 95 usecase-diagram.jpg
```

### 4. **Embed in Website**
```html
<img src="usecase-diagram.svg" alt="Use Case Diagram" />

<!-- Or inline -->
<svg><!-- SVG content --></svg>
```

### 5. **Embed in HTML/React**
```javascript
import UsecaseDiagram from './usecase-diagram.svg';

export default function App() {
  return <img src={UsecaseDiagram} alt="diagram" />;
}
```

---

## Customization Guide

### Change Colors
Find the color code (HEX) and replace:
```xml
<!-- Before -->
<rect fill="#7ED321" ... />

<!-- After -->
<rect fill="#FF5733" ... />
```

### Common HEX Colors
- Red: `#FF5733`
- Blue: `#3498DB`
- Green: `#2ECC71`
- Yellow: `#F4D03F`
- Purple: `#9B59B6`
- Teal: `#1ABC9C`

### Change Text
```xml
<text>Old Text</text>
<!-- Change to -->
<text>New Text</text>
```

### Resize Shape
```xml
<!-- Increase width -->
<rect width="200" ... />

<!-- Move shape -->
<rect x="500" y="300" ... />
```

---

## File Locations
```
c:\Users\thiyu\OneDrive\Desktop\timetable-generator\
├── usecase-diagram.svg
├── activity-diagram.svg
└── svg-guide.md (this file)
```

---

## Advantages of SVG Format

✅ **Scalable** - Works on any screen size without pixelation
✅ **Editable** - Can modify with text editors or design tools
✅ **Lightweight** - Smaller file size than PNG/JPG
✅ **Web-friendly** - Direct embedding in HTML/CSS
✅ **High-quality** - Perfect for printing
✅ **Exportable** - Convert to PNG, PDF, JPG easily

---

## Next Steps

1. ✅ Diagrams created as SVG files
2. View them in your browser or design tool
3. Export to PNG/JPG/PDF as needed
4. Import into Figma for team collaboration
5. Use in project documentation

---

**Created**: February 24, 2026
**Format**: SVG (Scalable Vector Graphics)
**Tools**: Mermaid (diagram generation) → SVG export
