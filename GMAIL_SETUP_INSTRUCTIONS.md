# 🔐 Gmail App-Specific Password Setup

## Problem

Gmail is rejecting the login with this error:

```
Invalid login: 535-5.7.8 Username and Password not accepted
```

This happens because **Gmail requires an App-Specific Password** for third-party applications (like our email sending system) when 2-Factor Authentication (2FA) is enabled on the account.

---

## ✅ Solution: Create App-Specific Password

### Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" in the left menu
3. Click on it and follow the prompts to enable it
4. You may need to provide a recovery email and phone number

### Step 2: Generate App-Specific Password

1. Go to: https://myaccount.google.com/apppasswords
   - You must be logged in to vitriimarketplace@gmail.com
2. If the page says you need to set up 2-Step Verification, go back to Step 1

3. Select the options:
   - **Select app**: "Mail"
   - **Select device**: "Windows Computer" (or your device type)

4. Google will generate a **16-character password** (looks like: `abcd efgh ijkl mnop`)

5. **Copy this password exactly** - this is what you'll use for SMTP_PASS

### Step 3: Update the Email Configuration

The app-specific password should look like: `xxxx xxxx xxxx xxxx` (16 characters with spaces)

When setting the environment variable, **remove the spaces**:

- With spaces: `abcd efgh ijkl mnop`
- Environment variable: `abcdefghijklmnop`

Use DevServerControl to set:

```
SMTP_PASS: [your 16-character app password without spaces]
```

---

## 🔍 Current Configuration Status

**Current Settings:**

```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: vitriimarketplace@gmail.com
SMTP_PASS: [currently using account password - NEEDS UPDATE]
MAIL_FROM: noreply@vitrii.com
BCC_1: herestomorrow@outlook.com
BCC_2: vitriimarketplace@gmail.com
SMTP_SECURE: false (TLS on port 587)
```

**What needs to change:**

- ❌ SMTP_PASS: Currently set to account password (vItrII2025)
- ✅ SMTP_PASS: Should be set to app-specific password (16 characters)
- ✅ BCC Setup: Both accounts will receive automatic copies:
  - herestomorrow@outlook.com
  - vitriimarketplace@gmail.com

---

## 🧪 Testing the New Password

After updating the SMTP_PASS:

1. Restart the dev server
2. Run the email test:
   ```bash
   node test-email-config.mjs
   ```
3. You should see:
   - ✅ SMTP CONNECTION SUCCESSFUL
   - ✅ EMAIL SENT SUCCESSFULLY
   - Message ID displayed

4. Check your inbox for the test email
5. Check herestomorrow@outlook.com for the BCC copy

---

## 📋 Checklist for Gmail Setup

- [ ] Account: vitriimarketplace@gmail.com is created
- [ ] 2-Step Verification is enabled
- [ ] App-Specific Password is generated
- [ ] App password copied (16 characters)
- [ ] Spaces removed from password
- [ ] SMTP_PASS updated in DevServerControl
- [ ] Dev server restarted
- [ ] test-email-config.mjs ran successfully
- [ ] Test email received in inbox
- [ ] BCC copy received in herestomorrow@outlook.com

---

## ⚠️ Alternative: Allow Less Secure Apps (NOT RECOMMENDED)

If you cannot use 2FA, you can enable "Less secure apps":

1. Go to: https://myaccount.google.com/lesssecureapps
2. Toggle ON "Allow less secure apps"
3. Use the regular account password

**Note:** This is less secure and Google may block login attempts anyway.

---

## 🆘 If Still Having Issues

If emails still don't send after updating the password:

1. **Double-check the password:**
   - Go back to https://myaccount.google.com/apppasswords
   - Generate a NEW app password (old ones can be revoked)
   - Copy the EXACT password with no changes

2. **Check the 16-character password has no spaces:**
   - Count characters: should be exactly 16
   - No spaces when setting SMTP_PASS

3. **Restart the dev server:**
   - The server caches transporter on startup
   - Need to restart after password change

4. **Run diagnostic again:**
   - `node test-email-config.mjs`
   - Check for connection success

5. **Check Gmail security alerts:**
   - Go to https://myaccount.google.com/notifications
   - Look for blocked sign-in attempts
   - You may need to approve the new location

---

## 📞 Support Resources

- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Gmail SMTP Settings: https://support.google.com/mail/answer/7126229
- 2-Step Verification: https://support.google.com/accounts/answer/185839

---

**Last Updated**: 2025-01-09  
**Email Account**: vitriimarketplace@gmail.com  
**Status**: ⏳ Waiting for App Password Setup
