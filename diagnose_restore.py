import json
import os
import sys

try:
    import requests
except ImportError:
    print('requests not installed')
    sys.exit(1)

BASE = 'http://127.0.0.1:8000'
print('GET /history')
r = requests.get(f'{BASE}/history', timeout=10)
print('status', r.status_code)
try:
    history = r.json()
except Exception as exc:
    print('history json error', exc)
    print(r.text)
    sys.exit(1)
print('jobs count', len(history.get('jobs', [])))
for idx, job in enumerate(history.get('jobs', [])[:3], 1):
    jid = job.get('job_id')
    print('\nJOB', idx, jid)
    print('status', job.get('status'), 'download_url', job.get('download_url'), 'github_url', job.get('github_url'))
    rr = requests.get(f'{BASE}/job/{jid}/restore', timeout=10)
    print('/job/{jid}/restore', rr.status_code)
    try:
        print(rr.json())
    except Exception as exc:
        print('restore json error', exc)
        print(rr.text[:1000])
    ff = requests.get(f'{BASE}/job/{jid}/files', timeout=10)
    print('/job/{jid}/files', ff.status_code)
    try:
        print(ff.json())
    except Exception as exc:
        print('files json error', exc)
        print(ff.text[:1000])
