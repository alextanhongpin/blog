const CleanCSS = require("clean-css");
const fs = require("node:fs/promises");
const { format } = require("date-fns");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  const isProduction = process.env.NODE_ENV === "production";
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

  eleventyConfig.addFilter("readingTime", function (body) {
    const words = (body ?? "")
      .split("\n")
      .flatMap((line) => line.trim().split(" ")).length;
    const wordsPerMinute = 275;
    const minutes = Math.floor(words / wordsPerMinute);
    const label = minutes === 1 ? "minute" : "minutes";
    return minutes ? `${minutes} ${label}` : "";
  });

  function formatDate(date) {
    return format(date, "MMM d, Y");
  }

  eleventyConfig.addFilter("formatDate", formatDate);

  eleventyConfig.addShortcode("lastUpdatedAt", async function () {
    const inputPath = this.page?.inputPath;
    if (!inputPath) {
      return "";
    }

    const stats = await fs.stat(inputPath);

    // Show the last modified time.
    return formatDate(stats.mtime);
  });

  return {
    pathPrefix: isProduction ? "/blog/" : "",
  };
};
