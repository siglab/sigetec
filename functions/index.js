'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const nodemailer = require('nodemailer');
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(`smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

exports.statusChangeTrigger = functions.database.ref('/technologies/{technologyId}')
    .onWrite((change, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const technology = change.after.val()();
      admin.database().ref('/roles/definition').once("value").then(snapshot => {
          snapshot.forEach(function(data) {
              var rol = data.val();
              if(rol.allowedStatus.notify !== undefined){
                  rol.allowedStatus.notify.forEach(function(status){
                      if(status === technology.status ){
                          rol.users.forEach(function(user){
                              console.log('Send email to:', user);
                              sendEmail(user, technology.name);
                              sendEmail(technology.createdBy, technology.name);
                          });
                      }
                  });
              }
          });
      });
    });

function sendEmail(email, technologyName) {
  const mailOptions = {
    from: `SIGETEC <noreply@firebase.com>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `La tecnologia ${technologyName || ''} fue actualizada.`;
  mailOptions.text = `La tecnologia ${technologyName || ''} fue actualizada!`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New change status email sent to:', email);
  });
}