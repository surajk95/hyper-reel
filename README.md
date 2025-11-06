# Hyper Reel

An intuitive AI movie generation tool that lets users create stunning AI-powered visual sequences.

## Features

- 📁 **Project Management**: Organize your work into projects with a clean grid interface
- 🎬 **Scene Sequencing**: Create and arrange scenes in a visual canvas
- 🖼️ **Image Generation**: Generate AI images using multiple providers (Wavespeed & Google Gemini)
- 🎨 **Interactive Canvas**: Zoom, pan, and arrange scenes/images with React Flow
- 💾 **Local Storage**: All data persists in your browser's IndexedDB
- 🌑 **Dark Theme**: Beautiful dark interface optimized for creative work
- ✨ **Multiple AI Models**: Choose from Qwen Edit, Wan 2.2, or Gemini 2.5 Flash

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- API keys for one or more providers:
  - Wavespeed API key ([Get one here](https://wavespeed.ai)) - for Qwen Edit & Wan 2.2 models
  - Gemini API key ([Get one here](https://ai.google.dev/gemini-api/docs)) - for Gemini 2.5 Flash models

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to start creating.

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

### 1. Set Up Your API Keys

Click the settings icon (⚙️) in the header and enter your API keys:
- **Wavespeed API Key**: For Qwen Edit and Wan 2.2 models
- **Gemini API Key**: For Gemini 2.5 Flash models

API keys are stored locally in your browser and only sent to their respective providers.

### 2. Create a Project

From the home page, click "New Project" and give it a name.

### 3. Add Scenes

In your project canvas:
- Click "Add Scene" to create a new scene
- Scenes are arranged horizontally with start/end nodes
- Click any scene to view its images

### 4. Generate Images

In a project:
- Click the "Generate" button
- Choose your model from the Advanced Settings (⚙️):
  - **Qwen Edit**: Image-to-image editing (requires 1-3 input images)
  - **Wan 2.2**: Text-to-image generation
  - **Gemini 2.5 Flash (Text-to-Image)**: Advanced text-to-image
  - **Gemini 2.5 Flash (Image Edit)**: Edit images with text prompts
- Upload reference images (if using an image editing model)
- Write a prompt describing what you want
- Adjust size, aspect ratio, and other settings if needed
- Click "Generate"

### 5. Manage Generations

- View all historical generations for each image
- Click any generated image to view it fullscreen
- Select your favorite output to use in the scene
- Download images by clicking the download button in fullscreen mode

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Storage**: IndexedDB (via idb)
- **Canvas**: React Flow
- **AI Providers**:
  - Wavespeed AI (Qwen Edit, Wan 2.2)
  - Google Gemini (Gemini 2.5 Flash)

## Project Structure

```
src/
├── components/        # React components
├── pages/            # Page components
├── stores/           # Zustand state stores
├── hooks/            # Custom hooks (including localStorage)
├── services/         # API services
├── types/            # TypeScript types
└── lib/              # Utility functions
```

## Storage

All data is stored in your browser's IndexedDB and localStorage:
- **IndexedDB**: Projects, media items, and image data
- **localStorage**: API keys and settings

## AI Models

### Wavespeed Models

**Qwen Edit** - Image-to-image editing
- Endpoint: `https://api.wavespeed.ai/api/v3/wavespeed-ai/qwen-image/edit-plus`
- Features: Up to 3 reference images, base64 output, sync mode

**Wan 2.2** - Text-to-image generation
- Endpoint: `https://api.wavespeed.ai/api/v3/wavespeed-ai/wan-2.2/text-to-image-lora`
- Features: Custom LoRA support, high-quality outputs

### Gemini Models

**Gemini 2.5 Flash** - Text-to-image and image editing
- Model: `gemini-2.5-flash-image`
- Features: 
  - High-fidelity text rendering
  - Multiple aspect ratios (1:1, 16:9, 9:16, etc.)
  - Conversational image refinement
  - Mask-free editing

For more details on Gemini integration, see [GEMINI_INTEGRATION.md](./GEMINI_INTEGRATION.md).

## License

MIT

