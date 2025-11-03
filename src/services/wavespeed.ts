import axios from 'axios';
import { GenerationRequest, PredictionResponse, OutputFormat } from '@/types';

const API_BASE_URL = 'https://api.wavespeed.ai';
const QWEN_EDIT_ENDPOINT = '/api/v3/wavespeed-ai/qwen-image/edit-plus';

export interface GenerateImageOptions {
  prompt: string;
  images: string[]; // base64 data URIs
  apiKey: string;
  size?: string;
  seed?: number;
  outputFormat?: OutputFormat;
}

interface WavespeedAPIResponse {
  code: number;
  message: string;
  data: PredictionResponse;
}

export async function generateImage(options: GenerateImageOptions): Promise<PredictionResponse> {
  const {
    prompt,
    images,
    apiKey,
    size = '1024*1024',
    seed = -1,
    outputFormat = 'jpeg',
  } = options;

  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (!images || images.length === 0) {
    throw new Error('At least one image is required');
  }

  if (images.length > 3) {
    throw new Error('Maximum 3 images allowed');
  }

  const request: GenerationRequest = {
    enable_base64_output: true,
    enable_sync_mode: true,
    images,
    output_format: outputFormat,
    prompt,
    seed,
    size,
  };

  try {
    const response = await axios.post<WavespeedAPIResponse>(
      `${API_BASE_URL}${QWEN_EDIT_ENDPOINT}`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    // Wavespeed API wraps the response in { code, message, data }
    if (response.data.code !== 200) {
      throw new Error(response.data.message || 'API request failed');
    }

    const predictionData = response.data.data;
    
    // Convert base64 strings to data URIs
    if (predictionData.outputs && predictionData.outputs.length > 0) {
      predictionData.outputs = predictionData.outputs.map((output) => {
        // Check if it's already a data URI
        if (output.startsWith('data:')) {
          return output;
        }
        // Convert base64 to data URI
        return `data:image/${outputFormat};base64,${output}`;
      });
    }

    return predictionData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`API request failed: ${message}`);
    }
    throw error;
  }
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

