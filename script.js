document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    // Fetch the JSON file
    fetch('thesis.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            renderThesis(data);
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            app.innerHTML = `<div style="color:red; text-align:center; padding:20px;">
                <strong>Error loading thesis data.</strong><br>
                <em>Note: If you are opening index.html directly from your hard drive, 
                browsers often block 'fetch' due to CORS security. 
                Please run a local server (e.g., VS Code Live Server).</em>
            </div>`;
        });

    function renderThesis(thesisData) {
        // Apply Config colors
        const root = document.documentElement;
        if(thesisData.config && thesisData.config.theme) {
            root.style.setProperty('--primary', thesisData.config.theme.primary_color);
            root.style.setProperty('--accent', thesisData.config.theme.accent_color);
        }

        // Render Header
        const header = document.createElement('div');
        header.innerHTML = `
            <h1 class="doc-title">${thesisData.meta.title}</h1>
            <div class="meta-data">
                <div><strong>Date:</strong> ${thesisData.meta.date}</div>
                <div><strong>Field:</strong> ${thesisData.meta.field}</div>
            </div>
        `;
        app.appendChild(header);

        // Render Content Sections
        thesisData.content.forEach(section => {
            
            // 1. Abstract
            if(section.type === 'abstract') {
                const div = document.createElement('div');
                div.innerHTML = `<h3>${section.heading}</h3><p><strong>${parseText(section.body)}</strong></p><hr>`;
                app.appendChild(div);
            }
            
            // 2. Standard Section
            else if(section.type === 'section') {
                const wrapper = document.createElement('div');
                const h2 = document.createElement('h2');
                h2.textContent = section.number ? `${section.number}. ${section.heading}` : section.heading;
                wrapper.appendChild(h2);

                section.content.forEach(item => {
                    if(item.type === 'paragraph') {
                        const p = document.createElement('p');
                        p.innerHTML = parseText(item.text);
                        wrapper.appendChild(p);
                    }
                    else if(item.type === 'subheader') {
                        const h3 = document.createElement('h3');
                        h3.textContent = item.text;
                        wrapper.appendChild(h3);
                    }
                    else if(item.type === 'definition') {
                        const div = document.createElement('div');
                        div.className = 'definition-list';
                        div.innerHTML = `<span class="def-term">${item.term}:</span> ${parseText(item.def)}`;
                        wrapper.appendChild(div);
                    }
                    else if(item.type === 'list') {
                        const ul = document.createElement('ul');
                        item.items.forEach(liText => {
                            const li = document.createElement('li');
                            li.innerHTML = parseText(liText);
                            ul.appendChild(li);
                        });
                        wrapper.appendChild(ul);
                    }
                    else if(item.type === 'blockquote') {
                        const bq = document.createElement('blockquote');
                        bq.innerHTML = parseText(item.text);
                        wrapper.appendChild(bq);
                    }
                    // IMAGE GENERATOR LOGIC
                    else if(item.type === 'image') {
                        const figure = document.createElement('figure');
                        // Generates placeholder image URL based on query
                        const imageUrl = `https://placehold.co/600x300/EEE/31343C?text=${encodeURIComponent(item.query)}`;
                        figure.innerHTML = `
                            <img src="${imageUrl}" alt="${item.alt}">
                            <figcaption>${item.caption}</figcaption>
                        `;
                        wrapper.appendChild(figure);
                    }
                });
                app.appendChild(wrapper);
            }

            // 3. Bibliography
            // 3. Bibliography
else if(section.type === 'bibliography') {
    const wrapper = document.createElement('div');
    wrapper.className = 'bibliography';
    const h2 = document.createElement('h2');
    h2.textContent = section.heading;
    wrapper.appendChild(h2);

    section.entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'bib-entry';
        div.id = `ref-${entry.id}`;

        // Create the content string
        let content = `<span class="bib-id">[${entry.id}]</span> `;
        
        // If a URL exists, wrap the text in an anchor tag
        if (entry.url) {
            content += `<a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.text}</a> <span style="font-size:0.8em">↗</span>`;
        } else {
            content += entry.text;
        }

        div.innerHTML = content;
        wrapper.appendChild(div);
    });
    app.appendChild(wrapper);
}


    // Helper: Convert [123] text to clickable links
    function parseText(text) {
        if(!text) return "";
        return text.replace(/\[(\d+)\]/g, '<a href="#ref-$1" class="citation-link">[$1]</a>');
    }
});
