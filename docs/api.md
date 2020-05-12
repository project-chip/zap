## Modules

<dl>
<dt><a href="#module_JS API_ low level database access">JS API: low level database access</a></dt>
<dd><p>This module provides generic DB functions for performing SQL queries.</p>
</dd>
<dt><a href="#module_DB API_ user configuration queries against the database.">DB API: user configuration queries against the database.</a></dt>
<dd><p>This module provides queries for user configuration.</p>
</dd>
<dt><a href="#module_DB API_ generic queries against the database.">DB API: generic queries against the database.</a></dt>
<dd><p>This module provides generic queries.</p>
</dd>
<dt><a href="#module_DB API_ package-based queries.">DB API: package-based queries.</a></dt>
<dd><p>This module provides queries related to packages.</p>
</dd>
<dt><a href="#module_DB API_ session related queries.">DB API: session related queries.</a></dt>
<dd><p>This module provides session related queries.</p>
</dd>
<dt><a href="#module_DB API_ zcl database access">DB API: zcl database access</a></dt>
<dd><p>This module provides queries for ZCL static queries.</p>
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
<dt><a href="#processCommandLineArguments">processCommandLineArguments(argv)</a> ⇒</dt>
<dd><p>Process the command line arguments and resets the state in this file
to the specified values.</p>
</dd>
<dt><a href="#importDataFromFile">importDataFromFile(sessionId, filePath)</a> ⇒</dt>
<dd><p>Take a given session ID and import the data from the file</p>
</dd>
<dt><a href="#writeStateToDatabase">writeStateToDatabase(sessionId, state)</a> ⇒</dt>
<dd><p>Given a state object, this method returns a promise that resolves
with the succesfull writing into the database.</p>
</dd>
<dt><a href="#exportDataIntoFile">exportDataIntoFile(db, sessionId, filePath)</a> ⇒</dt>
<dd><p>Toplevel file that takes a given session ID and exports the data into the file</p>
</dd>
<dt><a href="#createStateFromDatabase">createStateFromDatabase(db, sessionId)</a> ⇒</dt>
<dd><p>Given a database and a session id, this method returns a promise that
resolves with a state object that needs to be saved into a file.</p>
</dd>
<dt><a href="#doOpen">doOpen(menuItem, browserWindow, event)</a></dt>
<dd><p>Perform a file-&gt;open operation.</p>
</dd>
<dt><a href="#doSave">doSave(menuItem, browserWindow, event)</a></dt>
<dd><p>Perform a save, defering to save as if file is not yet selected.</p>
</dd>
<dt><a href="#doSaveAs">doSaveAs(menuItem, browserWindow, event)</a></dt>
<dd><p>Perform save as.</p>
</dd>
<dt><a href="#generateInDir">generateInDir(browserWindow)</a></dt>
<dd><p>This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.</p>
</dd>
<dt><a href="#setHandlebarTemplateDirectory">setHandlebarTemplateDirectory(browserWindow)</a></dt>
<dd><p>This function gets the directory where user wants the output and calls 
generateCode function which generates the code in the user selected output.</p>
</dd>
<dt><a href="#generateCode">generateCode(db)</a></dt>
<dd><p>This function generates the code into the user defined directory using promises</p>
</dd>
<dt><a href="#fileSave">fileSave(db, winId, filePath)</a> ⇒</dt>
<dd><p>perform the save.</p>
</dd>
<dt><a href="#fileOpen">fileOpen(db, winId, filePaths)</a></dt>
<dd><p>Perform the do open action.</p>
</dd>
<dt><a href="#resolveGenerationDirectory">resolveGenerationDirectory(map)</a> ⇒</dt>
<dd><p>Description: Resolve the generation directory to be able to generate to the
correct directory.</p>
</dd>
<dt><a href="#initMenu">initMenu(port)</a></dt>
<dd><p>Initialize a menu.</p>
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

<a name="module_DB API_ user configuration queries against the database."></a>

## DB API: user configuration queries against the database.
This module provides queries for user configuration.


