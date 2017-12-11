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
    
    
                               
    context.visualizeAs = "graph";
    context.detail = {};
                               
    var color = d3.scale.category20()
    $scope.options = {
        chart: {
            type: 'forceDirectedGraph',
            height: 500,
            width: (function(){ return nv.utils.windowSize().width })(),
            margin:{top: 20, right: 20, bottom: 20, left: 20},
            color: function(d){
                return color(d.group)
            },
            nodeExtras: function(node) {
                node && node
                  .append("text")
                  .attr("dx", -7)
                  .attr("dy", ".35em")
                  .text(function(d) { return "· · · "+d.name })
                  .on("click", function(d){ context.detail = d; $scope.$digest(); })
                  .style('font-size', '10px');
            }
        }
    };
    
    var nodes = [];
    var links = [];
    var sector = [];
    var faculty = [];
    context.technologiesArray = [];
    var request = $http({ method: 'GET',
                            url: "https://afv.mobi/sigetec/sigetec_firebase_request.php"
                        });
    request.then(function(response){
        angular.forEach(response.data, function(technology){
            context.technologiesArray.push(technology);

            var techIndex = context.isInArray(nodes, technology["technology-type"]);
            if(techIndex < 0){
                techIndex = nodes.length;
                nodes.push({"name": technology["technology-type"], "group":1});
            }
            var facultyIndex = context.isInArray(nodes, technology.program);
            if( facultyIndex < 0){
                facultyIndex = nodes.length;
                nodes.push({"name": technology.program, "group":2});
            }
            var technologyIndex = nodes.length;
            nodes.push({"name": technology.name, 
                        "group":2, 
                        "$id":technology.$id, 
                        "description": technology.name});
            links.push({"source":techIndex,"target":technologyIndex,"value":1});
            links.push({"source":facultyIndex,"target":technologyIndex,"value":1});
        });
        
        $scope.data = {
            "nodes":nodes,
            "links":links
        };
    });
                                                             
    context.isInArray = function(array, value){
        for(var i=0; i<array.length; i++){
            if(array[i].name == value){
                return i;
            }
        }
        return -1;
    }
    
    context.showTechnologiesList = function(sector){
        context.sector = sector;
        $mdDialog.show({
          controller: DialogController,
          templateUrl: 'partials/technologies-list.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
        })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
        }); 
    } 
    
    function DialogController($scope, $mdDialog) {
        $scope.sector = context.sector;
        $scope.technologies = [];
        angular.forEach(context.technologiesArray, function(technology){
            if(technology.technologic_sector != undefined && technology.technologic_sector === context.sector){
                $scope.technologies.push(technology);
            }
        });
        
        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.onClickTechnology = function(technology) {
            $mdDialog.hide();
            $location.path("detail/form-technologies/technologies/"+technology.$id); 
        };     
    }
                               
    context.showDetail = function(technology){
        $location.path("detail/form-technologies/technologies/"+technology.$id); 
    }
    
    context.visualizeChange = function(option){
        context.visualizeAs = option;
    }
    
}]);