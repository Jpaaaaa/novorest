// utils/printerService.js

import puppeteer from "puppeteer";
import escpos from "escpos";
import USB from "@node-escpos/usb-adapter";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { generateReceiptHTML } from "./templates/receiptTemplate.js";

escpos.USB = USB;
const { Printer, Image } = escpos;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function printOrderReceipt(order) {
  try {
    const html = generateReceiptHTML(order);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setViewport({ width: 576, height: 1000 }); // ✅ FIT RECEIPT SIZE
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshotPath = path.join(__dirname, "receipt.png");
    await page.screenshot({ path: screenshotPath, type: "png" });
    await browser.close();

    const image = await new Promise((resolve, reject) => {
      Image.load(screenshotPath, (img) => {
        if (!img) return reject(new Error("❌ Failed to load receipt image"));
        resolve(img);
      });
    });

    const device = new escpos.USB();
    const printer = new Printer(device);

    return new Promise((resolve, reject) => {
      device.open((err) => {
        if (err) return reject(err);

        try {
          printer
            .align("ct")
            .raster(image) // ✅ FIXED: no mode param
            .cut()
            .close();

          fs.unlinkSync(screenshotPath); // ✅ cleanup
          resolve();
        } catch (e) {
          console.error("❌ Print error:", e);
          reject(e);
        }
      });
    });
  } catch (err) {
    console.error("❌ Print failed:", err);
    throw err;
  }
}
