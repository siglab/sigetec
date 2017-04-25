'use strict';

var homeController = angular.module('HomeController', 
                                    ['ngMaterial', 'firebase', 'nvd3']);


homeController.controller('HomeController', 
                          ['$scope', 
                           '$rootScope',
                           '$location',
                           '$firebase',
                           '$firebaseObject',
                           '$mdDialog',
                           '$mdToast',
                           '$window',
                           '$http',
function($scope, $rootScope, $location, $firebase, $firebaseObject, $mdDialog, $mdToast, $window, $http){
    var context = this;
    
    //var technologiesReference = firebase.database().ref().child("technologies");
    //var technologies = $firebaseObject(technologiesReference);
                               
    context.totalTechnologies = 1;
    context.lastMonthTechnologies = 1;
    context.totalPatents = 0;
                               
    context.options = {
        chart: {
            type: 'multiBarHorizontalChart',
            height: 450,
            x: function(d){return d.label;},
            y: function(d){return d.value;},
            showControls: false,
            showValues: true,
            duration: 500,
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
    
    context.frequencies = {};
    var request = $http({
                    method: 'GET',
                    url: "http://afv.mobi/sigetec/sigetec_firebase_request.php"
                });
    request.then(function(response){
        context.technologies = response.data;
        angular.forEach(response.data, function(technology){
            if(context.frequencies[technology.program] != undefined){
                context.frequencies[technology.program] ++;
            }else{
                context.frequencies[technology.program] = 1;
            }
        });
    });
    console.log(context.frequencies);
    
    context.values = [];
    
    for(var label in context.frequencies) {
        console.log(label);
        var frequency = context.frequencies[label];
        context.values.push({"label": label, "value": frequency});
    }
    
    console.log(context.values);
    
    context.data = [
        {
            "key": "Tecnologias",
            "color": "#d62728",
            "values": [
                {
                    "label" : "Ingeniería" ,
                    "value" : 5
                } ,
                {
                    "label" : "Artes" ,
                    "value" : 2
                } ,
                {
                    "label" : "Educación" ,
                    "value" : 1
                } 
            ]
        }
    ];
    
    context.technologies = [{name:"Tecnologia de prueba", description: "Prueba de una tecnología."}];
    /*                           
    technologies.$loaded().then(function(){
        context.technologies = technologies; 
        
        context.pieData = [];
        var faculties = {};
        var technologiesCount = 0;
        angular.forEach(technologies, function(key, value){
            technologiesCount++;
            if(faculties[value.faculty] == undefined){
                faculties[value.faculty] = 1;
                context.pieData.push({ key : value.faculty, y : 1 });
            }else{
                faculties[value.faculty] += 1;
            }
        });
        
        context.totalTechnologies = technologiesCount;
    });
    */
}]);