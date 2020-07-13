import { getSearchData } from "utils/data";
import { dispatch } from "utils/dispatch";
import i18next from "i18next";

export class SearchBar {
  searchBar = document.getElementById("search-bar");
  autoCompleteElement = document.getElementById("search-bar-autocomplete");
  icon = this.searchBar.value;
  defaultValue = this.icon + i18next.t("searchbar.default-value");

  constructor() {
    this.searchBar.value = this.defaultValue;
    this.searchBar.addEventListener("input", () =>
      this.autoComplete(this.searchBar.value)
    );
    this.searchBar.addEventListener("blur", this.removeAutocomplete);
    this.searchBar.addEventListener("focus", () => {
      this.searchBar.value = "";
    });
    this.searchBar.addEventListener("change", (e) => {
      if (
        [...document.getElementsByClassName("autocompleteElement")]
          .map((a) => a.value)
          .indexOf(this.searchBar.value) >= 0
      ) {
        let val = this.searchBar.value;

        dispatch.call("choose-autocomplete-element", null, val);
      }
      e.stopPropagation();
    });
    dispatch.on("search-fetch-data-reject", (err) => console.error(err));

    document
      .getElementById("search-bar-form")
      .addEventListener("submit", (e) => {
        let autoselectSuggestions = [
          ...document.getElementsByClassName("autocompleteElement"),
        ].map((a) => a.value);
        if (autoselectSuggestions.length > 0) {
          dispatch.call(
            "choose-autocomplete-element",

            null,
            autoselectSuggestions[0]
          );
        } else {
          this.noDataFound();
        }
        e.stopPropagation();
        e.preventDefault();
      });
  }

  noDataFound() {
    document.getElementById("search-bar").classList.add("search-bar-no-data");
  }

  removeAutocomplete = () => {
    setTimeout(() => {
      this.autoCompleteElement.innerHTML = "";
      this.searchBar.value = this.defaultValue;
      this.removeNoData();
    }, 400);
  };

  async autoComplete(str) {
    this.removeNoData();
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

  removeNoData = () => {
    if (this.searchBar.classList.contains("search-bar-no-data")) {
      this.searchBar.classList.remove("search-bar-no-data");
    }
  };

  autocompleteElement(location) {
    return `
        <option value="${location}" class = "autocompleteElement">
    `;
  }
}
