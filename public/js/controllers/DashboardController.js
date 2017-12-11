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
    
    var rolesReference = firebase.database().ref().child("roles/definition");
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
        var availableUsers = [];
        var userRole = undefined;
        angular.forEach(roles, function(rol, rolName){
            angular.forEach(rol.users, function(user, userKey){
                availableUsers.push(user);
                if(user == $rootScope.userEmail){
                    userRole = rol.rolName;
                    $rootScope.permissions = rol.permissions;
                    $rootScope.allowedStatus = rol.allowedStatus.change;
                    $rootScope.allowedStatusView = rol.allowedStatus.view;
                    context.showWorkerDashboard = true;
                    context.showResearcherDashboard = false;
                }
            });
            $rootScope.availableUsers = availableUsers;
        });
        if(userRole == undefined){
            userRole = "researcher";
            context.showResearcherDashboard = true;
            context.showWorkerDashboard = false;
        }
        $rootScope.userRole = userRole;
        if(userRole !== undefined){
            context.getAllowedTechnologies(userRole);
        } 
    });
    
    context.getAllowedTechnologies = function(rolName){
        var technologiesReference = undefined;
        if(rolName == "researcher"){
            technologiesReference = firebase.database().ref().child("technologies")
                                                            .orderByChild('createdBy')
                                                            .equalTo($rootScope.userEmail);
        }else{
            technologiesReference = firebase.database().ref().child("technologies")
                                                            .orderByChild('createdAt');
        }
        
        //var technologiesReference = firebase.database().ref().child("technologies").orderByChild('createdAt');
        var technologies = $firebaseArray(technologiesReference);
        
        technologies.$loaded().then(function(){
            context.technologies = [];
            if(rolName == "researcher"){
                angular.forEach(technologies, function(technology, key){
                    context.addTechnology(technology);
                });
            }else {
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
                        "color": "#919396",
                        "values": technologyArray
                    }
                ];   
            }
            if(context.technologies.length > 0){
                context.technologies.reverse();
            }else{
                context.noTechnologies = true;
            }
            console.log(context.technologies);
        });
    }
    
    context.addTechnology = function(newTechnology){
        var found = false;
        if(context.technologies.find(function(technology){return technology.technologyId == newTechnology.technologyId; })){
            found = true;
        }
        if(!found || context.technologies.length < 1){
            newTechnology.createdAt = new Date(newTechnology.createdAt);
            context.technologies.push(newTechnology);
        }
    }
                               
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