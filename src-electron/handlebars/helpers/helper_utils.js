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