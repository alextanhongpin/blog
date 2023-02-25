---
layout: page.njk
---

<ul>
{%- for post in collections.post -%}
<li><a href='{{post.url | url}}'>{{post.data.title}}</a></li>
{%- endfor -%}
</ul>


	{{hello.greet}}
