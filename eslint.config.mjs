import nx from '@nx/eslint-plugin';

const zodPath = { name: 'zod', message: "Import from 'zod/mini' to keep bundles small." };

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/.nx',
      '**/.angular',
      '**/out-tsc',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.mts'],
    rules: {
      // CLAUDE.md "Allowed dependencies"
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:ui', 'type:infrastructure', 'type:testing'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:application', 'type:domain', 'type:testing'],
            },
            {
              sourceTag: 'type:application',
              onlyDependOnLibsWithTags: ['type:domain', 'type:testing'],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: ['type:domain', 'type:testing'],
            },
            // Test doubles; only spec files may import them (see the no-restricted-imports override below).
            { sourceTag: 'type:testing', onlyDependOnLibsWithTags: ['type:domain'] },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain'],
              bannedExternalImports: ['@angular/*', 'rxjs', 'rxjs/*'],
            },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            // Catalog -> Cart is a recorded one-way exception (docs/adr/0001-catalog-may-depend-on-cart.md).
            {
              sourceTag: 'scope:catalog',
              onlyDependOnLibsWithTags: ['scope:catalog', 'scope:shared', 'scope:cart'],
            },
            {
              sourceTag: 'scope:cart',
              onlyDependOnLibsWithTags: ['scope:cart', 'scope:shared'],
            },
          ],
        },
      ],
      'no-restricted-imports': ['error', { paths: [zodPath] }],
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [zodPath],
          patterns: [
            { group: ['@ngsample/*-testing'], message: 'Test doubles are for spec files only.' },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
];
