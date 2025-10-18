# Installing OpenAI Package

If you encounter issues with the OpenAI import, you may need to install the package manually.

## For PowerShell (Windows)

If you get "running scripts is disabled" error:

```powershell
# Option 1: Run this command once to allow npm commands
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then install
npm install openai

# Option 2: Bypass execution policy for single command
powershell -ExecutionPolicy Bypass -Command "npm install openai"
```

## For Command Prompt or Terminal

```bash
npm install openai
```

## Verify Installation

Check that `openai` appears in your `package.json` dependencies:

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    ...
  }
}
```

## After Installation

Restart your development server:

```bash
npm run dev
```
