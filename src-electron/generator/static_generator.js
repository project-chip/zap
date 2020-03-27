/** 
 * Copyright (c) 2020 Silicon Labs. All rights reserved.
 * 
 * @module JS API: generator logic
 */
import Handlebars from 'handlebars';
var fs = require('fs-extra');

import { selectAllClusters, selectAllEnums, selectAllEnumItems, selectAllBitmaps, selectAllBitmapFields } from "../db/query.js"

/**
 * Find the handlebar template file, compile and return the template file.
 * In the case of Generate this will take the template directory mentioned.
 * However in the case of the browser the templates come from the
 * zcl/generation-templates repository.
 *
 * @param {string} [templateDirectory=""] Directory where the templates reside
 * @param {string} [name=""] Name of the template file
 * @returns A compiled Template
 */
Handlebars.getTemplate = function(templateDirectory = "", name = "") {
	var source = "";
	if (templateDirectory) {
		source = fs.readFileSync(templateDirectory + '/' + name, 'utf8');
	} else {
		templateDirectory = __dirname + '/../../zcl/generation-templates';
		source = fs.readFileSync(templateDirectory + '/' + name, 'utf8');
	}
	return Handlebars.compile(source);
};

/**
 * Resolve is listed on the map containing the database.
 *
 * @export
 * @param {Object} db database
 * @returns A promise with resolve listed on the map
 */
export function mapDatabase(db) {
	return new Promise((resolve, reject) => {
		var resultantMap = {};
		resultantMap.database = db;
		resolve(resultantMap);
	})
}

/**
 * Resolve the handlebar template directory to be able to use the correct
 * handlebar templates for generation/preview.
 *
 * @export
 * @param {Object} map HashMap
 * @param {string} handlebarTemplateDirectory Handlebar template directory path
 * @returns A promise with resolve listed on a map which has the handlebar
 * directory.
 */
export function resolveTemplateDirectory(map, handlebarTemplateDirectory="") {
	return new Promise((resolve, reject) => {
		map.handlebarTemplateDirectory = handlebarTemplateDirectory;
		resolve(map);
	})
}

/**
 * Resolve the compiled handlebar templates for use.
 *
 * @export
 * @param {Object} map Map for database and template directory
 * @param {string[]} templateFiles Array of handlebar template files
 * @returns A promise with resolve listed on a map which has the compiled
 * templates.
 */
export function compileTemplate(map, templateFiles) {
	return new Promise((resolve, reject) => {
		for (let i=0; i<templateFiles.length; i++) {
			var compiledTemplate = Handlebars.getTemplate(map.handlebarTemplateDirectory, templateFiles[i]);
			map[templateFiles[i]] = compiledTemplate;
		}
		resolve(map);
	})
}

/**
 * The database information is retrieved by calling database query
 * functions. Then a resolve is listed on the map containing database, compiled
 * template and database row information so that they can be passed on to more
 * promises.
 *
 * @export
 * @param {Object} map Map for database, template directory and compiled templates
 * @param {string[]} dbRowType Array of strings with each string representing a
 * type of database row
 * @returns A promise with resolve listed on a map which has the database rows.
 */
export function infoFromDb(map, dbRowType) {
	return new Promise((resolve, reject) => {
		var db = map.database;
		var dbInfo = [];
		for (let i=0; i<dbRowType.length; i++) {
			if (dbRowType[i] === "clusters") {
				dbInfo[i] = selectAllClusters(db)
				.then((dbRows) => map[dbRowType[i]] = dbRows);
			}
			else if (dbRowType[i] == "enums") {
				dbInfo[i] = selectAllEnums(db)
				.then((dbRows) => map[dbRowType[i]] = dbRows);
			} else if (dbRowType[i] == "bitmaps") {
				dbInfo[i] = selectAllBitmaps(db)
				.then((dbRows) => map[dbRowType[i]] = dbRows);
			}
		}
		// Going through an array of promises and resolving them.
		Promise.all(dbInfo).then(() => {
			resolve(map);
		}).catch(
			(reason) => {
				console.log('infoFromDb Handle rejected promise ('+reason+') here.');
			}
		)
	})
}

/**
 * Additional information attached to each database row. Essentially a way
 * to group by content.
 *
 * @export
 * @param {Object} map Map containing database, compiled templates, database and
 * database rows for different datbase types.
 * @param {Object} groupByParams Object to group information by
 * @param {string} groupByParams.subItemName
 * @param {string} groupByParams.foreignKey
 * @param {string} groupByParams.primaryKey
 * @param {string} groupByParams.dbType
 * @param {string} groupByParams.columns
 * @returns A promise with resolve listed on a map which has the database,
 * compiled templates and database rows along with additional grouped by
 * content.
 */
