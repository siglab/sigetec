'use strict';

var referencesController = angular.module('ReferencesController', 
                                    ['ngMaterial', 'firebase', 'nvd3']);


referencesController.controller('ReferencesController', 
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
    
    var referencesReference = firebase.database().ref().child("references");
    var references = $firebaseObject(referencesReference);
    
    references.$loaded().then(function(){
        context.definition = angular.toJson(references.definition, true);
    });
                               
    context.save = function(){
        var definition = angular.fromJson(context.definition);
        references.definition = definition;
        references.$save();
        $mdToast.show(
            $mdToast.simple()
                .textContent('La definición fue guardada exitosamente.')
                .position( "top" )
                .hideDelay(3000)
        );
    };
                               
}]);