// load pyodide.js
importScripts("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");

// Initialize pyodide and load Pandas
async function initialize() {
  self.pyodide = await loadPyodide();
  await self.pyodide.loadPackage("pandas");
}

let initialized = initialize();

self.onmessage = async function (e) {
  await initialized;
  response = await fetch(
    "https://raw.githubusercontent.com/amirtds/kaggle-netflix-tv-shows-and-movies/main/titles.csv"
  );
  response.ok && response.status === 200
    ? (titles = await response.text())
    : (titles = "");

  // fetch main.py, save it in browser memory
  await self.pyodide.runPythonAsync(`
    from pyodide.http import pyfetch
    response = await pyfetch("main.py")
    with open("main.py", "wb") as f:
        f.write(await response.bytes())
  `)

  // Importing fetched py module
  pkg = pyodide.pyimport("main");

  // Run the analyze_titles function from main.py and assign the result to a variable

  let analyzedTitles = pkg.analyze_titles(titles);
  // convert the Proxy object to Javascript object

  analyzedTitles = analyzedTitles.toJs({
    dict_converter: Object.fromEntries,
  });

  // Set variables to corresponding values from the analyzedTitles object
  let titlesList = analyzedTitles[0];
  let recommendedMovies = analyzedTitles[1].movies
  let recommendedShows = analyzedTitles[1].shows
  let factsMovies = analyzedTitles[2].movies
  let factsShows = analyzedTitles[2].shows

  self.postMessage({
    titles: titlesList,
    recommendedMovies: recommendedMovies,
    recommendedShows: recommendedShows,
    factsMovies: factsMovies,
    factsShows: factsShows,
  });
};
