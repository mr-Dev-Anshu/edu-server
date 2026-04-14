# Code of Conduct — Coding Practices

This document defines the coding standards and practices for maintaining a clean, scalable, and high-quality codebase.

---

## 1. General Principles

* Write **readable, maintainable, and predictable code**.
* Prefer **clarity over cleverness**.
* Follow the **Single Responsibility Principle (SRP)**.
* Avoid unnecessary complexity.

---

## 2. Formatting & Style

* Use **Prettier** for consistent formatting.
* Follow **ESLint** rules strictly.
* Do not manually override formatting.

### Rules:
* 2-space indentation
* Single quotes
* Semicolons required
* Max line length: 100

---

## 3. Naming Conventions

### Files
* **Format:** Lowercase, dot-separated roles.
* **Rule:** No `camelCase` or `PascalCase` filenames.
* **Examples:**
    * `user.controller.js`
    * `user.service.js`
    * `user.repository.js`

### Functions
* **Format:** `camelCase`
* **Rule:** Verb-based naming.
* **Examples:**
    * `getUserById()`
    * `createSession()`
    * `validateToken()`

### Classes
* **Format:** `PascalCase`
* **Examples:**
    * `class UserService {}`
    * `class AuthController {}`

### Constants
* **Format:** `UPPER_CASE`
* **Examples:**
    * `const JWT_SECRET = '...';`
    * `const MAX_RETRIES = 3;`

---

## 4. Code Structure

Follow **layered architecture**: 
`controller` → `service` → `repository`

### Rules:
* **Controllers:** Handle request/response only.
* **Services:** Contain business logic.
* **Repositories:** Handle database access.
* **No cross-layer violations.**

---

## 5. Spacing & Readability

* Use one blank line between logical blocks.
* Do not use multiple consecutive empty lines.
* Always end files with a newline.

**Example:**
```javascript
const user = getUser();

if (!user) {
  return null;
}

return processUser(user);
```

---

## 6. Imports

* Keep all imports at the top of the file.
* Do not use inline imports.
* Remove unused imports.

---

## 7. Error Handling

* **Never ignore errors.**
* Use structured error handling.
* Avoid unnecessary `try-catch` blocks.

---

## 8. Logging

* Use meaningful logs.
* Avoid excessive logging.
* Do not leave debug logs in production code.

---

## 9. Code Quality Rules

* No unused variables.
* Prefer `const` over `let`; avoid `var`.
* Always use `===` instead of `==`.
* Avoid deeply nested logic.

---

## 10. File Responsibility

Each file must:
* Have a single responsibility.
* Be small and focused.
* Avoid mixing concerns.

---

## 11. Git Practices

* Write meaningful commit messages.
* Keep commits small and atomic.
* Do not commit broken code.

---

## 12. Enforcement

* **ESLint** and **Prettier** must pass before commit.
* Code reviews must follow this document.
* Violations must be corrected immediately.

---

## 13. Git Commit Standards

All commits must follow the **Conventional Commits** format.

### Format
`<type>(optional-scope): short description`

### Allowed Types
| Type | Description |
| :--- | :--- |
| **feat** | New feature |
| **fix** | Bug fix |
| **chore** | Maintenance / non-functional changes |
| **refactor** | Code improvement (no behavior change) |
| **docs** | Documentation updates |
| **style** | Formatting, lint fixes (no logic change) |
| **test** | Adding or updating tests |
| **perf** | Performance improvements |

### Examples
* `feat(auth): add login endpoint`
* `fix(user): handle null user response`
* `refactor(service): simplify validation logic`

### Rules
* Use lowercase type.
* Keep description short and clear.
* Avoid vague messages.

> **❌ Bad Examples:** 
- `fixed bug`
- `updated code`
- `misc changes`  

> **✅ Good Examples:** 
- `fix(auth): handle invalid token`
- `feat(user): add profile endpoint`

---

## 14. Commit Discipline

* One commit = one logical change.
* Do not mix unrelated changes.
* Ensure code passes lint and formatting before commit.
* Before every commit, run `npm run lint` and `npm run format` to ensure compliance.

---

### Final Note
**Clean code is not optional.** 

```text
Consistency, readability, and discipline are mandatory for scaling and maintaining the codebase.
```

### Happy coding! 🚀