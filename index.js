const fetch = require("node-fetch");
const HTMLParser = require("node-html-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const main = async () => {
  const response = await fetch(
    "https://sme.dsebd.org/sme_market-statistics.php"
  );

  const body = await response.text();

  const root = HTMLParser.parse(body);

  const data = root.querySelector("pre").childNodes[0]._rawText;
  const objData = data.split(/\r?\n/);

  let startIndex = 0;
  let endIndex = 0;

  let companyPriceData = [];

  //Finding the index of companys data
  for (const index in objData) {
    if (objData[index].includes("PRICES IN SCP PUBLIC TRANSACTIONS")) {
      startIndex = index;
    } else if (
      objData[index].includes(
        "Total number of scrips traded in SCP Public Market"
      )
    ) {
      endIndex = index;
    }
  }

  //Parsing the strings to int
  startIndex = parseInt(startIndex);
  endIndex = parseInt(endIndex);

  //Filtering out the companys with data
  for (let i = startIndex + 4; i <= endIndex - 4; i++) {
    companyPriceData.push(objData[i]);
  }

  //Filterting out the date
  let heardersStr = objData[startIndex];
  let headers = heardersStr.split(" ").filter((word) => word !== "");
  let date = headers[6];

  let finalData = [];

  for (const item of companyPriceData) {
    let strObj = item.split(" ").filter((word) => word !== "");

    let companyItem = {
      Ticker: strObj[0],
      Date: date.replaceAll("-", ""),
      Open: strObj[1],
      High: strObj[2],
      Low: strObj[3],
      Close: strObj[4],
      Volume: strObj[7],
    };

    finalData.push(companyItem);
  }

  console.log(finalData);

  try {
    const csvWriter = createCsvWriter({
      path: `${date}.csv`,
      header: [
        { id: "Ticker", title: "Ticker" },
        { id: "Date", title: "Date" },
        { id: "Open", title: "Open" },
        { id: "High", title: "High" },
        { id: "Low", title: "Low" },
        { id: "Close", title: "Close" },
        { id: "Volume", title: "Volume" },
      ],
    });

    csvWriter
      .writeRecords(finalData)
      .then(() =>
        console.log("\t\n\n ----The CSV file was written successfully----\n\n")
      );
  } catch (err) {
    console.log("Failed to write into CSV");
  }
};

main();
