'use strict';

var mainController = angular.module('MainController', ['ngMaterial', 'firebase', 'google-signin']);

mainController.config([
  'GoogleSigninProvider',
  function (GoogleSigninProvider) {
    GoogleSigninProvider.init({
      client_id: '1062822677207-d2evd1clqp0u4jfrmi2jvhmrol474dri.apps.googleusercontent.com',
    });
  },
]);

mainController.controller('MainController', [
  '$scope',
  '$rootScope',
  '$location',
  '$firebase',
  '$mdDialog',
  '$mdToast',
  '$window',
  'GoogleSignin',
  '$mdSidenav',
  '$firebaseAuth',
  '$firebaseObject',
  function ($scope, $rootScope, $location, $firebase, $mdDialog, $mdToast, $window, GoogleSignin, $mdSidenav, $firebaseAuth, $firebaseObject) {
    var context = this;
    context.notificationsUpdated = false;
    context.isLoggedin = false;
    $rootScope.isLoggedin = false;
    context.userName = 'Ingresar';
    //$mdSidenav('left').toggle();
    $rootScope.auth = $firebaseAuth();

    var currentUser = firebase.auth().currentUser;
    if (currentUser != null) {
      context.userName = currentUser.displayName;
    }

    context.newPatent = function () {
      $location.path('form/form-patents/patents');
    };

    context.newTechnology = function () {
      $location.path('form/form-technologies/technologies');
    };

    context.showPatents = function () {
      context.patentsSelected = true;
      context.technologiesSelected = false;
      $location.path('patents');
    };

    context.showTechnologies = function () {
      context.patentsSelected = false;
      context.technologiesSelected = true;
      $location.path('technologies');
      context.toggleSidebar();
    };

    context.showMyTechnologies = function () {
      context.patentsSelected = false;
      context.technologiesSelected = true;
      $location.path('my-technologies');
      context.toggleSidebar();
    };

    context.showAssgignedTechnologies = function () {
      context.patentsSelected = false;
      context.technologiesSelected = false;
      $location.path('assigned-technologies');
      context.toggleSidebar();
    };

    context.showRoles = function () {
      $location.path('roles');
      context.toggleSidebar();
    };

    context.showReferences = function () {
      $location.path('references');
      context.toggleSidebar();
    };

    context.showFormats = function () {
      $location.path('formats');
      context.toggleSidebar();
    };

    context.showReports = function () {
      $location.path('reports');
      context.toggleSidebar();
    };

    context.showDashboard = function () {
      $location.path('dashboard');
      context.toggleSidebar();
    };

    context.toggleSidebar = function () {
      $mdSidenav('mainMenu').toggle();
    };

    context.closeSession = function () {
      firebase
        .auth()
        .signOut()
        .then(function () {
          $rootScope.userName = 'Ingresar';
          $rootScope.isLoggedin = false;
          $rootScope.userNotifications = null;
          $rootScope.oldUserNotifications = null;
          $location.path('home');
          $scope.$apply();
          context.toggleSidebar();
        })
        .catch(function () {
          console.log('Error signing out.');
        });
    };

    context.showNotifications = function () {
      $('#notificationContainer').fadeToggle();
      $('#notification_count').fadeOut('slow');
      $('#notificationLink > i.fa-bell').addClass('fa-bell-o');
      $('#notificationLink > i.fa-bell').removeClass('fa-bell');
      context.markAsReadNotifications();
      return false;
    };

    context.closeNotificationsWindow = function () {
      $('#notificationContainer').fadeToggle();
      return false;
    };

    context.technologyDetails = function (technologyId) {
      $('#notificationContainer').fadeToggle();
      $location.path('technology-form/' + technologyId);
    };

    context.markAsReadNotifications = function () {
      if ($rootScope.userNotifications.length > 0 && !context.notificationsUpdated) {
        var userNotificationsReference = firebase.database().ref('/bell-notifications/' + $rootScope.userEmail.split('@')[0].split('.').join(''));
        $rootScope.userNotifications.forEach((element) => {
          var notification = $firebaseObject(userNotificationsReference.child(element.notificationId));
          notification.$loaded().then(function (notificationItem) {
            notificationItem[0]['read'] = true;
            console.log(notificationItem);
            notificationItem.$save();
          });
        });
        context.removeOldNotifications();
        context.notificationsUpdated = true;
      } else if (!context.notificationsUpdated) {
        context.removeOldNotifications();
        context.notificationsUpdated = true;
      }
    };

    context.removeOldNotifications = function () {
      if ($rootScope.oldUserNotifications && $rootScope.oldUserNotifications.length > 0) {
        var userNotificationsReference = firebase.database().ref('/bell-notifications/' + $rootScope.userEmail.split('@')[0].split('.').join(''));
        $rootScope.oldUserNotifications.forEach((element) => {
          if (!element.createdAt || element.createdAt + 7 * 24 * 60 * 60 * 1000 < +new Date()) {
            var notification = $firebaseObject(userNotificationsReference.child(element.notificationId));
            notification.$loaded().then(function (notificationItem) {
              notificationItem.$remove();
            });
          }
        });
      }
    };

    context.setNotificationDate = function (timestamp) {
      return new Date(timestamp).toLocaleDateString();
    };
  },
]);
