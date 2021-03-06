const path = require('path');
const smtpTransport = require('nodemailer-smtp-transport');

const templatesDir = path.join(__dirname, '../templates');
const EmailTemplate = require('email-templates');

const ROOT_URL = process.env.ROOT_URL;

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_CONTACT = process.env.EMAIL_CONTACT;
const EMAIL_HEADER_IMAGE = 'https://bit.ly/2QV3TpI'; // email-header.png

const NODE_ENV = process.env.NODE_ENV;

const options = {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
};

// const transporter = nodemailer.createTransport();
const transporter = smtpTransport(options);

const controller = {};
controller.transporter = transporter;

function sendOne(templateName, options, data) {
  if (NODE_ENV === 'dev') {
    console.log(templateName);
    console.log(JSON.stringify(data, '', 2));
  }
  const emailTemplate = new EmailTemplate({
    views: {
      root: templatesDir,
      options: {
        extension: 'hbs'
      }
    },
    juice: true,
    juiceResources: {
      preserveImportant: true,
      webResources: {
        relativeTo: path.resolve(templatesDir, '.', templateName)
      }
    },
    message: {
      from: EMAIL_CONTACT
    },
    transport: transporter
  });
  data.emailHeaderImage = EMAIL_HEADER_IMAGE;
  return emailTemplate
    .send({
      template: templateName,
      message: {
        to: options.to,
        subject: options.subject
        // html: html,
        // text: text
      },
      locals: data
    })
    .then(() => {
      console.log(`${templateName} Email sent successfully.`);
    })
    .catch(console.error);
}

/**
 * Send a verification email to a user, with a verification token to enter.
 * @param  {[type]}   email    [description]
 * @param  {[type]}   token    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
controller.sendVerificationEmail = function (email, token, callback) {
  const options = {
    to: email,
    subject: '[VandyHacks] - Verify your email'
  };

  const locals = {
    verifyUrl: ROOT_URL + '/verify/' + token
  };
  console.log('VERIFY URL: ' + locals.verifyUrl);

  sendOne('email-verify', options, locals);
};

/**
 * Send a password recovery email.
 * @param  {[type]}   email    [description]
 * @param  {[type]}   token    [description]
 * @param  {Function} callback [description]
 */
controller.sendPasswordResetEmail = function (email, token, callback) {
  const options = {
    to: email,
    subject: '[VandyHacks] - Password reset requested!'
  };

  const locals = {
    title: 'Password Reset Request',
    subtitle: '',
    description: 'Somebody (hopefully you!) has requested that your password be reset. If ' +
      'this was not you, feel free to disregard this email. This link will expire in one hour.',
    actionUrl: ROOT_URL + '/reset/' + token,
    actionName: 'Reset Password'
  };

  sendOne('email-link-action', options, locals);
};

/**
 * Send a password recovery email.
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 */
controller.sendPasswordChangedEmail = function (email, callback) {
  const options = {
    to: email,
    subject: '[VandyHacks] - Your password has been changed!'
  };

  const locals = {
    title: 'Password Updated',
    body: 'Somebody (hopefully you!) has successfully changed your password.'
  };

  sendOne('email-basic', options, locals);
};

module.exports = controller;
