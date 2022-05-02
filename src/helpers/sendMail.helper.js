import nodemailer from "nodemailer"
import { promises as fs } from "fs";
import { EMAIL, EMAIL_SETTINGS, TEMPLATES_PATH } from "../config/config.js";

export default async function sendEmail(template, to, from, subject, params) {
  const transport = nodemailer.createTransport(EMAIL_SETTINGS);

  const options = {
    from: `wwwallet <${from}>`,
    to,
    subject,
    // Always attach logo
    attachments: [{
      path: TEMPLATES_PATH + "images/logo.png",
      cid: "logo",
      contentDisposition: "inline"
    }]
  };

  options.html = await renderTemplate(template, params);

  await transport.sendMail(options);
};

// Parse HTML file with the requested parameters
async function renderTemplate(template, params) {
  let file = await fs.readFile(`${TEMPLATES_PATH}${template}.html`, { encoding: "utf-8" });
  // Replace every {{ key }} in the HTML file with the corresponding value
  for (const [key, value] of Object.entries({ contactEmail: EMAIL.contact, ...params })) {
    const regex = new RegExp(`{{ ${key} }}`, "g");
    file = file.replace(regex, value);
  }

  return file;
};