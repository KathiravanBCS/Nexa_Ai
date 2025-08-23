# Gemini Clone Supabase

## Overview
This is a Gemini AI chat clone built with Next.js, Supabase, and Clerk for authentication. It supports chat history, user authentication, and Gemini AI integration.

---

## Getting Started

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd gemini-clone-supabase
```

### 2. Install Dependencies
```sh
npm install
```
Or if you use pnpm:
```sh
pnpm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

#### How to get a Gemini AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/) and sign in with your Google account.
2. Navigate to the API Keys section.
3. Click "Create API Key" and copy the generated key (starts with `AIza...`).
4. Paste this key as `GEMINI_API_KEY` in your `.env.local` file.

---

### 4. Run the Application
```sh
npm run dev
```
Or with pnpm:
```sh
pnpm dev
```

The app will start on [http://localhost:3000](http://localhost:3000) (or another port if 3000 is busy).

---

## Usage Instructions
- **Sign Up / Sign In:** Use Clerk authentication to sign in or sign up.
- **Set Gemini API Key (Preview):**
  - In development, you can set a preview Gemini API key using the "Set API Key" button in the UI.
  - For production, set the key in `.env.local` as shown above.
- **Start a New Chat:** Click the "New chat" button in the sidebar to create a new chat thread.
- **Chat History:** Your chat history is saved and shown in the sidebar.

---

## Changing Gemini API Key
- **Development:** Use the "Set API Key" button in the UI to change the key for preview.
- **Production:** Edit the `GEMINI_API_KEY` value in `.env.local` and restart the server.

---

## Troubleshooting
- **Missing API Key:** If you see "Missing Gemini API key" errors, ensure your `.env.local` file contains a valid `GEMINI_API_KEY`.
- **Authentication Issues:** Make sure your Clerk keys are correct and you have set up your Clerk project.
- **Supabase Issues:** Ensure your Supabase URL and anon key are correct.

---

## License
MIT
