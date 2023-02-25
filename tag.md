---
title: Tag
layout: tag.njk
---

# {{title}}

{% include "pagination.njk" %}

{%- for post in pagination.items -%}
  <p>{{post.url}} {{post.data.title}}</p>
{%- endfor -%}
