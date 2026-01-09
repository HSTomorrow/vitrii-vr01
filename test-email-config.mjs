#!/usr/bin/env node

/**
 * Email Configuration Diagnostic Script
 *
 * This script tests if the SMTP configuration is working correctly
 * by attempting to send a test email and validating the setup.
 *
 * Usage: node test-email-config.mjs
 */

import nodemailer from "nodemailer";

console.log("🔍 EMAIL CONFIGURATION DIAGNOSTIC TEST\n");

// Check environment variables
console.log("📋 ENVIRONMENT VARIABLES:");
console.log("   SMTP_HOST:", process.env.SMTP_HOST || "NOT SET ❌");
console.log("   SMTP_PORT:", process.env.SMTP_PORT || "NOT SET ❌");
console.log("   SMTP_USER:", process.env.SMTP_USER || "NOT SET ❌");
console.log(
  "   SMTP_PASS:",
  process.env.SMTP_PASS ? "SET ✅ (hidden)" : "NOT SET ❌",
);
console.log("   MAIL_FROM:", process.env.MAIL_FROM || "NOT SET ❌");
console.log(
  "   SMTP_SECURE:",
  process.env.SMTP_SECURE || "NOT SET (defaults to false)",
);
console.log("");

// Validate configuration
let isConfigValid = true;
if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_PORT ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS
) {
  console.log("⚠️  WARNING: SMTP configuration is incomplete!");
  console.log("   Set the following environment variables:");
  console.log("   - SMTP_HOST");
  console.log("   - SMTP_PORT");
  console.log("   - SMTP_USER");
  console.log("   - SMTP_PASS");
  console.log("   - MAIL_FROM");
  isConfigValid = false;
}

if (!isConfigValid) {
  console.log("\n❌ Configuration validation FAILED");
  process.exit(1);
}

// Test SMTP connection
console.log("🔗 TESTING SMTP CONNECTION...\n");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP CONNECTION FAILED");
    console.log("   Error:", error.message);
    console.log("\n🔧 TROUBLESHOOTING:");
    console.log(
      "   1. Verify SMTP_HOST is correct (check with email provider)",
    );
    console.log(
      "   2. Verify SMTP_PORT is correct (usually 587 for TLS, 465 for SSL)",
    );
    console.log(
      "   3. Verify SMTP_USER is correct (usually full email address)",
    );
    console.log(
      "   4. Verify SMTP_PASS is correct (may need app-specific password for Gmail)",
    );
    console.log("   5. Check firewall/network connectivity to SMTP server");
    process.exit(1);
  } else {
    console.log("✅ SMTP CONNECTION SUCCESSFUL");
    console.log("");

    // Send test email
    console.log("📧 SENDING TEST EMAIL...\n");

    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@vitrii.com",
      to: process.env.SMTP_USER, // Send to the configured user
      bcc: "herestomorrow@outlook.com",
      subject: "[TEST] Vitrii Email Configuration",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #0066cc;">Vitrii Email Configuration Test</h1>
            <p>This is a test email to verify the email configuration is working correctly.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>From: ${process.env.MAIL_FROM || "noreply@vitrii.com"}</li>
              <li>SMTP Host: ${process.env.SMTP_HOST}</li>
              <li>SMTP Port: ${process.env.SMTP_PORT}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
            <p>If you received this email, the configuration is working!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated test email.</p>
          </div>
        </div>
      `,
      text: `
        Vitrii Email Configuration Test
        
        This is a test email to verify the email configuration is working correctly.
        
        Test Details:
        - From: ${process.env.MAIL_FROM || "noreply@vitrii.com"}
        - SMTP Host: ${process.env.SMTP_HOST}
        - SMTP Port: ${process.env.SMTP_PORT}
        - Timestamp: ${new Date().toISOString()}
        
        If you received this email, the configuration is working!
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("❌ EMAIL SENDING FAILED");
        console.log("   Error:", error.message);
        console.log("\n🔧 TROUBLESHOOTING:");
        console.log("   1. Check if email account allows less secure apps");
        console.log("   2. For Gmail: May need to use app-specific password");
        console.log("   3. Check if account has hit daily sending limits");
        console.log("   4. Verify recipient email address is valid");
        process.exit(1);
      } else {
        console.log("✅ EMAIL SENT SUCCESSFULLY");
        console.log("");
        console.log("📊 SEND DETAILS:");
        console.log("   Message ID:", info.messageId);
        console.log("   From:", process.env.MAIL_FROM);
        console.log("   To:", process.env.SMTP_USER);
        console.log("   BCC: herestomorrow@outlook.com");
        console.log("");
        console.log("📬 NEXT STEPS:");
        console.log("   1. Check your inbox for the test email");
        console.log("   2. Check herestomorrow@outlook.com for the BCC copy");
        console.log(
          "   3. If emails arrive, your configuration is working! ✅",
        );
        console.log("");
        console.log(
          "ℹ️  Note: It may take a few minutes for emails to arrive.",
        );
        process.exit(0);
      }
    });
  }
});
