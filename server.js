const puppeteer = require("puppeteer");
const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

const transporter = nodemailer.createTransport({
  host: "[insert host]",
  port: 000,
  secure: true,
  auth: {
    user: "",
    pass: "",
  },
});

async function Scrape(password = "", email = "") {
  try {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(0);

    await page.goto("https://portal.nysc.org.ng/nysc1/ResumePayment.aspx", {
      waitUntil: "networkidle0",
    });

    await page.type(`.form-group [type="text"]`, email);
    await page.type(`.form-group [type="password"]`, password);
    await page.evaluateOnNewDocument(() => {
      window.open = () => null;
      window.print = () => null;
    });
    await Promise.all([
      page.click(`.form-group [type="submit"]`),
      page.waitForNavigation({
        waitUntil: ["domcontentloaded", "networkidle0"],
      }),
    ]);
    await page.evaluate(() => {
      if (document.querySelector(".ui-widget-overlay")) {
        document.querySelector(".ui-widget-overlay").style.display = "none";
      }
    });
    await page.screenshot({ path: "page.png", fullPage: true });

    await page.goto("https://portal.nysc.org.ng/nysc1/lgaclearance_CM.aspx", {
      waitUntil: "networkidle0",
    });

    await page.select("#gdvdetails_length > label > select", "100");

    await page.screenshot({ path: "clearance.png", fullPage: true });

    await page.goto("https://portal.nysc.org.ng/nysc1/home?logout=true", {
      waitUntil: "networkidle0",
    });
    await browser.close();
    const info = await transporter.sendMail({
      from: '"NYSC BOT',
      to: email,
      subject: "NYSC metrics",
      text: "Your NYSC docs",
      attachments: [
        {
          filename: "Dashboard.png",
          content: fs.createReadStream(path.join(__dirname, "page.png")),
        },
        {
          filename: "Clearance.png",
          content: fs.createReadStream(path.join(__dirname, "clearance.png")),
        },
      ],
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

Scrape(PASSWORD, EMAIL);
