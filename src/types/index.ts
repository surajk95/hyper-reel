export interface Project {
  id: string;
  title: string;
  thumbnail?: string; // base64 image
  createdAt: number;
  updatedAt: number;
}

export type MediaType = 'generation' | 'upload';

export interface MediaItem {
  id: string;
  projectId: string;
  type: MediaType;
  imageData: string; // base64 data URI
  prompt?: string;
  modelId?: string;
  size?: string;
  seed?: number;
  outputFormat?: OutputFormat;
  inputImageIds?: string[]; // references to other MediaItem IDs
  archived?: boolean; // Whether the item is archived
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  wavespeedApiKey?: string;
  geminiApiKey?: string;
  mediaViewerSidebarCollapsed?: boolean;
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

export interface LoraConfig {
  path: string;
  scale: number;
}

export interface GenerationRequestWan22 {
  enable_base64_output: boolean;
  enable_sync_mode: boolean;
  loras: LoraConfig[];
  high_noise_loras: LoraConfig[];
  low_noise_loras: LoraConfig[];
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

// Model Registry
export interface ModelInfo {
  id: string;
  displayName: string;
  supportsImageInput: boolean;
  provider: 'wavespeed' | 'gemini';
}

export const MODEL_REGISTRY: ModelInfo[] = [
  { id: 'qwen-edit', displayName: 'Qwen Edit', supportsImageInput: true, provider: 'wavespeed' },
  { id: 'wan-2.2', displayName: 'Wan 2.2', supportsImageInput: false, provider: 'wavespeed' },
  { id: 'gemini-2.5-flash-image', displayName: 'Gemini 2.5 Flash (Text-to-Image)', supportsImageInput: false, provider: 'gemini' },
  { id: 'gemini-2.5-flash-image-edit', displayName: 'Gemini 2.5 Flash (Image Edit)', supportsImageInput: true, provider: 'gemini' },
];

export function getModelById(id: string): ModelInfo | undefined {
  return MODEL_REGISTRY.find((model) => model.id === id);
}

export function getModelDisplayName(id: string): string {
  const model = getModelById(id);
  return model ? model.displayName : id;
}
