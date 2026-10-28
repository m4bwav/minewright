import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import minecraftLinting from 'eslint-plugin-minecraft-linting';

export default tseslint.config(
  { ignores: ['behavior_pack/scripts/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: { 'minecraft-linting': minecraftLinting },
    rules: { 'minecraft-linting/avoid-unnecessary-command': 'error' },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly' } },
  },
);
