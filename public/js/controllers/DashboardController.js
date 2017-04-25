'use strict';

var dashboardController = angular.module('DashboardController', 
                                    ['ngMaterial', 'firebase', 'nvd3']);

dashboardController.controller('DashboardController', 
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
    var rolesReference = firebase.database().ref().child("roles/definition");
    var technologies = $firebaseArray(technologiesReference);
    var roles = $firebaseArray(rolesReference);
    
    context.noTechnologies = false;
           
    context.chartOptions = {
        chart: {
            type: 'multiBarHorizontalChart',
            height: 450,
            x: function(d){return d.label;},
            y: function(d){return d.value;},
            showControls: false,
            showValues: true,
            duration: 500,
            width: 500,
            xAxis: {
                showMaxMin: false
            },
            yAxis: {
                axisLabel: '',
                tickFormat: function(d){
                    return d3.format(',.0f')(d);
                }
            }
        }
    };
    
    $rootScope.userRole = "none";
    roles.$loaded().then(function(){
        angular.forEach(roles, function(rol, rolName){
            angular.forEach(rol.users, function(user, userKey){
                if(user == $rootScope.userEmail){
                    $rootScope.userRole = rol.rolName;
                }
            });
        });
    });
                                 
    technologies.$loaded().then(function(){
        context.technologies = technologies;
        
        if(technologies.length > 0){
            context.noTechnologies = true;    
        }
        var tecnologyList = {};
        angular.forEach(technologies, function(technology, key){
            if(tecnologyList[technology.program] != undefined){
                tecnologyList[technology.program]++;
            }else{
                tecnologyList[technology.program] = 1;
            }
        });
        
        var technologyArray = [];
        angular.forEach(tecnologyList, function(technologyCount, key){
            technologyArray.push({"label": key, "value": technologyCount});
        });
        
        context.chartData = [
            {
                "key": "Tecnologias",
                "color": "#d62728",
                "values": technologyArray
            }
        ];
    });
                               
    context.importantDates = [{date: "2017-04-01", title: "Vencimiento de registro", technologyName: "Test" }];
                               
    context.newPatent = function(){
        $location.path('form/form-patents/patents');
    }
    
    context.newTechnology = function(){
        $location.path('technology-form');
    }
    
    context.editTechnology = function(technology){
        $location.path('technology-form/'+technology.$id);
    }
    
}]);