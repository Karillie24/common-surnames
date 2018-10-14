const puppeteer = require('puppeteer');
const { getSurnamesByCountry, setSurnamesByCountry } = require(`${__dirname}/../scripts/helpers.js`);
const ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '1.0.0',
  addHelp: true,
  description: 'Cleans up surname .json file'
});
parser.addArgument(
  [ '--baseUrl' ],
  {
    required: true,
    // example: https://www.hearnames.com/pronunciations/filipino-and-tagalog-names/filipino-and-tagalog-surnames
    help: 'base url of the hearnames.com surename overview of a certain country'
  }
);
parser.addArgument(
  [ '--country' ],
  {
    required: true,
    help: 'country code of the parsed surenames'
  }
);
var args = parser.parseArgs();

const countryCode = args.country;
const baseUrl = args.baseUrl;

let allFoundSurnames = [];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(baseUrl);

  let nextPage = false;
  do {
    // fetch all the names from here
    let allNamesParsed = await page.evaluate(() => {
      let elements = [...document.querySelectorAll('[itemprop="name"]')];
      return elements.map(element => element.innerText.trim());
    });

    // check if this shows the real and a english version
    let allNames = [];
    const addNamesFromRawString = rawString => 
      rawString.split(',').forEach(name => 
        allNames.push(name.trim()));

    allNamesParsed.forEach(name => {
      let tokens = name.split(' (');
      addNamesFromRawString(tokens[0].trim());
      if (tokens.length === 2) {
        addNamesFromRawString(tokens[1].split(')').join(''));
      }
    });
    
    const currentUrl = await page.url();
    console.log(`Found ${allNames.length} names on: ${currentUrl}`);

    // add them to the already found surnames
    allFoundSurnames = [...allFoundSurnames, ...allNames];

    // check if this has a next page button
    nextPage = await page.evaluate(() => {
      let nextLink = [...document.querySelectorAll('.pagenav[data-original-title="Next"]')];
      return nextLink.length > 0 ? nextLink[0].href : false;
    });

    // if it a next page we will parse that too
    if (nextPage) {
      await page.goto(nextPage, { waitUntil: 'domcontentloaded' });
    }
  } while (nextPage);
  
  await browser.close();

  console.log(`Found a total of ${allFoundSurnames.length}`);

  // add the found names to the already existing 
  // list
  const previousSavedSurnames = getSurnamesByCountry(countryCode);
  setSurnamesByCountry([...previousSavedSurnames, ...allFoundSurnames], countryCode);

  console.log(`Saved for country ${countryCode}`);
})();