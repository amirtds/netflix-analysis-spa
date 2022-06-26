import io

import pandas as pd


def analyze_titles(titlesCSV):
    # 1. create csv buffer to make it readable by pandas
    csv_buffer = io.StringIO(titlesCSV)
    # 2. load the csv file
    all_titles = pd.read_csv(csv_buffer)

    # 3. sanitize the data
    # drop unnecessary columns
    all_titles = all_titles.drop(
        columns=[
            "age_certification",
            "seasons",
            "imdb_id",
        ]
    )
    # drop rows with null values for important columns
    sanitized_titles = all_titles.dropna(
        subset=[
            "id",
            "title",
            "release_year",
            "genres",
            "production_countries",
            "imdb_score",
            "imdb_votes",
            "tmdb_score",
            "tmdb_popularity",
        ]
    )
    # Convert the DataFrame to a JSON object. ('orient="records"' returns a list of objects)
    titles_list = sanitized_titles.head(10).to_json(orient="records")

    # 4. Create recommendation list for Shows and Movies
    # 4.1 Copy the sanitized_titles to add new column to it
    recommended_titles = sanitized_titles.copy()

    # 4.2 Add new column to the sanitized_titles
    recommended_titles["recommendation_score"] = (
        sanitized_titles["imdb_votes"] * 0.3
        + sanitized_titles["imdb_score"] * 0.3
        + sanitized_titles["tmdb_score"] * 0.2
        + sanitized_titles["tmdb_popularity"] * 0.2
    )
    # 4.3 Create Recommended movies list
    recommended_movies = (
        recommended_titles.loc[recommended_titles["type"] == "MOVIE"]
        .sort_values(by="recommendation_score", ascending=False)
        .head(5)
        .to_json(orient="records")
    )
    # 4.4 Create Recommended shows list
    recommended_shows = (
        recommended_titles.loc[recommended_titles["type"] == "SHOW"]
        .sort_values(by="recommendation_score", ascending=False)
        .head(5)
        .to_json(orient="records")
    )
    recommendations = {"movies": recommended_movies, "shows": recommended_shows}

    # 5. Create facts list for Movies and Shows
    facts_movies = (
        sanitized_titles.loc[sanitized_titles["type"] == "MOVIE"]
        .groupby("release_year")
        .count()["id"]
        .sort_values(ascending=False)
        .head(1)
        .to_json(orient="table")
    )
    facts_shows = (
        sanitized_titles.loc[sanitized_titles["type"] == "SHOW"]
        .groupby("release_year")
        .count()["id"]
        .sort_values(ascending=False)
        .head(1)
        .to_json(orient="table")
    )
    facts = {"movies": facts_movies, "shows": facts_shows}

    return titles_list, recommendations, facts
