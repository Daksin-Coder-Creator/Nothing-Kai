import { Router } from 'express';
import { generateAudio } from '../../media/audioGeneration';

const router = Router();

router.post('/generate-music', async (req, res) => {
  try {
    const { userId, prompt, length, requestedModel } = req.body;
    const result = await generateAudio({
      userId,
      prompt,
      type: 'music',
      length: length === 'full' ? 'full' : 'short',
      requestedModel
    });
    return res.json(result);
  } catch (err: any) {
    console.error('API /api/generate-music error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate music'
    });
  }
});

router.post('/generate-tts', async (req, res) => {
  try {
    const { userId, prompt, voice, requestedModel } = req.body;
    const result = await generateAudio({
      userId,
      prompt,
      type: 'tts',
      voice,
      requestedModel
    });
    return res.json(result);
  } catch (err: any) {
    console.error('API /api/generate-tts error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate speech'
    });
  }
});

export default router;
