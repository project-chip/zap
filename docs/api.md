## Modules

<dl>
<dt><a href="#module_JS API_ low level database access">JS API: low level database access</a></dt>
<dd><p>This module provides generic DB functions for performing SQL queries.</p>
</dd>
<dt><a href="#module_JS API_ database queries">JS API: database queries</a></dt>
<dd><p>Contains all the application queries.</p>
</dd>
<dt><a href="#module_JS API_ generator logic">JS API: generator logic</a></dt>
<dd><p>Copyright (c) 2020 Silicon Labs. All rights reserved.</p>
</dd>
<dt><a href="#module_REST API_ admin functions">REST API: admin functions</a></dt>
<dd><p>This module provides the REST API to the admin functions.</p>
</dd>
<dt><a href="#module_REST API_ generation functions">REST API: generation functions</a></dt>
<dd><p>This module provides the REST API to the generation.</p>
</dd>
<dt><a href="#module_REST API_ static zcl functions">REST API: static zcl functions</a></dt>
<dd><p>This module provides the REST API to the static zcl queries.</p>
</dd>
<dt><a href="#module_REST API_ user data">REST API: user data</a></dt>
<dd><p>This module provides the REST API to the user specific data.</p>
</dd>
<dt><a href="#module_JS API_ http server">JS API: http server</a></dt>
<dd><p>This module provides the HTTP server functionality.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#generateInDir">generateInDir()</a></dt>
<dd><p>Given: Browser Window
Returns: N/A
Description: This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.</p>
</dd>
<dt><a href="#setHandlebarTemplateDirectory">setHandlebarTemplateDirectory()</a></dt>
<dd><p>Given: Browser Window
Returns: N/A
Description: This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.</p>
</dd>
<dt><a href="#generateCode">generateCode()</a></dt>
<dd><p>Given: N/A
Returns: N/A
Description: This function generates the code into the user defined directory using promises</p>
</dd>
<dt><a href="#resolveGenerationDirectory">resolveGenerationDirectory()</a></dt>
<dd><p>Given: a map and a generation directory path.
Return: a map which has the generation directory.
Description: Resolve the generation directory to be able to generate to the
correct directory.</p>
</dd>
</dl>

<a name="module_JS API_ low level database access"></a>

## JS API: low level database access
This module provides generic DB functions for performing SQL queries.


