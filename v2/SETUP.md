# StorySeed - Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- OpenAI API account with API key

## Installation Steps

### 1. Install Dependencies
```bash
npm install
npm install openai
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Getting your OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file

### 3. Run the Development Server
```bash
npm run dev
```

The app should now be running at http://localhost:5173

## First Use

1. Create an account
2. Add your OpenAI API key to the `.env` file (if not already done)
3. Create a story/book
4. Add at least one story element (character, location, etc.)
5. Generate your first AI-powered prompt!

## Troubleshooting

### "Failed to generate prompt" error
- **Cause**: OpenAI API key is missing or invalid
- **Solution**: Check that `VITE_OPENAI_API_KEY` in `.env` is set correctly
- **Verify**: Restart the dev server after changing `.env`

### OpenAI API costs
- GPT-4o-mini costs approximately $0.001 per prompt generation
- Very cost-effective for individual use
- Monitor usage at https://platform.openai.com/usage

### Browser blocks requests
- The app makes OpenAI API calls directly from the browser
- In production, consider using a backend proxy for security
- `dangerouslyAllowBrowser: true` is set for development convenience

## Development Notes

- `.env` is in `.gitignore` - never commit API keys!
- Use `.env.example` as a template for team members
- Supabase credentials are included for the demo database
- TypeScript errors from Supabase types can be ignored (pre-existing)

## Support

For issues or questions about AI prompt generation, check:
- OpenAI API status: https://status.openai.com
- OpenAI documentation: https://platform.openai.com/docs
- Check browser console for detailed error messages
