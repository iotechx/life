document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    fetch('thesis.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            app.innerHTML = '';
            renderThesis(data);
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            app.innerHTML = `<div style="color:red; text-align:center; padding:20px;">
                <strong>Error loading thesis data.</strong><br>
                <em>Note: Browsers block direct file access for security (CORS). 
                Please use a local server (e.g., Live Server in VS Code, or 'python -m http.server').</em>
            </div>`;
        });

    function renderThesis(thesisData) {
        // --- 1. INJECT COMMON STYLES FROM JSON ---
        const styleTag = document.createElement('style');
        let cssString = "/* Common Styles */\n";

        if (thesisData.config && thesisData.config.common_style) {
            for (const [selector, rules] of Object.entries(thesisData.config.common_style)) {
                cssString += `${selector} { ${rules} } \n`;
            }
        }

        styleTag.textContent = cssString;
        document.head.appendChild(styleTag);

        // Apply Theme Config
        const root = document.documentElement;
        if (thesisData.config && thesisData.config.theme) {
            const t = thesisData.config.theme;
            if (t.primary_color) root.style.setProperty('--primary', t.primary_color);
            if (t.secondary_color) root.style.setProperty('--secondary', t.secondary_color);
            if (t.accent_color) root.style.setProperty('--accent', t.accent_color);
            if (t.background_color) root.style.setProperty('--bg', t.background_color);
            if (t.text_color) root.style.setProperty('--text', t.text_color);
            if (t.paper_width) root.style.setProperty('--width', t.paper_width);
            if (t.font_heading) root.style.setProperty('--font-head', t.font_heading);
            if (t.font_body) root.style.setProperty('--font-body', t.font_body);
        }

        // --- 2. RENDER HEADER ---
        const header = document.createElement('div');

        // Authors
        let authorsHtml = '';
        if (thesisData.meta.authors && Array.isArray(thesisData.meta.authors)) {
            authorsHtml = thesisData.meta.authors.map(author =>
                `<a href="${author.url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); text-decoration:none; font-weight:bold;">${author.name}</a>`
            ).join(', ');
        } else if (thesisData.meta.author) {
            authorsHtml = thesisData.meta.author;
        }

        // Fields
        let fieldsHtml = '';
        if (thesisData.meta.fields && Array.isArray(thesisData.meta.fields)) {
            fieldsHtml = thesisData.meta.fields.map(field =>
                `<a href="${field.url}" target="_blank" rel="noopener noreferrer" style="color:var(--secondary); text-decoration:none; border-bottom:1px dotted var(--secondary);">${field.name}</a>`
            ).join(', ');
        } else {
            fieldsHtml = thesisData.meta.field || '';
        }

        header.innerHTML = `
            <h1 class="doc-title">${thesisData.meta.title}</h1>
            <div class="meta-data">
                <div style="margin-bottom:10px; font-size:1.1em;">
                    <strong>By:</strong> ${authorsHtml}
                </div>
                <div><strong>Date:</strong> ${thesisData.meta.date}</div>
                <div style="margin-top:5px;"><strong>Field:</strong> ${fieldsHtml}</div>
            </div>
        `;
        app.appendChild(header);

        // --- 3. RENDER SECTIONS ---
        thesisData.content.forEach(section => {

            // --- INJECT SECTION-SPECIFIC STYLES ---
            if (section.specific_style) {
                let sectionCss = `\n/* Specific Style for Section: ${section.heading || 'Untitled'} */\n`;
                for (const [selector, rules] of Object.entries(section.specific_style)) {
                    sectionCss += `${selector} { ${rules} } \n`;
                }
                // Append to existing style tag
                styleTag.textContent += sectionCss;
            }

            if (section.type === 'abstract') {
                const div = document.createElement('div');
                div.innerHTML = `<h3>${section.heading}</h3><p><strong>${parseText(section.body)}</strong></p><hr>`;
                app.appendChild(div);
            }

            else if (section.type === 'section') {
                const wrapper = document.createElement('div');
                const h2 = document.createElement('h2');
                h2.textContent = section.number ? `${section.number}. ${section.heading}` : section.heading;
                wrapper.appendChild(h2);

                section.content.forEach(item => {
                    if (item.type === 'paragraph') {
                        const p = document.createElement('p');
                        p.innerHTML = parseText(item.text);
                        wrapper.appendChild(p);
                    }
                    else if (item.type === 'subheader') {
                        const h3 = document.createElement('h3');
                        h3.textContent = item.text;
                        wrapper.appendChild(h3);
                    }
                    else if (item.type === 'definition') {
                        const div = document.createElement('div');
                        div.className = 'definition-list';
                        div.innerHTML = `<span class="def-term">${item.term}:</span> ${parseText(item.def)}`;
                        wrapper.appendChild(div);
                    }
                    else if (item.type === 'list') {
                        const ul = document.createElement('ul');
                        item.items.forEach(liText => {
                            const li = document.createElement('li');
                            li.innerHTML = parseText(liText);
                            ul.appendChild(li);
                        });
                        wrapper.appendChild(ul);
                    }
                    else if (item.type === 'blockquote') {
                        const bq = document.createElement('blockquote');
                        bq.innerHTML = parseText(item.text);
                        wrapper.appendChild(bq);
                    }
                    else if (item.type === 'image') {
                        const figure = document.createElement('figure');
                        const imgSource = item.fileName || 'missing-file-ref.png';
                        figure.innerHTML = `
                            <img src="${imgSource}" alt="${item.alt}" onerror="this.onerror=null;this.parentElement.innerHTML='<p style=color:red>[Image missing: ${imgSource}]</p>'">
                            <figcaption>${item.caption}</figcaption>
                        `;
                        wrapper.appendChild(figure);
                    }
                });
                app.appendChild(wrapper);
            }

            else if (section.type === 'bibliography') {
                const wrapper = document.createElement('div');
                wrapper.className = 'bibliography';
                const h2 = document.createElement('h2');
                h2.textContent = section.heading;
                wrapper.appendChild(h2);

                section.entries.forEach(entry => {
                    const div = document.createElement('div');
                    div.className = 'bib-entry';
                    div.id = `ref-${entry.id}`;
                    let content = `<span class="bib-id">[${entry.id}]</span> `;
                    content += `<a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.text}</a> <span style="font-size:0.8em">↗</span>`;
                    div.innerHTML = content;
                    wrapper.appendChild(div);
                });
                app.appendChild(wrapper);
            }
        });
    }

    function parseText(text) {
        if (!text) return "";
        return text.replace(/\[(\d+)\]/g, '<a href="#ref-$1" class="citation-link">[$1]</a>');
    }
});