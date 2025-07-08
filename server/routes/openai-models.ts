/**
 * OpenAI Models API Route
 * Fetches available OpenAI models for selection
 */

import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get available OpenAI models
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Skip API call, return curated models directly
    // const response = await openai.models.list();
    
    // Return curated list of OpenAI models
    const curatedModels = [
      {
        id: 'gpt-4o',
        name: 'gpt-4o',
        displayName: 'GPT-4o: Best accuracy for complex documents'
      },
      {
        id: 'gpt-4o-mini',
        name: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini: Good balance of speed and accuracy'
      },
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo: High accuracy, slower processing'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5: Fastest processing, lower accuracy'
      }
    ];

    res.json({
      success: true,
      models: curatedModels
    });

  } catch (error: any) {
    console.error('Error fetching OpenAI models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available models',
      details: error.message
    });
  }
});

export default router;