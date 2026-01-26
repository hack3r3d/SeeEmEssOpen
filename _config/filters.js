import { DateTime } from "luxon";

export default function(eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		const filtered = (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
		return [...new Set(filtered)]; // deduplicate
	});

	// Title case: capitalize first letter of each word, lowercase the rest
	eleventyConfig.addFilter("capitalize", (str) => {
		if (!str) return str;
		return str.split(' ').map(word =>
			word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		).join(' ');
	});

	eleventyConfig.addFilter("sortAlphabetically", strings =>
		(strings || []).sort((b, a) => b.localeCompare(a))
	);

	// Add suffix before file extension (e.g., "photo.jpg" -> "photo-400.jpg")
	eleventyConfig.addFilter("thumbSuffix", (filename, suffix = "-400") => {
		if (!filename) return filename;
		const lastDot = filename.lastIndexOf('.');
		if (lastDot === -1) return filename + suffix;
		return filename.slice(0, lastDot) + suffix + filename.slice(lastDot);
	});

	// Convert straight quotes to typographic "smart" quotes
	eleventyConfig.addFilter("smartQuotes", (str) => {
		if (!str) return str;
		return str
			// Double quotes: " -> curly quotes
			.replace(/"(\S)/g, '\u201C$1')      // Opening double quote (before non-space)
			.replace(/(\S)"/g, '$1\u201D')      // Closing double quote (after non-space)
			.replace(/"\s/g, '\u201D ')         // Closing double quote before space
			.replace(/\s"/g, ' \u201C')         // Opening double quote after space
			.replace(/^"/g, '\u201C')           // Opening double quote at start
			// Single quotes/apostrophes: ' -> curly quotes
			.replace(/'(\S)/g, '\u2018$1')      // Opening single quote
			.replace(/(\S)'/g, '$1\u2019')      // Closing single quote / apostrophe
			.replace(/'\s/g, '\u2019 ')         // Closing single quote before space
			.replace(/\s'/g, ' \u2018');        // Opening single quote after space
	});
};
