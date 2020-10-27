from trello import TrelloClient


# don't worry, I'll expire these creds
client = TrelloClient(
    api_key='437bfea7e371350fbd8586610762a4d9',
    api_secret='bd421ccc5f51a5dd8610ce3b8fd21734d148765530980b00e728f32f0537e400',
    token='1e5f7a7486153007a1a880142e538e0ebb15fc1665fe71a071fdfb13d9ad34df',
    token_secret='1e5f7a7486153007a1a880142e538e0ebb15fc1665fe71a071fdfb13d9ad34df'
)
board = client.get_board("5983c935e5714aac22c8e482")

tasks_list = board.get_list("5983c9426b4811c90c36126a")
while True:
    tasks = tasks_list.list_cards()
    top_task = tasks[0]

    print("******** DO IT NOW *********")
    print("******** NAME: ", top_task.name)
    print("****************************")
    print(top_task.desc)
    print("****************************")
    user_input = ""
    while user_input != "done":
        print("\nSay 'done' when it's done. Ctrl+C to quit.\n")
        user_input = input("> ")
    top_task.set_closed(True)
