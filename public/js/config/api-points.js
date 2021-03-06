/**
  * Created by: Julian Rodriguez
  * Created on: 27/07/2018
  * Description: Project Api points routes.
*/

(function (window) {
  window.__apiRoutes = window.__apiRoutes || {};

  // Default variables initialization
  const DEFAULT_CLOUD_FUNCTIONS_ROUTE = 'YOUR_GIVEN_CLOUD_FUNCTIONS_URL_HERE';

  // Api routes object. Add as much routes as as cloud functions you have with a request response.
  /* DO NOT TOUCH ANY LINE OF CODE FROM HERE */
  window.__apiRoutes.points = {
  	getTechnologies: DEFAULT_CLOUD_FUNCTIONS_ROUTE + '/getTechnologies'
  };

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__apiRoutes.enableDebug = false;
}(this));