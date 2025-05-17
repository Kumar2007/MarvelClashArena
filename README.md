## Summary

Marvel Clash Arena is a full-stack web application that delivers an immersive arena battle experience featuring Marvel-themed characters. It leverages modern web technologies—including Vite, TypeScript, tRPC, Drizzle ORM, and Tailwind CSS—to provide a responsive, type-safe, and scalable platform. With real-time battles, configurable environment support, and a modular codebase, developers can quickly set up, extend, and maintain the project.

## Description

In Marvel Clash Arena, players choose from a roster of Marvel-inspired heroes and villains and engage in real-time clashes. The frontend client, powered by Vite and TypeScript, delivers an interactive UI with mobile-first responsive design. The backend, built on Node.js with tRPC, exposes type-safe APIs that share types seamlessly between client and server. Drizzle ORM handles database interactions, offering zero-runtime-dependency SQL queries, while Tailwind CSS enables utility-first, consistent styling.

## Features

* **Real-time Arena Battles**: WebSocket or HTTP subscriptions enable fast-paced, bi-directional updates.
* **Type-Safe Endpoints**: Built with tRPC for end-to-end type sharing across front and back end.
* **Modern Tooling**: Vite dev server with lightning-fast Hot Module Replacement (HMR).
* **Lightweight ORM**: Drizzle ORM for type-safe, zero-dependency database queries.
* **Utility-First Styling**: Tailwind CSS keeps styles expressive and maintainable.
* **Environment Configurability**: Manage settings via Vite’s `import.meta.env`.
* **Responsive Design**: Mobile-first principles with Tailwind’s responsive utilities.

## Tech Stack

* **TypeScript**: Static typing for both client and server.
* **Vite**: Next-generation build tool and dev server.
* **Tailwind CSS**: Utility-first CSS framework.
* **tRPC**: End-to-end typed RPC framework.
* **Drizzle ORM**: TypeScript-first ORM for SQL databases.
* **Node.js**: Runtime for the backend API.
* **PostCSS**: CSS transformations via JavaScript plugins.
* **npm/Yarn**: Dependency management.

## Prerequisites

* **Node.js** ≥ 14.x (LTS)
* **npm** ≥ 6.x or **Yarn** ≥ 1.x
* **Git** for version control
* **Database**: SQLite, MySQL, or PostgreSQL (configured via env)

## Installation

1. **Clone**:

   ```bash
   git clone https://github.com/Kumar2007/MarvelClashArena.git
   cd MarvelClashArena
   ```
2. **Install Dependencies**:

   ```bash
   npm install
   ```
3. **Configure Env**:
   Copy `.env.example` to `.env` and set your database URL and API keys.
4. **Database Migrations** (Drizzle Kit):

   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

## Running Locally

* **Development (Client + Server)**:

  ```bash
  npm run dev
  ```

  Access client at `http://localhost:5173` and API at `http://localhost:3000`.

* **Production Build**:

  ```bash
  npm run build
  npm start
  ```

## Project Structure

```
.
├── client/            # Vite frontend (TypeScript + Tailwind CSS)
├── server/            # Node.js API with tRPC
├── shared/            # Shared types and utilities
├── drizzle.config.ts  # Drizzle ORM setup
├── tailwind.config.js # Tailwind configuration
├── postcss.config.js  # PostCSS setup
├── package.json       # Scripts & dependencies
└── tsconfig.json      # TypeScript compiler settings
```

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m "Add YourFeature"`)
4. Push (`git push origin feature/YourFeature`)
5. Open a Pull Request and describe your changes

Please follow existing code style and add tests where applicable.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

For support or questions, open an issue or join our Discord community.
