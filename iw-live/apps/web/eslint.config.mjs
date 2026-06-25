// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

/**
 * ESLint v9 Flat Config for IntegrateWise OS App
 */
export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/build/**',
      '**/dist/**',
      'src_backup_*/**',
    ],
  },
  
  // Base ESLint recommended
  eslint.configs.recommended,
  
  // TypeScript
  ...tseslint.configs.recommended,
  
  // React and Next.js configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        React: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'warn',
    },
  },
  
  // General TypeScript rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },
);
