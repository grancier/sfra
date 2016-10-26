'use strict';

var helper = require('~/cartridge/scripts/dwHelpers');

var formatMoney = require('dw/util/StringUtils').formatMoney;
var money = require('dw/value/Money');
var ShippingMgr = require('dw/order/ShippingMgr');


/**
 * Sets the shipping method of the basket's default shipment
 * @param {dw.order.Shipment} defaultShipment - The default shipment for the current basket
 * @param {String} shippingMethodID - The shipping method ID of the desired shipping method
 * @param {String} shippingMethods - List of applicable shipping methods of the current basket
 * @return {void}
 */
function selectShippingMethod(defaultShipment, shippingMethodID, shippingMethods) {
    var applicableShippingMethods;
    var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    var isShipmentSet = false;

    if (shippingMethods) {
        applicableShippingMethods = shippingMethods;
    } else {
        var shipmentModel = ShippingMgr.getShipmentShippingModel(defaultShipment);
        applicableShippingMethods = shipmentModel.applicableShippingMethods;
    }

    if (shippingMethodID) {
        // loop through the shipping methods to get shipping method
        var iterator = applicableShippingMethods.iterator();
        while (iterator.hasNext()) {
            var shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID) {
                defaultShipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                break;
            }
        }
    }

    if (!isShipmentSet) {
        if (applicableShippingMethods.contains(defaultShippingMethod)) {
            defaultShipment.setShippingMethod(defaultShippingMethod);
        } else {
            defaultShipment.setShippingMethod(null);
        }
    }
}

/**
 * Creates an array of objects containing the information of applicable shipping methods
 * @param {dw.order.ShipmentShippingModel} shipmentModel - Instance of the shipping model
 * @returns {Array} an array of objects containing the information of applicable shipping methods
 */
function getApplicableShippingMethods(shipmentModel, address) {
    var shippingMethods = address ? shipmentModel.getApplicableShippingMethods(address) :
        shipmentModel.applicableShippingMethods;

    return helper.map(shippingMethods, function (shippingMethod) {
        var shippingCost = shipmentModel.getShippingCost(shippingMethod);
        return {
            description: shippingMethod.description,
            displayName: shippingMethod.displayName,
            ID: shippingMethod.ID,
            shippingCost: formatMoney(money(
                shippingCost.amount.value,
                shippingCost.amount.currencyCode
            )),
            estimatedArrivalTime: shippingMethod.custom.estimatedArrivalTime
        };
    });
}

/**
 * Converts API shipment into plain object
 * @param {dw.order.shipment} defaultShipment -the default shipment of the current basket
 * @returns {Object} object containing information about the selected shipping method
 */
function getSelectedShippingMethod(shippingMethod) {
    return {
        ID: shippingMethod.ID,
        displayName: shippingMethod.displayName,
        description: shippingMethod.description,
        estimatedArrivalTime: shippingMethod.custom.estimatedArrivalTime
    };
}

/**
 * Shipping Model
 * @param {dw.order.ShipmentShippingModel} shipmentShippingModel - Instance a demandware shipping
 *      model which shipment-level shipping information
 * @constructor
 */
function shipping(defaultShipment, shipmentModel, addressModel) {
    this.applicableShippingMethods = shipmentModel ?
        getApplicableShippingMethods(shipmentModel) :
        null;
    this.shippingAddress = addressModel ? addressModel.address : null;
    this.selectedShippingMethod = defaultShipment && defaultShipment.shippingMethod ?
        getSelectedShippingMethod(defaultShipment.shippingMethod) :
        null;
}

shipping.selectShippingMethod = selectShippingMethod;
shipping.getApplicableShippingMethods = getApplicableShippingMethods;

module.exports = shipping;
