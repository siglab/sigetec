'use strict';

var reportController = angular.module('ReportController', 
                                    ['ngMaterial', 'firebase', 'angularUUID2','angular-popover', 'ngMessages']);

reportController.controller('ReportController', 
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
function($scope, $rootScope, $location, $firebase, $mdDialog, $mdToast, $mdMenu, $window, $firebaseObject, $firebaseArray, $firebaseAuth, $routeParams, uuid2){
    var context = this;

    var reportsReference = firebase.database().ref().child("reports");
    var reports = $firebaseArray(reportsReference);
    reports.$loaded().then(function(){
        context.reports = reports;
    });

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
                    console.log(reports);
                    reports.$add({"url": url, 
                                  "type": context.fileCategory,
                                  "name": fileToLoad.name,
                                  "ref": ref});
                    $scope.$digest();
                    console.log(reports);
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
           var deleteDocument = "";
           angular.forEach(reports, function(value, key){
               if(value.ref == document.ref){
                   deleteDocument = value;
               }
           });
           reports.$remove(deleteDocument);
           $scope.$digest();
       }).catch(function(error) {
            console.error('Delete failed:', error);
        });
    }
}]);