import { dispatch as d3Dispatch } from "d3-dispatch";
// d3-dispatch is a lightweight pub/sub module
// for more see: https://github.com/d3/d3-dispatch

// using dispatch.on() or dispatch.call() with one of the
// following strings will respond or invoke an event
const events = [
  "fetch-map-data-resolve",
  "fetch-map-data-reject",
  "viewport-size",
  "render-infowindow",
  "close-infowindow",
  "title-details-toggle",
  "title-details-close",
  "title-details-open",
  "show-modal",
  "hide-modal",
  "show-loading-indicator",
  "hide-loading-indicator",
  "choose-autocomplete-element",
  "remove-autocompete-dropdown",
  "search-fetch-data-reject",
  "search-bar-no-data",
];

/**
 * dispatch usage:
 * dispatch.call("<event-name>", <optional this context>, <optional value>);
 * dispatch.on("<event-name>", <callback function>)
 * dispatch.on("<event-name.sub-name>", <second callback function>)
 * dispatch.on("<event-name.sub-other-name>", <third callback function>)
 * etc...
 */
export const dispatch = d3Dispatch(...events);
