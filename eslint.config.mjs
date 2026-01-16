import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  // Next.js Core Web Vitals rules (recommended)
  ...nextVitals,
  // TypeScript-specific rules from Next.js
  ...nextTs,
  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Custom rules
  {
    rules: {
      // Enforce no unused variables (catches unused imports too)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // Turn off base rule as it conflicts with TypeScript rule
      'no-unused-vars': 'off',
      // Suppress next/image warnings - we intentionally use <img> in some cases
      '@next/next/no-img-element': 'off',
    },
  },
])

export default eslintConfig