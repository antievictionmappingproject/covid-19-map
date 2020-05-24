/**
 * parseUriHash
 * Check the url hash for params then override map default settings if any are present.
 * assumes params are as follows:
 * #lat=<float>&lng=<float>&z=<integer>&states=<boolean>&cities=<boolean>&counties=<boolean>&rentstrike=<boolean>
 * @param {*} mapConfig
 */
export function parseUriHash(mapConfig) {
  let input = window.location.hash.slice(1).split("&");
  let inputVals = {};
  let i = 0;

  for (i; i < input.length; i++) {
    let [key, value] = input[i].split("=");
    inputVals[key] = value;
  }

  if (!isNaN(inputVals.z)) {
    mapConfig.z = parseInt(inputVals.z);
  }

  if (!isNaN(inputVals.lat)) {
    mapConfig.lat = parseFloat(inputVals.lat);
  }

  if (!isNaN(inputVals.lng)) {
    mapConfig.lng = parseFloat(inputVals.lng);
  }

  if (inputVals.cities !== undefined) {
    if (inputVals.cities === "true") {
      mapConfig.cities = true;
    } else if (inputVals.cities === "false") {
      mapConfig.cities = false;
    }
  }

  if (inputVals.counties !== undefined) {
    if (inputVals.counties === "true") {
      mapConfig.counties = true;
    } else if (inputVals.counties === "false") {
      mapConfig.counties = false;
    }
  }

  if (inputVals.states !== undefined) {
    if (inputVals.states === "true") {
      mapConfig.states = true;
    } else if (inputVals.states === "false") {
      mapConfig.states = false;
    }
  }

  if (inputVals.nations !== undefined) {
    if (inputVals.nations === "true") {
      mapConfig.nations = true;
    } else if (inputVals.nations === "false") {
      mapConfig.nations = false;
    }
  }

  if (inputVals.rentstrike !== undefined) {
    if (inputVals.rentstrike === "true") {
      mapConfig.rentStrikes = true;
    } else if (inputVals.rentstrike === "false") {
      mapConfig.rentStrikes = false;
    }
  }
}
