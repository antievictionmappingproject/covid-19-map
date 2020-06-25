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
    this.searchBar.addEventListener("focus", () => {
      this.searchBar.value = "";
    });
    this.searchBar.addEventListener("change", (e) => {});
    dispatch.on("search-bar-autocomplete", this.autoComplete);
    dispatch.on("remove-autocompete-dropdown", this.removeAutocomplete);
    dispatch.on("search-fetch-data-reject", (err) => console.error(err));
    dispatch.on("search-bar-no-data", (searchBarText) =>
      this.noDataFound(searchBarText)
    );
    document
      .getElementById("search-bar-form")
      .addEventListener("submit", (e) => {
        if (
          [...document.getElementsByClassName("autocompletElement")].length > 0
        ) {
          //todo: query the first item in the list
        } else {
          dispatch.call("search-bar-no-data");
        }
        e.stopPropagation();
        e.preventDefault();
      });
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
        if (res && res.resourceSets && res.resourceSets[0].resources) {
          const values = res.resourceSets[0].resources[0].value.filter(
            (value) => value.__type === "Place"
          );
          this.autoCompleteElement.innerHTML = values
            .map((value) =>
              this.autocompleteElement(value.address.formattedAddress)
            )
            .join("");
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
