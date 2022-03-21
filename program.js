const { google } = require("googleapis");
const yargs = require('yargs')

const argv = yargs.argv;

var id = argv._[0].split('/')[5]


class ValidURL {
  
  async initPuppeter() {
    const puppeteer = require('puppeteer');
    this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox',
        '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-extensions'],
    });
    this.page = await this.browser.newPage();
    this.page.setViewport({width: 1200, height: 764});
  }

async update() {
  
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = id;

  // Get metadata about spreadsheet
  const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  });

  // Read rows from spreadsheet
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Sheet1!A:A",
  });

  let values = getRows.data.values;

  let working = ["Working?"]

  for(var i=1;i<values.length;i++){
    var url = values[i][0];
    if(url.search("http")!==0) url="http://"+url;
    await this.page.goto(url,{'timeout': 20000, 'waitUntil':'networkidle2'})
    .then(()=>working.push("TRUE"))
    .catch((e)=>working.push("FALSE"))
  }

  // Write row(s) to spreadsheet

  for(var i=0;i<values.length;i++){
    await googleSheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `Sheet1!B${i+1}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[working[i]]],
      },
    });
  }
}

async closeBrowser(){
  await this.browser.close();
}

}

const run = async ()=>{
  const bot = new ValidURL();

  await bot.initPuppeter()

  await bot.update()

  await bot.closeBrowser()

}

run().catch(e=>console.log(e.message));



  