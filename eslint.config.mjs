import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  ...tseslint.configs.recommended,
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
      // Also catch regular JS unused vars (fallback)
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with TypeScript rule
      // Suppress next/image warnings - we intentionally use <img> in some cases
      '@next/next/no-img-element': 'off',
    },
  },
])

export default eslintConfig