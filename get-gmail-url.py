#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3001"

print("🔐 LOGIN...")
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "albertfgh22@gmail.com", "password": "parolatare"}
)

print(json.dumps(login_response.json(), indent=2))
print()

if login_response.status_code != 200:
    print("❌ Login failed!")
    exit(1)

token = login_response.json()["accessToken"]
print(f"✅ Token: {token[:50]}...")
print()

print("🔗 GETTING GMAIL AUTH URL...")
headers = {"Authorization": f"Bearer {token}"}

gmail_auth_response = requests.get(
    f"{BASE_URL}/api/admin/gmail/auth",
    headers=headers
)

print(f"Status Code: {gmail_auth_response.status_code}")
print(json.dumps(gmail_auth_response.json(), indent=2))
print()

if gmail_auth_response.status_code == 200:
    auth_url = gmail_auth_response.json().get("authUrl")
    if auth_url:
        print("=" * 80)
        print("🔗 COPIAZĂ ȘI DESCHIDE ACEST URL ÎN BROWSER:")
        print()
        print(auth_url)
        print()
        print("=" * 80)
        print()
        print("📝 Pași:")
        print("1. Deschide URL-ul în browser")
        print("2. Alege contul Gmail")
        print("3. Aprobă permisiunile")
        print("4. Vei fi redirectat la localhost:3001/api/admin/gmail/callback")
        print("5. Ar trebui să vezi: {\"success\": true, \"message\": \"Gmail connected successfully!\"}")
