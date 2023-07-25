import { PdfReader, Rule } from "pdfreader";

import fs from "fs";
import readline from "readline";

import { PDFExtract } from "pdf.js-extract";
const pdfExtract = new PDFExtract();
const options = {}; /* see below */

var readFile = function (file) {
  return new Promise(function (resolve, reject) {
    var lines = [];
    var rl = readline.createInterface({
      input: fs.createReadStream("./faturas/" + file),
    });

    rl.on("line", function (line) {
      // Split line on comma and remove quotes
      var columns = line.replace(/"/g, "").split(",");

      lines.push(columns);
    });

    rl.on("close", function () {
      // Add newlines to lines
      lines = lines.join("\n");
      resolve(lines);
    });
  });
};

const processItem = Rule.makeItemProcessor([
  // Rule.on(/^kWh \"(.*)\"$/)
  // let regex = /Itens da Fatura Unid\. [A-Za-z]+\. Preço Unit Valor \(R\$\) PIS\/COFINS Base Calc\. Aliq\. ICMS Tarifa Unit\. ICMS ICMS Energia Elétrica kWh 100 0,74860466 74,84 0,65313000 /i
  Rule.on(/Energia Elétrica kWh [0-9]+/i)
    .extractRegexpValues()
    .then(displayValues),
  //   .then((teste) => { return teste })
]);

function displayValues(values) {
  console.log("------");
  console.log("=>", values);
}

fs.readdir("./faturas", function (err, files) {
  for (var i = 0; i < files.length; i++) {
    console.log(files[i]);

    pdfExtract.extract(`faturas/${files[i]}`, options, (err, data) => {
      const invoice = {
        client: 0,
        reference: 0,
        date: 0,
        energyQuantity: 0,
        energyPriceUnit: 0,
        energyValue: 0,
        injectedQuantity: 0,
        injectedPriceUnit: 0,
        injectedValue: 0,
        sICMSQuantity: 0,
        sICMSPriceUnit: 0,
        sICMSValue: 0,
        publicContributionValue: 0,
        total: 0,
      };

      if (err) return console.log(err);
      invoice.energyQuantity = data.pages[0].content[31].str;
      invoice.energyPriceUnit = data.pages[0].content[33].str;
      invoice.energyValue = data.pages[0].content[35].str;

      invoice.injectedQuantity = data.pages[0].content[42].str;
      invoice.injectedPriceUnit = data.pages[0].content[44].str;
      invoice.injectedValue = data.pages[0].content[46].str;

      invoice.sICMSQuantity = data.pages[0].content[53].str;
      invoice.sICMSPriceUnit = data.pages[0].content[55].str;
      invoice.sICMSValue = data.pages[0].content[57].str;

      invoice.publicContributionValue = data.pages[0].content[62].str;

      if (data.pages[0].content[63].str === "Taxa de 2ª via de débito") {
        invoice.total = data.pages[0].content[69].str;
      } else invoice.total = data.pages[0].content[66].str;

      //   invoice.reference = data.pages[0].content[211].str;
      //   data.pages[0].content[239].str

      //   console.log(data.pages[0].content[214].str);
      if (parseInt(data.pages[0].content[211].x) === 150) {
        invoice.reference = data.pages[0].content[211].str;
      } else invoice.reference = data.pages[0].content[214].str;

      if (data.pages[0].content[208].str === " ") {
        invoice.date = data.pages[0].content[211].str;
      } else {
        invoice.date = data.pages[0].content[208].str;
      }

      if (parseInt(data.pages[0].content[226].x) === 22) {
        invoice.client = data.pages[0].content[226].str;
      } else if (
        parseInt(data.pages[0].content[228].x) === 22 &&
        data.pages[0].content[228].str !== ""
      ) {
        invoice.client = data.pages[0].content[228].str;
      } else {
        invoice.client = data.pages[0].content[229].str;
      }

      console.log(invoice);
      console.log("-----------------------");
    });

    // new PdfReader().parseFileItems(`faturas/${files[i]}`, (err, item) => {
    //   if (err) console.error("error:", err);
    //   else if (!item) console.warn("end of file");
    //   else
    //   if (item.text) {
    //     // processItem(item);
    //     const teste = item.text.split("\n")
    //     console.log(item.text)
    //   }
    // });
  }
});
