## Modules

<dl>
<dt><a href="#module_Templating API_ Access helpers">Templating API: Access helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ Attribute helpers">Templating API: Attribute helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ C formatting helpers">Templating API: C formatting helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ Command helpers">Templating API: Command helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ Matter endpoint config helpers">Templating API: Matter endpoint config helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ Future helpers">Templating API: Future helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ SDK extension helpers">Templating API: SDK extension helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ C formatting helpers">Templating API: C formatting helpers</a></dt>
<dd><p>This module contains the API for accessing SDK extensions.</p>
</dd>
<dt><a href="#module_Templating API_ user-data specific helpers">Templating API: user-data specific helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ Token helpers">Templating API: Token helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ toplevel utility helpers">Templating API: toplevel utility helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ static zcl helpers">Templating API: static zcl helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
<dt><a href="#module_Templating API_ Zigbee Specific helpers">Templating API: Zigbee Specific helpers</a></dt>
<dd><p>This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}</p>
</dd>
</dl>

<a name="module_Templating API_ Access helpers"></a>

## Templating API: Access helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Access helpers](#module_Templating API_ Access helpers)
    * [~collectDefaultAccessList(ctx, entityType)](#module_Templating API_ Access helpers..collectDefaultAccessList) ⇒
    * [~collectAccesslist(ctx, options)](#module_Templating API_ Access helpers..collectAccesslist) ⇒
    * [~access_aggregate(options)](#module_Templating API_ Access helpers..access_aggregate)
    * [~access(options)](#module_Templating API_ Access helpers..access)
    * [~default_access(options)](#module_Templating API_ Access helpers..default_access) ⇒

<a name="module_Templating API_ Access helpers..collectDefaultAccessList"></a>

### Templating API: Access helpers~collectDefaultAccessList(ctx, entityType) ⇒
Collects the default access list

**Kind**: inner method of [<code>Templating API: Access helpers</code>](#module_Templating API_ Access helpers)  
**Returns**: Promise of default access  

| Param | Type |
| --- | --- |
| ctx | <code>\*</code> | 
| entityType | <code>\*</code> | 

<a name="module_Templating API_ Access helpers..collectAccesslist"></a>

### Templating API: Access helpers~collectAccesslist(ctx, options) ⇒
Get Access List based on on given options.

**Kind**: inner method of [<code>Templating API: Access helpers</code>](#module_Templating API_ Access helpers)  
**Returns**: Access List  

| Param | Type |
| --- | --- |
| ctx | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Access helpers..access_aggregate"></a>

### Templating API: Access helpers~access\_aggregate(options)
This helper creates a context for the aggregates of access.

**Kind**: inner method of [<code>Templating API: Access helpers</code>](#module_Templating API_ Access helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Access helpers..access"></a>

### Templating API: Access helpers~access(options)
Access helper iterates across all the access triplets associated with the element.
For each element, context contains role, operation, accessModifier.
Additionally it creates booleans hasRole, hasOperation and hasAccessModifier
and hasAtLeastOneAccessElement and hasAllAccessElements

**Kind**: inner method of [<code>Templating API: Access helpers</code>](#module_Templating API_ Access helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Access helpers..default_access"></a>

### Templating API: Access helpers~default\_access(options) ⇒
Get the access list information.

**Kind**: inner method of [<code>Templating API: Access helpers</code>](#module_Templating API_ Access helpers)  
**Returns**: access list  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Attribute helpers"></a>

## Templating API: Attribute helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Attribute helpers](#module_Templating API_ Attribute helpers)
    * [~featureBits(options)](#module_Templating API_ Attribute helpers..featureBits) ⇒
    * [~attributeDefault()](#module_Templating API_ Attribute helpers..attributeDefault) ⇒
    * [~as_underlying_atomic_identifier_for_attribute_id(attributeId)](#module_Templating API_ Attribute helpers..as_underlying_atomic_identifier_for_attribute_id)

<a name="module_Templating API_ Attribute helpers..featureBits"></a>

### Templating API: Attribute helpers~featureBits(options) ⇒
Get feature bits from the given context.

**Kind**: inner method of [<code>Templating API: Attribute helpers</code>](#module_Templating API_ Attribute helpers)  
**Returns**: feature bits  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Attribute helpers..attributeDefault"></a>

### Templating API: Attribute helpers~attributeDefault() ⇒
Valid within a cluster context, requires code.

**Kind**: inner method of [<code>Templating API: Attribute helpers</code>](#module_Templating API_ Attribute helpers)  
**Returns**: Produces attribute defaults.  
<a name="module_Templating API_ Attribute helpers..as_underlying_atomic_identifier_for_attribute_id"></a>

### Templating API: Attribute helpers~as\_underlying\_atomic\_identifier\_for\_attribute\_id(attributeId)
Given an attribute Id determine its corresponding atomic identifier from the
atomic table.

**Kind**: inner method of [<code>Templating API: Attribute helpers</code>](#module_Templating API_ Attribute helpers)  

| Param | Type |
| --- | --- |
| attributeId | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers"></a>

## Templating API: C formatting helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: C formatting helpers](#module_Templating API_ C formatting helpers)
    * [~asOffset(hex)](#module_Templating API_ C formatting helpers..asOffset)
    * [~asDelimitedMacro(label)](#module_Templating API_ C formatting helpers..asDelimitedMacro)
    * [~asHex(label)](#module_Templating API_ C formatting helpers..asHex) ⇒
    * [~asUnderlyingTypeHelper(dataType, context, packageIds)](#module_Templating API_ C formatting helpers..asUnderlyingTypeHelper) ⇒
    * [~asUnderlyingType(value)](#module_Templating API_ C formatting helpers..asUnderlyingType) ⇒
    * [~asType(label)](#module_Templating API_ C formatting helpers..asType) ⇒
    * [~asSymbol(label)](#module_Templating API_ C formatting helpers..asSymbol) ⇒
    * [~formatValue(value, length)](#module_Templating API_ C formatting helpers..formatValue) ⇒
    * [~asBytes(value)](#module_Templating API_ C formatting helpers..asBytes)
    * [~asCamelCased(str)](#module_Templating API_ C formatting helpers..asCamelCased) ⇒
    * [~cleanseLabel(label)](#module_Templating API_ C formatting helpers..cleanseLabel)
    * [~asUnderscoreLowercase(str)](#module_Templating API_ C formatting helpers..asUnderscoreLowercase) ⇒
    * [~cleanseLabelAsKebabCase(label)](#module_Templating API_ C formatting helpers..cleanseLabelAsKebabCase)
    * [~asSpacedLowercase(str)](#module_Templating API_ C formatting helpers..asSpacedLowercase) ⇒
    * [~asUnderscoreUppercase(str)](#module_Templating API_ C formatting helpers..asUnderscoreUppercase) ⇒
    * [~asCliType(size, isSigned)](#module_Templating API_ C formatting helpers..asCliType) ⇒
    * [~as_zcl_cli_type(str, optional, isSigned)](#module_Templating API_ C formatting helpers..as_zcl_cli_type)
    * [~dataTypeForBitmap(db, bitmap_name, packageIds)](#module_Templating API_ C formatting helpers..dataTypeForBitmap)
    * [~dataTypeForEnum(db, enum_name, packageIds)](#module_Templating API_ C formatting helpers..dataTypeForEnum)
    * [~addOne(number)](#module_Templating API_ C formatting helpers..addOne)
    * [~is_number_greater_than(num1, num2)](#module_Templating API_ C formatting helpers..is_number_greater_than) ⇒
    * [~cluster_extension(options)](#module_Templating API_ C formatting helpers..cluster_extension) ⇒
    * [~device_type_extension(options)](#module_Templating API_ C formatting helpers..device_type_extension) ⇒
    * [~attribute_type_extension(options)](#module_Templating API_ C formatting helpers..attribute_type_extension) ⇒
    * [~subentityExtension(context, prop, entityType)](#module_Templating API_ C formatting helpers..subentityExtension) ⇒
    * [~if_command_extension_true(options)](#module_Templating API_ C formatting helpers..if_command_extension_true) ⇒
    * [~if_command_extension_false(options)](#module_Templating API_ C formatting helpers..if_command_extension_false) ⇒
    * [~if_cluster_extension_true(options)](#module_Templating API_ C formatting helpers..if_cluster_extension_true) ⇒
    * [~if_cluster_extension_false(options)](#module_Templating API_ C formatting helpers..if_cluster_extension_false) ⇒
    * [~attribute_extension(options)](#module_Templating API_ C formatting helpers..attribute_extension) ⇒
    * [~command_extension(options)](#module_Templating API_ C formatting helpers..command_extension) ⇒
    * [~event_extension(options)](#module_Templating API_ C formatting helpers..event_extension) ⇒

<a name="module_Templating API_ C formatting helpers..asOffset"></a>

### Templating API: C formatting helpers~asOffset(hex)
Given a hex number, it prints the offset, which is the index of the first non-zero bit.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| hex | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asDelimitedMacro"></a>

### Templating API: C formatting helpers~asDelimitedMacro(label)
Takes a label, and delimits is on camelcasing.
For example:
   VerySimpleLabel will turn into VERY_SIMPLE_LABEL

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asHex"></a>

### Templating API: C formatting helpers~asHex(label) ⇒
Formats label as a C hex constant.
If value starts as 0x or 0X it is already treated as hex,
otherwise it is assumed decimal and converted to hex.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Label formatted as C hex constant.  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderlyingTypeHelper"></a>

### Templating API: C formatting helpers~asUnderlyingTypeHelper(dataType, context, packageIds) ⇒
This function is a helper function for asUnderlyingType and assists in
returning the correct C type for the given data type

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: The appropriate C type for the given data type  

| Param | Type |
| --- | --- |
| dataType | <code>\*</code> | 
| context | <code>\*</code> | 
| packageIds | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderlyingType"></a>

### Templating API: C formatting helpers~asUnderlyingType(value) ⇒
Converts the actual zcl type into an underlying usable C type.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: The appropriate C Type  

| Param | Type |
| --- | --- |
| value | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asType"></a>

### Templating API: C formatting helpers~asType(label) ⇒
Formats label as a C type.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Label formatted as C type.  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asSymbol"></a>

### Templating API: C formatting helpers~asSymbol(label) ⇒
Formats label as a C symbol.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Label formatted as C symbol.  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..formatValue"></a>

### Templating API: C formatting helpers~formatValue(value, length) ⇒
Formats the default value into an attribute of a given length

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Formatted value  

| Param | Type |
| --- | --- |
| value | <code>\*</code> | 
| length | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asBytes"></a>

### Templating API: C formatting helpers~asBytes(value)
Given a default value of attribute, this method converts it into bytes

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| value | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asCamelCased"></a>

### Templating API: C formatting helpers~asCamelCased(str) ⇒
Given a string convert it into a camelCased string

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: a spaced out string in lowercase  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..cleanseLabel"></a>

### Templating API: C formatting helpers~cleanseLabel(label)
returns a string after converting ':' and '-' into '_'

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderscoreLowercase"></a>

### Templating API: C formatting helpers~asUnderscoreLowercase(str) ⇒
Given a camel case string, convert it into one with underscore and lowercase

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: String in lowercase with underscores  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..cleanseLabelAsKebabCase"></a>

### Templating API: C formatting helpers~cleanseLabelAsKebabCase(label)
returns a string after converting ':', ' ' and camel case into '-'

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asSpacedLowercase"></a>

### Templating API: C formatting helpers~asSpacedLowercase(str) ⇒
Given a camel case string convert it into one with space and lowercase

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: a spaced out string in lowercase  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderscoreUppercase"></a>

### Templating API: C formatting helpers~asUnderscoreUppercase(str) ⇒
Given a camel case string convert it into one with underscore and uppercase

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: String in uppercase with underscores  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asCliType"></a>

### Templating API: C formatting helpers~asCliType(size, isSigned) ⇒
Returns the cli type representation.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: the type representation required for CLI.  

| Param |
| --- |
| size | 
| isSigned | 

<a name="module_Templating API_ C formatting helpers..as_zcl_cli_type"></a>

### Templating API: C formatting helpers~as\_zcl\_cli\_type(str, optional, isSigned)
**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Description |
| --- | --- |
| str |  |
| optional |  |
| isSigned | Return the data type of zcl cli |

<a name="module_Templating API_ C formatting helpers..dataTypeForBitmap"></a>

### Templating API: C formatting helpers~dataTypeForBitmap(db, bitmap_name, packageIds)
Returns the type of bitmap based on the bitmap's name

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| bitmap_name | <code>\*</code> | 
| packageIds | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..dataTypeForEnum"></a>

### Templating API: C formatting helpers~dataTypeForEnum(db, enum_name, packageIds)
Returns the type of enum

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| enum_name | <code>\*</code> | 
| packageIds | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..addOne"></a>

### Templating API: C formatting helpers~addOne(number)
Returns the number by adding 1 to it.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| number | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..is_number_greater_than"></a>

### Templating API: C formatting helpers~is\_number\_greater\_than(num1, num2) ⇒
Return true if number1 is greater than number2

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: true if num1 is greater than num2 else returns false  

| Param |
| --- |
| num1 | 
| num2 | 

<a name="module_Templating API_ C formatting helpers..cluster_extension"></a>

### Templating API: C formatting helpers~cluster\_extension(options) ⇒
When inside a context that contains 'code', this
helper will output the value of the cluster extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the cluster extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..device_type_extension"></a>

### Templating API: C formatting helpers~device\_type\_extension(options) ⇒
When inside a context that contains 'code', this
helper will output the value of the cluster extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the cluster extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..attribute_type_extension"></a>

### Templating API: C formatting helpers~attribute\_type\_extension(options) ⇒
When inside a context that contains 'type', this
helper will output the value of the attribute type extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the attribute type extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..subentityExtension"></a>

### Templating API: C formatting helpers~subentityExtension(context, prop, entityType) ⇒
Get extension values for the given information.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: extension default value  

| Param | Type |
| --- | --- |
| context | <code>\*</code> | 
| prop | <code>\*</code> | 
| entityType | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_command_extension_true"></a>

### Templating API: C formatting helpers~if\_command\_extension\_true(options) ⇒
If helper for command extensions(true condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_command_extension_false"></a>

### Templating API: C formatting helpers~if\_command\_extension\_false(options) ⇒
If helper for command extensions(false condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_cluster_extension_true"></a>

### Templating API: C formatting helpers~if\_cluster\_extension\_true(options) ⇒
If helper for cluster extensions(true condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_cluster_extension_false"></a>

### Templating API: C formatting helpers~if\_cluster\_extension\_false(options) ⇒
If helper for cluster extensions(false condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..attribute_extension"></a>

### Templating API: C formatting helpers~attribute\_extension(options) ⇒
When inside a context that contains 'code' and parent 'code', this
helper will output the value of the attribute extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the attribute extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..command_extension"></a>

### Templating API: C formatting helpers~command\_extension(options) ⇒
When inside a context that contains 'code' and parent 'code', this
helper will output the value of the command extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the command extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..event_extension"></a>

### Templating API: C formatting helpers~event\_extension(options) ⇒
When inside a context that contains 'code' and parent 'code', this
helper will output the value of the command extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the command extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Command helpers"></a>

## Templating API: Command helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Command helpers](#module_Templating API_ Command helpers)
    * [~if_command_arguments_exist(commandId, argument_return, no_argument_return)](#module_Templating API_ Command helpers..if_command_arguments_exist)
    * [~if_command_args_exist(commandId, options)](#module_Templating API_ Command helpers..if_command_args_exist) ⇒
    * [~if_ca_always_present_with_presentif(commandArg, trueReturn, falseReturn)](#module_Templating API_ Command helpers..if_ca_always_present_with_presentif) ⇒
    * [~if_command_arg_always_present_with_presentif(commandArg, options)](#module_Templating API_ Command helpers..if_command_arg_always_present_with_presentif) ⇒
    * [~if_command_is_not_fixed_length_but_command_argument_is_always_present(command, commandArg, trueReturn, falseReturn)](#module_Templating API_ Command helpers..if_command_is_not_fixed_length_but_command_argument_is_always_present) ⇒
    * [~if_command_not_fixed_length_command_argument_always_present(command, commandArg, options)](#module_Templating API_ Command helpers..if_command_not_fixed_length_command_argument_always_present) ⇒
    * [~if_ca_not_always_present_no_presentif(commandArg, trueReturn, falseReturn)](#module_Templating API_ Command helpers..if_ca_not_always_present_no_presentif) ⇒
    * [~if_command_arg_not_always_present_no_presentif(commandArg, options)](#module_Templating API_ Command helpers..if_command_arg_not_always_present_no_presentif) ⇒
    * [~if_ca_not_always_present_with_presentif(commandArg, trueReturn, falseReturn)](#module_Templating API_ Command helpers..if_ca_not_always_present_with_presentif) ⇒
    * [~if_command_arg_not_always_present_with_presentif(commandArg, options)](#module_Templating API_ Command helpers..if_command_arg_not_always_present_with_presentif) ⇒
    * [~if_command_is_fixed_length(commandId, fixedLengthReturn, notFixedLengthReturn)](#module_Templating API_ Command helpers..if_command_is_fixed_length)
    * [~if_command_fixed_length(commandId, options)](#module_Templating API_ Command helpers..if_command_fixed_length)

<a name="module_Templating API_ Command helpers..if_command_arguments_exist"></a>

### Templating API: Command helpers~if\_command\_arguments\_exist(commandId, argument_return, no_argument_return)
**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  

| Param | Type | Description |
| --- | --- | --- |
| commandId | <code>\*</code> |  |
| argument_return | <code>\*</code> |  |
| no_argument_return | <code>\*</code> | If the command arguments for a command exist then returns argument_return else returns no_argument_return Example: {{if_command_arguments_exist [command-id] "," ""}} The above will return ',' if the command arguments for a command exist and will return nothing if the command arguments for a command do not exist. |

<a name="module_Templating API_ Command helpers..if_command_args_exist"></a>

### Templating API: Command helpers~if\_command\_args\_exist(commandId, options) ⇒
If helper which checks if command arguments exist for a command or not
example:
{{#if_command_args_exist commandId}}
 command arguments exist for the command
{{else}}
 command arguments do not exist for the command
{{/if_command_args_exist}}

**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: Returns content in the handlebar template based on whether the
command arguments are present or not.  

| Param |
| --- |
| commandId | 
| options | 

<a name="module_Templating API_ Command helpers..if_ca_always_present_with_presentif"></a>

### Templating API: Command helpers~if\_ca\_always\_present\_with\_presentif(commandArg, trueReturn, falseReturn) ⇒
**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: trueReturn if command argument is always present and there is a
presentIf condition else returns false  

| Param |
| --- |
| commandArg | 
| trueReturn | 
| falseReturn | 

<a name="module_Templating API_ Command helpers..if_command_arg_always_present_with_presentif"></a>

### Templating API: Command helpers~if\_command\_arg\_always\_present\_with\_presentif(commandArg, options) ⇒
If helper that checks if a command argument is always present with a
presentIf condition.
example:
{{#if_command_arg_always_present_with_presentif commandArg}}
 command argument has a presentIf condition
{{else}}
 command argument does not have a presentIf condition
{{/if_command_arg_always_present_with_presentif}}

**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: Returns content in the handlebar template based on the command
argument having a presentIf condition or not  

| Param |
| --- |
| commandArg | 
| options | 

<a name="module_Templating API_ Command helpers..if_command_is_not_fixed_length_but_command_argument_is_always_present"></a>

### Templating API: Command helpers~if\_command\_is\_not\_fixed\_length\_but\_command\_argument\_is\_always\_present(command, commandArg, trueReturn, falseReturn) ⇒
**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: trueReturn if command is not fixed length but command argument is
always present else returns falseReturn  

| Param |
| --- |
| command | 
| commandArg | 
| trueReturn | 
| falseReturn | 

<a name="module_Templating API_ Command helpers..if_command_not_fixed_length_command_argument_always_present"></a>

### Templating API: Command helpers~if\_command\_not\_fixed\_length\_command\_argument\_always\_present(command, commandArg, options) ⇒
If helper that checks if command is not fixed lenth and that the command is
always present.
example:
{{#if_command_not_fixed_length_command_argument_always_present commandId}}
 command is not fixed length and command argument is always present
{{else}}
 either command is fixed length or command argument is not always present
{{/if_command_not_fixed_length_command_argument_always_present}}

**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: Returns content in the handlebar template based on the command being
fixed length or not and whether the command argument is always present  

| Param |
| --- |
| command | 
| commandArg | 
| options | 

<a name="module_Templating API_ Command helpers..if_ca_not_always_present_no_presentif"></a>

### Templating API: Command helpers~if\_ca\_not\_always\_present\_no\_presentif(commandArg, trueReturn, falseReturn) ⇒
**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: trueReturn if command argument is not always present and there is no
presentIf condition else returns false  

| Param |
| --- |
| commandArg | 
| trueReturn | 
| falseReturn | 

<a name="module_Templating API_ Command helpers..if_command_arg_not_always_present_no_presentif"></a>

### Templating API: Command helpers~if\_command\_arg\_not\_always\_present\_no\_presentif(commandArg, options) ⇒
If helper that checks if a command argument is not always present because it
has a introduced in or removed in clause. The helper also checks that there
is no presentIf condition.
example:
{{#if_command_arg_not_always_present_no_presentif commandArg}}
 command argument is not always present and there is no presentIf condition
{{else}}
 Either command argument is always present or there is a presentIf condition
{{/if_command_arg_not_always_present_no_presentif}}

**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: Returns content in the handlebar template based on the command
argument being present and if there is a presentIf condition.  

| Param |
| --- |
| commandArg | 
| options | 

<a name="module_Templating API_ Command helpers..if_ca_not_always_present_with_presentif"></a>

### Templating API: Command helpers~if\_ca\_not\_always\_present\_with\_presentif(commandArg, trueReturn, falseReturn) ⇒
**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: trueReturn if command argument is not always present and there is a
presentIf condition else returns false  

| Param |
| --- |
| commandArg | 
| trueReturn | 
| falseReturn | 

<a name="module_Templating API_ Command helpers..if_command_arg_not_always_present_with_presentif"></a>

### Templating API: Command helpers~if\_command\_arg\_not\_always\_present\_with\_presentif(commandArg, options) ⇒
If helper that checks if a command argument is not always present because it
has a introduced in or removed in clause. The helper also checks that there
is a presentIf condition.
example:
{{#if_command_arg_not_always_present_with_presentif commandArg}}
 command argument is not always present and there is a presentIf condition
{{else}}
 Either command argument is always present or there is no presentIf condition
{{/if_command_arg_not_always_present_with_presentif}}

**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  
**Returns**: Returns content in the handlebar template based on the command
argument being present and if there is a presentIf condition.  

| Param |
| --- |
| commandArg | 
| options | 

<a name="module_Templating API_ Command helpers..if_command_is_fixed_length"></a>

### Templating API: Command helpers~if\_command\_is\_fixed\_length(commandId, fixedLengthReturn, notFixedLengthReturn)
**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  

| Param | Description |
| --- | --- |
| commandId |  |
| fixedLengthReturn |  |
| notFixedLengthReturn | Returns fixedLengthReturn or notFixedLengthReturn based on whether the command is fixed length or not. Also checks if the command arguments are always present or not. |

<a name="module_Templating API_ Command helpers..if_command_fixed_length"></a>

### Templating API: Command helpers~if\_command\_fixed\_length(commandId, options)
If helper which checks if a command is fixed length or not

example:
{{#if_command_fixed_length commandId}}
command is fixed length
{{else}}
command is not fixed length
{{/if_command_fixed_length}}

**Kind**: inner method of [<code>Templating API: Command helpers</code>](#module_Templating API_ Command helpers)  

| Param | Description |
| --- | --- |
| commandId |  |
| options | Returns content in the handlebar template based on the command being fixed length or not as shown in the example above. |

<a name="module_Templating API_ Matter endpoint config helpers"></a>

## Templating API: Matter endpoint config helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Matter endpoint config helpers](#module_Templating API_ Matter endpoint config helpers)
    * [~endpoint_type_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_type_count) ⇒
    * [~endpoint_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_count) ⇒
    * [~endpoint_config_macros()](#module_Templating API_ Matter endpoint config helpers..endpoint_config_macros) ⇒
    * [~endpoint_fixed_endpoint_array(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_endpoint_array) ⇒
    * [~endpoint_fixed_profile_id_array(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_profile_id_array) ⇒
    * [~endpoint_fixed_parent_id_array()](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_parent_id_array) ⇒
    * [~endpoint_fixed_network_array(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_network_array) ⇒
    * [~endpoint_fixed_endpoint_type_array(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_endpoint_type_array) ⇒
    * [~createMfgCodes(codeIndexPairs)](#module_Templating API_ Matter endpoint config helpers..createMfgCodes) ⇒
    * [~endpoint_attribute_manufacturer_codes(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_manufacturer_codes) ⇒
    * [~endpoint_attribute_manufacturer_code_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_manufacturer_code_count) ⇒
    * [~endpoint_command_manufacturer_codes(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_command_manufacturer_codes) ⇒
    * [~endpoint_command_manufacturer_code_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_command_manufacturer_code_count) ⇒
    * [~endpoint_cluster_manufacturer_codes(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_cluster_manufacturer_codes) ⇒
    * [~endpoint_cluster_manufacturer_code_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_cluster_manufacturer_code_count) ⇒
    * [~endpoint_largest_attribute_size(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_largest_attribute_size) ⇒
    * [~endpoint_singletons_size(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_singletons_size) ⇒
    * [~endpoint_total_storage_size(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_total_storage_size) ⇒
    * [~endpoint_command_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_command_count) ⇒
    * [~endpoint_types_list(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_types_list) ⇒
    * [~endpoint_cluster_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_cluster_count) ⇒
    * [~endpoint_cluster_list(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_cluster_list) ⇒
    * [~endpoint_command_list(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_command_list) ⇒
    * [~endpoint_attribute_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_count) ⇒
    * [~endpoint_attribute_list(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_list) ⇒
    * [~device_list(context, options)](#module_Templating API_ Matter endpoint config helpers..device_list) ⇒
    * [~endpoint_fixed_device_type_array(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_device_type_array) ⇒
    * [~endpoint_fixed_device_type_array_offsets(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_device_type_array_offsets) ⇒
    * [~endpoint_fixed_device_type_array_lengths(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_fixed_device_type_array_lengths) ⇒
    * [~endpoint_attribute_min_max_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_min_max_count) ⇒
    * [~endpoint_attribute_min_max_list(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_min_max_list) ⇒
    * [~endpoint_reporting_config_defaults(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_reporting_config_defaults)
    * [~endpoint_reporting_config_default_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_reporting_config_default_count) ⇒
    * [~endpoint_attribute_long_defaults_count(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_long_defaults_count) ⇒
    * [~endpoint_attribute_long_defaults(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_attribute_long_defaults) ⇒
    * [~asMEI(manufacturerCode, code)](#module_Templating API_ Matter endpoint config helpers..asMEI) ⇒
    * [~determineAttributeDefaultValue(specifiedDefault, type, typeSize, isNullable, db, sessionId)](#module_Templating API_ Matter endpoint config helpers..determineAttributeDefaultValue) ⇒
    * [~collectAttributes()](#module_Templating API_ Matter endpoint config helpers..collectAttributes)
    * [~collectAttributeSizes(db, zclPackageIds, endpointTypes)](#module_Templating API_ Matter endpoint config helpers..collectAttributeSizes) ⇒
    * [~collectAttributeTypeInfo(db, zclPackageIds, endpointTypes)](#module_Templating API_ Matter endpoint config helpers..collectAttributeTypeInfo) ⇒
    * [~isGlobalAttrExcludedFromMetadata(attr)](#module_Templating API_ Matter endpoint config helpers..isGlobalAttrExcludedFromMetadata) ⇒
    * [~endpoint_config(options)](#module_Templating API_ Matter endpoint config helpers..endpoint_config) ⇒

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_type_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_type\_count(options) ⇒
Returns number of endpoint types.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: number of endpoint types  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_count(options) ⇒
Returns number of endpoints.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: number of endpoints  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_config_macros"></a>

### Templating API: Matter endpoint config helpers~endpoint\_config\_macros() ⇒
Prints out all the macros that the endpoint config
configuration depends on. These macros are created
by ZAP, because the use of these macros is also
created by ZAP.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Macros that need to be created  
<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_endpoint_array"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_endpoint\_array(options) ⇒
Creates array of endpointId fields on endpoints

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: C array including the  brackets  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_profile_id_array"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_profile\_id\_array(options) ⇒
Creates array of profileId fields on endpoints

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: C array including the  brackets  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_parent_id_array"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_parent\_id\_array() ⇒
Creates Integer Array of parent endpoint identifier fields on endpoints. If the Parent Endpoint is not set then it will default to 0.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: C array including the  brackets  
<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_network_array"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_network\_array(options) ⇒
Creates array of networkId fields on endpoints

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: C array including the  brackets  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_endpoint_type_array"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_endpoint\_type\_array(options) ⇒
Each element of an array contains an index into the
endpoint type array, for the appropriate endpoint.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: C array of indexes, one for each endpoint.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..createMfgCodes"></a>

### Templating API: Matter endpoint config helpers~createMfgCodes(codeIndexPairs) ⇒
Get indexes and manufacturer code.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: String  

| Param | Type |
| --- | --- |
| codeIndexPairs | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_manufacturer_codes"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_manufacturer\_codes(options) ⇒
Generates array of { index , mfgCode } pairs, matching
the indexes in attribute table.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: manufacturer code array  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_manufacturer_code_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_manufacturer\_code\_count(options) ⇒
Get count of attributes with manufacturer code.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of attributes with manufacturer code  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_command_manufacturer_codes"></a>

### Templating API: Matter endpoint config helpers~endpoint\_command\_manufacturer\_codes(options) ⇒
Get all command manufacturer codes.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: all command manufacturer codes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_command_manufacturer_code_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_command\_manufacturer\_code\_count(options) ⇒
Get count of commands with manufacturer code.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of commands with manufacturer code  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_cluster_manufacturer_codes"></a>

### Templating API: Matter endpoint config helpers~endpoint\_cluster\_manufacturer\_codes(options) ⇒
Get all cluster manufacturer codes.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: all cluster manufacturer codes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_cluster_manufacturer_code_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_cluster\_manufacturer\_code\_count(options) ⇒
Get count of clusters with manufacturer code.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of clusters with manufacturer code  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_largest_attribute_size"></a>

### Templating API: Matter endpoint config helpers~endpoint\_largest\_attribute\_size(options) ⇒
Get size of largest attribute.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: size of largest attribute  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_singletons_size"></a>

### Templating API: Matter endpoint config helpers~endpoint\_singletons\_size(options) ⇒
Get cumulative size of all singleton endpoint type attributes.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: cumulative size of all singleton endpoint type attributes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_total_storage_size"></a>

### Templating API: Matter endpoint config helpers~endpoint\_total\_storage\_size(options) ⇒
Get cumulative size of all endpoint type attributes.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: cumulative size of all endpoint type attributes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_command_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_command\_count(options) ⇒
Get count of endpoint type commands.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of endpoint type commands  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_types_list"></a>

### Templating API: Matter endpoint config helpers~endpoint\_types\_list(options) ⇒
Get endpoint type information.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: endpoint type information  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_cluster_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_cluster\_count(options) ⇒
Get count of endpoint type clusters.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of endpoint type clusters  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_cluster_list"></a>

### Templating API: Matter endpoint config helpers~endpoint\_cluster\_list(options) ⇒
Get endpoint type cluster information.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: endpoint type cluster information  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_command_list"></a>

### Templating API: Matter endpoint config helpers~endpoint\_command\_list(options) ⇒
Get endpoint type command information.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: endpoint type command information  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_count(options) ⇒
Get count of endpoint type attributes.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of endpoint type attributes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_list"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_list(options) ⇒
Get endpoint type attribute information.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: endpoint type attribute information  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..device_list"></a>

### Templating API: Matter endpoint config helpers~device\_list(context, options) ⇒
Extracting device versions and identifiers from endpoint types

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: list of device types  

| Param | Type |
| --- | --- |
| context | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_device_type_array"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_device\_type\_array(options) ⇒
Get all device types in the configuration.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: device types  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_device_type_array_offsets"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_device\_type\_array\_offsets(options) ⇒
Get device type offset per endpoint.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Device type offset per endpoint  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_fixed_device_type_array_lengths"></a>

### Templating API: Matter endpoint config helpers~endpoint\_fixed\_device\_type\_array\_lengths(options) ⇒
Get count of device types per endpoint.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of device types per endpoint  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_min_max_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_min\_max\_count(options) ⇒
Get count of total attributes with min max values listed.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: count of total attributes with min max values listed  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_min_max_list"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_min\_max\_list(options) ⇒
Get all attributes with min max values defined.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: All attributes with min max values listed  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_reporting_config_defaults"></a>

### Templating API: Matter endpoint config helpers~endpoint\_reporting\_config\_defaults(options)
This helper supports an "order" CSV string, such as:
  "direction,endpoint,clusterId,attributeId,mask,mfgCode,minmax"
The string above is a default value, and it determines in what order are the fields generated.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_reporting_config_default_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_reporting\_config\_default\_count(options) ⇒
Get count of total attributes with reporting enabled

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Count of total attributes with reporting enabled  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_long_defaults_count"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_long\_defaults\_count(options) ⇒
Get long(size>2 bytes) attribute count.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: count of long attributes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_attribute_long_defaults"></a>

### Templating API: Matter endpoint config helpers~endpoint\_attribute\_long\_defaults(options) ⇒
Get long(size>2 bytes) attribute default values based on endianness.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Long attribute's default values  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..asMEI"></a>

### Templating API: Matter endpoint config helpers~asMEI(manufacturerCode, code) ⇒
Get 32 bit code from the given code and manufacturer code.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: 32 bit Hex Code.  

| Param | Type |
| --- | --- |
| manufacturerCode | <code>\*</code> | 
| code | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..determineAttributeDefaultValue"></a>

### Templating API: Matter endpoint config helpers~determineAttributeDefaultValue(specifiedDefault, type, typeSize, isNullable, db, sessionId) ⇒
The representation of null depends on the type, so we can't use a single
macro that's defined elsewhere for "null value".
Get the default value of an attribute.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: Attribute's default value  

| Param | Type |
| --- | --- |
| specifiedDefault | <code>\*</code> | 
| type | <code>\*</code> | 
| typeSize | <code>\*</code> | 
| isNullable | <code>\*</code> | 
| db | <code>\*</code> | 
| sessionId | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..collectAttributes"></a>

### Templating API: Matter endpoint config helpers~collectAttributes()
Attribute collection works like this:
   1.) Go over all the clusters that exist.
   2.) If client is included on at least one endpoint add client atts.
   3.) If server is included on at least one endpoint add server atts.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
<a name="module_Templating API_ Matter endpoint config helpers..collectAttributeSizes"></a>

### Templating API: Matter endpoint config helpers~collectAttributeSizes(db, zclPackageIds, endpointTypes) ⇒
This function goes over all the attributes and populates sizes.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: promise that resolves with the passed endpointTypes, after populating the attribute type sizes.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| zclPackageIds | <code>\*</code> | 
| endpointTypes | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..collectAttributeTypeInfo"></a>

### Templating API: Matter endpoint config helpers~collectAttributeTypeInfo(db, zclPackageIds, endpointTypes) ⇒
This function goes over all attributes and populates atomic types.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: promise that resolves with the passed endpointTypes, after populating the attribute atomic types.  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| zclPackageIds | <code>\*</code> | 
| endpointTypes | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..isGlobalAttrExcludedFromMetadata"></a>

### Templating API: Matter endpoint config helpers~isGlobalAttrExcludedFromMetadata(attr) ⇒
Checks if global attribute is excluded from the meta data.

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| attr | <code>\*</code> | 

<a name="module_Templating API_ Matter endpoint config helpers..endpoint_config"></a>

### Templating API: Matter endpoint config helpers~endpoint\_config(options) ⇒
Starts the endpoint configuration block.,
longDefaults: longDefaults

**Kind**: inner method of [<code>Templating API: Matter endpoint config helpers</code>](#module_Templating API_ Matter endpoint config helpers)  
**Returns**: a promise of a rendered block  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Future helpers"></a>

## Templating API: Future helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Future helpers](#module_Templating API_ Future helpers)
    * [~ifFuture(options)](#module_Templating API_ Future helpers..ifFuture)
    * [~setFuture(options)](#module_Templating API_ Future helpers..setFuture)
    * [~future(options)](#module_Templating API_ Future helpers..future)

<a name="module_Templating API_ Future helpers..ifFuture"></a>

### Templating API: Future helpers~ifFuture(options)
Block helper resolving the block if the
value of the specified future matches.

**Kind**: inner method of [<code>Templating API: Future helpers</code>](#module_Templating API_ Future helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Future helpers..setFuture"></a>

### Templating API: Future helpers~setFuture(options)
This method sets the value of the future.
Use it as:
  {{set_future name="NAME" value="VALUE"}}

**Kind**: inner method of [<code>Templating API: Future helpers</code>](#module_Templating API_ Future helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Future helpers..future"></a>

### Templating API: Future helpers~future(options)
This method defines the future with a given name.
Use it as: {{future name="NAME"}}

**Kind**: inner method of [<code>Templating API: Future helpers</code>](#module_Templating API_ Future helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ SDK extension helpers"></a>

## Templating API: SDK extension helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}

<a name="module_Templating API_ C formatting helpers"></a>

## Templating API: C formatting helpers
This module contains the API for accessing SDK extensions.


* [Templating API: C formatting helpers](#module_Templating API_ C formatting helpers)
    * [~asOffset(hex)](#module_Templating API_ C formatting helpers..asOffset)
    * [~asDelimitedMacro(label)](#module_Templating API_ C formatting helpers..asDelimitedMacro)
    * [~asHex(label)](#module_Templating API_ C formatting helpers..asHex) ⇒
    * [~asUnderlyingTypeHelper(dataType, context, packageIds)](#module_Templating API_ C formatting helpers..asUnderlyingTypeHelper) ⇒
    * [~asUnderlyingType(value)](#module_Templating API_ C formatting helpers..asUnderlyingType) ⇒
    * [~asType(label)](#module_Templating API_ C formatting helpers..asType) ⇒
    * [~asSymbol(label)](#module_Templating API_ C formatting helpers..asSymbol) ⇒
    * [~formatValue(value, length)](#module_Templating API_ C formatting helpers..formatValue) ⇒
    * [~asBytes(value)](#module_Templating API_ C formatting helpers..asBytes)
    * [~asCamelCased(str)](#module_Templating API_ C formatting helpers..asCamelCased) ⇒
    * [~cleanseLabel(label)](#module_Templating API_ C formatting helpers..cleanseLabel)
    * [~asUnderscoreLowercase(str)](#module_Templating API_ C formatting helpers..asUnderscoreLowercase) ⇒
    * [~cleanseLabelAsKebabCase(label)](#module_Templating API_ C formatting helpers..cleanseLabelAsKebabCase)
    * [~asSpacedLowercase(str)](#module_Templating API_ C formatting helpers..asSpacedLowercase) ⇒
    * [~asUnderscoreUppercase(str)](#module_Templating API_ C formatting helpers..asUnderscoreUppercase) ⇒
    * [~asCliType(size, isSigned)](#module_Templating API_ C formatting helpers..asCliType) ⇒
    * [~as_zcl_cli_type(str, optional, isSigned)](#module_Templating API_ C formatting helpers..as_zcl_cli_type)
    * [~dataTypeForBitmap(db, bitmap_name, packageIds)](#module_Templating API_ C formatting helpers..dataTypeForBitmap)
    * [~dataTypeForEnum(db, enum_name, packageIds)](#module_Templating API_ C formatting helpers..dataTypeForEnum)
    * [~addOne(number)](#module_Templating API_ C formatting helpers..addOne)
    * [~is_number_greater_than(num1, num2)](#module_Templating API_ C formatting helpers..is_number_greater_than) ⇒
    * [~cluster_extension(options)](#module_Templating API_ C formatting helpers..cluster_extension) ⇒
    * [~device_type_extension(options)](#module_Templating API_ C formatting helpers..device_type_extension) ⇒
    * [~attribute_type_extension(options)](#module_Templating API_ C formatting helpers..attribute_type_extension) ⇒
    * [~subentityExtension(context, prop, entityType)](#module_Templating API_ C formatting helpers..subentityExtension) ⇒
    * [~if_command_extension_true(options)](#module_Templating API_ C formatting helpers..if_command_extension_true) ⇒
    * [~if_command_extension_false(options)](#module_Templating API_ C formatting helpers..if_command_extension_false) ⇒
    * [~if_cluster_extension_true(options)](#module_Templating API_ C formatting helpers..if_cluster_extension_true) ⇒
    * [~if_cluster_extension_false(options)](#module_Templating API_ C formatting helpers..if_cluster_extension_false) ⇒
    * [~attribute_extension(options)](#module_Templating API_ C formatting helpers..attribute_extension) ⇒
    * [~command_extension(options)](#module_Templating API_ C formatting helpers..command_extension) ⇒
    * [~event_extension(options)](#module_Templating API_ C formatting helpers..event_extension) ⇒

<a name="module_Templating API_ C formatting helpers..asOffset"></a>

### Templating API: C formatting helpers~asOffset(hex)
Given a hex number, it prints the offset, which is the index of the first non-zero bit.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| hex | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asDelimitedMacro"></a>

### Templating API: C formatting helpers~asDelimitedMacro(label)
Takes a label, and delimits is on camelcasing.
For example:
   VerySimpleLabel will turn into VERY_SIMPLE_LABEL

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asHex"></a>

### Templating API: C formatting helpers~asHex(label) ⇒
Formats label as a C hex constant.
If value starts as 0x or 0X it is already treated as hex,
otherwise it is assumed decimal and converted to hex.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Label formatted as C hex constant.  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderlyingTypeHelper"></a>

### Templating API: C formatting helpers~asUnderlyingTypeHelper(dataType, context, packageIds) ⇒
This function is a helper function for asUnderlyingType and assists in
returning the correct C type for the given data type

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: The appropriate C type for the given data type  

| Param | Type |
| --- | --- |
| dataType | <code>\*</code> | 
| context | <code>\*</code> | 
| packageIds | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderlyingType"></a>

### Templating API: C formatting helpers~asUnderlyingType(value) ⇒
Converts the actual zcl type into an underlying usable C type.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: The appropriate C Type  

| Param | Type |
| --- | --- |
| value | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asType"></a>

### Templating API: C formatting helpers~asType(label) ⇒
Formats label as a C type.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Label formatted as C type.  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asSymbol"></a>

### Templating API: C formatting helpers~asSymbol(label) ⇒
Formats label as a C symbol.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Label formatted as C symbol.  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..formatValue"></a>

### Templating API: C formatting helpers~formatValue(value, length) ⇒
Formats the default value into an attribute of a given length

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Formatted value  

| Param | Type |
| --- | --- |
| value | <code>\*</code> | 
| length | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asBytes"></a>

### Templating API: C formatting helpers~asBytes(value)
Given a default value of attribute, this method converts it into bytes

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| value | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asCamelCased"></a>

### Templating API: C formatting helpers~asCamelCased(str) ⇒
Given a string convert it into a camelCased string

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: a spaced out string in lowercase  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..cleanseLabel"></a>

### Templating API: C formatting helpers~cleanseLabel(label)
returns a string after converting ':' and '-' into '_'

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderscoreLowercase"></a>

### Templating API: C formatting helpers~asUnderscoreLowercase(str) ⇒
Given a camel case string, convert it into one with underscore and lowercase

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: String in lowercase with underscores  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..cleanseLabelAsKebabCase"></a>

### Templating API: C formatting helpers~cleanseLabelAsKebabCase(label)
returns a string after converting ':', ' ' and camel case into '-'

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| label | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asSpacedLowercase"></a>

### Templating API: C formatting helpers~asSpacedLowercase(str) ⇒
Given a camel case string convert it into one with space and lowercase

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: a spaced out string in lowercase  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asUnderscoreUppercase"></a>

### Templating API: C formatting helpers~asUnderscoreUppercase(str) ⇒
Given a camel case string convert it into one with underscore and uppercase

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: String in uppercase with underscores  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..asCliType"></a>

### Templating API: C formatting helpers~asCliType(size, isSigned) ⇒
Returns the cli type representation.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: the type representation required for CLI.  

| Param |
| --- |
| size | 
| isSigned | 

<a name="module_Templating API_ C formatting helpers..as_zcl_cli_type"></a>

### Templating API: C formatting helpers~as\_zcl\_cli\_type(str, optional, isSigned)
**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Description |
| --- | --- |
| str |  |
| optional |  |
| isSigned | Return the data type of zcl cli |

<a name="module_Templating API_ C formatting helpers..dataTypeForBitmap"></a>

### Templating API: C formatting helpers~dataTypeForBitmap(db, bitmap_name, packageIds)
Returns the type of bitmap based on the bitmap's name

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| bitmap_name | <code>\*</code> | 
| packageIds | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..dataTypeForEnum"></a>

### Templating API: C formatting helpers~dataTypeForEnum(db, enum_name, packageIds)
Returns the type of enum

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| db | <code>\*</code> | 
| enum_name | <code>\*</code> | 
| packageIds | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..addOne"></a>

### Templating API: C formatting helpers~addOne(number)
Returns the number by adding 1 to it.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  

| Param | Type |
| --- | --- |
| number | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..is_number_greater_than"></a>

### Templating API: C formatting helpers~is\_number\_greater\_than(num1, num2) ⇒
Return true if number1 is greater than number2

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: true if num1 is greater than num2 else returns false  

| Param |
| --- |
| num1 | 
| num2 | 

<a name="module_Templating API_ C formatting helpers..cluster_extension"></a>

### Templating API: C formatting helpers~cluster\_extension(options) ⇒
When inside a context that contains 'code', this
helper will output the value of the cluster extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the cluster extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..device_type_extension"></a>

### Templating API: C formatting helpers~device\_type\_extension(options) ⇒
When inside a context that contains 'code', this
helper will output the value of the cluster extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the cluster extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..attribute_type_extension"></a>

### Templating API: C formatting helpers~attribute\_type\_extension(options) ⇒
When inside a context that contains 'type', this
helper will output the value of the attribute type extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the attribute type extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..subentityExtension"></a>

### Templating API: C formatting helpers~subentityExtension(context, prop, entityType) ⇒
Get extension values for the given information.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: extension default value  

| Param | Type |
| --- | --- |
| context | <code>\*</code> | 
| prop | <code>\*</code> | 
| entityType | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_command_extension_true"></a>

### Templating API: C formatting helpers~if\_command\_extension\_true(options) ⇒
If helper for command extensions(true condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_command_extension_false"></a>

### Templating API: C formatting helpers~if\_command\_extension\_false(options) ⇒
If helper for command extensions(false condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_cluster_extension_true"></a>

### Templating API: C formatting helpers~if\_cluster\_extension\_true(options) ⇒
If helper for cluster extensions(true condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..if_cluster_extension_false"></a>

### Templating API: C formatting helpers~if\_cluster\_extension\_false(options) ⇒
If helper for cluster extensions(false condition).

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: content like an if handlebar helper  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..attribute_extension"></a>

### Templating API: C formatting helpers~attribute\_extension(options) ⇒
When inside a context that contains 'code' and parent 'code', this
helper will output the value of the attribute extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the attribute extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..command_extension"></a>

### Templating API: C formatting helpers~command\_extension(options) ⇒
When inside a context that contains 'code' and parent 'code', this
helper will output the value of the command extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the command extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ C formatting helpers..event_extension"></a>

### Templating API: C formatting helpers~event\_extension(options) ⇒
When inside a context that contains 'code' and parent 'code', this
helper will output the value of the command extension
specified by property="propName" attribute.

**Kind**: inner method of [<code>Templating API: C formatting helpers</code>](#module_Templating API_ C formatting helpers)  
**Returns**: Value of the command extension property.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers"></a>

## Templating API: user-data specific helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: user-data specific helpers](#module_Templating API_ user-data specific helpers)
    * [~user_endpoints(options)](#module_Templating API_ user-data specific helpers..user_endpoints)
    * [~user_device_types(options)](#module_Templating API_ user-data specific helpers..user_device_types)
    * [~user_endpoint_types(options)](#module_Templating API_ user-data specific helpers..user_endpoint_types)
    * [~user_clusters(options)](#module_Templating API_ user-data specific helpers..user_clusters)
    * [~user_cluster_attributes(options)](#module_Templating API_ user-data specific helpers..user_cluster_attributes) ⇒
    * [~user_cluster_commands(options)](#module_Templating API_ user-data specific helpers..user_cluster_commands) ⇒
    * [~user_cluster_events(options)](#module_Templating API_ user-data specific helpers..user_cluster_events) ⇒
    * [~user_endpoint_type_count()](#module_Templating API_ user-data specific helpers..user_endpoint_type_count) ⇒
    * [~user_endpoint_count_by_cluster(clusterTypeId)](#module_Templating API_ user-data specific helpers..user_endpoint_count_by_cluster) ⇒
    * [~user_all_attributes(options)](#module_Templating API_ user-data specific helpers..user_all_attributes) ⇒
    * [~all_user_cluster_commands(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_commands) ⇒
    * [~all_user_cluster_command_util(name, side, options, currentContext, isManufacturingSpecific, isIrrespectiveOfManufacturingSpecification)](#module_Templating API_ user-data specific helpers..all_user_cluster_command_util)
    * [~all_user_cluster_attribute_util(name, side, options, currentContext, isManufacturingSpecific, isIrrespectiveOfManufacturingSpecification)](#module_Templating API_ user-data specific helpers..all_user_cluster_attribute_util) ⇒
    * [~all_user_cluster_manufacturer_specific_commands(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_manufacturer_specific_commands) ⇒
    * [~all_user_cluster_non_manufacturer_specific_commands(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_non_manufacturer_specific_commands) ⇒
    * [~all_user_cluster_manufacturer_specific_attributes(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_manufacturer_specific_attributes) ⇒
    * [~all_user_cluster_non_manufacturer_specific_attributes(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_non_manufacturer_specific_attributes) ⇒
    * [~all_commands_for_user_enabled_clusters(options)](#module_Templating API_ user-data specific helpers..all_commands_for_user_enabled_clusters) ⇒
    * [~all_cli_commands_for_user_enabled_clusters(options)](#module_Templating API_ user-data specific helpers..all_cli_commands_for_user_enabled_clusters) ⇒
    * [~all_user_clusters(options)](#module_Templating API_ user-data specific helpers..all_user_clusters) ⇒
    * [~all_user_clusters_irrespective_of_side(options)](#module_Templating API_ user-data specific helpers..all_user_clusters_irrespective_of_side) ⇒
    * [~all_user_clusters_names(options)](#module_Templating API_ user-data specific helpers..all_user_clusters_names) ⇒
    * [~user_cluster_command_count_with_cli()](#module_Templating API_ user-data specific helpers..user_cluster_command_count_with_cli)
    * [~user_cluster_commands_with_cli()](#module_Templating API_ user-data specific helpers..user_cluster_commands_with_cli)
    * [~user_cluster_commands_all_endpoints(options)](#module_Templating API_ user-data specific helpers..user_cluster_commands_all_endpoints)
    * [~user_cluster_has_enabled_command(name, side)](#module_Templating API_ user-data specific helpers..user_cluster_has_enabled_command) ⇒
    * [~all_user_cluster_commands_irrespective_of_manufaturing_specification(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_commands_irrespective_of_manufaturing_specification) ⇒
    * [~enabled_attributes_for_cluster_and_side(name, side, options)](#module_Templating API_ user-data specific helpers..enabled_attributes_for_cluster_and_side) ⇒
    * [~user_session_key(options)](#module_Templating API_ user-data specific helpers..user_session_key) ⇒
    * [~if_command_discovery_enabled()](#module_Templating API_ user-data specific helpers..if_command_discovery_enabled)
    * [~user_manufacturer_code(options)](#module_Templating API_ user-data specific helpers..user_manufacturer_code) ⇒
    * [~user_default_response_policy(options)](#module_Templating API_ user-data specific helpers..user_default_response_policy) ⇒
    * [~is_command_default_response_enabled(command, options)](#module_Templating API_ user-data specific helpers..is_command_default_response_enabled) ⇒
    * [~is_command_default_response_disabled(command, options)](#module_Templating API_ user-data specific helpers..is_command_default_response_disabled) ⇒
    * [~endpoint_type_identifier(endpointTypeId)](#module_Templating API_ user-data specific helpers..endpoint_type_identifier) ⇒
    * [~endpoint_type_index(endpointTypeId)](#module_Templating API_ user-data specific helpers..endpoint_type_index) ⇒
    * [~all_user_cluster_attributes_for_generated_defaults(name, side, options)](#module_Templating API_ user-data specific helpers..all_user_cluster_attributes_for_generated_defaults) ⇒
    * [~all_user_cluster_generated_attributes(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_generated_attributes) ⇒
    * [~all_user_reportable_attributes(options)](#module_Templating API_ user-data specific helpers..all_user_reportable_attributes) ⇒
    * [~all_user_cluster_generated_commands(options)](#module_Templating API_ user-data specific helpers..all_user_cluster_generated_commands) ⇒
    * [~all_user_clusters_with_incoming_or_outgoing_commands(options, is_incoming)](#module_Templating API_ user-data specific helpers..all_user_clusters_with_incoming_or_outgoing_commands) ⇒
    * [~all_user_clusters_with_incoming_commands(options)](#module_Templating API_ user-data specific helpers..all_user_clusters_with_incoming_commands) ⇒
    * [~all_user_clusters_with_outgoing_commands(options)](#module_Templating API_ user-data specific helpers..all_user_clusters_with_outgoing_commands) ⇒
    * [~manufacturing_clusters_with_incoming_commands(clusterCode, options)](#module_Templating API_ user-data specific helpers..manufacturing_clusters_with_incoming_commands) ⇒
    * [~all_user_clusters_with_incoming_commands_combined(options)](#module_Templating API_ user-data specific helpers..all_user_clusters_with_incoming_commands_combined) ⇒
    * [~all_incoming_commands_for_cluster_combined(clusterName, clientSide, serverSide, options)](#module_Templating API_ user-data specific helpers..all_incoming_commands_for_cluster_combined) ⇒
    * [~all_user_incoming_commands_for_all_clusters(options)](#module_Templating API_ user-data specific helpers..all_user_incoming_commands_for_all_clusters) ⇒
    * [~all_incoming_or_outgoing_commands_for_cluster(clusterName, clusterSide, isIncoming, options)](#module_Templating API_ user-data specific helpers..all_incoming_or_outgoing_commands_for_cluster) ⇒
    * [~all_incoming_commands_for_cluster(clusterName, options)](#module_Templating API_ user-data specific helpers..all_incoming_commands_for_cluster) ⇒
    * [~all_outgoing_commands_for_cluster(clusterName, options)](#module_Templating API_ user-data specific helpers..all_outgoing_commands_for_cluster) ⇒
    * [~generated_clustes_details(options)](#module_Templating API_ user-data specific helpers..generated_clustes_details) ⇒
    * [~generated_endpoint_type_details(options)](#module_Templating API_ user-data specific helpers..generated_endpoint_type_details) ⇒
    * [~all_user_cluster_attributes_min_max_defaults(name, side, options)](#module_Templating API_ user-data specific helpers..all_user_cluster_attributes_min_max_defaults) ⇒
    * [~checkAttributeMatch(clusterName, attributeName, attributeSide, attributeValue, attributeValueType, endpointAttributes)](#module_Templating API_ user-data specific helpers..checkAttributeMatch) ⇒
    * [~generated_defaults_index(clusterName, attributeName, attributeValueType, attributeValue, prefixReturn, postFixReturn)](#module_Templating API_ user-data specific helpers..generated_defaults_index) ⇒
    * [~generated_default_index(clusterName, attributeName, attributeSide, attributeValueType, attributeValue, prefixReturn, postFixReturn)](#module_Templating API_ user-data specific helpers..generated_default_index) ⇒
    * [~generated_attributes_min_max_index(name, side, options)](#module_Templating API_ user-data specific helpers..generated_attributes_min_max_index) ⇒
    * [~generated_attribute_min_max_index(clusterName, attributeName, attributeSide, options)](#module_Templating API_ user-data specific helpers..generated_attribute_min_max_index) ⇒
    * [~if_enabled_clusters(options)](#module_Templating API_ user-data specific helpers..if_enabled_clusters) ⇒
    * [~if_multi_protocol_attributes_enabled(options)](#module_Templating API_ user-data specific helpers..if_multi_protocol_attributes_enabled) ⇒
    * [~all_multi_protocol_attributes(options)](#module_Templating API_ user-data specific helpers..all_multi_protocol_attributes) ⇒

<a name="module_Templating API_ user-data specific helpers..user_endpoints"></a>

### Templating API: user-data specific helpers~user\_endpoints(options)
Creates block iterator over the endpoints.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_device_types"></a>

### Templating API: user-data specific helpers~user\_device\_types(options)
Creates device type iterator over an endpoint type id.
This works inside user_endpoints or user_endpoint_types.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_endpoint_types"></a>

### Templating API: user-data specific helpers~user\_endpoint\_types(options)
Creates block iterator helper over the endpoint types.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_clusters"></a>

### Templating API: user-data specific helpers~user\_clusters(options)
Creates cluster iterator over the endpoint types.
This works ony inside user_endpoint_types.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_cluster_attributes"></a>

### Templating API: user-data specific helpers~user\_cluster\_attributes(options) ⇒
Creates endpoint type cluster attribute iterator. This works only
inside user_clusters.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster attributes.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_cluster_commands"></a>

### Templating API: user-data specific helpers~user\_cluster\_commands(options) ⇒
Creates endpoint type cluster command iterator. This works only inside
user_clusters.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_cluster_events"></a>

### Templating API: user-data specific helpers~user\_cluster\_events(options) ⇒
Creates endpoint type cluster event iterator. This works only inside
user_clusters.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster events.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_endpoint_type_count"></a>

### Templating API: user-data specific helpers~user\_endpoint\_type\_count() ⇒
Get count of total endpoint types.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: count of total endpoint types  
<a name="module_Templating API_ user-data specific helpers..user_endpoint_count_by_cluster"></a>

### Templating API: user-data specific helpers~user\_endpoint\_count\_by\_cluster(clusterTypeId) ⇒
Retrieve the number of endpoints which possess the specified
cluster type

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the number of endpoint  

| Param | Type |
| --- | --- |
| clusterTypeId | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_all_attributes"></a>

### Templating API: user-data specific helpers~user\_all\_attributes(options) ⇒
Iterates over all attributes required by the user configuration.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_commands"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_commands(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
commands which have been enabled on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_command_util"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_command\_util(name, side, options, currentContext, isManufacturingSpecific, isIrrespectiveOfManufacturingSpecification)
**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  

| Param | Default | Description |
| --- | --- | --- |
| name |  |  |
| side |  |  |
| options |  |  |
| currentContext |  |  |
| isManufacturingSpecific |  |  |
| isIrrespectiveOfManufacturingSpecification | <code>false</code> | Returns: Promise of the resolved blocks iterating over manufacturing specific, non-manufacturing specific or both of the cluster commands. |

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_attribute_util"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_attribute\_util(name, side, options, currentContext, isManufacturingSpecific, isIrrespectiveOfManufacturingSpecification) ⇒
Get attribute details based on given arguments.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Attribute details  

| Param | Type | Default |
| --- | --- | --- |
| name | <code>\*</code> |  | 
| side | <code>\*</code> |  | 
| options | <code>\*</code> |  | 
| currentContext | <code>\*</code> |  | 
| isManufacturingSpecific | <code>\*</code> |  | 
| isIrrespectiveOfManufacturingSpecification | <code>\*</code> | <code>false</code> | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_manufacturer_specific_commands"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_manufacturer\_specific\_commands(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
manufacturing specific commands which have been enabled on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over manufacturing specific
cluster commands.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_non_manufacturer_specific_commands"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_non\_manufacturer\_specific\_commands(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
non-manufacturing specific commands which have been enabled on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over non-manufacturing specific
cluster commands.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_manufacturer_specific_attributes"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_manufacturer\_specific\_attributes(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
manufacturing specific commands which have been enabled on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over manufacturing specific
cluster commands.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_non_manufacturer_specific_attributes"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_non\_manufacturer\_specific\_attributes(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
non-manufacturing specific commands which have been enabled on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over non-manufacturing specific
cluster commands.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_commands_for_user_enabled_clusters"></a>

### Templating API: user-data specific helpers~all\_commands\_for\_user\_enabled\_clusters(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
commands which have been enabled on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_cli_commands_for_user_enabled_clusters"></a>

### Templating API: user-data specific helpers~all\_cli\_commands\_for\_user\_enabled\_clusters(options) ⇒
This helper returns all commands which have cli within the list of enabled
clusters.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: all commands with cli from the list of enabled clusters  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_clusters"></a>

### Templating API: user-data specific helpers~all\_user\_clusters(options) ⇒
Creates cluster iterator for all endpoints.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_user_clusters_irrespective_of_side"></a>

### Templating API: user-data specific helpers~all\_user\_clusters\_irrespective\_of\_side(options) ⇒
Creates cluster command iterator for all endpoints.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_user_clusters_names"></a>

### Templating API: user-data specific helpers~all\_user\_clusters\_names(options) ⇒
Creates cluster command iterator for all endpoints whitout any duplicates
cause by cluster side

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over cluster commands.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_cluster_command_count_with_cli"></a>

### Templating API: user-data specific helpers~user\_cluster\_command\_count\_with\_cli()
Get the count of the number of clusters commands with cli for a cluster.
This is used under a cluster block helper

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
<a name="module_Templating API_ user-data specific helpers..user_cluster_commands_with_cli"></a>

### Templating API: user-data specific helpers~user\_cluster\_commands\_with\_cli()
This helper works within the the cluster block helpers. It is used to get
all commands of the cluster which have cli associated with them.

param options
Returns: all commands with cli for a cluster

Example:
{{#all_user_clusters_irrespective_of_side}}
 {{#user_cluster_commands_with_cli}}
 {{/user_cluster_commands_with_cli}}
{{/all_user_clusters_irrespective_of_side}}

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
<a name="module_Templating API_ user-data specific helpers..user_cluster_commands_all_endpoints"></a>

### Templating API: user-data specific helpers~user\_cluster\_commands\_all\_endpoints(options)
Creates endpoint type cluster command iterator. This works only inside
cluster block helpers.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  

| Param | Description |
| --- | --- |
| options | Returns: Promise of the resolved blocks iterating over cluster commands. |

<a name="module_Templating API_ user-data specific helpers..user_cluster_has_enabled_command"></a>

### Templating API: user-data specific helpers~user\_cluster\_has\_enabled\_command(name, side) ⇒
Check if the cluster (name) has any enabled commands. This works only inside
cluster block helpers.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: True if cluster has enabled commands otherwise false  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>\*</code> | : Cluster name |
| side | <code>\*</code> | : Cluster side |

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_commands_irrespective_of_manufaturing_specification"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_commands\_irrespective\_of\_manufaturing\_specification(options) ⇒
Creates endpoint type cluster command iterator. This fetches all
manufacturing and non-manufaturing specific commands which have been enabled
on added endpoints

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over manufacturing specific
and non-manufacturing specific cluster commands.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..enabled_attributes_for_cluster_and_side"></a>

### Templating API: user-data specific helpers~enabled\_attributes\_for\_cluster\_and\_side(name, side, options) ⇒
Creates endpoint type cluster attribute iterator. This fetches all
manufacturer-specific and standard attributes which have been enabled on
added endpoints based on the name and side of the cluster. When side
is not mentioned then client and server attributes are returned.
Available Options:
- removeKeys: Removes one or more keys from the map(for eg keys in db-mapping.js)
for eg:(#enabled_attributes_for_cluster_and_side
         [cluster-name], [cluster-side], removeKeys='isOptional, isNullable')
will remove 'isOptional' and 'isNullable' from the results

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of the resolved blocks iterating over manufacturing specific
and standard cluster attributes.  

| Param |
| --- |
| name | 
| side | 
| options | 

<a name="module_Templating API_ user-data specific helpers..user_session_key"></a>

### Templating API: user-data specific helpers~user\_session\_key(options) ⇒
Helper that resolves into a user session key value.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of value of the session key or undefined.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..if_command_discovery_enabled"></a>

### Templating API: user-data specific helpers~if\_command\_discovery\_enabled()
If helper that checks if command discovery is enabled

example:
{{#if_command_discovery_enabled}}
command discovery is enabled
{{else}}
command discovery is not enabled
{{/if_command_discovery_enabled}}

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
<a name="module_Templating API_ user-data specific helpers..user_manufacturer_code"></a>

### Templating API: user-data specific helpers~user\_manufacturer\_code(options) ⇒
Get Session's manufacturer code.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: session's manufacturer code  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..user_default_response_policy"></a>

### Templating API: user-data specific helpers~user\_default\_response\_policy(options) ⇒
Get user's default response policy selected.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: user's default response policy selected  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..is_command_default_response_enabled"></a>

### Templating API: user-data specific helpers~is\_command\_default\_response\_enabled(command, options) ⇒
An if helper to check if default response for a command is enabled or not.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: true if the the default response policy is either always or
when the policy is not never and the command has the disable default
response policy set to false(not true)  

| Param | Type |
| --- | --- |
| command | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..is_command_default_response_disabled"></a>

### Templating API: user-data specific helpers~is\_command\_default\_response\_disabled(command, options) ⇒
An if helper to check if default response for a command is disabled or not.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: true if the the default response policy is either never or
when the policy is not always and the command has the disable default
response policy set to true(for eg disableDefaultResponse="true" in xml).  

| Param | Type |
| --- | --- |
| command | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..endpoint_type_identifier"></a>

### Templating API: user-data specific helpers~endpoint\_type\_identifier(endpointTypeId) ⇒
Get endpoint identifier from the given endpoint type ID.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: the endpoint type identifier for an endpoint type  

| Param | Type |
| --- | --- |
| endpointTypeId | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..endpoint_type_index"></a>

### Templating API: user-data specific helpers~endpoint\_type\_index(endpointTypeId) ⇒
Get the index of the endpoint whose endpointTypeId is endpointTypeId
Will return -1 if the given endpoint type is not present.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: integer  

| Param | Type |
| --- | --- |
| endpointTypeId | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_attributes_for_generated_defaults"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_attributes\_for\_generated\_defaults(name, side, options) ⇒
Default values for the attributes longer than a pointer.
All attribute values with size greater than 2 bytes.
Excluding 0 values and externally saved values

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Attribute values greater than 2 bytes and not 0 nor externally saved.  

| Param |
| --- |
| name | 
| side | 
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_generated_attributes"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_generated\_attributes(options) ⇒
Entails the list of all attributes which have been enabled. Given the
cluster is enabled as well. The helper retrieves the attributes across
all endpoints.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: enabled attributes  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_reportable_attributes"></a>

### Templating API: user-data specific helpers~all\_user\_reportable\_attributes(options) ⇒
Entails the list of reportable attributes which have been enabled. Given the
cluster is enabled as well. The helper retrieves the reportable attributes
per endpoint per cluster.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Reportable attributes  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_generated_commands"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_generated\_commands(options) ⇒
All available cluster commands across all endpoints and clusters.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: All available cluster commands across all endpoints and clusters  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_clusters_with_incoming_or_outgoing_commands"></a>

### Templating API: user-data specific helpers~all\_user\_clusters\_with\_incoming\_or\_outgoing\_commands(options, is_incoming) ⇒
Util function for all clusters with side that have available incoming or
outgiong commands across all endpoints.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: All clusters with side that have available incoming or outgiong
commands across all endpoints.  

| Param | Description |
| --- | --- |
| options |  |
| is_incoming | boolean to check if commands are incoming or outgoing |

<a name="module_Templating API_ user-data specific helpers..all_user_clusters_with_incoming_commands"></a>

### Templating API: user-data specific helpers~all\_user\_clusters\_with\_incoming\_commands(options) ⇒
All clusters with side that have available incoming commands

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: All clusters with side that have available incoming commands across
all endpoints.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_clusters_with_outgoing_commands"></a>

### Templating API: user-data specific helpers~all\_user\_clusters\_with\_outgoing\_commands(options) ⇒
All clusters with side that have available outgoing commands

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: All clusters with side that have available outgoing commands across
all endpoints.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..manufacturing_clusters_with_incoming_commands"></a>

### Templating API: user-data specific helpers~manufacturing\_clusters\_with\_incoming\_commands(clusterCode, options) ⇒
Provide all manufacturing specific clusters that have incoming commands with
the given cluster code.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Details of manufacturing specific clusters that have incoming
commands with the given cluster code  

| Param |
| --- |
| clusterCode | 
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_clusters_with_incoming_commands_combined"></a>

### Templating API: user-data specific helpers~all\_user\_clusters\_with\_incoming\_commands\_combined(options) ⇒
All clusters that have available incoming commands.
If there is a client and server enabled on the endpoint, this combines them
into a single entry.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: All clusters that have available incoming commands across
all endpoints.  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_incoming_commands_for_cluster_combined"></a>

### Templating API: user-data specific helpers~all\_incoming\_commands\_for\_cluster\_combined(clusterName, clientSide, serverSide, options) ⇒
All commands that need to be parsed for a given cluster. This takes in booleans
for if the client and or server are included.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: all commands that need to be parsed for a given cluster  

| Param |
| --- |
| clusterName | 
| clientSide | 
| serverSide | 
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_incoming_commands_for_all_clusters"></a>

### Templating API: user-data specific helpers~all\_user\_incoming\_commands\_for\_all\_clusters(options) ⇒
Get all incoming commands in the user configuration.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: all incoming commands enabled by the user.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_incoming_or_outgoing_commands_for_cluster"></a>

### Templating API: user-data specific helpers~all\_incoming\_or\_outgoing\_commands\_for\_cluster(clusterName, clusterSide, isIncoming, options) ⇒
A util function for all incoming or outgoing commands that need to be parsed
for a given cluster

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: All incoming or outgoing commands that need to be parsed for a given
 cluster  

| Param |
| --- |
| clusterName | 
| clusterSide | 
| isIncoming | 
| options | 

<a name="module_Templating API_ user-data specific helpers..all_incoming_commands_for_cluster"></a>

### Templating API: user-data specific helpers~all\_incoming\_commands\_for\_cluster(clusterName, options) ⇒
All incoming commands that need to be parsed for a given cluster

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: all incoming commands that need to be parsed for a given cluster  

| Param |
| --- |
| clusterName | 
| options | 

<a name="module_Templating API_ user-data specific helpers..all_outgoing_commands_for_cluster"></a>

### Templating API: user-data specific helpers~all\_outgoing\_commands\_for\_cluster(clusterName, options) ⇒
All outgoing commands that need to be parsed for a given cluster

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: all outgoing commands that need to be parsed for a given cluster  

| Param |
| --- |
| clusterName | 
| options | 

<a name="module_Templating API_ user-data specific helpers..generated_clustes_details"></a>

### Templating API: user-data specific helpers~generated\_clustes\_details(options) ⇒
Entails the Cluster details per endpoint

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Cluster Details per endpoint with attribute summaries within the clusters  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..generated_endpoint_type_details"></a>

### Templating API: user-data specific helpers~generated\_endpoint\_type\_details(options) ⇒
Entails Endpoint type details along with their cluster summaries

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Endpoint type details along with their cluster summaries  

| Param |
| --- |
| options | 

<a name="module_Templating API_ user-data specific helpers..all_user_cluster_attributes_min_max_defaults"></a>

### Templating API: user-data specific helpers~all\_user\_cluster\_attributes\_min\_max\_defaults(name, side, options) ⇒
Returns attributes inside an endpoint type that either have a default or a
bounded attribute.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: endpoints with bounds or defaults  

| Param |
| --- |
| name | 
| side | 
| options | 

<a name="module_Templating API_ user-data specific helpers..checkAttributeMatch"></a>

### Templating API: user-data specific helpers~checkAttributeMatch(clusterName, attributeName, attributeSide, attributeValue, attributeValueType, endpointAttributes) ⇒
**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: arrayIndex  

| Param |
| --- |
| clusterName | 
| attributeName | 
| attributeSide | 
| attributeValue | 
| attributeValueType | 
| endpointAttributes | 

<a name="module_Templating API_ user-data specific helpers..generated_defaults_index"></a>

### Templating API: user-data specific helpers~generated\_defaults\_index(clusterName, attributeName, attributeValueType, attributeValue, prefixReturn, postFixReturn) ⇒
Extracts the index of generated defaults array which come from
all_user_cluster_attributes_for_generated_defaults

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: index of the generated default array  

| Param |
| --- |
| clusterName | 
| attributeName | 
| attributeValueType | 
| attributeValue | 
| prefixReturn | 
| postFixReturn | 

<a name="module_Templating API_ user-data specific helpers..generated_default_index"></a>

### Templating API: user-data specific helpers~generated\_default\_index(clusterName, attributeName, attributeSide, attributeValueType, attributeValue, prefixReturn, postFixReturn) ⇒
Extracts the index of generated defaults array which come from
all_user_cluster_attributes_for_generated_defaults

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: deafult value's index in the generated default array  

| Param |
| --- |
| clusterName | 
| attributeName | 
| attributeSide | 
| attributeValueType | 
| attributeValue | 
| prefixReturn | 
| postFixReturn | 

<a name="module_Templating API_ user-data specific helpers..generated_attributes_min_max_index"></a>

### Templating API: user-data specific helpers~generated\_attributes\_min\_max\_index(name, side, options) ⇒
Extracts the index of generated min max defaults array which come from
all_user_cluster_attributes_min_max_defaults

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: index of the generated min max default array  

| Param |
| --- |
| name | 
| side | 
| options | 

<a name="module_Templating API_ user-data specific helpers..generated_attribute_min_max_index"></a>

### Templating API: user-data specific helpers~generated\_attribute\_min\_max\_index(clusterName, attributeName, attributeSide, options) ⇒
Extracts the index of generated min max defaults array which come from
all_user_cluster_attributes_min_max_defaults

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: index of the generated min max default in the array  

| Param |
| --- |
| clusterName | 
| attributeName | 
| attributeSide | 
| options | 

<a name="module_Templating API_ user-data specific helpers..if_enabled_clusters"></a>

### Templating API: user-data specific helpers~if\_enabled\_clusters(options) ⇒
If helper that checks if there are clusters enabled
Available options:
- side: side="client/server" can be used to check if there are client or
server side clusters are available

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..if_multi_protocol_attributes_enabled"></a>

### Templating API: user-data specific helpers~if\_multi\_protocol\_attributes\_enabled(options) ⇒
Check if multi-protocol is enabled for the application.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: boolean based on existence of attribute-attribute associations.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ user-data specific helpers..all_multi_protocol_attributes"></a>

### Templating API: user-data specific helpers~all\_multi\_protocol\_attributes(options) ⇒
Retrieve all the attribute-attribute associations for the current session.

**Kind**: inner method of [<code>Templating API: user-data specific helpers</code>](#module_Templating API_ user-data specific helpers)  
**Returns**: attribute-attribute mapping entries  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ Token helpers"></a>

## Templating API: Token helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Token helpers](#module_Templating API_ Token helpers)
    * [~token_cluster_create(config)](#module_Templating API_ Token helpers..token_cluster_create) ⇒
    * [~tokens_context()](#module_Templating API_ Token helpers..tokens_context)
    * [~token_next()](#module_Templating API_ Token helpers..token_next)
    * [~debug_object(obj)](#module_Templating API_ Token helpers..debug_object) ⇒
    * [~token_attribute_util(context, options)](#module_Templating API_ Token helpers..token_attribute_util) ⇒
    * [~token_attributes(endpointTypeRef, options)](#module_Templating API_ Token helpers..token_attributes) ⇒
    * [~token_attribute_clusters(endpointTypeRef, options)](#module_Templating API_ Token helpers..token_attribute_clusters) ⇒
    * [~token_attribute_endpoints(options)](#module_Templating API_ Token helpers..token_attribute_endpoints) ⇒

<a name="module_Templating API_ Token helpers..token_cluster_create"></a>

### Templating API: Token helpers~token\_cluster\_create(config) ⇒
Get a transformed config object.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
**Returns**: object  

| Param | Type |
| --- | --- |
| config | <code>\*</code> | 

<a name="module_Templating API_ Token helpers..tokens_context"></a>

### Templating API: Token helpers~tokens\_context()
This function builds creates a new context from the endpoint_config structure
  for use in the zap-tokens.h template. The endpoint_config context provides a
  list of endpoints, and endpointTypes, where each endpointType contains a list
  of clusters, and each cluster contains a list of attributes. However, the
  tokens template requires a list of attributes per endpoint, and per cluster,
  discriminating from singletons and non-singletons, so this function performs
  the required grouping.

  While each attribute contains an isSingleton attribute, the database schema
  allows for the same attribute to be returned both as singleton and non-singleton
  in different clusters, for different endpoints. In consequence, care must be
  taken to remove the singletons from the cluster and endpoint attribute lists.
  This is done in two steps, the first loop creates a global (context) list of
  singletons and non-singletons, and the second loop removes the singletons from
  the endpoint, and clusters.

  Clusters from different endpoints may have different attributes, therefore each
  endpoint keeps a separate list of clusters. Additionally, a context-level
  map of clusters is required in order to gather all attributes (singletons and
  non-singletons) from all endpoint clusters.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
<a name="module_Templating API_ Token helpers..token_next"></a>

### Templating API: Token helpers~token\_next()
The token template assigns an unique ID to each unique attribute. These IDs
  span all attributes from all clusters from all endpointTypes. This helper
  function allows the template to increment the token ID within the tokens context.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
<a name="module_Templating API_ Token helpers..debug_object"></a>

### Templating API: Token helpers~debug\_object(obj) ⇒
Get JSON stringified value of the obj.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
**Returns**: JSON string  

| Param | Type |
| --- | --- |
| obj | <code>\*</code> | 

<a name="module_Templating API_ Token helpers..token_attribute_util"></a>

### Templating API: Token helpers~token\_attribute\_util(context, options) ⇒
Util function that extracts all the token attribute information.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
**Returns**: Information on all token attributes in the configuration.  

| Param | Type |
| --- | --- |
| context | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Token helpers..token_attributes"></a>

### Templating API: Token helpers~token\_attributes(endpointTypeRef, options) ⇒
Get information about all the token attributes in the configuration or this
helper can be used within an endpoint block helper to fetch the
corresponding token attributes based on endpoint type given.
Available Options:
isSingleton: 0/1, option can be used to filter attributes based on singleton
or non-singleton(Available with endpointTypeRef only)

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
**Returns**: singleton and non-singleton token attributes along with their
endpoint information. Singleton attributes are only returned once whereas
non-singleton attributes are returned per endpoint. However if used within
an endpoint block helper it returns token_attributes for a given endpoint
type.  

| Param | Type |
| --- | --- |
| endpointTypeRef | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Token helpers..token_attribute_clusters"></a>

### Templating API: Token helpers~token\_attribute\_clusters(endpointTypeRef, options) ⇒
This helper can return all token associated clusters across endpoints or
this helper can be used within an endpoint block helper to fetch the
corresponding token associated clusters.
Available Options:
isSingleton: 0/1, option can be used to filter clusters based on singleton
or non-singleton attributes.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
**Returns**: Token associated clusters for a particular endpoint type or all
token associated clusters across endpoints.  

| Param | Type |
| --- | --- |
| endpointTypeRef | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Token helpers..token_attribute_endpoints"></a>

### Templating API: Token helpers~token\_attribute\_endpoints(options) ⇒
Get all endpoints which have token attributes in the configuration.
AvailableOptions:
- isSingleton: 0/1, option can be used to filter endpoints based on singleton
or non-singleton.

**Kind**: inner method of [<code>Templating API: Token helpers</code>](#module_Templating API_ Token helpers)  
**Returns**: all endpoints with token attributes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers"></a>

## Templating API: toplevel utility helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: toplevel utility helpers](#module_Templating API_ toplevel utility helpers)
    * [~zap_header()](#module_Templating API_ toplevel utility helpers..zap_header) ⇒
    * [~ident()](#module_Templating API_ toplevel utility helpers..ident) ⇒
    * [~new_line(cnt)](#module_Templating API_ toplevel utility helpers..new_line) ⇒
    * [~backslash()](#module_Templating API_ toplevel utility helpers..backslash) ⇒
    * [~template_options(category, options)](#module_Templating API_ toplevel utility helpers..template_options)
    * [~first(options)](#module_Templating API_ toplevel utility helpers..first) ⇒
    * [~not_first(options)](#module_Templating API_ toplevel utility helpers..not_first) ⇒
    * [~last(options)](#module_Templating API_ toplevel utility helpers..last) ⇒
    * [~not_last(optionms)](#module_Templating API_ toplevel utility helpers..not_last) ⇒
    * [~middle(options)](#module_Templating API_ toplevel utility helpers..middle) ⇒
    * [~template_option_with_code(options, key)](#module_Templating API_ toplevel utility helpers..template_option_with_code)
    * [~fail(options)](#module_Templating API_ toplevel utility helpers..fail)
    * [~isEqual(string_a, string_b)](#module_Templating API_ toplevel utility helpers..isEqual)
    * [~is_lowercase_equal(string_a, string_b)](#module_Templating API_ toplevel utility helpers..is_lowercase_equal)
    * [~toggle(condition, trueResult, falseResult)](#module_Templating API_ toplevel utility helpers..toggle) ⇒
    * [~trim_string(str)](#module_Templating API_ toplevel utility helpers..trim_string) ⇒
    * [~asLastWord(str)](#module_Templating API_ toplevel utility helpers..asLastWord)
    * [~iterate()](#module_Templating API_ toplevel utility helpers..iterate)
    * [~addToAccumulator(accumulator, value)](#module_Templating API_ toplevel utility helpers..addToAccumulator)
    * [~iterateAccumulator(options)](#module_Templating API_ toplevel utility helpers..iterateAccumulator) ⇒
    * [~waitForSynchronousPromise(pollInterval, promise, resolve, reject)](#module_Templating API_ toplevel utility helpers..waitForSynchronousPromise)
    * [~promiseToResolveAllPreviousPromises(globalPromises)](#module_Templating API_ toplevel utility helpers..promiseToResolveAllPreviousPromises)
    * [~after(options)](#module_Templating API_ toplevel utility helpers..after) ⇒
    * [~concatenate()](#module_Templating API_ toplevel utility helpers..concatenate)
    * [~is_num_equal(numA, numB)](#module_Templating API_ toplevel utility helpers..is_num_equal) ⇒
    * [~is_defined(value)](#module_Templating API_ toplevel utility helpers..is_defined) ⇒
    * [~replace_string(mainString, replaceString, replaceWithString)](#module_Templating API_ toplevel utility helpers..replace_string) ⇒
    * [~add_prefix_to_all_strings(str, prefixStr)](#module_Templating API_ toplevel utility helpers..add_prefix_to_all_strings) ⇒
    * [~multiply()](#module_Templating API_ toplevel utility helpers..multiply) ⇒
    * [~is_power_of_two(val)](#module_Templating API_ toplevel utility helpers..is_power_of_two) ⇒
    * [~is_string_underscored(val)](#module_Templating API_ toplevel utility helpers..is_string_underscored) ⇒
    * [~as_uppercase(val)](#module_Templating API_ toplevel utility helpers..as_uppercase) ⇒

<a name="module_Templating API_ toplevel utility helpers..zap_header"></a>

### Templating API: toplevel utility helpers~zap\_header() ⇒
Produces the top-of-the-file header for a C file.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: The header content  
<a name="module_Templating API_ toplevel utility helpers..ident"></a>

### Templating API: toplevel utility helpers~ident() ⇒
Simple helper that produces an approved size of identation.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: whitespace that is the identation.  
<a name="module_Templating API_ toplevel utility helpers..new_line"></a>

### Templating API: toplevel utility helpers~new\_line(cnt) ⇒
Return new lines based on the given cnt parameter.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: new line  

| Param | Type |
| --- | --- |
| cnt | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..backslash"></a>

### Templating API: toplevel utility helpers~backslash() ⇒
return back slash

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: string  
<a name="module_Templating API_ toplevel utility helpers..template_options"></a>

### Templating API: toplevel utility helpers~template\_options(category, options)
Block helper that iterates over the package options of a given category.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| category | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..first"></a>

### Templating API: toplevel utility helpers~first(options) ⇒
Inside an iterator, this helper allows you to specify the content that will be output only
during the first element.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: content, if it's the first element inside an operator, empty otherwise.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..not_first"></a>

### Templating API: toplevel utility helpers~not\_first(options) ⇒
Inside an iterator, this helper allows you to specify the content that will be output only
if the element is not the first element.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: content, if it's the first element inside an operator, empty otherwise.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..last"></a>

### Templating API: toplevel utility helpers~last(options) ⇒
Inside an iterator, this helper allows you to specify the content that will be output only
during the last element.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: content, if it's the last element inside an operator, empty otherwise.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..not_last"></a>

### Templating API: toplevel utility helpers~not\_last(optionms) ⇒
Inside an iterator. the block is output only if this is NOT the last item.
Useful for wrapping commas in the list of arguments and such.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: content, if it's not the last element inside a block, empty otherwise.  

| Param | Type |
| --- | --- |
| optionms | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..middle"></a>

### Templating API: toplevel utility helpers~middle(options) ⇒
Inside an iterator, this helper allows you to specify the content that will be output only
during the non-first and no-last element.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: content, if it's the middle element inside an operator, empty otherwise.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..template_option_with_code"></a>

### Templating API: toplevel utility helpers~template\_option\_with\_code(options, key)
This fetches a promise which returns template options if provided

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 
| key | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..fail"></a>

### Templating API: toplevel utility helpers~fail(options)
Forced fail halper.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..isEqual"></a>

### Templating API: toplevel utility helpers~isEqual(string_a, string_b)
This returns a boolean if the 2 strings are same

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| string_a | <code>\*</code> | 
| string_b | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..is_lowercase_equal"></a>

### Templating API: toplevel utility helpers~is\_lowercase\_equal(string_a, string_b)
This returns a boolean based on the 2 strings being equal or not given that both

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| string_a | <code>\*</code> | 
| string_b | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..toggle"></a>

### Templating API: toplevel utility helpers~toggle(condition, trueResult, falseResult) ⇒
Return true/false result based on condition.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| condition | <code>\*</code> | 
| trueResult | <code>\*</code> | 
| falseResult | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..trim_string"></a>

### Templating API: toplevel utility helpers~trim\_string(str) ⇒
Remove leading and trailing spaces from a string

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: A string with no leading and trailing spaces  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..asLastWord"></a>

### Templating API: toplevel utility helpers~asLastWord(str)
Split the string based on spaces and return the last word

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| str | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..iterate"></a>

### Templating API: toplevel utility helpers~iterate()
Iteration block.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
<a name="module_Templating API_ toplevel utility helpers..addToAccumulator"></a>

### Templating API: toplevel utility helpers~addToAccumulator(accumulator, value)
Add to accumulator results.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| accumulator | <code>\*</code> | 
| value | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..iterateAccumulator"></a>

### Templating API: toplevel utility helpers~iterateAccumulator(options) ⇒
Get accumulated information from templates.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: accumulated details  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..waitForSynchronousPromise"></a>

### Templating API: toplevel utility helpers~waitForSynchronousPromise(pollInterval, promise, resolve, reject)
Waits for promise to be resolved synchronously.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| pollInterval | <code>\*</code> | 
| promise | <code>\*</code> | 
| resolve | <code>\*</code> | 
| reject | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..promiseToResolveAllPreviousPromises"></a>

### Templating API: toplevel utility helpers~promiseToResolveAllPreviousPromises(globalPromises)
Resolves all the given globalPromises promises.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  

| Param | Type |
| --- | --- |
| globalPromises | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..after"></a>

### Templating API: toplevel utility helpers~after(options) ⇒
Resolve the after promise after all other promises in the global context
have been resolved.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: Content after all other content has been resolved.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..concatenate"></a>

### Templating API: toplevel utility helpers~concatenate()
Given: A list of strings
Returns a concatenated string with spaces between each string

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
<a name="module_Templating API_ toplevel utility helpers..is_num_equal"></a>

### Templating API: toplevel utility helpers~is\_num\_equal(numA, numB) ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: true if both numbers are equal else returns false  

| Param |
| --- |
| numA | 
| numB | 

<a name="module_Templating API_ toplevel utility helpers..is_defined"></a>

### Templating API: toplevel utility helpers~is\_defined(value) ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: true or false based on whether the value is undefined or not  

| Param |
| --- |
| value | 

<a name="module_Templating API_ toplevel utility helpers..replace_string"></a>

### Templating API: toplevel utility helpers~replace\_string(mainString, replaceString, replaceWithString) ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: A string replaced with another string in the mainString  

| Param |
| --- |
| mainString | 
| replaceString | 
| replaceWithString | 

<a name="module_Templating API_ toplevel utility helpers..add_prefix_to_all_strings"></a>

### Templating API: toplevel utility helpers~add\_prefix\_to\_all\_strings(str, prefixStr) ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: A resultant string with all string values prefixed with prefixStr  

| Param |
| --- |
| str | 
| prefixStr | 

<a name="module_Templating API_ toplevel utility helpers..multiply"></a>

### Templating API: toplevel utility helpers~multiply() ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: A number which is result of multiplying all the arguments given  
<a name="module_Templating API_ toplevel utility helpers..is_power_of_two"></a>

### Templating API: toplevel utility helpers~is\_power\_of\_two(val) ⇒
Returns a boolean based on whether a given value is a power or 2 or not.

**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| val | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..is_string_underscored"></a>

### Templating API: toplevel utility helpers~is\_string\_underscored(val) ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: true if a string has an underscore in it  

| Param | Type |
| --- | --- |
| val | <code>\*</code> | 

<a name="module_Templating API_ toplevel utility helpers..as_uppercase"></a>

### Templating API: toplevel utility helpers~as\_uppercase(val) ⇒
**Kind**: inner method of [<code>Templating API: toplevel utility helpers</code>](#module_Templating API_ toplevel utility helpers)  
**Returns**: val in uppercase  

| Param | Type |
| --- | --- |
| val | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers"></a>

## Templating API: static zcl helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: static zcl helpers](#module_Templating API_ static zcl helpers)
    * [~zcl_bitmaps(options)](#module_Templating API_ static zcl helpers..zcl_bitmaps) ⇒
    * [~zcl_bitmap_items(options)](#module_Templating API_ static zcl helpers..zcl_bitmap_items)
    * [~zcl_enums(options)](#module_Templating API_ static zcl helpers..zcl_enums) ⇒
    * [~zcl_structs(options)](#module_Templating API_ static zcl helpers..zcl_structs) ⇒
    * [~zcl_enum_items(options)](#module_Templating API_ static zcl helpers..zcl_enum_items)
    * [~first_unused_enum_value(options)](#module_Templating API_ static zcl helpers..first_unused_enum_value) ⇒
    * [~zcl_struct_items(options)](#module_Templating API_ static zcl helpers..zcl_struct_items) ⇒
    * [~zcl_struct_items_by_struct_name(name, options)](#module_Templating API_ static zcl helpers..zcl_struct_items_by_struct_name) ⇒
    * [~zcl_struct_items_by_struct_and_cluster_name(name, clusterName, options)](#module_Templating API_ static zcl helpers..zcl_struct_items_by_struct_and_cluster_name) ⇒
    * [~zcl_device_types(options)](#module_Templating API_ static zcl helpers..zcl_device_types) ⇒
    * [~zcl_device_type_clusters(options)](#module_Templating API_ static zcl helpers..zcl_device_type_clusters) ⇒
    * [~zcl_device_type_cluster_commands(options)](#module_Templating API_ static zcl helpers..zcl_device_type_cluster_commands) ⇒
    * [~zcl_device_type_cluster_attributes(options)](#module_Templating API_ static zcl helpers..zcl_device_type_cluster_attributes) ⇒
    * [~zcl_clusters(options)](#module_Templating API_ static zcl helpers..zcl_clusters) ⇒
    * [~zcl_commands(options)](#module_Templating API_ static zcl helpers..zcl_commands) ⇒
    * [~zcl_command_responses(options)](#module_Templating API_ static zcl helpers..zcl_command_responses) ⇒
    * [~zcl_commands_with_cluster_info(options)](#module_Templating API_ static zcl helpers..zcl_commands_with_cluster_info) ⇒
    * [~zcl_commands_with_arguments(options)](#module_Templating API_ static zcl helpers..zcl_commands_with_arguments)
    * [~zcl_commands_source_client(options)](#module_Templating API_ static zcl helpers..zcl_commands_source_client) ⇒
    * [~zcl_commands_source_server(options)](#module_Templating API_ static zcl helpers..zcl_commands_source_server) ⇒
    * [~zcl_events(options)](#module_Templating API_ static zcl helpers..zcl_events) ⇒
    * [~zcl_command_tree(options)](#module_Templating API_ static zcl helpers..zcl_command_tree) ⇒
    * [~zcl_global_commands(options)](#module_Templating API_ static zcl helpers..zcl_global_commands) ⇒
    * [~zcl_attributes(options)](#module_Templating API_ static zcl helpers..zcl_attributes) ⇒
    * [~zcl_attributes_client(options)](#module_Templating API_ static zcl helpers..zcl_attributes_client) ⇒
    * [~zcl_attributes_server(options)](#module_Templating API_ static zcl helpers..zcl_attributes_server) ⇒
    * [~zcl_atomics(options)](#module_Templating API_ static zcl helpers..zcl_atomics) ⇒
    * [~zcl_cluster_largest_label_length()](#module_Templating API_ static zcl helpers..zcl_cluster_largest_label_length) ⇒
    * [~largestLabelLength(An)](#module_Templating API_ static zcl helpers..largestLabelLength) ⇒
    * [~zcl_command_arguments_count(commandId)](#module_Templating API_ static zcl helpers..zcl_command_arguments_count) ⇒
    * [~ifCommandArgumentsHaveFixedLengthWithCurrentContext(commandId, fixedLengthReturn, notFixedLengthReturn, currentContext)](#module_Templating API_ static zcl helpers..ifCommandArgumentsHaveFixedLengthWithCurrentContext)
    * [~if_command_arguments_have_fixed_length(commandId, fixedLengthReturn, notFixedLengthReturn)](#module_Templating API_ static zcl helpers..if_command_arguments_have_fixed_length)
    * [~as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present(type, command, commandArg, appendString, options)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present) ⇒
    * [~as_underlying_zcl_type_if_command_is_not_fixed_length(type, commandId, appendString, options)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_if_command_is_not_fixed_length)
    * [~command_arguments_total_length(commandId)](#module_Templating API_ static zcl helpers..command_arguments_total_length)
    * [~zcl_command_arguments(options)](#module_Templating API_ static zcl helpers..zcl_command_arguments) ⇒
    * [~zcl_event_fields(options)](#module_Templating API_ static zcl helpers..zcl_event_fields)
    * [~zcl_command_argument_data_type(typeName, options)](#module_Templating API_ static zcl helpers..zcl_command_argument_data_type)
    * [~asUnderlyingZclType(typeName, options)](#module_Templating API_ static zcl helpers..asUnderlyingZclType)
    * [~zcl_string_type_return(type, options)](#module_Templating API_ static zcl helpers..zcl_string_type_return)
    * [~is_zcl_string(type)](#module_Templating API_ static zcl helpers..is_zcl_string)
    * [~if_is_number(type)](#module_Templating API_ static zcl helpers..if_is_number) ⇒
    * [~if_is_string(type)](#module_Templating API_ static zcl helpers..if_is_string) ⇒
    * [~if_is_char_string(type)](#module_Templating API_ static zcl helpers..if_is_char_string) ⇒
    * [~if_is_octet_string(type)](#module_Templating API_ static zcl helpers..if_is_octet_string) ⇒
    * [~if_is_short_string(type)](#module_Templating API_ static zcl helpers..if_is_short_string) ⇒
    * [~if_is_long_string(type)](#module_Templating API_ static zcl helpers..if_is_long_string) ⇒
    * [~if_is_atomic(type:)](#module_Templating API_ static zcl helpers..if_is_atomic) ⇒
    * [~if_is_bitmap(type)](#module_Templating API_ static zcl helpers..if_is_bitmap) ⇒
    * [~if_is_enum(type)](#module_Templating API_ static zcl helpers..if_is_enum) ⇒
    * [~if_is_struct(type)](#module_Templating API_ static zcl helpers..if_is_struct) ⇒
    * [~isClient(side)](#module_Templating API_ static zcl helpers..isClient) ⇒
    * [~isServer(side)](#module_Templating API_ static zcl helpers..isServer) ⇒
    * [~isStrEqual(str1, str2)](#module_Templating API_ static zcl helpers..isStrEqual) ⇒
    * [~isLastElement(index, count)](#module_Templating API_ static zcl helpers..isLastElement) ⇒
    * [~isFirstElement(index, count)](#module_Templating API_ static zcl helpers..isFirstElement) ⇒
    * [~isEnabled(enable)](#module_Templating API_ static zcl helpers..isEnabled) ⇒
    * [~isCommandAvailable(clusterSide, incoming, outgoing, source, name)](#module_Templating API_ static zcl helpers..isCommandAvailable) ⇒
    * [~as_underlying_zcl_type_command_argument_always_present(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_always_present) ⇒
    * [~if_command_argument_always_present(commandId, introducedInRef, removedInRef, presentIf, argumentPresentReturn, argumentNotPresentReturn)](#module_Templating API_ static zcl helpers..if_command_argument_always_present) ⇒
    * [~as_underlying_zcl_type_command_argument_not_always_present_no_presentif(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_not_always_present_no_presentif) ⇒
    * [~as_underlying_zcl_type_ca_not_always_present_no_presentif(commandArg, appendString, options)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_ca_not_always_present_no_presentif) ⇒
    * [~if_command_argument_not_always_present_no_presentif(commandId, introducedInRef, removedInRef, presentIf, argumentNotInAllVersionsReturn, argumentInAllVersionsReturn)](#module_Templating API_ static zcl helpers..if_command_argument_not_always_present_no_presentif) ⇒
    * [~as_underlying_zcl_type_command_argument_not_always_present_with_presentif(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_not_always_present_with_presentif) ⇒
    * [~as_underlying_zcl_type_ca_not_always_present_with_presentif(commandArg, appendString, options)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_ca_not_always_present_with_presentif) ⇒
    * [~if_command_argument_not_always_present_with_presentif(commandId, introducedInRef, removedInRef, presentIf, argumentNotInAllVersionsPresentIfReturn, argumentInAllVersionsReturn)](#module_Templating API_ static zcl helpers..if_command_argument_not_always_present_with_presentif) ⇒
    * [~as_underlying_zcl_type_command_argument_always_present_with_presentif(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_always_present_with_presentif) ⇒
    * [~as_underlying_zcl_type_ca_always_present_with_presentif(commandArg, appendString, options)](#module_Templating API_ static zcl helpers..as_underlying_zcl_type_ca_always_present_with_presentif) ⇒
    * [~if_command_argument_always_present_with_presentif(commandId, introducedInRef, removedInRef, presentIf, argumentNotInAllVersionsPresentIfReturn, argumentInAllVersionsReturn)](#module_Templating API_ static zcl helpers..if_command_argument_always_present_with_presentif) ⇒
    * [~if_manufacturing_specific_cluster(clusterId, manufacturer_specific_return, null_manufacturer_specific_return)](#module_Templating API_ static zcl helpers..if_manufacturing_specific_cluster) ⇒
    * [~if_mfg_specific_cluster(clusterId, options)](#module_Templating API_ static zcl helpers..if_mfg_specific_cluster) ⇒
    * [~as_generated_default_macro(value, attributeSize, options)](#module_Templating API_ static zcl helpers..as_generated_default_macro) ⇒
    * [~attribute_mask(writable, storageOption, minMax, mfgSpecific, clusterCode, client, isSingleton, prefixString, postfixString)](#module_Templating API_ static zcl helpers..attribute_mask) ⇒
    * [~command_mask(commmandSource, clusterSide, isIncomingEnabled, isOutgoingEnabled, manufacturingCode, prefixForMask)](#module_Templating API_ static zcl helpers..command_mask) ⇒
    * [~command_mask_sub_helper(commandMask, str)](#module_Templating API_ static zcl helpers..command_mask_sub_helper) ⇒
    * [~format_zcl_string_as_characters_for_generated_defaults(stringVal, sizeOfString)](#module_Templating API_ static zcl helpers..format_zcl_string_as_characters_for_generated_defaults) ⇒
    * [~as_type_min_value(type, options)](#module_Templating API_ static zcl helpers..as_type_min_value) ⇒
    * [~as_type_max_value(type, options)](#module_Templating API_ static zcl helpers..as_type_max_value) ⇒
    * [~structs_with_clusters(options)](#module_Templating API_ static zcl helpers..structs_with_clusters)
    * [~as_zcl_type_size(type, options)](#module_Templating API_ static zcl helpers..as_zcl_type_size) ⇒
    * [~if_compare(leftValue, rightValue, options)](#module_Templating API_ static zcl helpers..if_compare) ⇒ <code>Object</code>
    * [~if_is_data_type_signed(type, clusterId, options)](#module_Templating API_ static zcl helpers..if_is_data_type_signed) ⇒
    * [~as_zcl_data_type_size(type, clusterId, options)](#module_Templating API_ static zcl helpers..as_zcl_data_type_size) ⇒

<a name="module_Templating API_ static zcl helpers..zcl_bitmaps"></a>

### Templating API: static zcl helpers~zcl\_bitmaps(options) ⇒
Block helper iterating over all bitmaps.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_bitmap_items"></a>

### Templating API: static zcl helpers~zcl\_bitmap\_items(options)
Iterates over enum items. Valid only inside zcl_enums.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_enums"></a>

### Templating API: static zcl helpers~zcl\_enums(options) ⇒
Block helper iterating over all enums.
If existing independently, it iterates over ALL the enums.
Within a context of a cluster, it iterates only over the
enums belonging to a cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_structs"></a>

### Templating API: static zcl helpers~zcl\_structs(options) ⇒
Block helper iterating over all structs.
If existing independently, it iterates over ALL the structs.
Within a context of a cluster, it iterates only over the
structs belonging to a cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_enum_items"></a>

### Templating API: static zcl helpers~zcl\_enum\_items(options)
Iterates over enum items. Valid only inside zcl_enums.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..first_unused_enum_value"></a>

### Templating API: static zcl helpers~first\_unused\_enum\_value(options) ⇒
This helper prints out the first unused enum value.
It supports mode="next_larger" and
mode="first_unused" (which is the default).

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: the unused enum value  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_struct_items"></a>

### Templating API: static zcl helpers~zcl\_struct\_items(options) ⇒
Block helper iterating over all struct items. Valid only inside zcl_structs.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_struct_items_by_struct_name"></a>

### Templating API: static zcl helpers~zcl\_struct\_items\_by\_struct\_name(name, options) ⇒
Block helper iterating over all struct items given the struct name.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param |
| --- |
| name | 
| options | 

<a name="module_Templating API_ static zcl helpers..zcl_struct_items_by_struct_and_cluster_name"></a>

### Templating API: static zcl helpers~zcl\_struct\_items\_by\_struct\_and\_cluster\_name(name, clusterName, options) ⇒
Block helper iterating over all struct items given the struct name and
cluster name.  The items iterated will be those that correspond to that
struct name being used within the given cluster.  That means the struct name
must be either a global struct (in which case the cluster name is just
ignored), or a struct associated with the given cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param |
| --- |
| name | 
| clusterName | 
| options | 

<a name="module_Templating API_ static zcl helpers..zcl_device_types"></a>

### Templating API: static zcl helpers~zcl\_device\_types(options) ⇒
Block helper iterating over all deviceTypes.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_device_type_clusters"></a>

### Templating API: static zcl helpers~zcl\_device\_type\_clusters(options) ⇒
Block helper for use inside zcl_device_types

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: blocks for clusters  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_device_type_cluster_commands"></a>

### Templating API: static zcl helpers~zcl\_device\_type\_cluster\_commands(options) ⇒
Block helper for use inside zcl_device_type_clusters

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: blocks for commands  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_device_type_cluster_attributes"></a>

### Templating API: static zcl helpers~zcl\_device\_type\_cluster\_attributes(options) ⇒
Block helper for use inside zcl_device_type_clusters

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: blocks for attributes  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_clusters"></a>

### Templating API: static zcl helpers~zcl\_clusters(options) ⇒
Block helper iterating over all clusters.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_commands"></a>

### Templating API: static zcl helpers~zcl\_commands(options) ⇒
Block helper iterating over all commands.
There are two modes of this helper:
  when used in a global context, it iterates over ALL commands in the database.
  when used inside a `zcl_cluster` block helper, it iterates only over the commands for that cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_command_responses"></a>

### Templating API: static zcl helpers~zcl\_command\_responses(options) ⇒
Returns all commands which are command responses.
For eg, If the xml has the following:
<command source="client" code="0x00" name="newCmd" response="newCmdResponse">
then newCmdResponse will be included in the list of commands returned here.

There are two modes of this helper:
- when used in a global context, it iterates over ALL command responses in
the database.
- when used inside a `zcl_cluster` block helper, it iterates only over the
commands responses for that cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: all command responses  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_commands_with_cluster_info"></a>

### Templating API: static zcl helpers~zcl\_commands\_with\_cluster\_info(options) ⇒
Block helper iterating over all commands with cluster information.
Note: Similar to zcl_commands but has cluster information as well.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_commands_with_arguments"></a>

### Templating API: static zcl helpers~zcl\_commands\_with\_arguments(options)
Helper that retrieves all commands that contain arguments.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_commands_source_client"></a>

### Templating API: static zcl helpers~zcl\_commands\_source\_client(options) ⇒
Block helper iterating over all client commands.
There are two modes of this helper:
  when used in a global context, it iterates over ALL client commands in the database.
  when used inside a `zcl_cluster` block helper, it iterates only over the commands for that client cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_commands_source_server"></a>

### Templating API: static zcl helpers~zcl\_commands\_source\_server(options) ⇒
Block helper iterating over all server commands.
There are two modes of this helper:
  when used in a global context, it iterates over ALL server commands in the database.
  when used inside a `zcl_cluster` block helper, it iterates only over the commands for that server cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_events"></a>

### Templating API: static zcl helpers~zcl\_events(options) ⇒
Block helper iterating over all events.
There are two modes of this helper:
  when used in a global context, it iterates over ALL events in the database.
  when used inside a `zcl_cluster` block helper, it iterates only over the events for that cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_command_tree"></a>

### Templating API: static zcl helpers~zcl\_command\_tree(options) ⇒
Block helper iterating over all commands, including their arguments and clusters.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_global_commands"></a>

### Templating API: static zcl helpers~zcl\_global\_commands(options) ⇒
Helper to iterate over all global commands.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of global command iteration.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_attributes"></a>

### Templating API: static zcl helpers~zcl\_attributes(options) ⇒
Iterator over the attributes. If it is used at toplevel, if iterates over all the attributes
in the database. If used within zcl_cluster context, it iterates over all the attributes
that belong to that cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of attribute iteration.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_attributes_client"></a>

### Templating API: static zcl helpers~zcl\_attributes\_client(options) ⇒
Iterator over the client attributes. If it is used at toplevel, if iterates over all the client attributes
in the database. If used within zcl_cluster context, it iterates over all the client attributes
that belong to that cluster.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of attribute iteration.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_attributes_server"></a>

### Templating API: static zcl helpers~zcl\_attributes\_server(options) ⇒
Iterator over the server attributes. If it is used at toplevel, if iterates over all the server attributes
in the database. If used within zcl_cluster context, it iterates over all the server attributes
that belong to that cluster.
Available Options:
- removeKeys: Removes one or more keys from the map(for eg keys in db-mapping.js)
for eg: (#zcl_attributes_server removeKeys='isOptional, isNullable') will remove 'isOptional'
from the results

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of attribute iteration.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_atomics"></a>

### Templating API: static zcl helpers~zcl\_atomics(options) ⇒
Block helper iterating over all atomic types.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_cluster_largest_label_length"></a>

### Templating API: static zcl helpers~zcl\_cluster\_largest\_label\_length() ⇒
Given: N/A

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: the length of largest cluster name in a list of clusters  
<a name="module_Templating API_ static zcl helpers..largestLabelLength"></a>

### Templating API: static zcl helpers~largestLabelLength(An) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: the length of largest object name in an array. Helper for
zcl_cluster_largest_label_length  

| Param | Type | Description |
| --- | --- | --- |
| An | <code>\*</code> | Array |

<a name="module_Templating API_ static zcl helpers..zcl_command_arguments_count"></a>

### Templating API: static zcl helpers~zcl\_command\_arguments\_count(commandId) ⇒
Helper to extract the number of command arguments in a command

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Number of command arguments as an integer  

| Param | Type |
| --- | --- |
| commandId | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..ifCommandArgumentsHaveFixedLengthWithCurrentContext"></a>

### Templating API: static zcl helpers~ifCommandArgumentsHaveFixedLengthWithCurrentContext(commandId, fixedLengthReturn, notFixedLengthReturn, currentContext)
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Description |
| --- | --- |
| commandId |  |
| fixedLengthReturn |  |
| notFixedLengthReturn |  |
| currentContext | Returns fixedLengthReturn or notFixedLengthReturn based on whether the command is fixed length or not |

<a name="module_Templating API_ static zcl helpers..if_command_arguments_have_fixed_length"></a>

### Templating API: static zcl helpers~if\_command\_arguments\_have\_fixed\_length(commandId, fixedLengthReturn, notFixedLengthReturn)
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Description |
| --- | --- |
| commandId |  |
| fixedLengthReturn |  |
| notFixedLengthReturn | Returns fixedLengthReturn or notFixedLengthReturn based on whether the command is fixed length or not. Does not check if command arguments are always present or not. |

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_command\_is\_not\_fixed\_length\_but\_command\_argument\_is\_always\_present(type, command, commandArg, appendString, options) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: the underlying zcl type of a command argument if the argument is
not fixed length but is always present. If the condition is not met then
returns an empty string.  

| Param |
| --- |
| type | 
| command | 
| commandArg | 
| appendString | 
| options | 

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_if_command_is_not_fixed_length"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_if\_command\_is\_not\_fixed\_length(type, commandId, appendString, options)
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Description |
| --- | --- |
| type |  |
| commandId |  |
| appendString |  |
| options | Returns: Given the commandId and the type of one of its arguments, based on whether the command is fixed length or not either return nothing or return the underlying zcl type appended with the appendString. |

<a name="module_Templating API_ static zcl helpers..command_arguments_total_length"></a>

### Templating API: static zcl helpers~command\_arguments\_total\_length(commandId)
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Description |
| --- | --- |
| commandId | Returns the size of the command by calculating the sum total of the command arguments Note: This helper should be called on fixed length commands only. It should not be called with commands which do not have a fixed length. |

<a name="module_Templating API_ static zcl helpers..zcl_command_arguments"></a>

### Templating API: static zcl helpers~zcl\_command\_arguments(options) ⇒
Block helper iterating over command arguments within a command
or a command tree.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of command argument iteration.  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_event_fields"></a>

### Templating API: static zcl helpers~zcl\_event\_fields(options)
Block helper iterating over the event fields inside an event.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..zcl_command_argument_data_type"></a>

### Templating API: static zcl helpers~zcl\_command\_argument\_data\_type(typeName, options)
Helper that deals with the type of the argument.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type |
| --- | --- |
| typeName | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..asUnderlyingZclType"></a>

### Templating API: static zcl helpers~asUnderlyingZclType(typeName, options)
Helper that deals with the type of the argument.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type | Description |
| --- | --- | --- |
| typeName | <code>\*</code> |  |
| options | <code>\*</code> | Note: If the options has zclCharFormatter set to true then the function will return the user defined data associated with the zcl data type and not the actual data type. example: {{asUnderlyingZclType [array type] array="b" one_byte="u" two_byte="v" three_byte="x"  four_byte="w" short_string="s" long_string="l" default="b"  zclCharFormatter="true"}} For the above if asUnderlyingZclType was given [array type] then the above will return 'b' |

<a name="module_Templating API_ static zcl helpers..zcl_string_type_return"></a>

### Templating API: static zcl helpers~zcl\_string\_type\_return(type, options)
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Description |
| --- | --- |
| type |  |
| options | Returns the data mentioned in the helper options based on whether the type is short string, long string or not a string Example: {{zcl_string_type_return type short_string="short string output"                               long_string="short string output"                               default="Output when not a string") |

<a name="module_Templating API_ static zcl helpers..is_zcl_string"></a>

### Templating API: static zcl helpers~is\_zcl\_string(type)
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Description |
| --- | --- |
| type | Return: true or false based on whether the type is a string or not. |

<a name="module_Templating API_ static zcl helpers..if_is_number"></a>

### Templating API: static zcl helpers~if\_is\_number(type) ⇒
If helper that checks if a type is a string

example:
{{#if_is_number type}}
type is number
{{else}}
type is not number
{{/if_is_number}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_string"></a>

### Templating API: static zcl helpers~if\_is\_string(type) ⇒
If helper that checks if a type is a string

example:
{{#if_is_string type}}
type is string
{{else}}
type is not string
{{/if_is_string}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_char_string"></a>

### Templating API: static zcl helpers~if\_is\_char\_string(type) ⇒
If helper that checks if a string type is present in the list of char strings
i.e. characterStringTypes

example:
{{#if_is_char_string type}}
type is char string
{{else}}
type is not char string
{{/if_is_char_string}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_octet_string"></a>

### Templating API: static zcl helpers~if\_is\_octet\_string(type) ⇒
If helper that checks if a string type is present in the list of octet strings
i.e. octetStringTypes

example:
{{#if_is_octet_string type}}
type is octet string
{{else}}
type is not octet string
{{/if_is_octet_string}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_short_string"></a>

### Templating API: static zcl helpers~if\_is\_short\_string(type) ⇒
If helper that checks if a string type is present in the list of short strings
i.e. stringShortTypes

example:
{{#if_is_short_string type}}
type is short string
{{else}}
type is not short string
{{/if_is_short_string}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_long_string"></a>

### Templating API: static zcl helpers~if\_is\_long\_string(type) ⇒
If helper that checks if a string type is present in the list of long strings
i.e. stringLongTypes

example:
{{#if_is_long_string type}}
type is long string
{{else}}
type is not long string
{{/if_is_long_string}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_atomic"></a>

### Templating API: static zcl helpers~if\_is\_atomic(type:) ⇒
If helper that checks if a type is an atomic

example:
{{#if_is_atomic type}}
type is atomic
{{else}}
type is not atomic
{{/if_is_atomic}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type | Description |
| --- | --- | --- |
| type: | <code>\*</code> | string |

<a name="module_Templating API_ static zcl helpers..if_is_bitmap"></a>

### Templating API: static zcl helpers~if\_is\_bitmap(type) ⇒
If helper that checks if a type is a bitmap

example:
{{#if_is_bitmap type}}
type is bitmap
{{else}}
type is not bitmap
{{/if_is_bitmap}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_enum"></a>

### Templating API: static zcl helpers~if\_is\_enum(type) ⇒
If helper that checks if a type is an enum

* example:
{{#if_is_enum type}}
type is enum
{{else}}
type is not enum
{{/if_is_enum}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_struct"></a>

### Templating API: static zcl helpers~if\_is\_struct(type) ⇒
If helper that checks if a type is an struct

* example:
{{#if_is_struct type}}
type is struct
{{else}}
type is not struct
{{/if_is_struct}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content.  

| Param |
| --- |
| type | 

<a name="module_Templating API_ static zcl helpers..isClient"></a>

### Templating API: static zcl helpers~isClient(side) ⇒
Checks if the side is client or not

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| side | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..isServer"></a>

### Templating API: static zcl helpers~isServer(side) ⇒
Checks if the side is server or not

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| side | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..isStrEqual"></a>

### Templating API: static zcl helpers~isStrEqual(str1, str2) ⇒
Compares 2 strings.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| str1 | <code>\*</code> | 
| str2 | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..isLastElement"></a>

### Templating API: static zcl helpers~isLastElement(index, count) ⇒
Returns boolean based on whether the element is the last element.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| index | <code>\*</code> | 
| count | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..isFirstElement"></a>

### Templating API: static zcl helpers~isFirstElement(index, count) ⇒
Returns boolean based on whether the element is the first element.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| index | <code>\*</code> | 
| count | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..isEnabled"></a>

### Templating API: static zcl helpers~isEnabled(enable) ⇒
Check if enable is 1.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| enable | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..isCommandAvailable"></a>

### Templating API: static zcl helpers~isCommandAvailable(clusterSide, incoming, outgoing, source, name) ⇒
Returns boolean based on command being available or not.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: boolean  

| Param | Type |
| --- | --- |
| clusterSide | <code>\*</code> | 
| incoming | <code>\*</code> | 
| outgoing | <code>\*</code> | 
| source | <code>\*</code> | 
| name | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_always_present"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_command\_argument\_always\_present(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed length and the command
argument is always present in all zcl specifications.  

| Param | Description |
| --- | --- |
| type: | type of argument |
| commandId: | command id |
| appendString: | append the string to the argument |
| introducedInRef: | If the command argument is not present in all zcl specifications and was introduced in a certain specification version then this will not be null |
| removedInRef: | If the command argument is not present in all zcl specifications and was removed in a certain specification version then this will not be null |
| presentIf: | If the command argument is present conditionally then this will be a condition and not null |
| options: | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..if_command_argument_always_present"></a>

### Templating API: static zcl helpers~if\_command\_argument\_always\_present(commandId, introducedInRef, removedInRef, presentIf, argumentPresentReturn, argumentNotPresentReturn) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: argumentPresentReturn if the command is not fixed length and command
argument is always present without conditions(introducedInRef, removedInRef,
presentIf) else returns argumentNotPresentReturn  

| Param |
| --- |
| commandId | 
| introducedInRef | 
| removedInRef | 
| presentIf | 
| argumentPresentReturn | 
| argumentNotPresentReturn | 

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_not_always_present_no_presentif"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_command\_argument\_not\_always\_present\_no\_presentif(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed length, the command
argument is not always present in all zcl specifications and there is no present if conditionality
on the command argument.  

| Param | Description |
| --- | --- |
| type: | type of argument |
| commandId: | command id |
| appendString: | append the string to the argument |
| introducedInRef: | If the command argument is not present in all zcl specifications and was introduced in a certain specification version then this will not be null |
| removedInRef: | If the command argument is not present in all zcl specifications and was removed in a certain specification version then this will not be null |
| presentIf: | If the command argument is present conditionally then this will be a condition and not null |
| options: | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_ca_not_always_present_no_presentif"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_ca\_not\_always\_present\_no\_presentif(commandArg, appendString, options) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed
length, the command argument is not always present in all zcl specifications
and there is no present if conditionality on the command argument.  

| Param | Description |
| --- | --- |
| commandArg | command argument |
| appendString | append the string to the argument |
| options | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..if_command_argument_not_always_present_no_presentif"></a>

### Templating API: static zcl helpers~if\_command\_argument\_not\_always\_present\_no\_presentif(commandId, introducedInRef, removedInRef, presentIf, argumentNotInAllVersionsReturn, argumentInAllVersionsReturn) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: argumentNotInAllVersionsReturn if the command is not fixed length and command
argument is present with conditions introducedInRef or removedInRef but no presentIf
conditions else returns argumentNotPresentReturn  

| Param |
| --- |
| commandId | 
| introducedInRef | 
| removedInRef | 
| presentIf | 
| argumentNotInAllVersionsReturn | 
| argumentInAllVersionsReturn | 

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_not_always_present_with_presentif"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_command\_argument\_not\_always\_present\_with\_presentif(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed length, the command
argument is not always present in all zcl specifications and there is a present if conditionality
on the command argument.  

| Param | Description |
| --- | --- |
| type: | type of argument |
| commandId: | command id |
| appendString: | append the string to the argument |
| introducedInRef: | If the command argument is not present in all zcl specifications and was introduced in a certain specification version then this will not be null |
| removedInRef: | If the command argument is not present in all zcl specifications and was removed in a certain specification version then this will not be null |
| presentIf: | If the command argument is present conditionally then this will be a condition and not null |
| options: | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_ca_not_always_present_with_presentif"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_ca\_not\_always\_present\_with\_presentif(commandArg, appendString, options) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed
length, the command argument is not always present in all zcl specifications
but there is a present if conditionality on the command argument.  

| Param | Description |
| --- | --- |
| commandArg | command argument |
| appendString | append the string to the argument |
| options | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..if_command_argument_not_always_present_with_presentif"></a>

### Templating API: static zcl helpers~if\_command\_argument\_not\_always\_present\_with\_presentif(commandId, introducedInRef, removedInRef, presentIf, argumentNotInAllVersionsPresentIfReturn, argumentInAllVersionsReturn) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: argumentNotInAllVersionsReturn if the command is not fixed length, command
argument is present with conditions introducedInRef or removedInRef and presentIf
conditions exist as well else returns argumentNotPresentReturn  

| Param |
| --- |
| commandId | 
| introducedInRef | 
| removedInRef | 
| presentIf | 
| argumentNotInAllVersionsPresentIfReturn | 
| argumentInAllVersionsReturn | 

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_command_argument_always_present_with_presentif"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_command\_argument\_always\_present\_with\_presentif(type:, commandId:, appendString:, introducedInRef:, removedInRef:, presentIf:, options:) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed length, the command
argument is always present in all zcl specifications and there is a present if conditionality
on the command argument.  

| Param | Description |
| --- | --- |
| type: | type of argument |
| commandId: | command id |
| appendString: | append the string to the argument |
| introducedInRef: | If the command argument is not present in all zcl specifications and was introduced in a certain specification version then this will not be null |
| removedInRef: | If the command argument is not present in all zcl specifications and was removed in a certain specification version then this will not be null |
| presentIf: | If the command argument is present conditionally then this will be a condition and not null |
| options: | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..as_underlying_zcl_type_ca_always_present_with_presentif"></a>

### Templating API: static zcl helpers~as\_underlying\_zcl\_type\_ca\_always\_present\_with\_presentif(commandArg, appendString, options) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: A string as an underlying zcl type if the command is not fixed
length, the command argument is always present in all zcl specifications
but there is a present if conditionality on the command argument.  

| Param | Description |
| --- | --- |
| commandArg | command argument |
| appendString | append the string to the argument |
| options | options which can be passed to zclUtil.asUnderlyingZclTypeWithPackageId for determining the underlying zcl type for the provided argument type |

<a name="module_Templating API_ static zcl helpers..if_command_argument_always_present_with_presentif"></a>

### Templating API: static zcl helpers~if\_command\_argument\_always\_present\_with\_presentif(commandId, introducedInRef, removedInRef, presentIf, argumentNotInAllVersionsPresentIfReturn, argumentInAllVersionsReturn) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: argumentInAllVersionsPresentIfReturn if the command is not fixed length, command
argument is always present and presentIf conditions exist else returns argumentNotPresentReturn  

| Param |
| --- |
| commandId | 
| introducedInRef | 
| removedInRef | 
| presentIf | 
| argumentNotInAllVersionsPresentIfReturn | 
| argumentInAllVersionsReturn | 

<a name="module_Templating API_ static zcl helpers..if_manufacturing_specific_cluster"></a>

### Templating API: static zcl helpers~if\_manufacturing\_specific\_cluster(clusterId, manufacturer_specific_return, null_manufacturer_specific_return) ⇒
**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: manufacturer_specific_return if the cluster is manufacturer
specific or returns null_manufacturer_specific_return if cluster is
not manufacturer specific.  

| Param | Type |
| --- | --- |
| clusterId | <code>\*</code> | 
| manufacturer_specific_return | <code>\*</code> | 
| null_manufacturer_specific_return | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_mfg_specific_cluster"></a>

### Templating API: static zcl helpers~if\_mfg\_specific\_cluster(clusterId, options) ⇒
If helper which checks if cluster is manufacturing specific or not
example:
{{#if_mfg_specific_cluster clusterId}}
 cluster is manufacturing specific
{{else}}
 cluster is not manufacturing specific
{{/if_mfg_specific_cluster}}

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Returns content in the handlebar template based on whether the
command is manufacturing specific or not.  

| Param |
| --- |
| clusterId | 
| options | 

<a name="module_Templating API_ static zcl helpers..as_generated_default_macro"></a>

### Templating API: static zcl helpers~as\_generated\_default\_macro(value, attributeSize, options) ⇒
Given the value and size of an attribute along with endian as an option.
This helper returns the attribute value as big/little endian.
Example: {{as_generated_default_macro 0x00003840 4 endian="big"}}
will return: 0x00, 0x00, 0x38, 0x40,

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Formatted attribute value based on given arguments
Available options:
- endian: Specify 'big' or 'little' endian format
- isCommaTerminated: '0' or '1' for output to have a ',' at the end  

| Param |
| --- |
| value | 
| attributeSize | 
| options | 

<a name="module_Templating API_ static zcl helpers..attribute_mask"></a>

### Templating API: static zcl helpers~attribute\_mask(writable, storageOption, minMax, mfgSpecific, clusterCode, client, isSingleton, prefixString, postfixString) ⇒
Given the attributes of a zcl attribute. Creates an attribute mask based on
the given options
Available options:
isClusterCodeMfgSpecific: 0/1, This is to determine if cluster code needs to
be used to determine if a cluster is mfg specific or not.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: attribute mask based on given values  

| Param |
| --- |
| writable | 
| storageOption | 
| minMax | 
| mfgSpecific | 
| clusterCode | 
| client | 
| isSingleton | 
| prefixString | 
| postfixString | 

<a name="module_Templating API_ static zcl helpers..command_mask"></a>

### Templating API: static zcl helpers~command\_mask(commmandSource, clusterSide, isIncomingEnabled, isOutgoingEnabled, manufacturingCode, prefixForMask) ⇒
Given the attributes of a zcl command. Creates a command mask based on
the given options

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: command mask based on given values  

| Param |
| --- |
| commmandSource | 
| clusterSide | 
| isIncomingEnabled | 
| isOutgoingEnabled | 
| manufacturingCode | 
| prefixForMask | 

<a name="module_Templating API_ static zcl helpers..command_mask_sub_helper"></a>

### Templating API: static zcl helpers~command\_mask\_sub\_helper(commandMask, str) ⇒
A Sub helper api for command_mask to reduce code redundancy

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: command mask addition based on the arguments  

| Param |
| --- |
| commandMask | 
| str | 

<a name="module_Templating API_ static zcl helpers..format_zcl_string_as_characters_for_generated_defaults"></a>

### Templating API: static zcl helpers~format\_zcl\_string\_as\_characters\_for\_generated\_defaults(stringVal, sizeOfString) ⇒
This may be used within all_user_cluster_attributes_for_generated_defaults
for example:
{{format_zcl_string_as_characters_for_generated_defaults 'abc' 5}}
will return as follows:
3, 'a', 'b', 'c' 0, 0

Available Options:
- isOctet: 0/1 can be used to return results correctly for octet strings
- isCommaTerminated: 0/1 can be used to return result with/without ',' at
the end

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Formatted string for generated defaults starting with the lenth of a
string then each character and then filler for the size allocated for the
string. Long strings prefixed by 2 byte length field.  

| Param |
| --- |
| stringVal | 
| sizeOfString | 

<a name="module_Templating API_ static zcl helpers..as_type_min_value"></a>

### Templating API: static zcl helpers~as\_type\_min\_value(type, options) ⇒
Given a zcl data type return the min allowed value for that zcl data type
based on the language specified in the options

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: max allowed value for the given zcl data type
Available Options:
- language: determines the output of the helper based on language
for eg: (as_type_min_value language='c++') will give the output specific to
the c++ language.
Note: If language is not specified then helper throws an error.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..as_type_max_value"></a>

### Templating API: static zcl helpers~as\_type\_max\_value(type, options) ⇒
Given a zcl data type return the max allowed value for that zcl data type
based on the language specified in the options

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: max allowed value for the given zcl data type
Available Options:
- language: determines the output of the helper based on language
for eg: (as_type_max_value language='c++') will give the output specific to
the c++ language.
Note: If language is not specified then the helper returns size of type in
bits.  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..structs_with_clusters"></a>

### Templating API: static zcl helpers~structs\_with\_clusters(options)
Returns all structs which have clusters associated with them

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>\*</code> | Available Options: - groupByStructName: Can group the query results based on struct name for structs which are present in more than one cluster eg Usage: {{#structs_with_clusters groupByStructName=1}}{{/structs_with_clusters}} |

<a name="module_Templating API_ static zcl helpers..as_zcl_type_size"></a>

### Templating API: static zcl helpers~as\_zcl\_type\_size(type, options) ⇒
Returns the size of the zcl type if possible else returns -1

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: size of zcl type  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_compare"></a>

### Templating API: static zcl helpers~if\_compare(leftValue, rightValue, options) ⇒ <code>Object</code>
An if helper for comparisons

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: <code>Object</code> - Promise of content
example: checking if (4 < 5)
(if_compare 4 5 operator='<')
Content when comparison returns true

Content when comparison returns false
(/if_compare)  

| Param | Type |
| --- | --- |
| leftValue | <code>\*</code> | 
| rightValue | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..if_is_data_type_signed"></a>

### Templating API: static zcl helpers~if\_is\_data\_type\_signed(type, clusterId, options) ⇒
Check if the given type is signed or not based on the type name and cluster
id.
Note: This helper needs to be used under a block helper which has a
reference to clusterId.

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: Promise of content  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| clusterId | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ static zcl helpers..as_zcl_data_type_size"></a>

### Templating API: static zcl helpers~as\_zcl\_data\_type\_size(type, clusterId, options) ⇒
Fetches the size of the data type based on type name and cluster id given
Note:
- Size is zero for structs
- This helper needs to be used under a block helper which has a
reference to clusterId.
Available Options:
- roundUpToPowerOfTwo: Rounds the size up to the nearest power of 2
- sizeIn: By default size is returned in bytes but it can be returned in bits
by mentioning sizeIn="bits"

**Kind**: inner method of [<code>Templating API: static zcl helpers</code>](#module_Templating API_ static zcl helpers)  
**Returns**: size of the data type  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| clusterId | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Zigbee Specific helpers"></a>

## Templating API: Zigbee Specific helpers
This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}


* [Templating API: Zigbee Specific helpers](#module_Templating API_ Zigbee Specific helpers)
    * [~get_cli_size(size, type, allowZclTypes)](#module_Templating API_ Zigbee Specific helpers..get_cli_size) ⇒
    * [~zcl_command_argument_type_to_cli_data_type_util(type, cliPrefix, context, options)](#module_Templating API_ Zigbee Specific helpers..zcl_command_argument_type_to_cli_data_type_util) ⇒
    * [~zcl_command_argument_type_to_cli_data_type(typeName, options)](#module_Templating API_ Zigbee Specific helpers..zcl_command_argument_type_to_cli_data_type)
    * [~zcl_command_argument_type_to_zcl_cli_data_type(typeName, options)](#module_Templating API_ Zigbee Specific helpers..zcl_command_argument_type_to_zcl_cli_data_type)

<a name="module_Templating API_ Zigbee Specific helpers..get_cli_size"></a>

### Templating API: Zigbee Specific helpers~get\_cli\_size(size, type, allowZclTypes) ⇒
**Kind**: inner method of [<code>Templating API: Zigbee Specific helpers</code>](#module_Templating API_ Zigbee Specific helpers)  
**Returns**: The size in bits for a cli type based on allowZclTypes  

| Param | Type |
| --- | --- |
| size | <code>\*</code> | 
| type | <code>\*</code> | 
| allowZclTypes | <code>\*</code> | 

<a name="module_Templating API_ Zigbee Specific helpers..zcl_command_argument_type_to_cli_data_type_util"></a>

### Templating API: Zigbee Specific helpers~zcl\_command\_argument\_type\_to\_cli\_data\_type\_util(type, cliPrefix, context, options) ⇒
**Kind**: inner method of [<code>Templating API: Zigbee Specific helpers</code>](#module_Templating API_ Zigbee Specific helpers)  
**Returns**: the zcl cli data type string with the cli prefix given
Additional Options:
- isOptional option can be passed along with the command argument
to return optional command argument extension accordingly
eg:
#zcl_command_arguments
  zcl_command_argument_type_to_zcl_cli_data_type type isOptional=isOptional
/zcl_command_arguments  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| cliPrefix | <code>\*</code> | 
| context | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Zigbee Specific helpers..zcl_command_argument_type_to_cli_data_type"></a>

### Templating API: Zigbee Specific helpers~zcl\_command\_argument\_type\_to\_cli\_data\_type(typeName, options)
Helper that deals with the type of the argument.

**Kind**: inner method of [<code>Templating API: Zigbee Specific helpers</code>](#module_Templating API_ Zigbee Specific helpers)  

| Param | Type |
| --- | --- |
| typeName | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="module_Templating API_ Zigbee Specific helpers..zcl_command_argument_type_to_zcl_cli_data_type"></a>

### Templating API: Zigbee Specific helpers~zcl\_command\_argument\_type\_to\_zcl\_cli\_data\_type(typeName, options)
Helper that deals with the type of the argument.

**Kind**: inner method of [<code>Templating API: Zigbee Specific helpers</code>](#module_Templating API_ Zigbee Specific helpers)  

| Param | Type |
| --- | --- |
| typeName | <code>\*</code> | 
| options | <code>\*</code> | 

