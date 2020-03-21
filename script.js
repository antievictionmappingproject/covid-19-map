// This isn't necessary but it keeps the editor from thinking L is a typo
/* global L, Mustache */

console.clear();

/******************************************
 * DATA SOURCES
 *****************************************/

// the base URI for the CARTO SQL API
const apiBaseURI = "https://ampitup.carto.com:443/api/v2/sql";

// SQL query to pass to the CARTO API
const evictionMoratoriumsQuery =
  "SELECT " +
  "cartodb_id, " +
  "(CASE WHEN passed IS TRUE THEN 'Yes' ELSE 'No' END) AS passed, " +
  "municipality, lat, lon, link, policy_summary, " +
  "policy_type, start, _end, state, admin_scale " +
  "FROM " +
  "public.emergency_tenant_protections_carto_sync_do_not_edit;";

// complete URI to pass to fetch()
const evictionMoratoriumDataURI = `${apiBaseURI}?q=${evictionMoratoriumsQuery}`;

// states geojson url
const statesGeoJsonURI = "./states.geojson";

/******************************************
 * MAP SETUP & MAP CONTROLS
 *****************************************/

// options for configuring the Leaflet map
// don't add the default zoom ui and attribution as they're customized first then added layer
const mapOptions = { zoomControl: false, attributionControl: false };


// global styling variables
const strokeWeight = 1.5;
const pointRadius = 8;
const fillOpacity = 0.7;

// create a new map instance by referencing the appropriate html element by its "id" attribute
const map = L.map("map", mapOptions).setView([34.03, -82.2], 5);

const attribution = L.control
  .attribution({ prefix: "Data sources by: " })
  .addAttribution(
    "<a href='https://www.antievictionmap.com/' target='_blank'>Anti-Eviction Mapping Project</a>"
  )
  .addAttribution(
    "<a href='https://www.openstreetmap.org' target='_blank'>Open Street Map Contributors</a>"
  )
  .addTo(map);

const zoomControl = L.control.zoom({ position: "bottomright" }).addTo(map);

// Map layers control: add the layers later after their data has been fetched
const layersControl = L.control.layers(null, null, {position: 'topright', collapsed: false}).addTo(map);

// Get the popup template from the HTML.
// We can do this here because the template will never change.
const popupTemplate = document.querySelector(".popup-template").innerHTML;

// Add base layer
L.tileLayer(
  "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png",
  {
    maxZoom: 18
  }
).addTo(map);

/******************************************
 * FETCH DATA SOURCES
 *****************************************/

Promise.all(
  // map our data URIs to Fetch requests, then handle them once they've completed (or errored)
  [evictionMoratoriumDataURI, statesGeoJsonURI].map(uri =>
    fetch(uri).then(res => {
      if (!res.ok) {
        throw new Error("Network request error with data fetch");
      }
      return res.json();
    })
  )
)
  .then(handleData)
  .catch(error => console.log(error));

/******************************************
 * HANDLE DATA ASYNC RESPONSES
 *****************************************/

function handleData([cartoData, statesGeoJson]) {
  // seperate out the states data from the localities data
  const { rows } = cartoData;

  const statesData = rows
    .filter(row => row.admin_scale === "State")
    .reduce((acc, { state, ...rest }) => {
      return acc.set(state, rest);
    }, new Map());

  const localitiesData = rows.filter(
    row => row.admin_scale !== "State" && row.lat !== null && row.lon !== null
  );

  console.log(statesData, localitiesData);

  // convert the regular moratorium JSON into valid GeoJSON
  const localitiesGeoJson = {
    type: "FeatureCollection",
    features: localitiesData.map(({ cartodb_id, lat, lon, ...rest }) => ({
      type: "Feature",
      id: cartodb_id,
      properties: rest,
      geometry: {
        type: "Point",
        coordinates: [lon, lat]
      }
    }))
  };

  // join states moratorium data to states geojson
  statesGeoJson.features.forEach(feature => {
    const { properties } = feature;
    if (statesData.has(properties.name)) {
      feature.properties = {
        ...statesData.get(properties.name),
        ...properties
      };
    }
  });

  console.log(statesGeoJson);
  
  // add both the states layer and localities layer to the map 
  // and save the layer output
  const states = handleStatesLayer(statesGeoJson);
  const localities = handleLocalitiesLayer(localitiesGeoJson);

  // add layers to layers control
  layersControl
    .addOverlay(localities, "Cities/Counties")
    .addOverlay(states, "States");
}

/******************************************
 * HANDLE ADDING MAP LAYERS
 *****************************************/

function handleLocalitiesLayer(geojson) {
  
  // styling for the localities layer: style localities conditionally according to a presence of a moratorium
  const pointToLayer = 
    (feature, latlng) => {
      // style localities based on whether their moratorium has passed
      if (feature.properties.passed === 'Yes') {
        return  L.circleMarker(latlng, {
          color: "#4dac26",
          fillColor: "#b8e186",
          fillOpacity: fillOpacity,
          radius: pointRadius,
          weight: strokeWeight
        });
      }
      else {
        return  L.circleMarker(latlng, {
          color: "#d01c8b",
          fillColor: "#f1b6da",
          fillOpacity: fillOpacity,
          radius: pointRadius,
          weight: strokeWeight
        });
      }
  };
  
  // Create the Leaflet layer for the localities data
  const localitiesLayer = L.geoJson(geojson, {
      pointToLayer: pointToLayer
    }
  );

  // Add popups to the layer
  localitiesLayer.bindPopup(function(layer) {
    // This function is called whenever a feature on the layer is clicked
    console.log(layer.feature.properties);

    // Render the template with all of the properties. Mustache ignores properties
    // that aren't used in the template, so this is fine.
    return Mustache.render(popupTemplate, layer.feature.properties);
  });

  // Add data to the map
  localitiesLayer.addTo(map);

  // Move the map view so that the localitiesLayer is visible
  map.fitBounds(localitiesLayer.getBounds(), {
    paddingTopLeft: [12, 120],
    paddingBottomRight: [12, 12]
  });

  return localitiesLayer;
}

function handleStatesLayer(geojson) {
  // styling for the states layer: style states conditionally according to a presence of a moratorium
  const layerOptions = {
    style: feature => {
      // style states based on whether their moratorium has passed
      if (feature.properties.passed === 'Yes') {
        return {
          color: "#4dac26",
          fillColor: "#b8e186",
          fillOpacity: fillOpacity,
          weight: strokeWeight
        };
      } else if (feature.properties.passed === 'No') {
        return {
          color: "#d01c8b",
          fillColor: "#f1b6da",
          fillOpacity: fillOpacity,
          weight: strokeWeight
        };
      }
      else {
        return {
          stroke: false,
          fill: false
        }
      }
    }
  };

  // Create the Leaflet layer for the states data
  const statesLayer = L.geoJson(geojson, layerOptions);

  statesLayer.bindPopup(layer =>
    Mustache.render(popupTemplate, layer.feature.properties)
  );

  statesLayer.addTo(map);
  
  return statesLayer; 
}
