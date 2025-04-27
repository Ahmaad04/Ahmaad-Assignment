import express, { Request, Response, Router } from 'express';
import { FlaggingService } from '../services/Flagging';
import { Candidate } from '../models/Candidate';

const flagRouter = express.Router();
const flaggingService = new FlaggingService();

// POST /flagging/evaluate
flagRouter.post('/evaluate', (req: Request, res: Response) => {
  try {
    const candidate: Candidate = req.body;
    const result = flaggingService.evaluateCandidate(candidate);
    res.status(200).json(result);
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default flagRouter;
