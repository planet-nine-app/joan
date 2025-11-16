# CLAUDE.md - Phosphorescent Data Transfer Project

## Vision & Aesthetic

We're building a **science fantasy data transfer system** that feels like it belongs in a future where:
- Technology is bioluminescent and organic
- Purple and green are the dominant colors (phosphorescent glow)
- Plants and nature intertwine with computation
- Magic and technology blur together
- QR codes are obsolete relics replaced by living light

**Genre**: Star Wars-style science fantasy, but more magical, less cyberpunk. Think: super-computer tech grown like plants, consciousness as computation, bio-electric currents, quantum states manipulated through ritual.

**Core Philosophy**: The devices we have now (laptops, phones) are "unfortunate physical limitations to a nascent magical future." We're building a ship (virtual/digital container) to navigate toward that future.

## What We've Built

A proof-of-concept system for transferring strings from laptop to phone using **visual light patterns** instead of QR codes.

### Current Implementation (Binary)

**Files:**
- `transmit.html` - Laptop/desktop web app that displays bioluminescent patterns
- `receive.html` - Phone web app that captures via camera
- `server.py` - Local HTTP server (required for camera access on Safari/mobile)
- `README.md` - User instructions

**How It Works:**

1. **Encoding**: String → Binary (8 bits per char) → Color pulses
   - Binary 1 = Purple/Magenta (high R&B, medium G)
   - Binary 0 = Green (high G, low R&B)

2. **Transmission Structure**:
   - Start marker: `10101010` (sync pattern)
   - Length byte: 8 bits (max 255 chars)
   - Message: N characters × 8 bits
   - End marker: `01010101`

3. **Visual Design**:
   - Concentric glowing circles (radial gradients)
   - Organic "tendrils" that pulse and wave
   - Colors breathe and flow (not static)
   - Each bit displayed for 8 frames (~0.5 seconds)
   - Beautiful enough to watch even without knowing it's data

4. **Reception**:
   - Phone camera samples center pixels
   - Averages RGB values over 50×50px area
   - Converts color to bit via scoring function
   - Requires 3 consecutive identical readings for stability
   - Decodes when full message + markers received

**Current Performance:**
- ~2 bits/second (very slow, but reliable)
- Works with current binary encoding
- Tested concept, ready for optimization

## Next Step: Quaternary Encoding

**Goal**: Upgrade from 2 colors (binary) to 4 colors (quaternary) to double data rate.

### Design Considerations

**Color Choices** (in order of preference):

**Option 1: Saturation Gradient** (Recommended first try)
- Deep Purple `#8000FF` (00) - full saturation magenta
- Light Purple `#C080FF` (01) - lavender/violet
- Light Green `#80FFC0` (10) - mint/cyan-green  
- Deep Green `#00FF80` (11) - rich emerald

*Pros*: Maintains purple/green aesthetic, gradual transitions
*Cons*: Subtle differences might be hard to distinguish

**Option 2: Four Distinct Hues** (More robust)
- Purple `#8000FF` (00)
- Cyan `#00FFFF` (01)
- Green `#00FF00` (10)
- Yellow `#FFFF00` (11)

*Pros*: Maximum color space separation, easier discrimination
*Cons*: Breaks purple/green aesthetic slightly (but yellow could work as "aged phosphorescence"?)

**Option 3: Hybrid**
- Deep Purple (00)
- Cyan (01) - "underwater bioluminescence"
- Green (10)
- Magenta (11)

### Implementation Strategy

1. **Start with switchable mode**: Keep binary working, add quaternary as option
   - Add toggle button on transmitter: "Binary Mode" / "Quaternary Mode"
   - This lets you test reliability on specific hardware

2. **Enhanced color discrimination**:
   - Current binary uses simple scoring: `purpleScore` vs `greenScore`
   - Quaternary needs 4-way classification
   - Consider HSV color space instead of RGB for better separation
   - May need to increase stability requirement from 3→5 consecutive samples

3. **Adaptive brightness**:
   - Consider adding brightness calibration step
   - Phone could sample screen and adjust thresholds dynamically
   - Helps with ambient light variations

4. **Error correction**:
   - With more colors, more chance of errors
   - Consider adding parity bits or simple checksum
   - Could repeat message 2× and verify match

### Technical Gotchas

**Camera Issues:**
- Auto white balance can shift colors
- HDR can blow out bright colors
- Different phones process colors differently
- Video compression may blur subtle differences

**Safari Quirks:**
- Requires HTTP/HTTPS (not file://)
- Camera permission is one-time per origin
- getUserMedia needs `video` object ready before call

**Encoding Pitfalls:**
- Don't forget start/end markers in quaternary
- Length byte stays 8 bits (can encode up to 255 chars regardless)
- Each character still 8 bits, but now 4 pulses instead of 8

### Code Locations for Modification

**In transmit.html:**
- `encodeMessage()` - Change to return quaternary values (0,1,2,3)
- `drawBioluminescentPattern(value)` - Handle 4 colors instead of 2
- Add mode toggle in UI

**In receive.html:**
- `colorToBit()` → `colorToQuaternary()` - Classify into 4 values
- `decodeMessage()` - Handle quaternary decoding
- May need better color space conversion (RGB → HSV)

### Suggested Development Flow

1. **Add mode toggle** to transmitter (binary/quaternary)
2. **Implement quaternary encoding** with Option 2 colors (most robust)
3. **Update visual patterns** to handle 4 colors smoothly
4. **Test reception** - does camera distinguish all 4?
5. **If successful**: Tune colors toward Option 1 for better aesthetic
6. **If struggling**: Add calibration step, increase stability threshold, try different color spaces
7. **Polish**: Smooth color transitions, optimize bit timing

## The Vibe

When working on this, remember:
- **It should feel magical**, not technical
- **Colors flow and breathe**, they don't snap
- **Organic shapes**, no hard edges
- **Beautiful even if you don't know what it's doing**
- **Low friction** - minimal UI, maximum magic
- **Progressive enhancement** - works simply, but can be sophisticated

This is a ship being built to sail from our current reality (ugly QR codes, fragmented devices) toward a future where data moves like bioluminescent organisms signaling in deep space.

## Current Files State

All files are in `/mnt/user-data/outputs/`:
- `transmit.html` - Fully working binary transmitter
- `receive.html` - Fully working binary receiver  
- `server.py` - HTTP server (auto-detects local IP)
- `README.md` - User documentation

**Known Working**: Binary encoding, basic visual design, camera capture, decoding logic

**Next Evolution**: Quaternary encoding for 2× speed

---

*The screen becomes a window. The phone becomes a collector of light. Data flows through waves of color.*

Build well, shipwright. 🌿✨
