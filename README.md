# Daniela and Will Travel Blog

Welcome to the Daniela and Will Travel Blog repository! This project contains the source code for our travel blog, where we share our travel experiences, tips, and guides.

## Project Structure

The project is organized as follows:

- `dist/` + `docs/`: Contains the generated HTML files for the blog.
- `src/`: Contains the source files for the blog, including posts and pages.
  - `en/`: English content.
    - `posts/`: Blog posts organized by region.
    - `pages/`: Static pages like About, Contact, etc.
  - `es/`: Spanish content - currently empty.
  - `assets/`: Contains images, styles, and other static assets.
  - `_includes/`: Contains components.
  - `_layouts/`: Contains layouts of the pages.

## Getting Started

To get started with this project, follow these steps:

1. **Clone the repository:**

    ```sh
    git clone https://github.com/daniela-and-will-travel/daniela-and-will-travel.github.io.git
    cd daniela-and-will-travel.github.io
    ```

2. **Install dependencies:**
    Make sure you have [Node.js](https://nodejs.org/) installed. Then, install the dependencies:

    ```sh
    npm install
    ```

3. **Run the development server:**
    Start the development server to see your changes live:

    ```sh
    npm run dev
    ```

4. **Build the project:**
    To build the project for production, run:

    ```sh
    npm run build
    ```

## Writing Content

### Front Matter

Each Markdown file should start with front matter to define metadata for the post. Here is an example:

```markdown
---
layout: post
title: One Week Japan Itinerary
date: 2025-03-10
modified: 2025-03-10
author: Daniela
tags:
 - asia
 - southeast-asia
 - japan
 - itinerary
 - planning
draft: false
eleventyExcludeFromCollections: false
seo:
  title: One Week Japan Itinerary
  description: How to visit Japan on a bougie backpacker budget!
  changeFrequency: monthly
---
```

### Deployment

The project is set up to be deployed to GitHub Pages. To deploy the latest version, build your changes using the `build-win` or `build-unix` scripts, and push your changes to the main branch, where GitHub Actions will automatically build and deploy the site.

## Contributing

We welcome contributions! If you find a bug or have a suggestion, please open an issue or submit a pull request.

## License

The code in this project is licensed under the GNU General Public License v3. See the `LICENSE` file for details. The copyright of the text on the blog is that of the respective author.

## Contact

Questions or suggestions relating to development of the travel blog can be brought up through an open issue. All other inquires, including licensing and partnership inquires, should be handled through the contact form on the blog itself.
