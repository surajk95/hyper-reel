# Hyper Reel - Quick Start Guide

## What You Just Built

Hyper Reel is a fully functional AI movie generation tool with:

✅ **Project Management** - Grid view with create/select projects
✅ **Scene Canvas** - Visual node-based scene sequencing with React Flow
✅ **Image Generation** - Full Wavespeed Qwen Edit API integration
✅ **History Management** - All generations are saved and selectable
✅ **Fullscreen Viewer** - Click any image to view/download fullscreen
✅ **Dark Theme** - Beautiful black theme throughout
✅ **LocalStorage** - All data persists in browser
✅ **Settings** - API key management with local storage

## Running the App

The dev server is already running! Visit:

```
http://localhost:1234
```

If you need to restart it:

```bash
npm run dev
```

## First Steps

### 1. Add Your API Key
- Click the settings icon (⚙️) in the top right
- Enter your Wavespeed API key
- Click Save

### 2. Create Your First Project
- Click "New Project" card on the home page
- Enter a project name
- Click Create

### 3. Add a Scene
- You'll see a canvas with Start and End nodes
- Click "Add Scene" button (bottom right)
- Enter a scene name

### 4. Generate Your First Image
- Click the scene node to enter it
- Click "Add Image" button
- In the dialog:
  - Upload 1-3 reference images (click the + box)
  - Write a prompt describing what you want
  - Adjust size if needed (default: 1024*1024)
  - Click "Generate"

### 5. Select and Manage Images
- After generation, click "Select" on your preferred output
- All previous generations remain available
- Click any image to view fullscreen
- Download from fullscreen mode

## Project Structure

```
hyper-reel/
├── src/
│   ├── components/          # UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Header.tsx      # App header with settings
│   │   ├── ProjectCard.tsx # Project grid cards
│   │   ├── SceneNode.tsx   # React Flow scene node
│   │   ├── ImageNode.tsx   # React Flow image node
│   │   ├── ImageDialog.tsx # Combined generation/preview dialog
│   │   ├── SettingsDialog.tsx
│   │   └── FullscreenImage.tsx
│   ├── pages/
│   │   ├── ProjectsPage.tsx      # Home page
│   │   ├── ProjectCanvasPage.tsx # Scene sequencing
│   │   └── SceneCanvasPage.tsx   # Image sequencing
│   ├── stores/              # Zustand state management
│   │   ├── useProjectsStore.ts
│   │   ├── useScenesStore.ts
│   │   ├── useSceneImagesStore.ts
│   │   ├── useGenerationStore.ts
│   │   └── useSettingsStore.ts
│   ├── hooks/
│   │   └── useStorage.ts   # localStorage abstraction
│   ├── services/
│   │   └── wavespeed.ts    # API integration
│   └── types/
│       └── index.ts        # TypeScript types
```

## Key Features Implemented

### Canvas Controls
- **Pan**: Click and drag on empty space
- **Zoom**: Mouse wheel or zoom controls
- **Add Node**: Bottom right button
- **Navigate**: Click any node

### Image Dialog
- **New Images**: Shows only generation form
- **Existing Images**: Shows preview + history + generation
- **Multi-generation**: All results are saved
- **Selection**: Click "Select" on any output

### Fullscreen Viewer
- **Open**: Click any image
- **Close**: X button or ESC key
- **Download**: Download button in top right

### LocalStorage Keys
- `hyper-reel-projects`
- `hyper-reel-scenes`
- `hyper-reel-scene-images`
- `hyper-reel-generation-results`
- `hyper-reel-settings`

## API Integration

The app uses Wavespeed's Qwen Edit Plus model:

```typescript
{
  enable_base64_output: true,  // Images returned as base64
  enable_sync_mode: true,      // Synchronous API calls
  images: string[],            // 1-3 base64 images
  prompt: string,              // Your description
  size: "1024*1024",          // Or custom
  seed: -1,                    // Random seed
  output_format: "jpeg"        // jpeg/png/webp
}
```

## Customization

### Change Model (Future)
Currently locked to "Qwen Edit". To add more models:
1. Update `ImageDialog.tsx` model selector
2. Add new API endpoints in `services/wavespeed.ts`
3. Update types if needed

### Add Cloud Storage
Replace `hooks/useStorage.ts` functions with API calls while keeping the same interface.

### Styling
- Colors: `src/index.css` (CSS variables)
- Components: Tailwind classes throughout
- Theme: Already dark-only

## Troubleshooting

### Build Errors
```bash
npm run build
```
Should complete without errors.

### Dev Server Issues
```bash
# Kill existing process
# Start fresh
npm run dev
```

### API Errors
- Check your API key in settings
- Verify image uploads (max 3, valid formats)
- Check browser console for detailed errors

### Storage Issues
Open browser DevTools → Application → Local Storage → Check keys

## Next Steps

Consider adding:
- Video generation support
- Export functionality (JSON/video)
- Collaboration features
- More AI models
- Undo/redo functionality
- Keyboard shortcuts
- Drag-and-drop reordering

Enjoy building with Hyper Reel! 🎬

