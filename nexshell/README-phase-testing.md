# NexShell Phase Testing

## Phase 1 — Intro Screen + Layout

1. `npm install`
2. `npm run dev`
3. Verify the Electron window centers the Intro Screen with:
   - Placeholder logo box, description, and the text “Built by Savitender Singh”.
   - Command grid showing ls, pwd, cd, jobs, killjobs, fetch, grep, unique, and sort with dotted bullets.
   - A visible CTA text reading “Press any key or click to enter the terminal” that responds to clicks.

Additional phases will extend this document with their own acceptance criteria.

## Phase 2 — Terminal UI + Dynamic Prompt

1. `npm run dev`
2. From the Intro screen, press any key to enter the terminal. Confirm the prompt shows the real hostname, current working directory, and permission badge immediately.
3. Type `pwd` and press Enter. The working directory returned should match the prompt.
4. Type `ls` and press Enter. Directory entries for the working directory should print.
5. Type `nexus apt update` and press Enter. Output must read “Simulated: nexus apt update — no external package operations performed.” and the `nexus` prefix stays neon red while typing.

## Phase 3 — Jobs & Background Execution

1. `npm run dev` and enter the terminal.
2. Start a background task with a trailing ampersand, e.g., `ls &`. The terminal should report `Started job #<id> ...`.
3. Run `jobs` and confirm the new job appears with its id and status.
4. Run `killjobs <id>` using the id from step 2. Command output should acknowledge termination and a subsequent `jobs` call must no longer list that job.
5. Prepare a sample text file (e.g., `echo "alpha\nbeta\nalpha" > sample.txt`). Run `grep "alpha" sample.txt` to see matching lines, `unique sample.txt` to return only unique rows, and `sort sample.txt` to show sorted output.
6. Validate `fetch <localfile>` reads files under 50KB and `fetch https://example.com` prints headers and a small body snippet.
7. Run `pwd`, press the Up arrow to bring it back, and Down arrow to cycle forward, confirming command history navigation works.

## Phase 4 — Packaging, Desktop Integration & Docs

1. Install deps once with `npm install`.
2. `npm run dev` should still launch the Electron window and retain all Phase 1–3 behaviors.
3. `npm run build` runs both the Electron TypeScript compile and Vite bundling without errors, producing `dist/` output.
4. `npm run package` after a build writes `release/nexshell-package.txt` describing the packaged assets (stub proving packaging flow). Inspect the file to confirm a timestamp and dist file listing.
5. Optional sanity check: `npm run start` launches the production Electron bundle (assumes `npm run build` has already populated compiled assets).
