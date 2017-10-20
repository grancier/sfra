'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {string} pid - product ID
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, pid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;
    if (pid) {
        product = ProductMgr.getProduct(pid);
        category = product.variant
            ? product.masterProduct.primaryCategory
            : product.primaryCategory;
    } else if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, null, breadcrumbs);
        }
    }

    return breadcrumbs;
}

/**
 * @typedef ProductDetailPageResourceMap
 * @type Object
 * @property {String} global_availability - Localized string for "Availability"
 * @property {String} label_instock - Localized string for "In Stock"
 * @property {String} global_availability - Localized string for "This item is currently not
 *     available"
 * @property {String} info_selectforstock - Localized string for "Select Styles for Availability"
 */

/**
 * Generates a map of string resources for the template
 *
 * @returns {ProductDetailPageResourceMap} - String resource map
 */
function getResources() {
    var Resource = require('dw/web/Resource');

    return {
        info_selectforstock: Resource.msg('info.selectforstock', 'product',
            'Select Styles for Availability')
    };
}

/**
 * Renders the Product Details Page
 * @param {Object} querystring - query string parameters
 * @param {Object} res - response object
 */
function showProductPage(querystring, res) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');

    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var breadcrumbs = getAllBreadcrumbs(null, product.id, []).reverse();
    var template = 'product/productDetails';

    if (product.productType === 'bundle') {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set') {
        template = 'product/setDetails';
    }

    res.render(template, {
        CurrentPageMetaData: {
            title: product.productName
        },
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources(),
        breadcrumbs: breadcrumbs,
        pickUpInStore: {
            actionUrl: URLUtils.url('Product-GetStores').toString(),
            enabled: Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')
        }
    });
}

server.get('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    showProductPage(req.querystring, res);
    next();
});

server.get('ShowInCategory', cache.applyPromotionSensitiveCache, function (req, res, next) {
    showProductPage(req.querystring, res);
    next();
});

server.get('Variation', function (req, res, next) {
    var priceHelper = require('*/cartridge/scripts/helpers/pricing');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var params = req.querystring;
    var product = ProductFactory.get(params);

    product.price.html = priceHelper.renderHtml(priceHelper.getHtmlContext(product.price));

    var attributeContext = { product: { attributes: product.attributes } };
    var attributeTemplate = 'product/components/attributesPre';
    product.attributesHtml = renderTemplateHelper.getRenderedHtml(
        attributeContext,
        attributeTemplate
    );

    res.json({
        product: product,
        resources: getResources()
    });

    next();
});

server.get('ShowQuickView', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var params = req.querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var template = product.productType === 'set'
        ? 'product/setQuickview.isml'
        : 'product/quickview.isml';

    res.render(template, {
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources()
    });

    next();
});

server.get('SizeChart', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');

    var apiContent = ContentMgr.getContent(req.querystring.cid);

    if (apiContent) {
        res.json({
            success: true,
            content: apiContent.custom.body.markup
        });
    } else {
        res.json({});
    }
    next();
});

server.get('GetStores', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var StoreHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var actionUrl = URLUtils.url('Product-GetStores').toString();
    var storesModel = StoreHelpers.getModel(req, actionUrl);
    var product = [{
        productID: req.querystring.pid,
        quantityValue: req.querystring.qty
    }];

    storesModel.stores = StoreHelpers.getFilteredStores(storesModel, product);

    var context = storesModel;
    var storeTemplate = 'product/components/inStoreInventoryFind';

    storesModel.storesResultsHtml = storesModel.stores
        ? renderTemplateHelper.getRenderedHtml(context, storeTemplate)
        : null;

    res.json(storesModel);
    next();
});

server.get('ShowBonusProducts', function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var params = JSON.parse(req.querystring.pids);
    var products = [];
    var product;
    params.forEach(function (param) {
        product = ProductFactory.get({ pid: param });
        products.push(product);
    });

    var template = 'product/components/choiceofbonusproducts/bonusProducts.isml';

    res.render(template, {
        products: products
    });

    next();
});

module.exports = server.exports();
