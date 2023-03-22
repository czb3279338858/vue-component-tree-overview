/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { Linter } = require('eslint')
const { parseForESLint } = require('vue-eslint-parser')
const typescriptEslintParser = require('@typescript-eslint/parser')
const utils = require('eslint-plugin-vue/lib/utils/index')
module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	const linter = new Linter()
	const parserOptions = {
		ecmaVersion: 2020,
		sourceType: "module",
		parser: typescriptEslintParser,
		extraFileExtensions: [
			".vue"
		],
		ecmaFeatures: {
			"jsx": true
		}
	}
	linter.defineParser('vueEslintParser', {
		parseForESLint,
		parserOptions
	})
	linter.defineRule("my-rule", {
		create(context) {
			return utils.defineTemplateBodyVisitor(
				context,
				{},
				{
					/** @param {Program} node */
					Program(node) {

					}
				}
			)
		},
	});
	const config = {
		parserOptions,
		rules: { "my-rule": "error" },
		parser: 'vueEslintParser'
	};
	linter.verify(source, config)
	const newSource = `
	/**
	 * vue-overview-loader
	 *
	 * Resource Location: ${resource}
	 * Loaders chained to module: ${JSON.stringify(loaders)}
	 * Loader API Version: ${version}
	 * Is this in "webpack mode": ${webpack}
	 * This is the users request for the module: ${request}
	 */
	/**
	 * Original Source From Loader
	 */
	${source}`;

	return newSource;
}
