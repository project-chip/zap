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
 collection of files.
 
 Table records the CRC of the toplevel file at the time loading.
 */
DROP TABLE IF EXISTS "PACKAGE";
CREATE TABLE "PACKAGE" (
  "PACKAGE_ID" integer primary key autoincrement,
  "PARENT_PACKAGE_REF" integer,
  "PATH" text NOT NULL,
  "TYPE" text,
  "CRC" integer,
  "VERSION" text,
  foreign key (PARENT_PACKAGE_REF) references PACKAGE(PACKAGE_ID)
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
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID),
  UNIQUE(PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE)
);
/* 
 PACKAGE_OPTION_DEFAULT table contains a link to a specified 'default value' for an options
 */
DROP TABLE IF EXISTS "PACKAGE_OPTION_DEFAULT";
CREATE TABLE "PACKAGE_OPTION_DEFAULT" (
  "OPTION_DEFAULT_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "OPTION_CATEGORY" text,
  "OPTION_REF" integer,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) on delete cascade,
  foreign key (OPTION_REF) references PACKAGE_OPTION(OPTION_ID) on delete cascade,
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
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID),
  UNIQUE(PACKAGE_REF, ENTITY, PROPERTY)
);
/*
 PACKAGE_EXTENSION_DEFAULTS table contains default values for specific entities. Each row provides
 default value for one item of a given entity, listed in PACKAGE_EXTENSION
 */
DROP TABLE IF EXISTS "PACKAGE_EXTENSION_DEFAULT";
CREATE TABLE "PACKAGE_EXTENSION_DEFAULT" (
  "PACKAGE_EXTENSION_REF" integer,
  "ENTITY_CODE" text,
  "PARENT_CODE" text,
  "VALUE" text,
  foreign key (PACKAGE_EXTENSION_REF) references PACKAGE_EXTENSION(PACKAGE_EXTENSION_ID)
);
/*
 *  $$$$$$\    $$\                $$\     $$\                       $$\            $$\               
 * $$  __$$\   $$ |               $$ |    \__|                      $$ |           $$ |              
 * $$ /  \__|$$$$$$\    $$$$$$\ $$$$$$\   $$\  $$$$$$$\        $$$$$$$ | $$$$$$\ $$$$$$\    $$$$$$\  
 * \$$$$$$\  \_$$  _|   \____$$\\_$$  _|  $$ |$$  _____|      $$  __$$ | \____$$\\_$$  _|   \____$$\ 
 *  \____$$\   $$ |     $$$$$$$ | $$ |    $$ |$$ /            $$ /  $$ | $$$$$$$ | $$ |     $$$$$$$ |
 * $$\   $$ |  $$ |$$\ $$  __$$ | $$ |$$\ $$ |$$ |            $$ |  $$ |$$  __$$ | $$ |$$\ $$  __$$ |
 * \$$$$$$  |  \$$$$  |\$$$$$$$ | \$$$$  |$$ |\$$$$$$$\       \$$$$$$$ |\$$$$$$$ | \$$$$  |\$$$$$$$ |
 *  \______/    \____/  \_______|  \____/ \__| \_______|       \_______| \_______|  \____/  \_______|
 */
/*
 CLUSTER table contains the clusters loaded from the ZCL XML files.
 */
DROP TABLE IF EXISTS "CLUSTER";
CREATE TABLE IF NOT EXISTS "CLUSTER" (
  "CLUSTER_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "DOMAIN_NAME" text,
  "CODE" integer,
  "MANUFACTURER_CODE" text,
  "NAME" text,
  "DESCRIPTION" text,
  "DEFINE" text,
  "IS_SINGLETON" integer,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
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
  "MANUFACTURER_CODE" text,
  "NAME" text,
  "DESCRIPTION" text,
  "SOURCE" text,
  "IS_OPTIONAL" integer,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID),
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
 COMMAND_ARG table contains arguments for a command.
 */
