'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/dw.util.Collection');
var toProductMock = require('../../../../util');

describe('fullProduct', function () {
    var FullProduct = proxyquire('../../../../../app_storefront_base/cartridge/models/product/product', {
        './productBase': proxyquire('../../../../../app_storefront_base/cartridge/models/product/productBase', {
            './productPricing': function () {},
            './productImages': function () {},
            './productAttributes': function () { return []; },
            '../../scripts/dwHelpers': proxyquire('../../../../../app_storefront_base/cartridge/scripts/dwHelpers', {
                'dw/util/ArrayList': ArrayList
            })
        })
    });

    var productVariantMock = {
        ID: '1234567',
        name: 'test product',
        variant: false,
        variationGroup: false,
        productSet: false,
        bundle: false,
        availabilityModel: {
            isOrderable: {
                return: true,
                type: 'function'
            }
        },
        shortDescription: {
            markup: 'Hello World'
        },
        longDescription: {
            markup: 'Hello World Long'
        },
        minOrderQuantity: {
            value: 2
        }
    };

    var productMock = {
        variationModel: {
            productVariationAttributes: new ArrayList([{
                attributeID: '',
                value: ''
            }]),
            setSelectedAttributeValue: {
                return: null,
                type: 'function'
            },
            selectedVariant: productVariantMock,
            getAllValues: {
                return: new ArrayList([]),
                type: 'function'
            }
        }
    };

    it('should load simple full product', function () {
        var mock = toProductMock(productMock);
        var product = new FullProduct(mock);

        assert.equal(product.productName, 'test product');
        assert.equal(product.id, 1234567);
        assert.equal(product.rating, 4);
        assert.equal(product.minOrderQuantity, 2);
        assert.equal(product.shortDescription, 'Hello World');
        assert.equal(product.longDescription, 'Hello World Long');
    });

    it('should load simple full product without minOrder', function () {
        var tempMock = Object.assign({}, productMock);
        tempMock.variationModel.selectedVariant = null;
        tempMock = Object.assign({}, productVariantMock, tempMock);
        tempMock.minOrderQuantity.value = null;
        var product = new FullProduct(toProductMock(tempMock));

        assert.equal(product.minOrderQuantity, 1);
        assert.equal(product.maxOrderQuantity, 9);
    });
});