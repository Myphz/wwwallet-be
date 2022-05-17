import nodemailer from "nodemailer"
import { promises as fs } from "fs";
import { EMAIL, EMAIL_SETTINGS, TEMPLATES_PATH } from "../config/config.js";
import { logError } from "./logger.helper.js";

export default async function sendEmail(template, to, from, subject, params) {
  const transport = nodemailer.createTransport(EMAIL_SETTINGS[from] || {});

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

  try {
    await transport.sendMail(options);
  } catch (err) {
    // Ignore errors if testing
    if (process.env.NODE_ENV === "test") return;
    logError(err);
  }
};

// Parse HTML file with the requested parameters
async function renderTemplate(template, params) {
  // Load layout and replace contactEmail
  let layout = await fs.readFile(`${TEMPLATES_PATH}layout.html`, { encoding: "utf-8" });
  layout = layout.replace(/{{ contactEmail }}/g, EMAIL.contact);
  // Load the requsted HTML template
  let file = await fs.readFile(`${TEMPLATES_PATH}${template}.html`, { encoding: "utf-8" });
  // Replace every {{ key }} in the HTML template with the corresponding value
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`{{ ${key} }}`, "g");
    file = file.replace(regex, value);
  };

  // Substitute {{ body }} in layout with the requested template
  file = layout.replace("{{ body }}", file);

  return file;
};