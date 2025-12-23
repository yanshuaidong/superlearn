import requests

response = requests.post(
    'http://127.0.0.1:1125/ask',
    json={'question': '你好，请介绍一下自己'}
)
print(response.json())