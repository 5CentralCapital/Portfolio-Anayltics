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
    const response = await openai.models.list();
    
    // Filter for GPT models only
    const gptModels = response.data
      .filter(model => model.id.includes('gpt'))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(model => ({
        id: model.id,
        name: model.id,
        // Add friendly names for common models
        displayName: model.id === 'gpt-4o' ? 'GPT-4o (Recommended)' :
                    model.id === 'gpt-4.1' ? 'GPT-4.1 (Newest)' :
                    model.id === 'gpt-4.5-preview' ? 'GPT-4.5 Preview (Advanced)' :
                    model.id === 'gpt-4o-mini' ? 'GPT-4o Mini (Fast)' :
                    model.id === 'gpt-4-turbo' ? 'GPT-4 Turbo' :
                    model.id === 'gpt-4' ? 'GPT-4' :
                    model.id === 'gpt-3.5-turbo' ? 'GPT-3.5 Turbo' :
                    model.id
      }));

    res.json({
      success: true,
      models: gptModels
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