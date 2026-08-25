import json
from pathlib import Path
p = Path('Odoo-Generation-/jobs_state.json')
if not p.exists():
    print('jobs_state.json not found at', p)
    raise SystemExit(1)
text = p.read_text(encoding='utf-8')
try:
    data = json.loads(text)
except Exception as e:
    print('Failed to parse JSON:', e)
    raise
removed = []
new = {}
for job_id, job in data.items():
    module_name = None
    if isinstance(job.get('module_config'), dict):
        module_name = job['module_config'].get('module_name')
    if not module_name and isinstance(job.get('schema_preview'), dict):
        module_name = job['schema_preview'].get('module_name')
    if module_name == 'fitzone':
        removed.append(job_id)
    else:
        new[job_id] = job
if not removed:
    print('No fitzone jobs found')
else:
    p.write_text(json.dumps(new, indent=2, ensure_ascii=False), encoding='utf-8')
    print('Removed job ids:', ', '.join(removed))
