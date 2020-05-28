/*

$$$$$$$\                     $$\                                              
$$  __$$\                    $$ |                                             
$$ |  $$ |$$$$$$\   $$$$$$$\ $$ |  $$\ $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$$\ 
$$$$$$$  |\____$$\ $$  _____|$$ | $$  |\____$$\ $$  __$$\ $$  __$$\ $$  _____|
$$  ____/ $$$$$$$ |$$ /      $$$$$$  / $$$$$$$ |$$ /  $$ |$$$$$$$$ |\$$$$$$\  
$$ |     $$  __$$ |$$ |      $$  _$$< $$  __$$ |$$ |  $$ |$$   ____| \____$$\ 
$$ |     \$$$$$$$ |\$$$$$$$\ $$ | \$$\\$$$$$$$ |\$$$$$$$ |\$$$$$$$\ $$$$$$$  |
\__|      \_______| \_______|\__|  \__|\_______| \____$$ | \_______|\_______/ 
                                                $$\   $$ |                    
                                                \$$$$$$  |                    
                                                 \______/                     

You can create these giant separators via:
http://patorjk.com/software/taag/#p=display&f=Big%20Money-nw
*/
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
 $$$$$$\    $$\                $$\     $$\                       $$\            $$\               
$$  __$$\   $$ |               $$ |    \__|                      $$ |           $$ |              
$$ /  \__|$$$$$$\    $$$$$$\ $$$$$$\   $$\  $$$$$$$\        $$$$$$$ | $$$$$$\ $$$$$$\    $$$$$$\  
\$$$$$$\  \_$$  _|   \____$$\\_$$  _|  $$ |$$  _____|      $$  __$$ | \____$$\\_$$  _|   \____$$\ 
 \____$$\   $$ |     $$$$$$$ | $$ |    $$ |$$ /            $$ /  $$ | $$$$$$$ | $$ |     $$$$$$$ |
$$\   $$ |  $$ |$$\ $$  __$$ | $$ |$$\ $$ |$$ |            $$ |  $$ |$$  __$$ | $$ |$$\ $$  __$$ |
\$$$$$$  |  \$$$$  |\$$$$$$$ | \$$$$  |$$ |\$$$$$$$\       \$$$$$$$ |\$$$$$$$ | \$$$$  |\$$$$$$$ |
 \______/    \____/  \_______|  \____/ \__| \_______|       \_______| \_______|  \____/  \_______|
