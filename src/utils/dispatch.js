// d3-dispatch is a lightweight pub/sub module
// for more see: https://github.com/d3/d3-dispatch

// using dispatch.on() or dispatch.call() with one of the
// following strings will respond or invoke an event
const events = [
  "viewport-size",
  "render-infowindow",
  "close-infowindow",
  "title-details-toggle",
  "title-details-close",
  "title-details-open",
];

export const dispatch = d3.dispatch(...events);
