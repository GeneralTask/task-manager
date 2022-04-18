
import os
from datetime import date, datetime, timedelta
from pprint import pprint

import mpld3
import pandas as pd
import pytz
from plotnine import *
from pymongo import MongoClient

CONNECTION_TEMPLATE = """mongodb://{user}:{password}@cluster0-shard-00-00.dbkij.mongodb.net:27017,cluster0-shard-00-01.dbkij.mongodb.net:27017,cluster0-shard-00-02.dbkij.mongodb.net:27017/myFirstDatabase?authSource=admin&replicaSet=atlas-xn7hxv-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true"""


def main():
    user = os.environ["MONGO_USER"]
    password = os.environ["MONGO_PASSWORD"]


    client = MongoClient(
        CONNECTION_TEMPLATE.format(user=user, password=password),
        unicode_decode_error_handler='ignore',
    )


    main = client.main
    events = main.log_events


    # start = datetime(2022, 1, 1, tzinfo=pytz.timezone("US/Pacific"))
    start = datetime(2022, 1, 1, tzinfo=pytz.timezone("US/Pacific"))
    activity_cooloff_mins = 10
    num_sessions_threshold = 5
    window = timedelta(days=30)
    generate_user_daily_report(events, start, window, activity_cooloff_mins, num_sessions_threshold)

def generate_user_daily_report(events, start, window, activity_cooloff_mins, num_sessions_threshold):
    date_filter = {"created_at": {"$gt": start, "$lt": start+window}}
    events.count_documents(date_filter)


#     cursor = events.find({})
    cursor = events.find(date_filter)
    df = pd.DataFrame(list(cursor))
    df = df.rename(columns={"_id": "event_id"}, errors="raise")
    df.head()



    df["time_since_previous_event_this_day"] = df.sort_values(by=["user_id", "created_at"]).groupby(by='user_id')["created_at"].diff()
    df["ts_pst"] = df.created_at.dt.tz_localize(pytz.utc).dt.tz_convert('US/Pacific')
    df


    activity_cooloff_delta = timedelta(minutes=activity_cooloff_mins)
    df_new_sessions = df[~(df.time_since_previous_event_this_day < activity_cooloff_delta)]  # includes NaT, which indicates the first event of the day
    df_new_sessions.head()


    df_new_sessions["dt"] = df_new_sessions.ts_pst.dt.date  # date in PST
    df_new_sessions.head()


    df_events_per_user = df_new_sessions.groupby(["user_id", "dt"]).agg(num_sessions=('event_id', 'count'))
    df_events_per_user.head()


    users_with_enough_sessions = df_events_per_user[df_events_per_user.num_sessions > num_sessions_threshold].reset_index()
    users_with_enough_sessions.sort_values(by=["dt", "num_sessions"])

    daily_users = users_with_enough_sessions.sort_values(by=["dt", "num_sessions"]).groupby("dt").agg(num_users=('user_id', 'count')).reset_index()
    daily_users["dt"] = pd.to_datetime(daily_users.dt)
    daily_users.head()


    p = (ggplot(daily_users, aes('dt', 'num_users'))
     # + geom_point())
     # + geom_line())
     + geom_col())
    p
    print("done")

    import dash_auth
    import plotly.express as px
    from dash import Dash, dcc, html
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

    app.layout = html.Div([
        html.H1('Welcome to the app'),
        html.H3('You are successfully authorized'),
        dcc.Dropdown(['A', 'B'], 'A', id='dropdown'),
        dcc.Graph(id='graph', figure=fig)
    ], className='container')




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
    args = parser.parse_args()
    dt = args.dt if args.dt else datetime.today().strftime('%Y-%m-%d')


    # main()

