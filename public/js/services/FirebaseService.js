'use strict';

var firebaseService = angular.module('FirebaseService', ['firebase']);

firebaseService.factory('firebaseServiceFactory',
        ['firebase', 'firebaseArray', 'firebaseObject', 
function(firebase, firebaseArray, firebaseObject){
    var serviceFactory = {};
    var data = undefined;
    
    serviceFactory.getData = function(){
        return data;
    }
    
    serviceFactory.getArray = function(path, orderBy){
        var arrayReference = firebase.database().ref().child(path);
        
        if(orderBy){
            arrayReference.orderByChild('createdAt');
        }
        data = $firebaseArray(arrayReference);
        return data.$loaded().then(serviceFactory.getData);
    };
    
    serviceFactory.getObject = function(path){
        var arrayReference = firebase.database().ref().child(path);

        data = $firebaseObject(arrayReference);
        return data.$loaded().then(serviceFactory.getData);
    };
    
    return serviceFactory;
}]);

firebaseService.service('firebaseService', function(firebaseServiceFactory){
    this.getArray = function(path, orderBy) {
        return firebaseServiceFactory.getArray(path, orderBy);
    };
    this.getObject = function(path, orderBy){
        return firebaseServiceFactory.getObject(path, orderBy);
    };
});