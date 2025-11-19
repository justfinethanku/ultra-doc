# Ultra-Doc Goals & Constraints

Use this document as the definitive reference for what Ultra-Doc is trying to achieve and the boundaries every improvement must respect. It’s written for plugin authors, Claude operators, and collaborators so nobody needs to reconstruct the intent from memory.

## Core Goals

1. **Continuous self-healing documentation**  
   Ultra-Doc exists to keep documentation accurate after every code change. It should detect staleness, validate claims against the real source, patch lint errors, and fill gaps without human babysitting.

2. **Token-efficient context delivery**  
   The system must make it easy for Claude (or any AI) to retrieve only the relevant slices of documentation. JSON overlays (`TIMESTAMPS.json`, `SECTIONS.json`, `CODE_POINTERS.json`, `RELATIONSHIPS.json`) stay central because they shrink prompts by 60‑90% and reduce hallucinations.

3. **Low-friction experience for non-technical users**  
   Everything should be readable, actionable, and friendly even if someone rarely writes code. Messages, prompts, and output need plain-language explanations plus examples so the workflow feels approachable.

4. **Automation-first mindset**  
   Any suggestion or fix Ultra-Doc proposes must also be executable automatically by the plugin itself. If it requires manual editing, the plugin should either do it immediately or guide Claude to do it in the same run.

5. **Repo-agnostic operations**  
   The skill must behave the same way in any reasonable repository. Scripts should stick to git + Markdown + JSON primitives and avoid assumptions about frameworks or folder layouts beyond discovering docs.

## Operational Constraints

1. **Single slash command**  
   `/ultra-doc` is the only entry point. No subcommands, no flags. Every workflow (linting, autofixing, metadata sync, future diagnostics) must route through this command so users always start the same way.

2. **Decision tree orchestration**  
   After the command fires, Claude runs a decision tree that inspects repo state and presents options. The tree should stay fast, helpful, and eventually more robust, but it remains the way users pick actions—never additional slash commands.

3. **Automatable recommendations**  
   When we recommend a fix (e.g., normalize section headers, resync timestamps, rebuild indexes), it must be something the plugin can apply automatically in any repo. No recommendation should rely on manual steps unique to one project.

4. **Universal compatibility**  
   Assume the target repo only provides git history, Markdown files, and standard Node tooling. Scripts must not depend on custom binaries, private APIs, or network calls that would break in a different environment.

5. **User-friendly reporting**  
   Output should highlight both errors and warnings directly in the terminal/logs, not just hidden JSON files. Every message needs enough context (file path, example, reason) so someone unfamiliar with the codebase can act on it.

6. **Built-in update awareness (v1.1.0+)**  
   Future releases should keep the single-command flow but add a lightweight version check inside the decision tree. The plugin can gently prompt: “A newer Ultra-Doc version is available—update now?” before running other tasks.

## Practical Implications

- Documentation templates, lint rules, and metadata scripts must continue to operate as a cohesive system; when we tweak one, we revisit the others so Claude always gets synchronized information.
- New automation (like self-healing headings or metadata sync) should hook into the decision tree so users naturally encounter the capability without memorizing new commands.
- Any change should be tested inside a representative repo (like `ultimate_ai_assessment`) and then assumed to run in unfamiliar repos without extra configuration.

Refer back to this file whenever scoping new features or accepting contributions. If an idea violates a constraint, document why we’re making an exception or redesign it so the single-command, automation-first philosophy remains intact.
