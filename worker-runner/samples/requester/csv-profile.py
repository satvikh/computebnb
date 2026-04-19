import csv
from io import StringIO

raw = """name,region,revenue,users
acme,west,18200,410
bravo,east,9400,205
cedar,west,15100,338
delta,south,12150,284
"""

rows = list(csv.DictReader(StringIO(raw)))
revenues = [int(row["revenue"]) for row in rows]
users = [int(row["users"]) for row in rows]

print(f"rows={len(rows)} columns={len(rows[0])}")
print(f"revenue_total={sum(revenues)} revenue_max={max(revenues)}")
print(f"users_total={sum(users)} avg_users={round(sum(users) / len(users), 2)}")
print("regions=" + ",".join(sorted({row["region"] for row in rows})))
