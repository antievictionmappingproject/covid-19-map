import { getSearchData } from "utils/data";
import { dispatch } from "utils/dispatch";

export class SearchBar {
  searchBar = document.getElementById("search-bar");
  autoCompleteElement = document.getElementById("search-bar-autocomplete");
  autoCompleteResultBounds = new Map();

  constructor() {
    this.searchBar.addEventListener("input", () => {
      dispatch.call("search-bar-autocomplete", this, this.searchBar.value);
    });
    this.searchBar.addEventListener("blur", () => {
      dispatch.call("remove-autocompete-dropdown", this);
    });
    this.searchBar.addEventListener("focus", () => {
      this.searchBar.value = "";
    });
    this.searchBar.addEventListener("change", (e) => {
      if (
        [...document.getElementsByClassName("autocompleteElement")].indexOf(
          this.autocompleteElement(this.searchBar.value)
        ) < 0
      ) {
        let val = this.searchBar.value;
        let bounds = this.autoCompleteResultBounds.get(val);
        dispatch.call("choose-autocomplete-element", Window.lmap, bounds);
      }
    });
    dispatch.on("search-bar-autocomplete", this.autoComplete);
    dispatch.on("remove-autocompete-dropdown", this.removeAutocomplete);
    dispatch.on("search-fetch-data-reject", (err) => console.error(err));
    dispatch.on("search-bar-no-data", (searchBarText) =>
      this.noDataFound(searchBarText)
    );
  }

  noDataFound() {
    //todo: popup on screen somehow
    console.log("no data found");
  }

  removeAutocomplete() {
    setTimeout(() => {
      this.autoCompleteElement.innerHTML = "";
      this.searchBar.value =
        "\u{01f50d}  Enter Nation, state, province, city or zipcode";
    }, 400);
  }

  async autoComplete(str) {
    if (str.length > 1) {
      const res = await getSearchData(str);
      const features = res.features.filter(
        (feature) => feature.bbox !== undefined
      );
      this.autoCompleteElement.innerHTML = features
        .map((feature) => this.autocompleteElement(feature))
        .join("");
      this.autoCompleteResultBounds = features.reduce(
        (map, feature) => map.set(feature.place_name, feature),
        new Map()
      );
    }
  }
  autocompleteElement(feature) {
    return `
        <option value="${feature.place_name}" class = "autocompleteElement"}>
    `;
  }
}
