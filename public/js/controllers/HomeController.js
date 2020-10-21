"use strict";

var homeController = angular.module("HomeController", [
  "ngMaterial",
  "firebase",
  "nvd3",
  "datatables",
]);

homeController.controller("HomeController", [
  "$scope",
  "$rootScope",
  "$location",
  "$firebase",
  "$firebaseObject",
  "$mdDialog",
  "$mdToast",
  "$window",
  "$http",
  "DTColumnDefBuilder",
  "DTOptionsBuilder",
  "__apiRoutes",
  function (
    $scope,
    $rootScope,
    $location,
    $firebase,
    $firebaseObject,
    $mdDialog,
    $mdToast,
    $window,
    $http,
    DTColumnBuilder,
    DTOptionsBuilder
  ) {
    var context = this;
    context.visualizeAs = "graph";
    context.detail = {};
    context.showLegend = false;
    context.technologiesArray = [];
    context.allTechnologiesObj = {};
    context.selectedTechnologyDetailsId = null;
    context.isDataLoading = true;
    context.availableTechnologyTypes = null;
    context.availableCountries = {};
    context.technologiesByType = {};
    context.patentedTechnologiesByCountry = {};
    context.pieChart = null;
    context.geoChart = null;
    context.pieChartData = null;
    context.geoChartData = null;
    context.selectedTechnologyType = null;
    context.selectedPatentRegion = null;
    $scope.selectedDataset = null;
    $scope.seletcedCountriesDataset = null;
    $scope.options = {
      chart: {
        type: "forceDirectedGraph",
        height: 500,
        width: (function () {
          return nv.utils.windowSize().width;
        })(),
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        color: function (d) {
          return color(d.group);
        },
        nodeExtras: function (node) {
          node &&
            node
              .append("text")
              .attr("dx", -7)
              .attr("dy", ".35em")
              .text(function (d) {
                return "· · · " + d.name;
              })
              .on("click", function (d) {
                context.detail = d;
                context.showLegend = true;
                $scope.$digest();
              })
              .style("font-size", "10px");
        },
      },
    };
    $scope.allTechnologiesDataset = [];
    var color = d3.scale.category20();
    var nodes = [];
    var links = [];
    var sector = [];
    var faculty = [];
    var request = $http({
      method: "GET",
      url: __apiRoutes.points.getTechnologies,
    });
    request.then(function (response) {
      Promise.all([context.getCountries(), context.getTechnologyTypes()])
        .then(() => {
          angular.forEach(response.data, function (technology, key) {
            context.technologiesArray.push(technology);
            // var techIndex = context.isInArray(
            //   nodes,
            //   technology["technology-type"]
            // );
            // if (techIndex < 0) {
            //   techIndex = nodes.length;
            //   nodes.push({ name: technology["technology-type"], group: 1 });
            // }
            // var facultyIndex = context.isInArray(nodes, technology.program);
            // if (facultyIndex < 0) {
            //   facultyIndex = nodes.length;
            //   nodes.push({ name: technology.program, group: 3 });
            // }
            // var technologyIndex = nodes.length;
            // if (technology["granted-date"] == undefined) {
            //   nodes.push({
            //     name: technology.name,
            //     group: 6,
            //     $id: technology.$id,
            //     description: technology.description,
            //   });
            // } else {
            //   nodes.push({
            //     name: technology.name,
            //     group: 5,
            //     $id: technology.$id,
            //     description: technology.description,
            //   });
            // }
            // links.push({
            //   source: techIndex,
            //   target: technologyIndex,
            //   value: 1,
            // });
            // links.push({
            //   source: facultyIndex,
            //   target: technologyIndex,
            //   value: 1,
            // });
            technology.key = key;
            technology.inventionType = context.technologiesByType[
              technology["technology-type"]
            ]
              ? context.technologiesByType[technology["technology-type"]][
                  "name"
                ]
              : "";
            technology["details"]["answers"]["license-info"] &&
            technology["details"]["answers"]["license-info"][0] &&
            technology["details"]["answers"]["license-info"][0][
              "license-type"
            ] &&
            technology["details"]["answers"]["license-info"][0][
              "license-type"
            ] === "Si"
              ? (technology.licenseType = "Uso libre")
              : (technology.licenseType = "Restrictiva");
            technology["details"]["answers"]["group-principal-researcher"][0][
              "nombre-apellidos"
            ]
              ? (technology.mainResearcher =
                  technology["details"]["answers"][
                    "group-principal-researcher"
                  ][0]["nombre-apellidos"])
              : (technology.mainResearcher = "Sin registro");
            var grantedPatentCountriesList = [];
            if (technology["details"]["answers"]["patents-info"]) {
              let patentGranted = false;
              for (
                let index = 0;
                index <
                Object.keys(technology["details"]["answers"]["patents-info"])
                  .length;
                index++
              ) {
                if (
                  technology["details"]["answers"]["patents-info"][index][
                    "patent-granted"
                  ] === true
                ) {
                  patentGranted = true;
                  if (
                    technology["details"]["answers"]["patents-info"][index][
                      "request-country"
                    ]
                  ) {
                    grantedPatentCountriesList.push(
                      context.availableCountries[
                        technology["details"]["answers"]["patents-info"][index][
                          "request-country"
                        ]
                      ]
                    );
                  }
                }
              }
              if (patentGranted) {
                technology.technologyType = "Patente";
              } else {
                technology.technologyType = "Tecnología";
              }
            } else {
              technology.technologyType = "Tecnología";
            }
            for (let i = 0; i < grantedPatentCountriesList.length; i++) {
              if (
                !context.patentedTechnologiesByCountry[
                  grantedPatentCountriesList[i]
                ]
              ) {
                context.patentedTechnologiesByCountry[
                  grantedPatentCountriesList[i]
                ] = [];
              }
              context.patentedTechnologiesByCountry[
                grantedPatentCountriesList[i]
              ].push(technology);
            }
            context.technologiesByType[technology["technology-type"]][
              "technologies"
            ].push(technology);
            context.allTechnologiesObj[technology["technologyId"]] = technology;
            $scope.allTechnologiesDataset.push(technology);
          });
          $scope.data = {
            nodes: nodes,
            links: links,
          };
          context.buildPieChart();
          context.buildGeoChart();
        })
        .catch((error) => {
          console.log(error);
        });
    });

    context.buildPieChart = function () {
      google.charts.load("current", { packages: ["corechart"] });
      google.charts.setOnLoadCallback(drawChart);
      function drawChart() {
        context.pieChartData = new google.visualization.DataTable();
        context.pieChartData.addColumn("string", "Tipo de invención");
        context.pieChartData.addColumn("number", "Tecnologías registradas");
        var pieChartContent = [];
        angular.forEach(context.technologiesByType, function (value, key) {
          pieChartContent.push([value["name"], value["technologies"].length]);
        });
        context.pieChartData.addRows(pieChartContent);
        function selectHandler() {
          context.optionSelectionHandler("pieChart");
        }
        var options = {
          title:
            "Distribución de tecnologías registradas en SigeTEC según el tipo de invención",
          width: "auto",
          height: 400,
          pieHole: 0.4,
        };
        context.pieChart = new google.visualization.PieChart(
          document.getElementById("pie_chart_div")
        );
        google.visualization.events.addListener(
          context.pieChart,
          "select",
          selectHandler
        );
        context.pieChart.draw(context.pieChartData, options);
        context.isDataLoading = false;
        $scope.$digest();
      }
    };

    context.buildGeoChart = function () {
      google.charts.load("current", {
        packages: ["geochart"],
        mapsApiKey: "AIzaSyDBqV9gYFgPwfPw26SJcZupShOtxRHtQd4",
      });
      google.charts.setOnLoadCallback(drawRegionsMap);
      function drawRegionsMap() {
        var geoChartContent = [["País", "Tecnologías patentadas"]];
        var countriesKeys = Object.keys(context.patentedTechnologiesByCountry);
        for (let index = 0; index < countriesKeys.length; index++) {
          geoChartContent.push([
            countriesKeys[index],
            context.patentedTechnologiesByCountry[countriesKeys[index]].length,
          ]);
        }
        context.geoChartData = google.visualization.arrayToDataTable(
          geoChartContent
        );
        var options = {
          title:
            "Distribución de tecnologías registradas en SigeTEC según el tipo de invención",
          width: "auto",
          height: "auto",
          colors: ["#c00"],
          enableRegionInteractivity: true,
        };
        function regionSelectHandler() {
          context.optionSelectionHandler("geoChart");
        }
        context.geoChart = new google.visualization.GeoChart(
          document.getElementById("regions_chart_div")
        );
        google.visualization.events.addListener(
          context.geoChart,
          "select",
          regionSelectHandler
        );
        context.geoChart.draw(context.geoChartData, options);
      }
    };

    context.optionSelectionHandler = function (chartType) {
      switch (chartType) {
        case "pieChart":
          $scope.selectedDataset = null;
          $scope.$apply();
          var selectedItem = context.pieChart.getSelection()[0];
          if (selectedItem) {
            var topping = context.pieChartData.getValue(selectedItem.row, 0);
            context.selectedTechnologyType = topping;
            angular.forEach(context.technologiesByType, function (
              technologyType
            ) {
              if (technologyType.name === context.selectedTechnologyType) {
                $scope.selectedDataset = technologyType.technologies;
              }
            });
            $scope.$apply();
            context.scrollToTop("technologies_by_type_table");
          } else {
            context.selectedTechnologyType = null;
            $scope.$apply();
          }
          break;
        case "geoChart":
          $scope.seletcedCountriesDataset = null;
          $scope.$apply();
          var selectedItem = context.geoChart.getSelection()[0];
          if (selectedItem) {
            var topping = context.geoChartData.getValue(selectedItem.row, 0);
            context.selectedPatentRegion = topping;
            $scope.seletcedCountriesDataset =
              context.patentedTechnologiesByCountry[
                context.selectedPatentRegion
              ];
            $scope.$apply();
            context.scrollToTop("technologies_by_granted_patent_country");
          } else {
            context.selectedPatentRegion = null;
            $scope.$apply();
          }
          console.log(348, $scope.seletcedCountriesDataset);
          break;
        default:
          break;
      }
    };

    context.login = function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/plus.login");
      provider.setCustomParameters({
        login_hint: "user@example.com",
      });
      $rootScope.auth
        .$signInWithPopup(provider)
        .then(function (result) {
          console.log("Signed in as:", result);
          $rootScope.userName = result.user.displayName;
          $rootScope.isLoggedin = true;
          $rootScope.userEmail = result.user.email;
          $rootScope.userPhoto = result.user.photoURL
            ? result.user.photoURL
            : "img/icons/login.svg";
          var body = document.querySelector("body");
          var sidebarOverlay = document.querySelector(".side-menu-overlay");
          var sidebar = document.querySelector("#side-menu");
          angular.element(body).removeClass("side-menu-visible");
          angular.element(sidebarOverlay).css("display", "none");
          angular.element(body).removeClass("overflow-hidden ");
          angular.element(sidebar).css("display", "none");
          $location.path("/dashboard");
        })
        .catch(function (error) {
          console.error("Authentication failed:", error);
        });
    };

    context.isInArray = function (array, value) {
      for (var i = 0; i < array.length; i++) {
        if (array[i].name == value) {
          return i;
        }
      }
      return -1;
    };

    context.showTechnologiesList = function (sector) {
      context.sector = sector;
      $mdDialog
        .show({
          controller: DialogController,
          templateUrl: "partials/technologies-list.html",
          parent: angular.element(document.body),
          clickOutsideToClose: true,
          fullscreen: $scope.customFullscreen, // Only for -xs, -sm breakpoints.
        })
        .then(
          function (answer) {
            $scope.status = 'You said the information was "' + answer + '".';
          },
          function () {
            $scope.status = "You cancelled the dialog.";
          }
        );
    };

    function DialogController($scope, $mdDialog) {
      $scope.sector = context.sector;
      $scope.technologies = [];
      angular.forEach(context.technologiesArray, function (technology) {
        if (
          technology.technologic_sector != undefined &&
          technology.technologic_sector === context.sector
        ) {
          $scope.technologies.push(technology);
        }
      });

      $scope.hide = function () {
        $mdDialog.hide();
      };

      $scope.cancel = function () {
        $mdDialog.cancel();
      };

      $scope.onClickTechnology = function (technology) {
        $mdDialog.hide();
        $location.path(
          "detail/form-technologies/technologies/" + technology.$id
        );
      };
    }

    context.showDetail = function (technology) {
      $location.path("detail/form-technologies/technologies/" + technology.$id);
    };

    context.visualizeChange = function (option) {
      context.visualizeAs = option;
    };

    context.showTechnologyDetails = function (technologyDetailsId) {
      context.selectedTechnologyDetailsId = technologyDetailsId;
      $mdDialog
        .show({
          controller: context.showDetailsDialogController,
          templateUrl: "partials/technology-details.html",
          parent: angular.element(document.body),
          clickOutsideToClose: true,
          fullscreen: true, // Only for -xs, -sm breakpoints.
        })
        .then(
          function (answer) {
            // console.log(answer);
            // $scope.status = 'You said the information was "' + answer + '".';
          },
          function () {
            // console.log('You cancelled the dialog');
            // $scope.status = 'You cancelled the dialog.';
          }
        );
    };

    context.showDetailsDialogController = function ($scope, $mdDialog) {
      $scope.selectedTechnology =
        context.allTechnologiesObj[context.selectedTechnologyDetailsId];
      $scope.hide = function () {
        $mdDialog.hide();
      };
      $scope.cancel = function () {
        $mdDialog.cancel();
      };
    };

    context.getTechnologyTypes = function () {
      return new Promise((resolve, reject) => {
        var technologyTypeReference = firebase
          .database()
          .ref()
          .child("references/definition/technology-type");
        var references = $firebaseObject(technologyTypeReference);
        references
          .$loaded()
          .then(function () {
            context.availableTechnologyTypes = references;
            console.log(498, context.availableTechnologyTypes);
            angular.forEach(context.availableTechnologyTypes, function (
              value,
              key
            ) {
              angular.forEach(value.data, function (dataObj, data_key) {
                context.technologiesByType[dataObj["key"]] = {};
                context.technologiesByType[dataObj["key"]]["name"] =
                  dataObj["value"];
                context.technologiesByType[dataObj["key"]]["technologies"] = [];
              });
            });
            console.log(513, context.technologiesByType);
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    };

    context.getCountries = function () {
      return new Promise((resolve, reject) => {
        var countriesReference = firebase
          .database()
          .ref()
          .child("references/definition/countries");
        var references = $firebaseObject(countriesReference);
        references
          .$loaded()
          .then(function () {
            angular.forEach(references, function (value, key) {
              context.availableCountries[value["key"]] = value["value"];
            });
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    };

    context.scrollToTop = function (elementId) {
      $("html, body").animate(
        { scrollTop: $("#" + elementId).offset().top - 120 },
        800
      );
    };
  },
]);
