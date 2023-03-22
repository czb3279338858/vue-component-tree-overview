module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}


// {
//   "env": {
//     "node": true,
//     "browser": true,
//     "es6": true
//   },
//   "globals": {},
//   "parser": "E:\\vue-component-tree-overview\\node_modules\\.pnpm\\registry.npmmirror.com+vue-eslint-parser@8.3.0_eslint@7.32.0\\node_modules\\vue-eslint-parser\\index.js",
//   "parserOptions": {
//     "ecmaVersion": 2020,
//     "sourceType": "module",
//     "parser": "E:\\vue-component-tree-overview\\node_modules\\.pnpm\\registry.npmmirror.com+@typescript-eslint+parser@5.55.0_sgaiclxgc5mltnpgmg7py4v6ca\\node_modules\\@typescript-eslint\\parser\\dist\\index.js",
//     "extraFileExtensions": [
//       ".vue"
//     ],
//     "ecmaFeatures": {
//       "jsx": true
//     }
//   },
//   "plugins": [
//     "vue",
//     "@typescript-eslint"
//   ],
//   "rules": {
//     "no-console": [
//       "off"
//     ],
//     "no-debugger": [
//       "off"
//     ],
//     "@typescript-eslint/no-var-requires": [
//       "off"
//     ],
//     "@typescript-eslint/explicit-function-return-type": [
//       "off"
//     ],
//     "@typescript-eslint/adjacent-overload-signatures": [
//       "error"
//     ],
//     "@typescript-eslint/ban-ts-comment": [
//       "error"
//     ],
//     "@typescript-eslint/ban-types": [
//       "error"
//     ],
//     "no-array-constructor": [
//       "off"
//     ],
//     "@typescript-eslint/no-array-constructor": [
//       "error"
//     ],
//     "no-empty-function": [
//       "off"
//     ],
//     "@typescript-eslint/no-empty-function": [
//       "error"
//     ],
//     "@typescript-eslint/no-empty-interface": [
//       "error"
//     ],
//     "@typescript-eslint/no-explicit-any": [
//       "warn"
//     ],
//     "@typescript-eslint/no-extra-non-null-assertion": [
//       "error"
//     ],
//     "no-extra-semi": [
//       "off"
//     ],
//     "@typescript-eslint/no-extra-semi": [
//       "error"
//     ],
//     "@typescript-eslint/no-inferrable-types": [
//       "error"
//     ],
//     "no-loss-of-precision": [
//       "off"
//     ],
//     "@typescript-eslint/no-loss-of-precision": [
//       "error"
//     ],
//     "@typescript-eslint/no-misused-new": [
//       "error"
//     ],
//     "@typescript-eslint/no-namespace": [
//       "error"
//     ],
//     "@typescript-eslint/no-non-null-asserted-optional-chain": [
//       "error"
//     ],
//     "@typescript-eslint/no-non-null-assertion": [
//       "warn"
//     ],
//     "@typescript-eslint/no-this-alias": [
//       "error"
//     ],
//     "@typescript-eslint/no-unnecessary-type-constraint": [
//       "error"
//     ],
//     "no-unused-vars": [
//       "off"
//     ],
//     "@typescript-eslint/no-unused-vars": [
//       "warn"
//     ],
//     "@typescript-eslint/prefer-as-const": [
//       "error"
//     ],
//     "@typescript-eslint/prefer-namespace-keyword": [
//       "error"
//     ],
//     "@typescript-eslint/triple-slash-reference": [
//       "error"
//     ],
//     "constructor-super": [
//       "error"
//     ],
//     "for-direction": [
//       "error"
//     ],
//     "getter-return": [
//       "error"
//     ],
//     "no-async-promise-executor": [
//       "error"
//     ],
//     "no-case-declarations": [
//       "error"
//     ],
//     "no-class-assign": [
//       "error"
//     ],
//     "no-compare-neg-zero": [
//       "error"
//     ],
//     "no-cond-assign": [
//       "error"
//     ],
//     "no-const-assign": [
//       "error"
//     ],
//     "no-constant-condition": [
//       "error"
//     ],
//     "no-control-regex": [
//       "error"
//     ],
//     "no-delete-var": [
//       "error"
//     ],
//     "no-dupe-args": [
//       "error"
//     ],
//     "no-dupe-class-members": [
//       "error"
//     ],
//     "no-dupe-else-if": [
//       "error"
//     ],
//     "no-dupe-keys": [
//       "error"
//     ],
//     "no-duplicate-case": [
//       "error"
//     ],
//     "no-empty": [
//       "error"
//     ],
//     "no-empty-character-class": [
//       "error"
//     ],
//     "no-empty-pattern": [
//       "error"
//     ],
//     "no-ex-assign": [
//       "error"
//     ],
//     "no-extra-boolean-cast": [
//       "error"
//     ],
//     "no-fallthrough": [
//       "error"
//     ],
//     "no-func-assign": [
//       "error"
//     ],
//     "no-global-assign": [
//       "error"
//     ],
//     "no-import-assign": [
//       "error"
//     ],
//     "no-inner-declarations": [
//       "error"
//     ],
//     "no-invalid-regexp": [
//       "error"
//     ],
//     "no-irregular-whitespace": [
//       "error"
//     ],
//     "no-misleading-character-class": [
//       "error"
//     ],
//     "no-mixed-spaces-and-tabs": [
//       "error"
//     ],
//     "no-new-symbol": [
//       "error"
//     ],
//     "no-obj-calls": [
//       "error"
//     ],
//     "no-octal": [
//       "error"
//     ],
//     "no-prototype-builtins": [
//       "error"
//     ],
//     "no-redeclare": [
//       "error"
//     ],
//     "no-regex-spaces": [
//       "error"
//     ],
//     "no-self-assign": [
//       "error"
//     ],
//     "no-setter-return": [
//       "error"
//     ],
//     "no-shadow-restricted-names": [
//       "error"
//     ],
//     "no-sparse-arrays": [
//       "error"
//     ],
//     "no-this-before-super": [
//       "error"
//     ],
//     "no-undef": [
//       "error"
//     ],
//     "no-unexpected-multiline": [
//       "error"
//     ],
//     "no-unreachable": [
//       "error"
//     ],
//     "no-unsafe-finally": [
//       "error"
//     ],
//     "no-unsafe-negation": [
//       "error"
//     ],
//     "no-unused-labels": [
//       "error"
//     ],
//     "no-useless-catch": [
//       "error"
//     ],
//     "no-useless-escape": [
//       "error"
//     ],
//     "no-with": [
//       "error"
//     ],
//     "require-yield": [
//       "error"
//     ],
//     "use-isnan": [
//       "error"
//     ],
//     "valid-typeof": [
//       "error"
//     ],
//     "vue/multi-word-component-names": [
//       "error"
//     ],
//     "vue/no-arrow-functions-in-watch": [
//       "error"
//     ],
//     "vue/no-async-in-computed-properties": [
//       "error"
//     ],
//     "vue/no-computed-properties-in-data": [
//       "error"
//     ],
//     "vue/no-custom-modifiers-on-v-model": [
//       "error"
//     ],
//     "vue/no-dupe-keys": [
//       "error"
//     ],
//     "vue/no-dupe-v-else-if": [
//       "error"
//     ],
//     "vue/no-duplicate-attributes": [
//       "error"
//     ],
//     "vue/no-multiple-template-root": [
//       "error"
//     ],
//     "vue/no-mutating-props": [
//       "error"
//     ],
//     "vue/no-parsing-error": [
//       "error"
//     ],
//     "vue/no-reserved-keys": [
//       "error"
//     ],
//     "vue/no-reserved-props": [
//       "error",
//       {
//         "vueVersion": 2
//       }
//     ],
//     "vue/no-shared-component-data": [
//       "error"
//     ],
//     "vue/no-side-effects-in-computed-properties": [
//       "error"
//     ],
//     "vue/no-template-key": [
//       "error"
//     ],
//     "vue/no-textarea-mustache": [
//       "error"
//     ],
//     "vue/no-unused-components": [
//       "error"
//     ],
//     "vue/no-unused-vars": [
//       "error"
//     ],
//     "vue/no-use-v-if-with-v-for": [
//       "error"
//     ],
//     "vue/no-useless-template-attributes": [
//       "error"
//     ],
//     "vue/no-v-for-template-key": [
//       "error"
//     ],
//     "vue/no-v-model-argument": [
//       "error"
//     ],
//     "vue/require-component-is": [
//       "error"
//     ],
//     "vue/require-prop-type-constructor": [
//       "error"
//     ],
//     "vue/require-render-return": [
//       "error"
//     ],
//     "vue/require-v-for-key": [
//       "error"
//     ],
//     "vue/require-valid-default-prop": [
//       "error"
//     ],
//     "vue/return-in-computed-property": [
//       "error"
//     ],
//     "vue/use-v-on-exact": [
//       "error"
//     ],
//     "vue/valid-next-tick": [
//       "error"
//     ],
//     "vue/valid-template-root": [
//       "error"
//     ],
//     "vue/valid-v-bind-sync": [
//       "error"
//     ],
//     "vue/valid-v-bind": [
//       "error"
//     ],
//     "vue/valid-v-cloak": [
//       "error"
//     ],
//     "vue/valid-v-else-if": [
//       "error"
//     ],
//     "vue/valid-v-else": [
//       "error"
//     ],
//     "vue/valid-v-for": [
//       "error"
//     ],
//     "vue/valid-v-html": [
//       "error"
//     ],
//     "vue/valid-v-if": [
//       "error"
//     ],
//     "vue/valid-v-model": [
//       "error"
//     ],
//     "vue/valid-v-on": [
//       "error"
//     ],
//     "vue/valid-v-once": [
//       "error"
//     ],
//     "vue/valid-v-pre": [
//       "error"
//     ],
//     "vue/valid-v-show": [
//       "error"
//     ],
//     "vue/valid-v-slot": [
//       "error"
//     ],
//     "vue/valid-v-text": [
//       "error"
//     ],
//     "vue/comment-directive": [
//       "error"
//     ],
//     "vue/jsx-uses-vars": [
//       "error"
//     ],
//     "vue/script-setup-uses-vars": [
//       "error"
//     ]
//   },
//   "settings": {},
//   "ignorePatterns": []
// }