*/
/*
  CLUSTER table contains the clusters loaded from the ZCL XML files.
*/
CREATE TABLE IF NOT EXISTS "CLUSTER" (
  "CLUSTER_ID" integer primary key autoincrement,
  "PACKAGE_REF" integer,
  "CODE" text,
  "MANUFACTURER_CODE" text,
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
  "CODE" text,
  "MANUFACTURER_CODE" text,
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
  "CODE" text,
  "MANUFACTURER_CODE" text,
  "NAME" text,
  "TYPE" text,
  "SIDE" text,
  "DEFINE" text,
  "MIN" text,
  "MAX" text,
  "IS_WRITABLE" integer,
  "DEFAULT_VALUE" text,
  "IS_OPTIONAL" integer,
  "IS_REPORTABLE" integer,
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
CREATE TABLE IF NOT EXISTS "DEVICE_TYPE_COMMAND" (
  "DEVICE_TYPE_CLUSTER_REF" integer,
  "COMMAND_REF" integer,
  "COMMAND_NAME" text,
  foreign key (DEVICE_TYPE_CLUSTER_REF) references DEVICE_TYPE_CLUSTER(DEVICE_TYPE_CLUSTER_ID),
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID)
);
/*

 $$$$$$\                                $$\                                 $$\            $$\               
$$  __$$\                               \__|                                $$ |           $$ |              
$$ /  \__| $$$$$$\   $$$$$$$\  $$$$$$$\ $$\  $$$$$$\  $$$$$$$\         $$$$$$$ | $$$$$$\ $$$$$$\    $$$$$$\  
\$$$$$$\  $$  __$$\ $$  _____|$$  _____|$$ |$$  __$$\ $$  __$$\       $$  __$$ | \____$$\\_$$  _|   \____$$\ 
 \____$$\ $$$$$$$$ |\$$$$$$\  \$$$$$$\  $$ |$$ /  $$ |$$ |  $$ |      $$ /  $$ | $$$$$$$ | $$ |     $$$$$$$ |
$$\   $$ |$$   ____| \____$$\  \____$$\ $$ |$$ |  $$ |$$ |  $$ |      $$ |  $$ |$$  __$$ | $$ |$$\ $$  __$$ |
\$$$$$$  |\$$$$$$$\ $$$$$$$  |$$$$$$$  |$$ |\$$$$$$  |$$ |  $$ |      \$$$$$$$ |\$$$$$$$ | \$$$$  |\$$$$$$$ |
 \______/  \_______|\_______/ \_______/ \__| \______/ \__|  \__|       \_______| \_______|  \____/  \_______|
*/
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
  foreign key (SESSION_REF) references SESSION(SESSION_ID) on delete cascade,
  UNIQUE(SESSION_REF, KEY)
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
  foreign key (CLUSTER_REF) references CLUSTER(CLUSTER_ID),
  UNIQUE(ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE)
);
/*
  ENDPOINT_TYPE_ATTRIBUTE table contains the user data configuration for the various parameters that exist
  for an attribute on an endpoint. This essentially lets you determine if something should be included or not.
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_ATTRIBUTE" (
  "ENDPOINT_TYPE_REF" integer,
  "ATTRIBUTE_REF" integer,
  "INCLUDED" integer default false,
  "EXTERNAL" integer default false,
  "FLASH" integer default false,
  "SINGLETON" integer default false,
  "BOUNDED" integer default false,
  "DEFAULT_VALUE" text,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID),
  UNIQUE(ENDPOINT_TYPE_REF, ATTRIBUTE_REF)
);
/*
  ENDPOINT_TYPE_COMMAND table contains the user data configuration for the various parameters that exist
  for commands on an endpoint. This essentially lets you determine if something should be included or not.
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_COMMAND" (
  "ENDPOINT_TYPE_REF" integer,
  "COMMAND_REF" integer,
  "INCOMING" integer default false,
  "OUTGOING" integer default false,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (COMMAND_REF) references COMMAND(COMMAND_ID),
  UNIQUE(ENDPOINT_TYPE_REF, COMMAND_REF)
);
/*
  ENDPOINT_TYPE_ATTRIBUTE_REPORTING table contains the user data configuration for each attribute reporting. 
  This is distinct from ENDPOINT_TYPE_ATTRIBUTE so as seperate the inclusion of an attribute from its inclusion as a
  reportable attribute. 
  TODO integrate this into the ENDPOINT_TYPE_ATTRIBUTE table anyway?
*/
CREATE TABLE IF NOT EXISTS "ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE" (
  "ENDPOINT_TYPE_REF" integer,
  "ATTRIBUTE_REF" integer,
  "INCLUDED" integer default false,
  "MIN_INTERVAL" integer default 0,
  "MAX_INTERVAL" integer default 65344,
  "REPORTABLE_CHANGE" integer default 0,
  foreign key (ENDPOINT_TYPE_REF) references ENDPOINT_TYPE(ENDPOINT_TYPE_ID) on delete cascade,
  foreign key (ATTRIBUTE_REF) references ATTRIBUTE(ATTRIBUTE_ID),
  UNIQUE(ENDPOINT_TYPE_REF, ATTRIBUTE_REF)
);
/*

$$$$$$$$\        $$\                                                   
\__$$  __|       \__|                                                  
   $$ | $$$$$$\  $$\  $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$$\ 
   $$ |$$  __$$\ $$ |$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$  _____|
   $$ |$$ |  \__|$$ |$$ /  $$ |$$ /  $$ |$$$$$$$$ |$$ |  \__|\$$$$$$\  
   $$ |$$ |      $$ |$$ |  $$ |$$ |  $$ |$$   ____|$$ |       \____$$\ 
   $$ |$$ |      $$ |\$$$$$$$ |\$$$$$$$ |\$$$$$$$\ $$ |      $$$$$$$  |
   \__|\__|      \__| \____$$ | \____$$ | \_______|\__|      \_______/ 
                     $$\   $$ |$$\   $$ |                              
                     \$$$$$$  |\$$$$$$  |                              
                      \______/  \______/                               
*/
CREATE TRIGGER "INSERT_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
INSERT ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "UPDATE_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
UPDATE ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "DELETE_TRIGGER_ENDPOINT_TYPE_ATTRIBUTE"
AFTER
  DELETE ON "ENDPOINT_TYPE_ATTRIBUTE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "INSERT_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
