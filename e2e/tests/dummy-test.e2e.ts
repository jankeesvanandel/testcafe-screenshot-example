import { Selector } from 'testcafe';
import { compareElementScreenshot } from "../framework/compare-screenshots";

fixture('Example test').page('https://devexpress.github.io/testcafe/media/team-blog/')

const navContainer = Selector('.doc-nav-content');

test('Navigation works', async t => {
    await t.expect(navContainer.exists).ok({ timeout: 10000 });

    const comparedImages = await compareElementScreenshot(t, navContainer);
    await t.expect(comparedImages.areEqual).ok(comparedImages.errorMessage);
});
