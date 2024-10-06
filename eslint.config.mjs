import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser'; // Babelパーサをインポート

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parser: babelParser, // parserはlanguageOptions内に移動
      ecmaVersion: 2021, // ECMAScriptバージョン
      sourceType: 'module', // ESモジュールのサポート
    },
    plugins: {
      react: pluginReact,
      prettier: pluginPrettier,
    },
    settings: {
      react: {
        version: 'detect', // Reactのバージョンを自動検出
      },
    },
    rules: {
      'prettier/prettier': 'error',
      ...pluginReact.configs.recommended.rules,
    },
  },
  configPrettier,
];
