const axios = require('axios');
const FormData = require('form-data');
const aiConfig = require('../config/ai-services.config');
const { retryWithBackoff } = require('../utils/Ai.utils');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SIZE_MAP = {
  small: { width: 512, height: 512, openai: '512x512', stabilityAspect: '1:1' },
  medium: { width: 1024, height: 1024, openai: '1024x1024', stabilityAspect: '1:1' },
  large: { width: 1536, height: 1024, openai: '1536x1024', stabilityAspect: '3:2' },
};

const normalizeSize = (size) => SIZE_MAP[size] || SIZE_MAP.medium;
const FALLBACK_SAMPLE_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

const unique = (arr) => [...new Set(arr.filter(Boolean))];

const getImageProviderChain = (preferredProvider) => {
  return unique([
    preferredProvider,
    aiConfig.global.defaultImageProvider,
    'openai',
    'stability',
    'gemini',
  ]);
};

const getVideoProviderChain = (preferredProvider) => {
  return unique([
    preferredProvider,
    aiConfig.global.defaultVideoProvider,
    'stability',
  ]);
};

const requireApiKey = (provider, key) => {
  if (!key) {
    throw new Error(`${provider} API key is missing`);
  }
};

const isHttpStatus = (error, status) => error?.response?.status === status;

const stringifyApiErrorPayload = (payload) => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

const buildProviderError = (provider, operation, error) => {
  const status = error?.response?.status;
  const payload = stringifyApiErrorPayload(error?.response?.data);
  const suffix = payload ? ` | ${payload.slice(0, 300)}` : '';
  return new Error(`${provider} ${operation} failed${status ? ` (${status})` : ''}: ${error.message}${suffix}`);
};

const fetchBinaryUrl = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
  return Buffer.from(response.data);
};

const generateImageWithOpenAI = async ({ prompt, size }) => {
  requireApiKey('OpenAI', aiConfig.openai.apiKey);
  const dims = normalizeSize(size);
  console.log(`[OpenAI] Generating image with model: ${aiConfig.openai.dalle.model}, size: ${dims.openai}`);

  const response = await axios.post(
    `${aiConfig.openai.baseURL}${aiConfig.openai.endpoints.imageGeneration}`,
    {
      model: aiConfig.openai.dalle.model,
      prompt,
      size: dims.openai,
      response_format: 'b64_json',
      quality: aiConfig.openai.dalle.quality,
    },
    {
      headers: {
        Authorization: `Bearer ${aiConfig.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: aiConfig.openai.timeout || 120000,
    }
  );

  const first = response.data?.data?.[0];
  if (!first) {
    throw new Error('OpenAI returned empty image response');
  }

  if (first.b64_json) {
    return Buffer.from(first.b64_json, 'base64');
  }

  if (first.url) {
    return fetchBinaryUrl(first.url);
  }

  throw new Error('OpenAI image payload did not contain b64_json or url');
};

const generateImageWithStability = async ({ prompt, size }) => {
  requireApiKey('Stability', aiConfig.stability.apiKey);
  const dims = normalizeSize(size);
  console.log(`[Stability] Generating image with aspect ratio: ${dims.stabilityAspect}`);
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('output_format', aiConfig.stability.image.outputFormat || 'png');
  form.append('aspect_ratio', dims.stabilityAspect);

  const response = await axios.post(
    `${aiConfig.stability.baseURL}${aiConfig.stability.endpoints.textToImage}`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${aiConfig.stability.apiKey}`,
        Accept: 'image/*',
      },
      responseType: 'arraybuffer',
      timeout: aiConfig.stability.timeout,
      maxBodyLength: Infinity,
    }
  );

  return Buffer.from(response.data);
};

const generateImageWithGemini = async ({ prompt }) => {
  requireApiKey('Gemini', aiConfig.gemini.apiKey);
  const model = aiConfig.gemini.imageModel;
  console.log(`[Gemini] Generating image with model: ${model}`);

  const response = await axios.post(
    `${aiConfig.gemini.baseURL}/models/${model}:generateContent?key=${aiConfig.gemini.apiKey}`,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `Generate a high quality image for: ${prompt}` }],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: aiConfig.gemini.timeout,
    }
  );

  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini returned no image data');
  }

  return Buffer.from(imagePart.inlineData.data, 'base64');
};

