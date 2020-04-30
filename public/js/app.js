var apiRoutes = {};
// Import variables if present (from api-points.js)
if (window) {
  Object.assign(apiRoutes, window.__apiRoutes);
}
var sigetecApp = angular.module('SigetecApp', [
  'ngRoute',
  'MainController',
  'DashboardController',
  'HomeController',
  'RolesController',
  'ReferencesController',
  'TechnologyFormController',
  'FormatsController',
  'TechnologiesController',
  'AssignedTechnologiesController',
  'MyTechnologiesController',
  'ReportController',
  'firebase',
  'datatables',
  'ngMaterialCollapsible',
]);

// Register apiRoutes in AngularJS as constant
sigetecApp.constant('__apiRoutes', apiRoutes);
sigetecApp.run([
  '$rootScope',
  '$location',
  function ($rootScope, $location) {
    console.log('login ' + firebase.auth().currentUser);
    if ($rootScope.isLoggedin == undefined || !$rootScope.isLoggedin) {
      $location.path('/home');
    }
    $rootScope.$on('$routeChangeError', function (event, next, previous, error) {
      console.log('error auth');
      $location.path('/home');
    });
    $rootScope.$on('$routeChangeSuccess', function (event, next, previous, error) {
      var currentUser = firebase.auth().currentUser;
      console.log(currentUser);
      if (currentUser != null) {
        $rootScope.isLoggedin = true;
        $rootScope.userEmail = firebase.auth().currentUser.email;
        $rootScope.userName = firebase.auth().currentUser.displayName;
        if ($location.path() == '/home') {
          $location.path('/dashboard');
        }
      } else if ($rootScope.isLoggedin == undefined || !$rootScope.isLoggedin) {
        $rootScope.userName = 'Ingresar';
        $location.path('/home');
      }
    });
  },
]);

sigetecApp.config([
  '$routeProvider',
  function ($routeProvider) {
    $routeProvider
      .when('/home', {
        templateUrl: 'partials/home.html',
        // controller : 'HomeController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/dashboard', {
        templateUrl: 'partials/dashboard.html',
        // controller : 'DashboardController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/technology-form', {
        templateUrl: 'partials/technology-form.html',
        // controller : 'TechnologyFormController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/technology-form/:technologyId', {
        templateUrl: 'partials/technology-form.html',
        // controller : 'TechnologyFormController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/roles', {
        templateUrl: 'partials/roles.html',
        // controller : 'RolesController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/references', {
        templateUrl: 'partials/references.html',
        // controller : 'ReferencesController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/formats', {
        templateUrl: 'partials/formats.html',
        // controller : 'FormatsController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/technologies', {
        templateUrl: 'partials/technologies.html',
        // controller : 'TechnologiesController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/reports', {
        templateUrl: 'partials/report.html',
        // controller : 'ReportController',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/assigned-technologies', {
        templateUrl: 'partials/assigned-technologies.html',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .when('/my-technologies', {
        templateUrl: 'partials/my-technologies.html',
        resolve: {
          currentAuth: [
            'Auth',
            function (Auth) {
              return Auth.$waitForSignIn();
            },
          ],
        },
      })
      .otherwise({
        redirectTo: '/home',
      });
  },
]);

sigetecApp.factory('Auth', [
  '$firebaseAuth',
  function ($firebaseAuth) {
    return $firebaseAuth();
  },
]);
