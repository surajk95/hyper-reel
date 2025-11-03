# Hyper Reel - AI Movie Generation Tool

## Tech Stack

- **Framework**: Vite + React + React Router
- **Canvas**: React Flow (for node connections, zoom, pan)
- **UI Components**: shadcn/ui (with Tailwind CSS)
- **Icons**: Lucide React (comes with shadcn)
- **Storage**: localStorage (via custom hook for easy replacement)
- **State Management**: Zustand + hooks
- **Notifications**: shadcn/ui Toast (or sonner)

## Core Architecture

### Data Structure

```typescript
// LocalStorage schema
interface Project {
  id: string;
  title: string;
  thumbnail?: string; // base64 image
  createdAt: number;
  updatedAt: number;
}

interface Scene {
  id: string;
  projectId: string;
  title: string;
  position: number; // order in sequence
  selectedImageId?: string;
  createdAt: number;
}

interface SceneImage {
  id: string;
  sceneId: string;
  title: string;
  position: number;
  selectedOutputIndex: number; // which generation result is selected
  createdAt: number;
}

interface GenerationResult {
  imageId: string;
  outputs: string[]; // base64 images from API
  prompt: string;
  inputImages: string[]; // base64
  timestamp: number;
}

interface Settings {
  wavespeedApiKey?: string;
}
```

### Routing Structure

- `/` - Projects grid
- `/project/:projectId` - Project canvas (scenes)
- `/project/:projectId/scene/:sceneId` - Scene canvas (images)

## Implementation Steps

### 1. Project Setup

- Initialize Vite + React + TypeScript
- Install dependencies: `react-router-dom`, `reactflow`, `zustand`, `axios`
- Set up shadcn/ui with Tailwind (dark theme preset)
- Install shadcn components: Dialog, Button, Input, Textarea, Select, Toast
- Configure dark theme (black background, white text)
- Set up routing structure

### 2. Storage Layer (`hooks/useStorage.ts`)

- Create custom hook for localStorage operations
- CRUD operations for: Projects, Scenes, SceneImages, GenerationResults, Settings
- Helper functions: `getProjects()`, `createProject()`, `updateProject()`, `deleteProject()`
- Similar functions for Scenes and SceneImages
- `getApiKey()`, `setApiKey()` for settings

### 3. Projects View (`/`)

- Grid layout with "New Project" as first card
- Project cards: thumbnail (or placeholder icon), title below
- Click → navigate to `/project/:id`
- Create new project dialog (simple title input)

### 4. Project Canvas (`/project/:projectId`)

- React Flow canvas with:
  - Dotted background pattern
  - Zoom controls (+ / - buttons, mouse wheel)
  - Pan with hand tool (React Flow default)
- Custom scene nodes:
  - Dark gray rounded rectangle
  - Left: thumbnail (icon placeholder for now)
  - Right: title text
- Horizontal auto-layout with connectors
- Start/End nodes (special styling, non-editable)
- Insert functionality:
  - Hover on Start/End → show "+" button
  - Hover on connector between nodes → show insert button
- Click scene node → navigate to `/project/:projectId/scene/:sceneId`

### 5. Scene Canvas (`/project/:projectId/scene/:sceneId`)

- Similar React Flow setup as project canvas
- Image nodes instead of scene nodes
- Same insert/hover patterns
- Click image node → open detail dialog

### 6. Combined Image Dialog (Preview + Generation)

**Two modes based on node state:**

**A. New Node (no existing image):**

- Only show generation section (no preview)
- After generation, show results grid with "Select" buttons
- Selected image becomes the node's active image

**B. Existing Node (has image):**

- **Top Section - Preview**:
  - Current selected image (large preview)
  - Title input (editable)
  - Click image → open full-screen viewer
  - All historical generation results as thumbnail grid below
    - Grouped by generation (with timestamp/prompt info)
    - Each thumbnail has "Select" button
    - Highlight currently selected image
- **Bottom Section - Generation (same as new node)**:
  - Collapsible or scrollable section
  - "Generate New" or "Redo" button to expand/focus

**Generation Section (both modes):**

- **Prompt**: Large textarea
- **Input Images**: 
  - Thumbnail grid (max 3 images)
  - First item: "+" add image button
  - File upload → convert to base64
  - Remove image button on each thumbnail
- **Model Selector**: Dropdown (locked to "Qwen Edit" for now)
- **Size Selector**: Dropdown with options + custom input
  - Options: 512*512, 1024*1024 (default), 1536*1536
  - Custom: width*height input field
- **Advanced**: 
  - Seed input (default -1)
  - Output format: jpeg/png/webp (default jpeg)
- **Generate** button
- After generation: show new results with "Select" buttons
- **Important**: Append new results, don't replace old ones

### 7. Full-Screen Image Viewer Component

- Create reusable `<FullscreenImage>` wrapper component
- Usage: `<FullscreenImage src={...} alt={...}>` wraps any image
- Automatically handles:
  - Click to open full-screen overlay
  - Fit to window (maintain aspect ratio)
  - Dark background with close button (X or ESC key)
  - Download button
  - Optional: Navigation arrows if part of a gallery (prev/next)
- Use this wrapper throughout the app for all user-generated images

### 8. Wavespeed API Integration (`services/wavespeed.ts`)

- API endpoint: `https://api.wavespeed.ai/api/v3/wavespeed-ai/qwen-image/edit-plus`
- Request format:
```typescript
{
  enable_base64_output: true,
  enable_sync_mode: true,
  images: string[], // base64 data URIs (data:image/jpeg;base64,...)
  output_format: "jpeg" | "png" | "webp",
  prompt: string,
  seed: number,
  size: string // "1024*1024"
}
```

- Handle response, extract base64 outputs
- Error handling with toast notifications
- Success toast with preview

### 9. Settings Dialog

- Accessible from header/nav (settings icon)
- API Key input field (password type)
- Save to localStorage
- "Test Connection" button (optional)

### 10. API Key Flow

- Check for API key before generation
- If missing → show prompt dialog with link to settings
- After entering key → proceed with generation

### 11. UI Polish

- Dark theme: black (#000000 or #0a0a0a) background, white text
- Subtle gray borders/separators (#333333)
- Skeleton loading states
- Toast notifications (success/error/loading)
- Responsive design (desktop-first, but mobile-friendly)
- Hover states, transitions
- Loading spinners during API calls

## Key Files Structure

```
src/
├── components/
│   ├── ProjectCard.tsx
│   ├── ProjectsGrid.tsx
│   ├── SceneNode.tsx (custom React Flow node)
│   ├── ImageNode.tsx
│   ├── Canvas.tsx (reusable React Flow wrapper)
│   ├── GenerationDialog.tsx
│   ├── ImageDetailDialog.tsx
│   ├── SettingsDialog.tsx
│   └── Header.tsx
├── hooks/
│   └── useStorage.ts
├── services/
│   └── wavespeed.ts
├── types/
│   └── index.ts
├── pages/
│   ├── ProjectsPage.tsx
│   ├── ProjectCanvasPage.tsx
│   └── SceneCanvasPage.tsx
├── App.tsx
└── main.tsx
```

## Notes

- **Assumption**: Wavespeed API accepts base64 data URIs (e.g., `data:image/jpeg;base64,...`) in the `images` array input
- All images stored as base64 in localStorage for persistence
- Generation results retained until page refresh (not persisted long-term)
- Clean, minimal UI with focus on usability