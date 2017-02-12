var frontMatter = require('front-matter')
var markdownIt = require('markdown-it')
var hljs = require('highlight.js')
var objectAssign = require('object-assign')

var highlight = function (str, lang) {
  if ((lang !== null) && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(lang, str).value
    } catch (_error) {
      console.error(_error)
    }
  }
  try {
    return hljs.highlightAuto(str).value
  } catch (_error) {
    console.error(_error)
  }
  return ''
}

var md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight,
})
  .use(require('markdown-it-sub'))
  .use(require('markdown-it-footnote'))
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-abbr'))
  .use(require('markdown-it-attrs'))

module.exports = function (content) {
  this.cacheable()
  const meta = frontMatter(content)
  const body = md.render(meta.body)
  const toc = extractToc(meta.body);
  const result = objectAssign({}, meta.attributes, {
    body,
    toc,
  })
  this.value = result
  return `module.exports = ${JSON.stringify(result)}`
}

function extractToc(text) {
  return text
    .split('\n').map(line => {
      let headerLevel = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '#') {
          headerLevel += 1;
        } else {
          break;
        }
      }
    
      // pretty strict format that anchor should be like {#something .classes-if-one-likes} and then end of line
      let anchorMatch = line.match(/{#([a-zA-Z\-_]+).*}\s*$/);
      let headerEnd = line.length;      
      let anchor = null;
      if (anchorMatch) {
        headerEnd = anchorMatch.index;
        anchor = anchorMatch[1];
      }
            
      let headerText = line.slice(headerLevel, headerEnd).trim();
      return {
        level: headerLevel,
        headerText,
        anchor
      };
    })
    .filter(lineSpec => lineSpec.level > 0);
}