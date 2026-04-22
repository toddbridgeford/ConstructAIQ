import base64
d = "".join(open("/tmp/d%d.b64").read() for d in [1,2,3,4])
content = base64.b64decode(d)
with open("src/app/dashboard/page.tsx","wb") as f:
f.write(content)
lines = content.count(b"\n")
print("page.tsx written:", len(content), "bytes,", lines, "lines")