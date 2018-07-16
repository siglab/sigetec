'use strict';

var homeController = angular.module('HomeController', 
                                    ['ngMaterial', 'firebase', 'nvd3', 'md.data.table']);


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
                               
    // $scope.selected = [];
    //   $scope.query = {
    //     order: 'name',
    //     limit: 5,
    //     page: 1
    //   };
    //   context.desserts = [{"_id":"5b025f909c944f00049834cd","name":" v","nameToLower":" v","__v":0,"iron":{"value":5,"unit":"%"},"calcium":{"value":7,"unit":"%"},"sodium":{"value":56,"unit":"mg"},"protein":{"value":65,"unit":"g"},"carbs":{"value":5,"unit":"g"},"fat":{"value":0,"unit":"g"},"calories":{"value":1,"unit":"Cal"},"serving":"100g"},{"_id":"5ad8f80bc3349300045c48d5","name":"!","nameToLower":"!","__v":0,"iron":{"value":5,"unit":"%"},"calcium":{"value":5,"unit":"%"},"sodium":{"value":5,"unit":"mg"},"protein":{"value":5,"unit":"g"},"carbs":{"value":5,"unit":"g"},"fat":{"value":5,"unit":"g"},"calories":{"value":50,"unit":"Cal"},"serving":"100g"},{"_id":"5ab09e873ad21c00043a80ee","name":"!ME !ME !ME","nameToLower":"!me !me !me","__v":0,"iron":{"value":69,"unit":"%"},"calcium":{"value":69,"unit":"%"},"sodium":{"value":69,"unit":"mg"},"protein":{"value":69,"unit":"g"},"carbs":{"value":69,"unit":"g"},"fat":{"value":69,"unit":"g"},"calories":{"value":69,"unit":"Cal"},"serving":"100g"},{"_id":"5aaa7e11a0bf400004b4680c","name":"\"\"A","nameToLower":"\"\"a","__v":0,"iron":{"value":32,"unit":"%"},"calcium":{"value":1,"unit":"%"},"sodium":{"value":3131,"unit":"mg"},"protein":{"value":5,"unit":"g"},"carbs":{"value":4,"unit":"g"},"fat":{"value":2,"unit":"g"},"calories":{"value":32,"unit":"Cal"},"serving":"100g"},{"_id":"5aafbd4b161c0a000437b8b0","name":"\"\"klasmdöasd","nameToLower":"\"\"klasmdöasd","__v":0,"iron":{"value":0,"unit":"%"},"calcium":{"value":0,"unit":"%"},"sodium":{"value":0,"unit":"mg"},"protein":{"value":0,"unit":"g"},"carbs":{"value":0,"unit":"g"},"fat":{"value":0,"unit":"g"},"calories":{"value":0,"unit":"Cal"},"serving":"100g"}]; 
    //   function success(desserts) {
    //     // $scope.desserts = desserts;
    //   };
    //   $scope.getDesserts = function () {
    //     // $scope.promise = $nutrition.desserts.get($scope.query, success).$promise;
    //   };

    context.visualizeAs = "graph";
    context.detail = {};
    context.showLegend = false;

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
                  .on("click", function(d){ context.detail = d; context.showLegend = true; $scope.$digest(); })
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
                nodes.push({"name": technology.program, "group":3});
            }
            var technologyIndex = nodes.length;
            if(technology['granted-date'] == undefined){
                nodes.push({"name": technology.name, 
                        "group":6, 
                        "$id":technology.$id, 
                        "description": technology.description});
            }else{
                nodes.push({"name": technology.name, 
                        "group":5, 
                        "$id":technology.$id, 
                        "description": technology.description});
            }
            
            links.push({"source":techIndex,"target":technologyIndex,"value":1});
            links.push({"source":facultyIndex,"target":technologyIndex,"value":1});
        });
        $scope.data = {
            "nodes":nodes,
            "links":links
        };
    });
    
    context.login = function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("https://www.googleapis.com/auth/plus.login");
        provider.setCustomParameters({
            login_hint: "user@example.com"
        });

        $rootScope.auth.$signInWithPopup(provider).then(function(result) {
            console.log("Signed in as:", result);
            $rootScope.userName = result.user.displayName;
            $rootScope.isLoggedin = true;
            $rootScope.userEmail = result.user.email;
            var body = document.querySelector("body");
            var sidebarOverlay = document.querySelector(".side-menu-overlay");
            var sidebar = document.querySelector("#side-menu");
            angular.element(body).removeClass("side-menu-visible");
            angular.element(sidebarOverlay).css("display","none");
            angular.element(body).removeClass("overflow-hidden ");
            angular.element(sidebar).css("display","none");
            $location.path('/dashboard');
        }).catch(function(error) {
            console.error("Authentication failed:", error);
        });
    };

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