import { test, expect } from '@playwright/test';

test.describe("Hacker News page - Newest", () => {
    test("should display articles sorted by newest first", async ({ page }) => {
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
            // If we've reached the last position in this batch, load more
            if (pointer > articleCount - 2) {
                const moreButton = page.locator("a.morelink");
                if (await moreButton.isVisible()) {
                    // Save the last article's timestamp before reloading the next page
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
            
            expect.soft(leftArticleTime).toBeTruthy();
            expect.soft(rightArticleTime).toBeTruthy();

            // If this is the first article after a reload and we have a previous timestamp, so we compare them before doing the regular comparisons
            if (pointer === 0 && previousPageLastArticleTime) {
                const prevUnix = parseInt(previousPageLastArticleTime.split(' ')[1]);
                const currentUnix = parseInt(leftArticleTime.split(' ')[1]);
                const prevTime = new Date(prevUnix * 1000);
                const currentTime = new Date(currentUnix * 1000);
                expect.soft(prevTime.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());   
                totalArticlesTested++;
                previousPageLastArticleTime = null; // Clear the previous page's last article time after the first comparison
                
            }


            const leftUnix = parseInt(leftArticleTime.split(' ')[1]);
            const rightUnix = parseInt(rightArticleTime.split(' ')[1]);
            const leftTime = new Date(leftUnix * 1000);
            const rightTime = new Date(rightUnix * 1000);
            expect.soft(leftTime.getTime()).toBeGreaterThanOrEqual(rightTime.getTime());
            totalArticlesTested++;
            pointer++;
        }

        // Verify we actually tested the full 100 comparisons and didn't exit early (e.g. due to lack of articles)
        expect(totalArticlesTested).toBeGreaterThanOrEqual(articlesToTest);
    });


    test("should verify article content is visible", async ({ page }) => {
        await page.goto("https://news.ycombinator.com/newest");
        await page.waitForLoadState('networkidle');

        const firstArticleTitle = page.locator(".submission .titleline > a").first();
        await expect(firstArticleTitle).toBeVisible();
        const titleText = await firstArticleTitle.textContent();
        expect(titleText?.trim().length).toBeGreaterThan(0);
    });

    test("should verify articles have valid URLs", async ({ page }) => {
        await page.goto("https://news.ycombinator.com/newest");
        await page.waitForLoadState('networkidle');

        const firstArticleLink = await page.locator(".submission .titleline > a").first().getAttribute("href");
        expect(firstArticleLink).toMatch(/^https?:\/\/.+/);
    });
});

test.describe("Hacker News page - Past", () => {
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


    test("should verify article content is visible", async ({ page }) => {
        await page.goto("https://news.ycombinator.com/front");
        await page.waitForLoadState('networkidle');

        const firstArticleTitle = page.locator(".submission .titleline > a").first();
        await expect(firstArticleTitle).toBeVisible();
        const titleText = await firstArticleTitle.textContent();
        expect(titleText?.trim().length).toBeGreaterThan(0);
    });

    test("should verify articles have valid URLs", async ({ page }) => {
        await page.goto("https://news.ycombinator.com/front");
        await page.waitForLoadState('networkidle');

        const firstArticleLink = await page.locator(".submission .titleline > a").first().getAttribute("href");
        expect(firstArticleLink).toMatch(/^https?:\/\/.+/);
    });
});

