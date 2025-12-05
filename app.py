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
            # 1. Remove specific extensions in imports to match module IDs
            content = re.sub(r"from ['\"](.+)\.tsx['\"]", r"from '\1'", content)
            content = re.sub(r"from ['\"](.+)\.ts['\"]", r"from '\1'", content)
            
            # 2. Flatten relative paths for the browser environment
            #    Because we register everything as top-level modules in the import map,
            #    we can replace '../components/Sidebar' with 'components/Sidebar'
            
            # Replace "../" with nothing (assuming depth of 1 folder usually)
            # This is a heuristic simplification for this specific project structure
            content = content.replace("from '../", "from '")
            content = content.replace("from './", "from '")
            
            # Fix deeply nested context imports if any
            # e.g. import { ... } from '../contexts/DataContext' -> 'contexts/DataContext'
            
            modules[module_id] = content
        else:
            print(f"Warning: Could not find file: {file_path}")

    return modules

def main():
    api_key = get_api_key()
    
    # UI Feedback for API Key
    if not api_key:
        st.warning("⚠️ API_KEY not found in Secrets. AI features (Document Generator) will not work.")
        with st.expander("How to fix this?"):
            st.markdown("""
            1. Go to your Streamlit App Dashboard.
            2. Click on **Settings** -> **Secrets**.
            3. Add the following line:
            ```toml
            API_KEY = "your_google_api_key_here"
            ```
            4. Reboot the app.
            """)

    # Load HTML template
    index_html = load_file_content('index.html')
    if not index_html:
        st.error("Could not find index.html in the repository.")
        return

    # Bundle the React Code
    modules = bundle_react_app()
    
    # Create the Import Map and Module Injection Script
    js_bundle = """
    <script type="text/babel" data-type="module">
        const modules = """ + json.dumps(modules) + """;
        const apiKey = " """ + api_key + """ ";

        // 1. Create Blobs for each module
        const moduleBlobs = {};
        const importMap = { imports: {} };
        
        // Add external dependencies to import map
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
            let content = modules[key];
            
            // Inject API Key into geminiService
            if(key === 'services/geminiService') {
                content = content.replace('process.env.API_KEY', '"' + apiKey + '"');
            }

            const blob = new Blob([content], { type: 'text/tsx' });
            const url = URL.createObjectURL(blob);
            
            // Map the "clean" name (e.g., 'types', 'components/Sidebar') to the blob URL
            importMap.imports[key] = url;
            
            // Also map just the filename for simpler resolution if needed
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
    st.components.v1.html(final_html, height=1200, scrolling=True)

if __name__ == "__main__":
    main()