const generateImageBuffer = async ({ prompt, size = 'medium', provider }) => {
  const providers = getImageProviderChain(provider);
  let lastError;

  for (const candidate of providers) {
    try {
      console.log(`[AI-Service] Attempting image generation with provider: ${candidate}`);
      if (candidate === 'openai') {
        return await retryWithBackoff(() => generateImageWithOpenAI({ prompt, size }));
      }
      if (candidate === 'stability') {
        return await retryWithBackoff(() => generateImageWithStability({ prompt, size }));
      }
      if (candidate === 'gemini') {
        return await retryWithBackoff(() => generateImageWithGemini({ prompt, size }));
      }
    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      console.error(`[AI-Service] Provider ${candidate} failed: ${error.message} (${error.response?.status})${isRateLimit ? ' - Switching to fallback...' : ''}`);

      // If it's a rate limit, the loop will try the next provider.
      // We store the error in case all fail.
      lastError = error;

      // If the error is NOT retryable or quota/auth related, we definitely want the next provider.
      // Already handled by the catch block moving to next iteration.
    }
  }

  throw new Error(`AI Generation failed for all providers. Last error from [${providers[providers.length - 1]}]: ${lastError?.message || 'Unknown error'}`);
};

const submitStabilityVideoJob = async (seedImageBuffer) => {
  requireApiKey('Stability', aiConfig.stability.apiKey);

  const form = new FormData();
  form.append('image', seedImageBuffer, {
    filename: 'seed.png',
    contentType: 'image/png',
  });

  const submitRes = await axios.post(
    `${aiConfig.stability.baseURL}${aiConfig.stability.endpoints.imageToVideo}`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${aiConfig.stability.apiKey}`,
      },
      timeout: aiConfig.stability.timeout,
      maxBodyLength: Infinity,
    }
  );

  const generationId = submitRes.data?.id;
  if (!generationId) {
    throw new Error('Stability video request did not return job id');
  }

  return generationId;
};

const pollStabilityVideo = async (generationId) => {
  const maxAttempts = aiConfig.stability.video.maxPollAttempts;
  const pollInterval = aiConfig.stability.video.pollIntervalMs;
  const url = `${aiConfig.stability.baseURL}${aiConfig.stability.endpoints.imageToVideo}/result/${generationId}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${aiConfig.stability.apiKey}`,
          Accept: 'video/*',
        },
        responseType: 'arraybuffer',
        timeout: aiConfig.stability.timeout,
      });

      if (result.status === 200 && result.data) {
        return Buffer.from(result.data);
      }
    } catch (error) {
      if (error.response?.status !== 202) {
        throw error;
      }
    }

    await wait(pollInterval);
  }

  throw new Error('Stability video generation timed out');
};

const generateVideoWithStability = async ({ prompt, size, seedProvider }) => {
  const imageSeed = await generateImageBuffer({
    prompt,
    size,
    provider: seedProvider || 'stability',
  });
  console.log(`[Stability] Submitting video job with image seed`);
  try {
    const generationId = await submitStabilityVideoJob(imageSeed);
    const videoBuffer = await pollStabilityVideo(generationId);
    return { videoBuffer, previewImageBuffer: imageSeed, isFallback: false };
  } catch (error) {
    // Stability API plan/account endpoints may return 404 for video in some accounts.
    if (isHttpStatus(error, 404)) {
      const fallbackVideo = await fetchBinaryUrl(FALLBACK_SAMPLE_VIDEO_URL);
      return {
        videoBuffer: fallbackVideo,
        previewImageBuffer: imageSeed,
        isFallback: true,
        fallbackReason: 'Stability video endpoint unavailable (404), used sample fallback video',
      };
    }
    throw buildProviderError('Stability', 'video generation', error);
  }
};

const generateVideoBuffer = async ({ prompt, size = 'medium', provider }) => {
  const providers = getVideoProviderChain(provider);
  let lastError;

  for (const candidate of providers) {
    try {
      console.log(`[AI-Service] Attempting video generation with provider: ${candidate}`);
      if (candidate === 'stability') {
        return await retryWithBackoff(() =>
          generateVideoWithStability({ prompt, size, seedProvider: 'stability' })
        );
      }

      if (candidate === 'openai' || candidate === 'gemini') {
        return await retryWithBackoff(() =>
          generateVideoWithStability({ prompt, size, seedProvider: candidate })
        );
      }
    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      console.error(`[AI-Service] Provider ${candidate} failed: ${error.message} (${error.response?.status})${isRateLimit ? ' - Switching to fallback...' : ''}`);
      lastError = error;
    }
  }

  throw new Error(`AI Video Generation failed for all providers. Last error from [${providers[providers.length - 1]}]: ${lastError?.message || 'Unknown error'}`);
};

module.exports = {
  generateImageBuffer,
  generateVideoBuffer,
};
