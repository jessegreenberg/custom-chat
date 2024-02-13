/**
 * A class that gets query parameters from the URL and provides them as a map.
 *
 * TODO: Would love to use QueryStringMachine but it wasn't available from npm.
 */

// Get the URLSearchParams object by passing the URL string. Use get() or has() methods to retrieve the query parameters
const urlParams = new URLSearchParams( window.location.search );

const QueryParameters = {
  debug: urlParams.has( 'debug' )
};

export default QueryParameters;