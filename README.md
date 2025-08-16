# QuickAI

QuickAI is an AI-powered web application that provides a suite of creative and productivity tools, including article generation, blog title suggestions, image generation, background/object removal, resume review, and a community platform. Built with a React frontend and Node.js/Express backend, it leverages Clerk for authentication and OpenAI/Gemini for AI features.

## Features
- ✍️ Write articles and generate blog titles using AI
- 🖼️ Generate images and remove backgrounds/objects
- 📄 Review resumes with AI feedback
- 👥 Community page for user interaction
- 🔒 Authentication with Clerk (supports free and premium plans)

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** (e.g., PostgreSQL/SQLite, configure in `server/config/db.js`)
- **Authentication:** Clerk
- **AI Services:** OpenAI, Gemini

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Clerk account (for authentication)
- OpenAI/Gemini API key

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/ABHI-019/Quick.ai.git
   cd Quick.ai
   ```
2. **Install dependencies:**
   ```sh
   cd client
   npm install
   cd ../server
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` in both `client` and `server` folders and fill in the required values (API keys, Clerk keys, DB connection, etc).

4. **Start the development servers:**
   - In one terminal:
     ```sh
     cd server
     npm run server
     ```
   - In another terminal:
     ```sh
     cd client
     npm run dev
     ```

5. **Open your browser:**
   - Visit `http://localhost:5173` (or the port shown in your terminal) to use QuickAI.

## Usage
- **Free users** have limited usage (e.g., 10 free AI requests).
- **Premium users** get unlimited access to all features.
- Upgrade via the dashboard after signing in.

## Recruiter & User Friendly Notes
- **Recruiters:**
  - Clean, modular codebase with clear separation of concerns.
  - Uses modern React patterns and best practices.
  - Easily extensible for new AI tools or integrations.
  - Secure authentication and role-based access.
- **Users:**
  - Simple, intuitive UI for all tools.
  - Fast, responsive, and mobile-friendly.
  - Transparent usage limits and upgrade path.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.