DROP TABLE IF EXISTS "COMMAND_ARG";
CREATE TABLE IF NOT EXISTS "COMMAND_ARG" (
  "COMMAND_REF" integer,
  "ORDINAL" integer,
  "NAME" text,
  "TYPE" text,
  "IS_ARRAY" integer,
  "PRESENT_IF" text,
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID)
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
  "MANUFACTURER_CODE" text,
  "NAME" text,
  "TYPE" text,
  "SIDE" text,
  "DEFINE" text,
  "MIN" text,
  "MAX" text,
  "MIN_LENGTH" integer,
  "MAX_LENGTH" integer,
  "IS_WRITABLE" integer,
  "DEFAULT_VALUE" text,
  "IS_OPTIONAL" integer,
  "IS_REPORTABLE" integer,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID),
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
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
  "CLUSTER_REF" integer NOT NULL,
  "ATTRIBUTE_REF" integer NOT NULL,
  "DEFAULT_VALUE" text,
  foreign key(CLUSTER_REF) references CLUSTER(CLUSTER_ID),
  foreign key(ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID)
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
  "DISCRETE" integer default false,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
 BITMAP table contains the bitmaps directly loaded from packages.
 */
DROP TABLE IF EXISTS "BITMAP";
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
DROP TABLE IF EXISTS "BITMAP_FIELD";
CREATE TABLE IF NOT EXISTS "BITMAP_FIELD" (
  "BITMAP_REF" integer,
  "ORDINAL" integer,
  "NAME" text,
  "MASK" integer,
  "TYPE" text,
  foreign key(BITMAP_REF) references BITMAP(BITMAP_ID)
);
/*
 DOMAIN table contains domains directly loaded from packages.
 */
DROP TABLE IF EXISTS "DOMAIN";
CREATE TABLE IF NOT EXISTS "DOMAIN" (
  "DOMAIN_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
 ENUM table contains enums directly loaded from packages.
 */
DROP TABLE IF EXISTS "ENUM";
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
DROP TABLE IF EXISTS "ENUM_ITEM";
CREATE TABLE IF NOT EXISTS "ENUM_ITEM" (
  "ENUM_REF" integer,
  "ORDINAL" integer,
  "NAME" text,
  "VALUE" integer,
  foreign key (ENUM_REF) references ENUM(ENUM_ID)
);
/*
 STRUCT table contains structs directly loaded from packages.
 */
DROP TABLE IF EXISTS "STRUCT";
CREATE TABLE IF NOT EXISTS "STRUCT" (
  "STRUCT_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "NAME" text,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
);
/*
 STRUCT_ITEM table contains individual struct items.
 */
DROP TABLE IF EXISTS "STRUCT_ITEM";
CREATE TABLE IF NOT EXISTS "STRUCT_ITEM" (
  "STRUCT_REF" integer,
  "ORDINAL" integer,
  "NAME" text,
  "TYPE" text,
  foreign key (STRUCT_REF) references STRUCT(STRUCT_ID)
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
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID)
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
  foreign key (DEVICE_TYPE_REF) references DEVICE_TYPE(DEVICE_TYPE_ID),
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID)
);
/*
 DEVICE_TYPE_ATTRIBUTE contains attribuets that belong to a device type cluster. 
 */
DROP TABLE IF EXISTS "DEVICE_TYPE_ATTRIBUTE";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_ATTRIBUTE" (
  "DEVICE_TYPE_CLUSTER_REF" integer,
  "ATTRIBUTE_REF" integer,
  "ATTRIBUTE_NAME" text,
  foreign key (DEVICE_TYPE_CLUSTER_REF) references DEVICE_TYPE_CLUSTER(DEVICE_TYPE_CLUSTER_ID),
  foreign key (ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID)
);
/*
 DEVICE_TYPE_COMMAND contains attribuets that belong to a device type cluster. 
 */
DROP TABLE IF EXISTS "DEVICE_TYPE_COMMAND";
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_COMMAND" (
  "DEVICE_TYPE_CLUSTER_REF" integer,
  "COMMAND_REF" integer,
  "COMMAND_NAME" text,
  foreign key (DEVICE_TYPE_CLUSTER_REF) references DEVICE_TYPE_CLUSTER(DEVICE_TYPE_CLUSTER_ID),
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID)
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
 SESSION table contains the list of known and remembered sessions.
 In case of electron SESSION_WINID is the window ID for a given
 session.
 */
DROP TABLE IF EXISTS "SESSION";
CREATE TABLE IF NOT EXISTS "SESSION" (
  "SESSION_ID" integer primary key autoincrement,
  "SESSION_KEY" text,
  "CREATION_TIME" integer,
  "DIRTY" integer default 1,
  UNIQUE(SESSION_KEY)
);
/*
 SESSION_PACKAGE table is a junction table, listing which packages
 are used for a given session.
 */
