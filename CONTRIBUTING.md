# Contributing to HyperSpace

Thank you for considering contributing to HyperSpace. Contributions that improve the browser-native desktop experience are welcome.

## How Can I Contribute?

### Reporting Bugs

- Check the existing issues before opening a new report.
- Include the operating system, browser, steps to reproduce, expected behavior, actual behavior, and screenshots when useful.
- Separate observed behavior from assumptions and include relevant command output or runtime evidence.

### Suggesting Enhancements

- Explain the problem the enhancement would solve and why it benefits the project.
- Include a sketch or mockup for UI changes when helpful.

### Pull Requests

1. Fork the repository and create a focused branch for your feature or fix.
2. Follow the existing project structure and use ES6+ features where appropriate.
3. Preserve the semantic tokens and restrained HyperSpace visual language.
4. Keep changes scoped and avoid unrelated formatting or generated files.
5. Run the relevant tests, build, and verification commands before opening a pull request.
6. Describe the behavior changed, the commands run, and any known limitations.
7. Keep commit messages descriptive and submit the pull request against `main`.

Do not commit secrets, `.env` files, `node_modules/`, `dist/`, test reports, or other generated dependency/build directories. Do not modify recorded verification evidence to imply that a check ran when it did not.

## Technical Guidelines

### Architecture

HyperSpace is built with a modular architecture:

- **Core**: Kernel, FileSystem, and EventBus are the backbone. Avoid heavy modifications here unless necessary.
- **Apps**: New applications should be placed in `src/apps/[app-name]`.
- **UI**: Shared components belong in `src/ui`.

### Styling

- Use **CSS Variables** defined in `src/styles/variables.css` for consistency.
- Maintain the glass effect using `backdrop-filter: blur()` and semi-transparent backgrounds.
- Ensure components remain responsive at the supported viewport sizes.

### Virtual File System

- If an app needs to save data, use the `FileSystem` API rather than raw `localStorage`. This keeps data visible in the Files and Terminal apps.

## Local Verification

The commands below are the repository's documented local checks:

```bash
npm install
npm test
npm run build
npm run dev -- --host 127.0.0.1
python scripts/verify_runtime.py
```

Only describe browser verification as passing when the verifier exits successfully. Screenshots are diagnostic artifacts, not proof by themselves. Mail is local-only, and Browser and Weather behavior remains network-dependent.

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for everyone, regardless of level of experience, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**.

Happy Coding!
