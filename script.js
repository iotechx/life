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
  // Apply Config colors & Fonts
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
  // Render Header with Multiple Authors
  const header = document.createElement('div');

  let authorsHtml = '';
  if (thesisData.meta.authors && Array.isArray(thesisData.meta.authors)) {
   // Map authors to links
   authorsHtml = thesisData.meta.authors.map(author =>
    `<a href="${author.url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); text-decoration:none; font-weight:bold;">${author.name
    }</a>`
   ).join(', ');
  } else if (thesisData.meta.author) {
   // Fallback for single string author
   authorsHtml = thesisData.meta.author;
  }

  header.innerHTML = `
            <h1 class="doc-title">${thesisData.meta.title
   }</h1>
            <div class="meta-data">
                <div style="margin-bottom:10px; font-size:1.1em;">
                    <strong>By:</strong> ${authorsHtml
   }
                </div>
                <div><strong>Date:</strong> ${thesisData.meta.date
   }</div>
                <div><strong>Field:</strong> ${thesisData.meta.field
   }</div>
            </div>
        `;
  app.appendChild(header);

  // Initialize Figure Counter
  let figureCounter = 1;

  // Render Content Sections
  thesisData.content.forEach(section => {
   // Abstract
   if (section.type === 'abstract') {
    const div = document.createElement('div');
    div.innerHTML = `<h3>${section.heading
     }</h3><p><strong>${parseText(section.body)
     }</strong></p><hr>`;
    app.appendChild(div);
   }
   // Standard Section
   else if (section.type === 'section') {
    const wrapper = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = section.number ? `${section.number
     }. ${section.heading
     }` : section.heading;
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
      div.innerHTML = `<span class="def-term">${item.term
       }:</span> ${parseText(item.def)
       }`;
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
     // Image Rendering
     else if (item.type === 'image') {
      const figure = document.createElement('figure');

      // Automatically assign 1.jpg, 2.jpg...
      const localImageSource = `${figureCounter
       }.jpg`;

      figure.innerHTML = `
                            <img src="${localImageSource}" alt="${item.alt}" onerror="this.onerror=null;this.parentElement.innerHTML='<p style=color:red>[Image missing: ${localImageSource}]</p>'">
                            <figcaption>${item.caption
       }</figcaption>
                        `;
      wrapper.appendChild(figure);

      // Increment counter
      figureCounter++;
     }
    });
    app.appendChild(wrapper);
   }
   // Bibliography
   else if (section.type === 'bibliography') {
    const wrapper = document.createElement('div');
    wrapper.className = 'bibliography';
    const h2 = document.createElement('h2');
    h2.textContent = section.heading;
    wrapper.appendChild(h2);

    section.entries.forEach(entry => {
     const div = document.createElement('div');
     div.className = 'bib-entry';
     div.id = `ref-${entry.id
      }`;

     let content = `<span class="bib-id">[${entry.id
      }
     ]</span> `;
     content += `<a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.text
      }</a> <span style="font-size:0.8em">↗</span>`;

     div.innerHTML = content;
     wrapper.appendChild(div);
    });
    app.appendChild(wrapper);
   }
  });
 }
 // Helper: Convert [1] to clickable links
 function parseText(text) {
  if (!text) return "";
  return text.replace(/\[(\d+)\]/g, '<a href="#ref-$1" class="citation-link">$1]</a >');
 }
});