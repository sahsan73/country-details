"use strict";

const getDetailsContainer = document.querySelector(".get-details");
const btnCountryDetails = document.querySelector(".btn-country-details");
const btnWhere = document.querySelector(".btn-where");
const countryName = document.getElementById("country-name");
const errorMessageContainer = document.querySelector(".err-msg-container");
const errorMessage = document.querySelector(".err-msg");
const contriesContainer = document.querySelector(".countries");
const whereMessageContainer = document.querySelector(".where-msg-container");
const whereMessage = document.querySelector(".where-msg");

// if there are multiple countries with a single name
// check for the original one
const getOriginalCountryData = function (data, country) {
  if (data.length > 1) {
    for (const dataCountry of data) {
      const differentNames = [...dataCountry.altSpellings];
      differentNames.push(dataCountry.name.common);
      differentNames.push(dataCountry.cca2);
      differentNames.push(dataCountry.cca3);

      const differentNamesLowerCase = differentNames.map((str) =>
        str.toLowerCase()
      );
      if (differentNamesLowerCase.includes(country)) {
        data = dataCountry;
        break;
      }
    }
  } else {
    data = data[0];
  }
  return data;
};

// display Retry message
const retryMsg = function (msg) {
  errorMessage.textContent = msg;
  errorMessage.style.backgroundColor = "#B0D9B1";
  errorMessage.style.color = "#000";
  errorMessageContainer.style.opacity = 1;
};

const renderCountry = function (data, label = "") {
  const country = data.name.common;
  const region = data.region;
  const population = (data.population / 1_000_000).toFixed(1);
  const currencyName = Object.values(data.currencies)[0].name;
  const currencySymbol = Object.values(data.currencies)[0].symbol;
  const lang = Object.values(data.languages)[0];

  const html = `
    <article class="country ${label}">
      <img class="country__img" src="${data.flags.svg}" alt="${data.flags.alt}" />
      <div class="country__data">
        <h3 class="country__name">${country}</h3>
        <h4 class="country__region">${region}</h4>
        <p class="country__row"><span>👫</span>${population}M</p>
        <p class="country__row"><span>🗣️</span>${lang}</p>
        <p class="country__row"><span>💰</span>${currencyName} (${currencySymbol})</p>
      </div>
    </article>
  `;

  contriesContainer.insertAdjacentHTML("beforeend", html);
};

const renderNeighborCountries = async function (neighbors) {
  try {
    const response = await Promise.all(
      neighbors.map((nei) =>
        fetch(`https://restcountries.com/v3.1/alpha/${nei}`)
      )
    );
    // const data = response.map(async res => await res.json());
    // console.log(response);

    for (const res of response) {
      if (!res.ok) continue;

      // console.log(res);

      const data = await res.json();
      // data = getOriginalCountryData(data);
      renderCountry(data[0], "neighbour");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

//////////////////////////////////////////////////////////////
// GET COUNTRY DETAILS
btnCountryDetails.addEventListener("click", function (e) {
  e.preventDefault();

  const country = countryName.value.trim().toLowerCase();
  // console.log(country);
  if (country.length == 0) {
    errorMessageContainer.style.opacity = 1;
    setTimeout(function () {
      errorMessageContainer.style.opacity = 0;
    }, 1000);
  } else {
    getDetailsContainer.classList.add("hidden");

    // https://restcountries.com/v2/name/
    fetch(`https://restcountries.com/v3.1/name/${country}`)
      .then((response) => {
        // console.log(response);
        if (!response.ok) {
          throw new Error(`Sorry, country "${country}" not found...!`);
        }

        return response.json();
      })
      .then((data) => {
        data = getOriginalCountryData(data, country);
        // console.log(data);
        renderCountry(data);

        if (data?.borders) {
          renderNeighborCountries(data.borders);
        }
      })
      .catch((err) => {
        // console.error(err);
        whereMessage.textContent = err.message;
        whereMessageContainer.classList.remove("hidden");
      })
      .finally(() =>
        retryMsg(`Refresh the page to check for another country...!`)
      );
  }
});

/////////////////////////////////////////////////////////////
// WHERE AM I FEATURE
const getPosition = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

const renderMap = function (coords) {
  console.log(coords);
  const map = L.map("map").setView(coords, 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  L.marker(coords).addTo(map).bindPopup("You're here!").openPopup();

  // remove the "Loading map..." text from web page
  document.querySelector("#map p").style.opacity = 0;
};

btnWhere.addEventListener("click", function () {
  getPosition()
    .then((geoPos) => {
      // console.log(geoPos);
      const { latitude: lat, longitude: lng } = geoPos.coords;
      // console.log(lat, lng);

      return fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
      );
    })
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      getDetailsContainer.classList.add("hidden");
      whereMessage.textContent = `You are in ${data.city}, ${data.principalSubdivision}, ${data.countryName}.`;
      whereMessageContainer.classList.remove("hidden");

      // render map
      renderMap([data.latitude, data.longitude]);
    })
    .catch((_) => {
      getDetailsContainer.classList.add("hidden");
      whereMessageContainer.classList.remove("hidden");
    })
    .finally(() => retryMsg(`Refresh the page to try again...!`));
});