DROP TABLE IF EXISTS "SESSION_PACKAGE";
CREATE TABLE IF NOT EXISTS "SESSION_PACKAGE" (
  "SESSION_REF" integer,
  "PACKAGE_REF" integer,
  "REQUIRED" integer default false,
  "ENABLED" integer default true,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade,
  foreign key (PACKAGE_REF) references PACKAGE(PACKAGE_ID) on delete cascade,
  UNIQUE(SESSION_REF, PACKAGE_REF)
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
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade,
  UNIQUE(SESSION_REF, KEY)
);
/*
 ENDPOINT_TYPE contains the bulk of the configuration: clusters, attributes, etc.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE";
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
DROP TABLE IF EXISTS "ENDPOINT";
CREATE TABLE IF NOT EXISTS "ENDPOINT" (
  "ENDPOINT_ID" integer primary key autoincrement,
  "SESSION_REF" integer,
  "ENDPOINT_TYPE_REF" integer,
  "PROFILE" integer,
  "ENDPOINT_IDENTIFIER" integer,
  "NETWORK_IDENTIFIER" integer,
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete
  set NULL
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
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID),
  UNIQUE(ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE)
);
/*
 ENDPOINT_TYPE_ATTRIBUTE table contains the user data configuration for the various parameters that exist
 for an attribute on an endpoint. This essentially lets you determine if something should be included or not.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_ATTRIBUTE";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_ATTRIBUTE" (
  "ENDPOINT_TYPE_REF" integer,
  "ENDPOINT_TYPE_CLUSTER_REF" integer,
  "ATTRIBUTE_REF" integer,
  "INCLUDED" integer default false,
  "STORAGE_OPTION" text,
  "SINGLETON" integer default false,
  "BOUNDED" integer default false,
  "DEFAULT_VALUE" text,
  "INCLUDED_REPORTABLE" integer default false,
  "MIN_INTERVAL" integer default 0,
  "MAX_INTERVAL" integer default 65344,
  "REPORTABLE_CHANGE" integer default 0,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (ENDPOINT_TYPE_CLUSTER_REF) references ENDPOINT_TYPE_CLUSTER(ENDPOINT_TYPE_CLUSTER_ID),
  foreign key (ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID),
  UNIQUE(
    ENDPOINT_TYPE_REF,
    ATTRIBUTE_REF,
    ENDPOINT_TYPE_CLUSTER_REF
  )
);
/*
 ENDPOINT_TYPE_COMMAND table contains the user data configuration for the various parameters that exist
 for commands on an endpoint. This essentially lets you determine if something should be included or not.
 */
DROP TABLE IF EXISTS "ENDPOINT_TYPE_COMMAND";
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_COMMAND" (
  "ENDPOINT_TYPE_REF" integer,
  "ENDPOINT_TYPE_CLUSTER_REF" integer,
  "COMMAND_REF" integer,
  "INCOMING" integer default false,
  "OUTGOING" integer default false,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (ENDPOINT_TYPE_CLUSTER_REF) references ENDPOINT_TYPE_CLUSTER(ENDPOINT_TYPE_CLUSTER_ID),
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID),
  UNIQUE(
    ENDPOINT_TYPE_REF,
    COMMAND_REF,
    ENDPOINT_TYPE_CLUSTER_REF
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
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
INSERT ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
UPDATE ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER DELETE ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
INSERT ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
UPDATE ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER DELETE ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
INSERT ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
UPDATE ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER DELETE ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = (
    SELECT SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_ENDPOINT_TYPE"
AFTER
INSERT ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_ENDPOINT_TYPE"
AFTER
UPDATE ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_ENDPOINT_TYPE"
AFTER DELETE ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = OLD.SESSION_REF;
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
CREATE TRIGGER IF NOT EXISTS "INSERT_TRIGGER_SESSION_KEY_VALUE"
AFTER
INSERT ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "UPDATE_TRIGGER_SESSION_KEY_VALUE"
AFTER
UPDATE ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER IF NOT EXISTS "DELETE_TRIGGER_SESSION_KEY_VALUE"
AFTER DELETE ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET DIRTY = 1
WHERE SESSION_ID = OLD.SESSION_REF;
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
 Previously touched file locations. This should be used as a history for dialogs or any other place that needs to
 save some file location.
 */
CREATE TABLE IF NOT EXISTS "FILE_LOCATION" (
  "CATEGORY" text NOT NULL UNIQUE,
  "FILE_PATH" path,
  "ACCESS_TIME" integer
);