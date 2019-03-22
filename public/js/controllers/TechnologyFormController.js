'use strict';

var technologyFormController = angular.module('TechnologyFormController',
                                    ['ngMaterial', 'firebase', 'angularUUID2','angular-popover', 'ngMessages', 'ui-notification', 'ngMaterialCollapsible']);
technologyFormController.config(['$mdIconProvider', function($mdIconProvider) {
        $mdIconProvider.icon('md-close', 'img/icons/ic_close_24px.svg', 24);
      }]);

technologyFormController.config(function(NotificationProvider) {
        NotificationProvider.setOptions({
            startTop: 80,
            positionX: 'right',
            positionY: 'bottom'
        });
    });

technologyFormController.controller('TechnologyFormController', 
    ['$scope', 
    '$rootScope',
    '$location',
    '$firebase',
    '$mdDialog',
    '$mdToast',
    '$mdMenu',
    '$window',
    '$firebaseObject',
    '$firebaseArray',
    '$firebaseAuth',
    '$routeParams',
    'uuid2',
    'Notification',
function($scope, $rootScope, $location, $firebase, $mdDialog, $mdToast, $mdMenu, $window, $firebaseObject, $firebaseArray, $firebaseAuth, $routeParams, uuid2, Notification){
    var context = this;
    $scope.authObj = $rootScope.auth;
    context.allowedStatus = $rootScope.allowedStatus;
    context.availableUsers = $rootScope.availableUsers;
    context.answers = {
        "documents": [],
        prerequisites: {
            // "group-coresearcher": {}
        }
    };
    context.formatObjects = {};
    context.showReturn = false;
    context.showAssign = false;
    context.showRegister = false;
    context.showCreate = false;
    context.showRegistrationDate = false;
    context.technologyStatus = "En diligencia";
    context.registrationDate = null;
    context.technologyStatusComments = [];
    context.fileCategory = "";  
    if ($routeParams.technologyId) {
        context.currentNavItem = "FNI";
        // context.showCreate = false;
    } else {
        context.currentNavItem = "Información Básica";
    }
    // if($rootScope.permissions !== undefined){
    //     if($rootScope.permissions.find(function(permission){ return "return" === permission; })){
    //         context.showReturn = true;
    //     }
    //     if($rootScope.permissions.find(function(permission){ return "assign" === permission; })){
    //         context.showAssign = true;
    //     }
    // }
    if($rootScope.userRole === "researcher"){
        context.isResearcher = true;
    }else{
        context.isResearcher = false;
    }
    var basicData = [
        { questionGroup : "basic",
          questionName : "name" },
        { questionGroup : "basic",
          questionName : "description" },
        { questionGroup : "basic",
          questionName : "program" },
        { questionGroup : "group-principal-researcher",
          questionName : "principal-researcher-email" },
        { questionGroup : "basic",
          questionName : "technology-type" },
        { questionGroup : "patent-granted",
          questionName : "granted-date" }
    ];
    var formatsReference = firebase.database().ref().child("formats/structure");
    var referencesReference = firebase.database().ref().child("references/definition");
    var formats = $firebaseArray(formatsReference);
    var references = $firebaseObject(referencesReference);
    references.$loaded().then(function(){
        context.references = references;
    });
    // Load the existing formats and sets controller variables if a saved technology has been selected.
    formats.$loaded().then(function(){
        context.formats = formats;
        angular.forEach(formats, function(format){
            if(format.allowedRole != undefined && (format.allowedRole === "all" || context.rolesChecker(format.allowedRole))){
                format.readonly = false;
                format.showTab = true;
            }else{
                format.readonly = true;
                format.showTab = false;
                // format.showTab = true;
            }
            context.formatObjects[format.name] = format;
            angular.forEach(format.questionGroups, function(questionGroup){
                context.answers[questionGroup.name] = [{}];
                angular.forEach(questionGroup.questions, function(question){
                    if(question.type === "tags"){
                        context.answers[questionGroup.name][0][question.name] = [];
                    }
                    if(question.type === "array"){
                        context.answers[questionGroup.name][0][question.name] = [{}];
                    }
                });
            });
        });
        // Carga de información de tecnología solicitada
        if($routeParams.technologyId){
            var technologyRequestedReference = firebase.database()
                .ref()
                .child("technologies/"+$routeParams.technologyId);
            var technologyRequested = $firebaseObject(technologyRequestedReference);
            technologyRequested.$loaded().then(function(){
                context.assignedTo = technologyRequested.assignedTo;
                context.technologyStatus = technologyRequested.status;
                angular.forEach(context.formats, function(format){
                    if(format.allowedRole != undefined && (format.allowedRole === "all" || context.rolesChecker(format.allowedRole))){
                        format.readonly = false;
                        format.showTab = true;
                    }else{
                        format.readonly = true;
                        format.showTab = false;
                    }
                });
                if(technologyRequested.status != 'En diligencia'){
                    context.formatObjects['FNI'].readonly = true;
                    context.formatObjects['Información Básica'].readonly = true;
                    context.showRegister = false;
                    context.showCreate = false;
                }
                if(technologyRequested.status == 'Registrada'){
                    if ($rootScope.permissions.indexOf('showReturn') >= 0) {
                        context.showReturn = true;
                    }
                    if ($rootScope.permissions.indexOf('showAssign') >= 0) {
                        context.showAssign = true;
                    }                    
                }
                if ($rootScope.permissions.indexOf('showRegistrationDate') >= 0) {
                    context.showRegistrationDate = true;
                }
                if (technologyRequested.registeredAt) {
                    context.registrationDate = new Date(technologyRequested.registeredAt);
                }
                if (technologyRequested.statusComments) {
                    context.technologyStatusComments = technologyRequested.statusComments; 
                }
                var detailRequestedReference = firebase.database()
                    .ref()
                    .child("technologies-detail/"+technologyRequested.technologyId);
                // Carga de detalles de la tecnología
                var technologiesRequestedDetail = $firebaseObject(detailRequestedReference);
                technologiesRequestedDetail.$loaded().then(function(){
                    var answers = technologiesRequestedDetail.answers;
                    angular.forEach(answers, function(answer, name){
                        //var answersWithDate = answer.slice();
                        var answersWithDate = context.answers[name];
                        // var answersWithDate = {};
                        angular.forEach(answer, function(group, gKey){
                            angular.forEach(group, function(answer, aKey){
                                if(Object.prototype.toString.call(answer) === '[object Array]'){
                                    if (answer[0] && (Object.prototype.toString.call(answer[0]) === '[object Object]')) {
                                        if(!answersWithDate[gKey]){
                                            answersWithDate[gKey] = {};
                                        }
                                        angular.forEach(answer, function(answersGroup, agKey){
                                            if (Object.prototype.toString.call(answers[name][gKey][aKey]) === '[object Array]' && !answersWithDate[gKey][aKey]) {
                                                answersWithDate[gKey][aKey] = [];
                                            } else if (Object.prototype.toString.call(answers[name][gKey][aKey]) === '[object Object]' && !answersWithDate[gKey][aKey]) {
                                                answersWithDate[gKey][aKey] = {};
                                            }
                                            answersWithDate[gKey][aKey][agKey] = {};
                                            angular.forEach(answersGroup, function(groupAnswer, gaKey){
                                                var testDate = new RegExp('^\\d{13}$').test(groupAnswer);
                                                if(testDate){
                                                    answersWithDate[gKey][aKey][agKey][gaKey] = new Date(groupAnswer);
                                                } else {
                                                    answersWithDate[gKey][aKey][agKey][gaKey] = groupAnswer;
                                                }
                                            });
                                        });
                                    } else if (answer[0] && (Object.prototype.toString.call(answer[0]) === '[object String]')) {
                                        answersWithDate[gKey][aKey] = answer;
                                    }
                                }else{
                                    if (!answersWithDate[gKey]) {
                                        if (Object.prototype.toString.call(answers[name][gKey]) === '[object Array]') {
                                            answersWithDate[gKey] = [];
                                        } else if (Object.prototype.toString.call(answers[name][gKey]) === '[object Object]') {
                                            answersWithDate[gKey] = {};
                                        }
                                    }
                                    var testDate = new RegExp('^\\d{13}$').test(answer);
                                    if(testDate){
                                        answersWithDate[gKey][aKey] = new Date(answer);
                                    }else{
                                        if (typeof(gKey)=='string') {
                                            answersWithDate[gKey] = {};
                                        }
                                        answersWithDate[gKey][aKey] = answer;
                                    }
                                }
                            });
                        });
                        context.answers[name] = answersWithDate;
                    });
                });
            });
            if($rootScope.userRoles.indexOf("researcher") >= 0){
                context.showRegister = true;
            }
        }else{
            context.formatObjects["FNI"].showTab = false;
            context.showCreate = true;
            // if($rootScope.userRole === "researcher"){
            //     context.showCreate = true;
            // }
        }
    });
                               
    context.rolesChecker = function(formatAllowedRoles){
        var response = false;
        for (var i = 0; i < $rootScope.userRoles.length; i++) {
            if (formatAllowedRoles.includes($rootScope.userRoles[i]) && (context.technologyStatus != 'En diligencia')) {
                response = true;
                break;
            }
        }
        return response;
    };

    context.addAnswers = function(questionGroupName){
        var definedKeys = Object.keys(context.answers[questionGroupName][0]);
        var objToAdd = {};
        for (var i = 0; i < definedKeys.length; i++) {
            if ((typeof context.answers[questionGroupName][0][definedKeys[i]]) == 'object') {
                if (context.answers[questionGroupName][0][definedKeys[i]][0] && ((typeof context.answers[questionGroupName][0][definedKeys[i]][0]) == 'object')) {
                    objToAdd[definedKeys[i]] = [{}];
                }else{
                   objToAdd[definedKeys[i]] = []; 
                }
            }
        }
        context.answers[questionGroupName].push(objToAdd);
    };

    context.removeAnswers = function(questionGroupName, index){
        context.answers[questionGroupName].splice(index, 1);
    };

    context.addArrayData = function(questionGroupName, questionName, index){
        context.answers[questionGroupName][index][questionName].push({});
    };

    context.removeArrayData = function(questionGroupName, questionName, index, position){
        context.answers[questionGroupName][index][questionName].splice(position, 1);
    };
    
    context.uploadFile = function() {
       context.fireNotification('info', 'Cargando archivo. Esto puede tardar un momento...');
       var ref = 'documents/'+ new Date().getTime();
       var documentsReference = firebase.storage().ref().child(ref);
       var sFileName = $("#document").val();
       if (sFileName.length > 0) {
           var filesSelected = document.getElementById("document").files;
            if (filesSelected.length > 0) {
                var fileToLoad = filesSelected[0];
                var metadata = {
                    'contentType': fileToLoad.type
                };
                documentsReference.put(fileToLoad, metadata).then(function(snapshot){
                    var url = snapshot.metadata.downloadURLs[0];
                    context.answers.documents.push(
                        {
                            "url": url, 
                            "name": fileToLoad.name,
                            "ref": ref,
                            "fileCategory": context.fileCategory,
                            "fileType": fileToLoad.type
                        });
                    $scope.$digest();
                    context.save('Archivo cargado exitosamente');
                }).catch(function(error) {
                    // [START onfailure]
                    context.fireNotification('error', 'Ha ocurrido un error. Por favor intentelo de nuevo.');
                    console.error('Upload failed:', error);
                    // [END onfailure]
                });
            }
        }
        // return true;
    };
    
    context.deleteFile = function(document) {
       var documentsReference = firebase.storage().ref().child(document.ref);
       context.fireNotification('info', 'Eliminando archivo adjunto...');
       documentsReference.delete().then(function(){
           for(var i=0; i < context.answers.documents.length; i++){
               if(context.answers.documents[i].ref == document.ref){
                   context.answers.documents.splice(i, 1);
               }
           }
           $scope.$digest();
           context.save('Archivo adjunto eliminado satisfactoriamente.');
       }).catch(function(error) {
            context.fireNotification('error', 'No se pudo eliminar el archivo adjunto. Por favor inténtelo de nuevo.');
            console.error('Delete failed:', error);
        });
    }
    
    context.showShareDialog = function(){
        $mdDialog.show({
          controller: ShareDialogController,
          templateUrl: 'partials/user-list.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
        })
        .then(function(answer) {
            
        }, function() {
            
        }); 
    }
    
    function ShareDialogController($scope, $mdDialog) {
        $scope.users = context.availableUsers;
        
        $scope.select = function() {
            context.selectedUser = $scope.selectedUser;
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.onClickShare = function() {
            context.share($scope.selectedUser);
            $mdDialog.hide();
        };     
    }
    
    context.share = function(email){
        var shareRecord = {"technology-id" : $routeParams.technologyId,
                          "email" : email}
        var shareReference = firebase.database().ref().child("share");
        var sharedArray = $firebaseArray(shareReference);
        sharedArray.$add(shareRecord);
    }
    
    context.assign = function(){
        context.assignedTo = context.selectedUser;
        conext.save();
    }
    
    context.showAssignDialog = function(){
        $mdDialog.show({
          controller: AssignDialogController,
          templateUrl: 'partials/user-list.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
        })
        .then(function(answer) {
            
        }, function() {
            
        }); 
    }
    
    function AssignDialogController($scope, $mdDialog) {
        // $scope.users = context.availableUsers;
        $scope.users = ["Julian", "Felipe"];
        $scope.select = function() {
            context.selectedUser = $scope.selectedUser;
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.onClickShare = function() {
            context.assign($scope.selectedUser);
            $mdDialog.hide();
        };     
    }
    
    context.assign = function(email){
        context.assignedTo = email;
        context.save();
    }
    
    context.register = function(){
        if(context.answers.basic[0].acceptance){
            if(context.showRegistrationDate){
                context.technologyStatus = "Registrada";
                context.save('La tecnología se registró exitosamente.', '/dashboard');
            }else{
                if($rootScope.userEmail == context.answers['group-principal-researcher'][0]['principal-researcher-email']){
                    context.technologyStatus = "Registrada";
                    context.save('La tecnología se registró exitosamente.', '/dashboard');
                }else{
                    context.fireNotification('error', 'Solo puede registrar la tecnologia el investigador principal.');
                }
            }
        }else{
            context.fireNotification('error', 'Se deben aceptar los terminos y condiciones para poder continuar.');
        }
    }
    
    context.return = function(){
        $mdDialog.show({
            controller: context.showReturnDialogController,
            templateUrl: 'partials/return-technology-comments.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true,
            fullscreen: true// Only for -xs, -sm breakpoints.
        })
        .then(function(answer) {
        }, function() {
        });
    };

    context.showReturnDialogController = function ($scope, $mdDialog){
        $scope.commentsField = "";
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.send = function(){
            context.technologyStatus = "En diligencia";
            if(context.technologyStatusComments){
                context.technologyStatusComments = [{
                    message:$scope.commentsField,
                    date: Date.now(),
                    by: $rootScope.userEmail
                }].concat(context.technologyStatusComments);
            }else{
                context.technologyStatusComments = [{
                    message:$scope.commentsField,
                    date: Date.now(),
                    by: $rootScope.userEmail
                }];
            }
            context.save('La tecnología se retornó al investigador satisfactoriamente', 'dashboard');
            $scope.comments = "";
            $mdDialog.hide();
        }
    };
    
    context.save = function(message=null, url=null){
        console.log(context.answers);
        var today = new Date().getTime();
        var technologyId = "";
        if($routeParams.technologyId){
            try{
                var technologyReference = firebase.database().ref().child("technologies/"+$routeParams.technologyId);
                var technology = $firebaseObject(technologyReference);
                technology.$loaded().then(function(){
                    // if (technology.status == 'Registrada' && $rootScope.userRoles.length) {
                        // context.fireNotification('error', 'No es posible guardar las modificaciones en el estado actual de la tecnología.');
                    // }else{
                        technology.updatedAt = today;
                        technology.updatedBy = $rootScope.userEmail;
                        if (technology.status == 'Registrada' && context.technologyStatus == 'En diligencia' && technology.registeredAt) {
                          technology.registeredAt = null;
                        }
                        if (context.showRegistrationDate) {
                            technology.registeredAt = new Date(context.registrationDate).getTime();
                        } else {
                            technology.registeredAt = today
                        }
                        technology.status = context.technologyStatus;
                        if(!technology.statusComments) technology.statusComments = [];
                        technology.statusComments = context.technologyStatusComments;
                        if(context.assignedTo != undefined){
                            technology.assignedTo = context.assignedTo;
                        }
                        context.setBasicData(technology, basicData);
                        technology.$save().then(function(reference){
                            try {
                                technologyId = $routeParams.technologyId;
                                context.saveDetail(technology.technologyId);
                                if (message == null || message == undefined ) {
                                    context.fireNotification('info', 'Información guardada satisfactoriamente.');
                                }else{
                                    context.fireNotification('info', message);
                                    context.fileCategory = "";
                                    $("#document").val('');
                                    $('form[name="attachments"]').trigger("reset");
                                    $scope.attachments.$setUntouched();
                                    $scope.attachments.$setPristine();
                                }
                                if (url == null || url == undefined) {
                                    $location.path('technology-form/'+technologyId);
                                }else{
                                    $location.path(url);
                                }
                            }catch(e){
                                console.log(e);
                                context.fireNotification('error', 'No se pudo guardar la información. Uno de los formularios no es válido. Por favor verifique los campos requeridos o la información diligenciada.');
                            }
                        }, function(error){
                            context.fireNotification('error', 'No se pudo guardar la información. Por favor inténta de nuevo.');
                        });
                    // }
                });
            }catch(e){
                context.fireNotification('error', 'Ocurrió un error inesperado. Por favor inténtelo de nuevo más tarde.');
                console.log(e);
            }
        }else{
            try{
                var technology = {};
                technology.technologyId = uuid2.newuuid();
                technology.createdAt = today;
                technology.createdBy = $rootScope.userEmail;
                technology.status = context.technologyStatus;
                // technology.status = 'En diligencia';
                context.setBasicData(technology, basicData);
                var technologiesReference = firebase.database().ref().child("technologies");
                var technologies = $firebaseArray(technologiesReference);
                technologies.$add(technology).then(function(reference){
                    try{
                        technologyId = reference.path.o[1];
                        context.saveDetail(technology.technologyId);
                        if (message == null || message == undefined ) {
                            context.fireNotification('info', 'Información guardada satisfactoriamente.');
                        }else{
                            context.fireNotification('info', message);
                            context.fileCategory = "";
                            $("#document").val('');
                            $scope.attachments.$setUntouched();
                            $scope.attachments.$setPristine();
                        }
                        if (url == null || url == undefined) {
                            $location.path('technology-form/'+technologyId);
                        }else{
                            $location.path(url);
                        }
                    }catch(e){
                        console.log(e);
                        context.fireNotification('error', 'No se pudo guardar la información. Uno de los formularios no es válido. Por favor verifique los campos requeridos o la información diligenciada.');
                    }
                }, function(error){
                    context.fireNotification('error', 'No se pudo guardar la información. Por favor inténta de nuevo.');
                    console.log(error);
                });
            }catch(e){
                console.log(e);
                context.fireNotification('error', 'Ocurrió un error inesperado. Por favor inténtelo de nuevo más tarde.');
            }
        }
        // $rootScope.infoMessage = "La tecnologia fue almacenada correctamnete.";
    };

    context.saveDetail = function(key){
        try {
            var technologiesDetailReference = firebase.database().ref().child("technologies-detail/"+key);
            var technologiesLogReference = firebase.database().ref().child("technologies-log");
            var technologiesDetail = $firebaseObject(technologiesDetailReference);
            var technologiesLog = $firebaseArray(technologiesLogReference);
            var technologyLog = {};
            technologiesDetail.answers = angular.copy(context.answers);
            technologyLog.by = $rootScope.userEmail;
            technologyLog.at = new Date().getTime();
            technologyLog.answers = angular.copy(context.answers);
            var validationError = false;
            angular.forEach(technologiesDetail.answers , function(questionGroup, qgKey){
                angular.forEach(questionGroup, function(group, gKey){
                    angular.forEach(group, function(answer, aKey){
                        if(Object.prototype.toString.call(answer) === '[object Date]'){
                            technologiesDetail.answers[qgKey][gKey][aKey] = answer.getTime();
                        }else if(Object.prototype.toString.call(answer) === '[object Array]'){
                            if (answer[0] && (Object.prototype.toString.call(answer[0]) === '[object Object]')) {
                                angular.forEach(answer, function(answersGroup, agKey){
                                    angular.forEach(answersGroup, function(groupAnswer, gaKey){
                                        if(Object.prototype.toString.call(groupAnswer) === '[object Date]'){
                                            technologiesDetail.answers[qgKey][gKey][aKey][agKey][gaKey] = groupAnswer.getTime();
                                        }
                                    });
                                });
                            }
                        }
                        if(answer.$invalid){
                            validationError = true;
                        }
                    });
                });
            });
            if (!validationError) {
                technologiesDetail.$save();
                technologiesLog.$add(technologyLog);
            }else{
                context.fireNotification('error', 'Ocurrió un error en la validación de los campos. Por favor verifique la información del formulario.');
            }
        }catch(e){
            throw e;           
        }
    }
    
    context.create = function(){
        context.save();
    }
    
    context.setBasicData = function(technology, basicData){
        angular.forEach(basicData, function(question, key){
            var answer = context.answers[question.questionGroup][0][question.questionName];
            if(answer != undefined){
                if(Object.prototype.toString.call(answer) === '[object Date]'){
                    technology[question.questionName] = answer.getTime();
                }else{
                    technology[question.questionName] = answer;
                }
            }               
        });
    }
    
    context.changeStatus = function(status){
        context.technologyStatus = status;
        context.save();
    }
                               
    context.back = function(){
        $location.path("/dashboard");
    }
    
    context.openMenu = function() {
      $mdMenu.open();
    }

    context.checker = function(valid, formName){
        if(!valid) {
            angular.forEach($scope[formName].$error, function (field) {
                angular.forEach(field, function(errorField){
                    errorField.$setTouched();
                })
            });
            context.fireNotification('error', 'El formulario no es válido. Por favor verifique los campos requeridos o la información diligenciada.');
            return true;
        }else{
            return true;
        }
    }

    context.prerequisitesChecker = function (questionGroup, prerequisiteQuestions){
        if (questionGroup) {
            // If it has a questionGroup (for those questions group that has prerequisites questions defined on its own group)
            if (!prerequisiteQuestions) {
                return true;    
            }else{
                var resolution = true;
                for (var i = 0; i < prerequisiteQuestions.length; i++) {
                    if(!(context.answers.prerequisites[questionGroup] && context.answers.prerequisites[questionGroup][prerequisiteQuestions[i].name] == prerequisiteQuestions[i].value)){
                        resolution = false;
                        break;
                    }
                }
                return resolution;
            }
        }else{
            // If it hasn't a questionGroup (for those questions group that has prerequisites questions defined in other question groups)
            if (!prerequisiteQuestions) {
                return true;    
            }else{
                var resolution = true;
                for (var i = 0; i < prerequisiteQuestions.length; i++) {
                    if(!(context.answers[prerequisiteQuestions[i].questionGroup] && context.answers[prerequisiteQuestions[i].questionGroup][0][prerequisiteQuestions[i].fieldName] && context.answers[prerequisiteQuestions[i].questionGroup][0][prerequisiteQuestions[i].fieldName] == prerequisiteQuestions[i].value)){
                        resolution = false;
                        break;
                    }
                }
                return resolution;
            }
        }
    }

    context.fireNotification = function(type, message) {
        switch(type) {
            case 'success':
                Notification.success({
                    message: message, 
                    delay: 5000, 
                    replaceMessage: true, 
                    positionX: 'right',
                    positionY: 'bottom'
                });
                break;
            case 'error':
                Notification.error({
                    message: message, 
                    delay: 5000, 
                    replaceMessage: true, 
                    positionX: 'right',
                    positionY: 'bottom'
                });
                break;
            default:
                Notification({
                    message: message, 
                    delay: 5000, 
                    replaceMessage: true, 
                    positionX: 'right',
                    positionY: 'bottom'
                });
        } 
    }

    context.newReminder = function (model, message, questionGroup, answerKey, questionName, position) {
        if (model) {
            try {
                if($routeParams.technologyId){
                    context.fireNotification('info', 'Creando recordatorio...');
                    var reminderDate = new Date(model).getTime();
                    var today = new Date().getTime();
                    var reminderId = "";
                    var reminder = {};
                    reminder.createdAt = today;
                    reminder.createdBy = $rootScope.userEmail;
                    reminder.status = 'pending';
                    reminder.reminderDate = reminderDate;
                    reminder.relatedTechnology = $routeParams.technologyId;
                    if(message) reminder.message = message;
                    var remindersReference = firebase.database().ref().child("reminders");
                    var reminders = $firebaseArray(remindersReference);
                    reminders.$add(reminder).then(function(reference){
                        try{
                            reminderId = reference.path.o[1];
                            context.answers[questionGroup][answerKey][questionName][position]['reminderId'] = reminderId;
                            context.save('Recordatorio creado satisfactoriamente.');
                        }catch(e){
                            console.log(e);
                            context.fireNotification('error', 'No se pudo crear el recordatorio. Por favor inténta de nuevo.');
                        }
                    }, function(error){
                        context.fireNotification('error', 'No se pudo guardar la información. Por favor inténta de nuevo.');
                        console.log(error);
                    });
                }else{
                    context.fireNotification('error', 'Para crear un recordatorio debes haber guardado al menos una vez la información de tu tecnología.');
                }
            }catch(e){
                console.log(e);
                this.fireNotification('error', 'Ha ocurrido un error inesperado al crear el recordatorio. Por favor inténtalo de nuevo.')
            }
        }else{
            this.fireNotification('error', 'El valor ingresado en la fecha es inválido. No es posible crear el recordatorio.')
        }
    }

    context.removeOptionChecker = function (position, responseGroup){
        if (responseGroup['reminderId']) {
            return false;
        }else{
            return true;
        }
    }

}]);