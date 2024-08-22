/*
 *
 * $$$$$$$\                     $$\
 * $$  __$$\                    $$ |
 * $$ |  $$ |$$$$$$\   $$$$$$$\ $$ |  $$\ $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$$\
 * $$$$$$$  |\____$$\ $$  _____|$$ | $$  |\____$$\ $$  __$$\ $$  __$$\ $$  _____|
 * $$  ____/ $$$$$$$ |$$ /      $$$$$$  / $$$$$$$ |$$ /  $$ |$$$$$$$$ |\$$$$$$\
 * $$ |     $$  __$$ |$$ |      $$  _$$< $$  __$$ |$$ |  $$ |$$   ____| \____$$\
 * $$ |     \$$$$$$$ |\$$$$$$$\ $$ | \$$\\$$$$$$$ |\$$$$$$$ |\$$$$$$$\ $$$$$$$  |
 * \__|      \_______| \_______|\__|  \__|\_______| \____$$ | \_______|\_______/
 *                                                 $$\   $$ |
 *                                                 \$$$$$$  |
 *                                                  \______/
 *
 * You can create these giant separators via:
 * http://patorjk.com/software/taag/#p=display&f=Big%20Money-nw
 */
/*
 Global SQLite settings.
 */
PRAGMA foreign_keys = ON;
/*
 PACKAGE table contains the "packages" that are the sources for the
 loading of the other data. They may be individual files, or
 collection of files, which then contain subpackages.

 Table records the CRC of the toplevel file at the time loading.
 Note: This table does not have unique keys because we could have top
 level packages which are reloaded because one of the packages
 changed. So there could be multiple top level packages with same
 path and crc but there will be only one of them which will have
 IS_IN_SYNC as 1.
 */
