import { Router } from 'express';
import { generateImage } from '../../media/imageGeneration';

const router = Router();

router.post('/generate-image', async (req, res) => {
  try {
    const { userId, prompt, aspectRatio, imageSize, modelType, requestedModel, quality, files } = req.body;
    const result = await generateImage({
      userId,
      prompt,
      aspectRatio,
      imageSize,
      requestedModel: requestedModel || (modelType === 'pro' ? 'gemini-3-pro-image' : undefined),
      quality,
      files
    });
    return res.json(result);
  } catch (err: any) {
    console.error('API /api/generate-image error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate image'
    });
  }
});

export default router;
