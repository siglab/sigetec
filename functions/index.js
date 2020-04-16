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
// TODO: Configure the 'gmail.email' and  'gmail.password' Google Cloud environment variables.
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(`smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

// Cloud functions
// Email notifications when a technology is registered or returned
exports.statusChangeTrigger = functions.database.ref('/technologies/{technologyId}')
    .onWrite((change, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const previousVer = change.before.val();
      const technology = change.after.val();
      if (previousVer && previousVer.status == 'En diligencia' && technology.status == 'Registrada') {
        var allEmailsQuee = [];        
        const mainSubject = 'Notificación SigeTEC: Notificación de registro de nueva tecnología.';
        const mainMessage = 'La tecnología titulada "' + technology.name + 
          '" ha sido registrada exitosamente en el sistema integrado de gestión estratégica' + 
          ' de tecnologías (SigeTEC) de la Universidad del Valle. \n \n' +
          'Detalles de tecnología registrada: \n'+
          'Investigador principal: ' + technology['principal-researcher-email'] + '. \n' +
          'Tipo de tecnología: ' + technology['technology-type'] + '. \n' +
          'Identificador generado por el sistema: ' + technology['technologyId'] + '. \n\n' +
          'Su tecnología será procesada por nuestro personal de la OTRI. \nMuchas gracias por utilizar SigeTEC.' +
          '\n\nEste es un mensaje autogenerado. Por favor no intente responder este mensaje.';
        const dataTreatmenSubject = 'Notificación SigeTEC: Notificación de registro de datos personales en nueva tecnología registrada.'
        const dataTreatmentMessage = 'Se le notifica que sus datos personales fueron registrados por ' + technology['principal-researcher-email']  + 
          ' como coinvestigador en la tecnología "' + technology.name + '"; identificada con el id ' + 
          technology['technologyId'] + ' en el sistema integrado de gestión estratégica' + 
          ' de tecnologías (SigeTEC), de la Oficina de Transferencia de Resultados de Investigación (OTRI), ' +
          'perteneciente a la Vicerrectoría de Investigaciones de la Universidad del Valle. \n\n' + 
          'Esta tecnología será procesada por nuestro personal y sus datos serán utlizados en dicho proceso de acuerdo a la política institucional de ' + 
          'tratamiento de la información personal. Para conocer más detalles respecto a la política de tratamiento de la información personal de la Universida del Valle, ' + 
          'visite: https://www.univalle.edu.co/politica-de-tratamiento-de-la-informacion-personal. \nMuchas gracias por utilizar SigeTEC.' +
          '\n\nEste es un mensaje autogenerado. Por favor no intente responder este mensaje.';
        Promise.all([admin.database().ref('/technologies-detail/' + technology['technologyId']).once("value").then(detailsSnap => {
          const data = detailsSnap.val()['answers'];
          if (data && data['group-coresearcher']) {
            data['group-coresearcher'].forEach(element => {
              if (element['coresearcher-email']) {
                allEmailsQuee.push(sendEmail(element['coresearcher-email'], dataTreatmenSubject, dataTreatmentMessage));
              }
            });
          }
          allEmailsQuee.push(sendEmail(technology['principal-researcher-email'], mainSubject, mainMessage));
          Promise.all(allEmailsQuee);
        })]);
      } else if (previousVer && previousVer.status == 'Registrada' && technology.status == 'En diligencia') {
        const subject = 'Notificación SigeTEC: Notificación de retorno de tecnología registrada.';
        const message = 'La tecnología titulada "' + technology.name + 
          '" ha sido devuelta a estado "En diligencia" en el sistema integrado de gestión estratégica' + 
          ' de tecnologías (SigeTEC) de la Universidad del Valle, tras haber sido inspeccionada por el personal de la OTRI. \n \n' +
          'Comentarios agregados por el personal de la OTRI: \n'+
          technology.statusComments[0].message + '\n\n' + 
          'Realice los cambios que considere necesarios en los formatos y registre nuevamente la tecnología en el sistema cuando así lo desee. \nMuchas gracias por utilizar SigeTEC.' +
          '\n\nEste es un mensaje autogenerado. Por favor no intente responder este mensaje.';
        // sendEmail(technology['principal-researcher-email'], subject, message);
        Promise.all([sendEmail(technology['createdBy'], subject, message)]);
      }
      admin.database().ref('/roles/definition').once("value").then(snapshot => {
          snapshot.forEach(function(data) {
              var rol = data.val();
              if(rol.allowedStatus.notify !== undefined){
                  rol.allowedStatus.notify.forEach(function(status){
                      if(status === technology.status ){
                        if (rol.users && rol.users.length > 0) {
                          rol.users.forEach(function(user) {
                            if (user && user!=='') {
                              var subject = "";
                              var message = "";
                              if (change.before.val().status == 'En diligencia' && technology.status == 'Registrada'){
                                subject = 'Notificación SigeTEC: Notificación de registro de tecnología.';
                                message = 'La tecnología titulada "' + technology.name + 
                                  '" ha sido registrada en el sistema con el id ' + technology['technologyId'] + '.' +
                                  '\n\nEste es un mensaje autogenerado. Por favor no intente responder este mensaje.';
                                admin.database().ref('/bell-notifications/'+user.split('@')[0].split('.').join('')).push([{
                                  type: 'new-technology',
                                  read: false,
                                  data: {
                                    technologyName: technology.name,
                                    technologyKey: change.after.key
                                  },
                                  createdAt: + new Date()
                                }]);
                              } else {
                                subject = 'Notificación SigeTEC: Notificación de actualización de tecnología ' + technology.name;
                                message = 'La tecnología titulada ' + technology.name + 'ha sido atualizada por ' +
                                  technology.updatesBy + '. \n\nEste es un mensaje autogenerado. Por favor intente responder este mensaje.'
                              }
                              Promise.all([sendEmail(user, subject, message)]);    
                            }
                          });    
                        }
                      }
                  });
              }
          });
      });
      return null;
    }
);
// Api points
// Get technologies api point for technologies list for SigeTEC home page table.
exports.getTechnologies = functions.https.onRequest((req,res)=>{
  cors(req,res,() => {
    var db = admin.database();
    var ref = db.ref("/technologies");
    ref.orderByChild("status").startAt('Registrada').endAt('Registrada'+"\uf8ff").once('value', function(data) {
      var registeredTechnologies = data.val();
      var uuids = Object.keys(registeredTechnologies);
      if(uuids.length == 0){
        res.status(200).json(registeredTechnologies);
      }else{
        var detailsPromises = [];
        for (var i = 0; i < uuids.length ; i++) {
          detailsPromises.push(
            db.ref('/technologies-detail/' + registeredTechnologies[uuids[i]]['technologyId'])
            .once('value')
            // .then(function(snapshot) {
            //     registeredTechnologies[uuids[i]]['details'] = snapshot.val();
            // })
          );
        }
        return Promise.all(detailsPromises).then(snap =>  {
          for (var k = 0; k < snap.length; k++) {
            registeredTechnologies[uuids[k]]['details'] = snap[k];
          }
          res.status(200).json(registeredTechnologies);
        });
      }
    });
  });
});

// Run remainders api point for SigeTEC.
exports.runRemainders = functions.https.onRequest((req,res)=>{
  cors(req,res,() => {
    var db = admin.database();
    var ref = db.ref("/reminders");
    ref.orderByChild("reminderDate").once('value', function(data) {
      var response = {};
      var reminders = data.val();
      var uuids = Object.keys(reminders);
      var today = new Date();
      var todayRemainders = [];
      for (var i = 0; i < uuids.length ; i++) {
        var reminderDate = new Date(reminders[uuids[i]].reminderDate);
        // Sumar 86400000 a today.setHours(0,0,0,0) para sumar 24 horas a la fecha.
        if (today.setHours(0,0,0,0)==reminderDate.setHours(0,0,0,0)) {
          response[uuids[i]] = {};
          response[uuids[i]] = reminders[uuids[i]];

        }
      }
      // sendEmail(technology['createdBy'], subject, message)
      res.status(200).json(response);
    });
  });
});

// Functions helpers
function sendEmail(email, subject, message){
  const mailOptions = {
    from: `SigeTEC <noreply@sigetec.univalle.edu.co>`,
    to: email
  };
  mailOptions.subject = subject;
  mailOptions.text = message;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New change status email sent to:', email);
  });
};