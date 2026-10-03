import { generateVideo, VideoGenerationOptions, VideoGenerationResult } from './videoGeneration';

export interface VideoJob {
  jobId: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  requestedModel?: string;
  seed?: number;
  duration?: number;
  files?: Array<{ name?: string; type?: string; base64?: string }>;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  result?: VideoGenerationResult;
  error?: string;
}

const jobsStore = new Map<string, VideoJob>();

export function createVideoJob(options: VideoGenerationOptions): VideoJob {
  const jobId = `job_vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userId = options.userId || 'default-user';

  const job: VideoJob = {
    jobId,
    userId,
    prompt: options.prompt,
    negativePrompt: options.negativePrompt,
    aspectRatio: options.aspectRatio,
    requestedModel: options.requestedModel,
    seed: options.seed,
    duration: options.duration,
    files: options.files,
    status: 'queued',
    progress: 5,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  jobsStore.set(jobId, job);

  // Start asynchronous processing in background
  processVideoJobAsync(jobId, options);

  return job;
}

export function getVideoJobStatus(jobId: string): VideoJob | undefined {
  return jobsStore.get(jobId);
}

async function processVideoJobAsync(jobId: string, options: VideoGenerationOptions) {
  const job = jobsStore.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.progress = 15;
  job.updatedAt = Date.now();

  // Progress simulation timer during API execution
  const progressInterval = setInterval(() => {
    const currentJob = jobsStore.get(jobId);
    if (!currentJob || currentJob.status !== 'processing') {
      clearInterval(progressInterval);
      return;
    }
    if (currentJob.progress < 88) {
      currentJob.progress += Math.floor(Math.random() * 12) + 5;
      currentJob.updatedAt = Date.now();
    }
  }, 1200);

  try {
    const fullPrompt = options.negativePrompt 
      ? `${options.prompt} (Avoid/Negative: ${options.negativePrompt})`
      : options.prompt;

    const result = await generateVideo({
      ...options,
      prompt: fullPrompt
    });

    clearInterval(progressInterval);

    const completedJob = jobsStore.get(jobId);
    if (completedJob) {
      completedJob.status = 'completed';
      completedJob.progress = 100;
      completedJob.completedAt = Date.now();
      completedJob.updatedAt = Date.now();
      completedJob.result = result;
    }
  } catch (err: any) {
    clearInterval(progressInterval);

    const failedJob = jobsStore.get(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.progress = 0;
      failedJob.updatedAt = Date.now();
      failedJob.error = err?.message || 'Video generation failed.';
    }
  }
}
