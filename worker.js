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
  // define global variable called titles to make it accessible by Python
  self.pyodide.globals.set("titlesCSV", titles);
  // fetch main.py, save it in browser memory and import it
  await self.pyodide.runPythonAsync(`
    from pyodide.http import pyfetch
    response = await pyfetch("main.py")
    with open("main.py", "wb") as f:
        f.write(await response.bytes())
  `)
  pkg = pyodide.pyimport("main");
  let pythonResponse = pkg.analyze_titles(titles);
  pythonResponse = pythonResponse.toJs({
    dict_converter: Object.fromEntries,
  });
  console.log(pythonResponse);
  let titlesList = pythonResponse[0];
  let recommendedMovies = pythonResponse[1].movies
  let recommendedShows = pythonResponse[1].shows
  let factsMovies = pythonResponse[2].movies
  let factsShows = pythonResponse[2].shows


  self.postMessage({
    titles: titlesList,
    recommendedMovies: recommendedMovies,
    recommendedShows: recommendedShows,
    factsMovies: factsMovies,
    factsShows: factsShows,
  });
};
