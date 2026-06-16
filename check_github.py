import urllib.request, json, sys

usernames = sys.argv[1:] if len(sys.argv) > 1 else ["ailin", "ailinlin", "wangjiawen"]
for name in usernames:
    try:
        url = f"https://api.github.com/users/{name}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode())
        if data.get('login'):
            print(f"[OK] {data['login']} | {data.get('name','')} | {data.get('html_url','')}")
        else:
            print(f"[NO] {name}: not found")
    except Exception as e:
        print(f"[ERR] {name}: {e}")
