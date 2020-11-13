# Custom ZCL Entities

- [Custom ZCL Entities](#custom-zcl-entities)
  - [Adding custom ZCL entities](#adding-custom-zcl-entities)
  - [Using custom ZCL entities](#using-custom-zcl-entities)
  - [Saving information about custom ZCL entities](#saving-information-about-custom-zcl-entities)
  - [Restoring information about custom ZCL entities](#restoring-information-about-custom-zcl-entities)
  - [User interface functionality](#user-interface-functionality)

## Adding custom ZCL entities

Custom ZCL entities are added via loading in the XML file of the same format as are the main XML files for the main ZCL database.

Upon loading, the loaded file gets its own package row in the package table, with its own package ID.

Packages support custom "version" field. The version field should be used for custom loaded packages to identify them.

Following are the lists of the ZCL entities that can be custom-loaded:

- custom clusters with its own cluster attributes and commands
- custom extensions to existing clusters, adding attribute and commands
- other? (TBD)

## Using custom ZCL entities

Custom ZCL entities are used for user sessions. Each user session can use one or more package IDs and those package IDs can be either the main ZCL package, or one or more custom ZCL loaded packages.

In order for the data to be used seamlessly, following needs to be assured:

- whenever session based queries are issued from the UI, joined across ZCL entities, an entire list of package IDs for the session needs to be considered.
- whenever generation helpers are querying the database to generate ZCL entities, an entire list of package IDs needs to be considered.

Apart from making sure that the queries all consider custom package IDs when querying for its package IDs, there should be nothing else special happening with these packages, they are just regular ZCL entities.

ZAP could provide some validation though, since there are specific ZCL rules around what IDs the custom entities can take.

## Saving information about custom ZCL entities

When custom XML package is used for user configuration, `*.zap` file will carry that information inside it.
Upon export from database, following information should be recorded:

- version of custom XML file
- path of custom XML file

## Restoring information about custom ZCL entities

When a `*.zap` file is loaded, that contains information about a custom XML file, following needs to be considered:

- using path or version the correct supporting package has to be located and loaded into the database if it hasn't yet been loaded
- user has to be given choice what to do if required custom XML file is not found.
- CRC handling should be used in a regular fashion to determine if file has changed or not.

## User interface functionality

Following are the UI functions that will have to be performed by ZAP to support this functionality:

- global UI support to locate and load a custom XML file.
- global UI support to unload custom XML file and delete the data about it from the database.
- session-specific UI support to add or remove the use of a specific custom XML file for a given session.

In addition and command-line argument to point to custom XML files should be supported when executing zap.
