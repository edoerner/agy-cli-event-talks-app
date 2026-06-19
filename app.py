import os
import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# XML feed URL
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
NAMESPACES = {'atom': 'http://www.w3.org/2005/Atom'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        # Fetch the release notes XML feed
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        entries = []
        for entry in root.findall('atom:entry', NAMESPACES):
            title = entry.find('atom:title', NAMESPACES)
            title_text = title.text if title is not None else 'Unknown Date'
            
            updated = entry.find('atom:updated', NAMESPACES)
            updated_text = updated.text if updated is not None else ''
            
            link_elem = entry.find("atom:link[@rel='alternate']", NAMESPACES)
            link = link_elem.attrib.get('href') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', NAMESPACES)
            content_text = content_elem.text if content_elem is not None else ''
            
            entries.append({
                'date': title_text,
                'updated': updated_text,
                'link': link,
                'content': content_text
            })
            
        return jsonify({
            'success': True,
            'entries': entries
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Use environment port or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
