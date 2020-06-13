'use strict';

var homeController = angular.module('HomeController', ['ngMaterial', 'firebase', 'nvd3', 'datatables']);

homeController.controller('HomeController', [
  '$scope',
  '$rootScope',
  '$location',
  '$firebase',
  '$firebaseObject',
  '$mdDialog',
  '$mdToast',
  '$window',
  '$http',
  'DTColumnDefBuilder',
  'DTOptionsBuilder',
  '__apiRoutes',
  function ($scope, $rootScope, $location, $firebase, $firebaseObject, $mdDialog, $mdToast, $window, $http, DTColumnBuilder, DTOptionsBuilder) {
    var context = this;
    context.visualizeAs = 'graph';
    context.detail = {};
    context.showLegend = false;
    context.technologiesArray = [];
    context.selectedTechnologyPosition = null;

    context.isPieChartLoading = true;
    context.availableTechnologyTypes = null;
    context.technologiesByType = {};
    context.pieChart = null;
    context.pieChartData = null;

    var color = d3.scale.category20();
    var nodes = [];
    var links = [];
    var sector = [];
    var faculty = [];
    $scope.options = {
      chart: {
        type: 'forceDirectedGraph',
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
              .append('text')
              .attr('dx', -7)
              .attr('dy', '.35em')
              .text(function (d) {
                return '· · · ' + d.name;
              })
              .on('click', function (d) {
                context.detail = d;
                context.showLegend = true;
                $scope.$digest();
              })
              .style('font-size', '10px');
        },
      },
    };

    var request = $http({ method: 'GET', url: __apiRoutes.points.getTechnologies });
    request.then(function (response) {
      context
        .getTechnologyTypes()
        .then(() => {
          angular.forEach(response.data, function (technology, key) {
            context.technologiesArray.push(technology);
            var techIndex = context.isInArray(nodes, technology['technology-type']);
            if (techIndex < 0) {
              techIndex = nodes.length;
              nodes.push({ name: technology['technology-type'], group: 1 });
            }
            var facultyIndex = context.isInArray(nodes, technology.program);
            if (facultyIndex < 0) {
              facultyIndex = nodes.length;
              nodes.push({ name: technology.program, group: 3 });
            }
            var technologyIndex = nodes.length;
            if (technology['granted-date'] == undefined) {
              nodes.push({ name: technology.name, group: 6, $id: technology.$id, description: technology.description });
            } else {
              nodes.push({ name: technology.name, group: 5, $id: technology.$id, description: technology.description });
            }
            links.push({ source: techIndex, target: technologyIndex, value: 1 });
            links.push({ source: facultyIndex, target: technologyIndex, value: 1 });
            technology.key = key;
            context.technologiesByType[technology['technology-type']]['technologies'].push(technology);
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

    $scope.nutritionList = [
      {
        id: 601,
        name: 'Frozen joghurt',
        calories: 159,
        fat: 6.0,
        carbs: 24,
        protein: 4.0,
        sodium: 87,
        calcium: '14%',
        iron: '1%',
      },
      {
        id: 602,
        name: 'Ice cream sandwitch',
        calories: 237,
        fat: 9.0,
        carbs: 37,
        protein: 4.3,
        sodium: 129,
        calcium: '84%',
        iron: '1%',
      },
      {
        id: 603,
        name: 'Eclair',
        calories: 262,
        fat: 16.0,
        carbs: 24,
        protein: 6.0,
        sodium: 337,
        calcium: '6%',
        iron: '7%',
      },
      {
        id: 604,
        name: 'Cupkake',
        calories: 305,
        fat: 3.7,
        carbs: 67,
        protein: 4.3,
        sodium: 413,
        calcium: '3%',
        iron: '8%',
      },
      {
        id: 605,
        name: 'Gingerbread',
        calories: 356,
        fat: 16.0,
        carbs: 49,
        protein: 2.9,
        sodium: 327,
        calcium: '7%',
        iron: '16%',
      },
      {
        id: 606,
        name: 'Jelly bean',
        calories: 375,
        fat: 0.0,
        carbs: 94,
        protein: 0.0,
        sodium: 50,
        calcium: '0%',
        iron: '0%',
      },
      {
        id: 607,
        name: 'Lollipop',
        calories: 392,
        fat: 0.2,
        carbs: 98,
        protein: 0,
        sodium: 38,
        calcium: '0%',
        iron: '2%',
      },
      {
        id: 608,
        name: 'Honeycomb',
        calories: 408,
        fat: 3.2,
        carbs: 87,
        protein: 6.5,
        sodium: 562,
        calcium: '0%',
        iron: '45%',
      },
      {
        id: 609,
        name: 'Donut',
        calories: 452,
        fat: 25.0,
        carbs: 51,
        protein: 4.9,
        sodium: 326,
        calcium: '2%',
        iron: '22%',
      },
      {
        id: 610,
        name: 'KitKat',
        calories: 518,
        fat: 26.0,
        carbs: 65,
        protein: 7,
        sodium: 54,
        calcium: '12%',
        iron: '6%',
      },
    ];

    context.buildPieChart = function () {
      // Load the Visualization API and the corechart package.
      google.charts.load('current', { packages: ['corechart'] });
      // Set a callback to run when the Google Visualization API is loaded.
      google.charts.setOnLoadCallback(drawChart);
      // Callback that creates and populates a data table,
      // instantiates the pie chart, passes in the data and
      // draws it.
      function drawChart() {
        // Create the data table.
        context.pieChartData = new google.visualization.DataTable();
        context.pieChartData.addColumn('string', 'Tipo de invenisión');
        context.pieChartData.addColumn('number', 'Tecnologías registradas');
        var pieChartContent = [];
        angular.forEach(context.technologiesByType, function (value, key) {
          pieChartContent.push([value['name'], value['technologies'].length]);
        });
        context.pieChartData.addRows(pieChartContent);
        function selectHandler() {
          var selectedItem = context.pieChart.getSelection()[0];
          if (selectedItem) {
            var topping = context.pieChartData.getValue(selectedItem.row, 0);
            alert('The user selected ' + topping);
          }
        }
        function hoverHandler() {
          console.log('hola mundo');
        }
        // Set chart options
        var options = { title: 'Distribución de tecnologías registradas en SigeTEC según el tipo de invención', width: 'auto', height: 400, pieHole: 0.4 };
        // Instantiate and draw our chart, passing in some options.
        context.pieChart = new google.visualization.PieChart(document.getElementById('chart_div'));
        google.visualization.events.addListener(context.pieChart, 'select', selectHandler);
        google.visualization.events.addListener(context.pieChart, 'onmouseover', hoverHandler);
        context.pieChart.draw(context.pieChartData, options);
        context.isPieChartLoading = false;
        $scope.$digest();
      }
    };

    context.buildGeoChart = function () {
      google.charts.load('current', {
        packages: ['geochart'],
        // Note: you will need to get a mapsApiKey for your project.
        // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
        mapsApiKey: 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY',
      });
      google.charts.setOnLoadCallback(drawRegionsMap);
      function drawRegionsMap() {
        var data = google.visualization.arrayToDataTable([
          ['Country', 'Popularity'],
          ['Germany', 200],
          ['United States', 300],
          ['Brazil', 400],
          ['Canada', 500],
          ['France', 600],
          ['RU', 700],
        ]);
        var options = {
          title: 'Distribución de tecnologías registradas en SigeTEC según el tipo de invención',
          width: 'auto',
          height: 'auto',
          colors: ['#c00'],
        };
        var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));
        chart.draw(data, options);
      }
    };

    context.clicked = function (rowId) {
      console.log('clicked', rowId);
    };

    context.login = function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/plus.login');
      provider.setCustomParameters({
        login_hint: 'user@example.com',
      });
      $rootScope.auth
        .$signInWithPopup(provider)
        .then(function (result) {
          console.log('Signed in as:', result);
          $rootScope.userName = result.user.displayName;
          $rootScope.isLoggedin = true;
          $rootScope.userEmail = result.user.email;
          $rootScope.userPhoto = result.user.photoURL ? result.user.photoURL : 'img/icons/login.svg';
          var body = document.querySelector('body');
          var sidebarOverlay = document.querySelector('.side-menu-overlay');
          var sidebar = document.querySelector('#side-menu');
          angular.element(body).removeClass('side-menu-visible');
          angular.element(sidebarOverlay).css('display', 'none');
          angular.element(body).removeClass('overflow-hidden ');
          angular.element(sidebar).css('display', 'none');
          $location.path('/dashboard');
        })
        .catch(function (error) {
          console.error('Authentication failed:', error);
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
          templateUrl: 'partials/technologies-list.html',
          parent: angular.element(document.body),
          clickOutsideToClose: true,
          fullscreen: $scope.customFullscreen, // Only for -xs, -sm breakpoints.
        })
        .then(
          function (answer) {
            $scope.status = 'You said the information was "' + answer + '".';
          },
          function () {
            $scope.status = 'You cancelled the dialog.';
          }
        );
    };

    function DialogController($scope, $mdDialog) {
      $scope.sector = context.sector;
      $scope.technologies = [];
      angular.forEach(context.technologiesArray, function (technology) {
        if (technology.technologic_sector != undefined && technology.technologic_sector === context.sector) {
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
        $location.path('detail/form-technologies/technologies/' + technology.$id);
      };
    }

    context.showDetail = function (technology) {
      $location.path('detail/form-technologies/technologies/' + technology.$id);
    };

    context.visualizeChange = function (option) {
      context.visualizeAs = option;
    };

    context.showDetails = function (technologyId) {
      context.selectedTechnologyPosition = technologyId;
      $mdDialog
        .show({
          controller: context.showDetailsDialogController,
          templateUrl: 'partials/technology-details.html',
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
      $scope.selectedTechnology = context.technologiesArray[context.selectedTechnologyPosition];
      $scope.hide = function () {
        $mdDialog.hide();
      };
      $scope.cancel = function () {
        $mdDialog.cancel();
      };
    };

    context.getTechnologyTypes = function () {
      return new Promise((resolve, reject) => {
        var technologyTypeReference = firebase.database().ref().child('references/definition/technology-type');
        var references = $firebaseObject(technologyTypeReference);
        references
          .$loaded()
          .then(function () {
            context.availableTechnologyTypes = references;
            angular.forEach(context.availableTechnologyTypes, function (value, key) {
              context.technologiesByType[value['key']] = {};
              context.technologiesByType[value['key']]['name'] = value['value'];
              context.technologiesByType[value['key']]['technologies'] = [];
            });
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    };
  },
]);
