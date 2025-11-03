export interface Project {
  id: string;
  title: string;
  thumbnail?: string; // base64 image
  createdAt: number;
  updatedAt: number;
}

export interface Scene {
  id: string;
  projectId: string;
  title: string;
  position: number; // order in sequence
  selectedImageId?: string;
  createdAt: number;
}

export interface SceneImage {
  id: string;
  sceneId: string;
  title: string;
  position: number;
  selectedOutputIndex: number; // which generation result is selected
  createdAt: number;
}

export interface GenerationResult {
  imageId: string;
  outputs: string[]; // base64 images from API
  prompt: string;
  inputImages: string[]; // base64
  seed: number;
  size: string;
  outputFormat: string;
  timestamp: number;
}

export interface Settings {
  wavespeedApiKey?: string;
}

export type OutputFormat = "jpeg" | "png" | "webp";

export interface GenerationRequest {
  enable_base64_output: boolean;
  enable_sync_mode: boolean;
  images: string[];
  output_format: OutputFormat;
  prompt: string;
  seed: number;
  size: string;
}

export interface PredictionResponse {
  created_at: string;
  has_nsfw_contents?: boolean[];
  id: string;
  model: string;
  outputs: string[];
  status: string;
  urls?: object;
}

