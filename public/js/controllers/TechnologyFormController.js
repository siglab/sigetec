'use strict';

var technologyFormController = angular.module('TechnologyFormController', 
                                    ['ngMaterial', 'firebase', 'angularUUID2']);

technologyFormController.controller('TechnologyFormController', 
                          ['$scope', 
                           '$rootScope',
                           '$location',
                           '$firebase',
                           '$mdDialog',
                           '$mdToast',
                           '$window',
                           '$firebaseObject',
                           '$firebaseArray',
                           '$firebaseAuth',
                           '$routeParams',
                           'uuid2',
function($scope, $rootScope, $location, $firebase, $mdDialog, $mdToast, $window, $firebaseObject, $firebaseArray,               $firebaseAuth, $routeParams, uuid2){
    var context = this;
                               
    $scope.authObj = $rootScope.auth;
                               
    context.currentNavItem = "Información Basica";
    context.answers = {"documents": []};
    context.formatObjects = {};
    
    console.log("User rol: "+$rootScope.userRole)
                          
    var basicData = [
        { questionGroup : "basic",
          questionName : "name" },
        { questionGroup : "basic",
          questionName : "description" },
        { questionGroup : "basic",
          questionName : "program" },
        { questionGroup : "group-principal-researcher",
          questionName : "principal-researcher-email" }
    ];
                               
    var formatsReference = firebase.database().ref().child("formats");
    var referencesReference = firebase.database().ref().child("references");
    
    var formats = $firebaseArray(formatsReference);
    var references = $firebaseObject(referencesReference);

    formats.$loaded().then(function(){
        context.formats = formats;
        angular.forEach(formats, function(format){
            if(format.allowedRole == "all" || format.allowedRole == $rootScope.userRole){
                format.readonly = false;
            }else{
                format.readonly = true;
            }
            context.formatObjects[format.name] = format;
            angular.forEach(format.questionGroups, function(questionGroup){
                context.answers[questionGroup.name] = [{}];
            });
        });
        console.log(context.formatObjects);

        if($routeParams.technologyId){
            var technologyRequestedReference = firebase.database()
                                                        .ref()
                                                        .child("technologies/"+$routeParams.technologyId);
            var technologyRequested = $firebaseObject(technologyRequestedReference);
            technologyRequested.$loaded().then(function(){
                var detailRequestedReference = firebase.database()
                                                        .ref()
                                                        .child("technologies-detail/"+technologyRequested.technologyId);
                var technologiesRequestedDetail = $firebaseObject(detailRequestedReference);
                technologiesRequestedDetail.$loaded().then(function(){
                    var answers = technologiesRequestedDetail.answers;
                    angular.forEach(answers, function(answer, name){
                        var answersWithDate = answer.slice();
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
                    console.log(context.answers);
                });
            });
        }
    });
                               
    context.addAnswers = function(questionGroupName){
        context.answers[questionGroupName].push({});
    };
                               
    context.uploadFile = function() {
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
                    console.log('Uploaded', snapshot.totalBytes, 'bytes.');
                    console.log(snapshot.metadata);
                    var url = snapshot.metadata.downloadURLs[0];
                    context.answers.documents.push({"url": url, 
                                                    "name": fileToLoad.name,
                                                    "ref": ref});
                    $scope.$digest();
                    console.log('File available at', url);
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
    
    context.save = function(){
        var today = new Date().getTime();
        
        if($routeParams.technologyId){
            var technologyReference = firebase.database().ref().child("technologies/"+$routeParams.technologyId);
            var technology = $firebaseObject(technologyReference);
            technology.$loaded().then(function(){
                technology.updatedAt = today;
                technology.updatesBy = $rootScope.userEmail;
                angular.forEach(basicData, function(question, key){
                    technology[question.questionName] = context.answers[question.questionGroup][0][question.questionName];
                });
                technology.$save();
                context.saveDetail(technology.technologyId);
            });
            
        }else{
            var technology = {};
            technology.technologyId = uuid2.newuuid();
            technology.createdAt = today;
            technology.createdBy = $rootScope.userEmail;
            angular.forEach(basicData, function(question, key){
                technology[question.questionName] = context.answers[question.questionGroup][0][question.questionName];
            });
            var technologiesReference = firebase.database().ref().child("technologies");
            var technologies = $firebaseArray(technologiesReference);
            technologies.$add(technology).then(function(reference){
                context.saveDetail(technology.technologyId);
            }, function(error){

            });    
        }
               
        alert("La tecnologia fue almacenada correctamente.");
    };
    
    context.saveDetail = function( key ){
        var technologiesDetailReference = firebase.database().ref().child("technologies-detail/"+key);
        var technologiesDetail = $firebaseObject(technologiesDetailReference);
        technologiesDetail.answers = context.answers.slice();
        
        angular.forEach(technologiesDetail.answers , function(questionGroup, qgKey){
           angular.forEach(questionGroup, function(group, gKey){
                angular.forEach(group, function(answer, aKey){
                    if(Object.prototype.toString.call(answer) === '[object Date]'){
                        technologiesDetail.answers[qgKey][gKey][aKey] = answer.getTime();
                    }
                });
           });
        });
        
        technologiesDetail.$save();
    }
                               
    context.back = function(){
        $location.path("/dashboard");
    }
}]);