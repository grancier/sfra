const { I, pageDesigner, utilities } = inject();

Then('shopper should see the main banner', () => {
    I.waitForElement(pageDesigner.locators.mainBanner);
    I.seeElement(pageDesigner.locators.mainBanner);
});

Then('shopper should see the main banner message', () => {
    let mainBannerElement = locate(pageDesigner.locators.mainBanner).at(1);
    let heading = mainBannerElement.find(pageDesigner.locators.mainBannerHeading);
    let subHeading = mainBannerElement.find(pageDesigner.locators.mainBannerSubHeading);

    I.see('Dresses\nfor\nBesties', heading);
    I.see('Shop Now', subHeading);
});

Then('shopper should go to womens clothing dresses clicking on the main banner', () => {
    utilities.clickToLoadPage(pageDesigner.locators.mainBannerLink, '/s/RefArch/womens/clothing/dresses/?lang=default');
});
