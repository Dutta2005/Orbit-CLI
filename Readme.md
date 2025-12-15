# 🛰️ Orbilt-CLI

Orbilt-CLI is a powerful command-line AI agent that brings advanced AI capabilities directly into your terminal. With seamless integration of Google Gemini, secure device flow authentication, and a modern full-stack architecture, Orbilt-CLI is designed for speed, personalization, and always-on productivity—right from your CLI.

## 🚀 Live Demo

[Live Demo](https://www.linkedin.com/posts/rajdutta062005_ai-developertools-geminiai-activity-7402333849072021504-dfz7?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEaqAiMBPx_ifcHeQxodAB3U4BmyCteEqgk)

## 🧪 Features

- 🤖 AI-powered terminal agent with chat and tool-calling (Google search, code execution, URL context)
- 🔑 Secure device flow authentication via Better Auth
- 🖥️ Modern Next.js dashboard with logs, user management & clean UI
- ⚙️ Express.js backend API for authentication, prompt routing, and agent control
- 🛢️ Fast, serverless Postgres storage using Prisma ORM + NeonDB
- 📋 Fully typed schemas, session and token management
- 🚀 Seamless CLI experience powered by Node.js Commander

## 🛠 Tech Stack

**Frontend:** Next.js, React, Tailwind CSS  
**Backend:** Express.js, Node.js, Node.js Commander  
**AI Engine:** Google Gemini, AI SDK  
**Authentication:** Better Auth (Device Flow)  
**Database:** Prisma ORM, NeonDB, PostgreSQL

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Dutta2005/orbilt-cli.git
   ```
2. Install frontend dependencies and start the Next.js app:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. Install backend dependencies and start the Express server:
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. Make the CLI executable and link it:
   ```bash
   chmod +x server/src/cli/main.js
   npm link
   ```
5. Authenticate via the CLI:
   ```bash
   orbit login
   ```

### 🔐 Environment Variables

Create a `.env` file in both the `client` and `server` directories with the following example variables:

**For Express.js Server:**
```env
PORT=3005

DATABASE_URL=<your_database_url>

BETTER_AUTH_SECRET=<better_auth_secret>
BETTER_AUTH_URL=http://localhost:3005

GITHUB_CLIENT_ID=<your_github_client_id>
GITHUB_CLIENT_SECRET=<your_github_client_secret>

GOOGLE_GENERATIVE_AI_API_KEY=<your_gemini_api_key>
ORBITAI_MODEL=gemini-2.5-flash

NODE_ENV=development
```

## 🖼️ Screenshots

![Orbit Dashboard](./screenshot/image.png)

## ⚙️ Usage / How it Works

- Clone the repository and install dependencies for both the client and server.
- Start the Next.js frontend (`npm run dev` in `client`) and Express backend (`npm run dev` in `server`).
- Make the CLI agent executable and globally link it with `npm link` in the `server` directory.
- In your terminal, run `orbit login` to authenticate via the device flow. Approve the device code in your browser.
- Once logged in, use `orbit wakeup` to start interacting with your personal AI agent.
- Explore features like chat, tool calling (Google search, code execution, URL context), and access logs via the dashboard.
- To log out, simply run `orbit logout`.

## 🗂️ Folder Structure

├── client/    
├── server/  
├── screenshot/  
├── .gitignore    
└── Readme.md

## 🤝 Contributions

We welcome all contributions! Follow these steps to contribute:

1. 🍴 Fork this repository
2. 📥 Clone your fork using `git clone`
3. 📂 Create a new branch (`git checkout -b feature/your-feature-name`)
4. 🛠 Make your changes
5. ✅ Commit and push (`git commit -m "Add feature"`)
6. 🔁 Open a Pull Request with a clear description


## 🚧 Upcoming Features

- 🧩 npm package
- 🌐 Multi-model support (OpenAI, Anthropic etc.)
- 🗣️ Voice command integration
- 📊 Advanced analytics and usage insights

<p align="center">
  ⭐ Star this repo if you find it useful!
</p>
