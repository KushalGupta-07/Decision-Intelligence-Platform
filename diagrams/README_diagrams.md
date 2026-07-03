# Architectural Diagrams for Decision-Intelligence-Platform

This branch provides PlantUML sources and a GitHub Actions workflow to render three separate diagrams (component, deployment, sequence) into PNGs.

Files added/updated in this branch:

- diagrams/component_diagram.puml  — PlantUML source for the component diagram
- diagrams/deployment_diagram.puml — PlantUML source for the deployment diagram
- diagrams/sequence_diagram.puml   — PlantUML source for the sequence diagram
- diagrams/architectural_diagrams.puml (existing combined file left for reference)
- .github/workflows/render-diagrams.yml — GitHub Actions workflow updated to render all .puml files

Rendered outputs (after CI runs):

- diagrams/component_diagram.png
- diagrams/deployment_diagram.png
- diagrams/sequence_diagram.png

Workflow behavior:
1. The workflow triggers on pushes to branch `add/architectural-diagrams`.
2. It installs PlantUML and Graphviz, renders every `.puml` file under `diagrams/` into PNGs, and commits the generated PNG(s) back to the branch.

Next steps I can take for you:
- Open a pull request from `add/architectural-diagrams` into the default branch (I cannot create PRs via this assistant; I will provide the URL and suggested PR text for you to use). 
- Adjust styling (colors, DPI, fonts) and re-render.
- Immediately commit rendered PNGs if you prefer not to wait for CI (I can generate locally and push them).

Suggested PR title and body are provided below for convenience when you open the PR.

Suggested PR title:
Add architectural diagrams (component, deployment, sequence)

Suggested PR body:
This PR adds PlantUML sources for three architecture diagrams (component, deployment, and sequence) and a GitHub Actions workflow which renders the .puml files to PNGs and commits them back to the branch. The rendered PNGs will be available in diagrams/ after the workflow runs.

Please review the PlantUML sources (diagrams/*.puml) and the workflow. I can update styling or split diagrams differently if desired.
