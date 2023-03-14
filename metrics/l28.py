import collections
import json

# download the L28 chart from john's dashboard in mongodb atlas and put in same directory as this script
with open("data.json") as f:
    data = json.loads(f.read())

print(len(data), data[0])

counts = collections.defaultdict(int)
for row in data:
    counts[row["group_series_0"]] += 1

count_to_count = collections.defaultdict(int)

for user_id, count in counts.items():
    count_to_count[count] += 1

# prints out a csv format that can be turned into a histogram
for number_of_days, number_of_users in sorted(count_to_count.items()):
    print(str(number_of_days) + "," + str(number_of_users))
