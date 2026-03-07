import { test, expect } from '@playwright/test';

test.describe("Hacker News page - Newest", () => {
    test("should display articles sorted by newest first", async ({ page }) => {
        await test.step('Navigate to Hacker News newest page', async () => {
            const response = await page.goto("/newest");

            expect(response?.status(), `HTTP status was ${response?.status()} after navigation`).toBeLessThan(400);
        });

        let articleCount;
        await test.step('Verify articles are present', async () => {
            articleCount = await page.locator(".submission").count();
            expect(articleCount).toBeGreaterThan(0);
        });

        // Track total articles tested across all batches
        let totalArticlesTested = 0;
        let pointer = 0;
        const articlesToTest = 100;
        let previousPageLastArticleTime = null; // Store the last article's timestamp for cross-batch comparison

        await test.step('Compare 100 article timestamps across pages', async () => {
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
                        articleCount = await page.locator(".submission").count(); // Update article count after loading new batch
                        pointer = 0; // Reset pointer for next batch
                    }
                    else {
                        break; // No more articles available
                    }
                }

                // Get the timestamps of the current pair of articles to compare
                const leftArticleElement = await page.locator('.age').nth(pointer);
                const rightArticleElement = await page.locator('.age').nth(pointer + 1);

                const leftArticleTime = await leftArticleElement.getAttribute('title');
                const rightArticleTime = await rightArticleElement.getAttribute('title');

                expect.soft(leftArticleTime).toBeTruthy();
                expect.soft(rightArticleTime).toBeTruthy();

                // If this is the first article after a reload and we have a previous timestamp, compare them before doing the regular comparisons
                if (pointer === 0 && previousPageLastArticleTime) {
                    const prevUnix = parseInt(previousPageLastArticleTime.split(' ')[1]);
                    const currentUnix = parseInt(leftArticleTime.split(' ')[1]);

                    expect.soft(prevUnix).toBeGreaterThanOrEqual(currentUnix, `Cross-page ordering failure: last article of previous page (${previousPageLastArticleTime}) is older than first of next page (${leftArticleTime})`);
                    totalArticlesTested++;
                    previousPageLastArticleTime = null; // Clear the previous page's last article time after the first comparison
                }

                const leftUnix = parseInt(leftArticleTime.split(' ')[1]);
                const rightUnix = parseInt(rightArticleTime.split(' ')[1]);

                expect.soft(leftUnix).toBeGreaterThanOrEqual(rightUnix, `Ordering failure at positions ${pointer} and ${pointer + 1}: ${leftArticleTime} is older than ${rightArticleTime}`);
                totalArticlesTested++;
                pointer++;
            }
        });

        await test.step('Verify 100 comparisons completed', async () => {
            // Verify we actually tested the full 100 comparisons and didn't exit early
            expect(totalArticlesTested).toBeGreaterThanOrEqual(articlesToTest);
        });
    });


    test("should verify article content is visible", async ({ page }) => {
        const response = await page.goto("/newest");

        expect(response?.status(), `HTTP status was ${response?.status()} after navigation`).toBeLessThan(400);

        const firstArticleTitle = page.locator(".submission .titleline > a").first();
        await expect(firstArticleTitle).toBeVisible();
        const titleText = await firstArticleTitle.textContent();
        expect(titleText?.trim().length).toBeGreaterThan(0);
    });

    test("should verify articles have valid URLs", async ({ page }) => {
        const response = await page.goto("/newest");

        expect(response?.status(), `HTTP status was ${response?.status()} after navigation`).toBeLessThan(400);

        const firstArticleLink = await page.locator(".submission .titleline > a").first().getAttribute("href");
        expect(firstArticleLink).toMatch(/^https?:\/\/.+/);
    });
});

test.describe("Hacker News page - Past", () => {
    // This test intentionally fails: HN's /front page time modifiers do not reliably
    // filter articles to the selected date — articles from other dates appear in results.
    // Keeping this as a documented regression to highlight the inconsistent behavior.
    // This test highlight some issues with the /front page which adds to other known issues with the page such as these links seen below
    // https://news.ycombinator.com/item?id=47186188 | https://news.ycombinator.com/item?id=46896107
    test("should display past articles depending on date reference", async ({ page }) => {
        await test.step('Navigate to Hacker News front page', async () => {
            const response = await page.goto("/front");

            expect(response?.status(), `HTTP status was ${response?.status()} after navigation`).toBeLessThan(400);
        });

        let articleCount;
        let referenceDateElement;
        let referenceDate;
        await test.step('Verify articles and reference date are present', async () => {
            articleCount = await page.locator(".submission").count();
            expect(articleCount).toBeGreaterThan(0);

            referenceDateElement = await page.locator('.pagetop > font');
            referenceDate = await referenceDateElement.textContent();
            expect(referenceDate).toBeTruthy();
        });

        await test.step('Verify articles match reference date for each time modifier', async () => {
            const hnmoreModifierCount = await page.locator(".hnmore > a").count();
            for (let i = 0; i < hnmoreModifierCount; i++) {
                const modifierElement = await page.locator(".hnmore > a").nth(i);

                await modifierElement.click();

                referenceDateElement = await page.locator('.pagetop > font');
                referenceDate = await referenceDateElement.textContent();
                expect(referenceDate).toBeTruthy();

                // Check the first 10 articles for each modifier
                for (let j = 0; j < 10; j++) {
                    const articleDateElement = await page.locator('.age').nth(j);
                    const articleDateText = await articleDateElement.getAttribute('title');

                    const articleDateString = articleDateText.split("T")[0];
                    if (articleDateString) {
                        const refDateString = referenceDate.split("T")[0];
                        expect.soft(articleDateString).toEqual(refDateString);
                    }
                }
            }
        });
    });


    test("should verify article content is visible", async ({ page }) => {
        const response = await page.goto("/front");
        expect(response?.status(), `HTTP status was ${response?.status()} after navigation`).toBeLessThan(400);

        const firstArticleTitle = page.locator(".submission .titleline > a").first();
        await expect(firstArticleTitle).toBeVisible();
        const titleText = await firstArticleTitle.textContent();
        expect(titleText?.trim().length).toBeGreaterThan(0);
    });

    test("should verify articles have valid URLs", async ({ page }) => {
        const response = await page.goto("/front");
        expect(response?.status(), `HTTP status was ${response?.status()} after navigation`).toBeLessThan(400);

        const firstArticleLink = await page.locator(".submission .titleline > a").first().getAttribute("href");
        expect(firstArticleLink).toMatch(/^https?:\/\/.+/);
    });
});