* [DB API: user configuration queries against the database.](#module_DB API_ user configuration queries against the database.)
    * [.updateKeyValue(db, sessionId, key, value)](#module_DB API_ user configuration queries against the database..updateKeyValue) ⇒
    * [.insertOrReplaceClusterState(db, endpointTypeId, clusterRef, side, enabled)](#module_DB API_ user configuration queries against the database..insertOrReplaceClusterState) ⇒
    * [.insertOrUpdateAttributeState(db, endpointTypeId, id, value, booleanParam)](#module_DB API_ user configuration queries against the database..insertOrUpdateAttributeState)
    * [.insertOrUpdateCommandState(db, endpointTypeId, id, value, booleanParam)](#module_DB API_ user configuration queries against the database..insertOrUpdateCommandState)
    * [.insertOrUpdateReportableAttributeState(db, endpointTypeId, id, value, booleanParam)](#module_DB API_ user configuration queries against the database..insertOrUpdateReportableAttributeState)
    * [.insertEndpoint(db, sessionId, endpointId, endpointTypeRef, networkId)](#module_DB API_ user configuration queries against the database..insertEndpoint) ⇒
    * [.deleteEndpoint(db, id)](#module_DB API_ user configuration queries against the database..deleteEndpoint) ⇒
    * [.insertEndpointType(db, sessionId, name, deviceTypeRef)](#module_DB API_ user configuration queries against the database..insertEndpointType) ⇒
    * [.deleteEndpointType(db, sessionId, id)](#module_DB API_ user configuration queries against the database..deleteEndpointType)
    * [.updateEndpointType(db, sessionId, endpointTypeId, param, updatedValue)](#module_DB API_ user configuration queries against the database..updateEndpointType)
    * [.setEndpointDefaults(db, endpointTypeId)](#module_DB API_ user configuration queries against the database..setEndpointDefaults)
    * [.getAllSesionKeyValues(db, sessionId)](#module_DB API_ user configuration queries against the database..getAllSesionKeyValues) ⇒
    * [.getAllEndpointTypes(db, sessionId)](#module_DB API_ user configuration queries against the database..getAllEndpointTypes) ⇒

<a name="module_DB API_ user configuration queries against the database..updateKeyValue"></a>

### DB API: user configuration queries against the database..updateKeyValue(db, sessionId, key, value) ⇒
Promises to update or insert a key/value pair in SESSION_KEY_VALUE table.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: A promise of creating or updating a row, resolves with the rowid of a new row.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| key | <code>\*</code> | 
| value | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..insertOrReplaceClusterState"></a>

### DB API: user configuration queries against the database..insertOrReplaceClusterState(db, endpointTypeId, clusterRef, side, enabled) ⇒
Promises to update the cluster include/exclude state.
If the entry [as defined uniquely by endpointTypeId, clusterId, side] is not there, then insert
Else update the entry in place.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: Promise to update the cluster exclude/include state.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 
| clusterRef | <code>\*</code> | 
| side | <code>\*</code> | 
| enabled | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..insertOrUpdateAttributeState"></a>

### DB API: user configuration queries against the database..insertOrUpdateAttributeState(db, endpointTypeId, id, value, booleanParam)
Promise to update the attribute state. 
If the attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
Afterwards, update entry.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 
| id | <code>\*</code> | 
| value | <code>\*</code> | 
| booleanParam | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..insertOrUpdateCommandState"></a>

### DB API: user configuration queries against the database..insertOrUpdateCommandState(db, endpointTypeId, id, value, booleanParam)
Promise to update the command state. 
If the attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
Afterwards, update entry.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 
| id | <code>\*</code> | 
| value | <code>\*</code> | 
| booleanParam | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..insertOrUpdateReportableAttributeState"></a>

### DB API: user configuration queries against the database..insertOrUpdateReportableAttributeState(db, endpointTypeId, id, value, booleanParam)
Promise to update the reportable attribute state. 
If the reportable attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
Afterwards, update entry.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 
| id | <code>\*</code> | 
| value | <code>\*</code> | 
| booleanParam | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..insertEndpoint"></a>

### DB API: user configuration queries against the database..insertEndpoint(db, sessionId, endpointId, endpointTypeRef, networkId) ⇒
Promises to add an endpoint.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: Promise to update endpoints.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| endpointId | <code>\*</code> | 
| endpointTypeRef | <code>\*</code> | 
| networkId | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..deleteEndpoint"></a>

### DB API: user configuration queries against the database..deleteEndpoint(db, id) ⇒
Deletes an endpoint.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: Promise to delete an endpoint that resolves with the number of rows that were deleted.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| id | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..insertEndpointType"></a>

### DB API: user configuration queries against the database..insertEndpointType(db, sessionId, name, deviceTypeRef) ⇒
Promises to add an endpoint type.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: Promise to update endpoints.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| name | <code>\*</code> | 
| deviceTypeRef | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..deleteEndpointType"></a>

### DB API: user configuration queries against the database..deleteEndpointType(db, sessionId, id)
Promise to delete an endpoint type.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| id | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..updateEndpointType"></a>

### DB API: user configuration queries against the database..updateEndpointType(db, sessionId, endpointTypeId, param, updatedValue)
Promise to update a an endpoint type.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 
| param | <code>\*</code> | 
| updatedValue | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..setEndpointDefaults"></a>

### DB API: user configuration queries against the database..setEndpointDefaults(db, endpointTypeId)
Promise to set the default attributes and clusters for a endpoint type.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| endpointTypeId | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..getAllSesionKeyValues"></a>

### DB API: user configuration queries against the database..getAllSesionKeyValues(db, sessionId) ⇒
Resolves to an array of objects that contain 'key' and 'value'

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: Promise to retrieve all session key values.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_DB API_ user configuration queries against the database..getAllEndpointTypes"></a>

### DB API: user configuration queries against the database..getAllEndpointTypes(db, sessionId) ⇒
Resolves to an array of endpoint types.

**Kind**: static method of [<code>DB API: user configuration queries against the database.</code>](#module_DB API_ user configuration queries against the database.)  
**Returns**: Promise to retrieve all endpoint types.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_DB API_ generic queries against the database."></a>

## DB API: generic queries against the database.
This module provides generic queries.


* [DB API: generic queries against the database.](#module_DB API_ generic queries against the database.)
    * [.selectCountFrom(db, table)](#module_DB API_ generic queries against the database..selectCountFrom) ⇒
    * [.insertFileLocation(db, filePath, category)](#module_DB API_ generic queries against the database..insertFileLocation)
    * [.selectFileLocation(db, category)](#module_DB API_ generic queries against the database..selectFileLocation)

<a name="module_DB API_ generic queries against the database..selectCountFrom"></a>

### DB API: generic queries against the database..selectCountFrom(db, table) ⇒
Simple query that returns number of rows in a given table.

**Kind**: static method of [<code>DB API: generic queries against the database.</code>](#module_DB API_ generic queries against the database.)  
**Returns**: a promise that resolves into the count of the rows in the table.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| table | <code>\*</code> | 

<a name="module_DB API_ generic queries against the database..insertFileLocation"></a>

### DB API: generic queries against the database..insertFileLocation(db, filePath, category)
Writes the saved location of the file.

**Kind**: static method of [<code>DB API: generic queries against the database.</code>](#module_DB API_ generic queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| filePath | <code>\*</code> | 
| category | <code>\*</code> | 

<a name="module_DB API_ generic queries against the database..selectFileLocation"></a>

### DB API: generic queries against the database..selectFileLocation(db, category)
Retrieves the saved location from a file

**Kind**: static method of [<code>DB API: generic queries against the database.</code>](#module_DB API_ generic queries against the database.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| category | <code>\*</code> | 

<a name="module_DB API_ package-based queries."></a>

## DB API: package-based queries.
This module provides queries related to packages.


* [DB API: package-based queries.](#module_DB API_ package-based queries.)
    * [.forPathCrc(db, path, crcCallback, noneCallback)](#module_DB API_ package-based queries..forPathCrc)
    * [.getPathCrc(db, path)](#module_DB API_ package-based queries..getPathCrc) ⇒
    * [.insertPathCrc(db, path, crc)](#module_DB API_ package-based queries..insertPathCrc) ⇒
    * [.updatePathCrc(db, path, crc)](#module_DB API_ package-based queries..updatePathCrc) ⇒

<a name="module_DB API_ package-based queries..forPathCrc"></a>

### DB API: package-based queries..forPathCrc(db, path, crcCallback, noneCallback)
Checks if the package with a given path exists and executes appropriate action.

**Kind**: static method of [<code>DB API: package-based queries.</code>](#module_DB API_ package-based queries.)  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| path | <code>\*</code> | Path of a file to check. |
| crcCallback | <code>\*</code> | This callback is executed if the row exists, with arguments (CRC, PACKAGE_ID) |
| noneCallback | <code>\*</code> | This callback is executed if the row does not exist. |

<a name="module_DB API_ package-based queries..getPathCrc"></a>

### DB API: package-based queries..getPathCrc(db, path) ⇒
Resolves with a CRC or null for a given path.

**Kind**: static method of [<code>DB API: package-based queries.</code>](#module_DB API_ package-based queries.)  
**Returns**: Promise resolving with a CRC or null.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| path | <code>\*</code> | 

<a name="module_DB API_ package-based queries..insertPathCrc"></a>

### DB API: package-based queries..insertPathCrc(db, path, crc) ⇒
Inserts a given path CRC combination into the table.

**Kind**: static method of [<code>DB API: package-based queries.</code>](#module_DB API_ package-based queries.)  
**Returns**: Promise of an insertion.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| path | <code>\*</code> | Path of the file. |
| crc | <code>\*</code> | CRC of the file. |

<a name="module_DB API_ package-based queries..updatePathCrc"></a>

### DB API: package-based queries..updatePathCrc(db, path, crc) ⇒
Updates a CRC in the table.

**Kind**: static method of [<code>DB API: package-based queries.</code>](#module_DB API_ package-based queries.)  
**Returns**: Promise of an update.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| path | <code>\*</code> | 
| crc | <code>\*</code> | 

<a name="module_DB API_ session related queries."></a>

## DB API: session related queries.
This module provides session related queries.


* [DB API: session related queries.](#module_DB API_ session related queries.)
    * [.getAllSessions(db)](#module_DB API_ session related queries..getAllSessions) ⇒
    * [.setSessionClean(db, sessionId)](#module_DB API_ session related queries..setSessionClean) ⇒
    * [.getSessionDirtyFlag(db, sessionId)](#module_DB API_ session related queries..getSessionDirtyFlag) ⇒
    * [.getWindowDirtyFlagWithCallback(db, windowId, fn)](#module_DB API_ session related queries..getWindowDirtyFlagWithCallback)
    * [.getSessionIdFromWindowdId(db, windowId)](#module_DB API_ session related queries..getSessionIdFromWindowdId) ⇒
    * [.ensureZapSessionId(db, sessionKey, windowId)](#module_DB API_ session related queries..ensureZapSessionId) ⇒
    * [.deleteSession(db, sessionId)](#module_DB API_ session related queries..deleteSession) ⇒

<a name="module_DB API_ session related queries..getAllSessions"></a>

### DB API: session related queries..getAllSessions(db) ⇒
Returns a promise that resolves into an array of objects containing 'sessionId', 'sessionKey' and 'creationTime'.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  
**Returns**: A promise of executing a query.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ session related queries..setSessionClean"></a>

### DB API: session related queries..setSessionClean(db, sessionId) ⇒
Sets the session dirty flag to false.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  
**Returns**: A promise that resolves with the number of rows updated.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_DB API_ session related queries..getSessionDirtyFlag"></a>

### DB API: session related queries..getSessionDirtyFlag(db, sessionId) ⇒
Resolves with true or false, depending whether this session is dirty.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  
**Returns**: A promise that resolves into true or false, reflecting session dirty state.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_DB API_ session related queries..getWindowDirtyFlagWithCallback"></a>

### DB API: session related queries..getWindowDirtyFlagWithCallback(db, windowId, fn)
Executes the query for the dirty flag with a callback, not a promise.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| windowId | <code>\*</code> | 
| fn | <code>\*</code> | 

<a name="module_DB API_ session related queries..getSessionIdFromWindowdId"></a>

### DB API: session related queries..getSessionIdFromWindowdId(db, windowId) ⇒
Resolves into a session id, obtained from window id.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  
**Returns**: A promise that resolves into an object containing sessionId, sessionKey and creationTime.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| windowId | <code>\*</code> | 

<a name="module_DB API_ session related queries..ensureZapSessionId"></a>

### DB API: session related queries..ensureZapSessionId(db, sessionKey, windowId) ⇒
Returns a promise that will resolve into a sessionID created from a query.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  
**Returns**: promise that resolves into a session id.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionKey | <code>\*</code> | 
| windowId | <code>\*</code> | 

<a name="module_DB API_ session related queries..deleteSession"></a>

### DB API: session related queries..deleteSession(db, sessionId) ⇒
Promises to delete a session from the database, including all the rows that have the session as a foreign key.

**Kind**: static method of [<code>DB API: session related queries.</code>](#module_DB API_ session related queries.)  
**Returns**: A promise of a removal of session.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_DB API_ zcl database access"></a>

## DB API: zcl database access
This module provides queries for ZCL static queries.


* [DB API: zcl database access](#module_DB API_ zcl database access)
    * [.selectAllEnums(db)](#module_DB API_ zcl database access.selectAllEnums) ⇒
    * [.selectAllBitmaps(db)](#module_DB API_ zcl database access.selectAllBitmaps) ⇒
    * [.selectAllDomains(db)](#module_DB API_ zcl database access.selectAllDomains) ⇒
    * [.selectAllStructs(db)](#module_DB API_ zcl database access.selectAllStructs) ⇒
    * [.selectAllClusters(db)](#module_DB API_ zcl database access.selectAllClusters) ⇒
    * [.selectAllDeviceTypes(db)](#module_DB API_ zcl database access.selectAllDeviceTypes) ⇒
    * [.insertClusters(db, packageId, data)](#module_DB API_ zcl database access.insertClusters) ⇒
    * [.insertDeviceTypes(db, packageId, data)](#module_DB API_ zcl database access.insertDeviceTypes) ⇒
    * [.insertDeviceTypeAttributes(db, dtClusterRefDataPairs)](#module_DB API_ zcl database access.insertDeviceTypeAttributes)
    * [.insertDeviceTypeCommands(db, dtClusterRefDataPairs)](#module_DB API_ zcl database access.insertDeviceTypeCommands)
    * [.insertDomains(db, packageId, data)](#module_DB API_ zcl database access.insertDomains) ⇒
    * [.insertStructs(db, packageId, data)](#module_DB API_ zcl database access.insertStructs) ⇒
    * [.insertEnums(db, packageId, data)](#module_DB API_ zcl database access.insertEnums) ⇒
    * [.insertBitmaps(db, packageId, data)](#module_DB API_ zcl database access.insertBitmaps) ⇒

<a name="module_DB API_ zcl database access.selectAllEnums"></a>

### DB API: zcl database access.selectAllEnums(db) ⇒
Retrieves all the enums in the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise that resolves with the rows of enums.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ zcl database access.selectAllBitmaps"></a>

### DB API: zcl database access.selectAllBitmaps(db) ⇒
Retrieves all the bitmaps in the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise that resolves with the rows of bitmaps.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ zcl database access.selectAllDomains"></a>

### DB API: zcl database access.selectAllDomains(db) ⇒
Retrieves all the domains in the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise that resolves with the rows of domains.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ zcl database access.selectAllStructs"></a>

### DB API: zcl database access.selectAllStructs(db) ⇒
Retrieves all the structs in the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise that resolves with the rows of structs.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ zcl database access.selectAllClusters"></a>

### DB API: zcl database access.selectAllClusters(db) ⇒
Retrieves all the clusters in the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise that resolves with the rows of clusters.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ zcl database access.selectAllDeviceTypes"></a>

### DB API: zcl database access.selectAllDeviceTypes(db) ⇒
Retrieves all the device types in the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise that resolves with the rows of device types.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="module_DB API_ zcl database access.insertClusters"></a>

### DB API: zcl database access.insertClusters(db, packageId, data) ⇒
Inserts clusters into the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise of cluster insertion.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| packageId | <code>\*</code> |  |
| data | <code>\*</code> | an array of objects that must contain: code, name, description, define. It also contains commands: and attributes: |

<a name="module_DB API_ zcl database access.insertDeviceTypes"></a>

### DB API: zcl database access.insertDeviceTypes(db, packageId, data) ⇒
Inserts device types into the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: Promise of an insertion of device types.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| packageId | <code>\*</code> |  |
| data | <code>\*</code> | an array of objects that must contain: code, name, description |

<a name="module_DB API_ zcl database access.insertDeviceTypeAttributes"></a>

### DB API: zcl database access.insertDeviceTypeAttributes(db, dtClusterRefDataPairs)
This handles the loading of device type attribute requirements into the database. 
There is a need to post-process to attach the actual attribute ref after the fact

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| dtClusterRefDataPairs | <code>\*</code> | 

<a name="module_DB API_ zcl database access.insertDeviceTypeCommands"></a>

### DB API: zcl database access.insertDeviceTypeCommands(db, dtClusterRefDataPairs)
This handles the loading of device type command requirements into the database. 
There is a need to post-process to attach the actual command ref after the fact

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| dtClusterRefDataPairs | <code>\*</code> | 

<a name="module_DB API_ zcl database access.insertDomains"></a>

### DB API: zcl database access.insertDomains(db, packageId, data) ⇒
Inserts domains into the database.
data is an array of objects that must contain: name

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: A promise that resolves with an array of rowids of all inserted domains.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| packageId | <code>\*</code> | 
| data | <code>\*</code> | 

<a name="module_DB API_ zcl database access.insertStructs"></a>

### DB API: zcl database access.insertStructs(db, packageId, data) ⇒
Inserts structs into the database.
data is an array of objects that must contain: name

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: A promise that resolves with an array of struct item rowids.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| packageId | <code>\*</code> | 
| data | <code>\*</code> | 

<a name="module_DB API_ zcl database access.insertEnums"></a>

### DB API: zcl database access.insertEnums(db, packageId, data) ⇒
Inserts enums into the database.

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: A promise of enum insertion.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| packageId | <code>\*</code> |  |
| data | <code>\*</code> | an array of objects that must contain: name, type |

<a name="module_DB API_ zcl database access.insertBitmaps"></a>

### DB API: zcl database access.insertBitmaps(db, packageId, data) ⇒
Inserts bitmaps into the database. Data is an array of objects that must contain: name, type

**Kind**: static method of [<code>DB API: zcl database access</code>](#module_DB API_ zcl database access)  
**Returns**: A promise of bitmap insertions.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>\*</code> |  |
| packageId | <code>\*</code> |  |
| data | <code>\*</code> | Array of object containing 'name' and 'type'. |

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

<a name="module_REST API_ generation functions.registerGenerationApi"></a>

### REST API: generation functions.registerGenerationApi(db, app)
**Kind**: static method of [<code>REST API: generation functions</code>](#module_REST API_ generation functions)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| app | <code>\*</code> | 

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
<a name="processCommandLineArguments"></a>

## processCommandLineArguments(argv) ⇒
Process the command line arguments and resets the state in this file
to the specified values.

**Kind**: global function  
**Returns**: parsed argv object  

| Param | Type |
| --- | --- |
| argv | <code>\*</code> | 

<a name="importDataFromFile"></a>

## importDataFromFile(sessionId, filePath) ⇒
Take a given session ID and import the data from the file

**Kind**: global function  
**Returns**: a promise that resolves with the resolution of writing into a database.  

| Param | Type |
| --- | --- |
| sessionId | <code>\*</code> | 
| filePath | <code>\*</code> | 

<a name="writeStateToDatabase"></a>

## writeStateToDatabase(sessionId, state) ⇒
Given a state object, this method returns a promise that resolves
with the succesfull writing into the database.

**Kind**: global function  
**Returns**: a promise that resolves with the sucessful writing  

| Param | Type |
| --- | --- |
| sessionId | <code>\*</code> | 
| state | <code>\*</code> | 

<a name="exportDataIntoFile"></a>

## exportDataIntoFile(db, sessionId, filePath) ⇒
Toplevel file that takes a given session ID and exports the data into the file

**Kind**: global function  
**Returns**: A promise that resolves with the path of the file written.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 
| filePath | <code>\*</code> | 

<a name="createStateFromDatabase"></a>

## createStateFromDatabase(db, sessionId) ⇒
Given a database and a session id, this method returns a promise that
resolves with a state object that needs to be saved into a file.

**Kind**: global function  
**Returns**: state object that needs to be saved into a file.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="doOpen"></a>

## doOpen(menuItem, browserWindow, event)
Perform a file->open operation.

**Kind**: global function  

| Param | Type |
| --- | --- |
| menuItem | <code>\*</code> | 
| browserWindow | <code>\*</code> | 
| event | <code>\*</code> | 

<a name="doSave"></a>

## doSave(menuItem, browserWindow, event)
Perform a save, defering to save as if file is not yet selected.

**Kind**: global function  

| Param | Type |
| --- | --- |
| menuItem | <code>\*</code> | 
| browserWindow | <code>\*</code> | 
| event | <code>\*</code> | 

<a name="doSaveAs"></a>

## doSaveAs(menuItem, browserWindow, event)
Perform save as.

**Kind**: global function  

| Param | Type |
| --- | --- |
| menuItem | <code>\*</code> | 
| browserWindow | <code>\*</code> | 
| event | <code>\*</code> | 

<a name="generateInDir"></a>

## generateInDir(browserWindow)
This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.

**Kind**: global function  

| Param | Type |
| --- | --- |
| browserWindow | <code>\*</code> | 

<a name="setHandlebarTemplateDirectory"></a>

## setHandlebarTemplateDirectory(browserWindow)
This function gets the directory where user wants the output and calls 
generateCode function which generates the code in the user selected output.

**Kind**: global function  

| Param | Type |
| --- | --- |
| browserWindow | <code>\*</code> | 

<a name="generateCode"></a>

## generateCode(db)
This function generates the code into the user defined directory using promises

**Kind**: global function  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 

<a name="fileSave"></a>

## fileSave(db, winId, filePath) ⇒
perform the save.

**Kind**: global function  
**Returns**: Promise of saving.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| winId | <code>\*</code> | 
| filePath | <code>\*</code> | 

<a name="fileOpen"></a>

## fileOpen(db, winId, filePaths)
Perform the do open action.

**Kind**: global function  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| winId | <code>\*</code> | 
| filePaths | <code>\*</code> | 

<a name="resolveGenerationDirectory"></a>

## resolveGenerationDirectory(map) ⇒
Description: Resolve the generation directory to be able to generate to the
correct directory.

**Kind**: global function  
**Returns**: promise that resolves into a map.  

| Param | Type |
| --- | --- |
| map | <code>\*</code> | 

<a name="initMenu"></a>

## initMenu(port)
Initialize a menu.

**Kind**: global function  

| Param | Type |
| --- | --- |
| port | <code>\*</code> | 

