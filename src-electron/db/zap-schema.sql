/*
  PACKAGE table contains the "packages" that are the sources for the
  loading of the other data. They may be individual files, or
  collection of files.

  Table records the CRC at the time loading.
*/
CREATE TABLE IF NOT EXISTS "PACKAGE" (
  "PACKAGE_ID" integer primary key autoincrement,
  "PATH" text NOT NULL UNIQUE,
  "CRC" integer
);
/*
  CLUSTER table contains the clusters loaded from the ZCL XML files.
*/
CREATE TABLE IF NOT EXISTS "CLUSTER" (
  "CLUSTER_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "DEFINE" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
  COMMAND table contains commands contained inside a cluster.
*/
CREATE TABLE IF NOT EXISTS "COMMAND" (
  "COMMAND_ID" integer primary key autoincrement,
  "CLUSTER_REF" integer,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "DESCRIPTION" text,
  "SOURCE" text,
  "IS_OPTIONAL" integer,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID)
);
/*
  COMMAND_ARG table contains arguments for a command.
*/
CREATE TABLE IF NOT EXISTS "COMMAND_ARG" (
  "COMMAND_REF" integer,
  "NAME" text,
  "TYPE" text,
  "IS_ARRAY" integer,
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID)
);
/*
  ATTRIBUTE table contains attributes for the cluster.
*/
CREATE TABLE IF NOT EXISTS "ATTRIBUTE" (
  "ATTRIBUTE_ID" integer primary key autoincrement,
  "CLUSTER_REF" integer,
  "CODE" integer,
  "MANUFACTURER_CODE" integer,
  "NAME" text,
  "TYPE" text,
  "SIDE" text,
  "DEFINE" text,
  "MIN" text,
  "MAX" text,
  "IS_WRITABLE" integer,
  "DEFAULT_VALUE" text,
  "IS_OPTIONAL" integer,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID)
);
/*
  BITMAP table contains the bitmaps directly loaded from packages.
*/
CREATE TABLE IF NOT EXISTS "BITMAP" (
  "BITMAP_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  "TYPE" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
  BITMAP_FIELD contains items that make up a bitmap.
*/
CREATE TABLE IF NOT EXISTS "BITMAP_FIELD" (
  "BITMAP_REF" integer,
  "NAME" text,
  "MASK" integer,
  foreign key(BITMAP_REF) references BITMAP(BITMAP_ID)
);
/*
  DOMAIN table contains domains directly loaded from packages.
*/
CREATE TABLE IF NOT EXISTS "DOMAIN" (
  "DOMAIN_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
  ENUM table contains enums directly loaded from packages.
*/
CREATE TABLE IF NOT EXISTS "ENUM" (
  "ENUM_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  "TYPE" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
  ENUM_ITEM table contains individual enum items.
*/
CREATE TABLE IF NOT EXISTS "ENUM_ITEM" (
  "ENUM_REF" integer,
  "NAME" text,
  "VALUE" integer,
  foreign key (ENUM_REF) references ENUM(ENUM_ID)
);
/*
  STRUCT table contains structs directly loaded from packages.
*/
CREATE TABLE IF NOT EXISTS "STRUCT" (
  "STRUCT_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
  STRUCT_ITEM table contains individual struct items.
*/
CREATE TABLE IF NOT EXISTS "STRUCT_ITEM" (
  "STRUCT_REF" integer,
  "NAME" text,
  "TYPE" text,
  foreign key (STRUCT_REF) references STRUCT(STRUCT_ID)
);
/*
  DEVICE_TYPE table contains device types directly loaded from packages.
*/
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE" (
  "DEVICE_TYPE_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "CODE" integer,
  "PROFILE_ID" integer,
  "NAME" text,
  "DESCRIPTION" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);

/*
   DEVICE_TYPE_CLUSTER contains clusters that belong to the device type.
 */
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_CLUSTER" (
  "DEVICE_TYPE_REF" integer,
  "CLUSTER_REF" integer,
  "CLUSTER_NAME" text,
  "INCLUDE_CLIENT" integer,
  "INCLUDE_SERVER" integer,
  "LOCK_CLIENT" integer,
  "LOCK_SERVER" integer,
  foreign key (DEVICE_TYPE_REF) references DEVICE_TYPE(DEVICE_TYPE_ID),
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID)
);
/*
  SESSION table contains the list of known and remembered sessions.
  In case of electron SESSION_WINID is the window ID for a given
  session.
*/
CREATE TABLE IF NOT EXISTS "SESSION" (
  "SESSION_ID" integer primary key autoincrement,
  "SESSION_KEY" text,
  "SESSION_WINID" text,
  "CREATION_TIME" integer,
  "DIRTY" integer default 1,
  UNIQUE(SESSION_KEY)
);
/*
  SESSION_KEY_VALUE table contains the data points that are simple
  key/value pairs.
*/
CREATE TABLE IF NOT EXISTS "SESSION_KEY_VALUE" (
  "SESSION_REF" integer,
  "KEY" text,
  "VALUE" text,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade
);
/*
  ENDPOINT_TYPE contains the bulk of the configuration: clusters, attributes, etc.
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE" (
  "ENDPOINT_TYPE_ID" integer primary key autoincrement,
  "SESSION_REF" integer,
  "NAME" text,
  "DEVICE_TYPE_REF" integer,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade,
  foreign key(DEVICE_TYPE_REF) references DEVICE_TYPE(DEVICE_TYPE_ID)
);
/*
  ENDPOINT table contains the toplevel configured endpoints.
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT" (
  "ENDPOINT_REF" integer primary key autoincrement,
  "SESSION_REF" integer,
  "ENDPOINT_ID" integer,
  "ENDPOINT_TYPE_REF" integer,
  "PROFILE" integer,
  "NETWORK_ID" integer,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID)
);
/*
  SESSION_CLUSTER contains the on/off values for cluster.
  SIDE is client or server
  STATE is 1 for ON and 0 for OFF.
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_CLUSTER" (
  "ENDPOINT_TYPE_REF" integer,
  "CLUSTER_REF" integer,
  "SIDE" text,
  "ENABLED" integer,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID)
);
/*
  SETTING table contains site-specific application settings, regardless of a user configuration session.
  Essentially application preferences.
*/
CREATE TABLE IF NOT EXISTS "SETTING" (
  "CATEGORY" text,
  "KEY" text,
  "VALUE" text
);

/*
  Triggers to maintain "dirty" flag in a session.
 */