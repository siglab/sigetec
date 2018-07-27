/**
  * Created by: Julian Rodriguez
  * Created on: 27/07/2018
  * Description: Project Api points routes.
*/

(function (window) {
  window.__apiRoutes = window.__apiRoutes || {};

  // Default variables initialization
  const DEFAULT_CLOUD_FUNCTIONS_ROUTE = 'https://us-central1-nuevosigetec.cloudfunctions.net';

  // Api routes object. Add as much routes as as cloud functions you have with a request response.
  window.__apiRoutes.points = {
  	getTechnologies: DEFAULT_CLOUD_FUNCTIONS_ROUTE + '/getTechnologies'
  };

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__apiRoutes.enableDebug = false;
}(this));