INSERT ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "UPDATE_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
UPDATE ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "DELETE_TRIGGER_ENDPOINT_TYPE_COMMAND"
AFTER
  DELETE ON "ENDPOINT_TYPE_COMMAND" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "INSERT_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
INSERT ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "UPDATE_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
UPDATE ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = NEW.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "DELETE_TRIGGER_ENDPOINT_TYPE_CLUSTER"
AFTER
  DELETE ON "ENDPOINT_TYPE_CLUSTER" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = (
    SELECT
      SESSION_REF
    FROM ENDPOINT_TYPE
    WHERE
      ENDPOINT_TYPE_ID = OLD.ENDPOINT_TYPE_REF
  );
END;
CREATE TRIGGER "INSERT_TRIGGER_ENDPOINT_TYPE"
AFTER
INSERT ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER "UPDATE_TRIGGER_ENDPOINT_TYPE"
AFTER
UPDATE ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER "DELETE_TRIGGER_ENDPOINT_TYPE"
AFTER
  DELETE ON "ENDPOINT_TYPE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = OLD.SESSION_REF;
END;
CREATE TRIGGER "INSERT_TRIGGER_ENDPOINT"
AFTER
INSERT ON "ENDPOINT" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER "UPDATE_TRIGGER_ENDPOINT"
AFTER
UPDATE ON "ENDPOINT" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER "DELETE_TRIGGER_ENDPOINT"
AFTER
  DELETE ON "ENDPOINT" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = OLD.SESSION_REF;
END;
CREATE TRIGGER "INSERT_TRIGGER_SESSION_KEY_VALUE"
AFTER
INSERT ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER "UPDATE_TRIGGER_SESSION_KEY_VALUE"
AFTER
UPDATE ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = NEW.SESSION_REF;
END;
CREATE TRIGGER "DELETE_TRIGGER_SESSION_KEY_VALUE"
AFTER
  DELETE ON "SESSION_KEY_VALUE" BEGIN
UPDATE SESSION
SET
  DIRTY = 1
WHERE
  SESSION_ID = OLD.SESSION_REF;
END;
/*

 $$$$$$\  $$\           $$\                 $$\             $$\            $$\               
$$  __$$\ $$ |          $$ |                $$ |            $$ |           $$ |              
$$ /  \__|$$ | $$$$$$\  $$$$$$$\   $$$$$$\  $$ |       $$$$$$$ | $$$$$$\ $$$$$$\    $$$$$$\  
$$ |$$$$\ $$ |$$  __$$\ $$  __$$\  \____$$\ $$ |      $$  __$$ | \____$$\\_$$  _|   \____$$\ 
$$ |\_$$ |$$ |$$ /  $$ |$$ |  $$ | $$$$$$$ |$$ |      $$ /  $$ | $$$$$$$ | $$ |     $$$$$$$ |
$$ |  $$ |$$ |$$ |  $$ |$$ |  $$ |$$  __$$ |$$ |      $$ |  $$ |$$  __$$ | $$ |$$\ $$  __$$ |
\$$$$$$  |$$ |\$$$$$$  |$$$$$$$  |\$$$$$$$ |$$ |      \$$$$$$$ |\$$$$$$$ | \$$$$  |\$$$$$$$ |
 \______/ \__| \______/ \_______/  \_______|\__|       \_______| \_______|  \____/  \_______|
*/
/*
  Random settings, essentially application preferences
*/
CREATE TABLE IF NOT EXISTS "SETTING" (
  "CATEGORY" text,
  "KEY" text,
  "VALUE" text
);
/*
  Previously touched file locations. This should be used as a history for dialogs.
*/
CREATE TABLE IF NOT EXISTS "FILE_LOCATION" (
  "CATEGORY" text NOT NULL UNIQUE,
  "FILE_PATH" path,
  "ACCESS_TIME" integer
);