# Hyper Reel

An intuitive AI movie generation tool that lets users create stunning AI-powered visual sequences.

## Features

- 📁 **Project Management**: Organize your work into projects with a clean grid interface
- 🎬 **Scene Sequencing**: Create and arrange scenes in a visual canvas
- 🖼️ **Image Generation**: Generate AI images using Wavespeed's Qwen Edit model
- 🎨 **Interactive Canvas**: Zoom, pan, and arrange scenes/images with React Flow
- 💾 **Local Storage**: All data persists in your browser's localStorage
- 🌑 **Dark Theme**: Beautiful dark interface optimized for creative work

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Wavespeed API key ([Get one here](https://wavespeed.ai))

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

### 1. Set Up Your API Key

Click the settings icon (⚙️) in the header and enter your Wavespeed API key. This is stored locally and never leaves your browser.

### 2. Create a Project

From the home page, click "New Project" and give it a name.

### 3. Add Scenes

In your project canvas:
- Click "Add Scene" to create a new scene
- Scenes are arranged horizontally with start/end nodes
- Click any scene to view its images

### 4. Generate Images

In a scene:
- Click "Add Image" or select an existing image node
- Upload 1-3 reference images
- Write a prompt describing what you want
- Adjust size and other settings if needed
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
- **Canvas**: React Flow
- **API**: Wavespeed AI (Qwen Edit model)

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

All data is stored in your browser's localStorage:
- Projects and their metadata
- Scenes and their order
- Images and selected outputs
- Generation history (until page refresh)
- API key settings

## API

This app uses the Wavespeed API for image generation:
- **Model**: Qwen Edit Plus
- **Endpoint**: `https://api.wavespeed.ai/api/v3/wavespeed-ai/qwen-image/edit-plus`
- **Features**: Base64 output, sync mode, up to 3 reference images

## License

MIT