export function groupInfoIntoDbRow(map, groupByParams) {
	return new Promise((resolve, reject) => {
		var subItemName = groupByParams.tableName;
		var foreignKey = groupByParams.foreignKey;
		var primaryKey = groupByParams.primaryKey
		var dbType = groupByParams.dbType;
		var columns = groupByParams.columns;

		var db = map.database;
		var dbRows = map[dbType];
		var subDbRows = [];
		var subItems;
		if (subItemName == 'ENUM_ITEMS') {
			subItems = selectAllEnumItems(db);
		} else if (subItemName == 'BITMAP_FIELDS') {
			subItems = selectAllBitmapFields(db);
		} else {
			return;
		}
		subItems.then(function(rows) {
			for (let i=0; i<rows.length;i++) {
				// create a map here and print in next prmoise to see if it is populated
				if ( subDbRows[rows[i][foreignKey]] == null) {
					subDbRows[rows[i][foreignKey]] = [{NAME: rows[i][columns.NAME], VALUE: rows[i][columns.VALUE]}];
				} else {
					var nameValue = {NAME: rows[i][columns.NAME], VALUE: rows[i][columns.VALUE]};
					subDbRows[rows[i][foreignKey]].push(nameValue);
				}
			}
			for (let j=0; j<dbRows.length; j++) {
				var pk = dbRows[j][primaryKey];
				dbRows[j][subItemName] = subDbRows[pk];
			}
			resolve(map);
		}).catch(
		(reason) => {
			console.log('groupInfoIntoDbRow Handle rejected promise ('+reason+') here.');
		})
	})
}

/**
 * Resolve the helper functions to be used in later promises.
 *
 * @export
 * @param {Object} map
 * @param {Object} helperFunctions Map for handlebar helper name to helper function
 * @returns A promise with resolve listed on a map which has the helper
 * functions.
 */
export function resolveHelper(map, helperFunctions) {
	return new Promise((resolve, reject) => {
		map.helperFunctions = helperFunctions;
		resolve(map);
	})
}

/**
 * Resolve the generation directory to be able to generate to the correct
 * directory.
 *
 * @export
 * @param {Object} map
 * @param {string} generationDirectory generation directory path.
 * @returns A promise with resolve listed on a map which has the generation
 * directory.
 */
export function resolveGenerationDirectory(map, generationDirectory) {
	return new Promise((resolve, reject) => {
		map.generationDirectory = generationDirectory;
		resolve(map);
	})
}

/**
 * The database information is used to show the generation output to a preview
 * pane using the compiled handlebar templates.
 *
 * @export
 * @param {Object} map
 * @param {Object[]} databaseRowToHandlebarTemplateFileMap Map linking the
 * database row type with handlebar template file.
 * @param {string} databaseRowToHandlebarTemplateFileMap.dbRowType Database
 * row type
 * @param {string} databaseRowToHandlebarTemplateFileMap.hTemplateFile Handlebar
 * template file
 * @returns A promise with resolve listed on the data which can be seen in the
 * preview pane.
 */
export function generateDataToPreview(map, databaseRowToHandlebarTemplateFileMap) {
	return new Promise((resolve, reject) => {
		var result='';
		for (let i=0; i<databaseRowToHandlebarTemplateFileMap.length; i++) {
			var compiledTemplate = map[databaseRowToHandlebarTemplateFileMap[i].hTemplateFile];
			var dbRows = map[databaseRowToHandlebarTemplateFileMap[i].dbRowType];
			for (var key in map.helperFunctions) {
				Handlebars.registerHelper(key, map.helperFunctions[key]);
			}
			var define = compiledTemplate({
			  type: dbRows
			});
			result = result + define;
		}
		resolve(result);
	})
}

/**
 * The database information is used to write the generation output to a file
 * using the compiled handlebar templates.
 *
 * @export
 * @param {Object} map
 * @param {string} outputFileName The generation file name
 * @param {Object[]} databaseRowToHandlebarTemplateFileMap Map linking the
 * database row type with handlebar template file.
 * @param {string} databaseRowToHandlebarTemplateFileMap.dbRowType Database
 * row type
 * @param {string} databaseRowToHandlebarTemplateFileMap.hTemplateFile Handlebar
 * template file
 * @returns A new promise resolve listed on the data which is generated.
 */
export function generateDataToFile(map, outputFileName, databaseRowToHandlebarTemplateFileMap) {
	return new Promise((resolve, reject) => {
		var result='';
		var generationDirectory = map.generationDirectory;
		for (let i=0; i<databaseRowToHandlebarTemplateFileMap.length; i++) {
			var compiledTemplate = map[databaseRowToHandlebarTemplateFileMap[i].hTemplateFile];
			var dbRows = map[databaseRowToHandlebarTemplateFileMap[i].dbRowType];
			for (var key in map.helperFunctions) {
				Handlebars.registerHelper(key, map.helperFunctions[key]);
			}
			var define = compiledTemplate({
			  type: dbRows
			});
			if ( !fs.existsSync(generationDirectory) ) {
				fs.mkdirSync(generationDirectory);
			}
			result = result + define;
		}
		resolve(result);
		fs.writeFileSync(generationDirectory + '/' + outputFileName, result);
	})
}
