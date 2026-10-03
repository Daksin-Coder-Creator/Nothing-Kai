import { Router } from 'express';
import { generateVideo } from '../../media/videoGeneration';
import { createVideoJob, getVideoJobStatus } from '../../media/videoJobManager';

const router = Router();

// Async Video Generation Route
router.post('/generate/video', async (req, res) => {
  try {
    const { userId, prompt, negativePrompt, aspectRatio, requestedModel, seed, duration, files } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const job = createVideoJob({
      userId,
      prompt,
      negativePrompt,
      aspectRatio,
      requestedModel,
      seed,
      duration,
      files
    });

    return res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      message: 'Video generation job initialized successfully'
    });
  } catch (err: any) {
    console.error('API /api/generate/video error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to initialize video generation'
    });
  }
});

// Polling status route
router.get('/generate/video/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getVideoJobStatus(jobId);

  if (!job) {
    return res.status(404).json({
      error: `Video job with ID '${jobId}' not found.`
    });
  }

  return res.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    prompt: job.prompt,
    aspectRatio: job.aspectRatio,
    videoUrl: job.result?.videoUrl,
    modelUsed: job.result?.modelUsed,
    creditsDeducted: job.result?.creditsDeducted,
    remainingCredits: job.result?.remainingCredits,
    note: job.result?.note,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt
  });
});

// Legacy / Alternative endpoint aliases
router.post('/generate-video', async (req, res) => {
  try {
    const { userId, prompt, negativePrompt, aspectRatio, requestedModel, seed, duration, files } = req.body;
    
    // Support sync fallback or return job
    if (req.query.sync === 'true') {
      const result = await generateVideo({
        userId,
        prompt: negativePrompt ? `${prompt} (Avoid: ${negativePrompt})` : prompt,
        aspectRatio,
        requestedModel,
        seed,
        duration,
        files
      });
      return res.json(result);
    }

    const job = createVideoJob({
      userId,
      prompt,
      negativePrompt,
      aspectRatio,
      requestedModel,
      seed,
      duration,
      files
    });

    return res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      message: 'Video generation job initialized successfully'
    });
  } catch (err: any) {
    console.error('API /api/generate-video error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate video'
    });
  }
});

router.get('/generate-video/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getVideoJobStatus(jobId);

  if (!job) {
    return res.status(404).json({
      error: `Video job with ID '${jobId}' not found.`
    });
  }

  return res.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    prompt: job.prompt,
    aspectRatio: job.aspectRatio,
    videoUrl: job.result?.videoUrl,
    modelUsed: job.result?.modelUsed,
    creditsDeducted: job.result?.creditsDeducted,
    remainingCredits: job.result?.remainingCredits,
    note: job.result?.note,
    error: job.error
  });
});

export default router;
