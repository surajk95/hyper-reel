import axios from 'axios';
import { GenerationRequest, GenerationRequestWan22, PredictionResponse, OutputFormat } from '@/types';

const API_BASE_URL = 'https://api.wavespeed.ai';
const QWEN_EDIT_ENDPOINT = '/api/v3/wavespeed-ai/qwen-image/edit-plus';
const WAN22_ENDPOINT = '/api/v3/wavespeed-ai/wan-2.2/text-to-image-lora';

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
    size = '1536*1536',
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

export interface GenerateImageWan22Options {
  prompt: string;
  apiKey: string;
  size?: string;
  seed?: number;
  outputFormat?: OutputFormat;
}

export async function generateImageWan22(options: GenerateImageWan22Options): Promise<PredictionResponse> {
  const {
    prompt,
    apiKey,
    size = '1536*1536',
    seed = -1,
    outputFormat = 'jpeg',
  } = options;

  if (!apiKey) {
    throw new Error('API key is required');
  }

  // Check for secret trigger word
  const hasTrigger = prompt.toLowerCase().includes('sam_lewd');
  
  // All LoRAs are only added when trigger word is present
  const highNoiseLoras = hasTrigger ? [
    {
      path: 'https://d2p7pge43lyniu.cloudfront.net/output/820757ed-95c5-4786-98b3-499a7c1ba216-u2_t2v_A14B_separate_high_noise_lora_0773b186-b92f-4e0d-afb8-14b0f980c240.safetensors',
      scale: 1.3,
    },
    // {
    //   path: 'https://huggingface.co/lopi999/Wan2.2-I2V_General-NSFW-LoRA/blob/main/NSFW-22-H-e8.safetensors',
    //   scale: 0.8,
    // },
  ] : [];
  
  const lowNoiseLoras = hasTrigger ? [
    {
      path: 'https://d2p7pge43lyniu.cloudfront.net/output/820757ed-95c5-4786-98b3-499a7c1ba216-u2_t2v_A14B_separate_low_noise_lora_82f8902b-b4e9-4ed0-aa7a-2f57d822d67d.safetensors',
      scale: 1.3,
    },
    // {
    //   path: 'https://huggingface.co/lopi999/Wan2.2-I2V_General-NSFW-LoRA/blob/main/NSFW-22-L-e8.safetensors',
    //   scale: 1,
    // },
  ] : [];
  
  // Modify prompt if trigger word is present
  const modifiedPrompt = hasTrigger ? prompt + ' nsfwsks' : prompt;

  const request: GenerationRequestWan22 = {
    enable_base64_output: true,
    enable_sync_mode: true,
    loras: [],
    high_noise_loras: highNoiseLoras,
    low_noise_loras: lowNoiseLoras,
    output_format: outputFormat,
    prompt: modifiedPrompt,
    seed,
    size,
  };

  try {
    const response = await axios.post<WavespeedAPIResponse>(
      `${API_BASE_URL}${WAN22_ENDPOINT}`,
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

