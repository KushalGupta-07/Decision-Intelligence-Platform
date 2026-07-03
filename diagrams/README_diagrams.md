# Architectural Diagrams for Decision-Intelligence-Platform

This change adds PlantUML source and a GitHub Actions workflow that will render a single combined diagram (component, deployment, and sequence stacked vertically) into PNG when the branch is pushed.

Files added in this branch:

- diagrams/architectural_diagrams.puml  — PlantUML source for the combined diagram
- .github/workflows/render-diagrams.yml — GitHub Actions workflow to render the .puml into PNG and commit the result

How it works:
1. The workflow runs on pushes to the branch `add/architectural-diagrams`.
2. It installs PlantUML and Graphviz, renders the .puml into PNG(s) under the `diagrams/` folder, and commits the generated PNG file(s) back to the branch.

After the workflow completes you will find the rendered PNG at:

- diagrams/architectural_diagrams.png

Notes / options:
- If you'd like a separate PNG per diagram (instead of a single stacked PNG), I can split the PlantUML into three files and update the workflow accordingly.
- If you want different styling (colors, fonts, DPI), tell me and I'll update the PlantUML.
