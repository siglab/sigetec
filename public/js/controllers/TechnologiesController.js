'use strict';

var technologiesController = angular.module('TechnologiesController', 
                                    ['ngMaterial', 'firebase', 'nvd3']);


technologiesController.controller('TechnologiesController', 
                          ['$scope', 
                           '$rootScope',
                           '$location',
                           '$firebase',
                           '$firebaseObject',
                           '$firebaseArray',
                           '$mdDialog',
                           '$mdToast',
                           '$window',
function($scope, $rootScope, $location, $firebase, $firebaseObject, $firebaseArray, $mdDialog, $mdToast, $window){
    var context = this;
    
    var technologiesReference = firebase.database().ref().child("technologies").orderByChild('createdAt');
    var technologies = $firebaseArray(technologiesReference);
        
    technologies.$loaded().then(function(){
        context.technologies = [];

        angular.forEach(technologies, function(technology, key){
            if($rootScope.allowedStatusView.find(function(status){ return status == technology.status; })){
                context.addTechnology(technology);
            }
        });
        angular.forEach(technologies, function(technology, key){
            if(technology.assignedTo == $rootScope.userEmail){
                context.addTechnology(technology);
            }
        });
        var shareReference = firebase.database().ref().child("share");
        var share = $firebaseArray(shareReference);
        share.$loaded().then(function(){
            angular.forEach(technologies, function(technology, key){
                if($rootScope.allowedStatusView.find(function(status){ return status == technology.status; })){
                    context.addTechnology(technology);
                }
            });
        });

        if(context.technologies.length > 0){
            context.technologies.reverse();
        }else{
            context.noTechnologies = true;
        }
        console.log(context.technologies);
    });
    
    context.addTechnology = function(newTechnology){
        var found = false;
        if(context.technologies.find(function(technology){return technology.technologyId == newTechnology.technologyId; })){
            found = true;
        }
        if(!found || context.technologies.length < 1){
            context.technologies.push(newTechnology);
        }
    }
    
    context.editTechnology = function(technology){
        $location.path('technology-form/'+technology.$id);
    }
}]);