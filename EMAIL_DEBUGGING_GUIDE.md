# 📧 Email Sending Debugging and Validation Guide

## Current Configuration

**Email Service**: vitriimarketplace@gmail.com
**BCC (Cópia Oculta)**: vitriimarketplace@gmail.com
**SMTP Provider**: Gmail (smtp.gmail.com:587) - **REQUIRES CONFIGURATION**

---

## ✅ Email Configuration Status

All emails sent by the system (Password Reset, Welcome) now include:

- **From**: vitriimarketplace@gmail.com
- **BCC**: herestomorrow@outlook.com (automatic copy to monitoring account)

---

## 🔍 How to Validate Email Sending

### 1. **Check Server Logs**

When an email is sent, you'll see detailed logs in the dev server console:

```
✅ Email de redefinição de senha enviado com sucesso
   - Para: user@example.com
   - De: vitriimarketplace@gmail.com
   - BCC: herestomorrow@outlook.com
   - Message ID: <unique-id@domain.com>
   - Preview URL: https://ethereal.email/message/...
```

**What Each Line Means:**

- ✅ = Email was sent successfully
- Para = Recipient email address
- De = Sender email (must be vitriimarketplace@gmail.com)
- BCC = Hidden copy recipient
- Message ID = Unique identifier for tracking
- Preview URL = Test preview link (only in development)

### 2. **Monitor the BCC Account**

Check **herestomorrow@outlook.com** for incoming emails:

- Log in to herestomorrow@outlook.com
- Look in the Inbox folder
- Search for emails from vitriimarketplace@gmail.com
- Every password reset or welcome email will appear here automatically

### 3. **Check for Errors**

If emails fail to send, the logs will show:

```
❌ Erro ao enviar email de redefinição de senha:
   - Destinatário: user@example.com
   - SMTP Host: smtp.gmail.com
   - SMTP Port: 587
   - SMTP User: vitriimarketplace@gmail.com
   - Error details: [error message]
```

**Common Issues:**

- ❌ "SMTP authentication failed" → Check SMTP_PASS (password)
- ❌ "Connection timeout" → Check internet connection or firewall
- ❌ "Invalid credentials" → Check SMTP_USER and SMTP_PASS
- ❌ "Less secure apps not allowed" → Gmail may require app-specific password

---

## 🚀 Testing Password Reset Email

1. Go to `/esqueci-senha` (Forgot Password page)
2. Enter your email address
3. Click "Enviar Link de Reset"
4. **Check dev server console for:**
   - ✅ Email sent confirmation
   - Message ID
   - BCC recipient confirmation

5. **Check herestomorrow@outlook.com inbox** for the email copy
6. Click the reset link from either inbox to verify it works

---

## 📊 Environment Variables Status

The following must be set in DevServerControl:

| Variable    | Value                       | Status          |
| ----------- | --------------------------- | --------------- |
| SMTP_HOST   | smtp.gmail.com              | ✅ Set          |
| SMTP_PORT   | 587                         | ✅ Set          |
| SMTP_USER   | vitriimarketplace@gmail.com | ✅ Set          |
| SMTP_PASS   | [App Password]              | ✅ Set (secure) |
| SMTP_SECURE | false                       | ✅ Set (TLS)    |
| MAIL_FROM   | vitriimarketplace@gmail.com | ✅ Set          |
| APP_URL     | http://localhost:5173       | ✅ Set          |

---

## 🔧 Why Email Might Not Arrive

### **Scenario 1: Email Shows "Sent" in Logs but Not Received**

**Possible Causes:**

1. Email in Spam folder (common with new email accounts)
2. Gmail account security settings
3. Recipient email address typo
4. Email provider blocking the sender

**Solutions:**

1. Check spam/junk folders in recipient email
2. Add vitriimarketplace@gmail.com to contacts/safe senders
3. Verify the email address in the form was correct
4. Check herestomorrow@outlook.com inbox (BCC copy) - if it's there, the email was sent correctly

### **Scenario 2: Email Shows Error in Logs**

**Check the specific error message:**

- Look for "❌ Erro ao enviar email"
- Note the error details
- Verify SMTP credentials are correct
- Ensure internet connection is active

### **Scenario 3: No Logs Appear**

**Possible Causes:**

1. Server didn't process the request
2. Form validation failed
3. API endpoint not responding

**Solutions:**

1. Check browser console for JavaScript errors
2. Check network tab to see if the API call was made
3. Verify the email address in the form is valid
4. Look for validation error messages in the UI

---

## 📋 Email Function Reference

### Password Reset Email

- **Sent by**: `/api/auth/forgot-password` endpoint
- **Function**: `sendPasswordResetEmail()`
- **Contents**: Reset link valid for 1 hour
- **Recipients**: User email + BCC to herestomorrow@outlook.com

### Welcome Email

- **Sent by**: `/api/auth/signup` endpoint
- **Function**: `sendWelcomeEmail()`
- **Contents**: Account creation confirmation
- **Recipients**: User email + BCC to herestomorrow@outlook.com

---

## 🎯 Validation Checklist

When testing email functionality:

- [ ] Server logs show "✅ Email enviado com sucesso"
- [ ] Message ID is displayed in logs
- [ ] BCC confirmation shows herestomorrow@outlook.com
- [ ] Email arrives in recipient inbox (check within 5 minutes)
- [ ] Check herestomorrow@outlook.com for copy
- [ ] Reset link is clickable and working
- [ ] No error messages in server console
- [ ] No error messages in browser console

---

## 📞 Troubleshooting Steps

### Critical Issue: Gmail Authentication Failed

If diagnostic shows:

```
❌ SMTP CONNECTION FAILED
Invalid login: 535-5.7.8 Username and Password not accepted
```

**This is a GMAIL SECURITY ISSUE** - Gmail requires an App-Specific Password!

**Solution**: Follow **GMAIL_SETUP_INSTRUCTIONS.md**

1. Enable 2-Step Verification
2. Generate App-Specific Password at https://myaccount.google.com/apppasswords
3. Update SMTP_PASS with the 16-character password
4. Restart dev server
5. Run: `node test-email-config.mjs` to verify

### Other Troubleshooting

1. **Check if email was sent:**
   - Look at server logs for "✅ Email enviado"

2. **Verify BCC is working:**
   - Check herestomorrow@outlook.com inbox
   - If BCC copy is there, the email system is working

3. **Verify SMTP credentials:**
   - Use the values from DevServerControl settings
   - Ensure no typos in email or password

4. **Test network connection:**
   - Ensure stable internet connection
   - Run: `node test-email-config.mjs` to test SMTP connection

5. **Check Gmail security:**
   - Use app-specific password, not account password
   - Ensure 2-Step Verification is enabled
   - Check https://myaccount.google.com/notifications for blocked attempts

---

## 📝 Logs to Save for Support

If you need help, gather these logs:

1. Full server console output from email send attempt
2. Browser console errors (F12 → Console tab)
3. Network request details (F12 → Network tab)
4. Time email was sent
5. Email address used for testing
6. Screenshot of error messages (if any)

---

**Last Updated**: 2025-01-09  
**System**: Vitrii Marketplace Email Service
