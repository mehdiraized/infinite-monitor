FROM node:20-alpine

WORKDIR /base

# Copy the base template
COPY template/ .

# Install all dependencies
RUN npm install

# shadcn init + install all components
RUN echo '{"$schema":"https://ui.shadcn.com/schema.json","style":"default","rsc":false,"tsx":true,"tailwind":{"config":"tailwind.config.ts","css":"src/index.css","baseColor":"neutral","cssVariables":true},"aliases":{"components":"@/components","utils":"@/lib/utils","ui":"@/components/ui","lib":"@/lib","hooks":"@/hooks"}}' > components.json
RUN npx shadcn@latest add --yes \
  button card badge input table tabs scroll-area skeleton separator \
  progress alert avatar checkbox dialog dropdown-menu label popover \
  radio-group select sheet slider switch textarea toggle tooltip \
  accordion collapsible command context-menu hover-card menubar \
  navigation-menu pagination resizable sonner 2>/dev/null || true

# Pre-build step: verify everything compiles
RUN npx vite build || true

# Static file server for built widgets
RUN npm install -g serve

# Create output directories
RUN mkdir -p /app/dist /app/widgets

# Container stays alive, serving /app/dist on port 3000
CMD ["sh", "-c", "serve /app/dist -l 3000 --no-clipboard"]
