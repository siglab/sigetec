'use strict';

var mainController = angular.module('MainController', 
                                    ['ngMaterial', 'firebase', 'google-signin']);

mainController.config(['GoogleSigninProvider', function(GoogleSigninProvider) {
     GoogleSigninProvider.init({
        client_id: '1062822677207-d2evd1clqp0u4jfrmi2jvhmrol474dri.apps.googleusercontent.com'
     });
}]);

mainController.controller('MainController', 
                          ['$scope', 
                           '$rootScope',
                           '$location',
                           '$firebase',
                           '$mdDialog',
                           '$mdToast',
                           '$window',
                           'GoogleSignin',
                           '$mdSidenav',
                           '$firebaseAuth',
function($scope, $rootScope, $location, $firebase, $mdDialog, $mdToast, $window, GoogleSignin, $mdSidenav, $firebaseAuth){
    var context = this;
    
    context.isLoggedin = false;
    $rootScope.isLoggedin = false;
    context.userName = "Ingresar";
    //$mdSidenav('left').toggle();
    $rootScope.auth = $firebaseAuth();
                               
    var currentUser = firebase.auth().currentUser;
    if(currentUser != null){
        context.userName = currentUser.displayName;
    }
    
    context.newPatent = function(){
        $location.path('form/form-patents/patents');
    }
    
    context.newTechnology = function(){
        $location.path('form/form-technologies/technologies');
    }
    
    context.showPatents = function(){
        context.patentsSelected = true;
        context.technologiesSelected = false;
        $location.path('patents');
    }
                               
    context.showTechnologies = function(){
        context.patentsSelected = false;
        context.technologiesSelected = true;
        $location.path('technologies');
        context.toggleSidebar();
    }
    
    context.showRoles = function(){
        $location.path('roles');
        context.toggleSidebar();
    }
    
    context.showReferences = function(){
        $location.path('references');
        context.toggleSidebar();
    }
    
    context.showFormats = function(){
        $location.path('formats');
        context.toggleSidebar();
    }
    
    context.showReports = function(){
        $location.path('reports');
        context.toggleSidebar();
    }
    
    context.showDashboard = function(){
        $location.path('dashboard');
        context.toggleSidebar();
    }
    
    context.toggleSidebar = function(){
        $mdSidenav('mainMenu').toggle();
    }
    
    context.closeSession = function(){
        firebase.auth().signOut().then(function(){
            $rootScope.userName = "Ingresar";
            $rootScope.isLoggedin = false;
            $location.path('home');
            $scope.$apply();
            context.toggleSidebar();
        }).catch(function(){
            console.log("Error signing out.")
        });
    }

}]);