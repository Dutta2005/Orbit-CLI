# 🛰️ Orbilt-CLI

Orbilt-CLI is a powerful command-line AI agent that brings advanced AI capabilities directly into your terminal. With seamless integration of Google Gemini, secure device flow authentication, per-user AI configuration, and a modern full-stack architecture, Orbilt-CLI is designed for speed, personalization, and always-on productivity—right from your CLI.

## 🚀 Live Demo

[Live Demo](https://www.linkedin.com/posts/rajdutta062005_ai-developertools-geminiai-activity-7402333849072021504-dfz7?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEaqAiMBPx_ifcHeQxodAB3U4BmyCteEqgk)

## 🧪 Features

- 🤖 AI-powered terminal agent with chat and tool-calling (Google search, code execution, URL context)
- 🔑 Secure device flow authentication via Better Auth
- ⚙️ **Per-user AI configuration** - Set your own Gemini API key and model
- 🖥️ Modern Next.js dashboard with logs, user management & clean UI
- 🔧 Express.js backend API for authentication, prompt routing, and agent control
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
   cd orbilt-cli
   ```

2. Install frontend dependencies and start the Next.js app:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials (see below)
   ```

5. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. Start the Express server:
   ```bash
   npm run dev
   ```

7. Link the CLI globally (in a new terminal):
   ```bash
   cd server
   chmod +x src/main.js
   npm link
   ```

8. Authenticate via the CLI:
   ```bash
   orbit login
   ```

### 🔐 Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3005

# Database (Get from https://neon.tech)
DATABASE_URL="postgresql://user:pass@host/dbname"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL=http://localhost:3005

# GitHub OAuth (Get from https://github.com/settings/developers)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# Default Gemini API Key (Optional - users can set their own)
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
ORBITAI_MODEL=gemini-2.5-flash

NODE_ENV=development
```

**Setup Guides:**
- Database: See [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- GitHub OAuth: https://github.com/settings/developers
- Gemini API: https://aistudio.google.com/apikey

## 🎯 CLI Commands

### Authentication
```bash
orbit login          # Login via device flow
orbit logout         # Logout
orbit whoami         # Show current user
```

### AI Configuration (New! ⭐)
```bash
orbit config set     # Set your own Gemini API key and model
orbit config view    # View your current AI configuration
```

### Chat
```bash
orbit wakeup         # Start AI interaction
                     # Choose: Chat, Tool Calling, or Agent Mode
```

## 🔧 Architecture Flow

```text
┌────────────────────┐
│        User        │
│  (Terminal Input)  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│     Orbilt CLI     │
│ (Node.js + Commander)
│                    │
│ Commands:
│ - orbit login
│ - orbit config set ⭐
│ - orbit wakeup
│ - orbit logout
└─────────┬──────────┘
          │
          ▼
┌──────────────────────────┐
│ Device Flow Authentication│
│     (Better Auth)         │
│                            │
│ Browser Verification Step │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│   Express.js Backend API │
│                          │
│ - Auth & Session Control │
│ - Prompt Routing         │
│ - Tool Invocation        │
│ - Logging & Persistence  │
│ - Per-User AI Config ⭐  │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│   Google Gemini AI       │
│                          │
│ - Chat Completion        │
│ - Tool Calling           │
│ - Search / Code / URLs   │
│ - User's API Key ⭐      │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Prisma ORM + NeonDB      │
│ (PostgreSQL Storage)     │
│                          │
│ - Sessions               │
│ - Tokens                 │
│ - AI Configs ⭐          │
│ - Conversations          │
│ - Messages               │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Next.js Web Dashboard    │
│                          │
│ - Logs Viewer            │
│ - User Management        │
│ - Session Monitoring     │
│ - Analytics (Future)     │
└──────────────────────────┘
```

## 🖼️ Screenshots

|                                             |                                             |
| ------------------------------------------- | ------------------------------------------- |
| ![Orbit Dashboard](./screenshot/image.png)  | ![Orbit Dashboard](./screenshot/image2.png) |
| ![Orbit Dashboard](./screenshot/image3.png) | ![Orbit Dashboard](./screenshot/image4.png) |

## ⚙️ Usage / How it Works

### Quick Start

1. **Start the backend server** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```

2. **Login** (Terminal 2):
   ```bash
   orbit login
   ```
   Approve the device code in your browser.

3. **Configure your AI** (Optional but recommended):
   ```bash
   orbit config set
   ```
   - Enter your Gemini API key from https://aistudio.google.com/apikey
   - Select your preferred model (gemini-2.5-flash recommended)
   - Your API key is validated and saved securely

4. **Start chatting**:
   ```bash
   orbit wakeup
   ```
   Choose from:
   - **Chat** - Simple conversation with AI
   - **Tool Calling** - AI with Google search and code execution
   - **Agent Mode** - Advanced agentic behavior

### Per-User AI Configuration

Each user can now configure their own Gemini API key and model:

```bash
# Set your configuration
orbit config set

# View your configuration
orbit config view

# Your settings are used automatically in all chat modes
orbit wakeup
```

**Benefits:**
- ✅ Personal API quota (no sharing)
- ✅ Choose your preferred model
- ✅ Easy to update anytime
- ✅ Falls back to server defaults if not set

**Supported Models:**
- `gemini-2.5-flash` (Recommended)
- `gemini-2.0-flash-exp`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## 🗂️ Folder Structure

```
orbilt-cli/
├── client/              # Next.js frontend
├── server/              # Express.js backend + CLI
│   ├── src/
│   │   ├── cli/         # CLI commands
│   │   │   ├── commands/
│   │   │   │   ├── auth/
│   │   │   │   ├── ai/
│   │   │   │   └── config/  ⭐ New
│   │   │   ├── chat/
│   │   │   └── ai/
│   │   ├── services/
│   │   │   ├── chat.services.js
│   │   │   └── aiConfig.services.js  ⭐ New
│   │   ├── lib/
│   │   └── config/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── screenshot/
├── AI_CONFIG_FEATURE.md      ⭐ New
├── QUICK_START_AI_CONFIG.md  ⭐ New
└── README.md
```

## 🤝 Contributions

We welcome all contributions! Follow these steps to contribute:

1. 🍴 Fork this repository
2. 📥 Clone your fork using `git clone`
3. 📂 Create a new branch (`git checkout -b feature/your-feature-name`)
4. 🛠 Make your changes
5. ✅ Commit and push (`git commit -m "Add feature"`)
6. 🔁 Open a Pull Request with a clear description

## 📚 Documentation

- [AI Configuration Feature](./AI_CONFIG_FEATURE.md) - Per-user AI config details
- [Quick Start Guide](./QUICK_START_AI_CONFIG.md) - Get started with AI config
- [Database Setup](./DATABASE_SETUP.md) - PostgreSQL setup guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical details

## 🚧 Upcoming Features

- 🧩 npm package
- 🌐 Multi-model support (OpenAI, Anthropic, etc.)
- 🗣️ Voice command integration
- 📊 Advanced analytics and usage insights
- 🔐 API key encryption at rest
- 🎨 Dashboard UI for AI configuration

## 🐛 Troubleshooting

**Login fails?**
- Ensure the backend server is running (`npm run dev` in server directory)
- Check your .env file has all required variables

**Database errors?**
- Verify DATABASE_URL in .env
- Run `npx prisma migrate dev` to sync schema

**CLI command not found?**
- Run `npm link` in the server directory
- Check Node.js is installed


## 📝 License

This project is licensed under the [MIT](./LICENSE) License.

## ⭐ Star History

<p align="center">
  ⭐ Star this repo if you find it useful!
</p>

---

**Made with ❤️ by the Orbilt team**
