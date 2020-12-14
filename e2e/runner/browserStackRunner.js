process.env.runner = 'browserStack';
process.env.BROWSERSTACK_USE_AUTOMATE = '1';
process.env.BROWSERSTACK_PROJECT_NAME = 'My project name';
process.env.BROWSERSTACK_BUILD_ID = 'My build id';
process.env.BROWSERSTACK_NETWORK_LOGS = 'true';

/* We set --start-fullscreen because we always want to run the tests in fullscreen. This way it's easier to set the correct resolution,
 * and testcafe is unable to go to fullscreen because it uses fake click events and Chrome doesn't allow this.
 * We set the --autoplay-policy=no-user-gesture-required to allow for media playback without prior user interaction, since Testcafe doesn't
 * really do user interaction.
 */
process.env.BROWSERSTACK_CHROME_ARGS = '--start-fullscreen --autoplay-policy=no-user-gesture-required --allow-insecure-localhost';
process.env.BROWSERSTACK_DISPLAY_RESOLUTION = '1920x1080';

const createTestCafe = require('testcafe');

let testcafe = null;

createTestCafe('localhost', 1337, 1338).then(tc => {
    testcafe = tc;
    const runner = testcafe.createRunner();

    return runner
        .src(['tests/**/*.e2e.ts'])
        .browsers(['browserstack:chrome@85.0:Windows 10'])
        .concurrency(1)
        .reporter(['spec', {
            name: 'html',
            output: '../.reports/e2e/report.html'
        }])
        .screenshots({
            path: 'screenshots/'
        })
        .run({quarantineMode: true, skipJsErrors: true});
}).then(failedCount => {
    console.error('Tests failed: ' + failedCount);
    if (testcafe) {
        testcafe.close();
    }
});
