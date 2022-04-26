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

DEFAULT_WINDOW = 14
SESSION_COUNT_THRESHOLDS = [1, 3, 5]
CONNECTION_TEMPLATE = """mongodb://{user}:{password}@cluster0-shard-00-00.dbkij.mongodb.net:27017,cluster0-shard-00-01.dbkij.mongodb.net:27017,cluster0-shard-00-02.dbkij.mongodb.net:27017/myFirstDatabase?authSource=admin&replicaSet=atlas-xn7hxv-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true"""
logger = get_logger(__name__)



def main(dt, window):
    user = os.environ["MONGO_USER"]
    password = os.environ["MONGO_PASSWORD"]

    client = MongoClient(
        CONNECTION_TEMPLATE.format(user=user, password=password),
        unicode_decode_error_handler='ignore',
    )


    main_db = client.main
    events_collection = main_db.log_events

    end = datetime.strptime(dt, "%Y-%m-%d").astimezone(pytz.timezone("US/Pacific"))
    activity_cooloff_mins = 10
    num_sessions_threshold = 5
    generate_user_daily_report(events_collection, end, window, activity_cooloff_mins, num_sessions_threshold)

def generate_user_daily_report(events_collection, end, window, activity_cooloff_mins, num_sessions_threshold):
    date_filter = {"created_at": {"$gt": end - timedelta(days=window), "$lt": end}}
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
    events_df["ts_pst"] = events_df.created_at.dt.tz_localize(pytz.utc).dt.tz_convert('US/Pacific')
    logger.info(events_df)


    # includes NaT, which indicates the first event of the day
    df_new_sessions = events_df[~(events_df.time_since_previous_event_this_day < timedelta(minutes=activity_cooloff_mins))]
    df_new_sessions["dt"] = df_new_sessions.ts_pst.dt.date  # date in PST

    df_events_per_user = (
        df_new_sessions
        .groupby(["user_id", "dt"])
        .agg(num_sessions=('event_id', 'count'))
    )

    users_with_enough_sessions = (
        df_events_per_user[df_events_per_user.num_sessions > num_sessions_threshold]
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
    daily_users.head()


    df_events_per_user = df_events_per_user.reset_index()

    for threshold in SESSION_COUNT_THRESHOLDS:
        df_events_per_user[f"gt_{threshold}"] = np.where(df_events_per_user['num_sessions'] >= threshold, True, False)
    timeseries = (
        df_events_per_user
        .sort_values(by=["dt", "num_sessions"])
        .groupby("dt")
        .agg({f"gt_{threshold}": "sum" for threshold in SESSION_COUNT_THRESHOLDS})
        .reset_index()
    )
    timeseries = timeseries.set_index(keys=["dt"])
    timeseries.columns.name = "threshold"
    fig_timeseries = px.line(timeseries)





    p = (
        ggplot(daily_users, aes('dt', 'num_users'))
        + geom_col()
    )

    fig = px.bar(daily_users, x='dt', y='num_users')
    # fig.show()
    VALID_USERNAME_PASSWORD_PAIRS = {
        'hello': 'world'
    }
    app = Dash(__name__)
    auth = dash_auth.BasicAuth(
        app,
        VALID_USERNAME_PASSWORD_PAIRS
    )


    app.layout = html.Div(children=[
        # All elements from the top of the page
        html.Div([
            html.H1(children='Hello Dash'),

            html.Div(children='''
                Dash: A web application framework for Python.
            '''),

            dcc.Graph(
                id='graph1',
                figure=fig
            ),  

            dcc.Graph(
                id='graph1.2',
                figure=fig_timeseries
            ),  
        ]),
        # New Div for all elements in the new 'row' of the page
        html.Div([
            html.H1(children='Hello Dash'),

            html.Div(children='''
                Dash: A web application framework for Python.
            '''),

            dcc.Graph(
                id='graph2',
                figure=fig_timeseries
            ),  
        ]),
    ])




    # app.layout = html.Div(children=[
    #     html.Div(
    #         html.H1('Welcome to the app'),
    #         # html.H3('You are successfully authorized'),
    #         # dcc.Dropdown(['A', 'B'], 'A', id='dropdown'),
    #         dcc.Graph(id='graph', figure=fig)
    #     )
    # ], className='container')




    # app.layout = html.Div([
    #     dcc.Graph(
    #         id='life-exp-vs-gdp',
    #         figure=fig
    #     )
    # ])

    app.run_server(debug=True)
    


import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dt", type=str, default=None)
    parser.add_argument("--window", type=int, default=DEFAULT_WINDOW)
    args = parser.parse_args()
    dt = args.dt if args.dt else datetime.today().strftime("%Y-%m-%d")


    main(dt, args.window)

