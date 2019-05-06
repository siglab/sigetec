'use strict';

var rolesController = angular.module('RolesController', 
                                    ['ngMaterial', 'firebase', 'nvd3']);


rolesController.controller('RolesController', 
                          ['$scope', 
                           '$rootScope',
                           '$location',
                           '$firebase',
                           '$firebaseObject',
                           '$mdDialog',
                           '$mdToast',
                           '$window',
function($scope, $rootScope, $location, $firebase, $firebaseObject, $mdDialog, $mdToast, $window){
    var context = this;
    
    var rolesReference = firebase.database().ref().child("roles");
    var roles = $firebaseObject(rolesReference);
    
    roles.$loaded().then(function(){
        console.log(roles.definition);
        context.definition = angular.toJson(roles.definition, true);
    });
                               
    context.save = function(){
        var definition = angular.fromJson(context.definition);
        roles.definition = definition;
        console.log(roles.definition);
        roles.$save();
    };
                               
}]);