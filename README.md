# TypeScript Base Starter

This repository serves as a base structure for starting new TypeScript modules. It is designed to promote maintainability, modularity, and ease of upgrades for dependencies.

## Structure Overview

```
main/
  ├── core/
  │   ├── services/
  │   ├── models/
  │   ├── controllers/
  │   ├── dto/
  │   ├── utils/
  │   └── enum/
  └── frame/
      ├── utils/
      └── modules/
```

## Approach

- **No direct package dependencies in `core/`:**  
  All third-party packages and external dependencies are added only in the `frame/` folder.
- **Mapping via `frame/`:**  
  The `frame/` folder acts as a bridge or mapper. Any package or utility needed by `core/` is first integrated into `frame/`, then exposed to `core/` through well-defined interfaces or wrappers.
- **Upgrade and Maintenance:**  
  If a package needs to be upgraded or replaced, changes are made only in the `frame/` folder. The `core/` code remains untouched, as it interacts only with the abstractions provided by `frame/`.

## How to Use This Base Repo

1. **Clone this repository:**

   ```sh
   git clone <repo-url> your-new-module
   cd your-new-module
   ```

2. **Install dependencies:**

   ```sh
   npm install
   # or
   pnpm install
   ```

3. **Add new packages:**

   - Install any new package as usual.
   - Integrate it in the `frame/` folder (e.g., create a wrapper in `frame/modules/` or `frame/utils/`).
   - Expose only the required functionality to `core/`.

4. **Develop your module:**

   - Write your business logic in the `core/` folder.
   - Use only the interfaces or utilities exposed by `frame/`.

5. **Upgrade or swap packages:**
   - Make changes only in `frame/` to upgrade or replace a package.
   - No changes required in `core/` as long as the interface remains the same.

## Design Pattern and Rationale

This approach is rooted in well-established software design principles:

- **Dependency Inversion Principle (SOLID):**  
  High-level modules (`core/`) do not depend directly on low-level modules (external packages); both depend on abstractions. This separation ensures that business logic remains decoupled from specific implementations.

- **Adapter Pattern:**  
  The `frame/` layer acts as an adapter, translating and exposing only the necessary interfaces from third-party packages to the `core` layer. This makes it easy to upgrade or swap out dependencies with minimal impact.

- **Hexagonal Architecture (Ports and Adapters):**  
  By isolating external dependencies in the `frame/` layer, the codebase achieves a clear separation between the application's core logic and its external interfaces.

**Benefits of this approach:**

- Enhances maintainability and scalability.
- Simplifies dependency upgrades and replacements.
- Improves testability by allowing easy mocking of external dependencies.

This design pattern is widely adopted in robust, long-lived codebases and is highly recommended for projects that prioritize clean architecture and long-term flexibility.
