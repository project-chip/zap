// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides the REST API to the generation.
 * 
 * @module REST API: generation functions
 */

import { logError } from '../main-process/env';
import { mapDatabase, resolveTemplateDirectory, compileTemplate, infoFromDb, groupInfoIntoDbRow, resolveHelper, generateDataToPreview } from '../generator/static_generator.js'
import { getUppercase, getStrong, getHexValue } from "../handlebars/helpers/helper_utils.js"

/**
 *
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
export function registerGenerationApi(db, app) {
    app.get('/preview/:name', async (request, response) => {

        const HANDLEBAR_HELPER_UPPERCASE = 'uppercase';
        const HANDLEBAR_HELPER_STRONG = 'strong';
        const HANDLEBAR_HELPER_HEX_VALUE = 'hexValue';
        const HANDLEBAR_TEMPLATE_FILE_CLUSTERS = "cluster-id.handlebars"
        const HANDLEBAR_TEMPLATE_FILE_ENUMS = "enums.handlebars"
        const HANDLEBAR_TEMPLATE_FILE_BITMAPS = "bitmaps.handlebars"
        const DATABASE_ROW_TYPE_CLUSTER = "clusters"
        const DATABASE_ROW_TYPE_ENUMS = "enums"
        const DATABASE_ROW_TYPE_BITMAPS = "bitmaps"


        //cluster-id.h generation
        var clusterHandleBarHelpers = {}
        clusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase;
        var clusterRowToHandlebarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_CLUSTER, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CLUSTERS }];

        const clusterGenerationCode = await mapDatabase(db)
            .then(templateDir => resolveTemplateDirectory(templateDir, ""))
            .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_CLUSTERS]))
            .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_CLUSTER]))
            .then(helperResolution => resolveHelper(helperResolution, clusterHandleBarHelpers))
            .then(resultToFile => generateDataToPreview(resultToFile, clusterRowToHandlebarTemplateFileMap))
            .catch(err => logError(err))

        //enums.h generation
        var enumHandleBarHelpers = {}
        enumHandleBarHelpers[HANDLEBAR_HELPER_STRONG] = getStrong;
        enumHandleBarHelpers[HANDLEBAR_HELPER_HEX_VALUE] = getHexValue;
        var enumsRowToHandlebarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_ENUMS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ENUMS },
        { dbRowType: DATABASE_ROW_TYPE_BITMAPS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_BITMAPS }];

        const enumGenerationCode = await mapDatabase(db)
            .then(templateDir => resolveTemplateDirectory(templateDir, ""))
            .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ENUMS, HANDLEBAR_TEMPLATE_FILE_BITMAPS]))
            .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_ENUMS, DATABASE_ROW_TYPE_BITMAPS]))
            .then(databaseRowsWithEnumItems => groupInfoIntoDbRow(databaseRowsWithEnumItems, { tableName: 'ENUM_ITEMS', foreignKey: 'ENUM_REF', primaryKey: 'ENUM_ID', dbType: 'enums', columns: { NAME: "NAME", VALUE: "VALUE" } }))
            .then(databaseRowsWithBitmapFields => groupInfoIntoDbRow(databaseRowsWithBitmapFields, { tableName: 'BITMAP_FIELDS', foreignKey: 'BITMAP_REF', primaryKey: 'BITMAP_ID', dbType: 'bitmaps', columns: { NAME: "NAME", VALUE: "MASK" } }))
            .then(helperResolution => resolveHelper(helperResolution, enumHandleBarHelpers))
            .then(resultToFile => generateDataToPreview(resultToFile, enumsRowToHandlebarTemplateFileMap))
            .catch(err => logError(err))

        if (request.params.name === DATABASE_ROW_TYPE_CLUSTER) {
            response.json(clusterGenerationCode);
        } else if (request.params.name === DATABASE_ROW_TYPE_ENUMS) {
            response.json(enumGenerationCode);
        }
    })

}