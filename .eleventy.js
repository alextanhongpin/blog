const CleanCSS = require("clean-css");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  // Minify css. Usage.
  /*
*<!-- capture the CSS content as a Nunjucks variable -->
{% set css %}
  {% include "sample.css" %}
{% endset %}
<!-- feed it through our cssmin filter to minify -->
<style>
  {{ css | cssmin | safe }}
</style>
* */
  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });
};
