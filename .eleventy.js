const CleanCSS = require("clean-css");
const fs = require("node:fs/promises");
const { format } = require("date-fns");
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

  eleventyConfig.addPassthroughCopy("assets");

  // Get all tags (except those tagged with 'post').
  eleventyConfig.addCollection("allTags", function (collectionApi) {
    const tags = collectionApi.getAll().flatMap((item) => item.data.tags ?? []);
    const set = new Set(tags);
    set.delete("post");
    return [...set].sort();
  });

  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Filter collections by tags.
  eleventyConfig.addFilter("filterTag", function (collection, tag) {
    return tag
      ? collection.filter((post) => post.data.tags?.includes(tag))
      : collection;
  });

  // Exclude certain tags from the list of tags.
  eleventyConfig.addFilter("cleanTags", function (tags) {
    return tags.filter((tag) => tag !== "post");
  });

  eleventyConfig.addFilter("tagURL", function (tag) {
    return `/tag/${tag}`;
  });

  eleventyConfig.addFilter("formatDate", function (date) {
    return format(date, "d MMM Y");
  });

  eleventyConfig.addShortcode("lastUpdatedAt", async function () {
    const inputPath = this.page?.inputPath;
    if (!inputPath) {
      return "";
    }

    const stats = await fs.stat(inputPath);
    return format(stats.mtime, "d MMM Y");
  });
};
