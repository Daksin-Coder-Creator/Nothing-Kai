import { Router } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';

const router = Router();

export class WorkspaceApiError extends Error {
  statusCode: number;
  service: string;
  requiredScope: string;
  reason: string;
  endpoint: string;
  details?: any;

  constructor(message: string, statusCode: number, service: string, requiredScope: string, reason: string, endpoint: string, details?: any) {
    super(message);
    this.name = 'WorkspaceApiError';
    this.statusCode = statusCode;
    this.service = service;
    this.requiredScope = requiredScope;
    this.reason = reason;
    this.endpoint = endpoint;
    this.details = details;
  }
}

// Generic helper to fetch from Google APIs with detailed scope telemetry
async function fetchGoogleApi(
  endpoint: string, 
  accessToken: string, 
  service: string, 
  requiredScope: string, 
  reason: string
) {
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errBody: any = {};
    try {
      errBody = await response.json();
    } catch (_) {}
    const msg = errBody?.error?.message || `Google API error: ${response.statusText}`;
    throw new WorkspaceApiError(msg, response.status, service, requiredScope, reason, endpoint, errBody?.error);
  }

  return response.json();
}

function handleRouteError(err: any, res: any) {
  if (err instanceof WorkspaceApiError) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.statusCode,
      service: err.service,
      requiredScope: err.requiredScope,
      reason: err.reason,
      endpoint: err.endpoint,
      details: err.details
    });
  }
  return res.status(500).json({ error: err?.message || 'Internal Workspace Error' });
}

// Drive files list
router.get('/drive/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)&q=trashed%20%3D%20false',
      accessToken,
      'Google Drive',
      'https://www.googleapis.com/auth/drive.readonly',
      'Browsing and accessing files in your Google Drive requires the drive.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Drive search
router.get('/drive/search', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const term = (req.query.term as string) || '';
    const query = term ? `name contains '${term.replace(/'/g, "\\'")}' and trashed = false` : 'trashed = false';
    const data = await fetchGoogleApi(
      `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)&q=${encodeURIComponent(query)}`,
      accessToken,
      'Google Drive',
      'https://www.googleapis.com/auth/drive.readonly',
      'Searching files across your Google Drive requires the drive.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Docs list
router.get('/docs/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.document\'&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)',
      accessToken,
      'Google Docs',
      'https://www.googleapis.com/auth/drive.readonly',
      'Reading and organizing your Google Docs documents requires the drive.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Sheets list
router.get('/sheets/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.spreadsheet\'&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)',
      accessToken,
      'Google Sheets',
      'https://www.googleapis.com/auth/drive.readonly',
      'Accessing spreadsheet data and tables in Google Sheets requires the drive.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Slides list
router.get('/slides/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.presentation\'&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)',
      accessToken,
      'Google Slides',
      'https://www.googleapis.com/auth/drive.readonly',
      'Viewing presentation slide decks in Google Slides requires the drive.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Forms list
router.get('/forms/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.form\'&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)',
      accessToken,
      'Google Forms',
      'https://www.googleapis.com/auth/drive.readonly',
      'Accessing Google Forms surveys and quizzes requires the drive.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Chat spaces
router.get('/chat/spaces', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://chat.googleapis.com/v1/spaces',
      accessToken,
      'Google Chat',
      'https://www.googleapis.com/auth/chat.spaces',
      'Listing your collaborative Google Chat spaces requires the chat.spaces scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Tasks lists
router.get('/tasks/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      accessToken,
      'Google Tasks',
      'https://www.googleapis.com/auth/tasks',
      'Viewing and synchronizing task checklists requires the tasks scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Keep notes
router.get('/keep/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://keep.googleapis.com/v1/notes',
      accessToken,
      'Google Keep',
      'https://www.googleapis.com/auth/keep',
      'Google Keep API is reserved for Google Workspace Enterprise organization domains.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Send Chat message
router.post('/chat/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const { spaceId, text } = req.body;
    if (!spaceId || !text) return res.status(400).json({ error: 'spaceId and text required' });

    const response = await fetch(`https://chat.googleapis.com/v1/spaces/${spaceId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      let errBody: any = {};
      try {
        errBody = await response.json();
      } catch (_) {}
      throw new WorkspaceApiError(
        errBody?.error?.message || `Google API error: ${response.statusText}`,
        response.status,
        'Google Chat',
        'https://www.googleapis.com/auth/chat.messages',
        'Sending messages to Google Chat spaces requires the chat.messages scope.',
        `https://chat.googleapis.com/v1/spaces/${spaceId}/messages`,
        errBody?.error
      );
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Gmail list messages
router.get('/gmail/list', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const data = await fetchGoogleApi(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20',
      accessToken,
      'Gmail',
      'https://www.googleapis.com/auth/gmail.readonly',
      'Reading and listing your Gmail messages requires gmail.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Gmail get message details
router.get('/gmail/message/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const messageId = req.params.id;
    const data = await fetchGoogleApi(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      accessToken,
      'Gmail',
      'https://www.googleapis.com/auth/gmail.readonly',
      'Reading Gmail message details requires gmail.readonly scope.'
    );
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

// Gmail send message
router.post('/gmail/send', requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(400).json({ error: 'Workspace access token required' });

    const { to, subject, body } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, and body required' });

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      body
    ];
    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!response.ok) {
      let errBody: any = {};
      try {
        errBody = await response.json();
      } catch (_) {}
      throw new WorkspaceApiError(
        errBody?.error?.message || `Google API error: ${response.statusText}`,
        response.status,
        'Gmail',
        'https://www.googleapis.com/auth/gmail.send',
        'Sending emails via Gmail requires gmail.send scope.',
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        errBody?.error
      );
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    handleRouteError(err, res);
  }
});

export default router;
