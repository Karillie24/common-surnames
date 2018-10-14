const puppeteer = require("puppeteer");
const {
  getSurnamesByLanguage,
  setSurnamesByLanguage
} = require(`${__dirname}/../scripts/helpers.js`);
const ArgumentParser = require("argparse").ArgumentParser;
var parser = new ArgumentParser({
  version: "1.0.0",
  addHelp: true,
  description: "Cleans up surname .json file"
});
parser.addArgument(["--baseUrl"], {
  // example: https://surnames.behindthename.com/submit/names/usage/filipino
  help:
    "base url of the behindthename.com surename overview of a certain language"
});
parser.addArgument(["--language"], {
  help: "language code of the parsed surenames"
});
var args = parser.parseArgs();

const languageCode = args.language;
const baseUrl = args.baseUrl;

if (!baseUrl) {
  console.error("Please provide a --language argument");
  return;
}

if (!languageCode) {
  console.error("Please provide a --language argument");
  return;
}

let allFoundSurnames = [];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(baseUrl);

  let nextPage = false;
  do {
    // fetch all the names from here
    let allNames = await page.evaluate(() => {
      let elements = [...document.querySelectorAll(".listname > a")];

      const capitalize = string =>
        `${string.charAt(0).toUpperCase()}${string.slice(1).toLowerCase()}`;

      return elements.map(element => capitalize(element.innerText.trim()));
    });

    const currentUrl = await page.url();
    console.log(`Found ${allNames.length} names on: ${currentUrl}`);

    // add them to the already found surnames
    allFoundSurnames = [...allFoundSurnames, ...allNames];

    // check if this has a next page button
    nextPage = await page.evaluate(() => {
      let nextLink = [
        ...document.querySelectorAll("#div_pagination > div > a:last-child")
      ];
      return nextLink.length > 0 && nextLink[0].innerText.includes("Next")
        ? nextLink[0].href
        : false;
    });

    // if it a next page we will parse that too
    if (nextPage) {
      await page.goto(nextPage, { waitUntil: "domcontentloaded" });
    }
  } while (nextPage);

  await browser.close();

  console.log(`Found a total of ${allFoundSurnames.length}`);

  // add the found names to the already existing
  // list
  const previousSavedSurnames = getSurnamesByLanguage(languageCode);
  setSurnamesByLanguage(
    [...previousSavedSurnames, ...allFoundSurnames],
    languageCode
  );

  console.log(`Saved for language ${languageCode}`);
})();
