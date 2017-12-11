'use strict';

var formatsController = angular.module('FormatsController', 
                                    ['ngMaterial', 'firebase', 'nvd3']);


formatsController.controller('FormatsController', 
                          ['$scope', 
                           '$rootScope',
                           '$location',
                           '$firebase',
                           '$firebaseObject',
                           '$firebaseArray',
                           '$firebaseUtils',
                           '$mdDialog',
                           '$mdToast',
                           '$window',
function($scope, $rootScope, $location, $firebase, $firebaseObject, $firebaseArray, $firebaseUtils, $mdDialog, $mdToast, $window){
    var context = this;
    
    var formatsReference = firebase.database().ref().child("formats");
    var formats = $firebaseObject(formatsReference);
    
    formats.$loaded().then(function(){
        context.formats = [];
        angular.forEach(formats.structure, function(format, key){
            format.index = key;
            context.formats.push(format);
            if(key == 0){
                context.selectedFormatJson = angular.toJson(format.questionGroups);
            }  
        });
        console.log(context.selectedFormatJson);
        context.selectedFormat = 0;
    });
    
    context.onChangeFormat = function(){
        context.selectedFormatJson = angular.toJson(context.formats[context.selectedFormat].questionGroups);
    }
                               
    context.save = function(){
        var questionGroups = angular.fromJson(context.selectedFormatJson);
        formats.structure[context.selectedFormat].questionGroups = questionGroups;
        console.log(formats);
        formats.$save();
    };
    
    context.create = function(){
        var formatsCopy = [];
        angular.forEach(formats.structure, function(format, key){
            formatsCopy.push(format);
        });
        formatsCopy.push({"name": context.newFormat});
        formats.structure = formatsCopy;
        formats.$save();
    };
    
    context.delete = function(){
        formats.splice(context.selectedFormat, 1);
        console.log(formats);
        formats.$save();
    };
                               
}]);