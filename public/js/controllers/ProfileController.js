'use strict';

var profileController = angular.module('ProfileController', ['ngMaterial', 'firebase', 'nvd3']);

profileController.controller('ProfileController', [
  '$scope',
  '$rootScope',
  '$location',
  '$firebase',
  '$firebaseObject',
  '$firebaseArray',
  '$mdDialog',
  '$mdToast',
  '$window',
  function ($scope, $rootScope, $location, $firebase, $firebaseObject, $firebaseArray, $mdDialog, $mdToast, $window) {
    var context = this;
    console.log('controller initialized');
    // var technologiesReference = firebase.database().ref().child('technologies').orderByChild('createdBy').equalTo($rootScope.userEmail);
    // var technologies = $firebaseArray(technologiesReference);
    // technologies.$loaded().then(function () {
    //   context.technologies = [];
    //   angular.forEach(technologies, function (technology, key) {
    //     context.addTechnology(technology);
    //   });
    //   if (context.technologies.length > 0) {
    //     context.technologies.reverse();
    //   } else {
    //     context.noTechnologies = true;
    //   }
    // });
  },
]);
