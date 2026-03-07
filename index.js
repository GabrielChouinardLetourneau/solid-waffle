// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
    // launch browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // go to Hacker News
    const response = await page.goto("https://news.ycombinator.com/newest");
    if (!response || response.status() >= 400) {
        throw new Error(`Navigation failed with HTTP ${response?.status()}`);
    }

    // Verify that there are articles on the page before proceeding
    let articleCount = await page.locator(".submission").count();
    if (articleCount === 0) {
        throw new Error("No articles found on the page");
    }

    // Track total articles tested across all batches
    let totalArticlesTested = 0;
    let pointer = 0;
    const articlesToTest = 100;
    let previousPageLastArticleTime = null; // Store the last article's timestamp for cross-batch comparison
    let failures = [];

    while (totalArticlesTested < articlesToTest) {
        // If we've reached the last position in this batch, load more
        if (pointer > articleCount - 2) {
            const moreButton = page.locator("a.morelink");
            if (await moreButton.isVisible()) {
                // Save the last article's timestamp before loading the next page
                const previousPageLastArticleElement = await page.locator('.age').nth(articleCount - 1);
                previousPageLastArticleTime = await previousPageLastArticleElement.getAttribute('title');

                await moreButton.click();
                articleCount = await page.locator(".submission").count(); // Update article count after loading new batch
                pointer = 0; // Reset pointer for next batch
            } else {
                break; // No more articles available
            }
        }

        const leftArticleElement = await page.locator('.age').nth(pointer);
        const rightArticleElement = await page.locator('.age').nth(pointer + 1);

        const leftArticleTime = await leftArticleElement.getAttribute('title');
        const rightArticleTime = await rightArticleElement.getAttribute('title');

        if (!leftArticleTime || !rightArticleTime) {
            failures.push(`Missing timestamp at positions ${pointer} or ${pointer + 1}`);
            pointer++;
            continue;
        }

        // If this is the first article after a reload and we have a previous timestamp, so we compare them before doing the regular comparisons
        if (pointer === 0 && previousPageLastArticleTime) {
            const prevUnix = parseInt(previousPageLastArticleTime.split(' ')[1]);
            const currentUnix = parseInt(leftArticleTime.split(' ')[1]);
            const prevTime = new Date(prevUnix * 1000);
            const currentTime = new Date(currentUnix * 1000);
            if (prevTime.getTime() < currentTime.getTime()) {
                failures.push(`Cross-page ordering failure: last article of previous page (${prevTime.toISOString()}) is older than first of next page (${currentTime.toISOString()})`);
            }
            totalArticlesTested++;
            previousPageLastArticleTime = null; // Clear the previous page's last article time after the first comparison
        }

        const leftUnix = parseInt(leftArticleTime.split(' ')[1]);
        const rightUnix = parseInt(rightArticleTime.split(' ')[1]);
        const leftTime = new Date(leftUnix * 1000);
        const rightTime = new Date(rightUnix * 1000);
        if (leftTime.getTime() < rightTime.getTime()) {
            failures.push(`Ordering failure at positions ${pointer} and ${pointer + 1}: ${leftTime.toISOString()} is older than ${rightTime.toISOString()}`);
        }
        totalArticlesTested++;
        pointer++;
    }

    await browser.close();

    // Verify we actually tested the full 100 comparisons and didn't exit early (e.g. due to lack of articles)
    if (totalArticlesTested < articlesToTest) {
        failures.push(`Only tested ${totalArticlesTested} of ${articlesToTest} required comparisons — "More" button may have been unavailable`);
    }

    if (failures.length > 0) {
        console.error(`\n${failures.length} ordering failure(s) found:`);
        failures.forEach(f => console.error(` - ${f}`));
        process.exit(1);
    } else {
        console.log(`\nAll ${totalArticlesTested} article comparisons passed. Articles are sorted from newest to oldest.`);
    }
}

(async () => {
    await sortHackerNewsArticles();
})();