* [JS API: low level database access](#module_JS API_ low level database access)
    * _static_
        * [.dbBeginTransaction(db)](#module_JS API_ low level database access.dbBeginTransaction) ⇒
        * [.dbCommit(db)](#module_JS API_ low level database access.dbCommit) ⇒
        * [.dbRemove(db, query, args)](#module_JS API_ low level database access.dbRemove) ⇒
        * [.dbUpdate(db, query, args)](#module_JS API_ low level database access.dbUpdate) ⇒
        * [.dbInsert(db, query, args)](#module_JS API_ low level database access.dbInsert) ⇒
        * [.dbAll(db, query, args)](#module_JS API_ low level database access.dbAll) ⇒
        * [.dbGet(db, query, args)](#module_JS API_ low level database access.dbGet) ⇒
        * [.dbMultiInsert(db, sql, arrayOfArrays)](#module_JS API_ low level database access.dbMultiInsert) ⇒
        * [.closeDatabase(database)](#module_JS API_ low level database access.closeDatabase) ⇒
        * [.initDatabase(sqlitePath)](#module_JS API_ low level database access.initDatabase) ⇒
        * [.loadSchema(db, schema, appVersion)](#module_JS API_ low level database access.loadSchema) ⇒
    * _inner_
        * [~insertOrReplaceVersion(db, version)](#module_JS API_ low level database access..insertOrReplaceVersion) ⇒

<a name="module_JS API_ low level database access.dbBeginTransaction"></a>

### JS API: low level database access.dbBeginTransaction(db) ⇒
Returns a promise to begin a transaction

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves without an argument and rejects with an error from BEGIN TRANSACTION query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbCommit"></a>

### JS API: low level database access.dbCommit(db) ⇒
Returns a promise to execute a commit.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves without an argument or rejects with an error from COMMIT query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbRemove"></a>

### JS API: low level database access.dbRemove(db, query, args) ⇒
Returns a promise to execute a DELETE FROM query.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolve with the number of delete rows, or rejects with an error from query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| query | <code>\*</code> | 
| args | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbUpdate"></a>

### JS API: low level database access.dbUpdate(db, query, args) ⇒
Returns a promise to execute an update query.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves without an argument, or rejects with an error from the query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| query | <code>\*</code> | 
| args | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbInsert"></a>

### JS API: low level database access.dbInsert(db, query, args) ⇒
Returns a promise to execute an insert query.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with the rowid from the inserted row, or rejects with an error from the query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| query | <code>\*</code> | 
| args | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbAll"></a>

### JS API: low level database access.dbAll(db, query, args) ⇒
Returns a promise to execute a query to perform a select that returns all rows that match a query.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with the rows that got retrieved from the database, or rejects with an error from the query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| query | <code>\*</code> | 
| args | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbGet"></a>

### JS API: low level database access.dbGet(db, query, args) ⇒
Returns a promise to execute a query to perform a select that returns first row that matches a query.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with a single row that got retrieved from the database, or rejects with an error from the query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| query | <code>\*</code> | 
| args | <code>\*</code> | 

<a name="module_JS API_ low level database access.dbMultiInsert"></a>

### JS API: low level database access.dbMultiInsert(db, sql, arrayOfArrays) ⇒
Returns a promise to perfom a prepared statement, using data from array for SQL parameters.
It resolves with an array of rowids, or rejects with an error.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with the array of rowids for the rows that got inserted, or rejects with an error from the query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sql | <code>\*</code> | 
| arrayOfArrays | <code>\*</code> | 

<a name="module_JS API_ low level database access.closeDatabase"></a>

### JS API: low level database access.closeDatabase(database) ⇒
Returns a promise that will resolve when the database in question is closed.
Rejects with an error if closing fails.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves without an argument or rejects with error from the database closing.  

| Param | Type |
| --- | --- |
| database | <code>\*</code> | 

<a name="module_JS API_ low level database access.initDatabase"></a>

### JS API: low level database access.initDatabase(sqlitePath) ⇒
Returns a promise to initialize a database.

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with the database object that got created, or rejects with an error if something went wrong.  

| Param | Type |
| --- | --- |
| sqlitePath | <code>\*</code> | 

<a name="module_JS API_ low level database access.loadSchema"></a>

### JS API: low level database access.loadSchema(db, schema, appVersion) ⇒
Returns a promise to load schema into a blank database, and inserts a version to the settings table.j

**Kind**: static method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with the same db that got passed in, or rejects with an error.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| schema | <code>\*</code> | 
| appVersion | <code>\*</code> | 

<a name="module_JS API_ low level database access..insertOrReplaceVersion"></a>

### JS API: low level database access~insertOrReplaceVersion(db, version) ⇒
Returns a promise to insert or replace a version of the application into the database.

**Kind**: inner method of [<code>JS API: low level database access</code>](#module_JS API_ low level database access)  
**Returns**: A promise that resolves with a rowid of created setting row or rejects with error if something goes wrong.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| version | <code>\*</code> | 

<a name="module_JS API_ database queries"></a>

## JS API: database queries
Contains all the application queries.


* [JS API: database queries](#module_JS API_ database queries)
    * [.insertDomains(db, packageId, data)](#module_JS API_ database queries.insertDomains) ⇒
    * [.insertStructs(db, packageId, data)](#module_JS API_ database queries.insertStructs) ⇒
    * [.insertBitmaps(db, packageId, data)](#module_JS API_ database queries.insertBitmaps) ⇒
    * [.deleteSession(db, sessionId)](#module_JS API_ database queries.deleteSession) ⇒
    * [.updateKeyValue(db, sessionId, key, value)](#module_JS API_ database queries.updateKeyValue) ⇒
    * [.insertOrReplaceClusterState(db, endpointTypeId, clusterId, side, enabled)](#module_JS API_ database queries.insertOrReplaceClusterState) ⇒
    * [.insertEndpoint(db, sessionId, endpointId, endpointTypeRef, networkId)](#module_JS API_ database queries.insertEndpoint) ⇒
    * [.insertEndpointType(db, sessionId, name, deviceTypeRef)](#module_JS API_ database queries.insertEndpointType) ⇒
    * [.getAllSesionKeyValues(db, sessionId)](#module_JS API_ database queries.getAllSesionKeyValues) ⇒
    * [.getAllEndpointTypes(db, sessionId)](#module_JS API_ database queries.getAllEndpointTypes) ⇒
    * [.getAllSessions(db)](#module_JS API_ database queries.getAllSessions) ⇒

<a name="module_JS API_ database queries.insertDomains"></a>

### JS API: database queries.insertDomains(db, packageId, data) ⇒
Inserts domains into the database.
data is an array of objects that must contain: name

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: A promise that resolves with an array of rowids of all inserted domains.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| packageId | <code>\*</code> | 
| data | <code>\*</code> | 

<a name="module_JS API_ database queries.insertStructs"></a>

### JS API: database queries.insertStructs(db, packageId, data) ⇒
Inserts structs into the database.
data is an array of objects that must contain: name

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: A promise that resolves with an array of struct item rowids.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| packageId | <code>\*</code> | 
| data | <code>\*</code> | 

<a name="module_JS API_ database queries.insertBitmaps"></a>

### JS API: database queries.insertBitmaps(db, packageId, data) ⇒
Inserts bitmaps into the database. Data is an array of objects that must contain: name, type

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: A promise of bitmap insertions.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| packageId | <code>\*</code> |  |
| data | <code>\*</code> | Array of object containing 'name' and 'type'. |

<a name="module_JS API_ database queries.deleteSession"></a>

### JS API: database queries.deleteSession(db, sessionId) ⇒
Promises to delete a session from the database, including all the rows that have the session as a foreign key.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: A promise of a removal of session.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_JS API_ database queries.updateKeyValue"></a>

### JS API: database queries.updateKeyValue(db, sessionId, key, value) ⇒
Promises to update or insert a key/value pair in SESSION_KEY_VALUE table.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: A promise of creating or updating a row, resolves with the rowid of a new row.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| key | <code>\*</code> | 
| value | <code>\*</code> | 

<a name="module_JS API_ database queries.insertOrReplaceClusterState"></a>

### JS API: database queries.insertOrReplaceClusterState(db, endpointTypeId, clusterId, side, enabled) ⇒
Promises to update the cluster include/exclude state.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: Promise to update the cluster exclude/include state.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 
| clusterId | <code>\*</code> | 
| side | <code>\*</code> | 
| enabled | <code>\*</code> | 

<a name="module_JS API_ database queries.insertEndpoint"></a>

### JS API: database queries.insertEndpoint(db, sessionId, endpointId, endpointTypeRef, networkId) ⇒
Promises to add an endpoint.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: Promise to update endpoints.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| endpointId | <code>\*</code> | 
| endpointTypeRef | <code>\*</code> | 
| networkId | <code>\*</code> | 

<a name="module_JS API_ database queries.insertEndpointType"></a>

### JS API: database queries.insertEndpointType(db, sessionId, name, deviceTypeRef) ⇒
Promises to add an endpoint type.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: Promise to update endpoints.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| name | <code>\*</code> | 
| deviceTypeRef | <code>\*</code> | 

<a name="module_JS API_ database queries.getAllSesionKeyValues"></a>

### JS API: database queries.getAllSesionKeyValues(db, sessionId) ⇒
Resolves to an array of objects that contain 'key' and 'value'

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: Promise to retrieve all session key values.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_JS API_ database queries.getAllEndpointTypes"></a>

### JS API: database queries.getAllEndpointTypes(db, sessionId) ⇒
Resolves to an array of endpoint types.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: Promise to retrieve all endpoint types.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_JS API_ database queries.getAllSessions"></a>

### JS API: database queries.getAllSessions(db) ⇒
Returns a promise that resolves into an array of objects containing 'sessionId', 'sessionKey' and 'creationTime'.

**Kind**: static method of [<code>JS API: database queries</code>](#module_JS API_ database queries)  
**Returns**: A promise of executing a query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_JS API_ generator logic"></a>

## JS API: generator logic
Copyright (c) 2020 Silicon Labs. All rights reserved.


* [JS API: generator logic](#module_JS API_ generator logic)
    * [.mapDatabase(db)](#module_JS API_ generator logic.mapDatabase) ⇒
    * [.resolveTemplateDirectory(map, handlebarTemplateDirectory)](#module_JS API_ generator logic.resolveTemplateDirectory) ⇒
    * [.compileTemplate(map, templateFiles)](#module_JS API_ generator logic.compileTemplate) ⇒
    * [.infoFromDb(map, dbRowType)](#module_JS API_ generator logic.infoFromDb) ⇒
    * [.groupInfoIntoDbRow(map, groupByParams)](#module_JS API_ generator logic.groupInfoIntoDbRow) ⇒
    * [.resolveHelper(map, helperFunctions)](#module_JS API_ generator logic.resolveHelper) ⇒
    * [.resolveGenerationDirectory(map, generationDirectory)](#module_JS API_ generator logic.resolveGenerationDirectory) ⇒
    * [.generateDataToPreview(map, databaseRowToHandlebarTemplateFileMap)](#module_JS API_ generator logic.generateDataToPreview) ⇒
    * [.generateDataToFile(map, outputFileName, databaseRowToHandlebarTemplateFileMap)](#module_JS API_ generator logic.generateDataToFile) ⇒

<a name="module_JS API_ generator logic.mapDatabase"></a>

### JS API: generator logic.mapDatabase(db) ⇒
Resolve is listed on the map containing the database.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on the map  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>Object</code> | database |

<a name="module_JS API_ generator logic.resolveTemplateDirectory"></a>

### JS API: generator logic.resolveTemplateDirectory(map, handlebarTemplateDirectory) ⇒
Resolve the handlebar template directory to be able to use the correct
handlebar templates for generation/preview.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on a map which has the handlebar
directory.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> | HashMap |
| handlebarTemplateDirectory | <code>string</code> | Handlebar template directory path |

<a name="module_JS API_ generator logic.compileTemplate"></a>

### JS API: generator logic.compileTemplate(map, templateFiles) ⇒
Resolve the compiled handlebar templates for use.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on a map which has the compiled
templates.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> | Map for database and template directory |
| templateFiles | <code>Array.&lt;string&gt;</code> | Array of handlebar template files |

<a name="module_JS API_ generator logic.infoFromDb"></a>

### JS API: generator logic.infoFromDb(map, dbRowType) ⇒
The database information is retrieved by calling database query
functions. Then a resolve is listed on the map containing database, compiled
template and database row information so that they can be passed on to more
promises.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on a map which has the database rows.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> | Map for database, template directory and compiled templates |
| dbRowType | <code>Array.&lt;string&gt;</code> | Array of strings with each string representing a type of database row |

<a name="module_JS API_ generator logic.groupInfoIntoDbRow"></a>

### JS API: generator logic.groupInfoIntoDbRow(map, groupByParams) ⇒
Additional information attached to each database row. Essentially a way
to group by content.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on a map which has the database,
compiled templates and database rows along with additional grouped by
content.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> | Map containing database, compiled templates, database and database rows for different datbase types. |
| groupByParams | <code>Object</code> | Object to group information by |
| groupByParams.subItemName | <code>string</code> |  |
| groupByParams.foreignKey | <code>string</code> |  |
| groupByParams.primaryKey | <code>string</code> |  |
| groupByParams.dbType | <code>string</code> |  |
| groupByParams.columns | <code>string</code> |  |

<a name="module_JS API_ generator logic.resolveHelper"></a>

### JS API: generator logic.resolveHelper(map, helperFunctions) ⇒
Resolve the helper functions to be used in later promises.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on a map which has the helper
functions.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> |  |
| helperFunctions | <code>Object</code> | Map for handlebar helper name to helper function |

<a name="module_JS API_ generator logic.resolveGenerationDirectory"></a>

### JS API: generator logic.resolveGenerationDirectory(map, generationDirectory) ⇒
Resolve the generation directory to be able to generate to the correct
directory.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on a map which has the generation
directory.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> |  |
| generationDirectory | <code>string</code> | generation directory path. |

<a name="module_JS API_ generator logic.generateDataToPreview"></a>

### JS API: generator logic.generateDataToPreview(map, databaseRowToHandlebarTemplateFileMap) ⇒
The database information is used to show the generation output to a preview
pane using the compiled handlebar templates.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A promise with resolve listed on the data which can be seen in the
preview pane.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> |  |
| databaseRowToHandlebarTemplateFileMap | <code>Array.&lt;Object&gt;</code> | Map linking the database row type with handlebar template file. |
| databaseRowToHandlebarTemplateFileMap.dbRowType | <code>string</code> | Database row type |
| databaseRowToHandlebarTemplateFileMap.hTemplateFile | <code>string</code> | Handlebar template file |

<a name="module_JS API_ generator logic.generateDataToFile"></a>

### JS API: generator logic.generateDataToFile(map, outputFileName, databaseRowToHandlebarTemplateFileMap) ⇒
The database information is used to write the generation output to a file
using the compiled handlebar templates.

**Kind**: static method of [<code>JS API: generator logic</code>](#module_JS API_ generator logic)  
**Returns**: A new promise resolve listed on the data which is generated.  

| Param | Type | Description |
| --- | --- | --- |
| map | <code>Object</code> |  |
| outputFileName | <code>string</code> | The generation file name |
| databaseRowToHandlebarTemplateFileMap | <code>Array.&lt;Object&gt;</code> | Map linking the database row type with handlebar template file. |
| databaseRowToHandlebarTemplateFileMap.dbRowType | <code>string</code> | Database row type |
| databaseRowToHandlebarTemplateFileMap.hTemplateFile | <code>string</code> | Handlebar template file |

<a name="module_REST API_ admin functions"></a>

## REST API: admin functions
This module provides the REST API to the admin functions.

<a name="module_REST API_ admin functions.registerAdminApi"></a>

### REST API: admin functions.registerAdminApi(db, app)
API: /post/sql
Request JSON:
<pre>
  {
    sql: SQL Query
  }
</pre>

Response JSON:
<pre>
  {
    result: Array of rows.    
  }
</pre>

**Kind**: static method of [<code>REST API: admin functions</code>](#module_REST API_ admin functions)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| app | <code>\*</code> | 

<a name="module_REST API_ generation functions"></a>

## REST API: generation functions
This module provides the REST API to the generation.

<a name="module_REST API_ static zcl functions"></a>

## REST API: static zcl functions
This module provides the REST API to the static zcl queries.

<a name="module_REST API_ static zcl functions.registerStaticZclApi"></a>

### REST API: static zcl functions.registerStaticZclApi(app)
API: /get/:entity/:id

**Kind**: static method of [<code>REST API: static zcl functions</code>](#module_REST API_ static zcl functions)  

| Param | Type | Description |
| --- | --- | --- |
| app | <code>\*</code> | Express instance. |

<a name="module_REST API_ user data"></a>

## REST API: user data
This module provides the REST API to the user specific data.

<a name="module_JS API_ http server"></a>

## JS API: http server
This module provides the HTTP server functionality.


* [JS API: http server](#module_JS API_ http server)
    * [.initHttpServer(db, port)](#module_JS API_ http server.initHttpServer) ⇒
    * [.shutdownHttpServer()](#module_JS API_ http server.shutdownHttpServer) ⇒

<a name="module_JS API_ http server.initHttpServer"></a>

### JS API: http server.initHttpServer(db, port) ⇒
Promises to initialize the http server on a given port
using a given database.

**Kind**: static method of [<code>JS API: http server</code>](#module_JS API_ http server)  
**Returns**: A promise that resolves with an express app.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> | Database object to use. |
| port | <code>\*</code> | Port for the HTTP server. |

<a name="module_JS API_ http server.shutdownHttpServer"></a>

### JS API: http server.shutdownHttpServer() ⇒
Promises to shut down the http server.

**Kind**: static method of [<code>JS API: http server</code>](#module_JS API_ http server)  
**Returns**: Promise that resolves when server is shut down.  
<a name="generateInDir"></a>

## generateInDir()
Given: Browser Window
Returns: N/A
Description: This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.

**Kind**: global function  
<a name="setHandlebarTemplateDirectory"></a>

## setHandlebarTemplateDirectory()
Given: Browser Window
Returns: N/A
Description: This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.

**Kind**: global function  
<a name="generateCode"></a>

## generateCode()
Given: N/A
Returns: N/A
Description: This function generates the code into the user defined directory using promises

**Kind**: global function  
<a name="resolveGenerationDirectory"></a>

## resolveGenerationDirectory()
Given: a map and a generation directory path.
Return: a map which has the generation directory.
Description: Resolve the generation directory to be able to generate to the
correct directory.

**Kind**: global function  
