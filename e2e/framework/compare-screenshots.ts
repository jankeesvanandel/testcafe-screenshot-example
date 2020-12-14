import { createCanvas, loadImage } from 'canvas';
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import Config from './config';

const compareImages = require('resemblejs/compareImages');

const screenshotRootDirName = 'screenshots/';
const baselineScreenshotDirName = 'baseline/';
const actualScreenshotDirName = 'tests/';
const diffScreenshotDirName = 'diff/';

const baseDir = resolve(screenshotRootDirName);

function createDirectoryIfNotExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true});
  }
}

async function combineReportImage(baselineScreenshotPath: string, testScreenshotPath: string, diffScreenshotPath: string): Promise<void> {
  const baselineImage = await loadImage(baselineScreenshotPath);
  const testImage = await loadImage(testScreenshotPath);
  const diffImage = await loadImage(diffScreenshotPath);

  const {width, height} = baselineImage;

  const canvas = createCanvas(width * 3, height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baselineImage, 0, 0, width, height);
  ctx.drawImage(testImage, width, 0, width, height);
  ctx.drawImage(diffImage, 2 * width, 0, width, height);

  // add header
  ctx.font = '15px Impact';
  ctx.fillText('Baseline', 0, 12);
  ctx.fillText('Actual', width, 12);
  ctx.fillText('Diff', width * 2, 12);

  const out = createWriteStream(testScreenshotPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise((res, rej) => {
    out.on('finish', res);
    out.on('error', (e) => {
      rej(e);
      out.close();
    });
    stream.on('error', (e) => {
      rej(e);
      out.close();
    });
  });
}

export async function compareElementScreenshot(t: TestController, element: Selector): Promise<{ areEqual: boolean, errorMessage: string}> {
  // @ts-ignore
  let testCase = t.testRun.test.name;

  // Workaroud to retrieve the (non publicly accessible) runId.
  // See: https://devexpress.github.io/testcafe/documentation/guides/basic-guides/run-tests.html#quarantine-mode
  // and: https://devexpress.github.io/testcafe/documentation/guides/advanced-guides/screenshots-and-videos.html#path-pattern-placeholders
  const testRun = (t as any).testRun;
  const runId = ((testRun.quarantine || {}).attempts || []).length + 1;

  const imgNameBase = `${testCase}_${t.browser.name}_${t.browser.os.name}`;

  const actualScreenshotDir = resolve(baseDir, actualScreenshotDirName);
  const baselineScreenshotDir = resolve(baseDir, baselineScreenshotDirName);
  const diffScreenshotDir = resolve(baseDir, diffScreenshotDirName);

  createDirectoryIfNotExists(actualScreenshotDir);
  createDirectoryIfNotExists(baselineScreenshotDir);
  createDirectoryIfNotExists(diffScreenshotDir);

  const actualScreenshotPath = resolve(actualScreenshotDir, `${imgNameBase}_${runId}.png`);
  const baselineScreenshotPath = resolve(baselineScreenshotDir, `${imgNameBase}.png`);
  const diffScreenshotPath = resolve(diffScreenshotDir, `${imgNameBase}_${runId}.png`);

  await t.takeElementScreenshot(element, actualScreenshotDirName + `${imgNameBase}_${runId}.png`);

  if (!existsSync(baselineScreenshotPath)) {
    copyFileSync(actualScreenshotPath, baselineScreenshotPath);
    await t.expect('no baseline').notOk('No baseline present, saving actual element screenshot as baseline');
  }

  const options = {
    output: {
      errorColor: {
        red: 255,
        green: 0,
        blue: 255
      },
      errorType: 'movement',
      outputDiff: true,
      largeImageThreshold: 0
    },
    scaleToSameSize: true,
    ignore: 'antialiasing'
  };

  // compare images
  const result = await compareImages(
    await readFileSync(baselineScreenshotPath),
    await readFileSync(actualScreenshotPath),
    options
  );

  writeFileSync(diffScreenshotPath, result.getBuffer());

  // write combined image to testScreenshot for reporting
  await combineReportImage(baselineScreenshotPath, actualScreenshotPath, diffScreenshotPath);

  return {
    areEqual: result.rawMisMatchPercentage <= Config.MAX_DIFF_PERC,
    errorMessage: `Element screenshot difference greater then max diff percentage: expected ${result.rawMisMatchPercentage} to be less or equal to ${Config.MAX_DIFF_PERC}`
  };
}
