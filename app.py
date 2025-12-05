import streamlit as st
import os
import json
import re

# Set page config
st.set_page_config(layout="wide", page_title="Property 101 Manager")

def get_api_key():
    # Try getting from Streamlit secrets, then environment variable
    try:
        return st.secrets["API_KEY"]
    except:
        return os.environ.get("API_KEY", "")

def load_file_content(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return None

def bundle_react_app():
    # Define the files to bundle and their "module IDs"
    # The order matters slightly for dependency resolution context
    files_to_bundle = {
        'types': 'types.ts',
        'services/geminiService': 'services/geminiService.ts',
        'contexts/DataContext': 'contexts/DataContext.tsx',
        'contexts/AuthContext': 'contexts/AuthContext.tsx',
        'components/Sidebar': 'components/Sidebar.tsx',
        'pages/Login': 'pages/Login.tsx',
        'pages/Dashboard': 'pages/Dashboard.tsx',
        'pages/ComplexList': 'pages/ComplexList.tsx',
        'pages/DocumentGenerator': 'pages/DocumentGenerator.tsx',
        'pages/Reports': 'pages/Reports.tsx',
        'pages/AdminPanel': 'pages/AdminPanel.tsx',
        'pages/ContractorList': 'pages/ContractorList.tsx',
        'App': 'App.tsx',
        'index': 'index.tsx'
    }

    modules = {}

    for module_id, file_path in files_to_bundle.items():
        content = load_file_content(file_path)
        if content:
            # Quick and dirty import fixer for browser environment
            # Converts: import ... from '../types'  -> import ... from 'types'
            # Converts: import ... from './App'     -> import ... from 'App'
            
            # Remove .tsx/.ts extensions in imports if they exist (though usually they don't)
            content = re.sub(r"from ['\"](.+)\.tsx['\"]", r"from '\1'", content)
            
            # Normalize relative paths to absolute module IDs
            # 1. Handle ../
            content = content.replace("from '../", "from '")
            # 2. Handle ./
            content = content.replace("from './", "from '")
            
            # Special case fix for deeply nested imports if any remain
            content = content.replace("from 'contexts/", "from 'contexts/") # no-op but ensures safety
            
            modules[module_id] = content
        else:
            st.error(f"Could not find file: {file_path}")

    return modules

def main():
    api_key = get_api_key()
    
    if not api_key:
        st.warning("⚠️ API_KEY not found in Secrets. AI features will not work.")
        st.info("Add your Google API Key to Streamlit Secrets (.streamlit/secrets.toml) as API_KEY")

    # Load HTML template
    index_html = load_file_content('index.html')
    if not index_html:
        st.error("Could not find index.html")
        return

    # Bundle the React Code
    modules = bundle_react_app()
    
    # Create the Import Map and Module Injection Script
    js_bundle = """
    <script type="text/babel" data-type="module">
        const modules = """ + json.dumps(modules) + """;
        
        // 1. Create Blobs for each module
        const moduleBlobs = {};
        const importMap = { imports: {} };
        
        // Add external dependencies to import map (must match index.html importmap)
        const externals = {
            "react": "https://aistudiocdn.com/react@^19.2.1",
            "react/": "https://aistudiocdn.com/react@^19.2.1/",
            "react-dom/client": "https://aistudiocdn.com/react-dom@^19.2.1",
            "lucide-react": "https://aistudiocdn.com/lucide-react@^0.556.0",
            "recharts": "https://aistudiocdn.com/recharts@^3.5.1",
            "react-router-dom": "https://aistudiocdn.com/react-router-dom@^7.10.1",
            "@google/genai": "https://aistudiocdn.com/@google/genai@^1.31.0",
            "react-markdown": "https://aistudiocdn.com/react-markdown@^10.1.0"
        };
        
        Object.assign(importMap.imports, externals);

        // Process our local modules
        Object.keys(modules).forEach(key => {
            // Inject API Key into geminiService if found
            if(key === 'services/geminiService') {
                modules[key] = modules[key].replace('process.env.API_KEY', '"' + '""" + api_key + """' + '"');
            }

            const blob = new Blob([modules[key]], { type: 'text/tsx' });
            const url = URL.createObjectURL(blob);
            moduleBlobs[key] = url;
            
            // Map the "clean" name (e.g., 'types') to the blob URL
            importMap.imports[key] = url;
            
            // Also map sub-paths just in case
            if (key.includes('/')) {
                const parts = key.split('/');
                const fileName = parts[parts.length - 1];
                importMap.imports[fileName] = url;
            }
        });

        // 2. Inject ImportMap
        const mapEl = document.createElement('script');
        mapEl.type = "importmap";
        mapEl.textContent = JSON.stringify(importMap);
        document.head.appendChild(mapEl);

        // 3. Load Entry Point (index)
        // We need to use the Babel transform script to load the entry point
        const entryScript = document.createElement('script');
        entryScript.type = "text/babel";
        entryScript.setAttribute("data-type", "module");
        entryScript.textContent = `import 'index';`;
        document.body.appendChild(entryScript);
    </script>
    """

    # Inject the JS Bundle into the HTML where the placeholder is
    final_html = index_html.replace('<!-- INJECT_SCRIPTS_HERE -->', js_bundle)

    # Render
    st.components.v1.html(final_html, height=1000, scrolling=True)

if __name__ == "__main__":
    main()