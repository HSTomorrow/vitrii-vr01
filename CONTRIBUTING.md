# Contributing to Vitrii

Thank you for your interest in contributing to Vitrii! We welcome contributions from everyone. This document provides guidelines and instructions for contributing.

## 🎯 Code of Conduct

Be respectful, inclusive, and professional in all interactions. We're building a welcoming community.

## 🚀 Getting Started

### 1. Fork the Repository
```bash
# Click "Fork" on GitHub to create your own copy
```

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/vitrii-vr01.git
cd vitrii-vr01
```

### 3. Add Upstream Remote
```bash
git remote add upstream https://github.com/HSTW-Herestomorrow/vitrii-vr01.git
```

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/bug-name
```

## 📝 Development Guidelines

### Code Style
- **TypeScript**: Use strict typing, avoid `any` type
- **React**: Use functional components with hooks
- **Naming**: Use descriptive, camelCase names
- **Formatting**: Follow existing code style in the file

### File Organization
```
client/
├── pages/          # Full page components
├── components/     # Reusable UI components
├── contexts/       # React Context
└── hooks/          # Custom React hooks

server/
├── routes/         # API route handlers
├── lib/            # Utility functions
└── middleware/     # Express middleware
```

### Before Writing Code

1. **Check existing issues** - Don't duplicate work
2. **Create a GitHub issue** - Discuss feature ideas before implementation
3. **Wait for approval** - Get feedback on your approach

### While Writing Code

1. **Follow TypeScript best practices**
   ```typescript
   // ✅ Good
   interface User {
     id: number;
     name: string;
   }
   
   // ❌ Avoid
   const user: any = { /* ... */ };
   ```

2. **Add meaningful comments**
   ```typescript
   // Calculate total cost including tax
   const total = price * (1 + taxRate);
   ```

3. **Keep functions small and focused**
   ```typescript
   // ✅ Good - single responsibility
   function getUserById(id: number) {
     return prisma.usuario.findUnique({ where: { id } });
   }
   
   // ❌ Avoid - doing too much
   function processUserAndSendEmail(id) {
     // ... 50 lines of logic
   }
   ```

4. **Use meaningful variable names**
   ```typescript
   // ✅ Good
   const isUserActive = user.isActive;
   
   // ❌ Avoid
   const x = u.a;
   ```

### Testing Your Changes

```bash
# Run the dev server
pnpm run dev

# Check for TypeScript errors
pnpm run type-check

# Test your feature thoroughly before submitting PR
```

## 📋 Types of Contributions

### Bug Fixes
1. Create an issue describing the bug
2. Create a branch: `fix/bug-description`
3. Fix the issue with tests if applicable
4. Submit PR with detailed description

### Features
1. Discuss feature in an issue first
2. Create a branch: `feature/feature-name`
3. Implement with tests where applicable
4. Submit PR with feature documentation

### Documentation
1. Update README.md, CONTRIBUTING.md, or code comments
2. Improve clarity and correctness
3. Add examples if helpful

### Performance Improvements
1. Benchmark before/after
2. Document the improvement
3. Explain why it matters

## 🔄 Submitting a Pull Request

### PR Title
Use clear, descriptive titles:
- ✅ `feat: Add waiting list management to Agenda`
- ✅ `fix: Correct dropdown selection in Agenda form`
- ✅ `docs: Update README with API endpoints`
- ❌ `Update stuff`

### PR Description
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
Steps to verify the changes:
1. ...
2. ...

## Screenshots (if applicable)
Include before/after screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

### Before Submitting

```bash
# Update with latest main branch
git fetch upstream
git rebase upstream/main

# Run all checks
pnpm run dev              # Test locally
pnpm run type-check      # Check TypeScript
```

## 🏗️ Architecture Guidelines

### Adding a New API Route

1. **Create route file** in `server/routes/`
   ```typescript
   // server/routes/my-feature.ts
   import { RequestHandler } from "express";
   import prisma from "../lib/prisma";
   
   export const getMyData: RequestHandler = async (req, res) => {
     // Implementation
   };
   ```

2. **Register route** in `server/index.ts`
   ```typescript
   import { getMyData } from "./routes/my-feature";
   
   app.get("/api/my-feature", getMyData);
   ```

3. **Add validation** with Zod
   ```typescript
   const MySchema = z.object({
     id: z.number().positive(),
     name: z.string().min(1),
   });
   ```

### Adding a New Page

1. **Create page** in `client/pages/MyPage.tsx`
   ```typescript
   export default function MyPage() {
     return (
       <div>
         <Header />
         {/* Page content */}
         <Footer />
       </div>
     );
   }
   ```

2. **Add route** in `client/App.tsx`
   ```typescript
   import MyPage from "./pages/MyPage";
   
   <Route path="/my-page" element={<MyPage />} />
   ```

3. **Add navigation link** in `Header.tsx`
   ```typescript
   <Link to="/my-page">My Page</Link>
   ```

### Adding a New Component

1. **Create component** in `client/components/`
2. **Use TypeScript interfaces** for props
3. **Add JSDoc comments** for exported components
   ```typescript
   /**
    * Displays a user profile card
    * @param user - The user object
    * @param onEdit - Callback when edit is clicked
    */
   export function UserCard({ user, onEdit }: Props) {
     // ...
   }
   ```

## 📚 Project Structure Reminder

```
vitrii-vr01/
├── client/
│   ├── pages/         ← Full page components
│   ├── components/    ← Reusable components
│   ├── contexts/      ← React Context
│   ├── App.tsx        ← Routes
│   └── main.tsx       ← Entry point
├── server/
│   ├── routes/        ← API endpoints
│   ├── lib/           ← Utilities
│   └── index.ts       ← Server setup
├── prisma/
│   └── schema.prisma  ← Database schema
├── public/            ← Static files
├── package.json
├── README.md
└── LICENSE
```

## 🔍 Code Review Process

When you submit a PR:
1. Automated checks run (TypeScript, etc.)
2. Maintainers review the code
3. Changes may be requested
4. Once approved, PR is merged

### What We Look For
- ✅ Code quality and style
- ✅ Proper error handling
- ✅ Type safety
- ✅ Performance
- ✅ Security
- ✅ Documentation

## 💡 Tips for Better PRs

1. **Keep PRs focused** - One feature per PR
2. **Write clear commit messages**
   ```bash
   git commit -m "feat: Add waiting list to Agenda (fixes #123)"
   ```
3. **Link related issues** - Use `fixes #123` in PR description
4. **Test thoroughly** - Don't assume it works
5. **Document changes** - Update README if needed

## 🆘 Need Help?

- **Questions?** Open a [Discussion](https://github.com/HSTW-Herestomorrow/vitrii-vr01/discussions)
- **Found a bug?** [Report an Issue](https://github.com/HSTW-Herestomorrow/vitrii-vr01/issues)
- **Have an idea?** [Start a Discussion](https://github.com/HSTW-Herestomorrow/vitrii-vr01/discussions)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Vitrii! 🎉
