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
      if (this.autoCompleteResultBounds.size > 0) {
        dispatch.call(
          "choose-autocomplete-element",
          Window.lmap,
          this.autoCompleteResultBounds.entries().next().value[1]
        );
      } else {
        console.log("search results not found");
      }
      e.stopPropagation();
    });
    dispatch.on("search-bar-autocomplete", this.autoComplete);
    dispatch.on("remove-autocompete-dropdown", this.removeAutocomplete);
    dispatch.on("search-fetch-data-reject", (err) => console.error(err));
    dispatch.on("search-bar-no-data", (searchBarText) =>
      this.noDataFound(searchBarText)
    );
  }

  noDataFound() {
    document.getElementById("search-bar").classList.add("search-bar-no-data");
  }

  removeAutocomplete() {
    setTimeout(() => {
      this.autoCompleteElement.innerHTML = "";
      this.searchBar.value =
        "\u{01f50d}  Enter Nation, state, province, city or zipcode";
    }, 400);
  }

  async autoComplete(str) {
    const searchBarInput = document.getElementById("search-bar");
    if (searchBarInput.classList.contains("search-bar-no-data")) {
      searchBarInput.classList.remove("search-bar-no-data");
    }
    if (str.length > 1) {
      try {
        const res = await getSearchData(str.trim());
        if (res) {
          const features = res.resourceSets[0].resources.filter(
            (resource) => resource.bbox !== undefined
          );
          this.autoCompleteElement.innerHTML = features
            .map((resource) => this.autocompleteElement(resource))
            .join("");
          this.autoCompleteResultBounds = features.reduce(
            (map, resource) => map.set(resource.name, resource),
            new Map()
          );
        }
      } catch (e) {
        dispatch.call("search-fetch-data-reject", this, e);
      }
    }
  }
  autocompleteElement(feature) {
    return `
        <option value="${feature.name}" class = "autocompleteElement"}>
    `;
  }
}
