import argparse
import os
from datetime import date, datetime, timedelta
from pprint import pprint

import dash_auth
import mpld3
import numpy as np
import pandas as pd
import plotly.express as px
import pytz
from dash import Dash, dcc, html
from plotnine import *
from pymongo import MongoClient

from log import get_logger

ACTIVITY_COOLOFF_MINS = 10
NUM_SESSIONS_THRESHOLD = 5
DEFAULT_WINDOW = 14
SESSION_COUNT_THRESHOLDS = [1, 3, 5]
CONNECTION_TEMPLATE = """mongodb://{user}:{password}@cluster0-shard-00-00.dbkij.mongodb.net:27017,cluster0-shard-00-01.dbkij.mongodb.net:27017,cluster0-shard-00-02.dbkij.mongodb.net:27017/myFirstDatabase?authSource=admin&replicaSet=atlas-xn7hxv-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true"""
logger = get_logger(__name__)

dash_user = os.getenv("DASH_USER")
dash_password = os.getenv("DASH_PASSWORD")
if not dash_user or not dash_password:
    logger.fatal("DASH_USER or DASH_PASSWORD not set!")
    exit(1)
VALID_USERNAME_PASSWORD_PAIRS = {dash_user: dash_password}

mongo_user = os.getenv("MONGO_USER")
mongo_password = os.getenv("MONGO_PASSWORD")
if not mongo_user or not mongo_password:
    logger.fatal("MONGO_USER or MONGO_PASSWORD not set!")
    exit(1)


def generate_user_daily_report(dt, window):
    client = MongoClient(
        CONNECTION_TEMPLATE.format(user=mongo_user, password=mongo_password),
        unicode_decode_error_handler='ignore',
    )

    main_db = client.main
    events_collection = main_db.log_events

    end = datetime.strptime(
        dt, "%Y-%m-%d").astimezone(pytz.timezone("US/Pacific"))
    _generate_user_daily_report(
        events_collection, end, window, ACTIVITY_COOLOFF_MINS, NUM_SESSIONS_THRESHOLD)


def _generate_user_daily_report(events_collection, end, window, activity_cooloff_mins, num_sessions_threshold):
    date_filter = {"created_at": {
        "$gt": end - timedelta(days=window), "$lt": end}}
    logger.info(date_filter)

    cursor = events_collection.find(date_filter)
    events_df = pd.DataFrame(list(cursor))
    events_df = events_df.rename(columns={"_id": "event_id"}, errors="raise")
    events_df["time_since_previous_event_this_day"] = (
        events_df
        .sort_values(by=["user_id", "created_at"])
        .groupby(by='user_id')["created_at"]
        .diff()
    )
    events_df["ts_pst"] = events_df.created_at.dt.tz_localize(
        pytz.utc).dt.tz_convert('US/Pacific')
    logger.info(events_df.head())

    # includes NaT, which indicates the first event of the day
    df_new_sessions = events_df[~(
        events_df.time_since_previous_event_this_day < timedelta(minutes=activity_cooloff_mins))]
    df_new_sessions["dt"] = df_new_sessions.ts_pst.dt.date  # date in PST

    df_events_per_user = (
        df_new_sessions
        .groupby(["user_id", "dt"])
        .agg(num_sessions=('event_id', 'count'))
    )

    users_with_enough_sessions = (
        df_events_per_user[df_events_per_user.num_sessions >
                           num_sessions_threshold]
        .reset_index()
    )

    daily_users = (
        users_with_enough_sessions
        .sort_values(by=["dt", "num_sessions"])
        .groupby("dt")
        .agg(num_users=('user_id', 'count'))
        .reset_index()
    )
    daily_users["dt"] = pd.to_datetime(daily_users.dt)

    global fig_daily_users
    fig_daily_users = px.bar(daily_users, x='dt', y='num_users')

    df_events_per_user = df_events_per_user.reset_index()

    for threshold in SESSION_COUNT_THRESHOLDS:
        df_events_per_user[f"gt_{threshold}"] = np.where(
            df_events_per_user['num_sessions'] >= threshold, True, False)
    timeseries = (
        df_events_per_user
        .sort_values(by=["dt", "num_sessions"])
        .groupby("dt")
        .agg({f"gt_{threshold}": "sum" for threshold in SESSION_COUNT_THRESHOLDS})
        .reset_index()
    )
    timeseries = timeseries.set_index(keys=["dt"])
    timeseries.columns.name = "threshold"
    global fig_timeseries
    fig_timeseries = px.line(timeseries)
    fig_timeseries.update_layout(
        title="Daily Users By Session Count",
        xaxis_title="Date",
        yaxis_title="Num Users",
        legend_title="Min Sessions per Day",
        font=dict(
            family="Courier New, monospace",
            size=18,
            color="RebeccaPurple"
        )
    )


app = Dash(__name__)
server = app.server

# TODO: figure out a way to pass these CLI args through gunicorn
generate_user_daily_report(datetime.today().strftime("%Y-%m-%d"), DEFAULT_WINDOW)

auth = dash_auth.BasicAuth(
    app,
    VALID_USERNAME_PASSWORD_PAIRS
)


app.layout = html.Div(children=[
    # All elements from the top of the page
    html.Div([
        html.H1(children='Hello Dash'),

        html.Div(children='''
            Number of users with at least 5 sessions per day. Sessions are defined by a new backend event after 10 minutes since the previous one.
        '''),

        dcc.Graph(
            id='graph1',
            figure=fig_daily_users
        ),

        html.Div(children='''
            Daily users by min session count
        '''),
        dcc.Graph(
            id='graph1.2',
            figure=fig_timeseries
        ),
    ]),
])


if __name__ == "__main__":
    logger.info("Running as __main__ app")
    app.run_server(debug=True, host="0.0.0.0", port=8050, use_reloader=False)
