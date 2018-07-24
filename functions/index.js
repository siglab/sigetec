'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});

admin.initializeApp();
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
      const technology = change.after.val();
      if (change.before.val().status == 'En diligencia' && technology.status == 'Registrada') {
        const subject = 'Notificación SIGETec: Notificación de registro de tecnología.';
        const message = 'La tecnología ' + technology.name + 
          ' ha sido registrada exitosamente en el sistema integrado de gestión estratégica' + 
          ' de tegnologías (SIGETec) de la Universidad del Valle.' + 
          '\n Este es un mensaje autogenerado. Por favor no intente responder este mensaje.'
        sendEmail(technology['principal-researcher-email'], subject, message);
      }

      admin.database().ref('/roles/definition').once("value").then(snapshot => {
          snapshot.forEach(function(data) {
              var rol = data.val();
              if(rol.allowedStatus.notify !== undefined){
                  rol.allowedStatus.notify.forEach(function(status){
                      if(status === technology.status ){
                          rol.users.forEach(function(user){
                              // console.log('Send email to:', user);
                              console.log(change.before.val());
                              console.log(change.after.val());
                              var subject = "";
                              var message = "";
                              if (change.before.val().status == 'En diligencia' && technology.status == 'Registrada'){
                                subject = 'Notificación SIGETec: Notificación de registro de tecnología.';
                                message = 'La tecnología ' + technology.name + 
                                  ' ha sido registrada en el sistema.' + 
                                  '\nEste es un mensaje autogenerado. Por favor no intente responder este mensaje.'
                              }else{
                                subject = 'Notificación SIGETec: Notificación de actualización de tecnología ' + technology.name;
                                message = 'La tecnología ' + technology.name + 'ha sido atualizada por ' +
                                  technology.updatesBy + '\n Este es un mensaje autogenerado. Por favor intente responder este mensaje.'
                              }
                              sendEmail(user, subject, message);
                              // sendEmail(technology.createdBy, technology.name);
                          });
                      }
                  });
              }
          });
      });
    }
);

function sendEmail(email, subject, message){
  try{
    const mailOptions = {
      from: `SIGETec <noreply@sigetec.univalle.edu.co>`,
      to: email
    };
    mailOptions.subject = subject;
    mailOptions.text = message;
    // mailOptions.subject = `Notificación SIGETec: La tecnologia ${technologyName || ''} fue actualizada.`;
    // mailOptions.text = `La tecnologia ${technologyName || ''} fue actualizada!`;
    return mailTransport.sendMail(mailOptions).then(() => {
      console.log('New change status email sent to:', email);
    });
  }catch(e){
    console.log('Ocurrió un erro:');
    console.log(e);
  }
};

var registeredTechnologies = {};
var processedTechnologies = 0;

exports.getTechnologies = functions.https.onRequest((req,res)=>{
  cors(req,res,() => {
    var db = admin.database();
    var ref = db.ref("/technologies");
    ref.orderByChild("status").startAt('Registrada').endAt('Registrada'+"\uf8ff").once('value', function(data) {
      registeredTechnologies = data.val();
      if(Object.keys(registeredTechnologies).length == 0){
        res.status(200).json(registeredTechnologies);
      }else{
        for (var i = 0; i < Object.keys(registeredTechnologies).length ; i++) {
          getTechnologyDetails(req, res, Object.keys(registeredTechnologies)[i]);
        }
      }
      // res.status(200).json(data);
    });
  });
});

function getTechnologyDetails (req, res, uuid){
  var db = admin.database();
  var ref = db.ref("/technologies-detail/" + registeredTechnologies[uuid]['technologyId']);
  ref.once('value', function(data) {
    registeredTechnologies[uuid]['details'] = {};
    registeredTechnologies[uuid]['details'] = data.val();
    processedTechnologies = processedTechnologies + 1;
    if (processedTechnologies == Object.keys(registeredTechnologies).length) {
      res.status(200).json(registeredTechnologies);
    }
  });
};