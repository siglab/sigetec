'use strict';

var dashboardController = angular.module('DashboardController', ['ngMaterial', 'firebase', 'nvd3', 'ui-notification']);
dashboardController.config(function (NotificationProvider) {
  NotificationProvider.setOptions({
    startTop: 60,
    positionX: 'right',
    positionY: 'bottom',
  });
});
dashboardController.controller('DashboardController', [
  '$scope',
  '$rootScope',
  '$location',
  '$firebase',
  '$firebaseObject',
  '$firebaseArray',
  '$mdDialog',
  '$mdToast',
  '$window',
  'Notification',
  function ($scope, $rootScope, $location, $firebase, $firebaseObject, $firebaseArray, $mdDialog, $mdToast, $window, Notification) {
    window.onscroll = function () {};
    var context = this;
    var rolesReference = firebase.database().ref().child('roles/definition');
    var roles = $firebaseArray(rolesReference);
    context.noTechnologies = false;
    context.showResearcherDashboard = true;
    context.showCoordinatorDashboard = false;
    context.showWorkerDashboard = false;
    $rootScope.permissions = [];
    $rootScope.userRoles = ['researcher'];
    $rootScope.allowedStatus = {
      change: [],
      view: [],
    };

    // Grafico de barras
    // context.chartOptions = {
    //     chart: {
    //         type: 'multiBarHorizontalChart',
    //         height: 450,
    //         x: function(d){return d.label;},
    //         y: function(d){return d.value;},
    //         showControls: false,
    //         showValues: true,
    //         duration: 500,
    //         width: 500,
    //         xAxis: {
    //             showMaxMin: false
    //         },
    //         yAxis: {
    //             axisLabel: '',
    //             tickFormat: function(d){
    //                 return d3.format(',.0f')(d);
    //             }
    //         }
    //     }
    // };

    // Get user permissions from assigned roles.
    roles.$loaded().then(function () {
      var otriAvailableUsers = [];
      // var userRole = 'researcher';
      angular.forEach(roles, function (rol, rolName) {
        angular.forEach(rol.users, function (user, userKey) {
          if (rol.rolName == 'otri-member') {
            otriAvailableUsers.push(user);
          }
          if (user == $rootScope.userEmail) {
            // userRole = rol.rolName;
            $rootScope.userRoles.push(rol.rolName);
            if (rol.permissions) {
              $rootScope.permissions = $rootScope.permissions.concat(rol.permissions).unique();
            }
            if (rol.allowedStatus.change) {
              $rootScope.allowedStatus.change = $rootScope.allowedStatus.change.concat(rol.allowedStatus.change).unique();
            }
            if (rol.allowedStatus.view) {
              $rootScope.allowedStatus.view = $rootScope.allowedStatus.view.concat(rol.allowedStatus.view).unique();
            }
            // context.showWorkerDashboard = true;
            // context.showResearcherDashboard = false;
          }
        });
        $rootScope.otriAvailableUsers = otriAvailableUsers;
      });
      if ($rootScope.userRoles.indexOf('admin') >= 0 || $rootScope.userRoles.indexOf('coordinator') >= 0) {
        var notificationsReference = firebase.database().ref('/bell-notifications').child($rootScope.userEmail.split('@')[0].split('.').join(''));
        var notifications = $firebaseArray(notificationsReference);
        $rootScope.userNotifications = [];
        $rootScope.oldUserNotifications = [];
        notifications.$loaded().then(function () {
          if (notifications.length > 0) {
            notifications.forEach((notification) => {
              if (!notification[0]['read']) {
                var notificationBuffer = notification[0];
                notificationBuffer['notificationId'] = notification.$id;
                $rootScope.userNotifications.push(notificationBuffer);
              } else {
                var notificationBuffer = notification[0];
                notificationBuffer['notificationId'] = notification.$id;
                $rootScope.oldUserNotifications.push(notificationBuffer);
              }
            });
          }
          notifications.$watch(function (event) {
            if (event.event == 'child_added') {
              var newNotificationRef = firebase
                .database()
                .ref('/bell-notifications')
                .child($rootScope.userEmail.split('@')[0].split('.').join('') + '/' + event.key);
              var notification = $firebaseObject(newNotificationRef);
              notification.$loaded().then((newNotification) => {
                var notificationBuffer = newNotification[0];
                notificationBuffer['notificationId'] = newNotification.$id;
                if (
                  $rootScope.userNotifications
                    .map(function (noti) {
                      return noti.notificationId;
                    })
                    .indexOf(newNotification.$id) < 0 &&
                  $rootScope.oldUserNotifications
                    .map(function (noti) {
                      return noti.notificationId;
                    })
                    .indexOf(newNotification.$id) < 0
                ) {
                  $rootScope.userNotifications.push(notificationBuffer);
                }
              });
            }
          });
        });
      }
      if ($rootScope.permissions.indexOf('showRegistered') >= 0) {
        context.showCoordinatorDashboard = true;
      }
      if ($rootScope.permissions.indexOf('showAssigned') >= 0) {
        context.showWorkerDashboard = true;
      }
      // if(userRole == undefined){
      //     userRole = "researcher";
      //     context.showResearcherDashboard = true;
      //     context.showWorkerDashboard = false;
      // }
      // $rootScope.userRole = userRole;
      // if(userRole !== undefined){
      //  context.getAllowedTechnologies(userRole);
      // }
      if ($rootScope.userRoles.length == 1) {
        context.getAllowedTechnologies('researcher');
      } else {
        context.getAllowedTechnologies('other');
      }
    });

    context.getAllowedTechnologies = function (rolName) {
      var technologiesReference = undefined;
      if (rolName == 'researcher') {
        technologiesReference = firebase.database().ref().child('technologies').orderByChild('createdBy').equalTo($rootScope.userEmail);
      } else {
        // technologiesReference = firebase.database().ref().child('technologies').orderByChild('createdAt');
        technologiesReference = firebase.database().ref('technologies').orderByChild('createdAt');
      }
      var technologies = $firebaseArray(technologiesReference);
      technologies.$loaded().then(function () {
        context.technologies = [];
        context.myTechnologies = [];
        context.myAssignedTechnologies = [];
        context.registeredTechnologies = [];
        if (rolName == 'researcher') {
          angular.forEach(technologies, function (technology, key) {
            context.addTechnology(technology);
          });
        } else {
          // Get user allowed technologies
          angular.forEach(technologies, function (technology, key) {
            if (
              $rootScope.allowedStatus.view.find(function (status) {
                return status == technology.status;
              })
            ) {
              context.addTechnology(technology);
            }
          });

          // Get user assigned technologies
          angular.forEach(technologies, function (technology, key) {
            if (technology.assignedTo == $rootScope.userEmail) {
              context.addTechnology(technology);
            }
          });

          var shareReference = firebase.database().ref().child('share');
          var share = $firebaseArray(shareReference);
          share.$loaded().then(function () {
            angular.forEach(technologies, function (technology, key) {
              if (
                $rootScope.allowedStatus.view.find(function (status) {
                  return status == technology.status;
                })
              ) {
                context.addTechnology(technology);
              }
            });
          });

          var tecnologyList = {};
          angular.forEach(technologies, function (technology, key) {
            if (tecnologyList[technology.program] != undefined) {
              tecnologyList[technology.program]++;
            } else {
              tecnologyList[technology.program] = 1;
            }
          });

          var technologyArray = [];
          angular.forEach(tecnologyList, function (technologyCount, key) {
            technologyArray.push({ label: key, value: technologyCount });
          });

          context.chartData = [
            {
              key: 'Tecnologias',
              color: '#919396',
              values: technologyArray,
            },
          ];
        }
        if (context.technologies.length > 0) {
          context.technologies.reverse();
        } else {
          context.noTechnologies = true;
          Notification({
            message: 'No tienes ninguna tecnologia guardada o registrada. Por favor haga click en el botón crear tecnologia para iniciar el registro de una nueva tecnología.',
            templateUrl: 'custom_template.html',
            delay: 10000,
            replaceMessage: true,
            positionX: 'center',
            positionY: 'bottom',
          });
        }
        // console.log(context.technologies);
      });
    };

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
        newTechnology.createdAt = new Date(newTechnology.createdAt);
        if (newTechnology.createdBy == $rootScope.userEmail) {
          context.myTechnologies = [newTechnology, ...context.myTechnologies];
        }
        switch (newTechnology.status) {
          case 'Asignada':
            if (newTechnology.assignedTo == $rootScope.userEmail) {
              context.myAssignedTechnologies = [newTechnology, ...context.myAssignedTechnologies];
            }
            break;
          case 'Registrada':
            context.registeredTechnologies = [newTechnology, ...context.registeredTechnologies];
            break;
          default:
            break;
        }
        context.technologies.push(newTechnology);
      }
    };

    context.importantDates = [{ date: '2017-04-01', title: 'Vencimiento de registro', technologyName: 'Test' }];

    context.newPatent = function () {
      $location.path('form/form-patents/patents');
    };

    context.newTechnology = function () {
      $location.path('technology-form');
    };

    context.editTechnology = function (technology) {
      $location.path('technology-form/' + technology.$id);
    };

    Array.prototype.unique = function () {
      var a = this.concat();
      for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
          if (a[i] === a[j]) a.splice(j--, 1);
        }
      }
      return a;
    };
  },
]);
