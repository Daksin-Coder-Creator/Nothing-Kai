import { Router } from 'express';
import { processChat } from '../../chat/chatService';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { userId, message, history, personaId, enableWebSearch, files, workspaceToken, connectedAccounts } = req.body;
    const headerToken = req.headers['x-workspace-token'] as string;
    const finalWorkspaceToken = workspaceToken || headerToken;
    const result = await processChat({
      userId,
      message,
      history,
      personaId,
      enableWebSearch,
      files,
      workspaceToken: finalWorkspaceToken,
      connectedAccounts,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('API /api/chat error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to process chat request'
    });
  }
});

export default router;
