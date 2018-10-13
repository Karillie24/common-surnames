const puppeteer = require('puppeteer');
const { getSurnamesByLanguage, setSurnamesByLanguage } = require(`${__dirname}/../scripts/helpers.js`);
const ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '1.0.0',
  addHelp: true,
  description: 'Cleans up surname .json file'
});
parser.addArgument(
  [ '--baseUrl' ],
  {
    // example: http://www.americanlastnames.us/last-names/Serbian/A/A-0.html
    help: 'base url of the americanlastnames.us surename overview of a certain language'
  }
);
parser.addArgument(
  [ '--language' ],
  {
    help: 'language code of the parsed surenames'
  }
);
var args = parser.parseArgs();

const languageCode = args.language;
const baseUrl = args.baseUrl;

if (!baseUrl) {
  console.error('Please provide a --language argument');
  return;
}

if (!languageCode) {
  console.error('Please provide a --language argument');
  return;
}

let allFoundSurnames = [];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(baseUrl);

  const allBaseLinks = await page.evaluate(() => {
    let links = [...document.querySelectorAll('.style1:nth-child(4) table a')];
    return links.map(a => a.href).filter(a => a && a.trim() !== "");
  });

  console.log('Found baselinks: ', allBaseLinks.length);

  for(let iBaseLink = 0; iBaseLink < allBaseLinks.length; iBaseLink++) 
  {
    let currentBaseLink = await allBaseLinks[iBaseLink];
    await page.goto(currentBaseLink, { waitUntil: 'domcontentloaded' });

    let nextPage = false;
    do {
      // fetch all the names from here
      let allRows = await page.evaluate(() => {
        let tds = [...document.querySelectorAll('table tbody tr:not(:first-child) td:first-child')];
        let names = tds.map(td => td.innerText.trim());
        names.pop();
        names.shift();
        return names;
      });
      
      const currentUrl = await page.url();
      console.log(`Found ${allRows.length} names on: ${currentUrl}`);

      // add them to the already found surnames
      allFoundSurnames = [...allFoundSurnames, ...allRows];

      // check if this has a next page button
      nextPage = await page.evaluate(() => {
        let nextLink = [...document.querySelectorAll('img[alt="Next Arror"]')];
        return nextLink.length > 0 ? nextLink[0].parentElement.href : false;
      });

      // if it a next page we will parse that too
      if (nextPage) {
        await page.goto(nextPage, { waitUntil: 'domcontentloaded' });
      }
    } while (nextPage);
  }
  await browser.close();

  console.log(`Found a total of ${allFoundSurnames.length}`);

  // add the found names to the already existing 
  // list
  const previousSavedSurnames = getSurnamesByLanguage(languageCode);
  setSurnamesByLanguage([...previousSavedSurnames, ...allFoundSurnames], languageCode);

  console.log(`Saved for language ${languageCode}`);
})();