'use strict';

var technologyFormController = angular.module('TechnologyFormController', 
                                    ['ngMaterial', 'firebase', 'angularUUID2','angular-popover', 'ngMessages']);
technologyFormController.config(['$mdIconProvider', function($mdIconProvider) {
        $mdIconProvider.icon('md-close', 'img/icons/ic_close_24px.svg', 24);
      }]);
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
function($scope, $rootScope, $location, $firebase, $mdDialog, $mdToast, $mdMenu, $window, $firebaseObject, $firebaseArray, $firebaseAuth, $routeParams, $event, uuid2){
    var context = this;
      
    $scope.authObj = $rootScope.auth;
    context.allowedStatus = $rootScope.allowedStatus;
    context.availableUsers = $rootScope.availableUsers;
    
    context.currentNavItem = "Información Basica";
    context.answers = {"documents": []};
    context.formatObjects = {};
    
    context.showReturn = false;
    context.showAssign = false;
    context.showRegister = false;
    context.showCreate = false;
    
    context.technologyStatus = "diligenciado";
    
    if($rootScope.permissions !== undefined){
        if($rootScope.permissions.find(function(permission){ return "return" === permission; })){
            context.showReturn = true;
        }
        if($rootScope.permissions.find(function(permission){ return "assign" === permission; })){
            context.showAssign = true;
        }
    }
    
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
          questionName : "technology-type" }
    ];
                               
    var formatsReference = firebase.database().ref().child("formats/structure");
    var referencesReference = firebase.database().ref().child("references/definition");
    
    var formats = $firebaseArray(formatsReference);
    var references = $firebaseObject(referencesReference);

    references.$loaded().then(function(){
        context.references = references;
    });
    
    formats.$loaded().then(function(){
        context.formats = formats;
        angular.forEach(formats, function(format){
            console.log(format);
            if(format.allowedRole === "all" || format.allowedRole.includes($rootScope.userRole)){
                format.readonly = false;
                format.showTab = true;
            }else{
                format.readonly = true;
                format.showTab = false;
            }
            context.formatObjects[format.name] = format;
            angular.forEach(format.questionGroups, function(questionGroup){
                context.answers[questionGroup.name] = [{}];
                angular.forEach(questionGroup.questions, function(question){
                    //console.log(question);
                    if(question.type === "tags"){
                        context.answers[questionGroup.name][0][question.name] = [];
                    }
                });
            });
        });
        
        if($routeParams.technologyId){
            var technologyRequestedReference = firebase.database()
                                                        .ref()
                                                        .child("technologies/"+$routeParams.technologyId);
            var technologyRequested = $firebaseObject(technologyRequestedReference);
            technologyRequested.$loaded().then(function(){
                
                if(technologyRequested.status !== 'diligenciado'){
                    context.formatObjects['FNI'].readonly = true;
                    context.formatObjects['Información Basica'].readonly = true;
                    context.showRegister = false;
                }
                
                if(technologyRequested.status !== 'registrado'){
                    context.showReturn = false;
                }
                
                context.assignedTo = technologyRequested.assignedTo;
                context.technologyStatus = technologyRequested.status;
                
                var detailRequestedReference = firebase.database()
                                                        .ref()
                                                        .child("technologies-detail/"+technologyRequested.technologyId);
                var technologiesRequestedDetail = $firebaseObject(detailRequestedReference);
                technologiesRequestedDetail.$loaded().then(function(){
                    var answers = technologiesRequestedDetail.answers;
                    angular.forEach(answers, function(answer, name){
                        //var answersWithDate = answer.slice();
                        var answersWithDate = answer;
                        angular.forEach(answer, function(group, gKey){
                            angular.forEach(group, function(answer, aKey){
                                var testDate = new RegExp('^\\d{13}$').test(answer);
                                if(testDate){
                                    answersWithDate[gKey][aKey] = new Date(answer);
                                }
                            });
                        });
                        context.answers[name] = answersWithDate;
                    });
                });
            });
            if($rootScope.userRole === "researcher"){
                context.showRegister = true;
            }
        }else{
            context.formatObjects["FNI"].showTab = false;
            if($rootScope.userRole === "researcher"){
                context.showCreate = true;
            }
        }
        console.log(context.formatObjects);
    });
                               
    context.addAnswers = function(questionGroupName){
        context.answers[questionGroupName].push({});
    };
    
    context.removeAnswers = function(questionGroupName, index){
        context.answers[questionGroupName].splice(index, 1);
    };
                               
    context.uploadFile = function() {
        console.log("Subiendo archivo");
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
                    console.log(context.answers);
                    context.answers.documents.push({"url": url, 
                                                    "name": fileToLoad.name,
                                                    "ref": ref});
                    $scope.$digest();
                    console.log(context.answers);
                    context.save();
                }).catch(function(error) {
                    // [START onfailure]
                    console.error('Upload failed:', error);
                    // [END onfailure]
                });
            }
        }
        return true;
    };
    
    context.deleteFile = function(document) {
       var documentsReference = firebase.storage().ref().child(document.ref);
       documentsReference.delete().then(function(){
           for(var i=0; i < context.answers.documents.length; i++){
               if(context.answers.documents[i].ref == document.ref){
                   context.answers.documents.splice(i, 1);
               }
           }
           $scope.$digest();
       }).catch(function(error) {
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
        console.log(context.availableUsers);
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
        console.log(context.availableUsers);
        $scope.users = context.availableUsers;
        
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
            console.log(context.answers);
            if($rootScope.userEmail == context.answers['group-principal-researcher'][0]['principal-researcher-email']){
                context.technologyStatus = "registrado";
                context.save();
            }else{
                alert("Solo puede registrar la tecnologia el investigador principal");
            }
        }else{
            alert("Debe aceptar los terminos y condiciones para poder guardar.");
        }
    }
    
    context.return = function(){
        context.technologyStatus = "diligenciado";
        context.save();
    }
    
    context.save = function(){
        var today = new Date().getTime();
        var technologyId = "";
        
        if($routeParams.technologyId){
            var technologyReference = firebase.database().ref().child("technologies/"+$routeParams.technologyId);
            var technology = $firebaseObject(technologyReference);
            technology.$loaded().then(function(){
                technology.updatedAt = today;
                technology.updatesBy = $rootScope.userEmail;
                technology.status = context.technologyStatus;
                if(context.assignedTo != undefined){
                    technology.assignedTo = context.assignedTo;
                }

                context.setBasicData(technology, basicData);

                technology.$save().then(function(reference){
                    technologyId = $routeParams.technologyId;
                    context.saveDetail(technology.technologyId);
                    $location.path('technology-form/'+technologyId);
                });
            });
        }else{
            var technology = {};
            technology.technologyId = uuid2.newuuid();
            technology.createdAt = today;
            technology.createdBy = $rootScope.userEmail;
            technology.status = context.technologyStatus;

            context.setBasicData(technology, basicData);

            var technologiesReference = firebase.database().ref().child("technologies");
            var technologies = $firebaseArray(technologiesReference);
            technologies.$add(technology).then(function(reference){
                console.log(reference.path.o[1]);
                technologyId = reference.path.o[1];
                context.saveDetail(technology.technologyId);
                $location.path('technology-form/'+technologyId);
            }, function(error){
                console.log(error);
            });
        }
                      
        $rootScope.infoMessage = "La tecnologia fue almacenada correctamnete.";
    };
    
    context.saveDetail = function( key ){
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
                    }
                    if(answer.$invalid){
                        validationError = true;
                    }
                });
           });
        });
        
        if(!validationError){
            technologiesDetail.$save();
            technologiesLog.$add(technologyLog);
        }else{
            console.log("Validation Error");
        }
    }
    
    context.create = function(){
        context.save();
    }
    
    context.setBasicData = function(technology, basicData){
        angular.forEach(basicData, function(question, key){
            var answer = context.answers[question.questionGroup][0][question.questionName];
            if(answer != undefined){
                technology[question.questionName] = answer;
            }               
        });
    }
    
    context.changeStatus = function(status){
        console.log(status);
        context.technologyStatus = status;
        context.save();
    }
                               
    context.back = function(){
        $location.path("/dashboard");
    }
    
    context.openMenu = function() {
      $mdMenu.open();
    }

    $scope.resizeTextArea = function($event){
        console.log('target height: ' + $event.target.height);
        console.log('scroll height: ' + $event.target.scrollHeight);
        var areaContent = $event.target.value;
        areaContent.replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/,'');
        if (areaContent == '' || areaContent == ' ') {
            $event.target.style.rows = 2;
            $event.target.style.height = "auto";
        }else{
            if ($event.target.scrollHeight >= 66) {
                $event.target.style.height = $event.target.scrollHeight + "px";
            }else{
                $event.target.style.rows = 2;
                $event.target.style.height = "auto";  
            };            
        }
    }
}]);