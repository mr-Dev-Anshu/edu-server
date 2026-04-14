import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import unicorn from 'eslint-plugin-unicorn';

export default [
  js.configs.recommended,
  {
    plugins: {
      prettier,
      unicorn,
    },

    rules: {
      'prettier/prettier': 'error',

      // Naming
      camelcase: ['error', { properties: 'always' }],

      // File naming
      'unicorn/filename-case': 'off',
      'filenames/match-regex': [
        'error',
        '^[a-z]+(-[a-z]+)*\\.(controller|service|repository)\\.js$',
        true,
      ],

      // -------- LINE SPACING RULES --------

      // Blank line between logical blocks
      'padding-line-between-statements': [
        'error',

        // always blank line before return
        { blankLine: 'always', prev: '*', next: 'return' },

        // after variable declarations
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },

        // before function declarations
        { blankLine: 'always', prev: '*', next: 'function' },

        // after imports (if using ES modules)
        { blankLine: 'always', prev: 'import', next: '*' },
      ],

      // Empty line between class members
      'lines-between-class-members': ['error', 'always'],

      // Limit consecutive empty lines
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],

      // Require newline at end of file
      'eol-last': ['error', 'always'],

      // No trailing spaces
      'no-trailing-spaces': 'error',

      // General quality
      'no-unused-vars': 'warn',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
