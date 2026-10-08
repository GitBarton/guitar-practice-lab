"""Browser smoke test using in-memory HTML/scripts, because runner Chromium blocks web URLs."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]+src="\./(?:config|app)\.js"[^>]*></script>','',html)
html=re.sub(r'<link[^>]+href="\./styles.css"[^>]*/>','',html)
js=''
for filename in ['data.js','music.js','storage.js','app.js']:
 text=(root/filename).read_text()
 text=re.sub(r'^import .*? from .*?;\s*','',text,flags=re.MULTILINE)
 text=re.sub(r'^export \{[^\n]*?\};\s*','',text,flags=re.MULTILINE)
 text=re.sub(r'\bexport (const|function|class)\b',r'\1',text)
 js+='\n'+text
js='const e=escapeHtml;\n'+js if False else js.replace("const state=loadState();","const e=escapeHtml;\nconst state=loadState();",1)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda x: errors.append(str(x)))
 page.goto('about:blank')
 page.set_content(html)
 page.add_style_tag(content=(root/'styles.css').read_text())
 page.add_script_tag(content=js)
 page.wait_for_timeout(200)
 print('TITLE:',page.title())
 print('HOME:',page.locator('h1').first.inner_text())
 print('ERRORS:',errors)
 page.screenshot(path=str(root/'preview-desktop.png'),full_page=True)
 assert 'Ready to practice' in page.locator('h1').first.inner_text()
 page.get_by_role('button',name='Start 45-minute session').click()
 page.wait_for_timeout(100)
 print('PRACTICE:',page.locator('h1').first.inner_text())
 assert page.locator('#practice-clock').count()==1
 page.get_by_role('button',name='Start timer').click()
 page.wait_for_timeout(100)
 page.get_by_role('button',name='Finish & rate').click()
 page.locator('[data-action="rate-clean"]').click()
 page.wait_for_timeout(100)
 print('SECOND DRILL:',page.locator('h1').first.inner_text())
 page.evaluate("window.location.hash='#songs'")
 page.wait_for_timeout(100)
 page.get_by_text('Autumn Leaves').first.click()
 page.wait_for_timeout(100)
 page.locator('#song-key').fill('G minor')
 page.locator('#song-tempo').fill('65')
 page.locator('#song-notes').fill('Practice solo at 65 BPM; clean transition to 130.')
 page.get_by_role('button',name='Save rehearsal notes').click()
 page.wait_for_timeout(100)
 print('SONG SAVED:',page.locator('h1').first.inner_text())
 page.evaluate("window.location.hash='#progress'")
 page.wait_for_timeout(100)
 assert page.get_by_text('Recent drill results').count()==1
 print('PROGRESS:',page.locator('h1').first.inner_text(),'ERRORS:',errors)
 page.screenshot(path=str(root/'preview-progress.png'),full_page=True)
 phone=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 phone.on('pageerror',lambda x:errors.append('mobile '+str(x)))
 phone.goto('about:blank');phone.set_content(html);phone.add_style_tag(content=(root/'styles.css').read_text());phone.add_script_tag(content=js)
 phone.wait_for_timeout(100)
 phone.screenshot(path=str(root/'preview-iphone.png'),full_page=True)
 print('PHONE:',phone.locator('h1').first.inner_text(),'ERRORS:',errors)
 assert not errors,errors
 b.close()
print('BROWSER SMOKE PASSED')
