/**
 * See the webpack docs for more information about loaders:
 * https://webpack.js.org/contribute/writing-a-loader
 */
const { parse } = require('vue-eslint-parser')
module.exports = function loader(source) {
	const { loaders, resource, request, version, webpack } = this;
	console.log('vue-overview-loader');
	const ast = parse(source, {
		"ecmaVersion": 2020,
		"sourceType": "module",
		"parser": "@typescript-eslint/parser",
		"extraFileExtensions": [
			".vue"
		],
		"ecmaFeatures": {
			"jsx": true
		}
	})
	console.log(ast)
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
