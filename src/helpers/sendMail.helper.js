import nodemailer from "nodemailer"
import { promises as fs } from "fs";
import { EMAIL_SETTINGS, TEMPLATES_PATH } from "../config/config.js";

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

async function renderTemplate(template, params) {
  let file = await fs.readFile(`${TEMPLATES_PATH}${template}.html`, { encoding: "utf-8" });
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`{{ ${key} }}`, "g");
    file = file.replace(regex, value);
  }

  return file;
};