DROP TABLE IF EXISTS "PACKAGE";
CREATE TABLE "PACKAGE" (
  "PACKAGE_ID" integer primary key autoincrement,
  "PARENT_PACKAGE_REF" integer,
  "PATH" text NOT NULL,
  "TYPE" text,
  "CRC" integer,
  "VERSION" integer,
  "CATEGORY" text,
  "DESCRIPTION" text,
  "IS_IN_SYNC" boolean default 1,
  foreign key (PARENT_PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 PACKAGE_OPTION table contains generic 'options' that are encoded from within each packages.
 */
DROP TABLE IF EXISTS "PACKAGE_OPTION";
CREATE TABLE "PACKAGE_OPTION" (
  "OPTION_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "OPTION_CATEGORY" text,
  "OPTION_CODE" text,
  "OPTION_LABEL" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL)
);
/*
 PACKAGE_OPTION_DEFAULT table contains a link to a specified 'default value' for options
 */
DROP TABLE IF EXISTS "PACKAGE_OPTION_DEFAULT";
CREATE TABLE "PACKAGE_OPTION_DEFAULT" (
  "OPTION_DEFAULT_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "OPTION_CATEGORY" text,
  "OPTION_REF" integer,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (OPTION_REF) references PACKAGE_OPTION(OPTION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(PACKAGE_REF, OPTION_CATEGORY)
);
/*
 PACKAGE EXTENSIONS table contains extensions of specific ZCL entities attached to the
 gen template packages. See docs/sdk-extensions.md, the section about "Template key: zcl"
 */
DROP TABLE IF EXISTS "PACKAGE_EXTENSION";
CREATE TABLE "PACKAGE_EXTENSION" (
  "PACKAGE_EXTENSION_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "ENTITY" text,
  "PROPERTY" text,
  "TYPE" text,
  "CONFIGURABILITY" text,
  "LABEL" text,
  "GLOBAL_DEFAULT" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(PACKAGE_REF, ENTITY, PROPERTY)
);
/*
 PACKAGE_EXTENSION_DEFAULTS table contains default values for specific entities. Each row provides
 default value for one item of a given entity, listed in PACKAGE_EXTENSION
 */
DROP TABLE IF EXISTS "PACKAGE_EXTENSION_DEFAULT";
CREATE TABLE "PACKAGE_EXTENSION_DEFAULT" (
  "PACKAGE_EXTENSION_REF" integer,
  "ENTITY_CODE" integer,
  "ENTITY_QUALIFIER" text,
  "PARENT_CODE" integer,
  "MANUFACTURER_CODE" integer,
  "VALUE" text,
  foreign key (PACKAGE_EXTENSION_REF) references PACKAGE_EXTENSION(PACKAGE_EXTENSION_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 *
 * $$$$$$$$\          $$\       $$\      $$\                 $$\           $$\
 * \____$$  |         $$ |      $$$\    $$$ |                $$ |          $$ |
 *     $$  / $$$$$$$\ $$ |      $$$$\  $$$$ | $$$$$$\   $$$$$$$ | $$$$$$\  $$ |
 *    $$  / $$  _____|$$ |      $$\$$\$$/$$ |$$  __$$\ $$  __$$ |$$  __$$\ $$ |
 *   $$  /  $$ /      $$ |      $$ \$$$ .$$ |$$ /  $$ |$$ /  $$ |$$$$$$$$ |$$ |
 *  $$  /   $$ |      $$ |      $$ |\$  /$$ |$$ |  $$ |$$ |  $$ |$$   ____|$$ |
 * $$$$$$$$\\$$$$$$$\ $$ |      $$ | \_/ $$ |\$$$$$$  |\$$$$$$$ |\$$$$$$$\ $$ |
 * \________|\_______|\__|      \__|     \__| \______/  \_______| \_______|\__|
 */
/*
 SPEC table contains the spec information.
 */
DROP TABLE IF EXISTS "SPEC";
CREATE TABLE IF NOT EXISTS "SPEC" (
  "SPEC_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "CODE" text NOT NULL,
  "DESCRIPTION" text,
  "CERTIFIABLE" integer,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(PACKAGE_REF, CODE)
);
/*
 DOMAIN table contains domains directly loaded from packages.
 */
DROP TABLE IF EXISTS "DOMAIN";
CREATE TABLE IF NOT EXISTS "DOMAIN" (
  "DOMAIN_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  "LATEST_SPEC_REF" integer,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (LATEST_SPEC_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(PACKAGE_REF, NAME)
);
/*
 CLUSTER table contains the clusters loaded from the ZCL XML files.
 */
DROP TABLE IF EXISTS "CLUSTER";
CREATE TABLE IF NOT EXISTS "CLUSTER" (
  "CLUSTER_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "DOMAIN_NAME" text,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "DEFINE" text,
  "IS_SINGLETON" integer,
  "REVISION" integer,
  "INTRODUCED_IN_REF" integer,
  "REMOVED_IN_REF" integer,
  "API_MATURITY" text,
  foreign key (INTRODUCED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (REMOVED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, CODE, MANUFACTURER_CODE)
);
/*
 COMMAND table contains commands contained inside a cluster.
 */
DROP TABLE IF EXISTS "COMMAND";
CREATE TABLE IF NOT EXISTS "COMMAND" (
  "COMMAND_ID" integer primary key autoincrement,
  "CLUSTER_REF" integer,
  "PACKAGE_REF" integer,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "SOURCE" text,
  "IS_OPTIONAL" integer,
  "MUST_USE_TIMED_INVOKE" integer,
  "IS_FABRIC_SCOPED" integer,
  "INTRODUCED_IN_REF" integer,
  "REMOVED_IN_REF" integer,
  "RESPONSE_NAME" integer,
  "RESPONSE_REF" integer,
  "IS_DEFAULT_RESPONSE_ENABLED" integer,
  foreign key (INTRODUCED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (REMOVED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (RESPONSE_REF) references COMMAND(COMMAND_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(CLUSTER_REF, PACKAGE_REF, CODE, MANUFACTURER_CODE, SOURCE)
);
/*
 COMMAND_ARG table contains arguments for a command.
 */
DROP TABLE IF EXISTS "COMMAND_ARG";
CREATE TABLE IF NOT EXISTS "COMMAND_ARG" (
  "COMMAND_REF" integer,
  "FIELD_IDENTIFIER" integer,
  "NAME" text,
  "TYPE" text,
  "MIN" text,
  "MAX" text,
  "MIN_LENGTH" integer,
  "MAX_LENGTH" integer,
  "IS_ARRAY" integer,
  "PRESENT_IF" text,
  "IS_NULLABLE" integer,
  "IS_OPTIONAL" integer,
  "COUNT_ARG" text,
  "INTRODUCED_IN_REF" integer,
  "REMOVED_IN_REF" integer,
  foreign key (INTRODUCED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (REMOVED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(COMMAND_REF, FIELD_IDENTIFIER)
);
/*
 EVENT table contains events for a given cluster.
 */
DROP TABLE IF EXISTS "EVENT";
CREATE TABLE IF NOT EXISTS "EVENT" (
  "EVENT_ID" integer primary key autoincrement,
  "CLUSTER_REF" integer,
  "PACKAGE_REF" integer,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "SIDE" text,
  "IS_OPTIONAL" integer,
  "IS_FABRIC_SENSITIVE" integer,
  "PRIORITY" text,
  "INTRODUCED_IN_REF" integer,
  "REMOVED_IN_REF" integer,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (INTRODUCED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (REMOVED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(CLUSTER_REF, PACKAGE_REF, CODE, MANUFACTURER_CODE)
);
/*
 EVENT_FIELD table contains events for a given cluster.
 */
DROP TABLE IF EXISTS "EVENT_FIELD";
CREATE TABLE IF NOT EXISTS "EVENT_FIELD" (
  "EVENT_REF" integer,
  "FIELD_IDENTIFIER" integer,
  "NAME" text,
  "TYPE" text,
  "IS_ARRAY" integer,
  "IS_NULLABLE" integer,
  "IS_OPTIONAL" integer,
  "INTRODUCED_IN_REF" integer,
  "REMOVED_IN_REF" integer,
  foreign key (INTRODUCED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (REMOVED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (EVENT_REF) references EVENT(EVENT_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(EVENT_REF, FIELD_IDENTIFIER)
);
/*
 ATTRIBUTE table contains attributes for the cluster.
 */
DROP TABLE IF EXISTS "ATTRIBUTE";
CREATE TABLE IF NOT EXISTS "ATTRIBUTE" (
  "ATTRIBUTE_ID" integer primary key autoincrement,
  "CLUSTER_REF" integer,
  "PACKAGE_REF" integer,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "TYPE" text,
  "SIDE" text,
  "DEFINE" text,
  "MIN" text,
  "MAX" text,
  "MIN_LENGTH" integer,
  "MAX_LENGTH" integer,
  "REPORT_MIN_INTERVAL" integer,
  "REPORT_MAX_INTERVAL" integer,
  "REPORTABLE_CHANGE" text,
  "REPORTABLE_CHANGE_LENGTH" integer,
  "IS_WRITABLE" integer,
  "DEFAULT_VALUE" text,
  "IS_SCENE_REQUIRED" integer,
  "IS_OPTIONAL" integer,
  "REPORTING_POLICY" text,
  "STORAGE_POLICY" text,
  "IS_NULLABLE" integer,
  "ARRAY_TYPE" text,
  "MUST_USE_TIMED_WRITE" integer,
  "INTRODUCED_IN_REF" integer,
  "REMOVED_IN_REF" integer,
  "API_MATURITY" text,
  "IS_CHANGE_COMITTED" integer,
  "PERSISTENCE" text,
  foreign key (INTRODUCED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (REMOVED_IN_REF) references SPEC(SPEC_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE("CLUSTER_REF", "PACKAGE_REF", "CODE", "MANUFACTURER_CODE")
);

/*
ATTRIBUTE MAPPING table contains associated attribute references.
*/
DROP TABLE IF EXISTS "ATTRIBUTE_MAPPING";
CREATE TABLE IF NOT EXISTS "ATTRIBUTE_MAPPING" (
  "ATTRIBUTE_MAPPING_ID" integer primary key autoincrement,
  "ATTRIBUTE_LEFT_REF" integer,
  "ATTRIBUTE_RIGHT_REF" integer,
  foreign key (ATTRIBUTE_LEFT_REF) references ATTRIBUTE(ATTRIBUTE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (ATTRIBUTE_RIGHT_REF) references ATTRIBUTE(ATTRIBUTE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE("ATTRIBUTE_LEFT_REF", "ATTRIBUTE_RIGHT_REF")
);
/*
 GLOBAL_ATTRIBUTE_DEFAULT table contains default values of attributes per cluster.
 Note that for the regular attribute defaults are already provided in DEFAULT_VALUE
 column in ATTRIBUTE table. The only place where this is needed is for the global
 attributes, which have CLUSTER_REF set to null in attribute table, so you need
 a per-cluster space for different default values.

 If a certain cluster/attribute combination does not exist in this table, the value
 should be table from ATTRIBUTE table directly.
 */
DROP TABLE IF EXISTS "GLOBAL_ATTRIBUTE_DEFAULT";
CREATE TABLE IF NOT EXISTS "GLOBAL_ATTRIBUTE_DEFAULT" (
  "GLOBAL_ATTRIBUTE_DEFAULT_ID" integer primary key autoincrement,
  "CLUSTER_REF" integer NOT NULL,
  "ATTRIBUTE_REF" integer NOT NULL,
  "DEFAULT_VALUE" text,
  foreign key(CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(CLUSTER_REF, ATTRIBUTE_REF)
);
/*
 GLOBAL_ATTRIBUTE_BIT is carrying information about the mappings of a
 bit for a given global attribute value. Example are FeatureMap global
 attributes in Matter implementation. For that case, the value
 of global attribute carries both the value, as well as the meaning
 of which bit corresponds to whith TAG. Hence this separate table that
 links those.
 */
DROP TABLE IF EXISTS "GLOBAL_ATTRIBUTE_BIT";
CREATE TABLE IF NOT EXISTS "GLOBAL_ATTRIBUTE_BIT" (
  "GLOBAL_ATTRIBUTE_DEFAULT_REF" integer NOT NULL,
  "BIT" integer NOT NULL,
  "VALUE" integer,
  "TAG_REF" integer NOT NULL,
  foreign key(GLOBAL_ATTRIBUTE_DEFAULT_REF) references GLOBAL_ATTRIBUTE_DEFAULT(GLOBAL_ATTRIBUTE_DEFAULT_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(TAG_REF) references TAG(TAG_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(GLOBAL_ATTRIBUTE_DEFAULT_REF, TAG_REF, BIT)
);
/*
 DEVICE_TYPE table contains device types directly loaded from packages.
 */
DROP TABLE IF EXISTS "DEVICE_TYPE";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE" (
  "DEVICE_TYPE_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "DOMAIN" text,
  "CODE" integer,
  "PROFILE_ID" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "CLASS" text,
  "SCOPE" text,
  "SUPERSET" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 This table stores information about endpoint compositions.
 Each record represents a composition associated with a specific device type.

 Columns:
 ENDPOINT_COMPOSITION_ID: The primary key of the table, auto-incremented for each new record.
 DEVICE_TYPE_REF: A foreign key linking to the DEVICE_TYPE table, indicating the device type associated with this composition.
 TYPE: A text field describing the type of the endpoint composition.
 CODE: An integer representing a unique code for the endpoint composition.

 Foreign Key Constraints:
 The DEVICE_TYPE_REF column references the DEVICE_TYPE_ID column of the DEVICE_TYPE table.
 On deletion of a referenced device type, corresponding records in this table are deleted (CASCADE).
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT_COMPOSITION" (
  "ENDPOINT_COMPOSITION_ID" integer PRIMARY KEY AUTOINCREMENT,
  "DEVICE_TYPE_REF" integer,
  "TYPE" text,
  "CODE" integer,
  "PACKAGE_REF" integer,
  FOREIGN KEY ("DEVICE_TYPE_REF") REFERENCES "DEVICE_TYPE"("DEVICE_TYPE_ID") ON DELETE CASCADE
  FOREIGN KEY ("PACKAGE_REF") REFERENCES "PACKAGE"("PACKAGE_ID") ON DELETE CASCADE
);
/*
 This table defines the composition of devices within the system.
 It links devices to their types and endpoint compositions, specifying their conformance and constraints.

 Columns:
 DEVICE_COMPOSITION_ID: The primary key of the table, auto-incremented for each new record.
 CODE: An integer representing the device code.
 DEVICE_TYPE_REF: An integer that acts as a foreign key to reference a specific device type.
 ENDPOINT_COMPOSITION_REF: A foreign key linking to the ENDPOINT_COMPOSITION table to specify the endpoint composition associated with this device.
 CONFORMANCE: A text field describing the conformance level of the device composition.
 DEVICE_CONSTRAINT: An integer representing any constraints applied to the device composition.

 Foreign Key Constraints:
 The DEVICE_TYPE_REF column references the DEVICE_TYPE_ID column of the DEVICE_TYPE table. On deletion of a device type, corresponding records in this table are deleted (CASCADE).
 The ENDPOINT_COMPOSITION_REF column references the ENDPOINT_COMPOSITION_ID column of the ENDPOINT_COMPOSITION table. On deletion of an endpoint composition, corresponding records in this table are deleted (CASCADE).
*/
CREATE TABLE IF NOT EXISTS "DEVICE_COMPOSITION" (
  "DEVICE_COMPOSITION_ID" integer PRIMARY KEY AUTOINCREMENT,
  "CODE" integer,
  "DEVICE_TYPE_REF" integer,
  "ENDPOINT_COMPOSITION_REF" integer,
  "CONFORMANCE" text,
  "DEVICE_CONSTRAINT" integer,
  FOREIGN KEY ("ENDPOINT_COMPOSITION_REF") REFERENCES "ENDPOINT_COMPOSITION"("ENDPOINT_COMPOSITION_ID") ON DELETE CASCADE
  FOREIGN KEY ("DEVICE_TYPE_REF") REFERENCES "DEVICE_TYPE"("DEVICE_TYPE_ID") ON DELETE CASCADE
);

/*
 DEVICE_TYPE_CLUSTER contains clusters that belong to the device type.
 */
DROP TABLE IF EXISTS "DEVICE_TYPE_CLUSTER";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_CLUSTER" (
  "DEVICE_TYPE_CLUSTER_ID" integer primary key autoincrement,
  "DEVICE_TYPE_REF" integer,
  "CLUSTER_REF" integer,
  "CLUSTER_NAME" text,
  "INCLUDE_CLIENT" integer,
  "INCLUDE_SERVER" integer,
  "LOCK_CLIENT" integer,
  "LOCK_SERVER" integer,
  foreign key (DEVICE_TYPE_REF) references DEVICE_TYPE(DEVICE_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

/*
 DEVICE_TYPE_FEATURE is the junction table between device type and feature
 tables.
 */
DROP TABLE IF EXISTS "DEVICE_TYPE_FEATURE";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_FEATURE" (
  "DEVICE_TYPE_CLUSTER_REF" integer,
  "FEATURE_REF" integer,
  "FEATURE_CODE" text,
  foreign key (DEVICE_TYPE_CLUSTER_REF) references DEVICE_TYPE_CLUSTER(DEVICE_TYPE_CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (FEATURE_REF) references FEATURE(FEATURE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(DEVICE_TYPE_CLUSTER_REF, FEATURE_REF)
);


/*
 FEATURE contains feature information
 */
DROP TABLE IF EXISTS "FEATURE";
CREATE TABLE IF NOT EXISTS "FEATURE" (
  "FEATURE_ID" integer primary key autoincrement,
  "NAME" text,
  "CODE" text,
  "BIT" integer,
  "DEFAULT_VALUE" integer,
  "DESCRIPTION" text,
  "CONFORMANCE" text,
  "PACKAGE_REF" integer,
  "CLUSTER_REF" integer,
  foreign key(PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(CODE, BIT, PACKAGE_REF, CLUSTER_REF)
);

/*
 DEVICE_TYPE_ATTRIBUTE contains attribuets that belong to a device type cluster.
 */
DROP TABLE IF EXISTS "DEVICE_TYPE_ATTRIBUTE";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_ATTRIBUTE" (
  "DEVICE_TYPE_CLUSTER_REF" integer,
  "ATTRIBUTE_REF" integer,
  "ATTRIBUTE_NAME" text,
  foreign key (DEVICE_TYPE_CLUSTER_REF) references DEVICE_TYPE_CLUSTER(DEVICE_TYPE_CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 DEVICE_TYPE_COMMAND contains attributes that belong to a device type cluster.
 */
DROP TABLE IF EXISTS "DEVICE_TYPE_COMMAND";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_COMMAND" (
  "DEVICE_TYPE_CLUSTER_REF" integer,
  "COMMAND_REF" integer,
  "COMMAND_NAME" text,
  foreign key (DEVICE_TYPE_CLUSTER_REF) references DEVICE_TYPE_CLUSTER(DEVICE_TYPE_CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 TAG table contains tags. They can be used for access control and feature maps.
 */
DROP TABLE IF EXISTS "TAG";
CREATE TABLE IF NOT EXISTS "TAG" (
  "TAG_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "CLUSTER_REF" integer,
  "NAME" text,
  "DESCRIPTION" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, CLUSTER_REF, NAME)
);
/*
 *
 * $$$$$$$$\
 * \__$$  __|
 *    $$ |$$\   $$\  $$$$$$\   $$$$$$\   $$$$$$$\
 *    $$ |$$ |  $$ |$$  __$$\ $$  __$$\ $$  _____|
 *    $$ |$$ |  $$ |$$ /  $$ |$$$$$$$$ |\$$$$$$\
 *    $$ |$$ |  $$ |$$ |  $$ |$$   ____| \____$$\
 *    $$ |\$$$$$$$ |$$$$$$$  |\$$$$$$$\ $$$$$$$  |
 *    \__| \____$$ |$$  ____/  \_______|\_______/
 *        $$\   $$ |$$ |
 *        \$$$$$$  |$$ |
 *         \______/ \__|
 */
/*
 DISCRIMINATOR table contains the data types loaded from packages
 */
DROP TABLE IF EXISTS "DISCRIMINATOR";
CREATE TABLE IF NOT EXISTS "DISCRIMINATOR" (
  "DISCRIMINATOR_ID" integer NOT NULL PRIMARY KEY autoincrement,
  "NAME" text,
  "PACKAGE_REF" integer,
  FOREIGN KEY (PACKAGE_REF) REFERENCES PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT DISCRIMINATOR_INFO UNIQUE("NAME", "PACKAGE_REF")
);
/*
 DATA_TYPE table contains the all data types loaded from packages
 */
DROP TABLE IF EXISTS "DATA_TYPE";
CREATE TABLE IF NOT EXISTS "DATA_TYPE" (
  "DATA_TYPE_ID" integer NOT NULL PRIMARY KEY autoincrement,
  "NAME" text,
  "DESCRIPTION" text,
  "DISCRIMINATOR_REF" integer,
  "PACKAGE_REF" integer,
  FOREIGN KEY (DISCRIMINATOR_REF) REFERENCES DISCRIMINATOR(DISCRIMINATOR_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (PACKAGE_REF) REFERENCES PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 DATA_TYPE_CLUSTER table is a junction table between the data types and clusters.
 This table stores the information on which data types are shared across clusters
 Note: The reason for having cluster code in this table is to load the Cluster
 reference during post loading. In terms of the schema an exception was made for
 loading cluster references into this table. For eg: See processZclPostLoading
 */
DROP TABLE IF EXISTS DATA_TYPE_CLUSTER;
CREATE TABLE DATA_TYPE_CLUSTER (
  DATA_TYPE_CLUSTER_ID integer NOT NULL PRIMARY KEY autoincrement,
  CLUSTER_REF integer,
  CLUSTER_CODE integer,
  DATA_TYPE_REF integer,
  FOREIGN KEY (CLUSTER_REF) REFERENCES CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (DATA_TYPE_REF) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(CLUSTER_REF, DATA_TYPE_REF)
);
/*
 NUMBER table contains the all numbers loaded from packages
 */
DROP TABLE IF EXISTS "NUMBER";
CREATE TABLE NUMBER (
  NUMBER_ID integer NOT NULL PRIMARY KEY,
  SIZE integer,
  IS_SIGNED integer,
  FOREIGN KEY (NUMBER_ID) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 STRING table contains the all strings loaded from packages
 */
DROP TABLE IF EXISTS "STRING";
CREATE TABLE STRING (
  STRING_ID integer NOT NULL PRIMARY KEY,
  IS_LONG integer,
  SIZE integer,
  IS_CHAR integer,
  FOREIGN KEY (STRING_ID) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 ATOMIC table contains the atomic types loaded from packages
 */
DROP TABLE IF EXISTS "ATOMIC";
CREATE TABLE IF NOT EXISTS "ATOMIC" (
  "ATOMIC_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "ATOMIC_IDENTIFIER" integer,
  "ATOMIC_SIZE" integer,
  "IS_DISCRETE" integer default false,
  "IS_STRING" integer default false,
  "IS_LONG" integer default false,
  "IS_CHAR" integer default false,
  "IS_SIGNED" integer default false,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, NAME, ATOMIC_IDENTIFIER)
);
/*
 BITMAP table contains the bitmaps directly loaded from packages.
 */
DROP TABLE IF EXISTS "BITMAP";
CREATE TABLE IF NOT EXISTS BITMAP (
  BITMAP_ID integer NOT NULL PRIMARY KEY,
  SIZE integer,
  FOREIGN KEY (BITMAP_ID) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 BITMAP_FIELD contains items that make up a bitmap.
 */
DROP TABLE IF EXISTS "BITMAP_FIELD";
CREATE TABLE IF NOT EXISTS BITMAP_FIELD (
  BITMAP_FIELD_ID integer NOT NULL PRIMARY KEY autoincrement,
  BITMAP_REF integer,
  FIELD_IDENTIFIER integer,
  NAME text(100),
  MASK integer,
  TYPE text(100),
  FOREIGN KEY (BITMAP_REF) REFERENCES BITMAP(BITMAP_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(BITMAP_REF, FIELD_IDENTIFIER)
);
/*
 ENUM table contains enums directly loaded from packages.
 */
DROP TABLE IF EXISTS "ENUM";
CREATE TABLE IF NOT EXISTS "ENUM" (
  ENUM_ID integer NOT NULL PRIMARY KEY,
  SIZE integer,
  FOREIGN KEY (ENUM_ID) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 ENUM_ITEM table contains individual enum items.
 */
DROP TABLE IF EXISTS "ENUM_ITEM";
CREATE TABLE IF NOT EXISTS "ENUM_ITEM" (
  "ENUM_ITEM_ID" integer NOT NULL PRIMARY KEY autoincrement,
  "ENUM_REF" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "FIELD_IDENTIFIER" integer,
  "VALUE" integer,
  FOREIGN KEY (ENUM_REF) REFERENCES "ENUM"(ENUM_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(ENUM_REF, FIELD_IDENTIFIER)
);
/*
 STRUCT table contains structs directly loaded from packages.
 */
DROP TABLE IF EXISTS "STRUCT";
CREATE TABLE IF NOT EXISTS STRUCT (
  STRUCT_ID integer NOT NULL PRIMARY KEY,
  IS_FABRIC_SCOPED integer,
  SIZE integer,
  API_MATURITY text,
  FOREIGN KEY (STRUCT_ID) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 STRUCT_ITEM table contains individual struct items.
 */
DROP TABLE IF EXISTS "STRUCT_ITEM";
CREATE TABLE IF NOT EXISTS STRUCT_ITEM (
  STRUCT_ITEM_ID integer NOT NULL PRIMARY KEY autoincrement,
  STRUCT_REF integer,
  FIELD_IDENTIFIER integer,
  NAME text(100),
  IS_ARRAY integer,
  IS_ENUM integer,
  MIN_LENGTH integer,
  MAX_LENGTH integer,
  IS_WRITABLE integer,
  IS_NULLABLE integer,
  IS_OPTIONAL integer,
  IS_FABRIC_SENSITIVE integer,
  SIZE integer,
  DATA_TYPE_REF integer NOT NULL,
  FOREIGN KEY (STRUCT_REF) REFERENCES STRUCT(STRUCT_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (DATA_TYPE_REF) REFERENCES DATA_TYPE(DATA_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(STRUCT_REF, FIELD_IDENTIFIER)
);
/*
 *  $$$$$$\
 * $$  __$$\
 * $$ /  $$ | $$$$$$$\  $$$$$$$\  $$$$$$\   $$$$$$$\  $$$$$$$\
 * $$$$$$$$ |$$  _____|$$  _____|$$  __$$\ $$  _____|$$  _____|
 * $$  __$$ |$$ /      $$ /      $$$$$$$$ |\$$$$$$\  \$$$$$$\
 * $$ |  $$ |$$ |      $$ |      $$   ____| \____$$\  \____$$\
 * $$ |  $$ |\$$$$$$$\ \$$$$$$$\ \$$$$$$$\ $$$$$$$  |$$$$$$$  |
 * \__|  \__| \_______| \_______| \_______|\_______/ \_______/
 */
DROP TABLE IF EXISTS "OPERATION";
CREATE TABLE IF NOT EXISTS "OPERATION" (
  "OPERATION_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  "DESCRIPTION" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, NAME)
);
DROP TABLE IF EXISTS "ROLE";
CREATE TABLE IF NOT EXISTS "ROLE" (
  "ROLE_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "LEVEL" integer,
  "NAME" text,
  "DESCRIPTION" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, NAME)
);
DROP TABLE IF EXISTS "ACCESS_MODIFIER";
CREATE TABLE IF NOT EXISTS "ACCESS_MODIFIER" (
  "ACCESS_MODIFIER_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  "DESCRIPTION" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, NAME)
);
DROP TABLE IF EXISTS "ACCESS";
CREATE TABLE IF NOT EXISTS "ACCESS" (
  "ACCESS_ID" integer primary key autoincrement,
  "OPERATION_REF" integer,
  "ROLE_REF" integer,
  "ACCESS_MODIFIER_REF" integer,
  foreign key (OPERATION_REF) references OPERATION(OPERATION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (ROLE_REF) references ROLE(ROLE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (ACCESS_MODIFIER_REF) references ACCESS_MODIFIER(ACCESS_MODIFIER_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "CLUSTER_ACCESS";
CREATE TABLE IF NOT EXISTS "CLUSTER_ACCESS" (
  "CLUSTER_REF" integer,
  "ACCESS_REF" integer,
  foreign key(ACCESS_REF) references ACCESS(ACCESS_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(CLUSTER_REF, ACCESS_REF)
);
DROP TABLE IF EXISTS "ATTRIBUTE_ACCESS";
CREATE TABLE IF NOT EXISTS "ATTRIBUTE_ACCESS" (
  "ATTRIBUTE_REF" integer,
  "ACCESS_REF" integer,
  foreign key(ACCESS_REF) references ACCESS(ACCESS_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(ATTRIBUTE_REF, ACCESS_REF)
);
DROP TABLE IF EXISTS "COMMAND_ACCESS";
CREATE TABLE IF NOT EXISTS "COMMAND_ACCESS" (
  "COMMAND_REF" integer,
  "ACCESS_REF" integer,
  foreign key(ACCESS_REF) references ACCESS(ACCESS_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(COMMAND_REF) references COMMAND(COMMAND_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(COMMAND_REF, ACCESS_REF)
);
DROP TABLE IF EXISTS "EVENT_ACCESS";
CREATE TABLE IF NOT EXISTS "EVENT_ACCESS" (
  "EVENT_REF" integer,
  "ACCESS_REF" integer,
  foreign key(ACCESS_REF) references ACCESS(ACCESS_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key(EVENT_REF) references EVENT(EVENT_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(EVENT_REF, ACCESS_REF)
);
DROP TABLE IF EXISTS "DEFAULT_ACCESS";
CREATE TABLE IF NOT EXISTS "DEFAULT_ACCESS" (
  "PACKAGE_REF" integer,
  "ENTITY_TYPE" text,
  "ACCESS_REF" integer,
  foreign key(ACCESS_REF) references ACCESS(ACCESS_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(PACKAGE_REF, ACCESS_REF)
);
/*
 *
 *  $$$$$$\                                $$\                                 $$\            $$\
 * $$  __$$\                               \__|                                $$ |           $$ |
 * $$ /  \__| $$$$$$\   $$$$$$$\  $$$$$$$\ $$\  $$$$$$\  $$$$$$$\         $$$$$$$ | $$$$$$\ $$$$$$\    $$$$$$\
 * \$$$$$$\  $$  __$$\ $$  _____|$$  _____|$$ |$$  __$$\ $$  __$$\       $$  __$$ | \____$$\\_$$  _|   \____$$\
 *  \____$$\ $$$$$$$$ |\$$$$$$\  \$$$$$$\  $$ |$$ /  $$ |$$ |  $$ |      $$ /  $$ | $$$$$$$ | $$ |     $$$$$$$ |
 * $$\   $$ |$$   ____| \____$$\  \____$$\ $$ |$$ |  $$ |$$ |  $$ |      $$ |  $$ |$$  __$$ | $$ |$$\ $$  __$$ |
 * \$$$$$$  |\$$$$$$$\ $$$$$$$  |$$$$$$$  |$$ |\$$$$$$  |$$ |  $$ |      \$$$$$$$ |\$$$$$$$ | \$$$$  |\$$$$$$$ |
 *  \______/  \_______|\_______/ \_______/ \__| \______/ \__|  \__|       \_______| \_______|  \____/  \_______|
 */
/*
 USER table contains a reference to a single "user", which really refers to a given cookie on the
 browser side. There is no login management here, so this just refers to a unique browser instance.
 */
DROP TABLE IF EXISTS "USER";
CREATE TABLE IF NOT EXISTS "USER" (
  "USER_ID" integer primary key autoincrement,
  "USER_KEY" text,
  "CREATION_TIME" integer,
  UNIQUE(USER_KEY)
);
/*
 SESSION table contains the list of known and remembered sessions.
 In case of electron SESSION_WINID is the window ID for a given
 session.
 */
DROP TABLE IF EXISTS "SESSION";
CREATE TABLE IF NOT EXISTS "SESSION" (
  "SESSION_ID" integer primary key autoincrement,
  "USER_REF" integer,
  "SESSION_KEY" text,
  "CREATION_TIME" integer,
  "DIRTY" integer default 1,
  "NEW_NOTIFICATION" integer default 0,
  foreign key (USER_REF) references USER(USER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(SESSION_KEY)
);
/*
 SESSION_KEY_VALUE table contains the data points that are simple
 key/value pairs.
 */
DROP TABLE IF EXISTS "SESSION_KEY_VALUE";
CREATE TABLE IF NOT EXISTS "SESSION_KEY_VALUE" (
  "SESSION_REF" integer,
  "KEY" text,
  "VALUE" text,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(SESSION_REF, KEY)
);
/*
 SESSION_LOG table contains general purpose text log for the session
 */
DROP TABLE IF EXISTS "SESSION_LOG";
CREATE TABLE IF NOT EXISTS "SESSION_LOG" (
  "SESSION_REF" integer,
  "TIMESTAMP" text,
  "LOG" text,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(SESSION_REF, TIMESTAMP, LOG)
);

DROP TABLE IF EXISTS "SESSION_PARTITION";
CREATE TABLE IF NOT EXISTS "SESSION_PARTITION" (
  "SESSION_PARTITION_ID" integer primary key autoincrement,
  "SESSION_PARTITION_NUMBER" integer,
  "SESSION_REF" integer,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) ON DELETE CASCADE ON UPDATE CASCADE
  UNIQUE(SESSION_PARTITION_NUMBER, SESSION_REF)
);

/*
 SESSION_PACKAGE table is a junction table, listing which packages
 are used for a given session.
 */
DROP TABLE IF EXISTS "SESSION_PACKAGE";
CREATE TABLE IF NOT EXISTS "SESSION_PACKAGE" (
  "SESSION_PARTITION_REF" integer,
  "PACKAGE_REF" integer,
  "REQUIRED" integer default false,
  "ENABLED" integer default true,
  foreign key (SESSION_PARTITION_REF) references SESSION_PARTITION(SESSION_PARTITION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(SESSION_PARTITION_REF, PACKAGE_REF)
);

/*
 ENDPOINT_TYPE contains the bulk of the configuration: clusters, attributes, etc.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE" (
  "ENDPOINT_TYPE_ID" integer primary key autoincrement,
  "SESSION_PARTITION_REF" integer,
  "NAME" text,
  foreign key (SESSION_PARTITION_REF) references SESSION_PARTITION(SESSION_PARTITION_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
 ENDPOINT_TYPE_DEVICE: many-to-many relationship between endpoint type and
 device type.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_DEVICE";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_DEVICE" (
  "ENDPOINT_TYPE_DEVICE_ID" integer primary key autoincrement,
  "DEVICE_TYPE_REF" INTEGER,
  "ENDPOINT_TYPE_REF" INTEGER,
  "DEVICE_TYPE_ORDER" INTEGER,
  "DEVICE_IDENTIFIER" INTEGER,
  "DEVICE_VERSION" INTEGER,
  foreign key(DEVICE_TYPE_REF) references DEVICE_TYPE(DEVICE_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete
  set NULL ON UPDATE CASCADE,
  UNIQUE("ENDPOINT_TYPE_REF", "DEVICE_TYPE_REF")
);
/**
 SQL Trigger for device type triggers per endpoint.
 From Matter Data Model Spec 9.2 Endpoint Composition
 Each simple endpoint SHALL support only one Application device type with these exceptions:
 - The endpoint MAY support additional device types which are subsets of the Application
 device type (the superset).
 - The endpoint MAY support additional device types (application, utility or node device types)
 as defined by each additional device type.
 */
CREATE TRIGGER ENDPOINT_TYPE_SIMPLE_DEVICE_CHECK BEFORE
INSERT ON ENDPOINT_TYPE_DEVICE
  WHEN (
    SELECT CLASS
    FROM DEVICE_TYPE
    WHERE DEVICE_TYPE.DEVICE_TYPE_ID = NEW.DEVICE_TYPE_REF
  ) = "Simple"
  AND (
    (
      SELECT CLASS
      FROM DEVICE_TYPE
      WHERE DEVICE_TYPE.DEVICE_TYPE_ID = NEW.DEVICE_TYPE_REF
    ) IN (
      SELECT CLASS
      FROM DEVICE_TYPE
        INNER JOIN ENDPOINT_TYPE_DEVICE ON DEVICE_TYPE.DEVICE_TYPE_ID = ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF
      WHERE ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF = NEW.ENDPOINT_TYPE_REF
    )
  )
  AND (
    (
      SELECT SUPERSET
      FROM DEVICE_TYPE
      WHERE DEVICE_TYPE.DEVICE_TYPE_ID = NEW.DEVICE_TYPE_REF
    ) NOT IN (
      SELECT DESCRIPTION
      FROM DEVICE_TYPE
        INNER JOIN ENDPOINT_TYPE_DEVICE ON DEVICE_TYPE.DEVICE_TYPE_ID = ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF
      WHERE ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF = NEW.ENDPOINT_TYPE_REF
    )
  )
  AND (
    (
      SELECT DESCRIPTION
      FROM DEVICE_TYPE
      WHERE DEVICE_TYPE.DEVICE_TYPE_ID = NEW.DEVICE_TYPE_REF
    ) NOT IN (
      SELECT SUPERSET
      FROM DEVICE_TYPE
        INNER JOIN ENDPOINT_TYPE_DEVICE ON DEVICE_TYPE.DEVICE_TYPE_ID = ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF
      WHERE ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF = NEW.ENDPOINT_TYPE_REF
    )
  ) BEGIN
SELECT RAISE(
    ROLLBACK,
    'Simple endpoint cannot have more than one application device type'
  );
END;
/*
 ENDPOINT table contains the toplevel configured endpoints.
 */
DROP TABLE IF EXISTS "ENDPOINT";
CREATE TABLE IF NOT EXISTS "ENDPOINT" (
  "ENDPOINT_ID" integer primary key autoincrement,
  "SESSION_REF" integer,
  "ENDPOINT_TYPE_REF" integer,
  "PROFILE" integer,
  "ENDPOINT_IDENTIFIER" integer,
  "NETWORK_IDENTIFIER" integer,
  "PARENT_ENDPOINT_REF" integer NULL,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (PARENT_ENDPOINT_REF) references ENDPOINT(ENDPOINT_ID) on delete set NULL ON UPDATE CASCADE,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete
  set NULL ON UPDATE CASCADE,
  UNIQUE(ENDPOINT_TYPE_REF, ENDPOINT_IDENTIFIER)
);
/*
 SESSION_CLUSTER contains the on/off values for cluster.
 SIDE is client or server
 STATE is 1 for ON and 0 for OFF.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_CLUSTER";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_CLUSTER" (
  "ENDPOINT_TYPE_CLUSTER_ID" integer primary key autoincrement,
  "ENDPOINT_TYPE_REF" integer,
  "CLUSTER_REF" integer,
  "SIDE" text,
  "ENABLED" integer default false,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE)
);

/*
SQL Trigger for Device Type cluster Compliance.
This trigger is used to add a warning to the notification table regarding a
cluster not enabled as per the device type specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_DEVICE_TYPE_CLUSTER_SPEC_COMPLIANCE_MESSAGE
AFTER
  UPDATE ON ENDPOINT_TYPE_CLUSTER
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = new.CLUSTER_REF
    AND
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = new.ENDPOINT_TYPE_REF
    AND
      ENDPOINT_TYPE_CLUSTER.SIDE = new.SIDE
    AND
      ENDPOINT_TYPE_CLUSTER.ENABLED != 1
    AND
      DEVICE_TYPE_CLUSTER.CLUSTER_REF = new.CLUSTER_REF
    AND
      ((DEVICE_TYPE_CLUSTER.INCLUDE_CLIENT = 1 AND LOWER(new.SIDE) = 'client' AND DEVICE_TYPE_CLUSTER.LOCK_CLIENT=1)
        OR (DEVICE_TYPE_CLUSTER.INCLUDE_SERVER = 1 AND LOWER(new.SIDE) = 'server' AND DEVICE_TYPE_CLUSTER.LOCK_SERVER=1))
  ) > 0
BEGIN
  INSERT INTO
    SESSION_NOTICE(SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN)
  VALUES
    (
      (
        SELECT
          SESSION_PARTITION.SESSION_REF
        FROM
          ENDPOINT_TYPE_CLUSTER
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
        INNER JOIN
          SESSION_PARTITION
        ON
          SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
        WHERE
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID
      ),
      "WARNING",
      "⚠ Check Device Type Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        WHERE
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID
      )
      ||
      ", cluster: "
      ||
      (
        SELECT
          CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
        FROM
          CLUSTER
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID AND
          ENDPOINT_TYPE_CLUSTER.ENABLED = new.ENABLED
      )
      ||
      " needs to be enabled",
      1,
      1,
      0
    );
END;

/*
SQL update trigger for Device Type Cluster Compliance.
This trigger is used to remove a warning from the notification table since
cluster is enabled as per the device type specification.
Note: An update happens when the cluster is already in the
endpoint_type_cluster table
*/
CREATE TRIGGER
  UPDATE_TRIGGER_DEVICE_TYPE_CLUSTER_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  UPDATE ON ENDPOINT_TYPE_CLUSTER
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = new.CLUSTER_REF
    AND
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = new.ENDPOINT_TYPE_REF
    AND
      ENDPOINT_TYPE_CLUSTER.SIDE = new.SIDE
    AND
      ENDPOINT_TYPE_CLUSTER.ENABLED = 1
    AND
      DEVICE_TYPE_CLUSTER.CLUSTER_REF = new.CLUSTER_REF
    AND
      ((DEVICE_TYPE_CLUSTER.INCLUDE_CLIENT = 1 AND LOWER(new.SIDE) = 'client' AND DEVICE_TYPE_CLUSTER.LOCK_CLIENT=1)
        OR (DEVICE_TYPE_CLUSTER.INCLUDE_SERVER = 1 AND LOWER(new.SIDE) = 'server' AND DEVICE_TYPE_CLUSTER.LOCK_SERVER=1))
  ) > 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
      WHERE
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Device Type Compliance on endpoint: "
        ||
        (
          SELECT
            ENDPOINT.ENDPOINT_IDENTIFIER
          FROM
            ENDPOINT
          INNER JOIN
            ENDPOINT_TYPE
          ON
            ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          WHERE
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID
        )
        ||
        "%, cluster: "
        ||
        (
          SELECT
            CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
          FROM
            CLUSTER
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID AND
            ENDPOINT_TYPE_CLUSTER.ENABLED = new.ENABLED
        )
        ||
        " needs to be enabled"
      );
END;

/*
SQL Insert Trigger for Device Type Cluster Compliance.
This trigger is used to remove a warning from the notification table since
cluster is enabled as per the device type specification.
Note: An insert happens when the cluster is not already in the
endpoint_type_cluster table
*/
CREATE TRIGGER
  INSERT_TRIGGER_DEVICE_TYPE_CLUSTER_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  INSERT ON ENDPOINT_TYPE_CLUSTER
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = new.CLUSTER_REF
    AND
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = new.ENDPOINT_TYPE_REF
    AND
      ENDPOINT_TYPE_CLUSTER.SIDE = new.SIDE
    AND
      ENDPOINT_TYPE_CLUSTER.ENABLED = 1
    AND
      DEVICE_TYPE_CLUSTER.CLUSTER_REF = new.CLUSTER_REF
    AND
      ((DEVICE_TYPE_CLUSTER.INCLUDE_CLIENT = 1 AND LOWER(new.SIDE) = 'client' AND DEVICE_TYPE_CLUSTER.LOCK_CLIENT=1)
        OR (DEVICE_TYPE_CLUSTER.INCLUDE_SERVER = 1 AND LOWER(new.SIDE) = 'server'  AND DEVICE_TYPE_CLUSTER.LOCK_SERVER=1))
) > 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
      WHERE
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Device Type Compliance on endpoint: "
        ||
        (
          SELECT
            ENDPOINT.ENDPOINT_IDENTIFIER
          FROM
            ENDPOINT
          INNER JOIN
            ENDPOINT_TYPE
          ON
            ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          WHERE
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID
        )
        ||
        "%, cluster: "
        ||
        (
          SELECT
            CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
          FROM
            CLUSTER
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = new.ENDPOINT_TYPE_CLUSTER_ID AND
            ENDPOINT_TYPE_CLUSTER.ENABLED = new.ENABLED
        )
        ||
        " needs to be enabled"
      );
END;

/*
 ENDPOINT_TYPE_ATTRIBUTE table contains the user data configuration for the various parameters that exist
 for an attribute on an endpoint. This essentially lets you determine if something should be included or not.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_ATTRIBUTE";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_ATTRIBUTE" (
  "ENDPOINT_TYPE_ATTRIBUTE_ID" integer primary key autoincrement,
  "ENDPOINT_TYPE_CLUSTER_REF" integer,
  "ATTRIBUTE_REF" integer,
  "INCLUDED" integer default false,
  "STORAGE_OPTION" text,
  "SINGLETON" integer default false,
  "BOUNDED" integer default false,
  "DEFAULT_VALUE" text,
  "INCLUDED_REPORTABLE" integer default false,
  "MIN_INTERVAL" integer default 1,
  "MAX_INTERVAL" integer default 65534,
  "REPORTABLE_CHANGE" integer default 0,
  foreign key (ENDPOINT_TYPE_CLUSTER_REF) references ENDPOINT_TYPE_CLUSTER(ENDPOINT_TYPE_CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(
    ATTRIBUTE_REF,
    ENDPOINT_TYPE_CLUSTER_REF
  )
);

/*
SQL Trigger for Device Type attribute Compliance.
This trigger is used to add a warning to the notification table when an
attribute is not enabled as per the device type specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_DEVICE_TYPE_ATTRIBUTE_SPEC_COMPLIANCE_MESSAGE
AFTER
  UPDATE ON ENDPOINT_TYPE_ATTRIBUTE
WHEN
(
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_ATTRIBUTE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
    INNER JOIN
      DEVICE_TYPE_ATTRIBUTE
    ON
      ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = new.ATTRIBUTE_REF
    AND
      ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = new.ENDPOINT_TYPE_CLUSTER_REF
    AND
      ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 0
    AND
      (
        CASE
          WHEN
             ENDPOINT_TYPE_CLUSTER.ENABLED = 0 AND ENDPOINT_TYPE_CLUSTER.SIDE = 'client' AND DEVICE_TYPE_CLUSTER.LOCK_CLIENT = 0
          THEN
             0
          WHEN
             ENDPOINT_TYPE_CLUSTER.ENABLED = 0 AND ENDPOINT_TYPE_CLUSTER.SIDE = 'server' AND DEVICE_TYPE_CLUSTER.LOCK_SERVER = 0
          THEN
             0
          ELSE
             1
        END
      )) > 0
BEGIN
  INSERT INTO
    SESSION_NOTICE(SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN)
  VALUES
    (
      (
        SELECT
          SESSION_PARTITION.SESSION_REF
        FROM
          ENDPOINT_TYPE_ATTRIBUTE
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
        INNER JOIN
          SESSION_PARTITION
        ON
          SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      ),
      "WARNING",
      "⚠ Check Device Type Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      ", cluster: "
      ||
      (
        SELECT
          CLUSTER.NAME
        FROM
          CLUSTER
        INNER JOIN
          ATTRIBUTE
        ON
          ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      ", attribute: "
      ||
      (
        SELECT
          ATTRIBUTE.NAME
        FROM
          ATTRIBUTE
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      " needs to be enabled",
      1,
      1,
      0
    );
END;


/*
SQL Trigger for Cluster's attribute Compliance.
This trigger is used to add a warning to the notification table when an
attribute is not enabled as per the cluster specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_CLUSTER_ATTRIBUTE_SPEC_COMPLIANCE_MESSAGE
AFTER
  UPDATE ON ENDPOINT_TYPE_ATTRIBUTE
WHEN
  (
    (
      SELECT
        ATTRIBUTE.IS_OPTIONAL
      FROM
        ATTRIBUTE
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID) == 0
    AND
      new.INCLUDED = 0
  )
BEGIN
  INSERT INTO
    SESSION_NOTICE(SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN)
  VALUES
    (
      (
        SELECT
          SESSION_PARTITION.SESSION_REF
        FROM
          ENDPOINT_TYPE_ATTRIBUTE
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
        INNER JOIN
          SESSION_PARTITION
        ON
          SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      ),
      "WARNING",
      "⚠ Check Cluster Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      ", cluster: "
      ||
      (
        SELECT
          CLUSTER.NAME
        FROM
          CLUSTER
        INNER JOIN
          ATTRIBUTE
        ON
          ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      ", mandatory attribute: "
      ||
      (
        SELECT
          ATTRIBUTE.NAME
        FROM
          ATTRIBUTE
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      " needs to be enabled",
      1,
      1,
      0
    );
END;


/*
SQL Update Trigger for Device Type attribute Compliance.
This trigger is used to remove a warning from the notification table when an
attribute is enabled as per the device type specification.
Note: An update to the endpoint type attribute table happens when the attribute
is already present in the table.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_DEVICE_TYPE_ATTRIBUTE_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  UPDATE ON ENDPOINT_TYPE_ATTRIBUTE
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_ATTRIBUTE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
    INNER JOIN
      DEVICE_TYPE_ATTRIBUTE
    ON
      ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = new.ATTRIBUTE_REF
    AND
      ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = new.ENDPOINT_TYPE_CLUSTER_REF
    AND
      ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 1
    AND
      (
        CASE
          WHEN
             ENDPOINT_TYPE_CLUSTER.ENABLED = 0 AND ENDPOINT_TYPE_CLUSTER.SIDE = 'client' AND DEVICE_TYPE_CLUSTER.LOCK_CLIENT = 0
          THEN
             0
          WHEN
             ENDPOINT_TYPE_CLUSTER.ENABLED = 0 AND ENDPOINT_TYPE_CLUSTER.SIDE = 'server' AND DEVICE_TYPE_CLUSTER.LOCK_SERVER = 0
          THEN
             0
          ELSE
             1
        END
      )) > 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Device Type Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      "%, cluster: "
      ||
        (
          SELECT
            CLUSTER.NAME
          FROM
            CLUSTER
          INNER JOIN
            ATTRIBUTE
          ON
            ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        ", attribute: "
        ||
        (
          SELECT
            ATTRIBUTE.NAME
          FROM
            ATTRIBUTE
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        " needs to be enabled"
      );
END;

/*
SQL Trigger for Cluster's attribute Compliance.
This trigger is used to remove a warning to the notification table when an
attribute is enabled as per the cluster specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_CLUSTER_ATTRIBUTE_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  UPDATE ON ENDPOINT_TYPE_ATTRIBUTE
WHEN
  (
    (
      SELECT
        ATTRIBUTE.IS_OPTIONAL
      FROM
        ATTRIBUTE
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID) == 0
    AND
      new.INCLUDED = 1
  )
BEGIN
DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Cluster Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      ", cluster: "
      ||
        (
          SELECT
            CLUSTER.NAME
          FROM
            CLUSTER
          INNER JOIN
            ATTRIBUTE
          ON
            ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        ", mandatory attribute: "
        ||
        (
          SELECT
            ATTRIBUTE.NAME
          FROM
            ATTRIBUTE
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        " needs to be enabled"
      );
END;

/*
SQL Insert Trigger for Device Type attribute Compliance.
This trigger is used to remove a warning from the notification table when an
attribute is enabled as per the device type specification.
Note: An insert to the endpoint type attribute table happens when the attribute
is not present in the table.
*/
CREATE TRIGGER
  INSERT_TRIGGER_DEVICE_TYPE_ATTRIBUTE_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  INSERT ON ENDPOINT_TYPE_ATTRIBUTE
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_ATTRIBUTE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
    INNER JOIN
      DEVICE_TYPE_ATTRIBUTE
    ON
      ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = new.ATTRIBUTE_REF
    AND
      ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = new.ENDPOINT_TYPE_CLUSTER_REF
    AND
      ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 1
    AND
      (
        CASE
          WHEN
             ENDPOINT_TYPE_CLUSTER.ENABLED = 0 AND ENDPOINT_TYPE_CLUSTER.SIDE = 'client' AND DEVICE_TYPE_CLUSTER.LOCK_CLIENT = 0
          THEN
             0
          WHEN
             ENDPOINT_TYPE_CLUSTER.ENABLED = 0 AND ENDPOINT_TYPE_CLUSTER.SIDE = 'server' AND DEVICE_TYPE_CLUSTER.LOCK_SERVER = 0
          THEN
             0
          ELSE
             1
        END
      )) > 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Device Type Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      "%, cluster: "
      ||
        (
          SELECT
            CLUSTER.NAME
          FROM
            CLUSTER
          INNER JOIN
            ATTRIBUTE
          ON
            ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        ", attribute: "
        ||
        (
          SELECT
            ATTRIBUTE.NAME
          FROM
            ATTRIBUTE
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        " needs to be enabled"
      );
END;

/*
SQL Trigger for Cluster's attribute Compliance.
This trigger is used to remove a warning to the notification table when an
attribute is enabled as per the cluster specification.
Note: An insert to the endpoint type attribute table happens when the attribute
is not present in the table.
*/
CREATE TRIGGER
  INSERT_TRIGGER_CLUSTER_ATTRIBUTE_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  INSERT ON ENDPOINT_TYPE_ATTRIBUTE
WHEN
  (
    (
      SELECT
        ATTRIBUTE.IS_OPTIONAL
      FROM
        ATTRIBUTE
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID) == 0
    AND
      new.INCLUDED = 1
  )
BEGIN
DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_ATTRIBUTE
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
      WHERE
        ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Cluster Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_ATTRIBUTE
        ON
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
      )
      ||
      ", cluster: "
      ||
        (
          SELECT
            CLUSTER.NAME
          FROM
            CLUSTER
          INNER JOIN
            ATTRIBUTE
          ON
            ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        ", mandatory attribute: "
        ||
        (
          SELECT
            ATTRIBUTE.NAME
          FROM
            ATTRIBUTE
          INNER JOIN
            ENDPOINT_TYPE_ATTRIBUTE
          ON
            ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ATTRIBUTE.ATTRIBUTE_ID
          WHERE
            ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_ATTRIBUTE_ID = new.ENDPOINT_TYPE_ATTRIBUTE_ID
        )
        ||
        " needs to be enabled"
      );
END;

/*
 ENDPOINT_TYPE_COMMAND table contains the user data configuration for the various parameters that exist
 for commands on an endpoint. This essentially lets you determine if something should be included or not.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_COMMAND";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_COMMAND" (
  "ENDPOINT_TYPE_COMMAND_ID" integer primary key autoincrement,
  "ENDPOINT_TYPE_CLUSTER_REF" integer,
  "COMMAND_REF" integer,
  "IS_INCOMING" integer default false,
  "IS_ENABLED" integer default false,
  foreign key (ENDPOINT_TYPE_CLUSTER_REF) references ENDPOINT_TYPE_CLUSTER(ENDPOINT_TYPE_CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(
    COMMAND_REF,
    ENDPOINT_TYPE_CLUSTER_REF,
    IS_INCOMING
  )
);

/*
SQL Update Trigger for Device Type command Compliance.
This trigger is used to add a warning to the notification table when a
command not enabled as per the device type specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_DEVICE_TYPE_COMMAND_SPEC_COMPLIANCE_MESSAGE
AFTER
  UPDATE ON ENDPOINT_TYPE_COMMAND
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE_COMMAND
    ON
      ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
    INNER JOIN
      DEVICE_TYPE_COMMAND
    ON
      ENDPOINT_TYPE_COMMAND.COMMAND_REF = DEVICE_TYPE_COMMAND.COMMAND_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_COMMAND.COMMAND_REF = new.COMMAND_REF
    AND
      ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = new.ENDPOINT_TYPE_CLUSTER_REF
    AND
      ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
    AND
      ENDPOINT_TYPE_COMMAND.IS_ENABLED = 0
    AND
      ENDPOINT_TYPE_CLUSTER.ENABLED = 1) > 0
BEGIN
  INSERT INTO
    SESSION_NOTICE(SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN)
  VALUES
    (
      (
        SELECT
          SESSION_PARTITION.SESSION_REF
        FROM
          ENDPOINT_TYPE_COMMAND
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
        INNER JOIN
          SESSION_PARTITION
        ON
          SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
      ),
      "WARNING",
      "⚠ Check Device Type Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_COMMAND
        ON
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
      )
      ||
      ", cluster: "
      ||
      (
        SELECT
          CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
        FROM
          CLUSTER
        INNER JOIN
          COMMAND
        ON
          COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE_COMMAND
        ON
          ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
          ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
      )
      ||
      ", command: "
      ||
      (
        SELECT
          COMMAND.NAME || " " || CASE WHEN ENDPOINT_TYPE_COMMAND.IS_INCOMING THEN "incoming" ELSE "outgoing" END
        FROM
          COMMAND
        INNER JOIN
          ENDPOINT_TYPE_COMMAND
        ON
          ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
          ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
      )
      ||
      " needs to be enabled",
      1,
      1,
      0
    );
END;

/*
SQL Trigger for Cluster's command Compliance.
This trigger is used to add a warning to the notification table when a
command is not enabled as per the cluster specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_CLUSTER_COMMAND_SPEC_COMPLIANCE_MESSAGE
AFTER
  UPDATE ON ENDPOINT_TYPE_COMMAND
WHEN
  (
    (
      SELECT
        COMMAND.IS_OPTIONAL
      FROM
        COMMAND
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
      AND
        ENDPOINT_TYPE_CLUSTER.ENABLED=1) == 0
    AND
      new.IS_ENABLED = 0
  )
BEGIN
  INSERT INTO
    SESSION_NOTICE(SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN)
  VALUES
    (
      (
        SELECT
          SESSION_PARTITION.SESSION_REF
        FROM
          ENDPOINT_TYPE_COMMAND
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
        INNER JOIN
          SESSION_PARTITION
        ON
          SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
      ),
      "WARNING",
      "⚠ Check Cluster Compliance on endpoint: "
      ||
      (
        SELECT
          ENDPOINT.ENDPOINT_IDENTIFIER
        FROM
          ENDPOINT
        INNER JOIN
          ENDPOINT_TYPE
        ON
          ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
        INNER JOIN
          ENDPOINT_TYPE_COMMAND
        ON
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
      )
      ||
      ", cluster: "
      ||
      (
        SELECT
          CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
        FROM
          CLUSTER
        INNER JOIN
          COMMAND
        ON
          COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
        INNER JOIN
          ENDPOINT_TYPE_COMMAND
        ON
          ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
        INNER JOIN
          ENDPOINT_TYPE_CLUSTER
        ON
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
          ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
      )
      ||
      ", mandatory command: "
      ||
      (
        SELECT
          COMMAND.NAME || " " || CASE WHEN ENDPOINT_TYPE_COMMAND.IS_INCOMING THEN "incoming" ELSE "outgoing" END
        FROM
          COMMAND
        INNER JOIN
          ENDPOINT_TYPE_COMMAND
        ON
          ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
        WHERE
          ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
          ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
      )
      ||
      " needs to be enabled",
      1,
      1,
      0
    );
END;


/*
SQL Update Trigger for Device Type command Compliance.
This trigger is used to remove a warning from the notification table when a
command is enabled as per the device type specification.
Note: An update happens when the command is already present in the
endpoint_type_command table
*/
CREATE TRIGGER
  UPDATE_TRIGGER_DEVICE_TYPE_COMMAND_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  UPDATE ON ENDPOINT_TYPE_COMMAND
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_COMMAND
    INNER JOIN
      DEVICE_TYPE_COMMAND
    ON
      ENDPOINT_TYPE_COMMAND.COMMAND_REF = DEVICE_TYPE_COMMAND.COMMAND_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_COMMAND.COMMAND_REF = new.COMMAND_REF
    AND
      ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = new.ENDPOINT_TYPE_CLUSTER_REF
    AND
      ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
    AND
      ENDPOINT_TYPE_COMMAND.IS_ENABLED = 1) > 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Device Type Compliance on endpoint: "
        ||
        (
          SELECT
            ENDPOINT.ENDPOINT_IDENTIFIER
          FROM
            ENDPOINT
          INNER JOIN
            ENDPOINT_TYPE
          ON
            ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
        )
        ||
        "%, cluster: "
        ||
        (
          SELECT
            CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
          FROM
            CLUSTER
          INNER JOIN
            COMMAND
          ON
            COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        ", command: "
        ||
        (
          SELECT
            COMMAND.NAME || " " || CASE WHEN ENDPOINT_TYPE_COMMAND.IS_INCOMING THEN "incoming" ELSE "outgoing" END
          FROM
            COMMAND
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        " needs to be enabled"
      );
END;

/*
SQL Trigger for Cluster's command Compliance.
This trigger is used to remove a warning to the notification table when a
command is enabled as per the cluster specification.
*/
CREATE TRIGGER
  UPDATE_TRIGGER_CLUSTER_COMMAND_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  UPDATE ON ENDPOINT_TYPE_COMMAND
WHEN
  (
    (
      SELECT
        COMMAND.IS_OPTIONAL
      FROM
        COMMAND
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID) == 0
    AND
      new.IS_ENABLED = 1
  )
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Cluster Compliance on endpoint: "
        ||
        (
          SELECT
            ENDPOINT.ENDPOINT_IDENTIFIER
          FROM
            ENDPOINT
          INNER JOIN
            ENDPOINT_TYPE
          ON
            ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
        )
        ||
        "%, cluster: "
        ||
        (
          SELECT
            CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
          FROM
            CLUSTER
          INNER JOIN
            COMMAND
          ON
            COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        ", mandatory command: "
        ||
        (
          SELECT
            COMMAND.NAME || " " || CASE WHEN ENDPOINT_TYPE_COMMAND.IS_INCOMING THEN "incoming" ELSE "outgoing" END
          FROM
            COMMAND
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        " needs to be enabled"
      );
END;


/*
SQL Insert Trigger for Device Type command Compliance.
This trigger is used to remove a warning from the notification table when a
command is enabled as per the device type specification.
Note: An insert happens when the command is not already present in the
endpoint_type_command table
*/
CREATE TRIGGER
  INSERT_TRIGGER_DEVICE_TYPE_COMMAND_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  INSERT ON ENDPOINT_TYPE_COMMAND
WHEN
  (
    SELECT
      COUNT()
    FROM
      ENDPOINT_TYPE_COMMAND
    INNER JOIN
      DEVICE_TYPE_COMMAND
    ON
      ENDPOINT_TYPE_COMMAND.COMMAND_REF = DEVICE_TYPE_COMMAND.COMMAND_REF
    INNER JOIN
      DEVICE_TYPE_CLUSTER
    ON
      DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
    WHERE
      ENDPOINT_TYPE_COMMAND.COMMAND_REF = new.COMMAND_REF
    AND
      ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = new.ENDPOINT_TYPE_CLUSTER_REF
    AND
      ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
    AND
      ENDPOINT_TYPE_COMMAND.IS_ENABLED = 1) > 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Device Type Compliance on endpoint: "
        ||
        (
          SELECT
            ENDPOINT.ENDPOINT_IDENTIFIER
          FROM
            ENDPOINT
          INNER JOIN
            ENDPOINT_TYPE
          ON
            ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
        )
        ||
        "%, cluster: "
        ||
        (
          SELECT
            CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
          FROM
            CLUSTER
          INNER JOIN
            COMMAND
          ON
            COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        ", command: "
        ||
        (
          SELECT
            COMMAND.NAME || " " || CASE WHEN ENDPOINT_TYPE_COMMAND.IS_INCOMING THEN "incoming" ELSE "outgoing" END
          FROM
            COMMAND
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        " needs to be enabled"
      );
END;

/*
SQL Trigger for Cluster's command Compliance.
This trigger is used to remove a warning to the notification table when a
command is enabled as per the cluster specification.
Note: An insert to the endpoint type command table happens when the command
is not present in the table.
*/
CREATE TRIGGER
  INSERT_TRIGGER_CLUSTER_COMMAND_SPEC_COMPLIANCE_MESSAGE_REMOVAL
AFTER
  INSERT ON ENDPOINT_TYPE_COMMAND
WHEN
  (
    (
      SELECT
        COMMAND.IS_OPTIONAL
      FROM
        COMMAND
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID) == 0
    AND
      new.IS_ENABLED = 1
  )
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        SESSION_REF
      FROM
        ENDPOINT_TYPE
      INNER JOIN
        ENDPOINT_TYPE_CLUSTER
      ON
        ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE_COMMAND
      ON
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
      WHERE
        ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
    )
    AND
      NOTICE_TYPE="WARNING"
    AND
      NOTICE_MESSAGE LIKE
      (
        "⚠ Check Cluster Compliance on endpoint: "
        ||
        (
          SELECT
            ENDPOINT.ENDPOINT_IDENTIFIER
          FROM
            ENDPOINT
          INNER JOIN
            ENDPOINT_TYPE
          ON
            ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID
        )
        ||
        "%, cluster: "
        ||
        (
          SELECT
            CLUSTER.NAME || " " || ENDPOINT_TYPE_CLUSTER.SIDE
          FROM
            CLUSTER
          INNER JOIN
            COMMAND
          ON
            COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          INNER JOIN
            ENDPOINT_TYPE_CLUSTER
          ON
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        ", mandatory command: "
        ||
        (
          SELECT
            COMMAND.NAME || " " || CASE WHEN ENDPOINT_TYPE_COMMAND.IS_INCOMING THEN "incoming" ELSE "outgoing" END
          FROM
            COMMAND
          INNER JOIN
            ENDPOINT_TYPE_COMMAND
          ON
            ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
          WHERE
            ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_COMMAND_ID = new.ENDPOINT_TYPE_COMMAND_ID AND
            ENDPOINT_TYPE_COMMAND.IS_INCOMING = new.IS_INCOMING
        )
        ||
        " needs to be enabled"
      );
END;

/*
 ENDPOINT_TYPE_EVENT table contains the user data configuration for the various parameters that exist
 for events on an endpoint. This essentially lets you determine if something should be included or not.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_EVENT";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_EVENT" (
  "ENDPOINT_TYPE_EVENT_ID" integer primary key autoincrement,
  "ENDPOINT_TYPE_CLUSTER_REF" integer,
  "EVENT_REF" integer,
  "INCLUDED" integer default false,
  foreign key (ENDPOINT_TYPE_CLUSTER_REF) references ENDPOINT_TYPE_CLUSTER(ENDPOINT_TYPE_CLUSTER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (EVENT_REF) references EVENT(EVENT_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(
    EVENT_REF,
    ENDPOINT_TYPE_CLUSTER_REF
  )
);
/**
 PACKAGE_EXTENSION_VALUE contains the value of the given package
 extension for a given entity.
 */
DROP TABLE IF EXISTS "PACKAGE_EXTENSION_VALUE";
CREATE TABLE IF NOT EXISTS "PACKAGE_EXTENSION_VALUE" (
  "PACKAGE_EXTENSION_VALUE_ID" integer primary key autoincrement,
  "PACKAGE_EXTENSION_REF" integer,
  "SESSION_REF" integer,
  "ENTITY_CODE" integer,
  "PARENT_CODE" integer,
  "VALUE" text,
  foreign key (PACKAGE_EXTENSION_REF) references PACKAGE_EXTENSION(PACKAGE_EXTENSION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(
    PACKAGE_EXTENSION_REF,
    SESSION_REF,
    ENTITY_CODE,
    PARENT_CODE
  )
);
/*
 *
 * $$$$$$$$\        $$\
 * \__$$  __|       \__|
 *    $$ | $$$$$$\  $$\  $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$$\
 *    $$ |$$  __$$\ $$ |$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$  _____|
 *    $$ |$$ |  \__|$$ |$$ /  $$ |$$ /  $$ |$$$$$$$$ |$$ |  \__|\$$$$$$\
 *    $$ |$$ |      $$ |$$ |  $$ |$$ |  $$ |$$   ____|$$ |       \____$$\
 *    $$ |$$ |      $$ |\$$$$$$$ |\$$$$$$$ |\$$$$$$$\ $$ |      $$$$$$$  |
 *    \__|\__|      \__| \____$$ | \____$$ | \_______|\__|      \_______/
 *                      $$\   $$ |$$\   $$ |
 *                      \$$$$$$  |\$$$$$$  |
 *                       \______/  \______/
 */
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_SESSION_KEY_VALUE"
AFTER
INSERT ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_SESSION_PACKAGE"
AFTER
INSERT ON "SESSION_PACKAGE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (SELECT SESSION_REF FROM SESSION_PARTITION WHERE SESSION_PARTITION.SESSION_PARTITION_ID = NEW.SESSION_PARTITION_REF);
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_SESSION_KEY_VALUE"
AFTER
UPDATE ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_SESSION_PACKAGE"
AFTER
UPDATE ON "SESSION_PACKAGE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (SELECT SESSION_REF FROM SESSION_PARTITION WHERE SESSION_PARTITION.SESSION_PARTITION_ID = NEW.SESSION_PARTITION_REF);
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_SESSION_KEY_VALUE"
AFTER DELETE ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = OLD.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_SESSION_LOG"
AFTER
INSERT ON "SESSION_LOG" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_SESSION_LOG"
AFTER
UPDATE ON "SESSION_LOG" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_SESSION_LOG"
AFTER DELETE ON "SESSION_LOG" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = OLD.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE"
AFTER
INSERT ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (SELECT SESSION_REF FROM SESSION_PARTITION WHERE SESSION_PARTITION.SESSION_PARTITION_ID = NEW.SESSION_PARTITION_REF);
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE"
AFTER
UPDATE ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (SELECT SESSION_REF FROM SESSION_PARTITION WHERE SESSION_PARTITION.SESSION_PARTITION_ID = NEW.SESSION_PARTITION_REF);
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE"
AFTER DELETE ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (SELECT SESSION_REF FROM SESSION_PARTITION WHERE SESSION_PARTITION.SESSION_PARTITION_ID = OLD.SESSION_PARTITION_REF);
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT"
AFTER
INSERT ON "ENDPOINT" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT"
AFTER
UPDATE ON "ENDPOINT" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT"
AFTER DELETE ON "ENDPOINT" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = OLD.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
INSERT ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_PARTITION.SESSION_REF
    FROM ENDPOINT_TYPE
    INNER JOIN SESSION_PARTITION
    ON SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE ENDPOINT_TYPE.ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
UPDATE ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_PARTITION.SESSION_REF
    FROM ENDPOINT_TYPE
    INNER JOIN SESSION_PARTITION
    ON SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE ENDPOINT_TYPE.ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER DELETE ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_PARTITION.SESSION_REF
    FROM ENDPOINT_TYPE
    INNER JOIN SESSION_PARTITION
    ON SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE ENDPOINT_TYPE.ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
INSERT ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = NEW.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
UPDATE ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = NEW.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER DELETE ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = OLD.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
INSERT ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = NEW.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
UPDATE ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = NEW.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER DELETE ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = OLD.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_EVENT"
AFTER
INSERT ON "ENDPOINT_TYPE_EVENT" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = NEW.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_EVENT"
AFTER
UPDATE ON "ENDPOINT_TYPE_EVENT" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = NEW.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_EVENT"
AFTER DELETE ON "ENDPOINT_TYPE_EVENT" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT
      SESSION_PARTITION.SESSION_REF
    FROM
      ENDPOINT_TYPE_CLUSTER
    INNER JOIN
      ENDPOINT_TYPE
    ON
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = OLD.ENDPOINT_TYPE_CLUSTER_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_PACKAGE_EXTENSION_VALUE"
AFTER
INSERT ON "PACKAGE_EXTENSION_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_PACKAGE_EXTENSION_VALUE"
AFTER
UPDATE ON "PACKAGE_EXTENSION_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_PACKAGE_EXTENSION_VALUE"
AFTER DELETE ON "PACKAGE_EXTENSION_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = OLD.SESSION_REF;
END;

/* Triggers that deal with code conflicts in custom xml */

/* Trigger that deals with code conflicts in clusters when new session package is inserted */
CREATE TRIGGER CLUSTER_CODE_CONFLICT_MESSAGE_ON_INSERT
AFTER INSERT ON SESSION_PACKAGE
WHEN
  EXISTS(
    SELECT
      1
    FROM
      SESSION_PACKAGE spk
    JOIN
      PACKAGE p
    ON
      spk.PACKAGE_REF = p.PACKAGE_ID
    WHERE
      p.TYPE = 'zcl-xml-standalone'
    AND
      spk.package_ref = NEW.package_ref
    AND
      NEW.ENABLED = true
  )
BEGIN
  INSERT INTO SESSION_NOTICE(
    SESSION_REF,
    NOTICE_TYPE,
    NOTICE_MESSAGE,
    NOTICE_SEVERITY,
    DISPLAY,
    SEEN
  )
  SELECT
    spt.SESSION_REF,
    'ERROR',
    'Cluster code conflict in ' || p.PATH || ' and ' || p2.PATH || ' for ' || c.CODE,
    2,
    1,
    0
  FROM
    CLUSTER c
  INNER JOIN
    PACKAGE p
  ON
    c.PACKAGE_REF = p.PACKAGE_ID
  INNER JOIN
    SESSION_PACKAGE spk
  ON
   	p.PACKAGE_ID = spk.PACKAGE_REF
  INNER JOIN
    SESSION_PARTITION spt
  ON
    spk.SESSION_PARTITION_REF = spt.SESSION_PARTITION_ID
  INNER JOIN
    SESSION_PARTITION spt2
  ON
    spt.SESSION_REF = spt2.SESSION_REF
  INNER JOIN
    SESSION_PACKAGE spk2
  ON
    spt2.SESSION_PARTITION_ID = spk2.SESSION_PARTITION_REF
  INNER JOIN
    PACKAGE p2
  ON
    spk2.PACKAGE_REF = p2.PACKAGE_ID
  INNER JOIN
    CLUSTER c2
  ON
    p2.PACKAGE_ID = c2.PACKAGE_REF
  WHERE
    spk.SESSION_PARTITION_REF = NEW.SESSION_PARTITION_REF
  AND
    spk.PACKAGE_REF = NEW.PACKAGE_REF
  AND
    spk2.ENABLED = true
  AND
    ((c.CODE = c2.CODE AND c.MANUFACTURER_CODE = c2.MANUFACTURER_CODE)
    OR
    (c.CODE = c2.CODE AND (c.MANUFACTURER_CODE IS NULL OR c.MANUFACTURER_CODE=0) AND (c2.MANUFACTURER_CODE IS NULL OR c2.MANUFACTURER_CODE=0)))
  AND
    p.PACKAGE_ID <> p2.PACKAGE_ID;
END;

/* Trigger that deals with code conflicts in clusters when a session package is re-enabled */
CREATE TRIGGER CLUSTER_CODE_CONFLICT_MESSAGE_ON_UPDATE
AFTER UPDATE ON SESSION_PACKAGE
WHEN
  EXISTS(
    SELECT
      1
    FROM
      SESSION_PACKAGE spk
    JOIN
      PACKAGE p
    ON
      spk.PACKAGE_REF = p.PACKAGE_ID
    WHERE
      p.TYPE = 'zcl-xml-standalone'
    AND
      spk.package_ref = NEW.package_ref
    AND
      OLD.ENABLED = false
    AND
      NEW.ENABLED = true
  )
BEGIN
  INSERT INTO SESSION_NOTICE(
    SESSION_REF,
    NOTICE_TYPE,
    NOTICE_MESSAGE,
    NOTICE_SEVERITY,
    DISPLAY,
    SEEN
  )
  SELECT
    spt.SESSION_REF,
    'ERROR',
    'Cluster code conflict in ' || p.PATH || ' and ' || p2.PATH || ' for ' || c.CODE,
    2,
    1,
    0
  FROM
    CLUSTER c
  INNER JOIN
    PACKAGE p
  ON
    c.PACKAGE_REF = p.PACKAGE_ID
  INNER JOIN
  	SESSION_PACKAGE spk
  ON
   	p.PACKAGE_ID = spk.PACKAGE_REF
  INNER JOIN
    SESSION_PARTITION spt
  ON
    spk.SESSION_PARTITION_REF = spt.SESSION_PARTITION_ID
  INNER JOIN
    SESSION_PARTITION spt2
  ON
    spt.SESSION_REF = spt2.SESSION_REF
  INNER JOIN
    SESSION_PACKAGE spk2
  ON
    spt2.SESSION_PARTITION_ID = spk2.SESSION_PARTITION_REF
  INNER JOIN
    PACKAGE p2
  ON
    spk2.PACKAGE_REF = p2.PACKAGE_ID
  INNER JOIN
    CLUSTER c2
  ON
    p2.PACKAGE_ID = c2.PACKAGE_REF
  WHERE
    spk.SESSION_PARTITION_REF = NEW.SESSION_PARTITION_REF
  AND
    spk.PACKAGE_REF = NEW.PACKAGE_REF
  AND
    spk2.ENABLED = true
  AND
    ((c.CODE = c2.CODE AND c.MANUFACTURER_CODE = c2.MANUFACTURER_CODE)
    OR
    (c.CODE = c2.CODE AND (c.MANUFACTURER_CODE IS NULL OR c.MANUFACTURER_CODE=0) AND (c2.MANUFACTURER_CODE IS NULL OR c2.MANUFACTURER_CODE=0)))
  AND
    p.PACKAGE_ID <> p2.PACKAGE_ID;
END;


/* Trigger that deals wuth code conflicts in attributes when a session package is inserted */
CREATE TRIGGER ATTRIBUTE_CODE_CONFLICT_MESSAGE_ON_INSERT
AFTER INSERT ON SESSION_PACKAGE
WHEN
  EXISTS(
    SELECT
      1
    FROM
      SESSION_PACKAGE spk
    JOIN
      PACKAGE p
    ON
      spk.PACKAGE_REF = p.PACKAGE_ID
    WHERE
      p.TYPE = 'zcl-xml-standalone'
    AND
      spk.package_ref = NEW.package_ref
    AND
      NEW.ENABLED = true
  )
BEGIN
  INSERT INTO SESSION_NOTICE(
    SESSION_REF,
    NOTICE_TYPE,
    NOTICE_MESSAGE,
    NOTICE_SEVERITY,
    DISPLAY,
    SEEN
  )
  SELECT
    spt.SESSION_REF,
    'ERROR',
    'Attribute code conflict in ' || p.PATH || ' and ' || p2.PATH || ' in attribute=' || a.CODE || ' cluster=' || a.CLUSTER_REF,
    2,
    1,
    0
  FROM
    ATTRIBUTE a
  INNER JOIN
    PACKAGE p
  ON
    a.PACKAGE_REF = p.PACKAGE_ID
  INNER JOIN
    SESSION_PACKAGE spk
  ON
    p.PACKAGE_ID = spk.PACKAGE_REF
  INNER JOIN
    SESSION_PARTITION spt
  ON
    spk.SESSION_PARTITION_REF = spt.SESSION_PARTITION_ID
  INNER JOIN
    SESSION_PARTITION spt2
  ON
    spt.SESSION_REF = spt2.SESSION_REF
  INNER JOIN
    SESSION_PACKAGE spk2
  ON
    spt2.SESSION_PARTITION_ID = spk2.SESSION_PARTITION_REF
  INNER JOIN
    PACKAGE p2
  ON
    spk2.PACKAGE_REF = p2.PACKAGE_ID
  INNER JOIN
    ATTRIBUTE a2
  ON
    p2.PACKAGE_ID = a2.PACKAGE_REF
  WHERE
    spk.SESSION_PARTITION_REF = NEW.SESSION_PARTITION_REF
  AND
    spk.PACKAGE_REF = NEW.PACKAGE_REF
  AND
    spk2.ENABLED = true
  AND
    a.CLUSTER_REF = a2.CLUSTER_REF
  AND
    ((a.CODE = a2.CODE AND a.MANUFACTURER_CODE = a2.MANUFACTURER_CODE)
      OR
     (a.CODE = a2.CODE AND (a.MANUFACTURER_CODE IS NULL OR a.MANUFACTURER_CODE=0) AND (a2.MANUFACTURER_CODE IS NULL OR a2.MANUFACTURER_CODE=0)))
  AND
    p.PACKAGE_ID <> p2.PACKAGE_ID;
END;

/* Trigger that deals with code conflicts in attributes when a session package is re-enabled */
CREATE TRIGGER ATTRIBUTE_CODE_CONFLICT_MESSAGE_ON_UPDATE
AFTER UPDATE ON SESSION_PACKAGE
WHEN
  EXISTS(
    SELECT
      1
    FROM
      SESSION_PACKAGE spk
    JOIN
      PACKAGE p
    ON
      spk.PACKAGE_REF = p.PACKAGE_ID
    WHERE
      p.TYPE = 'zcl-xml-standalone'
    AND
      spk.package_ref = NEW.package_ref
    AND
      OLD.ENABLED = false
    AND
      NEW.ENABLED = true
  )
BEGIN
  INSERT INTO SESSION_NOTICE(
    SESSION_REF,
    NOTICE_TYPE,
    NOTICE_MESSAGE,
    NOTICE_SEVERITY,
    DISPLAY,
    SEEN
  )
  SELECT
    spt.SESSION_REF,
    'ERROR',
    'Attribute code conflict in ' || p.PATH || ' and ' || p2.PATH || ' in attribute=' || a.CODE || ' cluster=' || a.CLUSTER_REF,
    2,
    1,
    0
  FROM
    ATTRIBUTE a
  INNER JOIN
    PACKAGE p
  ON
    a.PACKAGE_REF = p.PACKAGE_ID
  INNER JOIN
    SESSION_PACKAGE spk
  ON
    p.PACKAGE_ID = spk.PACKAGE_REF
  INNER JOIN
    SESSION_PARTITION spt
  ON
    spk.SESSION_PARTITION_REF = spt.SESSION_PARTITION_ID
  INNER JOIN
    SESSION_PARTITION spt2
  ON
    spt.SESSION_REF = spt2.SESSION_REF
  INNER JOIN
    SESSION_PACKAGE spk2
  ON
    spt2.SESSION_PARTITION_ID = spk2.SESSION_PARTITION_REF
  INNER JOIN
    PACKAGE p2
  ON
    spk2.PACKAGE_REF = p2.PACKAGE_ID
  INNER JOIN
    ATTRIBUTE a2
  ON
    p2.PACKAGE_ID = a2.PACKAGE_REF
  WHERE
    spk.SESSION_PARTITION_REF = NEW.SESSION_PARTITION_REF
  AND
    spk.PACKAGE_REF = NEW.PACKAGE_REF
  AND
    spk2.ENABLED = true
  AND
    a.CLUSTER_REF = a2.CLUSTER_REF
  AND
    ((a.CODE = a2.CODE AND a.MANUFACTURER_CODE = a2.MANUFACTURER_CODE)
      OR
    (a.CODE = a2.CODE AND (a.MANUFACTURER_CODE IS NULL OR a.MANUFACTURER_CODE=0) AND (a2.MANUFACTURER_CODE IS NULL OR a2.MANUFACTURER_CODE=0)))
  AND
    p.PACKAGE_ID <> p2.PACKAGE_ID;
END;


/* Trigger that deals with code conflicts in commands when a session package is inserted */
CREATE TRIGGER COMMAND_CODE_CONFLICT_MESSAGE_ON_INSERT
AFTER INSERT ON SESSION_PACKAGE
WHEN
  EXISTS(
    SELECT
      1
    FROM
      SESSION_PACKAGE spk
    JOIN
      PACKAGE p
    ON
      spk.PACKAGE_REF = p.PACKAGE_ID
    WHERE
      p.TYPE = 'zcl-xml-standalone'
    AND
      spk.package_ref = NEW.package_ref
    AND
      NEW.ENABLED = true
  )
BEGIN
  INSERT INTO SESSION_NOTICE(
    SESSION_REF,
    NOTICE_TYPE,
    NOTICE_MESSAGE,
    NOTICE_SEVERITY,
    DISPLAY,
    SEEN
  )
  SELECT
    spt.SESSION_REF,
    'ERROR',
    'Command code conflict in ' || p.PATH || ' and ' || p2.PATH || ' in command=' || c.CODE || ' cluster=' || c.CLUSTER_REF,
    2,
    1,
    0
  FROM
    COMMAND c
  INNER JOIN
    PACKAGE p
  ON c.PACKAGE_REF = p.PACKAGE_ID
  INNER JOIN
   SESSION_PACKAGE spk
  ON
    p.PACKAGE_ID = spk.PACKAGE_REF
  INNER JOIN
    SESSION_PARTITION spt
  ON
    spk.SESSION_PARTITION_REF = spt.SESSION_PARTITION_ID
  INNER JOIN
    SESSION_PARTITION spt2
  ON
    spt.SESSION_REF = spt2.SESSION_REF
  INNER JOIN
    SESSION_PACKAGE spk2
  ON
    spt2.SESSION_PARTITION_ID = spk2.SESSION_PARTITION_REF
  INNER JOIN
    PACKAGE p2
  ON
    spk2.PACKAGE_REF = p2.PACKAGE_ID
  INNER JOIN
    COMMAND c2
  ON
    p2.PACKAGE_ID = c2.PACKAGE_REF
  WHERE
    spk.SESSION_PARTITION_REF = NEW.SESSION_PARTITION_REF
  AND
    spk.PACKAGE_REF = NEW.PACKAGE_REF
  AND
    spk2.ENABLED = true
  AND
    c.CLUSTER_REF = c2.CLUSTER_REF
  AND
    ((c.CODE = c2.CODE AND c.MANUFACTURER_CODE = c2.MANUFACTURER_CODE)
    OR
    (c.CODE = c2.CODE AND (c.MANUFACTURER_CODE IS NULL OR c.MANUFACTURER_CODE=0) AND (c2.MANUFACTURER_CODE IS NULL OR c2.MANUFACTURER_CODE=0)))
  AND
    p.PACKAGE_ID <> p2.PACKAGE_ID;
END;

/* Trigger that deals with code conflicts in commands when a session package is re-enabled */
CREATE TRIGGER COMMAND_CODE_CONFLICT_MESSAGE_ON_UPDATE
AFTER UPDATE ON SESSION_PACKAGE
WHEN
  EXISTS(
    SELECT
      1
    FROM
      SESSION_PACKAGE spk
    JOIN
      PACKAGE p
    ON
      spk.PACKAGE_REF = p.PACKAGE_ID
    WHERE
      p.TYPE = 'zcl-xml-standalone'
    AND
      spk.package_ref = NEW.package_ref
    AND
      OLD.ENABLED = false
    AND
      NEW.ENABLED = true
  )
BEGIN
  INSERT INTO SESSION_NOTICE(
    SESSION_REF,
    NOTICE_TYPE,
    NOTICE_MESSAGE,
    NOTICE_SEVERITY,
    DISPLAY,
    SEEN
  )
  SELECT
    spt.SESSION_REF,
    'ERROR',
    'Command code conflict in ' || p.PATH || ' and ' || p2.PATH || ' in command=' || c.CODE || ' cluster=' || c.CLUSTER_REF,
    2,
    1,
    0
  FROM
    COMMAND c
  INNER JOIN
    PACKAGE p
  ON c.PACKAGE_REF = p.PACKAGE_ID
  INNER JOIN
   SESSION_PACKAGE spk
  ON
    p.PACKAGE_ID = spk.PACKAGE_REF
  INNER JOIN
    SESSION_PARTITION spt
  ON
    spk.SESSION_PARTITION_REF = spt.SESSION_PARTITION_ID
  INNER JOIN
    SESSION_PARTITION spt2
  ON
    spt.SESSION_REF = spt2.SESSION_REF
  INNER JOIN
    SESSION_PACKAGE spk2
  ON
    spt2.SESSION_PARTITION_ID = spk2.SESSION_PARTITION_REF
  INNER JOIN
    PACKAGE p2
  ON
    spk2.PACKAGE_REF = p2.PACKAGE_ID
  INNER JOIN
    COMMAND c2
  ON
    p2.PACKAGE_ID = c2.PACKAGE_REF
  WHERE
    spk.SESSION_PARTITION_REF = NEW.SESSION_PARTITION_REF
  AND
    spk.PACKAGE_REF = NEW.PACKAGE_REF
  AND
    spk2.ENABLED = true
  AND
    c.CLUSTER_REF = c2.CLUSTER_REF
  AND
    ((c.CODE = c2.CODE AND c.MANUFACTURER_CODE = c2.MANUFACTURER_CODE)
    OR
    (c.CODE = c2.CODE AND (c.MANUFACTURER_CODE IS NULL OR c.MANUFACTURER_CODE=0) AND (c2.MANUFACTURER_CODE IS NULL OR c2.MANUFACTURER_CODE=0)))
  AND
    p.PACKAGE_ID <> p2.PACKAGE_ID;
END;

/* Trigger that deletes relevant code conflict session_notice entries when a session package is disabled */
CREATE TRIGGER CODE_CONFLICT_DELETE_ON_DISABLE
AFTER UPDATE ON SESSION_PACKAGE
WHEN
    OLD.ENABLED = 1
  AND
    NEW.ENABLED = 0
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        spt.SESSION_REF
      FROM
        SESSION_PARTITION spt
      WHERE
        spt.SESSION_PARTITION_ID = OLD.SESSION_PARTITION_REF
    )
  AND
    NOTICE_TYPE = "ERROR"
  AND
    NOTICE_MESSAGE LIKE '%code conflict%'
  AND
    NOTICE_MESSAGE LIKE '%' || (SELECT p.PATH FROM PACKAGE p WHERE p.PACKAGE_ID = OLD.PACKAGE_REF) || '%';
END;

/* Trigger that deletes relevant code conflict session_notice entries when a session package is deleted */
CREATE TRIGGER CODE_CONFLICT_DELETE
AFTER DELETE ON SESSION_PACKAGE
BEGIN
  DELETE FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = (
      SELECT
        spt.SESSION_REF
      FROM
        SESSION_PARTITION spt
      WHERE
        spt.SESSION_PARTITION_ID = OLD.SESSION_PARTITION_REF
    )
  AND
    NOTICE_TYPE = 'ERROR'
  AND
    NOTICE_MESSAGE LIKE '%code conflict%'
  AND
    NOTICE_MESSAGE LIKE '%' || (SELECT p.PATH FROM PACKAGE p WHERE p.PACKAGE_ID = OLD.PACKAGE_REF) || '%';
END;




/*
 *
 *  $$$$$$\  $$\           $$\                 $$\             $$\            $$\
 * $$  __$$\ $$ |          $$ |                $$ |            $$ |           $$ |
 * $$ /  \__|$$ | $$$$$$\  $$$$$$$\   $$$$$$\  $$ |       $$$$$$$ | $$$$$$\ $$$$$$\    $$$$$$\
 * $$ |$$$$\ $$ |$$  __$$\ $$  __$$\  \____$$\ $$ |      $$  __$$ | \____$$\\_$$  _|   \____$$\
 * $$ |\_$$ |$$ |$$ /  $$ |$$ |  $$ | $$$$$$$ |$$ |      $$ /  $$ | $$$$$$$ | $$ |     $$$$$$$ |
 * $$ |  $$ |$$ |$$ |  $$ |$$ |  $$ |$$  __$$ |$$ |      $$ |  $$ |$$  __$$ | $$ |$$\ $$  __$$ |
 * \$$$$$$  |$$ |\$$$$$$  |$$$$$$$  |\$$$$$$$ |$$ |      \$$$$$$$ |\$$$$$$$ | \$$$$  |\$$$$$$$ |
 *  \______/ \__| \______/ \_______/  \_______|\__|       \_______| \_______|  \____/  \_______|
 */
/*
 Random settings, essentially application preferences
 */
CREATE TABLE IF NOT EXISTS "SETTING" (
  "CATEGORY" text,
  "KEY" text,
  "VALUE" text,
  UNIQUE(CATEGORY, KEY)
);
/*
 Session Notification table
 */
CREATE TABLE IF NOT EXISTS "SESSION_NOTICE" (
  "SESSION_REF" integer,
  "NOTICE_TYPE" text,
  "NOTICE_MESSAGE" text,
  "NOTICE_SEVERITY" integer,
  "NOTICE_ID" integer primary key autoincrement,
  "DISPLAY" integer,
  "SEEN" integer,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/*
Trigger to prevent any null message entries into the session notice table during endpoint creation.
*/
CREATE TRIGGER
  DELETE_SESSION_NOTICE_ON_NULL
AFTER INSERT ON
  SESSION_NOTICE
WHEN
  NEW.NOTICE_MESSAGE IS NULL
BEGIN
  DELETE FROM SESSION_NOTICE WHERE NOTICE_ID = new.NOTICE_ID;
END;

/*
Trigger to set new notification flag in session table when there is a new
notification in the session notice table that has not been seen.
*/
CREATE TRIGGER
  INSERT_SESSION_NOTICE_TRIGGER
AFTER INSERT ON
  SESSION_NOTICE
WHEN
  (SELECT
    COUNT()
  FROM
    SESSION_NOTICE
  WHERE
    SESSION_REF = new.SESSION_REF
    AND SEEN = 0) > 0
BEGIN
  UPDATE SESSION SET NEW_NOTIFICATION = 1 WHERE SESSION_ID = new.SESSION_REF;
END;

/*
Trigger to set new notification flag in session table when session
notifications are removed but there are unseen session notifications.
*/
CREATE TRIGGER
  DELETE_SESSION_NOTICE_TRIGGER
AFTER DELETE ON
  SESSION_NOTICE
BEGIN
  UPDATE SESSION SET NEW_NOTIFICATION = 1 WHERE SESSION_ID = old.SESSION_REF;
END;

/*
 Package Notification table
 */
CREATE TABLE IF NOT EXISTS "PACKAGE_NOTICE" (
  "PACKAGE_REF" integer,
  "NOTICE_TYPE" text,
  "NOTICE_MESSAGE" text,
  "NOTICE_SEVERITY" integer,
  "NOTICE_ID" integer primary key autoincrement,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) ON DELETE CASCADE ON UPDATE CASCADE
);
/* EO SCHEMA */
