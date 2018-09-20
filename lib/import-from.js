import fs from "fs";
import path from "path";
import postcss from "postcss";
import valueParser from "postcss-values-parser";
import getCustomProperties, {
	getMediaQueryCustomProperties
} from "./get-custom-properties";

/* Import Custom Properties from CSS AST
/* ========================================================================== */

function importCustomPropertiesFromCSSAST(root) {
	return Object.assign(getCustomProperties(root, { preserve: true }), {
		mediaQueries: getMediaQueryCustomProperties(root, { preserve: true })
	});
}

/* Import Custom Properties from CSS File
/* ========================================================================== */

async function importCustomPropertiesFromCSSFile(from) {
	const css = await readFile(path.resolve(from));
	const root = postcss.parse(css, { from: path.resolve(from) });

	return importCustomPropertiesFromCSSAST(root);
}

/* Import Custom Properties from Object
/* ========================================================================== */

function importCustomPropertiesFromObject(object) {
	const customProperties = Object.assign(
		{},
		Object(object).customProperties || Object(object)["custom-properties"]
	);
	// TODO: add object notation for MQs
	for (const key in customProperties) {
		customProperties[key] = valueParser(customProperties[key]).parse().nodes;
	}

	return customProperties;
}

/* Import Custom Properties from JSON file
/* ========================================================================== */

async function importCustomPropertiesFromJSONFile(from) {
	const object = await readJSON(path.resolve(from));

	return importCustomPropertiesFromObject(object);
}

/* Import Custom Properties from JS file
/* ========================================================================== */

async function importCustomPropertiesFromJSFile(from) {
	const object = await import(path.resolve(from));

	return importCustomPropertiesFromObject(object);
}

/* Import Custom Properties from Sources
/* ========================================================================== */
function combineCustomProperties(...sources) {
	const mediaQueries = [];
	sources.forEach(src => {
		// consolidate same MQ rules
		if (src.mediaQueries) {
			mediaQueries.push(src.mediaQueries);
		}
	});
	const flattened = [].concat.apply([], mediaQueries);

	return Object.assign(...sources, { mediaQueries: flattened });
}

export default function importCustomPropertiesFromSources(sources) {
	return sources
		.map(source => {
			if (source instanceof Promise) {
				return source;
			} else if (source instanceof Function) {
				return source();
			}

			// read the source as an object
			const opts =
				source === Object(source) ? source : { from: String(source) };

			// skip objects with Custom Properties
			if (opts.customProperties || opts["custom-properties"]) {
				return opts;
			}

			// source pathname
			const from = String(opts.from || "");

			// type of file being read from
			const type = (
				opts.type || path.extname(from).slice(1)
			).toLowerCase();

			return { type, from };
		})
		.reduce(async (customProperties, source) => {
			const { type, from } = await source;

			if (type === "ast") {
				return combineCustomProperties(
					customProperties,
					importCustomPropertiesFromCSSAST(from)
				);
			}

			if (type === "css") {
				return combineCustomProperties(
					customProperties,
					await importCustomPropertiesFromCSSFile(from)
				);
			}

			if (type === "js") {
				return combineCustomProperties(
					customProperties,
					await importCustomPropertiesFromJSFile(from)
				);
			}

			if (type === "json") {
				return combineCustomProperties(
					customProperties,
					await importCustomPropertiesFromJSONFile(from)
				);
			}

			return combineCustomProperties(
				customProperties,
				importCustomPropertiesFromObject(await source)
			);
		}, {});
}

/* Helper utilities
/* ========================================================================== */

const readFile = from =>
	new Promise((resolve, reject) => {
		fs.readFile(from, "utf8", (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});

const readJSON = async from => JSON.parse(await readFile(from));
