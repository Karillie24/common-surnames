const fs = require('fs');

const getSurnameFile = languageCode => {
  const language = languageCode.toUpperCase();
  const fileName = `${__dirname}/../surnames/${language}.json`;
  return fileName;
}

const getSurnamesByLanguage = languageCode => {
  let parsedContent = [];
  const fileName = getSurnameFile(languageCode);
  if (fs.existsSync(fileName)) {
    const rawContent = fs.readFileSync(fileName, 'utf8');
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (e) {}
  }
  return parsedContent;
}

const setSurnamesByLanguage = (surnames, languageCode) => {
  const fileName = getSurnameFile(languageCode);
  try {
    const jsonContent = JSON.stringify(surnames, null, 2);
    fs.writeFileSync(fileName, jsonContent, 'utf8');
  } catch (e) {}
}

module.exports = {
  getSurnameFile,
  getSurnamesByLanguage,
  setSurnamesByLanguage,
};