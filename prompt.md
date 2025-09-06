Create a Node.js + TypeScript web application in the current directory with the following requirements:

- Project name: `il-forno`
- Runtime: Node.js 22
- Use Node’s built-in type stripping (`--experimental-strip-types`) instead of `tsc`
- Frontend: React.js v19 with TypeScript + TailwindCSS
- Backend-for-frontend (BFF): Fastify v5 with TypeScript
- No tools, frameworks, or libraries other than React, Tailwind, Fastify, Node.js, and TypeScript
- The application is for internal use, so keep it minimal and without unnecessary fluff
- Use a monorepo-style structure in the current directory, with two folders:
  - `/frontend` for the React app
  - `/backend` for the Fastify app
- The Fastify backend should serve the built React frontend at startup (no other services yet)

Frontend requirements:

- React pages (with routing) for:
  - `/` → index
  - `/add-customer` → add-customer
  - `/customer-list` → customer-list
  - `/planner` → planner
- For now, each page should just render an empty placeholder component (e.g., `<h1>PageName</h1>`)
- Configure TailwindCSS properly so it works with React v19
- Setup basic project structure with `src/` folder inside frontend

Backend requirements:

- Fastify v5 setup in `/backend`
- Run TypeScript directly using `node --experimental-strip-types`
- Serve the React frontend build output
- No extra endpoints or services at this stage

General:

- Include `package.json` scripts for:
  - running the backend with `node --experimental-strip-types ./src/index.ts`
  - running the frontend in dev mode
  - building the frontend
  - starting the backend and serving the built frontend
- Keep everything in the current directory, under project name `il-forno`
- Do not use additional tools beyond those listed
