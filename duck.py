import requests
import json
from bs4 import BeautifulSoup
url = 'http://localhost:8080/threads/?page=0&limit=5'

id = '628d30c429936575497eea12'
r = requests.get(url, headers={'Authorization': 'Bearer f454f56a-7b7c-424f-a793-bbef8ab9788b'})

threads = r.json()
for thread in threads:
    if thread['id'] == id:
        th = thread

# soup = BeautifulSoup(th['emails'][-1]['body'], 'html.parser')

# top = soup.find_all(recursive=False)
# for t in top:
#     print(t.name)

for thread in threads:
    email = thread['emails'][-1]
    soup = BeautifulSoup(email['body'], 'html.parser')
    top = soup.find_all(recursive=False)
    print(len(top), email['subject'])

    
# print(['emails'][0]['subject'])
