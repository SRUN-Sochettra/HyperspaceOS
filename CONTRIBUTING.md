# Contributing to HyperSpace

First off, thank you for considering contributing to HyperSpace! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

## How Can I Contribute?

### Reporting Bugs

- **Check the Issues**: Before creating a new issue, please check if the bug has already been reported.
- **Provide Detail**: Include as much detail as possible in your report (OS version, browser, steps to reproduce, and screenshots if applicable).

### Suggesting Enhancements

- **Be Specific**: Explain what the enhancement is and why it would be beneficial for the project.
- **Mockups**: If it's a UI change, a simple sketch or mockup goes a long way.

### Pull Requests

1. **Fork the Repo**: Create your own fork of the project.
2. **Branching**: Create a branch for your feature or fix (`git checkout -b feature/amazing-feature`).
3. **Coding Standards**:
   - Follow the existing project structure.
   - Use ES6+ features where appropriate.
   - Use the semantic tokens and restrained HyperSpace visual language.
4. **Test Your Changes**: Ensure your changes don't break the boot sequence or existing apps.
5. **Commit**: Keep your commit messages descriptive.
6. **Push**: Push to your branch (`git push origin feature/amazing-feature`).
7. **Open a PR**: Submit a Pull Request to the `main` branch.

---

## Technical Guidelines

### Architecture

HyperSpace is built with a modular architecture:
- **Core**: Kernel, FileSystem, and EventBus are the backbone. Avoid heavy modifications here unless necessary.
- **Apps**: New applications should be placed in `src/apps/[app-name]`.
- **UI**: Shared components belong in `src/ui`.

### Styling

- Use **CSS Variables** defined in `src/styles/variables.css` for consistency.
- Maintain the glass effect using `backdrop-filter: blur()` and semi-transparent backgrounds.
- Ensure all components are responsive.

### Virtual File System

- If your app needs to save data, use the `FileSystem` API rather than raw `localStorage`. This ensures the data is visible in the Files and Terminal apps.

---

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all, regardless of level of experience, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

---

## License

By contributing, you agree that your contributions will be licensed under its **MIT License**.

Happy Coding!