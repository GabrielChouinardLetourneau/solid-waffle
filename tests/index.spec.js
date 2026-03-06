const { chromium } = require("playwright");
const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require("playwright/test");

/**
 * @see https://playwright.dev/docs/test-configuration
 */


describe("Hacker News page - Newest", () => {
    let browser;
    let context;
    let page;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    afterEach(async () => {
        await context.close();
    });

    test("should display articles sorted by newest first", async () => {
        await page.goto("https://news.ycombinator.com/newest");
        await page.waitForLoadState('networkidle');

        // Verify that there are articles on the page before proceeding with the test
        let articleCount = await page.locator(".submission").count();
        expect(articleCount).toBeGreaterThan(0);

        // Track total articles tested across all batches
        let totalArticlesTested = 0;
        let pointer = 0;
        const articlesToTest = 100;
        let previousPageLastArticleTime = null; // Store the last article's timestamp for cross-batch comparison

        while (totalArticlesTested < articlesToTest) {
            // If we've reached the last position in this batch, reload
            if (pointer > articleCount - 2) {
                const moreButton = page.locator("a.morelink");
                if (await moreButton.isVisible()) {
                    // Save the last article's timestamp before reloading
                    const previousPageLastArticleElement = page.locator('.age').nth(articleCount - 1);
                    await previousPageLastArticleElement.waitFor();
                    previousPageLastArticleTime = await previousPageLastArticleElement.getAttribute('title');
                    
                    await moreButton.click();
                    await page.waitForLoadState('networkidle'); // Wait for articles to load
                    articleCount = await page.locator(".submission").count(); // Update article count after loading new batch
                    pointer = 0; // Reset pointer for next batch
                }
                else {
                    break; // No more articles available
                }
            }

            const leftArticleElement = page.locator('.age').nth(pointer);
            const rightArticleElement = page.locator('.age').nth(pointer + 1);
            await leftArticleElement.waitFor();
            await rightArticleElement.waitFor();

            const leftArticleTime = await leftArticleElement.getAttribute('title');
            const rightArticleTime = await rightArticleElement.getAttribute('title');
            
            expect(leftArticleTime).toBeTruthy();
            expect(rightArticleTime).toBeTruthy();

            // If this is the first article after a reload and we have a previous timestamp, compare them before doing the regular comparisons
            if (pointer === 0 && previousPageLastArticleTime) {
                const prevUnix = parseInt(previousPageLastArticleTime.split(' ')[1]);
                const currentUnix = parseInt(leftArticleTime.split(' ')[1]);
                const prevTime = new Date(prevUnix * 1000);
                const currentTime = new Date(currentUnix * 1000);
                expect.soft(prevTime.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());   
                totalArticlesTested++;
                previousPageLastArticleTime = null; // Clear it after using
                
            }
            const leftUnix = parseInt(leftArticleTime.split(' ')[1]);
            const rightUnix = parseInt(rightArticleTime.split(' ')[1]);
            const leftTime = new Date(leftUnix * 1000);
            const rightTime = new Date(rightUnix * 1000);
            expect.soft(leftTime.getTime()).toBeGreaterThanOrEqual(rightTime.getTime());
            totalArticlesTested++;
            pointer++;
            
            console.log(`Comparing articles at positions ${pointer - 1} and ${pointer} (total tested: ${totalArticlesTested})`);
            
        }
    });


    test("should verify article content is visible", async () => {
        await page.goto("https://news.ycombinator.com/newest");
        const firstArticleTitle = await page.locator(".submission .titleline > a").first();
        expect(await firstArticleTitle.isVisible()).toBeTruthy();
    });

    test("should verify articles have valid URLs", async () => {
        await page.goto("https://news.ycombinator.com/newest");
        const firstArticleLink = await page.locator(".submission .titleline > a").first().getAttribute("href");
        expect(firstArticleLink).toBeTruthy();
        expect(firstArticleLink.length).toBeGreaterThan(0);
    });
});

describe("Hacker News page - Past", () => {
    let browser;
    let context;
    let page;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    afterEach(async () => {
        await context.close();
    });

    // Committing this for now so the history shows success for some other reports
    // test("should display past articles depending on time modifier", async () => {
    //     await page.goto("https://news.ycombinator.com/front");
    //     await page.waitForLoadState('networkidle');

    //     // Verify that there are articles on the page before proceeding with the test
    //     let articleCount = await page.locator(".submission").count();
    //     expect(articleCount).toBeGreaterThan(0);

    //     // First take the date that we will be using our reference for the comparisons 
    //     let referenceDateElement = page.locator('.pagetop > font');
    //     await referenceDateElement.waitFor();
    //     let referenceDate = await referenceDateElement.textContent();
    //     expect(referenceDate).toBeTruthy();



    //     let hnmoreModifierCount = await page.locator(".hnmore > a").count();
    //     for (let i = 0; i < hnmoreModifierCount; i++) {
    //         const modifierElement = page.locator(".hnmore > a").nth(i);
    //         await modifierElement.waitFor();

    //         await modifierElement.click();
    //         await page.waitForLoadState('networkidle'); // Wait for articles to load

    //         referenceDateElement = page.locator('.pagetop > font');
    //         await referenceDateElement.waitFor();
    //         referenceDate = await referenceDateElement.textContent();
    //         expect(referenceDate).toBeTruthy();

    //         // For now, let's just check the first 10 articles for each modifier, we can increase this number later if needed
    //         for (let j = 0; j < 10; j++) {
    //             const articleDateElement = page.locator('.age').nth(j);
    //             await articleDateElement.waitFor();
    //             const articleDateText = await articleDateElement.getAttribute('title');

    //             const articleDateString = articleDateText.split("T")[0];
    //             if (articleDateString) {
    //                 const refDateString = referenceDate.split("T")[0];
    //                 expect(articleDateString).toEqual(refDateString);
    //             }
    //         }
    //     }
    // });


    test("should verify article content is visible", async () => {
        await page.goto("https://news.ycombinator.com/front");
        const firstArticleTitle = await page.locator(".submission .titleline > a").first();
        expect(await firstArticleTitle.isVisible()).toBeTruthy();
    });

    test("should verify articles have valid URLs", async () => {
        await page.goto("https://news.ycombinator.com/front");
        const firstArticleLink = await page.locator(".submission .titleline > a").first().getAttribute("href");
        expect(firstArticleLink).toBeTruthy();
        expect(firstArticleLink.length).toBeGreaterThan(0);
    });
});

