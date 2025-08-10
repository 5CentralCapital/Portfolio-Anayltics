import express from 'express';

const router = express.Router();

// Curated list of Gemini models with descriptions
const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast multimodal processing, excellent for documents',
    provider: 'gemini'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Highest accuracy, complex reasoning capabilities',
    provider: 'gemini'
  },
  {
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini 2.0 Flash Preview',
    description: 'Latest model with image generation capabilities',
    provider: 'gemini'
  }
];

// GET /api/gemini/models - Return available Gemini models
router.get('/models', async (req, res) => {
  try {
    // Always return curated list; external key not required for listing
    res.json(GEMINI_MODELS);
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Gemini models',
      details: error.message 
    });
  }
});

export default router;