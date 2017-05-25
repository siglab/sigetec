var sigetecApp = angular.module('SigetecApp', ['ngRoute',
                                               'MainController',
                                               'DashboardController',
                                               'HomeController',
                                               'RolesController',
                                               'ReferencesController',
                                               'TechnologyFormController',
                                               'firebase']);

sigetecApp.run(["$rootScope", "$location", function($rootScope, $location) {
    if (!$rootScope.isLoggedin) {
        $location.path("/home");
    }
    $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
        // We can catch the error thrown when the $requireSignIn promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
            $location.path("/home");
        }
    });
}]);

sigetecApp.config(['$routeProvider',
    function($routeProvider){
       $routeProvider.when('/home', {
           templateUrl: 'partials/home.html',
           controller : 'HomeController',
           resolve: { "currentAuth": ["Auth", function(Auth){ return Auth.$waitForSignIn(); }]}
       }).when('/dashboard', {
           templateUrl: 'partials/dashboard.html',
           controller : 'DashboardController',
           resolve: { "currentAuth": ["Auth", function(Auth){ return Auth.$waitForSignIn(); }]}
       }).when('/technology-form', {
           templateUrl: 'partials/technology-form.html',
           controller : 'TechnologyFormController',
           resolve: { "currentAuth": ["Auth", function(Auth){  return Auth.$waitForSignIn(); }]}
       }).when('/technology-form/:technologyId', {
           templateUrl: 'partials/technology-form.html',
           controller : 'TechnologyFormController',
           resolve: { "currentAuth": ["Auth", function(Auth){  return Auth.$waitForSignIn(); }]}
       }).when('/roles', {
           templateUrl: 'partials/roles.html',
           controller : 'RolesController',
           resolve: { "currentAuth": ["Auth", function(Auth){  return Auth.$waitForSignIn(); }]}
        }).when('/references', {
           templateUrl: 'partials/references.html',
           controller : 'ReferencesController',
           resolve: { "currentAuth": ["Auth", function(Auth){  return Auth.$waitForSignIn(); }]}
       }).otherwise({
           redirectTo : '/home' 
       });
    }
]);

sigetecApp.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
]);