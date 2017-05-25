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
    var referencesReference = firebase.database().ref().child("references/definition");
    
    var formats = $firebaseArray(formatsReference);
    var references = $firebaseObject(referencesReference);

    references.$loaded().then(function(){
        context.references = references;
    });
    
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
                    var url = snapshot.metadata.downloadURLs[0];
                    context.answers.documents.push({"url": url, 
                                                    "name": fileToLoad.name,
                                                    "ref": ref});
                    $scope.$digest();
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
                
                context.setBasicData(technology, basicData);
                
                technology.$save();
                context.saveDetail(technology.technologyId);
            });
            
        }else{
            var technology = {};
            technology.technologyId = uuid2.newuuid();
            technology.createdAt = today;
            technology.createdBy = $rootScope.userEmail;
            
            context.setBasicData(technology, basicData);
            
            var technologiesReference = firebase.database().ref().child("technologies");
            var technologies = $firebaseArray(technologiesReference);
            technologies.$add(technology).then(function(reference){
                context.saveDetail(technology.technologyId);
            }, function(error){
                console.log(error);
            });
        }
               
        alert("La tecnologia fue almacenada correctamente.");
    };
    
    context.saveDetail = function( key ){
        var technologiesDetailReference = firebase.database().ref().child("technologies-detail/"+key);
        var technologiesDetail = $firebaseObject(technologiesDetailReference);
        technologiesDetail.answers = angular.copy(context.answers);
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
        }else{
            console.log("Validation Error");
        }
    }
    
    context.setBasicData = function(technology, basicData){
        angular.forEach(basicData, function(question, key){
            var answer = context.answers[question.questionGroup][0][question.questionName];
            if(answer != undefined){
                technology[question.questionName] = answer;
            }               
        });
    }
                               
    context.back = function(){
        $location.path("/dashboard");
    }
}]);