import { getSearchData } from "utils/data";
import { dispatch } from "utils/dispatch";

export class SearchBar {
  searchBar = document.getElementById("search-bar");
  autoCompleteElement = document.getElementById("search-bar-autocomplete");

  constructor() {
    this.searchBar.addEventListener("input", () => {
      dispatch.call("search-bar-autocomplete", this, this.searchBar.value);
    });
    this.searchBar.addEventListener("blur", () => {
      dispatch.call("remove-autocompete-dropdown", this);
    });
    dispatch.on("search-bar-autocomplete", this.autoComplete);
    dispatch.on("remove-autocompete-dropdown", this.removeAutocomplete);
  }

  removeAutocomplete() {
    setTimeout(() => {
      this.autoCompleteElement.innerHTML = "";
      this.searchBar.value = "";
    }, 400);
  }

  async autoComplete(str) {
    console.log("running autocomplete on string " + str);
    if (str.length > 3) {
      const res = await getSearchData(str);
      const features = res.features;
      this.autoCompleteElement.innerHTML = features
        .map((feature) => this.autocompleteElement(feature))
        .join("");
      features.forEach((feature) => {
        document
          .getElementById(feature.id)
          .addEventListener("click", () =>
            dispatch.call(
              "choose-autocomplete-element",
              Window.lmap,
              feature.bbox
            )
          );
      });
    }
  }

  autocompleteElement(feature) {
    return `
        <div class = "autocompleteElement">
            <a id = "${feature.id}">${feature.text}</a>
        </div>
    `;
  }
}
