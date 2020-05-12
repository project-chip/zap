// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides the REST API to the generation.
 * 
 * @module REST API: generation functions
 */

import { logError } from '../main-process/env';
import { mapDatabase, resolveTemplateDirectory, compileTemplate, infoFromDb, groupInfoIntoDbRow, resolveHelper, generateDataToPreview } from '../generator/static_generator.js'
import { getUppercase, getStrong, getHexValue, getLargestStringInArray, getSwitch, getCase, getDefault } from "../handlebars/helpers/helper_utils.js"

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
        const HANDLEBAR_HELPER_LENGTH_OF_LARGEST_STRING = 'largestStringInArray';
        const HANDLEBAR_HELPER_SWITCH = "switch";
        const HANDLEBAR_HELPER_CASE = "case";
        const HANDLEBAR_HELPER_DEFAULT = "default";
        const HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE = "att-storage.handlebars";
        const HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS = "af-structs.handlebars";
        const HANDLEBAR_TEMPLATE_FILE_CLUSTERS = "cluster-id.handlebars";
        const HANDLEBAR_TEMPLATE_FILE_ENUMS = "enums.handlebars";
        const HANDLEBAR_TEMPLATE_FILE_BITMAPS = "bitmaps.handlebars";
        const HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS = "print-cluster.handlebars";
        const DATABASE_ROW_TYPE_CLUSTER = "clusters";
        const DATABASE_ROW_TYPE_ENUMS = "enums";
        const DATABASE_ROW_TYPE_BITMAPS = "bitmaps";
        const DATABASE_ROW_TYPE_PRINT_CLUSTER = "print-cluster";
        const DATABASE_ROW_TYPE_AF_STRUCTS = "af-structs";
        const DATABASE_ROW_TYPE_ATT_STORAGE = "att-storage";


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

        //print-cluster.h generation
        var printClusterHandleBarHelpers = {}
        printClusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase;
        printClusterHandleBarHelpers[HANDLEBAR_HELPER_LENGTH_OF_LARGEST_STRING] = getLargestStringInArray;
        var printClusterRowToHandleBarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_PRINT_CLUSTER, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS }];

        const printClusterGenerationCode = await mapDatabase(db)
            .then(templateDir => resolveTemplateDirectory(templateDir, ""))
            .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS]))
            .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_PRINT_CLUSTER]))
            .then(helperResolution => resolveHelper(helperResolution, printClusterHandleBarHelpers))
            .then(resultToFile => generateDataToPreview(resultToFile, printClusterRowToHandleBarTemplateFileMap))
            .catch(err => logError(err))

        //af-structs.h generation
        var afStructsHandleBarHelpers = {}
        afStructsHandleBarHelpers[HANDLEBAR_HELPER_SWITCH] = getSwitch;
        afStructsHandleBarHelpers[HANDLEBAR_HELPER_CASE] = getCase;
        afStructsHandleBarHelpers[HANDLEBAR_HELPER_DEFAULT] = getDefault;
        var afStructsRowToHandleBarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_AF_STRUCTS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS }];

        const afStructsGenerationCode = await mapDatabase(db)
            .then(templateDir => resolveTemplateDirectory(templateDir, ""))
            .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS]))
            .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_AF_STRUCTS]))
            .then(databaseRowsWithEnumItems => groupInfoIntoDbRow(databaseRowsWithEnumItems, { tableName: 'STRUCT_ITEMS', foreignKey: 'STRUCT_REF', primaryKey: 'STRUCT_ID', dbType: 'af-structs', columns: { NAME: "NAME", VALUE: "TYPE" } }))
            .then(helperResolution => resolveHelper(helperResolution, afStructsHandleBarHelpers))
            .then(resultToFile => generateDataToPreview(resultToFile, afStructsRowToHandleBarTemplateFileMap))
            .catch(err => logError(err))

        //att-storage.h generation
        var attStorageRowToHandleBarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_ATT_STORAGE, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE }];

        const attStorageGenerationCode = await mapDatabase(db)
            .then(templateDir => resolveTemplateDirectory(templateDir, ""))
            .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE]))
            .then(resultToFile => generateDataToPreview(resultToFile, attStorageRowToHandleBarTemplateFileMap))
            .catch(err => logError(err))

        if (request.params.name === DATABASE_ROW_TYPE_CLUSTER) {
            response.json(clusterGenerationCode);
        } else if (request.params.name === DATABASE_ROW_TYPE_ENUMS) {
            response.json(enumGenerationCode);
        } else if (request.params.name === DATABASE_ROW_TYPE_PRINT_CLUSTER) {
            response.json(printClusterGenerationCode);
        } else if (request.params.name === DATABASE_ROW_TYPE_AF_STRUCTS) {
            response.json(afStructsGenerationCode);
        } else if (request.params.name == DATABASE_ROW_TYPE_ATT_STORAGE) {
            response.json(attStorageGenerationCode);
        }
    })

}