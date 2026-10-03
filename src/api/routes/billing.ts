import { Router } from 'express';
import { getUserCredits } from '../../billing/creditManager';
import { changePlan, setPrimeCustomCredits } from '../../billing/planManager';

const router = Router();

// GET /api/billing/usage
router.get('/billing/usage', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default-user';
    const creditsInfo = getUserCredits(userId);
    return res.json(creditsInfo);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch credit usage' });
  }
});

// POST /api/billing/change-plan
router.post('/billing/change-plan', (req, res) => {
  try {
    const { userId = 'default-user', planId, customCredits } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }
    const result = changePlan(userId, planId, customCredits);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to change plan' });
  }
});

// POST /api/admin/users/:userId/set-prime-credits
router.post('/admin/users/:userId/set-prime-credits', (req, res) => {
  try {
    const { userId } = req.params;
    const { credits } = req.body;
    if (credits === undefined || isNaN(Number(credits))) {
      return res.status(400).json({ error: 'Valid numeric credits value is required' });
    }
    const result = setPrimeCustomCredits(userId, Number(credits));
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update custom Prime credits' });
  }
});

export default router;
