const { chromium } = require("playwright");
const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require("playwright/test");

/**
 * @see https://playwright.dev/docs/test-configuration
 */


describe("Hacker News page", () => {
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

    test("should load Hacker News newest page", async () => {
        await page.goto("https://news.ycombinator.com/newest");
        const title = await page.title();
        expect(title).toContain("Hacker News");
    });

    test("should display articles sorted by newest first", async () => {
        await page.goto("https://news.ycombinator.com/newest");

        // Verify that there are articles on the page before proceeding with the test
        let articleCount = await page.locator(".submission").count();
        if (articleCount === 0) {
            throw new Error("No articles found on the page");
        }

        // Track total articles tested across all batches
        let totalArticlesTested = 0;
        let pointer = 0;
        const articlesToTest = 100;
        let previousArticleTime = null; // Store the last article's timestamp for cross-batch comparison

        while (totalArticlesTested < articlesToTest) {
            // If we've reached the last position in this batch, reload
            if (pointer > articleCount - 2) {
                const moreButton = page.locator("a.morelink");
                if (await moreButton.isVisible()) {
                    // Save the last article's timestamp before reloading
                    const lastArticleElement = await page.locator('.age').nth(articleCount - 1);
                    previousArticleTime = await lastArticleElement.getAttribute('title');
                    
                    await moreButton.click();
                    await page.waitForTimeout(1000); // Wait for articles to load
                    pointer = 0; // Reset pointer for next batch
                }
                else {
                    break; // No more articles available
                }
            }

            

            const leftArticleElement = await page.locator('.age').nth(pointer);
            const rightArticleElement = await page.locator('.age').nth(pointer + 1);
            await leftArticleElement.waitFor();
            await rightArticleElement.waitFor();

            const leftArticleTime = await leftArticleElement.getAttribute('title');
            const rightArticleTime = await rightArticleElement.getAttribute('title');
            
            if (leftArticleTime && rightArticleTime) {
                // If this is the first article after a reload and we have a previous timestamp, compare them before doing the regular comparisons
                if (pointer === 0 && previousArticleTime) {
                    const prevTime = new Date(parseInt(previousArticleTime.slice(20)) * 1000);
                    const currentTime = new Date(parseInt(leftArticleTime.slice(20)) * 1000);
                    expect(prevTime.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());   
                    totalArticlesTested++;
                    previousArticleTime = null; // Clear it after using
                    
                }
                const leftTime = new Date(parseInt(leftArticleTime.slice(20)) * 1000);
                const rightTime = new Date(parseInt(rightArticleTime.slice(20)) * 1000);
                expect(leftTime.getTime()).toBeGreaterThanOrEqual(rightTime.getTime());   
                totalArticlesTested++;
                pointer++;
                
                console.log(`Comparing articles at positions ${pointer - 1} and ${pointer} (total tested: ${totalArticlesTested})`);
            }
            else {
                throw new Error("Could not retrieve article times for comparison");
            }
        }
    });

        // for (let i = 0; i < 99; i++) {
        //     const currentArticleElement = await page.locator('.age').nth(count);
        //     const nextArticleElement = await 
        //     await currentArticleElement.waitFor();
        //     await nextArticleElement.waitFor();

        //     const currentArticleTime = await currentArticleElement.getAttribute('title');
        //     const nextArticleTime = await nextArticleElement.getAttribute('title');

        //     if (currentArticleTime && nextArticleTime) {
        //         const currentTime = new Date(parseInt(currentArticleTime.slice(20)) * 1000);
        //         const nextTime = new Date(parseInt(nextArticleTime.slice(20)) * 1000);
        //         expect(currentTime.getTime()).toBeGreaterThanOrEqual(nextTime.getTime());
        //     }
            
        //     // Figure out what divisor to use to determine when to load more articles 
        //     // We want to keep this number flexible in case the number of articles per batch changes
        //     const divisor = articleCount - 2; // We use -2 because the last 2 articles will be the ones we are comparing, and we want to load more before we get to them
        //     // Load more articles if we're at a batch boundary (depending on the divisor) and need more
        //     if (i % divisor === 0 && i > 0) {
        //         const moreButton = page.locator("a.morelink");
        //         if (await moreButton.isVisible()) {
        //             await moreButton.click();
        //             await page.waitForTimeout(1000); // Wait for articles to load                    
        //         }
        //         else {
        //             throw new Error("More articles button not found or not visible when expected");
        //         }
        //         count = 0;
        //     }
        //     else {
        //         count++;
        //     }
        // }

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
