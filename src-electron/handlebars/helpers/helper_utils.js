/**
Given: String
Return: String
Description: return the given string in uppercase and convert spaces into
underscores.
*/
export function getUppercase(str) {
	str = findAndReplace(str, [" "], "_");
	return str.toUpperCase();
};

/**
 *
 *
 * @export
 * @param {*} value
 * @param {*} options
 * @returns String
 * Description: getSwitch helper receives a options hash which contains
 * options.fn that behaves like a compiled handlebars template.
 */
export function getSwitch(value, options) {
	this.switch_value = value.toLowerCase();
	this.switch_break = false;
	return options.fn(this);
};

/**
 *
 *
 * @export
 * @param {*} value
 * @param {*} options
 * @returns String
 * Description: getCase helper receives a options hash which contains
 * options.fn that behaves like a compiled handlebars template.
 */
export function getCase(value, options) {
	if (value == this.switch_value) {
		this.switch_break = true;
	  	return options.fn(this);
	}
};

/**
 *
 *
 * @export
 * @param {*} value
 * @param {*} options
 * @returns String
 * Description: getDefault helper receives a options hash which contains
 * options.fn that behaves like a compiled handlebars template.
 */
export function getDefault(value, options) {
	if (this.switch_break == false) {
		return options.fn(this);
	}
 };

/**
Given: String
Return: String
Description: return the given string such that camel case is changed into a
string with underscores and is also uppercase.
*/
export function getStrong(str) {
	str = str.replace(/\.?([A-Z][a-z])/g, function (x,y){return "_" + y}).replace(/^_/, "");
	return str.toUpperCase();
};

/**
Given: String
Return: String
Description: return the given string but convert it into a number and then
into a hex string to keep consistency in the hex strings values.
*/
export function getHexValue(str) {
	var hexString = parseInt(str, 16).toString(16).toUpperCase();
	var prefix;
	if (hexString.length % 2 == 0) {
		prefix = "0x";
	} else {
		prefix = "0x0";
	}
	var result = prefix + hexString;
	return result;
}

/**
Given: String
Return: String
Description: Change the target values using the replacement mentioned and
return the given string.
*/
function findAndReplace(string, target, replacement) {
	var i=0, j = 0, length = string.length, targetLength = target.length;
	for( j=0; j < targetLength; j++) {
	 	for (i=0; i < length; i++) {
			string = string.replace(target[j], replacement);
		}
	}
	return string;
}

/**
 *
 *
 * Given: String Array
 * @returns the length of largest String in the array
 */
export function getLargestStringInArray() {
	var stringArray = arguments[0];
	var lengthOfLargestString = 0, i = 0, stringLength = 0;
	for(i=0; i<stringArray.length;i++) {
		stringLength = stringArray[i].NAME.length;
		if ( stringLength > lengthOfLargestString ) {
			lengthOfLargestString = stringLength;
		}
	}
	return lengthOfLargestString;
}