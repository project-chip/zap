// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides the APIs for validating inputs to the database, and returning flags indicating if 
 * things were successful or not. 
 * 
 */


import * as ZclModel from '../zcl/zcl-model'
export function validateEndpoint() {

}

export function validateAttribute(db, endpointTypeId, attributeRef) {
    return ZclModel.zclEndpointTypeAttribute(db, endpointTypeId, attributeRef).then(endpointAttribute =>
        ZclModel.zclAttribute(db, attributeRef).then(attribute => new Promise((resolve, reject) => {
            var defaultAttributeIssues =  []
            if (!isStringType(attribute.type)) {
                if (isFloatType(attribute.type)) {
                    if (!isValidFloat(endpointAttribute.defaultValue)) defaultAttributeIssues.push("Invalid Float") 
                    if (!checkBoundsFloat(attribute, endpointAttribute)) defaultAttributeIssues.push("Out of range")
                } else {
                    if(!isValidNumberString(endpointAttribute.defaultValue)) defaultAttributeIssues.push("Invalid Integer")
                    if(!checkBoundsInteger(attribute, endpointAttribute)) defaultAttributeIssues.push("Out of range")
                }
            }
            resolve({defaultValue: defaultAttributeIssues})
        })))
}

//This applies to both actual numbers as well as octet strings. 
function isValidNumberString(value) {
    //We test to see if the number is valid in hex. Decimals numbers also pass this test
    return /^(0x|0X)?[0-9a-fA-F]+$/.test(value)
}


function isValidFloat(value) {
    return /^[0-9]+(\.)?[0-9]*$/.test(value)
}
function extractFloatValue(value) {
    return parseFloat(value)
}


function extractIntegerValue(value) {
    if (/^[0-9]+$/.test(value)) {
        return parseInt(value)
    } else if (/^[0-9]+$/.test(value)) {
        return parseInt(value, 16)
    } else {
        return parseInt(value, 16)
    }
}

function checkBoundsInteger(attribute, endpointAttribute) {
    var defaultValue = extractIntegerValue(endpointAttribute.defaultValue)
    var min = extractIntegerValue(attribute.min)
    var max = extractIntegerValue(attribute.max)
    if (Number.isNaN(min)) min = Number.MIN_SAFE_INTEGER
    if (Number.isNaN(max)) max = Number.MAX_SAFE_INTEGER
    return (defaultValue >= min && defaultValue <= max)
}

function checkBoundsFloat(attribute, endpointAttribute) {
    var defaultValue = extractFloatValue(endpointAttribute.defaultValue)
    var min = extractFloatValue(attribute.min)
    var max = extractFloatValue(attribute.max)

    if (Number.isNaN(min)) min = Number.MIN_VALUE
    if (Number.isNaN(max)) max = Number.MAX_VALUE
    return (defaultValue >= min && defaultValue <= max)
}

// This function checks to see if 
function isStringType(type) {
    switch (type) {
        case 'CHAR_STRING':
        case 'OCTET_STRING':
        case 'LONG_CHAR_STRING':
        case 'LONG_OCTET_STRING':
            return true
            break
        default:
            return false;
    }
}

function isFloatType(type) {
    switch (type) {
        case 'FLOAT_SEMI':
        case 'FLOAT_SINGLE':
        case 'FLOAT_DOUBLE':
            return true
            break
        default:
            return false
    }
}