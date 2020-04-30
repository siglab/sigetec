'use strict';

var assignedTechnologiesController = angular.module('AssignedTechnologiesController', ['ngMaterial', 'firebase', 'nvd3']);

assignedTechnologiesController.controller('AssignedTechnologiesController', [
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
    var technologiesReference = firebase.database().ref().child('technologies').orderByChild('assignedTo').equalTo($rootScope.userEmail);
    var technologies = $firebaseArray(technologiesReference);
    technologies.$loaded().then(function () {
      context.technologies = [];
      angular.forEach(technologies, function (technology, key) {
        if (technology.status == 'Asignada' && technology.assignedTo == $rootScope.userEmail) {
          context.addTechnology(technology);
        }
      });
      if (context.technologies.length > 0) {
        context.technologies.reverse();
      } else {
        context.noTechnologies = true;
      }
    });

    angular.element(document).ready(function () {
      angular.element(document.querySelector('#technologyTable')).DataTable({
        order: [[4, 'desc']],
      });
    });

    context.addTechnology = function (newTechnology) {
      var found = false;
      if (
        context.technologies.find(function (technology) {
          return technology.technologyId == newTechnology.technologyId;
        })
      ) {
        found = true;
      }
      if (!found || context.technologies.length < 1) {
        context.technologies.push(newTechnology);
      }
    };

    context.editTechnology = function (technology) {
      $location.path('technology-form/' + technology.$id);
    };

    context.setTechnologyRegistrationDate = function (technology) {
      return new Date(technology['registeredAt']).toLocaleDateString();
    };
  },
]);
