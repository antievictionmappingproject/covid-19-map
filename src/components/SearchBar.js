import { getSearchData } from "utils/data";
import { dispatch } from "utils/dispatch";

export class SearchBar {
  searchBar = document.getElementById("search-bar");
  autoCompleteElement = document.getElementById("search-bar-autocomplete");

  constructor() {
    this.searchBar.addEventListener("input", (evt) => {
      dispatch.call("search-bar-autocomplete", this, this.searchBar.value);
    });
    dispatch.on("search-bar-autocomplete", this.autoComplete);
    dispatch.on("select-autocomplete-element", this.findLocation);
  }
  async autoComplete(str) {
    console.log("running autocomplete on string " + str);
    if (str.length > 3) {
      const res = await getSearchData(str);
      const features = res.features;
      this.autoCompleteElement.innerHTML = features
        .map((feature) => this.autocompleteElement(feature))
        .join("");
    }
  }
  async findLocation(id) {
    const res = await getSearchData(id);
  }

  autocompleteElement(feature) {
    return `
        <div class = "autocompleteElement">
            <a onclick="dispatch.call('select-autocomplete-element',this,${feature.id})">${feature.text}</a>
        </div>
    `;
  }
}
