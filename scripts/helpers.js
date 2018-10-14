const fs = require('fs');

const getSurnameFile = countryCode => {
  const country = countryCode.toUpperCase();
  const fileName = `${__dirname}/../surnames/${country}.json`;
  return fileName;
}

const getSurnamesByCountry = countryCode => {
  let parsedContent = [];
  const fileName = getSurnameFile(countryCode);
  if (fs.existsSync(fileName)) {
    const rawContent = fs.readFileSync(fileName, 'utf8');
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (e) {}
  }
  return parsedContent;
}

const setSurnamesByCountry = (surnames, countryCode) => {
  const fileName = getSurnameFile(countryCode);
  try {
    const jsonContent = JSON.stringify(surnames, null, 2);
    fs.writeFileSync(fileName, jsonContent, 'utf8');
  } catch (e) {}
}

module.exports = {
  getSurnameFile,
  getSurnamesByCountry,
  setSurnamesByCountry,
};