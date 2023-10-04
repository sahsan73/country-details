"use strict";

const getDetailsContainer = document.querySelector(".get-details");
const btnCountryDetails = document.querySelector(".btn-country-details");
const btnWhere = document.querySelector(".btn-where");

btnCountryDetails.addEventListener("click", function () {
  getDetailsContainer.classList.add("hidden");
});
